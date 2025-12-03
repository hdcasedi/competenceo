import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

async function createCompetency(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return
  const domainId = String(formData.get("domainId") || "")
  const title = String(formData.get("title") || "").trim()
  const code = (String(formData.get("code") || "").trim() || null) as string | null
  const description = (String(formData.get("description") || "").trim() || null) as string | null
  if (!domainId || !title) return
  await prisma.competency.create({
    data: { domainId, title, code, description },
  })
  revalidatePath("/competencies")
}

async function updateCompetency(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return
  const id = String(formData.get("id") || "")
  const title = String(formData.get("title") || "").trim()
  const code = (String(formData.get("code") || "").trim() || null) as string | null
  const description = (String(formData.get("description") || "").trim() || null) as string | null
  const domainId = String(formData.get("domainId") || "")
  if (!id || !title || !domainId) return
  const comp = await prisma.competency.findUnique({
    where: { id },
    include: { domain: true },
  })
  if (!comp || comp.domain.createdById !== session.user.id) return
  await prisma.competency.update({
    where: { id },
    data: { title, code, description, domainId },
  })
  revalidatePath("/competencies")
}

async function deleteCompetency(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return
  const id = String(formData.get("id") || "")
  if (!id) return
  const comp = await prisma.competency.findUnique({
    where: { id },
    include: { domain: true },
  })
  if (!comp || comp.domain.createdById !== session.user.id) return
  await prisma.competency.delete({ where: { id } })
  revalidatePath("/competencies")
}

export default async function CompetenciesPage() {
  const session = await auth()

  if (!session?.user) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Compétences</h1>
        <p className="text-muted-foreground">Veuillez vous connecter.</p>
      </main>
    )
  }

  let domains: Awaited<ReturnType<typeof prisma.competencyDomain.findMany>> = []
  let competencies: Awaited<ReturnType<typeof prisma.competency.findMany>> = []
  let dbError: string | null = null
  try {
    ;[domains, competencies] = await Promise.all([
      prisma.competencyDomain.findMany({
        where: { createdById: session.user.id, isArchived: false },
        orderBy: { title: "asc" },
      }),
      prisma.competency.findMany({
        where: { domain: { createdById: session.user.id } },
        include: { domain: true },
        orderBy: [{ domain: { title: "asc" } }, { title: "asc" }],
      }),
    ])
  } catch {
    dbError = "La base de données n’est pas accessible. Configurez .env (DATABASE_URL) puis relancez le serveur."
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Compétences</h1>
        <p className="text-muted-foreground">Ajoutez des compétences à vos domaines.</p>
      </div>

      <section className="grid gap-2 max-w-2xl">
        <h2 className="text-lg font-medium">Créer une compétence</h2>
        {dbError ? (
          <p className="text-amber-700">{dbError}</p>
        ) : domains.length === 0 ? (
          <p className="text-muted-foreground">
            Créez d’abord un domaine dans l’onglet Domaines.
          </p>
        ) : (
          <form action={createCompetency} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="domainId">Domaine</Label>
              <select id="domainId" name="domainId" className="h-9 rounded-md border px-3" required>
                <option value="">Sélectionner…</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" name="title" placeholder="ex: S’exprimer à l’oral" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" placeholder="ex: C1.1 (optionnel)" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Optionnel" />
            </div>
            <Button type="submit" className="w-fit">Créer</Button>
          </form>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Liste</h2>
        {dbError ? (
          <p className="text-amber-700">{dbError}</p>
        ) : competencies.length === 0 ? (
          <p className="text-muted-foreground">Aucune compétence pour le moment.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {competencies.map((c) => (
              <li key={c.id} className="p-3 space-y-2">
                <form action={updateCompetency} className="grid gap-2 md:grid-cols-2">
                  <input type="hidden" name="id" value={c.id} />
                  <div className="grid gap-1.5">
                    <Label htmlFor={`domain-${c.id}`}>Domaine</Label>
                    <select id={`domain-${c.id}`} name="domainId" className="h-9 rounded-md border px-3" defaultValue={c.domainId} required>
                      {domains.map((d) => (
                        <option key={d.id} value={d.id}>{d.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`title-${c.id}`}>Titre</Label>
                    <Input id={`title-${c.id}`} name="title" defaultValue={c.title} required />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`code-${c.id}`}>Code</Label>
                    <Input id={`code-${c.id}`} name="code" defaultValue={c.code ?? ""} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`desc-${c.id}`}>Description</Label>
                    <Input id={`desc-${c.id}`} name="description" defaultValue={c.description ?? ""} />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <Button type="submit">Mettre à jour</Button>
                    <form action={deleteCompetency}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button type="submit" variant="outline">Supprimer</Button>
                    </form>
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


