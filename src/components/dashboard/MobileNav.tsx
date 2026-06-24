"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  Heart,
  User,
  PlusCircle,
  X,
  Image,
  Video,
  MapPin,
  Smile,
  Send,
  Loader2,
  CalendarDays,
  Radio,
  FileText,
  Store,
} from "lucide-react";
import { useState, useRef } from "react";
import toast from "react-hot-toast";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<"post" | "live" | "event" | "group" | "donation" | null>(null);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const navItems = [
    { href: "/dashboard", label: "Accueil", icon: Home },
    { href: "/dashboard/live", label: "Lives", icon: Radio },
    { href: "/dashboard/groups", label: "Groupes", icon: Users },
    { href: "/dashboard/marketplace", label: "Marketplace", icon: Store },
    { href: "/dashboard/profile", label: "Profil", icon: User },
  ];

  const openModal = () => {
    setIsModalOpen(true);
    setSelectedType(null);
    setText("");
    setSelectedFile(null);
    setPreview(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedType(null);
    setText("");
    setSelectedFile(null);
    setPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPost = async () => {
    if (!text.trim() && !selectedFile) {
      toast.error("Écrivez quelque chose ou ajoutez une image.");
      return;
    }
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("content", text);
      if (selectedFile) formData.append("media", selectedFile);

      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Publication créée !");
        closeModal();
        window.location.reload();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la publication.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const creationOptions = [
    { type: "post", label: "Publication", icon: FileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", href: "#" },
    { type: "live", label: "Live", icon: Radio, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10", href: "/dashboard/live/create" },
    { type: "event", label: "Événement", icon: CalendarDays, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10", href: "/dashboard/events/create" },
    { type: "group", label: "Groupe", icon: Users, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10", href: "/dashboard/groups/create" },
    { type: "donation", label: "Collecte de dons", icon: Heart, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-500/10", href: "/dashboard/donations/create" },
  ];

  const handleSelectOption = (option: typeof creationOptions[0]) => {
    if (option.type === "post") {
      setSelectedType("post");
    } else {
      router.push(option.href);
      closeModal();
    }
  };

  return (
    <>
      {/* Barre de navigation inférieure */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-bkg/90 backdrop-blur-xl border-t border-border dark:border-white/10 flex items-center justify-around h-16 px-1 safe-bottom">
        {navItems.slice(0, 2).map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center flex-1 py-1"
            >
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute inset-x-0 top-0 h-full w-full rounded-2xl bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <Icon
                  size={22}
                  className={`transition-all duration-300 ${
                    active ? "text-primary" : "text-text-secondary dark:text-gray-400"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium mt-0.5 transition-all duration-300 ${
                    active ? "text-primary" : "text-text-secondary dark:text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}

        {/* Bouton central "Créer" */}
        <button
          onClick={openModal}
          className="relative flex flex-col items-center justify-center flex-1 -mt-4"
        >
          <div className="absolute -top-3 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform duration-300">
            <PlusCircle size={28} className="fill-white" />
          </div>
          <span className="text-[10px] font-medium text-text-secondary dark:text-gray-400 mt-6">Créer</span>
        </button>

        {navItems.slice(2).map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center flex-1 py-1"
            >
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute inset-x-0 top-0 h-full w-full rounded-2xl bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <Icon
                  size={22}
                  className={`transition-all duration-300 ${
                    active ? "text-primary" : "text-text-secondary dark:text-gray-400"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium mt-0.5 transition-all duration-300 ${
                    active ? "text-primary" : "text-text-secondary dark:text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Modal de création */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm z-[60] flex items-end justify-center p-4 sm:items-center"
            onClick={closeModal}
          >
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-surface rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedType === null ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-text">Créer</h2>
                    <button
                      onClick={closeModal}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <X size={24} className="text-text-secondary" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {creationOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <motion.button
                          key={option.type}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectOption(option)}
                          className={`flex flex-col items-center justify-center p-6 rounded-2xl border border-border dark:border-white/10 hover:border-primary/30 dark:hover:border-primary/40 transition-all ${option.bg}`}
                        >
                          <Icon size={32} className={`${option.color} mb-2`} />
                          <span className="text-sm font-medium text-text">{option.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-xs text-text-secondary">Choisissez ce que vous voulez créer</p>
                  </div>
                </>
              ) : (
                /* Formulaire de publication (pour "post") */
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-text">Nouvelle publication</h2>
                    <button
                      onClick={() => setSelectedType(null)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <X size={24} className="text-text-secondary" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                        M
                      </div>
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Quoi de neuf ?"
                        className="flex-1 h-28 p-3 rounded-xl border border-border dark:border-white/10 bg-gray-50 dark:bg-white/5 text-text placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-base"
                        autoFocus
                      />
                    </div>

                    {preview && (
                      <div className="relative rounded-xl overflow-hidden border border-border dark:border-white/10">
                        <img src={preview} alt="Aperçu" className="w-full max-h-64 object-contain" />
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            setPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 border-t border-border dark:border-white/10 pt-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      >
                        <Image size={22} className="text-green-500" />
                      </button>
                      <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <Video size={22} className="text-red-500" />
                      </button>
                      <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <MapPin size={22} className="text-blue-500" />
                      </button>
                      <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <Smile size={22} className="text-yellow-500" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="flex-1" />
                      <button
                        onClick={handleSubmitPost}
                        disabled={isSubmitting}
                        className="px-5 py-2 rounded-full bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-70 transition flex items-center gap-2"
                      >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        Publier
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
