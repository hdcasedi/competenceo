import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import type { Prisma } from "@/app/generated/prisma"

async function removeEnrollment(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return
  const enrollmentId = String(formData.get("enrollmentId") || "")
  if (!enrollmentId) return

  // Sécurité: ne supprimer que si l’inscription concerne une classe du professeur
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { classroom: true },
  })
  if (!enrollment || enrollment.classroom.teacherId !== session.user.id) return

  await prisma.enrollment.delete({ where: { id: enrollmentId } })
  revalidatePath("/enrollments")
}

export default async function EnrollmentsPage() {
  const session = await auth()

  if (!session?.user) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Inscriptions</h1>
        <p className="text-muted-foreground">Veuillez vous connecter.</p>
      </main>
    )
  }

  let dbError: string | null = null
  type ClassroomWithEnrollments = Prisma.ClassroomGetPayload<{
    include: { enrollments: { include: { student: true } } }
  }>
  let classes: ClassroomWithEnrollments[] = []
  try {
    classes = await prisma.classroom.findMany({
      where: { teacherId: session.user.id },
      include: {
        enrollments: { include: { student: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  } catch {
    dbError = "La base de données n’est pas accessible. Configurez .env (DATABASE_URL) puis relancez le serveur."
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Inscriptions</h1>
      {dbError ? (
        <p className="text-amber-700">{dbError}</p>
      ) : classes.length === 0 ? (
        <p className="text-muted-foreground">Aucune classe.</p>
      ) : (
        <div className="grid gap-4">
          {classes.map((c) => (
            <div key={c.id} className="rounded-md border">
              <div className="border-b p-3 font-medium">{c.name}</div>
              {c.enrollments.length === 0 ? (
                <div className="p-3 text-muted-foreground">Aucun élève inscrit.</div>
              ) : (
                <ul className="divide-y">
                  {c.enrollments.map((e) => (
                    <li key={e.id} className="flex items-center justify-between p-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {e.student.lastName || e.student.firstName
                            ? [e.student.lastName, e.student.firstName].filter(Boolean).join(" ")
                            : (e.student.name ?? "Sans nom")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {e.student.email ?? "Sans email"} {e.seatNumber ? `• Place: ${e.seatNumber}` : ""}
                        </div>
                      </div>
                      <form action={removeEnrollment}>
                        <input type="hidden" name="enrollmentId" value={e.id} />
                        <Button type="submit" variant="outline">Retirer</Button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}


