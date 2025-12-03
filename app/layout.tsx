import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Competenceo",
  description: "Application de gestion des compétences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b">
          <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 text-sm">
            <Link href="/" className="font-semibold">Competenceo</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/classes">Classes</Link>
            <Link href="/domains">Domaines</Link>
            <Link href="/competencies">Compétences</Link>
            <Link href="/activities/new">Nouvelle activité</Link>
            <Link href="/sessions">Séances</Link>
            <Link href="/evaluations">Évaluations</Link>
            <span className="ml-auto flex items-center gap-3">
              <Link href="/profile">Profil</Link>
              <Link href="/settings">Paramètres</Link>
              <Link href="/login">Connexion</Link>
            </span>
          </nav>
        </header>
        <div className="mx-auto max-w-6xl px-4">
          {children}
        </div>
      </body>
    </html>
  );
}
