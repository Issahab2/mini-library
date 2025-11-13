// pages/api/auth/[...nextauth].ts
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET } from "@/lib/server/constants/env";
import { prisma } from "@/lib/server/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      // If signing in with OAuth (Google)
      if (account?.provider === "google" && user.email) {
        // Check if a user with this email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        });

        if (existingUser) {
          // Check if Google account is already linked
          const hasGoogleAccount = existingUser.accounts.some(
            (acc) => acc.provider === "google" && acc.providerAccountId === account.providerAccountId
          );

          if (!hasGoogleAccount) {
            // Link the Google account to the existing user
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });
          }

          // Check if user has any roles, if not assign Customer role
          const userWithRoles = await prisma.user.findUnique({
            where: { id: existingUser.id },
            include: { roles: true },
          });

          if (!userWithRoles || userWithRoles.roles.length === 0) {
            // User has no roles, assign Customer role
            const customerRole = await prisma.role.findUnique({
              where: { name: "Customer" },
            });

            if (customerRole) {
              await prisma.rolesOnUsers.create({
                data: {
                  userId: existingUser.id,
                  roleId: customerRole.id,
                },
              });
            }
          }

          // Update user info if needed (name, image from Google)
          // Automatically verify email for OAuth sign-ins
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: user.name || existingUser.name,
              image: user.image || existingUser.image,
              emailVerified: new Date(), // Always verify email for OAuth sign-ins
            },
          });

          // Return the existing user ID so NextAuth uses the existing account
          user.id = existingUser.id;
        } else {
          // For new users, the adapter will create them
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;

        // Fetch isStaff flag and permissions from database for credentials provider
        if (!account) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              roles: {
                include: {
                  role: {
                    include: {
                      permissions: {
                        include: {
                          permission: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });
          token.isStaff = dbUser?.isStaff || false;
          token.emailVerified = dbUser?.emailVerified || null;

          // Load permissions for credentials users
          const permissions = new Set<string>();
          dbUser?.roles.forEach((roleOnUser) => {
            roleOnUser.role.permissions.forEach((permOnRole) => {
              permissions.add(permOnRole.permission.action);
            });
          });
          token.permissions = Array.from(permissions);
          token.roles = dbUser?.roles.map((r) => r.role.name) || [];
        }
      }

      // For OAuth providers, fetch user roles on first sign in
      if (account && user) {
        // Automatically verify email for OAuth sign-ins (new or existing users)
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: new Date(),
          },
        });

        // Check if user has any roles, if not assign Customer role (for new OAuth users)
        const userWithRoles = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        // If user has no roles, assign Customer role
        if (!userWithRoles || userWithRoles.roles.length === 0) {
          const customerRole = await prisma.role.findUnique({
            where: { name: "Customer" },
          });

          if (customerRole) {
            await prisma.rolesOnUsers.create({
              data: {
                userId: user.id,
                roleId: customerRole.id,
              },
            });

            // Re-fetch user with roles after assignment
            const updatedUser = await prisma.user.findUnique({
              where: { id: user.id },
              include: {
                roles: {
                  include: {
                    role: {
                      include: {
                        permissions: {
                          include: {
                            permission: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            });

            const permissions = new Set<string>();
            updatedUser?.roles.forEach((roleOnUser) => {
              roleOnUser.role.permissions.forEach((permOnRole) => {
                permissions.add(permOnRole.permission.action);
              });
            });

            token.permissions = Array.from(permissions);
            token.roles = updatedUser?.roles.map((r) => r.role.name) || [];
            token.isStaff = updatedUser?.isStaff || false;
            token.emailVerified = updatedUser?.emailVerified || null;
          } else {
            // Customer role not found, set empty permissions
            token.permissions = [];
            token.roles = [];
            token.isStaff = false;
          }
        } else {
          // User already has roles, load them
          const permissions = new Set<string>();
          userWithRoles.roles.forEach((roleOnUser) => {
            roleOnUser.role.permissions.forEach((permOnRole) => {
              permissions.add(permOnRole.permission.action);
            });
          });

          token.permissions = Array.from(permissions);
          token.roles = userWithRoles.roles.map((r) => r.role.name) || [];
          token.isStaff = userWithRoles.isStaff || false;
          token.emailVerified = userWithRoles.emailVerified || null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Ensure we have a user ID from the token
      if (!token.id) {
        return session;
      }

      const userId = token.id as string;

      // Get the user's roles and isStaff flag from your custom tables
      const userWithRoles = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          isStaff: true,
          emailVerified: true,
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Flatten all permissions into a simple array
      const permissions = new Set<string>();
      userWithRoles?.roles.forEach((roleOnUser) => {
        roleOnUser.role.permissions.forEach((permOnRole) => {
          permissions.add(permOnRole.permission.action);
        });
      });

      // Add the permissions to the session object
      if (session.user) {
        session.user.permissions = Array.from(permissions);
        session.user.roles = userWithRoles?.roles.map((r) => r.role.name) || [];
        session.user.id = userId;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        // Use isStaff from token if available, otherwise from database
        session.user.isStaff = (token.isStaff as boolean | undefined) ?? userWithRoles?.isStaff ?? false;
        session.user.emailVerified =
          (token.emailVerified as Date | null | undefined) ?? userWithRoles?.emailVerified ?? null;
      }

      return session;
    },
  },
};
export default NextAuth(authOptions);
