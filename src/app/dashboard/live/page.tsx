"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  Plus,
  Radio,
  Eye,
  UserCheck,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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

  const { data: lives = [], isLoading } = useQuery<LiveRoom[]>({
    queryKey: ["lives"],
    queryFn: () => fetch("/api/live/rooms").then((res) => res.json()),
    refetchInterval: 15000,
  });

  const { data: friends = [] } = useQuery<{ id: string }[]>({
    queryKey: ["friends", "accepted"],
    queryFn: () => fetch("/api/friends?status=ACCEPTED").then((res) => res.json()),
    enabled: filter === "friends",
  });

  const friendIds = new Set(friends.map((f: any) => f.friend?.id).filter(Boolean));

  const filteredLives =
    filter === "friends"
      ? lives.filter((live) => live.host && friendIds.has(live.host.id))
      : lives;

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
    <div className="space-y-6 h-full flex flex-col animate-fadeInUp pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Lives
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Rejoignez des directs ou lancez le vôtre
          </p>
        </div>
        <Button onClick={handleCreate} disabled={createLiveMutation.isPending} variant="primary" size="lg">
          <Plus size={18} /> Lancer un live
        </Button>
      </div>

      {/* Formulaire rapide de création */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-4 flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          placeholder="Titre du live"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
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
      </motion.div>

      {/* Filtres et compteur */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => { setFilter("all"); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-white dark:bg-surface text-text shadow-sm"
                : "text-text-secondary hover:text-text"
            }`}
          >
            <Users size={16} /> Tous
          </button>
          <button
            onClick={() => { setFilter("friends"); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "friends"
                ? "bg-white dark:bg-surface text-text shadow-sm"
                : "text-text-secondary hover:text-text"
            }`}
          >
            <UserCheck size={16} /> Amis
          </button>
        </div>
        <span className="text-sm text-text-secondary">
          {filteredLives.length} live{filteredLives.length > 1 ? "s" : ""} en cours
        </span>
      </div>

      {/* Liste des lives */}
      {isLoading ? (
        <div className="flex-1 flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : paginatedLives.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center text-text-secondary py-20"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Radio size={36} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Aucun live en cours</h2>
          <p className="text-text-secondary max-w-md">
            Soyez le premier à lancer un direct et à rassembler la communauté !
          </p>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08 },
              },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {paginatedLives.map((live) => (
              <motion.div
                key={live.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ y: -4 }}
              >
                <Link href={`/dashboard/live/${live.id}`}>
                  <div className="card-premium p-0 overflow-hidden hover:shadow-lg transition-shadow group">
                    {/* Miniature */}
                    <div className="w-full h-40 bg-gradient-to-br from-red-500/20 via-primary/20 to-secondary/20 relative flex items-center justify-center">
                      <span className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-bold rounded-full bg-red-500 text-white animate-pulse flex items-center gap-1.5 shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-white" /> LIVE
                      </span>
                      <Radio size={40} className="text-white/40 group-hover:scale-110 transition-transform" />
                      {/* Avatar de l'hôte superposé en bas à droite */}
                      {live.host?.avatar && (
                        <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full border-2 border-white/50 overflow-hidden">
                          <img src={live.host.avatar} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-text truncate">{live.title}</h3>
                      <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {live.host?.firstName} {live.host?.lastName}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="secondary"
                size="sm"
              >
                <ChevronLeft size={16} className="mr-1" /> Précédent
              </Button>
              <span className="text-sm font-medium text-text-secondary">
                {page} / {totalPages}
              </span>
              <Button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                variant="secondary"
                size="sm"
              >
                Suivant <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}