import { RoleType } from "@/lib/types";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: RoleType;
  }

  interface Session {
    user: {
      id?: string;
      role?: RoleType;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: RoleType;
  }
}
