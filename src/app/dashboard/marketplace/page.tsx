"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  Search,
  MapPin,
  Tag,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  location?: string;
  images?: string[];
  category?: string;
}

interface MarketplaceResponse {
  products: Product[];
  totalPages: number;
}

const CATEGORIES = [
  { value: "", label: "Toutes catégories" },
  { value: "agriculture", label: "Agriculture" },
  { value: "artisanat", label: "Artisanat" },
  { value: "immobilier", label: "Immobilier" },
  { value: "vehicules", label: "Véhicules" },
  { value: "emploi", label: "Emploi" },
  { value: "electronique", label: "Électronique" },
  { value: "mode", label: "Mode" },
  { value: "services", label: "Services" },
];

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isError } = useQuery<MarketplaceResponse>({
    queryKey: ["marketplace", search, category, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      params.set("page", page.toString());
      return fetch(`/api/marketplace?${params}`).then((res) => {
        if (!res.ok) throw new Error("Erreur réseau");
        return res.json();
      });
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const products = data?.products ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-8 animate-fadeInUp pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text">Marketplace</h1>
          <p className="text-text-secondary text-sm mt-1">
            Achetez et vendez en toute confiance
          </p>
        </div>
        <Link href="/dashboard/marketplace/new">
          <Button variant="primary" size="lg">
            Vendre un article
          </Button>
        </Link>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl border transition flex items-center gap-2 ${
              showFilters
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-gray-50 dark:bg-white/5 border-border dark:border-white/10 text-text-secondary hover:text-text"
            }`}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline">Filtres</span>
            {category && (
              <span className="ml-1 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text">
                    Catégorie
                  </span>
                  {category && (
                    <button
                      onClick={() => setCategory("")}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <X size={12} /> Réinitialiser
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => {
                        setCategory(cat.value);
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        category === cat.value
                          ? "bg-primary text-white"
                          : "bg-white dark:bg-surface text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10 border border-border dark:border-white/10"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Résultats */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-text-secondary animate-pulse">Chargement des annonces...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-red-500">
          Impossible de charger les annonces. Veuillez réessayer.
        </div>
      ) : products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-text-secondary"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Tag size={36} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Aucun produit trouvé</h2>
          <p className="text-text-secondary max-w-md text-center">
            Essayez d&apos;autres mots-clés ou catégories, ou soyez le premier à vendre un article !
          </p>
        </motion.div>
      ) : (
        <>
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {products.map((product) => (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ y: -4 }}
                className="h-full"
              >
                <Link href={`/dashboard/marketplace/${product.id}`}>
                  <div className="card-premium overflow-hidden !p-0 h-full flex flex-col group">
                    <div className="relative h-48 bg-gray-100 dark:bg-white/5 overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-secondary">
                          <Tag size={40} className="opacity-40" />
                        </div>
                      )}
                      {product.category && (
                        <span className="absolute top-2 left-2 bg-black/50 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded-full">
                          {CATEGORIES.find((c) => c.value === product.category)?.label || product.category}
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-text truncate">
                        {product.title}
                      </h3>
                      <p className="text-primary font-bold text-lg mt-1">
                        {product.price.toLocaleString()} FCFA
                      </p>
                      {product.location && (
                        <p className="text-text-secondary text-xs flex items-center gap-1 mt-auto pt-3">
                          <MapPin size={12} /> {product.location}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="secondary"
                size="sm"
              >
                <ChevronLeft size={16} className="mr-1" /> Précédent
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                    p === page
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10"
                  }`}
                >
                  {p}
                </button>
              ))}
              <Button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                variant="secondary"
                size="sm"
              >
                Suivant <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}