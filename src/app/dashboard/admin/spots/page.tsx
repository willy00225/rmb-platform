"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus, Power, PowerOff, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSpotsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink] = useState("");
  const [active, setActive] = useState(true);
  const [creating, setCreating] = useState(false);

  const { data: spots = [], isLoading } = useQuery({
    queryKey: ["adminSpots"],
    queryFn: () => fetch("/api/admin/spots").then(res => res.json()),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/spots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, imageUrl, link, active }),
      });
      if (!res.ok) throw new Error("Erreur lors de la création");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Spot créé");
      setTitle("");
      setImageUrl("");
      setLink("");
      setActive(true);
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
      if (!res.ok) throw new Error("Erreur lors de la modification");
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
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      return spotId;
    },
    onSuccess: () => {
      toast.success("Spot supprimé");
      queryClient.invalidateQueries({ queryKey: ["adminSpots"] });
    },
    onError: () => toast.error("Erreur"),
  });

  const handleCreate = () => {
    if (!title.trim()) return toast.error("Titre requis");
    setCreating(true);
    createMutation.mutate();
  };

  if (isLoading) return <Loader2 className="animate-spin text-brand-500 mx-auto mt-10" size={32} />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-white">Spots & Annonces</h1>

      {/* Formulaire de création */}
      <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Créer un nouveau spot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Titre du spot"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
          />
          <input
            type="text"
            placeholder="URL de l'image (https://...)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
          />
          <input
            type="text"
            placeholder="Lien du bouton (optionnel)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
          />
          <label className="flex items-center gap-2 text-white">
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
          <Button onClick={handleCreate} disabled={creating || createMutation.isPending} variant="primary">
            <Plus size={18} />
            {creating || createMutation.isPending ? "Création..." : "Publier le spot"}
          </Button>
        </div>
      </div>

      {/* Liste des spots */}
      <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Spots existants</h2>
        {spots.length === 0 ? (
          <p className="text-gray-500 italic">Aucun spot pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {spots.map((spot: any) => (
              <div key={spot.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-4">
                  {spot.imageUrl && (
                    <img src={spot.imageUrl} alt={spot.title} className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="text-white font-medium">{spot.title}</p>
                    <p className="text-sm text-gray-400">
                      {spot.link && <a href={spot.link} target="_blank" className="text-brand-400 underline">{spot.link}</a>}
                    </p>
                    <p className="text-xs text-gray-500">
                      Créé le {new Date(spot.createdAt).toLocaleDateString("fr-FR")}
                      {spot.spotActive ? " • Actif" : " • Inactif"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleMutation.mutate({ spotId: spot.id, spotActive: spot.spotActive })}
                    className={`p-2 rounded-lg ${spot.spotActive ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"}`}
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