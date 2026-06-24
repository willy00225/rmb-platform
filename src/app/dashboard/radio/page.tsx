"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Play, Pause, Radio as RadioIcon, Podcast } from "lucide-react";

interface Podcast {
  id: string;
  title: string;
  createdAt: string;
  url?: string;
}

interface RadioConfig {
  onAir: boolean;
  streamUrl?: string;
  currentShow?: string;
  podcasts: Podcast[];
}

export default function RadioPage() {
  const { data: config, isLoading } = useQuery<RadioConfig>({
    queryKey: ["radio-config"],
    queryFn: () => fetch("/api/radio").then((res) => res.json()),
    refetchInterval: 30000,
  });

  const podcasts: Podcast[] = config?.podcasts || [];
  const [playingPodcast, setPlayingPodcast] = useState<string | null>(null);

  if (isLoading)
    return <Loader2 className="animate-spin text-primary mx-auto mt-10" size={32} />;

  return (
    <div className="space-y-8 animate-fadeInUp">
      <h1 className="text-3xl font-display font-bold text-text dark:text-white">
        Radio RMB
      </h1>

      {/* Direct */}
      <div className="card-premium p-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <RadioIcon
            size={40}
            className={
              config?.onAir
                ? "text-red-500 animate-pulse"
                : "text-text-secondary dark:text-gray-400"
            }
          />
          <h2 className="text-2xl font-bold text-text dark:text-white">
            {config?.onAir ? "EN DIRECT" : "Hors antenne"}
          </h2>
        </div>
        {config?.onAir && config?.streamUrl ? (
          <div>
            <p className="text-text-secondary dark:text-gray-400 mb-4">
              {config.currentShow || "Émission en cours"}
            </p>
            <audio controls autoPlay className="w-full max-w-md mx-auto">
              <source src={config.streamUrl} type="audio/mpeg" />
            </audio>
          </div>
        ) : (
          <p className="text-text-secondary dark:text-gray-400">
            Revenez bientôt.
          </p>
        )}
      </div>

      {/* Podcasts */}
      <div className="card-premium p-6">
        <h2 className="text-xl font-semibold text-text dark:text-white mb-4 flex items-center gap-2">
          <Podcast size={20} className="text-primary" /> Podcasts
        </h2>
        {podcasts.length === 0 ? (
          <p className="text-text-secondary italic">Aucun podcast.</p>
        ) : (
          <div className="space-y-3">
            {podcasts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10"
              >
                <div>
                  <p className="text-text dark:text-white font-medium">{p.title}</p>
                  <p className="text-text-secondary text-xs">
                    {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setPlayingPodcast(playingPodcast === p.id ? null : p.id)
                  }
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover transition-transform hover:scale-105 active:scale-95"
                  title={playingPodcast === p.id ? "Pause" : "Écouter"}
                >
                  {playingPodcast === p.id ? <Pause size={18} /> : <Play size={18} />}
                </button>
              </div>
            ))}
          </div>
        )}
        {playingPodcast && (
          <div className="mt-4">
            <audio controls autoPlay className="w-full">
              <source
                src={podcasts.find((p) => p.id === playingPodcast)?.url}
                type="audio/mpeg"
              />
            </audio>
          </div>
        )}
      </div>
    </div>
  );
}