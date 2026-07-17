"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  Plus,
  Power,
  PowerOff,
  Trash2,
  Upload,
  Calendar,
  Link as LinkIcon,
  Image as ImageIcon,
  Tag,
  Megaphone,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

interface Spot {
  id: string;
  title: string;
  imageUrl?: string;
  link?: string;
  startDate: string;
  endDate: string;
  priority: number;
  spotActive: boolean;
  createdAt: string;
}

export default function AdminSpotsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink] = useState("");
  const [priority, setPriority] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: spots = [], isLoading, isError } = useQuery<Spot[]>({
    queryKey: ["adminSpots"],
    queryFn: () => fetch("/api/admin/spots?type=spot").then((res) => res.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/spots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur lors de la création");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Spot créé avec succès !");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["adminSpots"] });
    },
    onError: () => toast.error("Erreur"),
    onSettled: () => setCreating(false),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ spotId, spotActive }: { spotId: string; spotActive: boolean }) => {
      const res = await fetch(`/api/admin/spots/${spotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotActive: !spotActive }),
      });
      if (!res.ok) throw new Error("Erreur");
      return { spotId, newActive: !spotActive };
    },
    onSuccess: (data) => {
      toast.success(data.newActive ? "Spot activé" : "Spot désactivé");
      queryClient.invalidateQueries({ queryKey: ["adminSpots"] });
    },
    onError: () => toast.error("Erreur"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (spotId: string) => {
      const res = await fetch(`/api/admin/spots/${spotId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur");
      return spotId;
    },
    onSuccess: () => {
      toast.success("Spot supprimé");
      queryClient.invalidateQueries({ queryKey: ["adminSpots"] });
    },
    onError: () => toast.error("Erreur"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5 Mo.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Le titre est requis";
    if (!startDate) errs.startDate = "La date de début est requise";
    if (!endDate) errs.endDate = "La date de fin est requise";
    else if (new Date(endDate) <= new Date(startDate))
      errs.endDate = "La date de fin doit être après la date de début";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setCreating(true);
    let finalImageUrl = imageUrl.trim();

    if (imageFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          finalImageUrl = url;
        } else {
          toast.error("Échec de l'upload de l'image");
          setCreating(false);
          setUploading(false);
          return;
        }
      } catch {
        toast.error("Erreur réseau lors de l'upload");
        setCreating(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    createMutation.mutate({
      title: title.trim(),
      imageUrl: finalImageUrl,
      link: link.trim() || null,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      priority: priority,
      active,
    });
  };

  const resetForm = () => {
    setTitle("");
    setImageUrl("");
    setLink("");
    setPriority(0);
    setStartDate("");
    setEndDate("");
    setActive(true);
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
  };

  const activeSpots = spots.filter((s) => s.spotActive).length;
  const upcomingSpots = spots.filter((s) => new Date(s.startDate) > new Date()).length;

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-text-secondary animate-pulse">Chargement des spots...</p>
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-20 text-red-500">
        Erreur de chargement. Veuillez réessayer.
      </div>
    );

  return (
    <div className="space-y-8 animate-fadeInUp pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
              <Megaphone size={22} className="text-purple-600 dark:text-purple-400" />
            </div>
            Gestion des spots publicitaires
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {activeSpots} spot{activeSpots > 1 ? "s" : ""} actif{activeSpots > 1 ? "s" : ""} · {upcomingSpots} à venir
          </p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); resetForm(); }} variant="primary">
          <Plus size={18} /> Créer un spot
        </Button>
      </div>

      {/* Formulaire de création */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="card-premium p-6 space-y-5">
              <h2 className="text-xl font-semibold text-text flex items-center gap-2">
                <Plus size={20} className="text-primary" />
                Nouveau spot publicitaire
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-text mb-2 block">
                    Titre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nom du spot"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border ${
                      errors.title ? "border-red-500" : "border-border dark:border-white/10"
                    } text-text placeholder-text-secondary focus:outline-none focus:border-primary transition`}
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-text mb-2 block">Image</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="URL de l'image"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
                    />
                    <label className="cursor-pointer p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition flex items-center justify-center">
                      <Upload size={18} className="text-text-secondary" />
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                  {imagePreview && (
                    <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden">
                      <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                      <button
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-0 right-0 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-text mb-2 block">Lien du bouton</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-text mb-2 block">Priorité (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={priority}
                    onChange={(e) => setPriority(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text focus:outline-none focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-text mb-2 block">
                    Date de début <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border ${
                      errors.startDate ? "border-red-500" : "border-border dark:border-white/10"
                    } text-text focus:outline-none focus:border-primary transition`}
                  />
                  {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-text mb-2 block">
                    Date de fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border ${
                      errors.endDate ? "border-red-500" : "border-border dark:border-white/10"
                    } text-text focus:outline-none focus:border-primary transition`}
                  />
                  {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm text-text">Actif immédiatement</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating || uploading || createMutation.isPending}
                  variant="primary"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  <span className="ml-2">
                    {uploading ? "Upload..." : creating || createMutation.isPending ? "Création..." : "Publier le spot"}
                  </span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des spots */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6"
      >
        <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
          <Megaphone size={20} className="text-primary" />
          Spots existants ({spots.length})
        </h2>

        {spots.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon size={32} className="mx-auto mb-2 text-text-secondary opacity-40" />
            <p className="text-text-secondary italic">Aucun spot pour le moment.</p>
            <Button onClick={() => setShowForm(true)} variant="secondary" className="mt-4">
              <Plus size={16} /> Créer un spot
            </Button>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.06 },
              },
            }}
            className="space-y-4"
          >
            {spots.map((spot) => {
              const isExpired = new Date(spot.endDate) < new Date();
              const isUpcoming = new Date(spot.startDate) > new Date();

              return (
                <motion.div
                  key={spot.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all ${
                    isExpired
                      ? "bg-gray-50 dark:bg-white/5 border-border dark:border-white/10 opacity-60"
                      : spot.spotActive
                      ? "bg-green-50/30 dark:bg-green-500/5 border-green-200 dark:border-green-500/20"
                      : "bg-gray-50 dark:bg-white/5 border-border dark:border-white/10"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {spot.imageUrl ? (
                      <img src={spot.imageUrl} alt={spot.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                        <ImageIcon size={24} className="text-text-secondary" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-text">{spot.title}</p>
                        {isExpired && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                            Expiré
                          </span>
                        )}
                        {isUpcoming && !isExpired && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                            À venir
                          </span>
                        )}
                        {spot.spotActive && !isExpired && !isUpcoming && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400">
                            En cours
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                          Publicité
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(spot.startDate).toLocaleDateString("fr-FR")} →{" "}
                          {new Date(spot.endDate).toLocaleDateString("fr-FR")}
                        </span>
                        {spot.link && (
                          <span className="flex items-center gap-1">
                            <LinkIcon size={14} />
                            <a href={spot.link} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                              Lien
                            </a>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Tag size={14} />
                          Priorité {spot.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center mt-3 md:mt-0">
                    <button
                      onClick={() => toggleMutation.mutate({ spotId: spot.id, spotActive: spot.spotActive })}
                      disabled={toggleMutation.isPending}
                      className={`p-2 rounded-lg transition ${
                        spot.spotActive
                          ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30"
                          : "bg-gray-100 dark:bg-white/10 text-text-secondary hover:bg-gray-200 dark:hover:bg-white/20"
                      }`}
                      title={spot.spotActive ? "Désactiver" : "Activer"}
                    >
                      {spot.spotActive ? <Power size={16} /> : <PowerOff size={16} />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Supprimer définitivement ce spot ?")) {
                          deleteMutation.mutate(spot.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition"
                      title="Supprimer"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}