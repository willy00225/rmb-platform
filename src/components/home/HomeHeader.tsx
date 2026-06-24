"use client";
import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#about", label: "À propos" },
  { href: "#values", label: "Valeurs" },
  { href: "#documents", label: "Documents" },
  { href: "#contact", label: "Contact" },
];

export function HomeHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-bkg/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Logo size="md" />

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary transition">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">Connexion</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="primary" size="sm">Inscription</Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition"
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-white dark:bg-bkg px-4 py-4 space-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium text-text-secondary hover:text-primary transition py-2"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <Link href="/auth/login" onClick={() => setOpen(false)} className="flex-1">
              <Button variant="ghost" size="sm" className="w-full">Connexion</Button>
            </Link>
            <Link href="/auth/register" onClick={() => setOpen(false)} className="flex-1">
              <Button variant="primary" size="sm" className="w-full">Inscription</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
