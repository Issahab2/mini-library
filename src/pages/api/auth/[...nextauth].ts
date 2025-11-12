// pages/api/auth/[...nextauth].ts
import { prisma } from "@/lib/server/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  // Use adapter for OAuth providers, but JWT for credentials
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
    // Add GitHubProvider here...
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;

        // Fetch isStaff flag from database for credentials provider
        if (!account) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { isStaff: true },
          });
          token.isStaff = dbUser?.isStaff || false;
        }
      }

      // For OAuth providers, fetch user roles on first sign in
      if (account && user) {
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

        const permissions = new Set<string>();
        userWithRoles?.roles.forEach((roleOnUser) => {
          roleOnUser.role.permissions.forEach((permOnRole) => {
            permissions.add(permOnRole.permission.action);
          });
        });

        token.permissions = Array.from(permissions);
        token.roles = userWithRoles?.roles.map((r) => r.role.name) || [];
        token.isStaff = userWithRoles?.isStaff || false;
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
      }

      return session;
    },
  },
};
export default NextAuth(authOptions);
