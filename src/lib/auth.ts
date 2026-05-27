import type { NextAuthOptions } from "next-auth";
import type { Role, AgentStatus, AgentEmployment } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { verifyOtp } from "./otp";
import { normalizePhone } from "./phone";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "otp",
      name: "Email OTP",
      credentials: {
        email: { type: "text" },
        code: { type: "text" },
        purpose: { type: "text" }, // SIGNUP | LOGIN
        name: { type: "text" },
        phone: { type: "text" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.code || !creds?.purpose) return null;
        const email = creds.email.toLowerCase().trim();
        const purpose = creds.purpose as "SIGNUP" | "LOGIN";

        const result = await verifyOtp({ email, purpose, code: creds.code });
        if (!result.ok) return null;

        let user = await db.user.findUnique({ where: { email } });

        // Create user on first verified signup
        if (!user && purpose === "SIGNUP") {
          if (!creds.name) return null;
          user = await db.user.create({
            data: {
              email,
              emailVerified: true,
              name: creds.name.trim(),
              phone: creds.phone ? normalizePhone(creds.phone) : null,
              phoneVerified: false,
              role: "RENTER",
            },
          });
        }

        if (!user) return null;

        // Mark email verified on any successful OTP
        if (!user.emailVerified) {
          user = await db.user.update({
            where: { id: user.id },
            data: { emailVerified: true },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          agentStatus: user.agentStatus,
          agentEmployment: user.agentEmployment,
          image: user.photo ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as {
          id: string;
          role: Role;
          agentStatus?: AgentStatus;
          agentEmployment?: AgentEmployment | null;
        };
        token.id = u.id;
        token.role = u.role;
        token.agentStatus = u.agentStatus ?? "NONE";
        token.agentEmployment = u.agentEmployment ?? null;
      }
      // Refresh agent fields from DB when the session is updated explicitly
      // (e.g. after an admin verifies the user as an agent). Without this
      // refresh the user would have to sign out + back in to gain access.
      if (trigger === "update" && token.id) {
        const fresh = await db.user.findUnique({
          where: { id: token.id },
          select: { role: true, agentStatus: true, agentEmployment: true },
        });
        if (fresh) {
          token.role = fresh.role;
          token.agentStatus = fresh.agentStatus;
          token.agentEmployment = fresh.agentEmployment;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.agentStatus = token.agentStatus;
        session.user.agentEmployment = token.agentEmployment;
      }
      return session;
    },
  },
};
