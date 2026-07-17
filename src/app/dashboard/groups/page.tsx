"use client";

export const dynamic = 'force-dynamic'; // Désactive le prérendu

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Loader2, Users, Plus, MessageSquare, Hash } from "lucide-react";
import toast from "react-hot-toast";

interface Group {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  _count?: { members: number; posts: number };
}

export default function GroupsPage() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: groups = [], isLoading } = useQuery<Group[]>({
    queryKey: ["groups"],
    queryFn: () => fetch("/api/groups").then((res) => res.json()),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc }),
      }).then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la création");
        return res.json();
      }),
    onSuccess: () => {
      toast.success("Groupe créé avec succès !");
      setNewName("");
      setNewDesc("");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: () => toast.error("Erreur lors de la création du groupe"),
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="space-y-8 animate-fadeInUp pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <Users size={28} className="text-primary" />
            Groupes &amp; Causeries
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Rejoignez des discussions ou créez votre propre groupe
          </p>
        </div>
      </div>

      {/* Formulaire de création */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6"
      >
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Plus size={20} className="text-primary" />
          Créer un nouveau groupe
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Nom du groupe"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
          />
          <input
            type="text"
            placeholder="Description (optionnelle)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
          />
          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending || !newName.trim()}
            variant="primary"
            className="w-full sm:w-auto"
          >
            {createMutation.isPending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Plus size={16} />
            )}
            <span className="ml-2">{createMutation.isPending ? "Création..." : "Créer"}</span>
          </Button>
        </div>
      </motion.div>

      {/* Liste des groupes */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-8 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users size={36} className="text-primary opacity-70" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Aucun groupe pour le moment</h2>
          <p className="text-text-secondary max-w-md mx-auto">
            Soyez le premier à créer une causerie et invitez vos amis à participer !
          </p>
        </motion.div>
      ) : (
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {groups.map((group) => (
            <motion.div
              key={group.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -4 }}
            >
              <Link href={`/dashboard/groups/${group.id}`}>
                <div className="card-premium overflow-hidden !p-0 h-full group">
                  {/* Bannière du groupe (couleur basée sur le nom) */}
                  <div
                    className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative flex items-center justify-center"
                    style={{
                      backgroundImage: group.imageUrl ? `url(${group.imageUrl})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {!group.imageUrl && (
                      <Hash size={40} className="text-primary/30 group-hover:scale-110 transition-transform" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-text truncate">{group.name}</h3>
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                      {group.description || "Aucune description"}
                    </p>
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border dark:border-white/10 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Users size={14} /> {group._count?.members || 0} membre{(group._count?.members || 0) > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={14} /> {group._count?.posts || 0} post{(group._count?.posts || 0) > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}