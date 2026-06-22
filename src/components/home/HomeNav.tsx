"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#about", label: "À propos" },
  { href: "#values", label: "Piliers" },
  { href: "#documents", label: "Documents" },
  { href: "#contact", label: "Contact" },
];

export function HomeNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-bkg/90 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/images/logo-rmb.png"
            alt="RMB"
            className="h-8 w-auto object-contain"
          />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-secondary hover:text-primary transition"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/auth/login"
            className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-hover transition"
          >
            Connexion
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition"
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden border-t border-border bg-white dark:bg-bkg p-4 space-y-3">
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
          <Link
            href="/auth/login"
            onClick={() => setOpen(false)}
            className="block text-sm font-medium bg-primary text-white text-center px-4 py-2 rounded-xl hover:bg-primary-hover transition"
          >
            Connexion
          </Link>
        </div>
      )}
    </nav>
  );
}