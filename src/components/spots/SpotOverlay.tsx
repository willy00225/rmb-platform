"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock } from "lucide-react";

// Utilitaire pour extraire l'ID YouTube
function extractYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

interface Spot {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  mediaType?: string | null; // "image" ou "video"
  startDate: string;
  endDate: string;
}

export function SpotOverlay() {
  const [spot, setSpot] = useState<Spot | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/spots/active")
      .then(res => res.json())
      .then((data: Spot[]) => {
        if (data.length > 0) {
          const firstSpot = data[0];
          const key = `spot_dismissed_${firstSpot.id}_${new Date().toDateString()}`;
          const alreadyDismissed = localStorage.getItem(key);
          if (!alreadyDismissed) {
            setSpot(firstSpot);
            setVisible(true);
          }
        }
      });
  }, []);

  const handleDismiss = () => {
    if (spot) {
      localStorage.setItem(`spot_dismissed_${spot.id}_${new Date().toDateString()}`, "true");
      setVisible(false);
      setTimeout(() => setSpot(null), 300);
    }
  };

  const handleAction = () => {
    if (spot?.description) {
      window.open(spot.description, "_blank");
    }
  };

  return (
    <AnimatePresence>
      {visible && spot && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full rounded-2xl overflow-hidden bg-surface-dark border border-white/20 shadow-2xl"
          >
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
            >
              <X size={18} />
            </button>

            {/* Bloc média amélioré */}
            {spot.imageUrl && spot.mediaType === "video" ? (
              <div className="w-full h-64 md:h-80 relative">
                {spot.imageUrl.includes("youtube.com") || spot.imageUrl.includes("youtu.be") ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(spot.imageUrl)}?autoplay=1&mute=1`}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <video autoPlay muted loop className="w-full h-full object-cover">
                    <source src={spot.imageUrl} type="video/mp4" />
                    Votre navigateur ne supporte pas la vidéo.
                  </video>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-dark to-transparent" />
              </div>
            ) : spot.imageUrl ? (
              <img
                src={spot.imageUrl}
                alt={spot.title}
                className="w-full h-64 md:h-80 object-cover"
              />
            ) : null}

            <div className="p-8">
              <h2 className="text-3xl font-display font-bold text-white mb-4">{spot.title}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Clock size={16} />
                <span>
                  {new Date(spot.startDate).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {" - "}
                  {new Date(spot.endDate).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex gap-4">
                {spot.description && (
                  <button
                    onClick={handleAction}
                    className="px-6 py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition"
                  >
                    En savoir plus
                  </button>
                )}
                <button
                  onClick={handleDismiss}
                  className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
