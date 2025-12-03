import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"

async function createSession(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return
  const teacherId = session.user.id
  const classroomId = String(formData.get("classroomId") || "")
  const name = (String(formData.get("name") || "").trim() || null) as string | null
  if (!classroomId) return

  await prisma.evaluationSession.create({
    data: { classroomId, teacherId, name },
  })
  redirect("/sessions")
}

export default async function NewActivityPage() {
  const session = await auth()

  if (!session?.user) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Nouvelle activité</h1>
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
  } catch {
    dbError = "La base de données n’est pas accessible. Configurez .env (DATABASE_URL) puis relancez le serveur."
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Nouvelle activité</h1>

      {dbError ? (
        <p className="text-amber-700">{dbError}</p>
      ) : classes.length === 0 ? (
        <p className="text-muted-foreground">Créez d’abord une classe pour démarrer une séance.</p>
      ) : (
        <form action={createSession} className="grid gap-3 max-w-xl">
          <div className="grid gap-1.5">
            <Label htmlFor="classroomId">Classe</Label>
            <select id="classroomId" name="classroomId" className="h-9 rounded-md border px-3" required>
              <option value="">Sélectionner…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nom de la séance</Label>
            <Input id="name" name="name" placeholder="Optionnel (ex: Évaluation orale 1)" />
          </div>
          <Button type="submit" className="w-fit">Créer la séance</Button>
        </form>
      )}
    </main>
  )
}

