import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export default async function SessionsPage() {
  const session = await auth()

  if (!session?.user) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Séances d’évaluation</h1>
        <p className="text-muted-foreground">Veuillez vous connecter.</p>
      </main>
    )
  }

  let sessions: Awaited<ReturnType<typeof prisma.evaluationSession.findMany>> = []
  let dbError: string | null = null
  try {
    sessions = await prisma.evaluationSession.findMany({
      where: { teacherId: session.user.id },
      include: { classroom: true, group: true },
      orderBy: { startedAt: "desc" },
    })
  } catch {
    dbError = "La base de données n’est pas accessible. Configurez .env (DATABASE_URL) puis relancez le serveur."
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Séances d’évaluation</h1>
      {dbError ? (
        <p className="text-amber-700">{dbError}</p>
      ) : sessions.length === 0 ? (
        <p className="text-muted-foreground">Aucune séance pour le moment.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {sessions.map((s) => (
            <li key={s.id} className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{s.name ?? "Séance sans nom"}</span>
                <span className="text-sm text-muted-foreground">Classe: {s.classroom.name}</span>
                {s.group ? <span className="text-sm text-muted-foreground">Groupe: {s.group.name}</span> : null}
              </div>
              <div className="text-xs text-muted-foreground">
                Début: {new Date(s.startedAt).toLocaleString()}
                {s.endedAt ? ` • Fin: ${new Date(s.endedAt).toLocaleString()}` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}


