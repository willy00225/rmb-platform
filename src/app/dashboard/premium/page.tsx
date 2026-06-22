"use client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Star, Zap } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function PremiumPage() {
  const { data: session } = useSession();

  // Récupération des tarifs et fonctionnalités Premium
  const { data: pricingData } = useQuery({
    queryKey: ["pricing"],
    queryFn: () => fetch("/api/admin/pricing").then(res => res.json()),
  });
  const configs = pricingData?.configs?.filter((c: any) => c.active) || [];
  const features = pricingData?.features?.filter((f: any) => f.active) || [];

  // Vérification du statut d'abonnement
  const { data: subscribeData } = useQuery({
    queryKey: ["subscribeStatus"],
    queryFn: () => fetch("/api/subscribe/status").then(res => res.json()),
  });
  const isSubscribed = subscribeData?.active ?? false;

  const handleSubscribe = async () => {
    const res = await fetch("/api/subscribe", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      toast.error("Abonnement non disponible pour le moment.");
    }
  };

  return (
    <div className="space-y-8 animate-fadeInUp">
      <h1 className="text-3xl font-display font-bold text-text">Premium RMB</h1>

      <div className="card-premium p-8 text-center">
        <Star size={48} className="text-secondary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text mb-2">
          {isSubscribed ? "Vous êtes Premium !" : "Devenez Membre Premium"}
        </h2>
        <p className="text-text-secondary mb-6">
          {isSubscribed
            ? "Merci de soutenir le Réseau Mondial des Bétés. Vos privilèges sont actifs."
            : "Soutenez le réseau et débloquez des privilèges exclusifs."}
        </p>

        {!isSubscribed && configs.find((c: any) => c.featureKey === "premium_monthly") && (
          <Button onClick={handleSubscribe} variant="primary" size="lg">
            <Star size={18} /> S'abonner pour{" "}
            {configs.find((c: any) => c.featureKey === "premium_monthly")?.amount} FCFA/mois
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature: any) => (
          <div key={feature.id} className="card-premium p-6">
            <CheckCircle size={24} className="text-primary mb-3" />
            <h3 className="font-semibold text-text">{feature.label}</h3>
            <p className="text-sm text-text-secondary mt-2">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}