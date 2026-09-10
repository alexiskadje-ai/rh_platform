import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { TokenType, type Role, type UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { sha256 } from "@/lib/crypto";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        ticket: { type: "text" },
      },
      authorize: async (credentials) => {
        const ticket = credentials?.ticket;
        if (typeof ticket !== "string" || ticket.length === 0) {
          return null;
        }

        const record = await db.verificationToken.findUnique({
          where: { tokenHash: sha256(ticket) },
          include: { user: true },
        });

        if (
          !record ||
          record.type !== TokenType.LOGIN ||
          record.expiresAt < new Date()
        ) {
          return null;
        }

        await db.verificationToken.delete({ where: { id: record.id } });

        const { user } = record;
        if (user.status === "SUSPENDED") {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          status: user.status,
          isVerified: user.isVerified,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.role = user.role;
        token.status = user.status;
        token.isVerified = user.isVerified;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.role = token.role as Role;
      session.user.status = token.status as UserStatus;
      session.user.isVerified = Boolean(token.isVerified);
      session.user.firstName = String(token.firstName ?? "");
      session.user.lastName = String(token.lastName ?? "");
      return session;
    },
  },
});
