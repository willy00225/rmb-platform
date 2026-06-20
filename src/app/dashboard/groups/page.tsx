"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, Users, Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function GroupsPage() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Récupération des groupes
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => fetch("/api/groups").then(res => res.json()),
  });

  // Création d'un groupe
  const createMutation = useMutation({
    mutationFn: () =>
      fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc }),
      }).then(res => {
        if (!res.ok) throw new Error("Erreur lors de la création");
        return res.json();
      }),
    onSuccess: () => {
      toast.success("Groupe créé");
      setNewName("");
      setNewDesc("");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: () => toast.error("Erreur"),
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="space-y-8 animate-fadeInUp pb-24 md:pb-0">
      <h1 className="text-3xl font-display font-bold text-text">Groupes / Causeries</h1>

      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Créer un groupe</h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Nom du groupe"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary"
          />
          <input
            type="text"
            placeholder="Description"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary"
          />
          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            variant="primary"
            className="w-full sm:w-auto"
          >
            <Plus size={16} /> {createMutation.isPending ? "Création..." : "Créer"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="animate-spin text-primary mx-auto" size={32} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {groups.map((group: any) => (
            <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
              <div className="card-premium p-6 h-full cursor-pointer">
                <h3 className="text-lg font-semibold text-text break-words">{group.name}</h3>
                <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                  {group.description || "Aucune description"}
                </p>
                <div className="flex items-center gap-2 mt-4 text-sm text-text-secondary">
                  <Users size={14} /> {group._count?.members || 0} membres
                </div>
              </div>
            </Link>
          ))}
          {groups.length === 0 && !isLoading && (
            <p className="text-text-secondary italic col-span-full text-center py-8">
              Aucun groupe pour le moment.
            </p>
          )}
        </div>
      )}
    </div>
  );
}