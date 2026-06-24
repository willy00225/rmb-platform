"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Loader2, Save, Trash2, Radio, Podcast, Mic } from "lucide-react";
import toast from "react-hot-toast";

// Interfaces pour les données radio
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

  const { data: config, isLoading } = useQuery<RadioConfig>({
    queryKey: ["radio-config"],
    queryFn: () => fetch("/api/radio").then(res => res.json()),
  });

  const podcasts = config?.podcasts || [];
  const [streamUrl, setStreamUrl] = useState(config?.streamUrl || "");
  const [onAir, setOnAir] = useState(config?.onAir || false);
  const [currentShow, setCurrentShow] = useState(config?.currentShow || "");
  const [podcastTitle, setPodcastTitle] = useState("");
  const [podcastUrl, setPodcastUrl] = useState("");

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
  });

  const handleDeletePodcast = (id: string) => {
    if (window.confirm("Supprimer ce podcast définitivement ?")) {
      deletePodcastMutation.mutate(id);
    }
  };

  if (isLoading)
    return (
      <Loader2 className="animate-spin text-primary mx-auto mt-10" size={32} />
    );

  return (
    <div className="space-y-8 animate-fadeInUp">
      <h1 className="text-3xl font-display font-bold text-text dark:text-white">
        Gestion Radio
      </h1>

      {/* Configuration du direct */}
      <div className="rounded-2xl bg-white dark:bg-surface border border-border dark:border-white/10 p-6">
        <h2 className="text-xl font-semibold text-text dark:text-white mb-4 flex items-center gap-2">
          <Radio size={20} className="text-primary" />
          Direct
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary">URL du flux audio</label>
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary">Nom de l&apos;émission</label>
            <input
              type="text"
              value={currentShow}
              onChange={(e) => setCurrentShow(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary"
            />
          </div>

          {/* Toggle "En direct" plus esthétique */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">En direct</span>
            <button
              type="button"
              onClick={() => setOnAir(!onAir)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                onAir ? "bg-primary" : "bg-gray-300 dark:bg-white/10"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  onAir ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-xs font-medium ${onAir ? "text-green-500" : "text-text-secondary"}`}>
              {onAir ? "Actif" : "Inactif"}
            </span>
          </div>

          <Button
            onClick={() => updateMutation.mutate({ streamUrl, onAir, currentShow })}
            variant="primary"
          >
            <Save size={18} /> Enregistrer
          </Button>
        </div>
      </div>

      {/* Ajout de podcast */}
      <div className="rounded-2xl bg-white dark:bg-surface border border-border dark:border-white/10 p-6">
        <h2 className="text-xl font-semibold text-text dark:text-white mb-4 flex items-center gap-2">
          <Mic size={20} className="text-primary" />
          Ajouter un podcast
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Titre du podcast"
            value={podcastTitle}
            onChange={(e) => setPodcastTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary"
          />
          <input
            type="text"
            placeholder="URL du fichier audio (mp3, etc.)"
            value={podcastUrl}
            onChange={(e) => setPodcastUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary"
          />
          <Button
            onClick={() =>
              addPodcastMutation.mutate({ title: podcastTitle, url: podcastUrl })
            }
            variant="secondary"
          >
            <Save size={18} /> Ajouter
          </Button>
        </div>
      </div>

      {/* Liste des podcasts */}
      <div className="rounded-2xl bg-white dark:bg-surface border border-border dark:border-white/10 p-6">
        <h2 className="text-xl font-semibold text-text dark:text-white mb-4 flex items-center gap-2">
          <Podcast size={20} className="text-primary" />
          Podcasts ({podcasts.length})
        </h2>
        {podcasts.length === 0 ? (
          <p className="text-text-secondary italic">Aucun podcast.</p>
        ) : (
          <ul className="space-y-2">
            {podcasts.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10"
              >
                <div className="flex items-center gap-3">
                  <Podcast size={16} className="text-text-secondary" />
                  <span className="text-text dark:text-white">{p.title}</span>
                </div>
                <button
                  onClick={() => handleDeletePodcast(p.id)}
                  className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}