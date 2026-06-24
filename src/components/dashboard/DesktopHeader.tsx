"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, MessageCircle, User, Sun, Moon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useChat } from "@/contexts/ChatContext";
import { useTheme } from "@/components/theme/ThemeProvider";

export function DesktopHeader() {
  const { data: session } = useSession();
  const { openChat } = useChat();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Recherche fonctionnelle (redirige vers la page de recherche ou ouvre la sidebar)
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector("input") as HTMLInputElement;
    if (input && input.value.trim()) {
      // Redirige vers une page de résultats ou utilise votre SearchBar existante
      router.push(`/dashboard/search?q=${encodeURIComponent(input.value.trim())}`);
    }
  };

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 h-14 bg-white dark:bg-surface border-b border-border z-30 items-center justify-between px-4">
      {/* Logo + Recherche */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/images/logo-rmb.png" alt="RMB" className="h-8 w-auto object-contain" />
        </Link>
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Rechercher sur RMB..."
            className="w-64 h-9 pl-10 pr-4 rounded-full bg-gray-100 dark:bg-white/5 border border-border text-text placeholder-text-secondary text-sm focus:outline-none focus:border-primary"
          />
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2">
            <Search size={16} className="text-text-secondary" />
          </button>
        </form>
      </div>

      {/* Icônes centrales (navigation) */}
      <nav className="flex items-center gap-1">
        <Link
          href="/dashboard"
          className="w-12 h-12 flex items-center justify-center rounded-lg text-primary hover:bg-gray-100 dark:hover:bg-white/5"
          title="Accueil"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </Link>
        <Link
          href="/dashboard/feed"
          className="w-12 h-12 flex items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5"
          title="Fil d'actualité"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </Link>
        <Link
          href="/dashboard/marketplace"
          className="w-12 h-12 flex items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5"
          title="Marketplace"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
          </svg>
        </Link>
      </nav>

      {/* Profil + Notifications + Thème */}
      <div className="flex items-center gap-2">
        {/* Thème clair/sombre */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 text-text-secondary hover:bg-gray-200 dark:hover:bg-white/10 transition"
          title={theme === "dark" ? "Mode clair" : "Mode sombre"}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Chat */}
        <button
          onClick={() => openChat()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 text-text-secondary hover:bg-gray-200 dark:hover:bg-white/10 transition"
          title="Messagerie"
        >
          <MessageCircle size={20} />
        </button>

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 text-text-secondary hover:bg-gray-200 dark:hover:bg-white/10 transition relative"
          title="Notifications"
        >
          <Bell size={20} />
          {/* Badge dynamique optionnel */}
        </Link>

        {/* Profil */}
        <Link
          href="/dashboard/profile"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition"
          title="Mon profil"
        >
          <User size={20} />
        </Link>
      </div>
    </header>
  );
}
