"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus, Power, PowerOff, Trash2, Upload, Calendar, Link as LinkIcon } from "lucide-react";
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
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink] = useState("");
  const [priority, setPriority] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [active, setActive] = useState(true);
  const [creating, setCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ✅ On ne récupère que les spots (type=spot) pour cette page
  const { data: spots = [], isLoading } = useQuery<Spot[]>({
    queryKey: ["adminSpots"],
    queryFn: () => fetch("/api/admin/spots?type=spot").then(res => res.json()),
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
      toast.success("Spot créé");
      setTitle("");
      setImageUrl("");
      setLink("");
      setPriority(0);
      setStartDate("");
      setEndDate("");
      setActive(true);
      setImageFile(null);
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
    if (file) setImageFile(file);
  };

  const handleCreate = async () => {
    if (!title.trim()) return toast.error("Titre requis");
    if (!startDate || !endDate) return toast.error("Dates de début et de fin requises");
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
      } catch (err) {
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

  if (isLoading) return <Loader2 className="animate-spin text-primary mx-auto mt-10" size={32} />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-text dark:text-white">
        Gestion des spots publicitaires
      </h1>

      {/* Formulaire */}
      <div className="rounded-2xl bg-white dark:bg-white/5 border border-border dark:border-white/10 p-6">
        <h2 className="text-xl font-semibold text-text dark:text-white mb-4">
          Créer un spot
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Titre du spot"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 border border-border dark:border-white/10 text-text dark:text-white"
          />
          <div>
            <input
              type="text"
              placeholder="URL de l'image (ou utilisez l'upload)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 border border-border dark:border-white/10 text-text dark:text-white"
            />
            <div className="mt-2 flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary">
                <Upload size={16} />
                {imageFile ? imageFile.name : "Choisir un fichier image"}
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              {imageFile && (
                <button onClick={() => setImageFile(null)} className="text-xs text-red-400">Annuler</button>
              )}
            </div>
          </div>
          <input
            type="url"
            placeholder="Lien du bouton (optionnel)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 border border-border dark:border-white/10 text-text dark:text-white"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-text-secondary">Priorité (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 border border-border dark:border-white/10 text-text dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-secondary">Date de début</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 border border-border dark:border-white/10 text-text dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary">Date de fin</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 border border-border dark:border-white/10 text-text dark:text-white"
            />
          </div>
          <label className="flex items-center gap-2 text-text dark:text-white">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Actif immédiatement
          </label>
        </div>
        <div className="mt-4">
          <Button onClick={handleCreate} disabled={creating || uploading || createMutation.isPending} variant="primary">
            {uploading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Plus size={18} />
            )}
            {uploading ? "Upload..." : creating || createMutation.isPending ? "Création..." : "Publier le spot"}
          </Button>
        </div>
      </div>

      {/* Liste des spots */}
      <div className="rounded-2xl bg-white dark:bg-white/5 border border-border dark:border-white/10 p-6">
        <h2 className="text-xl font-semibold text-text dark:text-white mb-4">
          Spots existants ({spots.length})
        </h2>
        {spots.length === 0 ? (
          <p className="text-text-secondary italic">Aucun spot pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {spots.map((spot) => (
              <div
                key={spot.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 gap-4"
              >
                <div className="flex items-start gap-4">
                  {spot.imageUrl && (
                    <img src={spot.imageUrl} alt={spot.title} className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="font-medium text-text dark:text-white flex items-center gap-2">
                      {spot.title}
                      <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                        Publicité
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-text-secondary dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(spot.startDate).toLocaleDateString("fr-FR")} → {new Date(spot.endDate).toLocaleDateString("fr-FR")}
                      </span>
                      {spot.link && (
                        <span className="flex items-center gap-1">
                          <LinkIcon size={14} />
                          <a href={spot.link} target="_blank" className="underline">{spot.link}</a>
                        </span>
                      )}
                      <span>Priorité : {spot.priority}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end">
                  <button
                    onClick={() => toggleMutation.mutate({ spotId: spot.id, spotActive: spot.spotActive })}
                    className={`p-2 rounded-lg ${
                      spot.spotActive
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                    }`}
                    title={spot.spotActive ? "Désactiver" : "Activer"}
                  >
                    {spot.spotActive ? <Power size={16} /> : <PowerOff size={16} />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Supprimer ce spot ?")) deleteMutation.mutate(spot.id);
                    }}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}