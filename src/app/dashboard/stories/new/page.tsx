"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Loader2, ArrowLeft, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function NewStoryPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type.startsWith("image/")) {
      setMediaType("image");
    } else if (selected.type.startsWith("video/")) {
      setMediaType("video");
    } else {
      toast.error("Format non supporté. Choisissez une image ou une vidéo.");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
  };

  const handlePublish = async () => {
    if (!file) return;
    setUploading(true);

    try {
      // Upload du fichier
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Échec de l'upload");
      const { url } = await uploadRes.json();

      // Création de la story
      const storyRes = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaUrl: url, mediaType }),
      });

      if (!storyRes.ok) throw new Error("Échec de la création de la story");

      toast.success("Story publiée !");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la publication.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-bkg">
      {/* Header mobile */}
      <div className="sticky top-0 z-10 bg-bkg/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5"
        >
          <ArrowLeft size={20} className="text-text" />
        </button>
        <h1 className="text-lg font-semibold text-text">Nouvelle story</h1>
        <div className="w-10" /> {/* pour centrer le titre */}
      </div>

      {/* Contenu principal */}
      <div className="flex-1 p-4 flex flex-col">
        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.label
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl cursor-pointer hover:border-primary/50 transition group"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Camera size={36} className="text-primary" />
              </div>
              <p className="text-text-secondary font-medium">Appuyez pour prendre une photo</p>
              <p className="text-text-secondary text-sm mt-1">ou choisissez une vidéo</p>
              <input
                type="file"
                accept="image/*,video/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </motion.label>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 relative rounded-3xl overflow-hidden bg-black"
            >
              {mediaType === "image" ? (
                <img
                  src={preview}
                  alt="Aperçu"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={preview}
                  controls
                  className="w-full h-full object-contain"
                  autoPlay
                  muted
                />
              )}
              <button
                onClick={handleRemove}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition backdrop-blur"
              >
                <X size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer avec bouton de publication */}
        <div className="mt-4">
          <Button
            onClick={handlePublish}
            disabled={!file || uploading}
            variant="primary"
            size="lg"
            className="w-full h-14 rounded-2xl text-base"
          >
            {uploading ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <Check size={22} />
            )}
            <span className="ml-2">
              {uploading ? "Publication..." : "Publier la story"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}