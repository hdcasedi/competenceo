import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { Prisma } from "@/app/generated/prisma"

async function createStudent(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return

  const firstName = String(formData.get("firstName") || "").trim() || null
  const lastName = String(formData.get("lastName") || "").trim() || null
  const emailRaw = String(formData.get("email") || "").trim()
  const email = emailRaw ? emailRaw.toLowerCase() : null

  if (!firstName && !lastName && !email) return

  const name = [firstName || "", lastName || ""].join(" ").trim() || null
  await prisma.user.create({
    data: {
      role: "STUDENT" as any,
      firstName,
      lastName,
      name,
      email,
    },
  })
  revalidatePath("/students")
}

async function enrollStudent(formData: FormData) {
  "use server"
  const session = await auth()
  if (!session?.user) return

  const classroomId = String(formData.get("classroomId") || "")
  const studentId = String(formData.get("studentId") || "")
  const seatNumber = (String(formData.get("seatNumber") || "").trim() || null) as string | null
  if (!classroomId || !studentId) return

  // Sécurité: la classe doit appartenir au professeur connecté
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId: session.user.id },
    select: { id: true },
  })
  if (!classroom) return

  try {
    await prisma.enrollment.create({
      data: { classroomId, studentId, seatNumber },
    })
  } catch {
    // ignore duplicate unique (déjà inscrit)
  }
  revalidatePath("/students")
}

export default async function StudentsPage() {
  const session = await auth()

  if (!session?.user) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Élèves</h1>
        <p className="text-muted-foreground">Veuillez vous connecter.</p>
      </main>
    )
  }

  let dbError: string | null = null
  let allStudents: Awaited<ReturnType<typeof prisma.user.findMany>> = []
  type ClassroomWithEnrollments = Prisma.ClassroomGetPayload<{
    include: { enrollments: { include: { student: true } } }
  }>
  let classesWithEnrollments: ClassroomWithEnrollments[] = []

  try {
    ;[allStudents, classesWithEnrollments] = await Promise.all([
      prisma.user.findMany({
        where: { role: "STUDENT" as any },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { name: "asc" }],
      }),
      prisma.classroom.findMany({
        where: { teacherId: session.user.id },
        include: {
          enrollments: {
            include: { student: true },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ])
  } catch {
    dbError = "La base de données n’est pas accessible. Configurez .env (DATABASE_URL) puis relancez le serveur."
  }

  return (
    <main className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Élèves</h1>
        <p className="text-muted-foreground">Créer des élèves et les inscrire à vos classes.</p>
      </div>

      <section className="grid gap-2 max-w-2xl">
        <h2 className="text-lg font-medium">Créer un élève</h2>
        {dbError ? (
          <p className="text-amber-700">{dbError}</p>
        ) : (
          <form action={createStudent} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" name="firstName" placeholder="ex: Alice" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" name="lastName" placeholder="ex: Martin" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email (optionnel)</Label>
              <Input id="email" name="email" type="email" placeholder="ex: alice.martin@exemple.com" />
            </div>
            <Button type="submit" className="w-fit">Créer l’élève</Button>
          </form>
        )}
      </section>

      <section className="grid gap-2 max-w-2xl">
        <h2 className="text-lg font-medium">Inscrire un élève dans une classe</h2>
        {dbError ? (
          <p className="text-amber-700">{dbError}</p>
        ) : classesWithEnrollments.length === 0 ? (
          <p className="text-muted-foreground">Créez d’abord une classe.</p>
        ) : allStudents.length === 0 ? (
          <p className="text-muted-foreground">Créez d’abord un élève.</p>
        ) : (
          <form action={enrollStudent} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="studentId">Élève</Label>
              <select id="studentId" name="studentId" className="h-9 rounded-md border px-3" required>
                <option value="">Sélectionner…</option>
                {allStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.lastName || s.firstName ? [s.lastName, s.firstName].filter(Boolean).join(" ") : (s.name ?? "Sans nom")}
                    {s.email ? ` — ${s.email}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="classroomId">Classe</Label>
              <select id="classroomId" name="classroomId" className="h-9 rounded-md border px-3" required>
                <option value="">Sélectionner…</option>
                {classesWithEnrollments.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="seatNumber">Numéro de place (optionnel)</Label>
              <Input id="seatNumber" name="seatNumber" placeholder="ex: A12" />
            </div>
            <Button type="submit" className="w-fit">Inscrire</Button>
          </form>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Élèves par classe</h2>
        {dbError ? (
          <p className="text-amber-700">{dbError}</p>
        ) : classesWithEnrollments.length === 0 ? (
          <p className="text-muted-foreground">Aucune classe.</p>
        ) : (
          <div className="grid gap-4">
            {classesWithEnrollments.map((c) => (
              <div key={c.id} className="rounded-md border">
                <div className="border-b p-3 font-medium">{c.name}</div>
                {c.enrollments.length === 0 ? (
                  <div className="p-3 text-muted-foreground">Aucun élève inscrit.</div>
                ) : (
                  <ul className="divide-y">
                    {c.enrollments.map((e) => (
                      <li key={e.id} className="p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {e.student.lastName || e.student.firstName
                              ? [e.student.lastName, e.student.firstName].filter(Boolean).join(" ")
                              : (e.student.name ?? "Sans nom")}
                          </span>
                          {e.student.email ? (
                            <span className="text-sm text-muted-foreground">{e.student.email}</span>
                          ) : null}
                          {e.seatNumber ? (
                            <span className="text-xs text-muted-foreground">Place: {e.seatNumber}</span>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}


