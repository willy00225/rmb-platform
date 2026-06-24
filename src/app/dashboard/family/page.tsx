"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus, UserPlus, Users, GitBranch } from "lucide-react";
import { FamilyTree } from "@/components/family/FamilyTree";
import { AddRelationModal } from "@/components/family/AddRelationModal";
import { UserName } from "@/components/ui/UserName";
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
  // Stocke le type de relation choisi pour chaque suggestion (clé = userId)
  const [selectedRelations, setSelectedRelations] = useState<Record<string, string>>({});

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
    const relation = selectedRelations[toUserId] || "sibling";
    if (!["parent", "child", "spouse", "sibling"].includes(relation)) {
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
      queryClient.invalidateQueries({ queryKey: ["familyTree"] });
      queryClient.invalidateQueries({ queryKey: ["familySuggestions"] });
      // Retirer la relation sélectionnée pour cet utilisateur
      setSelectedRelations(prev => {
        const next = { ...prev };
        delete next[toUserId];
        return next;
      });
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur");
    }
  };

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text dark:text-white">
            Mon arbre généalogique
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Connectez les membres de votre famille
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} variant="primary">
          <Plus size={18} /> Ajouter un lien
        </Button>
      </div>

      {/* Arbre généalogique */}
      <div className="card-premium p-6">
        {treeLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : tree ? (
          <FamilyTree {...tree} currentUser={currentUser} />
        ) : (
          <div className="text-center py-12">
            <GitBranch size={48} className="mx-auto text-text-secondary dark:text-gray-500 mb-4" />
            <p className="text-text-secondary italic">
              Aucune relation enregistrée. Commencez par ajouter vos proches.
            </p>
          </div>
        )}
      </div>

      {/* Suggestions de relations */}
      <div className="card-premium p-6">
        <h2 className="text-xl font-semibold text-text dark:text-white mb-4 flex items-center gap-2">
          <UserPlus size={24} className="text-primary" />
          Suggestions de relations
        </h2>
        {suggestionsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-text-secondary italic">Aucune suggestion pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 hover:border-primary/30 transition gap-3"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                    {suggestion.firstName[0]}{suggestion.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-text dark:text-white font-medium truncate">
                      <UserName
                        userId={suggestion.id}
                        firstName={suggestion.firstName}
                        lastName={suggestion.lastName}
                      />
                    </p>
                    <p className="text-xs text-text-secondary dark:text-gray-400">
                      {suggestion.reason}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedRelations[suggestion.id] || "sibling"}
                    onChange={(e) =>
                      setSelectedRelations(prev => ({
                        ...prev,
                        [suggestion.id]: e.target.value,
                      }))
                    }
                    className="text-xs px-2 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-border dark:border-white/10 text-text dark:text-white"
                  >
                    <option value="parent">Parent</option>
                    <option value="child">Enfant</option>
                    <option value="spouse">Conjoint</option>
                    <option value="sibling">Frère/Soeur</option>
                  </select>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAddSuggestion(suggestion.id)}
                  >
                    <Plus size={16} className="mr-1" /> Ajouter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'ajout manuel */}
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