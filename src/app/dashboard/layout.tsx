"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { FloatingChat } from "@/components/chat/FloatingChat";
import { SpotOverlay } from "@/components/spots/SpotOverlay";
import { NotificationPrompt } from "@/components/notifications/NotificationPrompt";
import { OneSignalRegistrar } from "@/components/notifications/OneSignalRegistrar";
import { StoriesBar } from "@/components/stories/StoriesBar";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { ChatProvider } from "@/contexts/ChatContext";
import {
  Menu, Bell, X, Newspaper, Users, User, LayoutDashboard,
  CalendarDays, Heart, Shield, Radio, Trophy, Settings,
  HelpCircle, Store, GitBranch, Package, Sun, Moon,
  AlertTriangle, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search/SearchBar";
import { useTheme } from "@/components/theme/ThemeProvider";
import { DesktopHeader } from "@/components/dashboard/DesktopHeader";
import { RightSidebar } from "@/components/dashboard/RightSidebar";
import { DashboardProviders } from "@/components/DashboardProviders";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import "@/styles/chat-theme.css"; // ✅ Thème personnalisé du chat

// ─── MobileHeaderInline (corrigé pour le défilement) ────
function MobileHeaderInline() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();

  const { data: unreadData } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: () => fetch("/api/notifications/unread-count").then(res => res.json()),
    refetchInterval: 30000,
  });
  const unreadCount = unreadData?.count || 0;

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  const menuLinks = [
    { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
    { href: "/dashboard/feed", label: "Fil d'actu", icon: Newspaper },
    { href: "/dashboard/friends", label: "Amis", icon: Users },
    { href: "/dashboard/groups", label: "Groupes", icon: Users },
    { href: "/dashboard/events", label: "Événements", icon: CalendarDays },
    { href: "/dashboard/live", label: "Lives", icon: Radio },
    { href: "/dashboard/radio", label: "Radio", icon: Radio },
    { href: "/dashboard/donations", label: "Dons", icon: Heart },
    { href: "/dashboard/marketplace", label: "Marketplace", icon: Store },
    { href: "/dashboard/orders", label: "Commandes", icon: Package },
    { href: "/dashboard/family", label: "Généalogie", icon: GitBranch },
    { href: "/dashboard/kyc", label: "Vérification", icon: Shield },
    { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
    { href: "/dashboard/profile", label: "Profil", icon: User },
    { href: "/dashboard/leaderboard", label: "Classement", icon: Trophy },
  ];

  const bottomLinks = [
    { href: "/dashboard/help", label: "Aide", icon: HelpCircle },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <header className="md:hidden sticky top-0 z-50 bg-white/90 dark:bg-bkg/90 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/images/logo-rmb.png" alt="RMB" className="h-8 w-auto object-contain" />
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 text-text-secondary dark:text-text hover:bg-gray-200 dark:hover:bg-white/20 transition"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <Link
            href="/dashboard/leaderboard"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 text-text-secondary dark:text-text hover:bg-gray-200 dark:hover:bg-white/20 transition"
          >
            <Trophy size={20} />
          </Link>

          <Link
            href="/dashboard/notifications"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 text-text-secondary dark:text-text hover:bg-gray-200 dark:hover:bg-white/20 transition relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary hover:bg-primary/20 dark:hover:bg-primary/30 transition"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 z-50 w-[280px] h-full bg-white dark:bg-surface shadow-2xl pt-16 md:hidden flex flex-col"
            >
              {/* En-tête utilisateur */}
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">U</div>
                  <div>
                    <p className="text-text font-medium">Utilisateur</p>
                    <p className="text-text-secondary text-xs">Voir mon profil</p>
                  </div>
                </div>
              </div>

              {/* Barre de recherche */}
              <div className="px-4 py-3">
                <SearchBar />
              </div>

              {/* Zone scrollable pour les liens */}
              <div className="flex-1 overflow-y-auto px-3 py-2">
                {/* Lien Administration pour les admins */}
                {isAdmin && (
                  <div className="pb-2">
                    <Link
                      href="/dashboard/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        pathname.startsWith("/dashboard/admin")
                          ? "bg-primary/10 text-primary"
                          : "text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 hover:text-text"
                      }`}
                    >
                      <ShieldCheck size={20} className={pathname.startsWith("/dashboard/admin") ? "text-primary" : "text-text-secondary"} />
                      Administration
                      {pathname.startsWith("/dashboard/admin") && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  </div>
                )}
                <nav className="space-y-1">
                  {menuLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    return (
                      <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          active ? "bg-primary/10 text-primary" : "text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 hover:text-text"
                        }`}
                      >
                        <Icon size={20} className={active ? "text-primary" : "text-text-secondary"} />
                        {link.label}
                        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Liens du bas (fixes) */}
              <div className="p-3 border-t border-border bg-white dark:bg-surface">
                {bottomLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 hover:text-text transition-all"
                    >
                      <Icon size={20} className="text-text-secondary" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Bandeau d'avertissement KYC (inchangé) ──────────────────────────────
function KycWarningBanner() {
  return (
    <div className="mb-6 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 flex items-start gap-3">
      <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
          Vérification d'identité requise
        </p>
        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
          Pour accéder à toutes les fonctionnalités, veuillez vérifier votre identité.
        </p>
        <Link
          href="/dashboard/kyc"
          className="inline-block mt-2 text-xs font-medium text-yellow-800 dark:text-yellow-300 underline hover:text-yellow-600 dark:hover:text-yellow-200"
        >
          Vérifier mon identité →
        </Link>
      </div>
    </div>
  );
}

// ─── Composant interne avec tous les hooks et le JSX ─────────────────
function DashboardInnerLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [storyUserId, setStoryUserId] = useState<string | null>(null);
  const pathname = usePathname();

  if (!session) return null;

  // 🔒 Vérification KYC
  const kycLevel = session.user?.kycLevel;
  const isKycVerified = kycLevel === "ID_VERIFIED" || kycLevel === "AMBASSADOR";
  const isAdmin = session.user?.role === "ADMIN" || session.user?.role === "SUPER_ADMIN";

  const exemptedPaths = [
    "/dashboard/kyc",
    "/dashboard/profile",
    "/dashboard/settings",
    "/dashboard/premium",
  ];
  const isExempted = exemptedPaths.some(p => pathname.startsWith(p)) || (pathname.startsWith("/dashboard/admin") && isAdmin);
  const showKycBanner = !isKycVerified && !isExempted;

  // Gestionnaire de clic sur les stories
  const handleStoryClick = (userId: string) => {
    if (userId === "me") {
      router.push("/dashboard/stories/new");
    } else {
      setStoryUserId(userId);
    }
  };

  // ✅ Espace supplémentaire sous les pages admin pour éviter le chevauchement du MobileNav
  const isAdminPage = pathname.startsWith("/dashboard/admin");

  return (
    <div className="min-h-screen bg-bkg overflow-x-hidden">
      <DesktopHeader />
      <Sidebar />
      <div className="md:pl-60 lg:pr-80">
        <MobileHeaderInline />
        <main className={`pt-16 md:pt-14 pb-24 md:pb-0 min-h-screen ${isAdminPage ? "pb-36" : ""}`}>
          <div className="max-w-3xl mx-auto px-4 py-4 md:px-8 md:py-6">
            <div className="bg-white dark:bg-surface rounded-2xl shadow-2xl min-h-screen p-4 md:p-6">
              <StoriesBar onStoryClick={handleStoryClick} />
              {showKycBanner && <KycWarningBanner />}
              {children}
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
      <RightSidebar />
      <FloatingChat session={session} />
      <SpotOverlay />
      <NotificationPrompt />
      <OneSignalRegistrar />
      {storyUserId && <StoryViewer userId={storyUserId} onClose={() => setStoryUserId(null)} />}
    </div>
  );
}

// ─── DashboardLayout principal avec garde et providers ─────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <LoadingScreen />;

  return (
    <DashboardProviders>
      <ChatProvider>
        <DashboardInnerLayout>{children}</DashboardInnerLayout>
      </ChatProvider>
    </DashboardProviders>
  );
}