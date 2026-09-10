import type { DefaultSession } from "next-auth";
import type { Role, UserStatus } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    status: UserStatus;
    isVerified: boolean;
    firstName: string;
    lastName: string;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
      isVerified: boolean;
      firstName: string;
      lastName: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    status: UserStatus;
    isVerified: boolean;
    firstName: string;
    lastName: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    status: UserStatus;
    isVerified: boolean;
    firstName: string;
    lastName: string;
  }
}
