import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      permissions: string[];
      roles: string[];
      isStaff: boolean;
      emailVerified?: Date | null;
    };
  }

  interface JWT {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    permissions: string[];
    roles: string[];
    isStaff: boolean;
    emailVerified?: Date | null;
  }
}
