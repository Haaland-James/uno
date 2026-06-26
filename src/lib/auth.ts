import type { NextAuthOptions } from "next-auth";
import type { Role, AgentStatus, AgentEmployment } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { verifyOtp } from "./otp";
import { normalizePhone } from "./phone";

const googleEnabled =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

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

        if (user?.deactivatedAt) return null;

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
    CredentialsProvider({
      id: "password",
      name: "Email & Password",
      credentials: {
        email: { type: "text" },
        password: { type: "text" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const email = creds.email.toLowerCase().trim();

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        if (user.deactivatedAt) return null;

        const valid = await bcrypt.compare(creds.password, user.passwordHash);
        if (!valid) return null;

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
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const dbUser = await db.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser?.deactivatedAt) return false;

        let targetUser = dbUser;

        if (!targetUser) {
          targetUser = await db.user.create({
            data: {
              email: user.email!,
              emailVerified: true,
              name: user.name || user.email!.split("@")[0],
              phone: null,
              phoneVerified: false,
              role: "RENTER",
            },
          });
        }

        await db.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: account.providerAccountId,
            },
          },
          update: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
          },
          create: {
            userId: targetUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
          },
        });

        user.id = targetUser.id;
        (user as Record<string, unknown>).role = targetUser.role;
        (user as Record<string, unknown>).agentStatus = targetUser.agentStatus;
        (user as Record<string, unknown>).agentEmployment = targetUser.agentEmployment;
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
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
      // For Google OAuth, fetch DB user data into the token
      if (account?.provider === "google" && user?.email) {
        const dbUser = await db.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true, agentStatus: true, agentEmployment: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.agentStatus = dbUser.agentStatus;
          token.agentEmployment = dbUser.agentEmployment;
        }
      }
      if (trigger === "update" && token.id) {
        const fresh = await db.user.findUnique({
          where: { id: token.id },
          select: {
            role: true,
            agentStatus: true,
            agentEmployment: true,
            deactivatedAt: true,
          },
        });
        if (fresh) {
          token.role = fresh.role;
          token.agentStatus = fresh.agentStatus;
          token.agentEmployment = fresh.agentEmployment;
          token.deactivatedAt = fresh.deactivatedAt?.toISOString() ?? null;
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
