"use client";

export const dynamic = 'force-dynamic';

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Star,
  Zap,
  Crown,
  Clock,
  ShieldCheck,
  Gift,
  Loader2,
  XCircle,
  Sparkles,
  BadgeCheck,
  LockKeyhole,
  UserCheck,
  MessageSquareText,
  Eye,
  TrendingUp,
} from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface PricingConfig {
  id: string;
  featureKey: string;
  amount: number;
  active: boolean;
  label: string;
}

interface Feature {
  id: string;
  label: string;
  description: string;
  active: boolean;
  featureKey: string;
}

interface SubscriptionStatus {
  active: boolean;
  expiresAt?: string | null;
  autoRenew?: boolean;
}

export default function PremiumPage() {
  const { data: session } = useSession();

  const { data: pricingData, isLoading: pricingLoading } = useQuery<{
    configs: PricingConfig[];
    features: Feature[];
  }>({
    queryKey: ["pricing"],
    queryFn: () => fetch("/api/admin/pricing").then((res) => res.json()),
    staleTime: 1000 * 60 * 5,
  });

  const { data: subStatus } = useQuery<SubscriptionStatus>({
    queryKey: ["subscribeStatus"],
    queryFn: () => fetch("/api/subscribe/status").then((res) => res.json()),
  });

  const configs = pricingData?.configs?.filter((c) => c.active) || [];
  const features = pricingData?.features?.filter((f) => f.active) || [];
  const premiumMonthly = configs.find((c) => c.featureKey === "premium_monthly");
  const isSubscribed = subStatus?.active ?? false;

  const handleSubscribe = async () => {
    const res = await fetch("/api/subscribe", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      toast.error("Abonnement non disponible pour le moment.");
    }
  };

  const handleManageSubscription = async () => {
    const res = await fetch("/api/subscribe/manage", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.open(url, "_blank");
    } else {
      toast.error("Impossible d'accéder à la gestion de l'abonnement.");
    }
  };

  return (
    <div className="space-y-12 animate-fadeInUp pb-10">
      {/* En-tête */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl mb-2"
        >
          <Crown size={40} />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-text">
          RMB <span className="text-amber-500">Premium</span>
        </h1>
        <p className="text-text-secondary text-lg">
          Soutenez la communauté et débloquez des avantages exclusifs pour une expérience enrichie.
        </p>
      </div>

      {/* État d'abonnement actif */}
      {isSubscribed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border-2 border-amber-500/30"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <BadgeCheck size={28} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-text text-lg">Vous êtes Membre Premium</h3>
              <p className="text-sm text-text-secondary flex items-center gap-2">
                <Clock size={14} />
                {subStatus?.expiresAt
                  ? `Expire le ${new Date(subStatus.expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
                  : "Abonnement actif"}
                {subStatus?.autoRenew && " · Renouvellement automatique activé"}
              </p>
            </div>
          </div>
          <Button onClick={handleManageSubscription} variant="secondary" size="sm">
            Gérer mon abonnement
          </Button>
        </motion.div>
      )}

      {/* Carte d'abonnement */}
      {!isSubscribed && (
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium overflow-hidden !p-0 border-2 border-amber-500/30 hover:border-amber-500/50 transition-all duration-300"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white text-center">
              <Star size={36} className="mx-auto mb-2" />
              <h2 className="text-2xl font-bold">Offre Premium</h2>
              <p className="text-white/80 mt-1">
                {premiumMonthly
                  ? `${premiumMonthly.amount.toLocaleString()} FCFA / mois`
                  : "Prix non disponible"}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <ul className="space-y-3">
                {[
                  "Badge Premium exclusif sur votre profil",
                  "Boost prioritaire sur vos publications",
                  "Accès aux lives et contenus exclusifs",
                  "Expérience sans publicité",
                  "Support prioritaire",
                  "Et bien plus...",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
                    <span className="text-text">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleSubscribe}
                variant="primary"
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-none"
              >
                <Crown size={18} />
                <span className="ml-2">Devenir Premium</span>
              </Button>
              <p className="text-xs text-text-secondary text-center">
                Paiement sécurisé. Annulez à tout moment.
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Fonctionnalités */}
      <div>
        <h2 className="text-2xl font-display font-bold text-text text-center mb-8">
          Vos avantages exclusifs
        </h2>
        {pricingLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : features.length === 0 ? (
          <p className="text-text-secondary text-center">Aucune fonctionnalité pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <motion.div
                key={feature.id}
                whileHover={{ y: -4 }}
                className="card-premium p-6 cursor-default"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  {feature.featureKey === "badge" ? (
                    <ShieldCheck size={20} className="text-primary" />
                  ) : feature.featureKey === "boost" ? (
                    <TrendingUp size={20} className="text-primary" />
                  ) : feature.featureKey === "messages" ? (
                    <MessageSquareText size={20} className="text-primary" />
                  ) : feature.featureKey === "visibility" ? (
                    <Eye size={20} className="text-primary" />
                  ) : (
                    <Zap size={20} className="text-primary" />
                  )}
                </div>
                <h3 className="font-semibold text-text mb-1">{feature.label}</h3>
                <p className="text-sm text-text-secondary">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Rappel pour non-abonnés */}
      {!isSubscribed && (
        <div className="text-center text-text-secondary text-sm">
          <p>
            Déjà membre ?{" "}
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:underline font-medium"
            >
              Actualiser
            </button>
          </p>
        </div>
      )}
    </div>
  );
}