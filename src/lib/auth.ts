import type { NextAuthOptions } from "next-auth";
import type { Role } from "@prisma/client";
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
          image: user.photo ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
