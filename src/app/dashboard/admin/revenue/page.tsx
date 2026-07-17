"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, DollarSign, CreditCard, TrendingUp, Heart, BarChart3, ArrowUpRight, Calendar } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  createdAt?: string;
  user?: {
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
}

interface Totals {
  all: number;
  subscription: number;
  boost: number;
  donation: number;
}

export default function RevenuePage() {
  const [tab, setTab] = useState<"all" | "subscription" | "boost" | "donation">("all");

  const { data: transactions = [], isLoading, isError } = useQuery<Transaction[]>({
    queryKey: ["admin-transactions", tab],
    queryFn: () => fetch(`/api/admin/transactions?type=${tab}`).then((res) => res.json()),
  });

  const { data: totals, isLoading: totalsLoading } = useQuery<Totals>({
    queryKey: ["admin-transactions-totals"],
    queryFn: () => fetch("/api/admin/transactions/totals").then((res) => res.json()),
  });

  const tabs = [
    { key: "all", label: "Tous", icon: BarChart3, color: "text-primary" },
    { key: "subscription", label: "Abonnements", icon: CreditCard, color: "text-blue-500" },
    { key: "boost", label: "Boosts", icon: TrendingUp, color: "text-purple-500" },
    { key: "donation", label: "Dons", icon: Heart, color: "text-red-500" },
  ] as const;

  const totalsArray = [
    { label: "Total", value: totals?.all || 0, icon: DollarSign, color: "text-primary" },
    { label: "Abonnements", value: totals?.subscription || 0, icon: CreditCard, color: "text-blue-500" },
    { label: "Boosts", value: totals?.boost || 0, icon: TrendingUp, color: "text-purple-500" },
    { label: "Dons", value: totals?.donation || 0, icon: Heart, color: "text-red-500" },
  ];

  return (
    <div className="space-y-8 animate-fadeInUp pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <DollarSign size={28} className="text-primary" />
            Revenus
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Suivez l'ensemble des transactions de la plateforme
          </p>
        </div>
      </div>

      {/* Totaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {totalsArray.map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ y: -2 }}
            className="card-premium p-4 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center`}>
              <item.icon size={22} className={item.color} />
            </div>
            <div>
              <p className="text-xs text-text-secondary">{item.label}</p>
              {totalsLoading ? (
                <Loader2 className="animate-spin text-primary mt-1" size={18} />
              ) : (
                <p className="text-xl font-bold text-text">{item.value.toLocaleString()} FCFA</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === key
                ? "bg-primary text-white shadow-sm"
                : "bg-gray-100 dark:bg-white/5 text-text-secondary hover:bg-gray-200 dark:hover:bg-white/10"
            }`}
          >
            <Icon size={16} className={tab === key ? "text-white" : color} />
            {label}
            {key === tab && transactions.length > 0 && (
              <span className="ml-1 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                {transactions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste des transactions */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-text-secondary animate-pulse">Chargement des transactions...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-red-500">
          Erreur de chargement. Veuillez réessayer.
        </div>
      ) : transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-8 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={36} className="text-primary opacity-70" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">
            Aucune transaction
          </h2>
          <p className="text-text-secondary max-w-md mx-auto">
            {tab === "all"
              ? "Aucune transaction enregistrée pour le moment."
              : `Aucune transaction de type "${tabs.find((t) => t.key === tab)?.label.toLowerCase()}" pour le moment.`}
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
              transition: { staggerChildren: 0.05 },
            },
          }}
          className="space-y-3"
        >
          {transactions.map((tx) => (
            <motion.div
              key={tx.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
              className="card-premium p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center ${
                  tx.type === "subscription" ? "text-blue-500" :
                  tx.type === "boost" ? "text-purple-500" :
                  tx.type === "donation" ? "text-red-500" :
                  "text-text-secondary"
                }`}>
                  {tx.type === "subscription" && <CreditCard size={18} />}
                  {tx.type === "boost" && <TrendingUp size={18} />}
                  {tx.type === "donation" && <Heart size={18} />}
                  {!["subscription", "boost", "donation"].includes(tx.type) && (
                    <DollarSign size={18} />
                  )}
                </div>
                <div>
                  <p className="text-text font-medium">
                    {tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : "Utilisateur inconnu"}
                  </p>
                  <p className="text-xs text-text-secondary capitalize flex items-center gap-1">
                    {tx.type === "subscription" ? "Abonnement" : tx.type === "boost" ? "Boost" : tx.type === "donation" ? "Don" : tx.type}
                    {tx.createdAt && (
                      <>
                        <span className="mx-1">·</span>
                        <Calendar size={12} />
                        {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-lg font-bold text-text">
                  {tx.amount.toLocaleString()} FCFA
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}