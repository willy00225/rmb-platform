"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  HelpCircle, Store, GitBranch
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search/SearchBar";

// ─── MobileHeader (intégré ici) ─────────────────────────────────
function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Notification non lues
  const { data: unreadData } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: () => fetch("/api/notifications/unread-count").then(res => res.json()),
    refetchInterval: 30000,
  });
  const unreadCount = unreadData?.count || 0;

  const menuLinks = [
    { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
    { href: "/dashboard/feed", label: "Fil d'actu", icon: Newspaper },
    { href: "/dashboard/friends", label: "Amis", icon: Users },
    { href: "/dashboard/groups", label: "Groupes", icon: Users },
    { href: "/dashboard/events", label: "Événements", icon: CalendarDays },
    { href: "/dashboard/live", label: "Lives", icon: Radio },
    { href: "/dashboard/donations", label: "Dons", icon: Heart },
    { href: "/dashboard/marketplace", label: "Marketplace", icon: Store },
    { href: "/dashboard/family", label: "Généalogie", icon: GitBranch },
    { href: "/dashboard/kyc", label: "Vérification", icon: Shield },
    { href: "/dashboard/profile", label: "Profil", icon: User },
    { href: "/dashboard/leaderboard", label: "Classement", icon: Trophy },
  ];

  const bottomLinks = [
    { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
    { href: "/dashboard/help", label: "Aide", icon: HelpCircle },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-border/60 px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/images/logo-rmb.png" alt="RMB" className="h-8 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/leaderboard" className="p-2 rounded-full hover:bg-gray-100 transition-colors text-text-secondary">
            <Trophy size={20} />
          </Link>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-text-secondary relative">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? <X size={20} className="text-text" /> : <Menu size={20} className="text-text" />}
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
              className="fixed top-0 left-0 z-50 w-[280px] h-full bg-white shadow-2xl pt-16 md:hidden overflow-y-auto"
            >
              <div className="px-6 py-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">U</div>
                  <div>
                    <p className="text-text font-medium">Utilisateur</p>
                    <p className="text-text-secondary text-xs">Voir mon profil</p>
                  </div>
                </div>
              </div>

              {/* Barre de recherche dans le menu mobile */}
              <div className="px-4 py-3">
                <SearchBar />
              </div>

              <nav className="p-3 space-y-1">
                {menuLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active ? "bg-primary/10 text-primary" : "text-text-secondary hover:bg-gray-50 hover:text-text"
                      }`}
                    >
                      <Icon size={20} className={active ? "text-primary" : "text-text-secondary"} />
                      {link.label}
                      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                    </Link>
                  );
                })}
              </nav>

              <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border/60 bg-white/95">
                {bottomLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-gray-50 hover:text-text transition-all"
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
// ───────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [storyUserId, setStoryUserId] = useState<string | null>(null);

  if (!session) return null;

  return (
    <ChatProvider>
      <div className="min-h-screen bg-bkg overflow-x-hidden">
        <Sidebar />
        <div className="md:pl-64">
          <MobileHeader />

          <main className="pt-16 pb-24 md:pt-0 md:pb-0 min-h-screen">
            <div className="max-w-5xl mx-auto px-4 py-4 md:px-8 md:py-6">
              <StoriesBar onStoryClick={(userId) => setStoryUserId(userId)} />
              {children}
            </div>
          </main>

          <MobileNav />
        </div>

        <FloatingChat session={session} />
        <SpotOverlay />
        <NotificationPrompt />
        <OneSignalRegistrar />

        {storyUserId && <StoryViewer userId={storyUserId} onClose={() => setStoryUserId(null)} />}
      </div>
    </ChatProvider>
  );
}