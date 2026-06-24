import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `__Secure-authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true, // requis en HTTPS
      },
    },
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role?: string }).role;
        token.kycLevel = (user as { kycLevel?: string }).kycLevel;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.kycLevel = token.kycLevel as string;
      }
      return session;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        console.log("🔐 Tentative de connexion :", email);

        if (!email || !password) {
          console.log("❌ Email ou mot de passe manquant");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          console.log("❌ Utilisateur introuvable :", email);
          return null;
        }

        if (!user.passwordHash) {
          console.log("❌ Aucun hash de mot de passe trouvé pour l'utilisateur");
          return null;
        }

        console.log("🔑 Hash stocké :", user.passwordHash.substring(0, 20) + "...");

        const isValid = await bcrypt.compare(password, user.passwordHash);

        console.log("🔍 Résultat comparaison :", isValid);

        if (!isValid) {
          console.log("❌ Mot de passe incorrect");
          return null;
        }

        console.log("✅ Connexion réussie pour", user.email);

        return {
          id: user.id,
          email: user.email ?? "",
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          kycLevel: user.kycLevel,
        };
      },
    }),
  ],
});