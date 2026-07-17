"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Loader2,
  Save,
  Trash2,
  Radio,
  Podcast,
  Mic,
  Globe,
  FileAudio,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface Podcast {
  id: string;
  title: string;
  url: string;
}

interface RadioConfig {
  streamUrl?: string;
  onAir?: boolean;
  currentShow?: string;
  podcasts?: Podcast[];
}

export default function AdminRadioPage() {
  const queryClient = useQueryClient();

  const { data: config, isLoading, isError } = useQuery<RadioConfig>({
    queryKey: ["radio-config"],
    queryFn: () => fetch("/api/radio").then((res) => res.json()),
  });

  const podcasts = config?.podcasts || [];
  const [streamUrl, setStreamUrl] = useState(config?.streamUrl || "");
  const [onAir, setOnAir] = useState(config?.onAir || false);
  const [currentShow, setCurrentShow] = useState(config?.currentShow || "");
  const [podcastTitle, setPodcastTitle] = useState("");
  const [podcastUrl, setPodcastUrl] = useState("");

  // Synchroniser l'état local avec les données serveur
  useEffect(() => {
    if (config) {
      setStreamUrl(config.streamUrl || "");
      setOnAir(config.onAir || false);
      setCurrentShow(config.currentShow || "");
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/radio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["radio-config"] });
      toast.success("Configuration mise à jour.");
    },
    onError: () => toast.error("Erreur lors de la mise à jour."),
  });

  const addPodcastMutation = useMutation({
    mutationFn: (data: { title: string; url: string }) =>
      fetch("/api/radio/podcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["radio-config"] });
      setPodcastTitle("");
      setPodcastUrl("");
      toast.success("Podcast ajouté.");
    },
    onError: () => toast.error("Erreur lors de l'ajout du podcast."),
  });

  const deletePodcastMutation = useMutation({
    mutationFn: (id: string) =>
      fetch("/api/radio/podcasts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["radio-config"] });
      toast.success("Podcast supprimé.");
    },
    onError: () => toast.error("Erreur lors de la suppression."),
  });

  const handleDeletePodcast = (id: string) => {
    if (window.confirm("Supprimer ce podcast définitivement ?")) {
      deletePodcastMutation.mutate(id);
    }
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-text-secondary animate-pulse">Chargement de la configuration...</p>
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-20 text-red-500">
        <AlertCircle size={32} className="mx-auto mb-2" />
        Erreur de chargement. Veuillez réessayer.
      </div>
    );

  return (
    <div className="space-y-8 animate-fadeInUp pb-10 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Radio size={22} className="text-primary" />
            </div>
            Gestion Radio
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Configurez le flux en direct et gérez les podcasts
          </p>
        </div>
      </div>

      {/* Section Direct */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-premium p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
              <Radio size={16} className="text-red-500" />
            </div>
            Direct radio
          </h2>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${onAir ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            <span className={`text-sm font-medium ${onAir ? "text-green-600" : "text-text-secondary"}`}>
              {onAir ? "En ligne" : "Hors ligne"}
            </span>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-text mb-2 block">
              URL du flux audio
            </label>
            <div className="relative">
              <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
                placeholder="https://stream.example.com/live"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text mb-2 block">
              Nom de l&apos;émission en cours
            </label>
            <input
              type="text"
              value={currentShow}
              onChange={(e) => setCurrentShow(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
              placeholder="Ex: Matinale RMB"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10">
            <div>
              <p className="text-text font-medium">Statut du direct</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Activez ou désactivez le flux radio en direct
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOnAir(!onAir)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                onAir ? "bg-green-500" : "bg-gray-300 dark:bg-white/10"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                  onAir ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <Button
            onClick={() => updateMutation.mutate({ streamUrl, onAir, currentShow })}
            variant="primary"
            disabled={updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            <span className="ml-2">Enregistrer les modifications</span>
          </Button>
        </div>
      </motion.div>

      {/* Section Podcasts – Ajout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card-premium p-6"
      >
        <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
            <Mic size={16} className="text-purple-500" />
          </div>
          Ajouter un podcast
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Titre du podcast"
            value={podcastTitle}
            onChange={(e) => setPodcastTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
          />
          <input
            type="text"
            placeholder="URL du fichier audio (mp3)"
            value={podcastUrl}
            onChange={(e) => setPodcastUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
          />
        </div>
        <div className="mt-4">
          <Button
            onClick={() => addPodcastMutation.mutate({ title: podcastTitle, url: podcastUrl })}
            disabled={addPodcastMutation.isPending || !podcastTitle.trim() || !podcastUrl.trim()}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            {addPodcastMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            <span className="ml-2">Ajouter le podcast</span>
          </Button>
        </div>
      </motion.div>

      {/* Section Podcasts – Liste */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-premium p-6"
      >
        <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
            <Podcast size={16} className="text-blue-500" />
          </div>
          Podcasts ({podcasts.length})
        </h2>

        {podcasts.length === 0 ? (
          <div className="text-center py-8">
            <FileAudio size={32} className="mx-auto mb-2 text-text-secondary opacity-40" />
            <p className="text-text-secondary italic">Aucun podcast pour le moment.</p>
          </div>
        ) : (
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05 },
              },
            }}
            className="space-y-2"
          >
            {podcasts.map((p) => (
              <motion.li
                key={p.id}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 },
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Podcast size={16} className="text-blue-500" />
                  </div>
                  <span className="text-text truncate">{p.title}</span>
                </div>
                <button
                  onClick={() => handleDeletePodcast(p.id)}
                  disabled={deletePodcastMutation.isPending}
                  className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition flex-shrink-0"
                  title="Supprimer"
                >
                  {deletePodcastMutation.isPending &&
                  deletePodcastMutation.variables === p.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </motion.div>
    </div>
  );
}