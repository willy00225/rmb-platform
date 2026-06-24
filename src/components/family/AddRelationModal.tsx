"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { X, Search } from "lucide-react";
import toast from "react-hot-toast";

// Type pour les résultats de recherche utilisateur
interface SearchedUser {
  id: string;
  firstName: string;
  lastName: string;
}

export function AddRelationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [relation, setRelation] = useState("parent");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
    if (res.ok) setResults(await res.json());
  };

  const handleAdd = async (userId: string) => {
    setSubmitting(true);
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: userId, relation }),
    });
    if (res.ok) {
      toast.success("Relation ajoutée");
      onSuccess();
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text">
          <X size={20} />
        </button>
        <h2 className="text-lg font-semibold text-text mb-4">Nouvelle relation</h2>
        <div className="space-y-4">
          <select
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border text-text"
          >
            <option value="parent">Parent</option>
            <option value="child">Enfant</option>
            <option value="spouse">Conjoint(e)</option>
            <option value="sibling">Frère/Soeur</option>
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-border text-text placeholder-text-secondary focus:outline-none focus:border-primary"
            />
            <Button onClick={handleSearch} variant="secondary"><Search size={16} /></Button>
          </div>
          {results.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {results.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <span className="text-text">{user.firstName} {user.lastName}</span>
                  <Button onClick={() => handleAdd(user.id)} size="sm" disabled={submitting}>Ajouter</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}