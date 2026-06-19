"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus, UserPlus } from "lucide-react";
import { FamilyTree } from "@/components/family/FamilyTree";
import { AddRelationModal } from "@/components/family/AddRelationModal";
import toast from "react-hot-toast";

interface Suggestion {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  reason: string;
}

export default function FamilyPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  // Requête pour l'arbre généalogique
  const { data: tree, isLoading: treeLoading } = useQuery({
    queryKey: ["familyTree"],
    queryFn: () => fetch("/api/family").then(res => res.json()),
  });

  // Requête pour les suggestions
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<Suggestion[]>({
    queryKey: ["familySuggestions"],
    queryFn: () => fetch("/api/family/suggestions").then(res => res.json()),
  });

  const currentUser = {
    id: session?.user?.id || "",
    firstName: session?.user?.name?.split(" ")[0] || "",
    lastName: session?.user?.name?.split(" ").slice(1).join(" ") || "",
    avatar: session?.user?.image || null,
  };

  const handleAddSuggestion = async (toUserId: string) => {
    const relation = prompt("Type de relation (parent, child, spouse, sibling) ?", "sibling");
    if (!relation || !["parent", "child", "spouse", "sibling"].includes(relation)) {
      toast.error("Type de relation invalide.");
      return;
    }
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId, relation }),
    });
    if (res.ok) {
      toast.success("Relation ajoutée !");
      // Invalider les deux requêtes pour forcer le rechargement
      queryClient.invalidateQueries({ queryKey: ["familyTree"] });
      queryClient.invalidateQueries({ queryKey: ["familySuggestions"] });
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur");
    }
  };

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-text">Mon arbre généalogique</h1>
        <Button onClick={() => setShowAddModal(true)} variant="primary">
          <Plus size={18} /> Ajouter un lien
        </Button>
      </div>

      {treeLoading ? (
        <Loader2 className="animate-spin text-primary mx-auto mt-10" size={32} />
      ) : tree ? (
        <FamilyTree {...tree} currentUser={currentUser} />
      ) : (
        <p className="text-text-secondary italic">Aucune relation enregistrée.</p>
      )}

      {/* Suggestions de relations */}
      <div className="rounded-[var(--radius-card)] bg-white border border-border p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
          <UserPlus size={24} className="text-primary" />
          Suggestions de relations
        </h2>
        {suggestionsLoading ? (
          <Loader2 className="animate-spin text-primary mx-auto" size={24} />
        ) : suggestions.length === 0 ? (
          <p className="text-text-secondary italic">Aucune suggestion pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-border hover:border-primary/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {suggestion.firstName[0]}{suggestion.lastName[0]}
                  </div>
                  <div>
                    <p className="text-text font-medium">
                      {suggestion.firstName} {suggestion.lastName}
                    </p>
                    <p className="text-xs text-text-secondary">{suggestion.reason}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAddSuggestion(suggestion.id)}
                >
                  <Plus size={16} className="mr-1" /> Ajouter
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddRelationModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ["familyTree"] });
            queryClient.invalidateQueries({ queryKey: ["familySuggestions"] });
          }}
        />
      )}
    </div>
  );
}