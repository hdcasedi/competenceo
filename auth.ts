import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
// Optionnel: PrismaAdapter retiré pour isoler l'erreur de configuration.

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          if (!credentials?.email || !credentials?.password) return null

          const rawEmail = String(credentials.email)
          const email = rawEmail.trim().toLowerCase()
          const password = String(credentials.password)

          const { prisma } = await import("@/lib/prisma")

          let user = await prisma.user.findUnique({ where: { email } })

          // Dev fallback: si l'utilisateur de seed n'existe pas encore, on le crée à la volée
          if (!user && email === "prof@test.com" && password === "password") {
            const passwordHash = await bcrypt.hash(password, 10)
            user = await prisma.user.create({
              data: {
                email,
                role: "TEACHER" as any,
                passwordHash,
                firstName: "Marie",
                lastName: "Curie",
                name: "Marie Curie",
              },
            })
          }

          if (!user?.passwordHash) return null

          const isValid = await bcrypt.compare(password, user.passwordHash)
          if (!isValid) return null

          return {
            id: user.id,
            email: user.email ?? undefined,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
            // @ts-expect-error include role on token/session via callbacks
            role: user.role,
          }
        } catch (e) {
          console.error("Credentials authorize error:", e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        // @ts-expect-error augment token with role
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) || session.user.id
        // @ts-expect-error role on session
        session.user.role = (token as any).role
      }
      return session
    },
  },
  trustHost: true,
  // Use AUTH_SECRET for NextAuth v5
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev_secret_change_me",
})

