import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendMail } from "@/lib/email"

async function createTeacher(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return
  // Autoriser ADMIN uniquement
  const me = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!me || me.role !== "ADMIN") return

  const email = String(formData.get("email") || "").trim().toLowerCase()
  const firstName = String(formData.get("firstName") || "").trim() || null
  const lastName = String(formData.get("lastName") || "").trim() || null
  const name = [firstName || "", lastName || ""].join(" ").trim() || null
  const rawPassword = String(formData.get("password") || "").trim() || "password"
  if (!email) return
  const passwordHash = await bcrypt.hash(rawPassword, 10)

  await prisma.user.upsert({
    where: { email },
    update: {
      role: "TEACHER" as any,
      firstName,
      lastName,
      name,
      passwordHash,
    },
    create: {
      email,
      role: "TEACHER" as any,
      firstName,
      lastName,
      name,
      passwordHash,
    },
  })
  revalidatePath("/admin/teachers")
}

async function promoteToTeacher(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return
  const me = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!me || me.role !== "ADMIN") return
  const id = String(formData.get("id") || "")
  if (!id) return
  await prisma.user.update({
    where: { id },
    data: { role: "TEACHER" as any },
  })
  revalidatePath("/admin/teachers")
}

async function deleteTeacher(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return
  const me = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!me || me.role !== "ADMIN") return
  const id = String(formData.get("id") || "")
  if (!id) return
  // Ne pas permettre de se supprimer soi-même
  if (id === me.id) return
  await prisma.user.delete({ where: { id } })
  revalidatePath("/admin/teachers")
}

async function inviteTeacher(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return
  const me = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!me || me.role !== "ADMIN") return

  const email = String(formData.get("email") || "").trim().toLowerCase()
  if (!email) return

  const token = crypto.randomBytes(16).toString("hex").slice(0, 8).toUpperCase()
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // Stocke l'invitation dans VerificationToken (réutilisation du modèle existant)
  await prisma.verificationToken.upsert({
    where: {
      // couple unique (identifier, token)
      token: token,
    },
    update: {
      identifier: `invite:${email}`,
      expires,
    },
    create: {
      identifier: `invite:${email}`,
      token,
      expires,
    },
  })

  const signupUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/signup`
  const html = `
    <p>Bonjour,</p>
    <p>Vous avez été invité à créer un compte enseignant sur <b>Competenceo</b>.</p>
    <p>Votre code d'invitation est: <b>${token}</b></p>
    <p>Rendez-vous sur <a href="${signupUrl}">${signupUrl}</a> et saisissez ce code avec votre email pour finaliser l'inscription.</p>
    <p>Ce code expire dans 7 jours.</p>
  `
  try {
    await sendMail(email, "Invitation Competenceo — Code d'inscription", html)
  } catch (e) {
    console.error("[SMTP] Envoi invitation échoué:", e)
  }

  revalidatePath("/admin/teachers")
}

async function deleteTestAccounts() {
  "use server"
  const session = await auth()
  if (!session?.user) return
  const me = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!me || me.role !== "ADMIN") return

  // Supprime les comptes de test en conservant l'admin
  await prisma.user.deleteMany({
    where: {
      email: { endsWith: "@test.com" },
      NOT: { email: "admin@test" },
    },
  })
  // Aussi supprimer prof@test si présent (sans .com, selon seed)
  await prisma.user.deleteMany({
    where: { email: "prof@test.com" },
  })

  revalidatePath("/admin/teachers")
}

export default async function AdminTeachersPage() {
  const session = await auth()
  if (!session?.user) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Administration — Enseignants</h1>
        <p className="text-muted-foreground">Veuillez vous connecter.</p>
      </main>
    )
  }

  const me = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!me || me.role !== "ADMIN") {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Administration — Enseignants</h1>
        <p className="text-muted-foreground">Accès réservé aux administrateurs.</p>
      </main>
    )
  }

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" as any },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  })
  const users = await prisma.user.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 50,
  })

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administration — Enseignants</h1>
        <p className="text-muted-foreground">Créer et gérer les comptes enseignants.</p>
      </div>

      <section className="grid gap-2 max-w-2xl">
        <h2 className="text-lg font-medium">Créer un enseignant</h2>
        <form action={createTeacher} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" name="firstName" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" name="lastName" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Mot de passe initial (optionnel)</Label>
            <Input id="password" name="password" type="password" placeholder="password par défaut si vide" />
          </div>
          <Button type="submit" className="w-fit">Créer</Button>
        </form>
      </section>

      <section className="grid gap-2 max-w-xl">
        <h2 className="text-lg font-medium">Inviter un enseignant (inscription par code)</h2>
        <form action={inviteTeacher} className="flex gap-2">
          <Input name="email" type="email" placeholder="enseignant@exemple.com" required />
          <Button type="submit">Envoyer l’invitation</Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Un code est généré (valide 7 jours) et journalisé côté serveur. Configurez un SMTP pour l’email.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Enseignants existants</h2>
        {teachers.length === 0 ? (
          <p className="text-muted-foreground">Aucun enseignant pour le moment.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {teachers.map((t) => (
              <li key={t.id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{(t.name ?? `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim()) || t.email}</div>
                  <div className="text-xs text-muted-foreground">{t.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="secondary">
                    <Link href={`/teachers/${t.id}`}>Voir</Link>
                  </Button>
                  <Button formAction={deleteTeacher} variant="outline" name="id" value={t.id}>Supprimer</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Promouvoir un utilisateur en enseignant</h2>
        <form action={promoteToTeacher} className="flex gap-2">
          <select name="id" className="h-9 rounded-md border px-3" required>
            <option value="">Sélectionner un utilisateur…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {(((u.name ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()) || u.email) + ` — ${u.role}`)}
              </option>
            ))}
          </select>
          <Button type="submit">Promouvoir</Button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Nettoyer les comptes de test</h2>
        <form action={deleteTestAccounts}>
          <Button type="submit" variant="outline">Supprimer comptes @test.com et prof@test.com</Button>
        </form>
      </section>
    </main>
  )
}


