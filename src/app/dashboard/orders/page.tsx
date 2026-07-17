"use client";

export const dynamic = 'force-dynamic';

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Loader2,
  Package,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

interface OrderItem {
  id: string;
  amount: number;
  product?: {
    title: string;
  };
  status?: string;
}

export default function OrdersPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery<OrderItem[]>({
    queryKey: ["purchases", userId],
    queryFn: () =>
      fetch(`/api/marketplace/orders?type=buyer&userId=${userId}`).then((res) =>
        res.json()
      ),
    enabled: !!userId,
  });

  const { data: sales = [], isLoading: salesLoading } = useQuery<OrderItem[]>({
    queryKey: ["sales", userId],
    queryFn: () =>
      fetch(`/api/marketplace/orders?type=seller&userId=${userId}`).then((res) =>
        res.json()
      ),
    enabled: !!userId,
  });

  const totalPurchases = purchases.reduce((sum, p) => sum + p.amount, 0);
  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
  const balance = totalSales - totalPurchases;

  return (
    <div className="space-y-8 animate-fadeInUp pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <ShoppingBag size={28} className="text-primary" />
            Mes commandes
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Suivez vos achats et ventes
          </p>
        </div>
      </div>

      {/* Résumé financier */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="card-premium p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
            <ArrowUp size={22} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Total achats</p>
            <p className="text-xl font-bold text-text">
              {totalPurchases.toLocaleString()} FCFA
            </p>
          </div>
        </motion.div>
        <motion.div
          whileHover={{ y: -2 }}
          className="card-premium p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
            <ArrowDown size={22} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Total ventes</p>
            <p className="text-xl font-bold text-text">
              {totalSales.toLocaleString()} FCFA
            </p>
          </div>
        </motion.div>
        <motion.div
          whileHover={{ y: -2 }}
          className="card-premium p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
            <TrendingUp size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Solde</p>
            <p
              className={`text-xl font-bold ${
                balance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {balance.toLocaleString()} FCFA
            </p>
          </div>
        </motion.div>
      </div>

      {/* Listes : Achats & Ventes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Achats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-premium p-6"
        >
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <Package size={20} className="text-primary" />
            Achats
            {purchases.length > 0 && (
              <span className="text-sm font-normal text-text-secondary ml-2">
                ({purchases.length})
              </span>
            )}
          </h2>
          {purchasesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <Package size={32} className="mx-auto mb-2 opacity-40" />
              <p className="italic">Aucun achat pour le moment.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {purchases.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10"
                >
                  <span className="text-text text-sm">
                    {p.product?.title || "Produit supprimé"}
                  </span>
                  <span className="text-red-600 dark:text-red-400 font-medium text-sm">
                    -{p.amount.toLocaleString()} FCFA
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Ventes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-premium p-6"
        >
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-primary" />
            Ventes
            {sales.length > 0 && (
              <span className="text-sm font-normal text-text-secondary ml-2">
                ({sales.length})
              </span>
            )}
          </h2>
          {salesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <DollarSign size={32} className="mx-auto mb-2 opacity-40" />
              <p className="italic">Aucune vente pour le moment.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {sales.map((s) => (
                <li
                  key={s.id}
                  className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10"
                >
                  <span className="text-text text-sm">
                    {s.product?.title || "Produit supprimé"}
                  </span>
                  <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                    +{s.amount.toLocaleString()} FCFA
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}