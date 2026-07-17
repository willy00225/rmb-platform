"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Play,
  Pause,
  Radio as RadioIcon,
  Podcast,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  ExternalLink,
  Clock,
  Disc,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Podcast {
  id: string;
  title: string;
  createdAt: string;
  url?: string;
  imageUrl?: string | null;
  description?: string | null;
  duration?: number; // en secondes (optionnel)
}

interface RadioConfig {
  onAir: boolean;
  streamUrl?: string;
  currentShow?: string;
  podcasts: Podcast[];
}

/* ------------------------------------------------------------------ */
/*  Sous‑composant : AudioPlayer                                       */
/* ------------------------------------------------------------------ */
function AudioPlayer({
  src,
  title,
  subtitle,
  imageUrl,
  onEnded,
}: {
  src: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  onEnded?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoaded = () => {
      setDuration(audio.duration || 0);
      setReady(true);
      audio.play().catch(() => setPlaying(false));
    };
    const handleError = () => {
      setError(true);
      setPlaying(false);
    };
    const handleTimeUpdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };

    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setPlaying(true));
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(!muted);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !ready || error) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (audio && ready) audio.currentTime = Math.min(duration, Math.max(0, audio.currentTime + seconds));
  };

  return (
    <div className="card-premium p-4 flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-primary/5 to-transparent dark:from-white/5">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Disc size={24} className="text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text truncate">{title}</p>
          {subtitle && <p className="text-xs text-text-secondary truncate">{subtitle}</p>}
          {error && <p className="text-xs text-red-500">Impossible de lire ce média</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button onClick={() => skip(-10)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition" title="Reculer de 10s">
          <SkipBack size={18} className="text-text-secondary" />
        </button>
        <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition" disabled={error}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button onClick={() => skip(10)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition" title="Avancer de 10s">
          <SkipForward size={18} className="text-text-secondary" />
        </button>

        <div className="hidden sm:block flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden cursor-pointer mx-2" onClick={seek}>
          <motion.div className="h-full bg-primary rounded-full" style={{ width: `${progress * 100}%` }} />
        </div>

        <button onClick={toggleMute} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition" title={muted ? "Activer le son" : "Couper le son"}>
          {muted ? <VolumeX size={18} className="text-text-secondary" /> : <Volume2 size={18} className="text-text-secondary" />}
        </button>
      </div>

      <audio ref={audioRef} src={src} preload="auto" onEnded={onEnded} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page principale                                                    */
/* ------------------------------------------------------------------ */
export default function RadioPage() {
  const { data: config, isLoading, isError } = useQuery<RadioConfig>({
    queryKey: ["radio-config"],
    queryFn: () => fetch("/api/radio").then((res) => res.json()),
    refetchInterval: 30000,
  });

  const podcasts: Podcast[] = config?.podcasts || [];
  const [activePodcastId, setActivePodcastId] = useState<string | null>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string>("");
  const [activeSubtitle, setActiveSubtitle] = useState<string>("");
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Déterminer la source active
  useEffect(() => {
    if (!config) return;
    if (activePodcastId) {
      const podcast = podcasts.find((p) => p.id === activePodcastId);
      if (podcast?.url) {
        setActiveStreamUrl(podcast.url);
        setActiveTitle(podcast.title);
        setActiveSubtitle(podcast.description || `Podcast du ${new Date(podcast.createdAt).toLocaleDateString("fr-FR")}`);
        setActiveImage(podcast.imageUrl || null);
        return;
      }
    }
    // Sinon, si la radio est en direct, on diffuse le stream
    if (config.onAir && config.streamUrl) {
      setActiveStreamUrl(config.streamUrl);
      setActiveTitle("Radio RMB – Direct");
      setActiveSubtitle(config.currentShow || "Émission en cours");
      setActiveImage(null);
    } else {
      // Rien à jouer
      setActiveStreamUrl(null);
      setActiveTitle("");
      setActiveSubtitle("");
      setActiveImage(null);
    }
  }, [config, activePodcastId, podcasts]);

  const playPodcast = (podcast: Podcast) => {
    setActivePodcastId((prev) => (prev === podcast.id ? null : podcast.id));
  };

  const handleAudioEnded = () => {
    setActivePodcastId(null);
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-20 text-red-500">
        Impossible de charger la radio. Veuillez réessayer.
      </div>
    );

  return (
    <div className="space-y-8 animate-fadeInUp pb-10">
      <h1 className="text-3xl font-display font-bold text-text">Radio RMB</h1>

      {/* Carte Direct */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="card-premium overflow-hidden !p-0"
      >
        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20 p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 dark:bg-red-500/30 flex items-center justify-center">
            <RadioIcon size={36} className={`${config?.onAir ? "text-red-500 animate-pulse" : "text-text-secondary"}`} />
            {config?.onAir && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-surface" />}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold text-text">{config?.onAir ? "En direct" : "Hors antenne"}</h2>
            <p className="text-text-secondary">{config?.onAir ? config?.currentShow || "Émission en cours" : "Revenez bientôt"}</p>
          </div>
          <div>
            {config?.onAir && config?.streamUrl && !activePodcastId ? (
              <button
                onClick={() => setActiveStreamUrl(null)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium transition"
              >
                Arrêter le direct
              </button>
            ) : config?.onAir && config?.streamUrl ? (
              <button
                onClick={() => setActivePodcastId(null)}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-full text-sm font-medium transition"
              >
                Revenir au direct
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>

      {/* Lecteur global (toujours visible si un flux est actif) */}
      {activeStreamUrl && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AudioPlayer
              src={activeStreamUrl}
              title={activeTitle}
              subtitle={activeSubtitle}
              imageUrl={activeImage}
              onEnded={handleAudioEnded}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Liste des podcasts */}
      <div className="card-premium p-6">
        <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
          <Podcast size={20} className="text-primary" /> Podcasts
        </h2>
        {podcasts.length === 0 ? (
          <p className="text-text-secondary italic">Aucun podcast pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {podcasts.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ scale: 1.02 }}
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer ${
                  activePodcastId === p.id
                    ? "bg-primary/5 border-primary/30"
                    : "bg-gray-50 dark:bg-white/5 border-border dark:border-white/10 hover:border-primary/30"
                }`}
                onClick={() => playPodcast(p)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Podcast size={20} className="text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-text font-medium">{p.title}</p>
                    <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                      <Clock size={12} />
                      {new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      {p.duration && <span>· {Math.floor(p.duration / 60)} min</span>}
                    </div>
                  </div>
                </div>
                <button
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition"
                  title={activePodcastId === p.id ? "Pause" : "Écouter"}
                >
                  {activePodcastId === p.id ? <Pause size={18} /> : <Play size={18} />}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}