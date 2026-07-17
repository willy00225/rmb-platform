"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Upload,
  X,
  Loader2,
  ArrowLeft,
  Check,
  Pencil,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import toast from "react-hot-toast";

export default function NewStoryPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelection = useCallback((file: File) => {
    if (file.type.startsWith("image/")) {
      setMediaType("image");
    } else if (file.type.startsWith("video/")) {
      setMediaType("video");
    } else {
      toast.error("Format non supporté. Choisissez une image ou une vidéo.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 50 Mo.");
      return;
    }

    setFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFileSelection(selected);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) handleFileSelection(droppedFile);
    },
    [handleFileSelection]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setCaption("");
  };

  const handlePublish = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Échec de l'upload");
      const { url } = await uploadRes.json();

      const storyRes = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaUrl: url, mediaType, caption: caption.trim() || null }),
      });

      if (!storyRes.ok) throw new Error("Échec de la création de la story");

      toast.success("Story publiée !");
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de la publication.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="text-lg font-semibold">Créer une story</h1>
        <div className="w-10" />
      </div>

      {/* Zone d'aperçu ou d'upload */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full flex flex-col items-center justify-center p-4"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div
                className={`w-full max-w-md h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all group ${
                  dragOver
                    ? "border-primary bg-primary/10"
                    : "border-white/30 hover:border-white/60 bg-transparent"
                }`}
              >
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Camera size={36} className="text-white" />
                </div>
                <p className="text-white/80 font-medium">Appuyez pour prendre une photo</p>
                <p className="text-white/50 text-sm mt-2">
                  ou glissez-déposez une image / vidéo
                </p>
                <label className="mt-6 px-6 py-2.5 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium cursor-pointer transition">
                  Choisir un fichier
                  <input
                    type="file"
                    accept="image/*,video/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {mediaType === "image" ? (
                <img
                  src={preview}
                  alt="Aperçu"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <video
                  src={preview}
                  controls
                  className="max-w-full max-h-full object-contain rounded-lg"
                  autoPlay
                  muted
                  loop
                />
              )}

              {/* Contrôles sur la preview */}
              <div className="absolute top-4 right-4 flex gap-2">
                <label className="w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition backdrop-blur cursor-pointer">
                  <Pencil size={20} />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleRemove}
                  className="w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition backdrop-blur"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Nom du fichier */}
              {file && (
                <div className="absolute bottom-4 left-4 right-4 text-white/80 text-sm bg-black/50 backdrop-blur px-3 py-2 rounded-lg truncate">
                  {file.name}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Légende et bouton de publication */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="p-4 bg-black/80 backdrop-blur border-t border-white/10"
          >
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ajouter une légende..."
              rows={2}
              className="w-full resize-none rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-primary transition"
            />
            <div className="mt-3">
              <Button
                onClick={handlePublish}
                disabled={!file || uploading}
                variant="primary"
                size="lg"
                className="w-full h-12 rounded-xl text-base font-semibold"
              >
                {uploading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Check size={20} />
                )}
                <span className="ml-2">
                  {uploading ? "Publication en cours..." : "Publier la story"}
                </span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}