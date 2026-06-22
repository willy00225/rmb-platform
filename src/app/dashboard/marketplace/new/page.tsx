"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Loader2, Upload, X, MapPin, Tag } from "lucide-react";
import toast from "react-hot-toast";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price || !category) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("category", category);
    if (location) formData.append("location", location);
    images.forEach((img) => formData.append("images", img));

    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        toast.success("Produit publié avec succès !");
        router.push("/dashboard/marketplace");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la publication.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-text">Vendre un article</h1>
        <Button variant="ghost" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titre */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">Titre *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Mobilier de salon en bois massif"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Décrivez votre article en détail..."
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition resize-y"
            required
          />
        </div>

        {/* Prix et Catégorie */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Prix (FCFA) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Catégorie *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-border dark:border-white/10 text-text focus:outline-none focus:border-primary transition"
              required
            >
              <option value="">Sélectionner...</option>
              <option value="agriculture">Agriculture</option>
              <option value="artisanat">Artisanat</option>
              <option value="immobilier">Immobilier</option>
              <option value="vehicules">Véhicules</option>
              <option value="emploi">Emploi</option>
              <option value="electronique">Électronique</option>
              <option value="mode">Mode</option>
              <option value="services">Services</option>
            </select>
          </div>
        </div>

        {/* Localisation */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">Localisation</label>
          <div className="relative">
            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Abidjan, Cocody"
              className="w-full pl-10 px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
            />
          </div>
        </div>

        {/* Upload images */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">Images</label>
          <div
            className="border-2 border-dashed border-border dark:border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-primary transition bg-white dark:bg-white/5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} className="mx-auto text-text-secondary" />
            <p className="mt-2 text-text-secondary">Cliquez ou glissez pour ajouter des images</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>
          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {previews.map((src, index) => (
                <div key={index} className="relative rounded-xl overflow-hidden border border-border dark:border-white/10">
                  <img src={src} alt={`Aperçu ${index + 1}`} className="w-full h-32 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Boutons */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" variant="primary" size="lg" isLoading={loading} className="flex-1">
            <Tag size={18} /> Publier l’article
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}