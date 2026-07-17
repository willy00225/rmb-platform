"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import {
  Loader2, ArrowLeft, Upload, Camera, Globe, MapPin, Phone, ChevronDown, Save
} from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Entreprise",
  "Média / Actualité",
  "Artiste / Groupe",
  "Association",
  "Éducation",
  "Santé",
  "Commerce",
  "Marque",
  "Personnage public",
  "Autre",
];

interface PageData {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  coverImage?: string | null;
  website?: string | null;
  location?: string | null;
  whatsappNumber?: string | null;
  category?: string | null;
}

export default function EditPagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Récupération de la page
  const { data: page, isLoading, error } = useQuery<PageData>({
    queryKey: ["page", id],
    queryFn: () => fetch(`/api/pages/${id}`).then((res) => {
      if (!res.ok) throw new Error("Page introuvable");
      return res.json();
    }),
  });

  // États du formulaire
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Images
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  // Pré-remplissage une fois les données chargées
  useEffect(() => {
    if (page) {
      setName(page.name);
      setDescription(page.description || "");
      setCategory(page.category || CATEGORIES[0]);
      setWebsite(page.website || "");
      setLocation(page.location || "");
      setWhatsappNumber(page.whatsappNumber || "");
      setCoverPreview(page.coverImage || null);
      setAvatarPreview(page.imageUrl || null);
    }
  }, [page]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5 Mo");
        return;
      }
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        return url;
      }
    } catch (err) {
      console.error("Upload failed", err);
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setSaving(true);

    try {
      // Upload des nouvelles images si modifiées
      let finalCover = page?.coverImage || null;
      let finalAvatar = page?.imageUrl || null;

      if (coverFile) {
        const url = await uploadFile(coverFile);
        if (url) finalCover = url;
      }
      if (avatarFile) {
        const url = await uploadFile(avatarFile);
        if (url) finalAvatar = url;
      }

      const res = await fetch(`/api/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          website: website.trim() || null,
          location: location.trim() || null,
          whatsappNumber: whatsappNumber.trim() || null,
          imageUrl: finalAvatar,
          coverImage: finalCover,
        }),
      });

      if (res.ok) {
        toast.success("Page mise à jour !");
        queryClient.invalidateQueries({ queryKey: ["page", id] });
        queryClient.invalidateQueries({ queryKey: ["my-pages"] });
        router.push(`/dashboard/pages/${id}`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">Page introuvable.</p>
        <Button variant="secondary" onClick={() => router.back()} className="mt-4">Retour</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeInUp py-8 px-4">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="text-primary hover:underline text-sm flex items-center gap-1">
          <ArrowLeft size={16} /> Retour
        </button>
        <h1 className="text-2xl font-display font-bold text-text">Modifier la page</h1>
        <div /> {/* spacer */}
      </div>

      <div className="card-premium p-6 space-y-8">
        {/* Visuels */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Visuels</h3>

          <div>
            <label className="text-xs text-text-secondary mb-1 block">Bannière</label>
            <div
              className="relative h-44 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-border dark:border-white/10 overflow-hidden cursor-pointer hover:border-primary transition group"
              onClick={() => document.getElementById("coverInput")?.click()}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Bannière" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-text-secondary group-hover:text-primary transition">
                  <Camera size={32} className="mb-2" />
                  <span className="text-sm">Ajouter une bannière</span>
                </div>
              )}
            </div>
            <input
              id="coverInput"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setCoverFile, setCoverPreview)}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-full bg-primary/10 border-2 border-dashed border-border dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-primary transition shrink-0 overflow-hidden"
              onClick={() => document.getElementById("avatarInput")?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Upload size={20} className="text-text-secondary" />
              )}
            </div>
            <div>
              <p className="text-sm text-text font-medium">Photo de profil</p>
              <p className="text-xs text-text-secondary">Format carré recommandé</p>
            </div>
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setAvatarFile, setAvatarPreview)}
              className="hidden"
            />
          </div>
        </div>

        <hr className="border-border dark:border-white/10" />

        {/* Informations */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Informations</h3>

          <div>
            <label className="text-sm text-text-secondary">Nom de la page *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mon Entreprise"
              className="w-full mt-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text focus:outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary">Catégorie</label>
            <div className="relative mt-1">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text appearance-none cursor-pointer focus:outline-none focus:border-primary transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre page en quelques mots..."
              rows={3}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text resize-y focus:outline-none focus:border-primary transition"
            />
          </div>
        </div>

        <hr className="border-border dark:border-white/10" />

        {/* Contact */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Contact</h3>

          <div>
            <label className="text-sm text-text-secondary flex items-center gap-1">
              <Globe size={14} /> Site web
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.monsite.com"
              className="w-full mt-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text focus:outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary flex items-center gap-1">
              <MapPin size={14} /> Localisation
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ville, Pays"
              className="w-full mt-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text focus:outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary flex items-center gap-1">
              <Phone size={14} /> WhatsApp
            </label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+225 07 00 00 00 00"
              className="w-full mt-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text focus:outline-none focus:border-primary transition"
            />
            <p className="text-xs text-text-secondary mt-1">Un bouton de contact apparaîtra sur votre page</p>
          </div>
        </div>

        <hr className="border-border dark:border-white/10" />

        <Button
          onClick={handleSubmit}
          disabled={saving}
          variant="primary"
          size="lg"
          className="w-full"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          <span className="ml-2">{saving ? "Enregistrement..." : "Enregistrer les modifications"}</span>
        </Button>
      </div>
    </div>
  );
}