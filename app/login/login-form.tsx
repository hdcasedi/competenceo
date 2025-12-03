'use client'

import { useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const error = searchParams.get("error")

  const [email, setEmail] = useState("prof@test.com")
  const [password, setPassword] = useState("password")
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    startTransition(async () => {
      await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl,
      })
    })
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>Accédez à votre espace enseignant/élève</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {(formError || error) && (
            <p className="text-sm text-red-600">
              Identifiants invalides. Veuillez réessayer.
            </p>
          )}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-xs text-muted-foreground">
          Astuce: utilisez <span className="font-medium">prof@test.com</span> / <span className="font-medium">password</span>
        </p>
      </CardFooter>
    </Card>
  )
}


