"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  ToggleLeft,
  ToggleRight,
  Star,
  Settings,
  User,
  Clock,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";

// Interfaces
interface Config {
  id: string;
  label: string;
  amount: number;
  featureKey: string;
  active: boolean;
}

interface Feature {
  id: string;
  label: string;
  description: string;
  active: boolean;
}

interface Subscriber {
  id: string;
  expiresAt: string;
  user: { firstName: string; lastName: string; avatar?: string | null };
}

interface PremiumData {
  configs: Config[];
  features: Feature[];
  subscribers: Subscriber[];
}

export default function AdminPremiumPage() {
  const queryClient = useQueryClient();
  const [editingPricing, setEditingPricing] = useState<string | null>(null);
  const [newAmount, setNewAmount] = useState("");

  const { data, isLoading, isError } = useQuery<PremiumData>({
    queryKey: ["adminPremium"],
    queryFn: () => fetch("/api/admin/pricing").then((res) => res.json()),
  });

  const configs = data?.configs || [];
  const features = data?.features || [];
  const subscribers = data?.subscribers || [];

  // Mutation pour activer/désactiver une fonctionnalité
  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch("/api/admin/features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !active }),
      });
      if (!res.ok) throw new Error("Erreur");
      return { id, active: !active };
    },
    onSuccess: ({ id, active }) => {
      queryClient.setQueryData(["adminPremium"], (old: PremiumData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          features: old.features.map((f) => (f.id === id ? { ...f, active } : f)),
        };
      });
      toast.success(active ? "Fonctionnalité activée" : "Fonctionnalité désactivée");
    },
    onError: () => toast.error("Erreur"),
  });

  // Mutation pour modifier un prix
  const updatePricingMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const res = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, amount }),
      });
      if (!res.ok) throw new Error("Erreur");
      return { id, amount };
    },
    onSuccess: ({ id, amount }) => {
      queryClient.setQueryData(["adminPremium"], (old: PremiumData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          configs: old.configs.map((c) => (c.id === id ? { ...c, amount } : c)),
        };
      });
      toast.success("Tarif mis à jour");
      setEditingPricing(null);
    },
    onError: () => toast.error("Erreur"),
  });

  const handleToggleFeature = (id: string, active: boolean) => {
    toggleFeatureMutation.mutate({ id, active });
  };

  const handleEditPriceStart = (config: Config) => {
    setEditingPricing(config.id);
    setNewAmount(config.amount.toString());
  };

  const handlePriceSave = (id: string) => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Montant invalide");
      return;
    }
    updatePricingMutation.mutate({ id, amount });
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-text-secondary animate-pulse">Chargement des paramètres Premium...</p>
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-20 text-red-500">
        Erreur de chargement. Veuillez réessayer.
      </div>
    );

  return (
    <div className="space-y-8 animate-fadeInUp pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <Star size={28} className="text-amber-500" />
            Gestion Premium
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Gérez les tarifs, les fonctionnalités et les abonnés Premium
          </p>
        </div>
        <div className="flex items-center gap-3">
          {subscribers.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl px-4 py-2 text-sm font-medium">
              {subscribers.length} abonné{subscribers.length > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Tarifs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-premium p-6"
      >
        <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
          <DollarSign size={22} className="text-primary" />
          Tarifs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {configs.map((config) => (
            <div
              key={config.id}
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10"
            >
              <div>
                <p className="font-medium text-text">{config.label}</p>
                {editingPricing === config.id ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-24 px-2 py-1 rounded-lg bg-white dark:bg-surface border border-border text-text text-sm"
                      autoFocus
                    />
                    <span className="text-text-secondary text-sm">FCFA</span>
                    <button
                      onClick={() => handlePriceSave(config.id)}
                      className="text-primary text-sm font-medium hover:underline"
                      disabled={updatePricingMutation.isPending}
                    >
                      {updatePricingMutation.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        "Sauvegarder"
                      )}
                    </button>
                    <button
                      onClick={() => setEditingPricing(null)}
                      className="text-text-secondary text-sm hover:underline"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">
                    {config.amount.toLocaleString()} FCFA
                  </p>
                )}
              </div>
              <Button
                onClick={() => handleEditPriceStart(config)}
                variant="secondary"
                size="sm"
                disabled={editingPricing === config.id}
              >
                Modifier
              </Button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Fonctionnalités */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card-premium p-6"
      >
        <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
          <Settings size={22} className="text-primary" />
          Fonctionnalités
        </h2>
        <div className="space-y-3">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10"
            >
              <div className="flex-1 mr-4">
                <p className="font-medium text-text">{feature.label}</p>
                <p className="text-sm text-text-secondary">{feature.description}</p>
              </div>
              <button
                onClick={() => handleToggleFeature(feature.id, feature.active)}
                className={`p-2 rounded-lg transition ${
                  feature.active
                    ? "text-primary hover:bg-primary/10"
                    : "text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
                title={feature.active ? "Désactiver" : "Activer"}
              >
                {feature.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Abonnés */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-premium p-6"
      >
        <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
          <User size={22} className="text-primary" />
          Abonnés ({subscribers.length})
        </h2>
        {subscribers.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <User size={32} className="mx-auto mb-2 opacity-40" />
            <p className="italic">Aucun abonné pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {subscribers.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {sub.user.firstName[0]}
                    {sub.user.lastName[0]}
                  </div>
                  <span className="text-text font-medium">
                    {sub.user.firstName} {sub.user.lastName}
                  </span>
                </div>
                <span className="text-text-secondary text-sm flex items-center gap-1">
                  <Clock size={14} />
                  Expire le {new Date(sub.expiresAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}