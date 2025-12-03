import { auth } from "@/auth"

export default async function GroupsPage() {
  const session = await auth()
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Groupes</h1>
      {!session?.user ? (
        <p className="text-muted-foreground">Veuillez vous connecter.</p>
      ) : (
        <p className="text-muted-foreground">Gestion des groupes au sein des classes (À venir).</p>
      )}
    </main>
  )
}


