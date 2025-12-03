import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

async function createDomain(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return
  const createdById = session.user.id
  const title = String(formData.get("title") || "").trim()
  const description = String(formData.get("description") || "").trim() || null
  if (!title) return
  await prisma.competencyDomain.create({
    data: { title, description, createdById },
  })
  revalidatePath("/domains")
}

async function updateDomain(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return
  const id = String(formData.get("id") || "")
  const title = String(formData.get("title") || "").trim()
  const description = String(formData.get("description") || "").trim() || null
  if (!id || !title) return
  const domain = await prisma.competencyDomain.findUnique({ where: { id } })
  if (!domain || domain.createdById !== session.user.id) return
  await prisma.competencyDomain.update({
    where: { id },
    data: { title, description },
  })
  revalidatePath("/domains")
}

async function deleteDomain(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return
  const id = String(formData.get("id") || "")
  if (!id) return
  const domain = await prisma.competencyDomain.findUnique({ where: { id } })
  if (!domain || domain.createdById !== session.user.id) return
  await prisma.competencyDomain.delete({ where: { id } })
  revalidatePath("/domains")
}

export default async function DomainsPage() {
  const session = await auth()

  if (!session?.user) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Domaines</h1>
        <p className="text-muted-foreground">Veuillez vous connecter.</p>
      </main>
    )
  }

  let domains: Awaited<ReturnType<typeof prisma.competencyDomain.findMany>> = []
  let dbError: string | null = null
  try {
    domains = await prisma.competencyDomain.findMany({
      where: { createdById: session.user.id, isArchived: false },
      orderBy: { createdAt: "desc" },
    })
  } catch {
    dbError = "La base de données n’est pas accessible. Configurez .env (DATABASE_URL) puis relancez le serveur."
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Domaines</h1>
        <p className="text-muted-foreground">Créez vos domaines de compétences.</p>
      </div>

      <section className="grid gap-2 max-w-xl">
        <h2 className="text-lg font-medium">Créer un domaine</h2>
        <form action={createDomain} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" placeholder="ex: Communication" required />
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
        ) : domains.length === 0 ? (
          <p className="text-muted-foreground">Aucun domaine pour le moment.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {domains.map((d) => (
              <li key={d.id} className="p-3 space-y-2">
                <form action={updateDomain} className="grid gap-2 sm:grid-cols-2">
                  <input type="hidden" name="id" value={d.id} />
                  <div className="grid gap-1.5">
                    <Label htmlFor={`title-${d.id}`}>Titre</Label>
                    <Input id={`title-${d.id}`} name="title" defaultValue={d.title} required />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`description-${d.id}`}>Description</Label>
                    <Input id={`description-${d.id}`} name="description" defaultValue={d.description ?? ""} />
                  </div>
                  <div className="sm:col-span-2 flex gap-2">
                    <Button type="submit">Mettre à jour</Button>
                    <Button formAction={deleteDomain} variant="outline">Supprimer</Button>
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


