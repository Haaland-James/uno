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
  }
}
