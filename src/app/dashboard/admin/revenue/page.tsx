"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, DollarSign, CreditCard, TrendingUp, Heart } from "lucide-react";

// Types minimaux pour les transactions
interface Transaction {
  id: string;
  amount: number;
  type: string; // "subscription", "boost", "donation"
  createdAt?: string;
  user?: {
    firstName: string;
    lastName: string;
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

  const {
    data: transactions = [],
    isLoading,
    isError,
  } = useQuery<Transaction[]>({
    queryKey: ["admin-transactions", tab],
    queryFn: () =>
      fetch(`/api/admin/transactions?type=${tab}`).then((res) => res.json()),
  });

  const { data: totals, isLoading: totalsLoading } = useQuery<Totals>({
    queryKey: ["admin-transactions-totals"],
    queryFn: () => fetch("/api/admin/transactions/totals").then((res) => res.json()),
  });

  // Mapping pour les libellés et icônes des onglets
  const tabs = [
    { key: "all", label: "Tous", icon: DollarSign },
    { key: "subscription", label: "Abonnements", icon: CreditCard },
    { key: "boost", label: "Boosts", icon: TrendingUp },
    { key: "donation", label: "Dons", icon: Heart },
  ] as const;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-text dark:text-white">
        Revenus
      </h1>

      {/* Totaux */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-surface border border-border dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary dark:text-gray-400 flex items-center gap-2">
              <DollarSign size={18} className="text-primary" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalsLoading ? (
              <Loader2 className="animate-spin text-primary" size={24} />
            ) : (
              <p className="text-2xl font-bold text-text dark:text-white">
                {totals?.all?.toLocaleString() || 0} FCFA
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-surface border border-border dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary dark:text-gray-400 flex items-center gap-2">
              <CreditCard size={18} className="text-blue-500" />
              Abonnements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalsLoading ? (
              <Loader2 className="animate-spin text-primary" size={24} />
            ) : (
              <p className="text-2xl font-bold text-text dark:text-white">
                {totals?.subscription?.toLocaleString() || 0} FCFA
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-surface border border-border dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary dark:text-gray-400 flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-500" />
              Boosts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalsLoading ? (
              <Loader2 className="animate-spin text-primary" size={24} />
            ) : (
              <p className="text-2xl font-bold text-text dark:text-white">
                {totals?.boost?.toLocaleString() || 0} FCFA
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Onglets de filtrage */}
      <div className="flex flex-wrap gap-3">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              tab === key
                ? "bg-primary text-white shadow-sm"
                : "bg-gray-100 dark:bg-white/5 text-text-secondary dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Liste des transactions */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : isError ? (
        <p className="text-text-secondary italic">Erreur lors du chargement.</p>
      ) : transactions.length === 0 ? (
        <p className="text-text-secondary italic">Aucune transaction trouvée.</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white dark:bg-surface border border-border dark:border-white/10 gap-2"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10">
                  {tx.type === "subscription" && <CreditCard size={18} className="text-blue-500" />}
                  {tx.type === "boost" && <TrendingUp size={18} className="text-purple-500" />}
                  {tx.type === "donation" && <Heart size={18} className="text-red-500" />}
                  {!["subscription", "boost", "donation"].includes(tx.type) && (
                    <DollarSign size={18} className="text-text-secondary" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-text dark:text-white">
                    {tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : "Utilisateur inconnu"}
                  </p>
                  <p className="text-xs text-text-secondary dark:text-gray-400 capitalize">
                    {tx.type === "subscription" ? "Abonnement" : tx.type === "boost" ? "Boost" : tx.type === "donation" ? "Don" : tx.type}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-text dark:text-white">
                  {tx.amount.toLocaleString()} FCFA
                </span>
                {tx.createdAt && (
                  <p className="text-xs text-text-secondary dark:text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}