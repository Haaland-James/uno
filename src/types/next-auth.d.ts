import { DefaultSession } from "next-auth";
import type { Role, AgentStatus, AgentEmployment } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      agentStatus: AgentStatus;
      agentEmployment: AgentEmployment | null;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    role: Role;
    agentStatus?: AgentStatus;
    agentEmployment?: AgentEmployment | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    agentStatus: AgentStatus;
    agentEmployment: AgentEmployment | null;
    deactivatedAt?: string | null;
    /** ms epoch of the last database re-check of role / agent fields / active flag. */
    checkedAt?: number;
    /** Set when the user no longer exists; middleware treats the token as signed-out. */
    revoked?: boolean;
  }
}
