const SUBJECT_OPTIONS = [
  { value: "MATHEMATIQUES", label: "Mathématiques" },
  { value: "FRANCAIS", label: "Français" },
  { value: "HISTOIRE_GEOGRAPHIE", label: "Histoire-Géographie" },
  { value: "SCIENCES", label: "Sciences" },
  { value: "PHYSIQUE_CHIMIE", label: "Physique-Chimie" },
  { value: "SVT", label: "SVT" },
  { value: "TECHNOLOGIE", label: "Technologie" },
  { value: "ANGLAIS", label: "Anglais" },
  { value: "ESPAGNOL", label: "Espagnol" },
  { value: "ALLEMAND", label: "Allemand" },
  { value: "PHILOSOPHIE", label: "Philosophie" },
  { value: "ECONOMIE", label: "Économie" },
  { value: "SES", label: "SES" },
  { value: "INFORMATIQUE", label: "Informatique" },
  { value: "ARTS_PLASTIQUES", label: "Arts plastiques" },
  { value: "MUSIQUE", label: "Musique" },
  { value: "EPS", label: "EPS" },
  { value: "EMC", label: "EMC" },
  { value: "LATIN", label: "Latin" },
  { value: "GREC", label: "Grec" },
  { value: "AUTRE", label: "Autre" },
]
import { auth, signIn } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import bcrypt from "bcryptjs"


async function completeSignup(formData: FormData) {
  "use server"
  const session = await auth()
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const firstName = String(formData.get("firstName") || "").trim() || null
  const lastName = String(formData.get("lastName") || "").trim() || null
  const name = [firstName || "", lastName || ""].join(" ").trim() || null
  const password = String(formData.get("password") || "")
  const subject = String(formData.get("subject") || "")
  const subjectOther = String(formData.get("subjectOther") || "").trim() || null
  if (!email || !password) return

  const existing = await prisma.user.findUnique({ where: { email } })
  const passwordHash = await bcrypt.hash(password, 10)
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        role: "TEACHER" as any,
        firstName,
        lastName,
        name,
        passwordHash
      },
    })
  } else {
    await prisma.user.create({
      data: {
        email,
        role: "TEACHER" as any,
        firstName,
        lastName,
        name,
        passwordHash
      },
    })
  }
  revalidatePath("/teachers/me")
  await signIn("credentials", { email, password, redirectTo: "/teachers/me" })
}

export default async function SignupPage() {
  const session = await auth()
  return (
    <main className="p-6 flex items-center justify-center">
      <form action={completeSignup} className="grid gap-3 w-full max-w-md">
        <h1 className="text-2xl font-semibold">Inscription enseignant</h1>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" name="firstName" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" name="lastName" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="subject">Matière enseignée</Label>
          <select id="subject" name="subject" className="h-9 rounded-md border px-3">
            <option value="">Sélectionner…</option>
            {SUBJECT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="subjectOther">Si “Autre”, préciser</Label>
          <Input id="subjectOther" name="subjectOther" placeholder="ex: Théâtre" />
        </div>
        <Button type="submit" className="w-fit">Créer mon compte</Button>
      </form>
    </main>
  )
}


