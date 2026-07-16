"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, RotateCw, AlertCircle } from "lucide-react";

interface MediaViewerProps {
  open: boolean;
  onClose: () => void;
  src: string;
  type?: string; // "image" ou "video"
  caption?: string; // ✅ légende optionnelle
}

export function MediaViewer({
  open,
  onClose,
  src,
  type = "image",
  caption,
}: MediaViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Fermeture avec la touche Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // Bloquer le scroll du body quand la modale est ouverte
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Réinitialiser les états à l'ouverture
  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(false);
      setZoom(1);
      setRotation(0);
    }
  }, [open, src]);

  const handleMediaLoad = useCallback(() => setLoading(false), []);
  const handleMediaError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 3));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.5, 0.5));
  const rotate = () => setRotation((prev) => prev + 90);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={type === "video" ? "Visionneuse vidéo" : "Visionneuse image"}
        >
          {/* Barre d'outils supérieure */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {type === "image" && !error && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    zoomOut();
                  }}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                  title="Zoom arrière"
                >
                  <ZoomOut size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    zoomIn();
                  }}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                  title="Zoom avant"
                >
                  <ZoomIn size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    rotate();
                  }}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                  title="Pivoter"
                >
                  <RotateCw size={20} />
                </button>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
              title="Fermer"
            >
              <X size={24} />
            </button>
          </div>

          {/* Contenu média */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}

            {error ? (
              <div className="flex flex-col items-center text-white/80 gap-2">
                <AlertCircle size={48} />
                <p className="text-sm">Impossible de charger le média</p>
              </div>
            ) : type === "video" ? (
              <video
                controls
                autoPlay
                className="w-full max-h-[90vh] object-contain rounded-xl"
                onLoadedData={handleMediaLoad}
                onError={handleMediaError}
              >
                <source src={src} type="video/mp4" />
                Votre navigateur ne supporte pas la vidéo.
              </video>
            ) : (
              <img
                src={src}
                alt={caption || ""}
                className="w-full max-h-[90vh] object-contain rounded-xl transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  display: loading ? "none" : "block",
                }}
                onLoad={handleMediaLoad}
                onError={handleMediaError}
                draggable={false}
              />
            )}
          </motion.div>

          {/* Légende (si fournie) */}
          {caption && !error && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[80%] text-center">
              <p className="text-white/80 text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur">
                {caption}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}