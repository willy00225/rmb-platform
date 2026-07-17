"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  Plus,
  UserPlus,
  Users,
  GitBranch,
  ChevronDown,
} from "lucide-react";
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
  const [selectedRelations, setSelectedRelations] = useState<
    Record<string, string>
  >({});
  const [expandSuggestions, setExpandSuggestions] = useState(true);

  // Requête pour l'arbre généalogique
  const { data: tree, isLoading: treeLoading } = useQuery({
    queryKey: ["familyTree"],
    queryFn: () => fetch("/api/family").then((res) => res.json()),
  });

  // Requête pour les suggestions
  const { data: suggestions = [], isLoading: suggestionsLoading } =
    useQuery<Suggestion[]>({
      queryKey: ["familySuggestions"],
      queryFn: () =>
        fetch("/api/family/suggestions").then((res) => res.json()),
    });

  const currentUser = {
    id: session?.user?.id || "",
    firstName: session?.user?.name?.split(" ")[0] || "",
    lastName:
      session?.user?.name?.split(" ").slice(1).join(" ") || "",
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
      setSelectedRelations((prev) => {
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
    <div className="space-y-8 animate-fadeInUp pb-10">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-text flex items-center gap-3">
              <GitBranch size={36} className="text-primary" />
              Mon arbre généalogique
            </h1>
            <p className="text-text-secondary mt-2 max-w-xl">
              Connectez les membres de votre famille et découvrez vos liens.
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="primary"
            size="lg"
          >
            <Plus size={18} /> Ajouter un lien
          </Button>
        </div>
      </div>

      {/* Arbre généalogique */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6"
      >
        {treeLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : tree ? (
          <FamilyTree {...tree} currentUser={currentUser} />
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <GitBranch
                size={40}
                className="text-text-secondary dark:text-gray-500"
              />
            </div>
            <p className="text-text-secondary text-lg italic">
              Aucune relation enregistrée.
            </p>
            <p className="text-text-secondary text-sm mt-1">
              Commencez par ajouter vos proches.
            </p>
          </div>
        )}
      </motion.div>

      {/* Suggestions de relations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-premium p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text flex items-center gap-2">
            <UserPlus size={24} className="text-primary" />
            Suggestions de relations
            {suggestions.length > 0 && (
              <span className="text-sm font-normal text-text-secondary ml-2">
                ({suggestions.length})
              </span>
            )}
          </h2>
          <button
            onClick={() => setExpandSuggestions(!expandSuggestions)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            <ChevronDown
              size={20}
              className={`text-text-secondary transition-transform duration-200 ${
                expandSuggestions ? "rotate-0" : "-rotate-90"
              }`}
            />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {expandSuggestions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {suggestionsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : suggestions.length === 0 ? (
                <p className="text-text-secondary italic text-center py-6">
                  Aucune suggestion pour le moment.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.id}
                      whileHover={{ scale: 1.01 }}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 hover:border-primary/30 transition gap-3"
                    >
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0 overflow-hidden">
                          {suggestion.avatar ? (
                            <img
                              src={suggestion.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            `${suggestion.firstName[0]}${suggestion.lastName[0]}`
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-text font-medium truncate">
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
                          value={
                            selectedRelations[suggestion.id] || "sibling"
                          }
                          onChange={(e) =>
                            setSelectedRelations((prev) => ({
                              ...prev,
                              [suggestion.id]: e.target.value,
                            }))
                          }
                          className="text-xs px-2 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-border dark:border-white/10 text-text"
                        >
                          <option value="parent">Parent</option>
                          <option value="child">Enfant</option>
                          <option value="spouse">Conjoint</option>
                          <option value="sibling">Frère/Soeur</option>
                        </select>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            handleAddSuggestion(suggestion.id)
                          }
                        >
                          <Plus size={16} className="mr-1" /> Ajouter
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal d'ajout manuel */}
      {showAddModal && (
        <AddRelationModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ["familyTree"] });
            queryClient.invalidateQueries({
              queryKey: ["familySuggestions"],
            });
          }}
        />
      )}
    </div>
  );
}