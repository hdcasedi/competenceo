import { auth } from "@/auth"

export default async function ProfilePage() {
  const session = await auth()
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Mon profil</h1>
      {!session?.user ? (
        <p className="text-muted-foreground">Veuillez vous connecter.</p>
      ) : (
        <p className="text-muted-foreground">Informations du compte et préférences (À venir).</p>
      )}
    </main>
  )
}


