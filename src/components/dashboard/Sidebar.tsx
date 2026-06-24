"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Heart,
  User,
  LogOut,
  ChevronRight,
  Shield,
  Newspaper,
  Users,
  Radio,
  Star,
  Store,
  GitBranch,
  Package,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { UserName } from "@/components/ui/UserName";
import { useTheme } from "@/components/theme/ThemeProvider";

const navItems = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/dashboard/feed", label: "Fil d'actu", icon: Newspaper },
  { href: "/dashboard/friends", label: "Amis", icon: Users },
  { href: "/dashboard/events", label: "Événements", icon: CalendarDays },
  { href: "/dashboard/donations", label: "Dons", icon: Heart },
  { href: "/dashboard/live", label: "Lives", icon: Radio },
  { href: "/dashboard/radio", label: "Radio", icon: Radio },
  { href: "/dashboard/groups", label: "Groupes", icon: Users },
  { href: "/dashboard/marketplace", label: "Marketplace", icon: Store },
  { href: "/dashboard/orders", label: "Commandes", icon: Package },
  { href: "/dashboard/premium", label: "Premium", icon: Star },
  { href: "/dashboard/family", label: "Généalogie", icon: GitBranch },
  { href: "/dashboard/profile", label: "Profil", icon: User },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const { theme, toggleTheme } = useTheme();

  const fullName = session?.user?.name || "Membre";
  const firstName = fullName.split(" ")[0] || "Membre";
  const lastName = fullName.split(" ").slice(1).join(" ") || "";

  return (
    <motion.aside
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden md:flex fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-60 bg-bkg flex-col z-40"
    >
      {/* Navigation avec scroll invisible au repos, visible au survol */}
      <nav className="flex-1 py-2 space-y-1 px-3 overflow-y-auto sidebar-scroll">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-text-secondary hover:text-text hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                <item.icon size={18} className={isActive ? "text-primary" : "text-text-secondary"} />
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto text-primary" />}
              </motion.div>
            </Link>
          );
        })}

        {isAdmin && (
          <Link href="/dashboard/admin">
            <motion.div
              whileHover={{ x: 4 }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname.startsWith("/dashboard/admin")
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-text-secondary hover:text-text hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              <Shield size={18} className={pathname.startsWith("/dashboard/admin") ? "text-primary" : "text-text-secondary"} />
              Administration
            </motion.div>
          </Link>
        )}
      </nav>

      {/* Profil utilisateur (sans bordure visible) */}
      {session?.user && (
        <div className="p-3">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
              {session.user.name?.[0] || "M"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text truncate">
                <UserName userId={session.user.id} firstName={firstName} lastName={lastName} />
              </div>
              <p className="text-xs text-text-secondary truncate">{session.user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bouton de thème */}
      <div className="px-3 pb-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {theme === "dark" ? "Mode clair" : "Mode sombre"}
        </button>
      </div>

      {/* Déconnexion (sans bordure visible) */}
      <div className="p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </motion.aside>
  );
}
