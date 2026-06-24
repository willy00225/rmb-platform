"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, Search, MapPin, Tag } from "lucide-react";

// Interface pour un produit
interface Product {
  id: string;
  title: string;
  price: number;
  location?: string;
  images?: string[];
}

// Réponse typée de l'API marketplace
interface MarketplaceResponse {
  products: Product[];
  totalPages: number;
}

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<MarketplaceResponse>({
    queryKey: ["marketplace", search, category, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      params.set("page", page.toString());
      return fetch(`/api/marketplace?${params}`).then(res => {
        if (!res.ok) throw new Error("Erreur réseau");
        return res.json();
      });
    },
    placeholderData: (previousData) => previousData,
  });

  const products = data?.products ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-text">Marketplace</h1>
        <Link href="/dashboard/marketplace/new">
          <Button variant="primary">Vendre un article</Button>
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text"
        >
          <option value="">Toutes catégories</option>
          <option value="agriculture">Agriculture</option>
          <option value="artisanat">Artisanat</option>
          <option value="immobilier">Immobilier</option>
          <option value="vehicules">Véhicules</option>
          <option value="emploi">Emploi</option>
          <option value="electronique">Électronique</option>
          <option value="mode">Mode</option>
          <option value="services">Services</option>
        </select>
      </div>

      {/* Grille produits */}
      {isLoading ? (
        <Loader2 className="animate-spin text-primary mx-auto mt-10" size={32} />
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          Aucun produit trouvé.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/dashboard/marketplace/${product.id}`}>
              <div className="card-premium overflow-hidden !p-0">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-100 dark:bg-white/5 flex items-center justify-center text-text-secondary">
                    <Tag size={32} />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-text truncate">{product.title}</h3>
                  <p className="text-primary font-bold mt-1">{product.price.toLocaleString()} FCFA</p>
                  {product.location && (
                    <p className="text-text-secondary text-xs flex items-center gap-1 mt-2">
                      <MapPin size={12} /> {product.location}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <Button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          variant="ghost"
          size="sm"
        >
          Précédent
        </Button>
        <span className="flex items-center text-text-secondary">Page {page} / {totalPages}</span>
        <Button
          onClick={() => setPage(p => p + 1)}
          disabled={page === totalPages}
          variant="ghost"
          size="sm"
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}