"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Check,
  X,
  Loader2,
  AlertTriangle,
  Clock,
  Wallet,
  User,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

interface Donation {
  id: string;
  amount: number;
  network: string;
  createdAt: string;
  user: { firstName: string; lastName: string };
  adminNote?: string | null;
}

export default function AdminDonationsPage() {
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: donations = [], isLoading, isError } = useQuery<Donation[]>({
    queryKey: ["adminDonations"],
    queryFn: () => fetch("/api/admin/manual-donations").then((res) => res.json()),
  });

  const mutation = useMutation({
    mutationFn: async ({
      donationId,
      action,
    }: {
      donationId: string;
      action: "confirm" | "reject";
    }) => {
      const res = await fetch("/api/admin/manual-donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId, action }),
      });
      if (!res.ok) throw new Error("Erreur");
      return { action, donationId };
    },
    onSuccess: ({ action }) => {
      toast.success(action === "confirm" ? "Don confirmé avec succès" : "Don rejeté");
      setConfirmingId(null);
      setRejectingId(null);
      queryClient.invalidateQueries({ queryKey: ["adminDonations"] });
    },
    onError: () => {
      toast.error("Une erreur est survenue");
      setConfirmingId(null);
      setRejectingId(null);
    },
  });

  const handleConfirm = (donationId: string) => {
    setConfirmingId(donationId);
    mutation.mutate({ donationId, action: "confirm" });
  };

  const handleReject = (donationId: string) => {
    setRejectingId(donationId);
    mutation.mutate({ donationId, action: "reject" });
  };

  const pendingCount = donations.length;
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-text-secondary animate-pulse">Chargement des dons...</p>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <Wallet size={28} className="text-primary" />
            Validation des dons
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Examinez et validez les dons manuels en attente
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2">
              <Clock size={16} />
              {pendingCount} en attente
            </div>
            <div className="bg-gray-50 dark:bg-white/5 border border-border rounded-xl px-4 py-2 text-sm font-medium text-text">
              {totalAmount.toLocaleString()} XOF
            </div>
          </div>
        )}
      </div>

      {donations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-8 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Check size={36} className="text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Aucun don en attente</h2>
          <p className="text-text-secondary max-w-md mx-auto">
            Tous les dons manuels ont été traités. Revenez plus tard.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.06 },
            },
          }}
          className="space-y-4"
        >
          {donations.map((donation) => {
            const isExpanded = expandedId === donation.id;
            const isProcessing =
              confirmingId === donation.id || rejectingId === donation.id;

            return (
              <motion.div
                key={donation.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className={`card-premium p-5 transition-all ${
                  isProcessing ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                        {donation.user.firstName[0]}
                        {donation.user.lastName[0]}
                      </div>
                      <div>
                        <p className="text-text font-semibold">
                          {donation.user.firstName} {donation.user.lastName}
                        </p>
                        <p className="text-xs text-text-secondary flex items-center gap-3 mt-0.5">
                          <span>
                            {new Date(donation.createdAt).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                          <span>·</span>
                          <span>{donation.network}</span>
                        </p>
                      </div>
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="mt-3 space-y-2 pl-12"
                      >
                        <p className="text-sm text-text-secondary">
                          <span className="font-medium text-text">Réseau :</span>{" "}
                          {donation.network}
                        </p>
                        {donation.adminNote && (
                          <p className="text-sm text-text-secondary">
                            <span className="font-medium text-text">
                              Note admin :
                            </span>{" "}
                            {donation.adminNote}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {donation.amount.toLocaleString()} XOF
                      </p>
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : donation.id)
                        }
                        className="text-xs text-text-secondary hover:text-text transition flex items-center gap-1 mt-0.5"
                      >
                        {isExpanded ? "Moins" : "Plus"} de détails
                        <ChevronDown
                          size={12}
                          className={`transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleConfirm(donation.id)}
                        disabled={isProcessing}
                        variant="primary"
                        size="sm"
                      >
                        {confirmingId === donation.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        <span className="ml-1 hidden sm:inline">Confirmer</span>
                      </Button>
                      <Button
                        onClick={() => handleReject(donation.id)}
                        disabled={isProcessing}
                        variant="secondary"
                        size="sm"
                      >
                        {rejectingId === donation.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <X size={14} />
                        )}
                        <span className="ml-1 hidden sm:inline">Rejeter</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}