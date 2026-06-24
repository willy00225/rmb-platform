"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Send, Megaphone, Users, Target } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminNotifyPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [segment, setSegment] = useState("all");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Veuillez remplir le titre et le message.");
      return;
    }
    setSending(true);
    const res = await fetch("/api/admin/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, segment }),
    });
    if (res.ok) {
      toast.success("Notification envoyée avec succès !");
      setTitle("");
      setMessage("");
    } else {
      toast.error("Erreur lors de l'envoi.");
    }
    setSending(false);
  };

  return (
    <div className="space-y-8 animate-fadeInUp max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-text dark:text-white flex items-center gap-3">
          <Megaphone size={28} className="text-primary" />
          Campagnes de notifications
        </h1>
        <p className="text-text-secondary mt-1">
          Envoyez une notification push à l’ensemble des membres ou à un segment spécifique.
        </p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-surface border border-border dark:border-white/10 p-6 space-y-5">
        {/* Titre */}
        <div>
          <label className="block text-sm font-medium text-text dark:text-white mb-1">
            Titre de la notification
          </label>
          <input
            type="text"
            placeholder="Ex: Nouvelle fonctionnalité disponible !"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text dark:text-white placeholder-text-secondary focus:outline-none focus:border-primary transition"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-text dark:text-white mb-1">
            Message
          </label>
          <textarea
            placeholder="Contenu de la notification..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text dark:text-white placeholder-text-secondary focus:outline-none focus:border-primary transition resize-y"
          />
        </div>

        {/* Segment */}
        <div>
          <label className="block text-sm font-medium text-text dark:text-white mb-1">
            Cible
          </label>
          <div className="relative">
            <Target size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text dark:text-white focus:outline-none focus:border-primary transition appearance-none"
            >
              <option value="all">Tous les membres</option>
              <option value="AMBASSADOR">Ambassadeurs</option>
              <option value="PREMIUM">Membres Premium</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleSend}
            disabled={sending}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Envoi en cours...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send size={18} />
                Envoyer la notification
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}