"use client";

export const dynamic = 'force-dynamic'; // Désactive le pré-rendu pour éviter l'erreur SSR

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Loader2, Package, DollarSign } from "lucide-react";

// Interface pour un achat/vente
interface OrderItem {
  id: string;
  amount: number;
  product?: {
    title: string;
  };
}

export default function OrdersPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: purchases = [], isLoading } = useQuery<OrderItem[]>({
    queryKey: ["purchases", userId],
    queryFn: () => fetch(`/api/marketplace/orders?type=buyer&userId=${userId}`).then(res => res.json()),
    enabled: !!userId,
  });

  const { data: sales = [] } = useQuery<OrderItem[]>({
    queryKey: ["sales", userId],
    queryFn: () => fetch(`/api/marketplace/orders?type=seller&userId=${userId}`).then(res => res.json()),
    enabled: !!userId,
  });

  return (
    <div className="space-y-8 animate-fadeInUp">
      <h1 className="text-3xl font-display font-bold text-text">Mes commandes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Achats */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <Package size={20} /> Achats
          </h2>
          {isLoading ? (
            <Loader2 className="animate-spin text-primary mx-auto" size={24} />
          ) : purchases.length === 0 ? (
            <p className="text-text-secondary italic">Aucun achat pour le moment.</p>
          ) : (
            <ul className="space-y-3">
              {purchases.map((p) => (
                <li key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10">
                  <span className="text-text text-sm">{p.product?.title || "Produit supprimé"}</span>
                  <span className="text-primary font-medium">{p.amount} FCFA</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ventes */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <DollarSign size={20} /> Ventes
          </h2>
          {sales.length === 0 ? (
            <p className="text-text-secondary italic">Aucune vente pour le moment.</p>
          ) : (
            <ul className="space-y-3">
              {sales.map((s) => (
                <li key={s.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10">
                  <span className="text-text text-sm">{s.product?.title || "Produit supprimé"}</span>
                  <span className="text-primary font-medium">{s.amount} FCFA</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}