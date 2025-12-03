import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

async function updateProfile(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return

  const firstName = String(formData.get("firstName") || "").trim() || null
  const lastName = String(formData.get("lastName") || "").trim() || null
  const name = [firstName || "", lastName || ""].join(" ").trim() || null
  const image = String(formData.get("image") || "").trim() || null

  await prisma.user.update({
    where: { id: session.user.id },
    data: { firstName, lastName, name, image },
  })
  revalidatePath("/teachers/me")
}

export default async function TeacherMePage() {
  const session = await auth()
  if (!session?.user) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Mon profil enseignant</h1>
        <p className="text-muted-foreground">Veuillez vous connecter.</p>
      </main>
    )
  }
  const me = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!me) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Mon profil enseignant</h1>
        <p className="text-muted-foreground">Utilisateur introuvable.</p>
      </main>
    )
  }
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Mon profil enseignant</h1>
      <form action={updateProfile} className="grid gap-3 max-w-xl">
        <div className="grid gap-1.5">
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" name="firstName" defaultValue={me.firstName ?? ""} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" name="lastName" defaultValue={me.lastName ?? ""} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="image">Image (URL)</Label>
          <Input id="image" name="image" defaultValue={me.image ?? ""} />
        </div>
        <Button type="submit" className="w-fit">Enregistrer</Button>
      </form>
    </main>
  )
}


