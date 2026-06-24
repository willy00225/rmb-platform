"use client";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Spot {
  id: string;
  title: string;
  imageUrl?: string | null;
  mediaType?: string | null;
  link?: string | null;
  priority: number;
  startDate: string;
  endDate: string;
}

export function SpotCarousel() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/spots/active")
      .then((res) => res.json())
      .then((data: Spot[]) => {
        setSpots(data);
        setCurrent(0); // réinitialise l'index
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % spots.length);
  }, [spots.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + spots.length) % spots.length);
  }, [spots.length]);

  // Rotation automatique
  useEffect(() => {
    if (spots.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [spots.length, next]);

  // Protection : si pas de spots, on n'affiche rien
  if (loading || spots.length === 0) return null;

  // Sécurité : si l'index est invalide (ex. après un filtre), on retourne au premier
  const spot = spots[current];
  if (!spot) return null;

  return (
    <div className="relative w-full rounded-2xl bg-white dark:bg-surface border border-border dark:border-white/10 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-3 border-b border-border dark:border-white/10">
        <h3 className="text-sm font-semibold text-text dark:text-white">Sponsorisé</h3>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-text-secondary">{current + 1}/{spots.length}</span>
          <button onClick={next} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <a
        href={spot.link || "#"}
        target={spot.link ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="block p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition"
      >
        {spot.imageUrl && spot.mediaType === "video" ? (
          <div className="w-full h-32 rounded-xl overflow-hidden mb-3">
            <video autoPlay muted loop className="w-full h-full object-cover">
              <source src={spot.imageUrl} type="video/mp4" />
            </video>
          </div>
        ) : spot.imageUrl ? (
          <img
            src={spot.imageUrl}
            alt={spot.title}
            className="w-full h-32 object-cover rounded-xl mb-3"
          />
        ) : null}
        <h4 className="font-medium text-text dark:text-white text-sm">{spot.title}</h4>
      </a>
    </div>
  );
}