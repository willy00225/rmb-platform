"use client";

export const dynamic = 'force-dynamic'; // Désactive le prérendu

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  Upload,
  X,
  MapPin,
  Tag,
  ImagePlus,
  FileText,
  DollarSign,
  Layers,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = [
  { value: "agriculture", label: "Agriculture" },
  { value: "artisanat", label: "Artisanat" },
  { value: "immobilier", label: "Immobilier" },
  { value: "vehicules", label: "Véhicules" },
  { value: "emploi", label: "Emploi" },
  { value: "electronique", label: "Électronique" },
  { value: "mode", label: "Mode" },
  { value: "services", label: "Services" },
] as const;

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 10;

  const addImages = useCallback(
    (files: FileList | File[]) => {
      const newFiles = Array.from(files).filter(
        (f) => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024
      );
      if (newFiles.length + images.length > MAX_IMAGES) {
        toast.error(`Maximum ${MAX_IMAGES} images.`);
        return;
      }
      const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
      setImages((prev) => [...prev, ...newFiles]);
      setPreviews((prev) => [...prev, ...newPreviews]);
    },
    [images.length]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addImages(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addImages(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Nouvelle fonction pour téléverser les images une par une
  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    const urls: string[] = [];
    for (const img of images) {
      const formData = new FormData();
      formData.append("file", img);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Échec du téléversement d'une image");
      const { url } = await res.json();
      urls.push(url);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price || !category) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    try {
      // 1. Téléverser les images et obtenir les URLs
      const imageUrls = await uploadImages();

      // 2. Envoyer les données en JSON
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          category,
          location: location || null,
          condition: "new",
          images: imageUrls,
        }),
      });

      if (res.ok) {
        toast.success("Produit publié avec succès !");
        router.push("/dashboard/marketplace");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la publication.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du téléversement ou de la publication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeInUp py-8 px-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition"
        >
          <ArrowLeft size={18} />
          Retour
        </button>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-text">
          Vendre un article
        </h1>
        <div className="w-16" />
      </div>

      <form onSubmit={handleSubmit} className="card-premium p-6 md:p-8 space-y-8">
        {/* Titre */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
            <FileText size={16} className="text-primary" />
            Titre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Mobilier de salon en bois massif"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
            <FileText size={16} className="text-primary" />
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Décrivez votre article en détail..."
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition resize-y"
            required
          />
          <p className="text-xs text-text-secondary mt-1 text-right">
            {description.length}/2000
          </p>
        </div>

        {/* Prix et Catégorie */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
              <DollarSign size={16} className="text-primary" />
              Prix (FCFA) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
              required
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
              <Layers size={16} className="text-primary" />
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text focus:outline-none focus:border-primary transition"
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Localisation */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
            <MapPin size={16} className="text-primary" />
            Localisation
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex: Abidjan, Cocody"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
          />
        </div>

        {/* Upload images */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text mb-2">
            <ImagePlus size={16} className="text-primary" />
            Images ({images.length}/{MAX_IMAGES})
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-primary/50"
            }`}
          >
            <Upload size={36} className="mx-auto text-text-secondary mb-2" />
            <p className="text-text-secondary font-medium">
              Glissez-déposez vos images ici
            </p>
            <p className="text-text-secondary text-xs mt-1">
              ou cliquez pour parcourir
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>

          <AnimatePresence>
            {previews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
              >
                {previews.map((src, index) => (
                  <motion.div
                    key={src}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="relative rounded-xl overflow-hidden aspect-square bg-gray-100 dark:bg-white/5 group"
                  >
                    <img
                      src={src}
                      alt={`Aperçu ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
                    >
                      <X size={14} />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        Principale
                      </span>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-border dark:border-white/10">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Tag size={18} />
            )}
            <span className="ml-2">
              {loading ? "Publication..." : "Publier l'article"}
            </span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}