"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import {
  Heart,
  DollarSign,
  Loader2,
  Gift,
  Smartphone,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";

// Type pour un élément de l'historique des dons
interface DonationItem {
  id: string;
  amount: number;
  type: string;
  createdAt: string;
}

// Type pour la réponse de l'API donations
interface DonationData {
  donations: DonationItem[];
  total: number;
}

export default function DonationsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [mobileNetwork, setMobileNetwork] = useState("orange");
  const [mobileAmount, setMobileAmount] = useState(2000);
  const [amount, setAmount] = useState(5000);

  // Requête pour les dons et le total
  const { data, isLoading } = useQuery<DonationData>({
    queryKey: ["donations"],
    queryFn: () => fetch("/api/donations").then(res => res.json()),
  });
  const donations = data?.donations || [];
  const total = data?.total || 0;

  // Mutation CinetPay
  const cinetPayMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/donations/cinetpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, network: "ALL" }),
      });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Erreur lors de la création du paiement.");
      }
    },
    onError: () => toast.error("Erreur réseau"),
  });

  // Mutation don test
  const testDonationMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/donations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Don test enregistré !");
      queryClient.invalidateQueries({ queryKey: ["donations"] });
    },
    onError: () => toast.error("Erreur"),
  });

  // Mutation don manuel
  const manualDonationMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/donations/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: mobileAmount, network: mobileNetwork }),
      });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Votre don a été déclaré. Il sera validé après vérification.");
    },
    onError: () => toast.error("Erreur lors de la déclaration."),
  });

  const handleCinetPay = () => cinetPayMutation.mutate();
  const handleTestDonation = () => testDonationMutation.mutate();

  const handleManualDonation = () => {
    if (!mobileAmount || mobileAmount < 500) {
      toast.error("Montant minimum 500 XOF");
      return;
    }
    manualDonationMutation.mutate();
  };

  return (
    <div className="space-y-8 animate-fadeInUp">
      <h1 className="text-3xl font-display font-bold text-text">Dons</h1>

      {/* Total */}
      <div className="card-premium p-6 flex items-center gap-4">
        <Heart className="text-secondary" size={28} />
        <div>
          <p className="text-sm text-text-secondary">Total de mes dons</p>
          <p className="text-3xl font-bold text-text">{total.toLocaleString()} XOF</p>
        </div>
      </div>

      {/* Options de don */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CinetPay */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <CreditCard size={20} className="text-primary" /> Paiement sécurisé
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            Paiement par carte bancaire ou Mobile Money via CinetPay.
          </p>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm text-text-secondary block mb-1">Montant (XOF)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-40 px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary"
                min={500}
                step={100}
              />
            </div>
            <Button onClick={handleCinetPay} variant="primary" disabled={cinetPayMutation.isPending}>
              <DollarSign size={18} />
              {cinetPayMutation.isPending ? "Redirection..." : "Payer"}
            </Button>
            <Button onClick={handleTestDonation} variant="secondary" disabled={testDonationMutation.isPending}>
              <Gift size={18} />
              Tester (dev)
            </Button>
          </div>
        </div>

        {/* Mobile Money */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <Smartphone size={20} className="text-primary" /> Mobile Money direct
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            Envoyez votre don au numéro ci-dessous, puis déclarez-le.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-center">
            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20">
              <p className="text-orange-600 dark:text-orange-400 text-xs font-bold">Orange</p>
              <p className="text-text text-sm">07 00 00 00 00</p>
            </div>
            <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20">
              <p className="text-yellow-600 dark:text-yellow-400 text-xs font-bold">MTN</p>
              <p className="text-text text-sm">05 00 00 00 00</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
              <p className="text-blue-600 dark:text-blue-400 text-xs font-bold">Moov</p>
              <p className="text-text text-sm">01 00 00 00 00</p>
            </div>
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20">
              <p className="text-cyan-600 dark:text-cyan-400 text-xs font-bold">Wave</p>
              <p className="text-text text-sm">01 00 00 00 00</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Réseau</label>
              <select
                value={mobileNetwork}
                onChange={(e) => setMobileNetwork(e.target.value)}
                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text text-sm"
              >
                <option value="orange">Orange Money</option>
                <option value="mtn">MTN Mobile Money</option>
                <option value="moov">Moov Money</option>
                <option value="wave">Wave</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Montant (XOF)</label>
              <input
                type="number"
                value={mobileAmount}
                onChange={(e) => setMobileAmount(Number(e.target.value))}
                className="w-32 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text text-sm"
                min={500}
              />
            </div>
            <Button onClick={handleManualDonation} variant="primary" size="sm" disabled={manualDonationMutation.isPending}>
              Déclarer le don
            </Button>
          </div>
        </div>
      </div>

      {/* Historique */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Historique des dons</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : donations.length === 0 ? (
          <p className="text-text-secondary italic">Aucun don pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {donations.map((d, idx) => (
              <li key={d.id || idx} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10">
                <div>
                  <span className="text-text-secondary text-sm">
                    {new Date(d.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="ml-2 text-xs text-text-secondary">
                    {d.type === "card" || d.type === "cinetpay" ? "💳 Paiement" : "📱 Mobile Money"}
                  </span>
                </div>
                <span className="text-text font-medium">{d.amount.toLocaleString()} XOF</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}