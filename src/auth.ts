import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import type { OrgRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      organizationId: string;
      organizationName: string;
      role: OrgRole;
    };
  }

  interface User {
    organizationId: string;
    organizationName: string;
    role: OrgRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    name?: string | null;
    email?: string | null;
    organizationId?: string;
    organizationName?: string;
    role?: OrgRole;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Required on Vercel — MissingSecret → 500 on /api/auth/session
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
              memberships: {
                include: { organization: true },
                take: 1,
                orderBy: { createdAt: "asc" },
              },
            },
          });

          if (!user) return null;
          const valid = await compare(password, user.passwordHash);
          if (!valid) return null;
          // Unverified accounts are blocked in loginAction; belt-and-suspenders here.
          if (!user.emailVerified) return null;

          const membership = user.memberships[0];
          if (!membership) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            organizationId: membership.organizationId,
            organizationName: membership.organization.name,
            role: membership.role,
          };
        } catch (err) {
          console.error("[auth] authorize failed (check DATABASE_URL / schema):", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.name = user.name;
        token.email = user.email;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.role = user.role;
      }

      // Always re-load membership + display name so updates apply without re-login.
      // Do not put avatar bytes in the JWT (data URLs blow the cookie size).
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              name: true,
              email: true,
              memberships: {
                include: { organization: true },
                orderBy: { createdAt: "asc" },
                take: 1,
              },
            },
          });
          const membership = dbUser?.memberships[0];
          if (dbUser && membership) {
            token.name = dbUser.name;
            token.email = dbUser.email;
            token.organizationId = membership.organizationId;
            token.organizationName = membership.organization.name;
            token.role = membership.role;
          } else {
            // Removed from every org — drop privileged claims
            delete token.organizationId;
            delete token.organizationName;
            delete token.role;
          }
        } catch (err) {
          // Don't 500 /api/auth/session if Neon is briefly unreachable
          console.error("[auth] jwt membership reload failed:", err);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token.id || !token.organizationId || !token.role) {
        // Membership gone — expire session so auth()/middleware treat user as logged out
        session.expires = new Date(0).toISOString() as typeof session.expires;
        return session;
      }
      session.user.id = token.id as string;
      session.user.name = (token.name as string | null | undefined) ?? session.user.name;
      session.user.email = (token.email as string | null | undefined) ?? session.user.email;
      session.user.organizationId = token.organizationId as string;
      session.user.organizationName = (token.organizationName as string) ?? "";
      session.user.role = token.role as OrgRole;
      return session;
    },
  },
});
