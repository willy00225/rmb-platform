"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";

// Interfaces pour les données
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
  user: { firstName: string; lastName: string };
}

interface PremiumData {
  configs: Config[];
  features: Feature[];
  subscribers: Subscriber[];
}

export default function AdminPremiumPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PremiumData>({
    queryKey: ["adminPremium"],
    queryFn: () => fetch("/api/admin/pricing").then(res => res.json()),
  });

  const configs = data?.configs || [];
  const features = data?.features || [];
  const subscribers = data?.subscribers || [];

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
      toast.success("Fonctionnalité mise à jour");
    },
    onError: () => toast.error("Erreur"),
  });

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
    },
    onError: () => toast.error("Erreur"),
  });

  const handleToggleFeature = (id: string, active: boolean) => {
    toggleFeatureMutation.mutate({ id, active });
  };

  const handleUpdatePricing = (id: string, currentAmount: number) => {
    const newAmount = prompt("Nouveau montant (FCFA) :", currentAmount.toString());
    if (!newAmount) return;
    const parsed = parseFloat(newAmount);
    if (isNaN(parsed)) return toast.error("Montant invalide");
    updatePricingMutation.mutate({ id, amount: parsed });
  };

  if (isLoading) return <Loader2 className="animate-spin text-primary mx-auto mt-10" size={32} />;

  return (
    <div className="space-y-8 animate-fadeInUp">
      <h1 className="text-3xl font-display font-bold text-text dark:text-white">
        Gestion Premium
      </h1>

      {/* Tarifs */}
      <div className="rounded-2xl bg-white dark:bg-white/5 border border-border dark:border-white/10 p-6">
        <h2 className="text-xl font-semibold text-text dark:text-white mb-4">Tarifs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {configs.map((config) => (
            <div
              key={config.id}
              className="flex justify-between items-center p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10"
            >
              <div>
                <p className="font-medium text-text dark:text-white">{config.label}</p>
                <p className="text-sm text-text-secondary dark:text-gray-400">
                  {config.amount} FCFA
                </p>
              </div>
              <Button
                onClick={() => handleUpdatePricing(config.id, config.amount)}
                variant="secondary"
                size="sm"
              >
                Modifier
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Fonctionnalités activables */}
      <div className="rounded-2xl bg-white dark:bg-white/5 border border-border dark:border-white/10 p-6">
        <h2 className="text-xl font-semibold text-text dark:text-white mb-4">
          Fonctionnalités
        </h2>
        <div className="space-y-3">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="flex justify-between items-center p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10"
            >
              <div>
                <p className="font-medium text-text dark:text-white">{feature.label}</p>
                <p className="text-sm text-text-secondary dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
              <button onClick={() => handleToggleFeature(feature.id, feature.active)}>
                {feature.active ? (
                  <ToggleRight size={32} className="text-primary" />
                ) : (
                  <ToggleLeft size={32} className="text-text-secondary dark:text-gray-400" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Abonnés */}
      <div className="rounded-2xl bg-white dark:bg-white/5 border border-border dark:border-white/10 p-6">
        <h2 className="text-xl font-semibold text-text dark:text-white mb-4">
          Abonnés ({subscribers.length})
        </h2>
        {subscribers.length === 0 ? (
          <p className="text-text-secondary italic">Aucun abonné pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {subscribers.map((sub) => (
              <li
                key={sub.id}
                className="flex justify-between p-2 rounded bg-gray-50 dark:bg-white/5"
              >
                <span className="text-text dark:text-white">
                  {sub.user.firstName} {sub.user.lastName}
                </span>
                <span className="text-text-secondary dark:text-gray-400 text-sm">
                  Expire le {new Date(sub.expiresAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}