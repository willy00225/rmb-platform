"use client";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function FooterSection() {
  return (
    <footer className="bg-surface dark:bg-surface border-t border-border py-8 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <Logo size="sm" withSlogan={false} />
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-text-secondary">
          <Link href="#about" className="hover:text-primary">À propos</Link>
          <Link href="#documents" className="hover:text-primary">Documents</Link>
          <Link href="#contact" className="hover:text-primary">Contact</Link>
          <Link href="/auth/login" className="hover:text-primary">Connexion</Link>
        </nav>
        <p className="text-text-secondary text-xs break-words">
          © {new Date().getFullYear()} Réseau Mondial des Bétés. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}