"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Heart,
  DollarSign,
  Loader2,
  Gift,
  Smartphone,
  CreditCard,
  Clock,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface DonationItem {
  id: string;
  amount: number;
  type: string;
  createdAt: string;
}

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

  const { data, isLoading } = useQuery<DonationData>({
    queryKey: ["donations"],
    queryFn: () => fetch("/api/donations").then((res) => res.json()),
  });
  const donations = data?.donations || [];
  const total = data?.total || 0;

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

  const handleCinetPay = () => {
    if (amount < 500) {
      toast.error("Montant minimum 500 XOF");
      return;
    }
    cinetPayMutation.mutate();
  };

  const handleTestDonation = () => testDonationMutation.mutate();

  const handleManualDonation = () => {
    if (!mobileAmount || mobileAmount < 500) {
      toast.error("Montant minimum 500 XOF");
      return;
    }
    manualDonationMutation.mutate();
  };

  return (
    <div className="space-y-8 animate-fadeInUp pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <Heart size={28} className="text-secondary" />
            Dons & Soutien
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Contribuez au développement de la communauté RMB
          </p>
        </div>
      </div>

      {/* Total des dons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6 flex items-center gap-4 bg-gradient-to-r from-secondary/10 to-transparent"
      >
        <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
          <Heart className="text-secondary" size={24} />
        </div>
        <div>
          <p className="text-sm text-text-secondary">Total de mes dons</p>
          <p className="text-3xl font-bold text-text">{total.toLocaleString()} XOF</p>
        </div>
      </motion.div>

      {/* Options de don */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CinetPay */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-premium p-6 flex flex-col"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <CreditCard size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-text">Paiement sécurisé</h2>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Carte bancaire ou Mobile Money via CinetPay.
          </p>
          <div className="mt-auto space-y-3">
            <div>
              <label className="text-sm text-text-secondary block mb-1">Montant (XOF)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
                min={500}
                step={100}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCinetPay} variant="primary" className="flex-1" disabled={cinetPayMutation.isPending}>
                {cinetPayMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <DollarSign size={18} />}
                <span className="ml-2">{cinetPayMutation.isPending ? "Redirection..." : "Payer"}</span>
              </Button>
              <Button onClick={handleTestDonation} variant="secondary" disabled={testDonationMutation.isPending}>
                <Gift size={18} />
                <span className="ml-2">Test</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Mobile Money */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-premium p-6 flex flex-col"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
              <Smartphone size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-text">Mobile Money direct</h2>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Envoyez votre don au numéro ci-dessous, puis déclarez-le.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-center">
            {[
              { name: "Orange", color: "orange", number: "07 00 00 00 00" },
              { name: "MTN", color: "yellow", number: "05 00 00 00 00" },
              { name: "Moov", color: "blue", number: "01 00 00 00 00" },
              { name: "Wave", color: "cyan", number: "01 00 00 00 00" },
            ].map(({ name, color, number }) => (
              <div key={name} className={`p-2 rounded-lg bg-${color}-50 dark:bg-${color}-500/10 border border-${color}-200 dark:border-${color}-500/20`}>
                <p className={`text-${color}-600 dark:text-${color}-400 text-xs font-bold`}>{name}</p>
                <p className="text-text text-sm">{number}</p>
              </div>
            ))}
          </div>
          <div className="mt-auto space-y-3">
            <div className="flex gap-2">
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
            </div>
            <Button onClick={handleManualDonation} variant="primary" size="sm" className="w-full" disabled={manualDonationMutation.isPending}>
              {manualDonationMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
              <span className="ml-2">Déclarer le don</span>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Historique */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-premium p-6"
      >
        <h2 className="text-lg font-semibold text-text mb-4">Historique des dons</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <Gift size={32} className="mx-auto mb-2 opacity-40" />
            <p className="italic">Aucun don pour le moment.</p>
          </div>
        ) : (
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
            }}
            className="space-y-3"
          >
            {donations.map((d, idx) => (
              <motion.li
                key={d.id || idx}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 },
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10"
              >
                <div className="flex items-center gap-3">
                  {d.type === "card" || d.type === "cinetpay" ? (
                    <CreditCard size={18} className="text-blue-500" />
                  ) : (
                    <Smartphone size={18} className="text-green-500" />
                  )}
                  <div>
                    <p className="text-sm text-text font-medium">
                      {d.type === "card" || d.type === "cinetpay" ? "Paiement en ligne" : "Mobile Money"}
                    </p>
                    <p className="text-xs text-text-secondary flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(d.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-text font-bold">{d.amount.toLocaleString()} XOF</span>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </motion.div>
    </div>
  );
}