"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus, Radio, Users, Eye, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface LiveRoom {
  id: string;
  title: string;
  host: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
}

const LIVES_PER_PAGE = 6;

export default function LiveListPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState<"all" | "friends">("all");
  const [page, setPage] = useState(1);

  // Récupération des lives
  const { data: lives = [], isLoading } = useQuery<LiveRoom[]>({
    queryKey: ["lives"],
    queryFn: () => fetch("/api/live/rooms").then((res) => res.json()),
    refetchInterval: 15000, // actualisation automatique toutes les 15s
  });

  // Récupération des amis (pour le filtre)
  const { data: friends = [] } = useQuery<{ id: string }[]>({
    queryKey: ["friends", "accepted"],
    queryFn: () => fetch("/api/friends?status=ACCEPTED").then((res) => res.json()),
    enabled: filter === "friends",
  });

  const friendIds = new Set(friends.map((f: any) => f.friend?.id).filter(Boolean));

  // Filtrage
  const filteredLives =
    filter === "friends"
      ? lives.filter((live) => live.host && friendIds.has(live.host.id))
      : lives;

  // Pagination
  const totalPages = Math.ceil(filteredLives.length / LIVES_PER_PAGE);
  const paginatedLives = filteredLives.slice(
    (page - 1) * LIVES_PER_PAGE,
    page * LIVES_PER_PAGE
  );

  const createLiveMutation = useMutation({
    mutationFn: () =>
      fetch("/api/live/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      }).then((res) => {
        if (!res.ok) throw new Error("Erreur");
        return res.json();
      }),
    onSuccess: (data) => {
      toast.success("Live créé !");
      setTitle("");
      setDescription("");
      // Redirection directe vers le live
      if (data.liveId) {
        window.location.href = `/dashboard/live/${data.liveId}`;
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
    <div className="space-y-6 h-full flex flex-col">
      {/* En-tête avec bouton de création */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-text">Lives</h1>
        <Button onClick={handleCreate} disabled={createLiveMutation.isPending} variant="primary">
          <Plus size={18} /> Lancer un live
        </Button>
      </div>

      {/* Formulaire rapide de création */}
      <div className="card-premium p-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Titre du live"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary"
        />
        <Button
          onClick={handleCreate}
          disabled={createLiveMutation.isPending || !title.trim()}
          variant="primary"
          className="sm:w-auto"
        >
          {createLiveMutation.isPending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Plus size={18} />
          )}
          <span className="ml-2">{createLiveMutation.isPending ? "Création..." : "Démarrer"}</span>
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-3">
        <button
          onClick={() => { setFilter("all"); setPage(1); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            filter === "all"
              ? "bg-primary text-white"
              : "bg-gray-100 dark:bg-white/5 text-text-secondary hover:bg-gray-200 dark:hover:bg-white/10"
          }`}
        >
          <Radio size={16} className="inline mr-1" /> Tous
        </button>
        <button
          onClick={() => { setFilter("friends"); setPage(1); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            filter === "friends"
              ? "bg-primary text-white"
              : "bg-gray-100 dark:bg-white/5 text-text-secondary hover:bg-gray-200 dark:hover:bg-white/10"
          }`}
        >
          <UserCheck size={16} className="inline mr-1" /> Amis
        </button>
        <span className="ml-auto text-sm text-text-secondary self-center">
          {filteredLives.length} live{filteredLives.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Liste des lives */}
      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : paginatedLives.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-text-secondary">
          <Radio size={48} className="mb-4 opacity-50" />
          <p>Aucun live en cours.</p>
          <p className="text-sm mt-1">Soyez le premier à lancer un direct !</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedLives.map((live) => (
              <Link key={live.id} href={`/dashboard/live/${live.id}`}>
                <div className="card-premium p-4 hover:shadow-lg transition group relative overflow-hidden">
                  {/* Simulacre de miniature (dégradé animé) */}
                  <div className="w-full h-32 rounded-xl bg-gradient-to-br from-red-500/20 via-primary/20 to-secondary/20 mb-3 flex items-center justify-center relative">
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                    </span>
                    <Eye size={32} className="text-text-secondary/50 group-hover:scale-110 transition" />
                  </div>
                  <h3 className="font-semibold text-text truncate">{live.title}</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    {live.host?.firstName} {live.host?.lastName}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="ghost"
                size="sm"
              >
                Précédent
              </Button>
              <span className="flex items-center text-text-secondary text-sm">
                {page} / {totalPages}
              </span>
              <Button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                variant="ghost"
                size="sm"
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}