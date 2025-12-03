import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"

export default async function TeachersPage() {
  const session = await auth()
  if (!session?.user) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Enseignants</h1>
        <p className="text-muted-foreground">Veuillez vous connecter.</p>
      </main>
    )
  }
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" as any },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  })
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Enseignants</h1>
      {teachers.length === 0 ? (
        <p className="text-muted-foreground">Aucun enseignant pour le moment.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {teachers.map((t) => (
            <li key={t.id} className="p-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {(t.name ?? `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim()) || t.email}
                </div>
                <div className="text-xs text-muted-foreground">{t.email}</div>
              </div>
              <Link href={`/teachers/${t.id}`} className="text-sm text-primary underline">
                Ouvrir
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}


