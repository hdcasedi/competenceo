import { auth } from "@/auth"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await auth()
  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        {session?.user ? (
          <p className="mt-2 text-muted-foreground">
            Bienvenue {session.user.name ?? session.user.email} ({/* @ts-expect-error role ajouté */ session.user.role})
          </p>
        ) : (
          <p className="mt-2 text-muted-foreground">Non connecté</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Classes</CardTitle>
            <CardDescription>Gérer vos classes et élèves</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Créez une classe, importez des élèves via CSV, organisez des groupes.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/classes">Ouvrir</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Référentiel</CardTitle>
            <CardDescription>Domaines et compétences</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Construisez votre référentiel: domaines et sous-compétences.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="secondary">
              <Link href="/skills">Gérer</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nouvelle activité</CardTitle>
            <CardDescription>Créer une séance d&apos;évaluation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Choisissez la classe/groupe et les compétences à évaluer.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/activities/new">Démarrer</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}


