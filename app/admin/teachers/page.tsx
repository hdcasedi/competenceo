import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import bcrypt from "bcryptjs"

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

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Enseignants existants</h2>
        {teachers.length === 0 ? (
          <p className="text-muted-foreground">Aucun enseignant pour le moment.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {teachers.map((t) => (
              <li key={t.id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.name ?? `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() || t.email}</div>
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
                {(u.name ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email) + ` — ${u.role}`}
              </option>
            ))}
          </select>
          <Button type="submit">Promouvoir</Button>
        </form>
      </section>
    </main>
  )
}


