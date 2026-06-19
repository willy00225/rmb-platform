"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus, Radio, Users } from "lucide-react";
import toast from "react-hot-toast";

export default function LiveListPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Récupération des lives
  const { data: lives = [], isLoading } = useQuery({
    queryKey: ["lives"],
    queryFn: () => fetch("/api/live/rooms").then(res => res.json()),
  });

  // Mutation pour créer un live
  const createLiveMutation = useMutation({
    mutationFn: () =>
      fetch("/api/live/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      }).then(res => {
        if (!res.ok) throw new Error("Erreur lors de la création");
        return res.json();
      }),
    onSuccess: (data) => {
      toast.success("Live créé !");
      if (data.url) {
        window.location.href = data.url;
      }
      queryClient.invalidateQueries({ queryKey: ["lives"] });
    },
    onError: () => toast.error("Erreur"),
  });

  const handleCreate = () => {
    if (!title.trim()) return;
    createLiveMutation.mutate();
  };

  return (
    <div className="space-y-8 animate-fadeInUp">
      <h1 className="text-3xl font-display font-bold text-text">Lives</h1>

      <div className="p-6 rounded-[var(--radius-card)] bg-white border border-border shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Radio size={20} className="text-primary" /> Lancer un direct
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Titre du live"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:outline-none focus:border-primary"
          />
          <input
            type="text"
            placeholder="Description (optionnelle)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:outline-none focus:border-primary"
          />
        </div>
        <Button
          onClick={handleCreate}
          disabled={createLiveMutation.isPending}
          className="mt-4"
          variant="primary"
        >
          <Plus size={16} /> {createLiveMutation.isPending ? "Création..." : "Créer le live"}
        </Button>
      </div>

      <div className="rounded-[var(--radius-card)] bg-white border border-border shadow-[var(--shadow-card)] p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Lives en cours</h2>
        {isLoading ? (
          <Loader2 className="animate-spin text-primary mx-auto" size={24} />
        ) : lives.length === 0 ? (
          <p className="text-text-secondary italic">Aucun live actuellement.</p>
        ) : (
          <div className="space-y-3">
            {lives.map((live: any) => (
              <Link key={live.id} href={`/dashboard/live/${live.id}`}>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                  <div>
                    <p className="text-text font-medium">{live.title}</p>
                    <p className="text-sm text-text-secondary">Par {live.host?.firstName} {live.host?.lastName}</p>
                  </div>
                  <span className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">EN DIRECT</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}