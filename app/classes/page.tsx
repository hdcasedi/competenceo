import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

async function createClass(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return
  const teacherId = session.user.id

  const name = String(formData.get("name") || "").trim()
  const description = String(formData.get("description") || "").trim() || null
  if (!name) return

  await prisma.classroom.create({
    data: { name, description, teacherId },
  })
  revalidatePath("/classes")
}

async function updateClass(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return
  const teacherId = session.user.id
  const id = String(formData.get("id") || "")
  const name = String(formData.get("name") || "").trim()
  const description = String(formData.get("description") || "").trim() || null
  if (!id || !name) return

  const cls = await prisma.classroom.findUnique({ where: { id } })
  if (!cls || cls.teacherId !== teacherId) return

  await prisma.classroom.update({
    where: { id },
    data: { name, description },
  })
  revalidatePath("/classes")
}

async function deleteClass(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return
  const teacherId = session.user.id
  const id = String(formData.get("id") || "")
  if (!id) return

  const cls = await prisma.classroom.findUnique({ where: { id } })
  if (!cls || cls.teacherId !== teacherId) return

  await prisma.classroom.delete({ where: { id } })
  revalidatePath("/classes")
}

export default async function ClassesPage() {
  const session = await auth()

  if (!session?.user) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Classes</h1>
        <p className="text-muted-foreground">Veuillez vous connecter.</p>
      </main>
    )
  }

  let classes: Awaited<ReturnType<typeof prisma.classroom.findMany>> = []
  let dbError: string | null = null
  try {
    classes = await prisma.classroom.findMany({
      where: { teacherId: session.user.id },
      orderBy: { createdAt: "desc" },
    })
  } catch (e) {
    dbError = "La base de données n’est pas accessible. Configurez .env (DATABASE_URL) puis relancez le serveur."
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Vos classes</h1>
        <p className="text-muted-foreground">Créez et gérez vos classes.</p>
      </div>

      <section className="grid gap-2 max-w-xl">
        <h2 className="text-lg font-medium">Créer une classe</h2>
        <form action={createClass} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" placeholder="ex: 3ème B" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Optionnel" />
          </div>
          <Button type="submit" className="w-fit">Créer</Button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Liste</h2>
        {dbError ? (
          <p className="text-amber-700">{dbError}</p>
        ) : classes.length === 0 ? (
          <p className="text-muted-foreground">Aucune classe pour le moment.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {classes.map((c) => (
              <li key={c.id} className="p-3 space-y-2">
                <form action={updateClass} className="grid gap-2 sm:grid-cols-2">
                  <input type="hidden" name="id" value={c.id} />
                  <div className="grid gap-1.5">
                    <Label htmlFor={`name-${c.id}`}>Nom</Label>
                    <Input id={`name-${c.id}`} name="name" defaultValue={c.name} required />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`desc-${c.id}`}>Description</Label>
                    <Input id={`desc-${c.id}`} name="description" defaultValue={c.description ?? ""} />
                  </div>
                  <div className="sm:col-span-2 flex gap-2">
                    <Button type="submit">Mettre à jour</Button>
                    <Button formAction={deleteClass} variant="outline">Supprimer</Button>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

