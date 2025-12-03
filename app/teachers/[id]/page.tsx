import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function TeacherPublicPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const teacherId = params?.id
  if (!teacherId) {
    notFound()
  }
  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { id: true, name: true, firstName: true, lastName: true, email: true, image: true, role: true },
  })
  if (!teacher || teacher.role !== "TEACHER") {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Enseignant</h1>
        <p className="text-muted-foreground">Profil introuvable.</p>
      </main>
    )
  }
  const classes = await prisma.classroom.findMany({
    where: { teacherId: teacher.id },
    orderBy: { createdAt: "desc" },
  })
  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        {teacher.image ? <img src={teacher.image} alt="" className="h-16 w-16 rounded-full object-cover" /> : null}
        <div>
          <h1 className="text-2xl font-semibold">
            {(teacher.name ?? `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim()) || teacher.email}
          </h1>
          <p className="text-sm text-muted-foreground">Enseignant</p>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Classes</h2>
        {classes.length === 0 ? (
          <p className="text-muted-foreground">Aucune classe.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {classes.map((c) => (
              <li key={c.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.name}</div>
                  {c.description ? <div className="text-sm text-muted-foreground">{c.description}</div> : null}
                </div>
                {session?.user?.id === teacher.id ? (
                  <Link href="/classes" className="text-sm text-primary underline">Gérer</Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}


