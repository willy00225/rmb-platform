import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-bkg flex flex-col">
      {/* Navigation */}
      <header className="py-6 px-4 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-primary">
            RMB<span className="text-secondary">.</span>
          </h1>
          <Link href="/auth/login" className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition">
            Se connecter
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-text leading-tight">
            Bienvenue sur le <span className="text-primary">Réseau Mondial</span> des{" "}
            <span className="text-secondary">Bétés</span>
          </h2>
          <p className="text-lg text-text-secondary">
            Unis par nos racines, engagés pour notre avenir.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/auth/register" className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary-hover transition shadow-lg">
              Rejoindre le réseau
            </Link>
            <Link href="/auth/login" className="px-8 py-4 bg-white dark:bg-surface border border-border text-text rounded-2xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-white/5 transition">
              Se connecter
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border text-center text-text-secondary text-sm">
        © {new Date().getFullYear()} Réseau Mondial des Bétés. Tous droits réservés.
      </footer>
    </div>
  );
}