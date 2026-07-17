"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Send,
  Megaphone,
  Users,
  Target,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminNotifyPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [segment, setSegment] = useState("all");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Veuillez remplir le titre et le message.");
      return;
    }
    setSending(true);
    setSent(false);
    try {
      const res = await fetch("/api/admin/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), segment }),
      });
      if (res.ok) {
        toast.success("Notification envoyée avec succès !");
        setTitle("");
        setMessage("");
        setSent(true);
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de l'envoi.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setSending(false);
    }
  };

  const segmentLabels: Record<string, string> = {
    all: "Tous les membres",
    AMBASSADOR: "Ambassadeurs",
    PREMIUM: "Membres Premium",
  };

  return (
    <div className="space-y-8 animate-fadeInUp max-w-3xl mx-auto pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Megaphone size={22} className="text-primary" />
            </div>
            Campagnes de notifications
          </h1>
          <p className="text-text-secondary mt-2 max-w-xl">
            Envoyez une notification push à l&apos;ensemble des membres ou à un
            segment spécifique.
          </p>
        </div>
      </div>

      {/* Message de succès après envoi */}
      {sent && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20"
        >
          <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
          <span className="text-green-700 dark:text-green-300 text-sm font-medium">
            Campagne envoyée avec succès !
          </span>
        </motion.div>
      )}

      {/* Carte principale */}
      <div className="card-premium p-6 space-y-6">
        {/* Titre */}
        <div>
          <label className="text-sm font-medium text-text mb-2 block">
            Titre de la notification
          </label>
          <input
            type="text"
            placeholder="Ex: Nouvelle fonctionnalité disponible !"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
          />
          <p className="text-xs text-text-secondary mt-1 text-right">
            {title.length}/100
          </p>
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium text-text mb-2 block">
            Message
          </label>
          <textarea
            placeholder="Contenu de la notification..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition resize-y"
          />
          <p className="text-xs text-text-secondary mt-1 text-right">
            {message.length}/500
          </p>
        </div>

        {/* Segment */}
        <div>
          <label className="text-sm font-medium text-text mb-2 flex items-center gap-2">
            <Users size={16} className="text-primary" />
            Cible
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(segmentLabels).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSegment(value)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  segment === value
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-gray-50 dark:bg-white/5 border-border dark:border-white/10 text-text-secondary hover:border-primary/30"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    segment === value
                      ? "border-primary bg-primary"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {segment === value && (
                    <CheckCircle size={12} className="text-white" />
                  )}
                </div>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Résumé avant envoi */}
        {title.trim() || message.trim() ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 space-y-2"
          >
            <h3 className="text-sm font-semibold text-text">
              Aperçu de la notification
            </h3>
            <p className="text-xs text-text-secondary">
              <span className="font-medium">Cible :</span>{" "}
              {segmentLabels[segment]}
            </p>
            <div className="bg-white dark:bg-surface rounded-lg p-3 border border-border dark:border-white/10">
              <p className="text-sm font-bold text-text">{title || "(Titre)"}</p>
              <p className="text-sm text-text-secondary mt-1">
                {message || "(Message)"}
              </p>
            </div>
          </motion.div>
        ) : null}

        {/* Bouton d'envoi */}
        <div>
          <Button
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim()}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {sending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
            <span className="ml-2">
              {sending
                ? "Envoi en cours..."
                : `Envoyer à ${segmentLabels[segment].toLowerCase()}`}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}