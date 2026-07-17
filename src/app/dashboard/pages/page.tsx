"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Loader2, Plus, Users, FileText, MoreVertical, Edit, Trash2,
  ExternalLink, Search, SortAsc, VerifiedIcon, Check
} from "lucide-react";
import toast from "react-hot-toast";

interface PageItem {
  id: string;
  name: string;
  imageUrl?: string | null;
  coverImage?: string | null;
  description?: string | null;
  category?: string | null;
  verified: boolean;
  isFollowing?: boolean; // ✅ nouveau champ
  _count: {
    posts: number;
    followers: number;
  };
  myRole?: "ADMIN" | "EDITOR" | "MODERATOR";
}

export default function PagesListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "followers" | "posts">("name");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { data: pages = [], isLoading, error } = useQuery<PageItem[]>({
    queryKey: ["my-pages"],
    queryFn: () => fetch("/api/pages").then((res) => {
      if (!res.ok) throw new Error("Erreur de chargement");
      return res.json();
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (pageId: string) =>
      fetch(`/api/pages/${pageId}`, { method: "DELETE" }).then((res) => {
        if (!res.ok) throw new Error("Erreur suppression");
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pages"] });
      toast.success("Page supprimée");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const followMutation = useMutation({
    mutationFn: (pageId: string) =>
      fetch(`/api/pages/${pageId}/follow`, { method: "POST" }),
    onSuccess: (_, pageId) => {
      // Mise à jour optimiste du cache React Query
      queryClient.setQueryData<PageItem[]>(["my-pages"], (old) =>
        old?.map((p) =>
          p.id === pageId
            ? {
                ...p,
                isFollowing: !p.isFollowing,
                _count: {
                  ...p._count,
                  followers: p.isFollowing
                    ? p._count.followers - 1
                    : p._count.followers + 1,
                },
              }
            : p
        )
      );
      // Invalider pour un re-fetch propre en arrière-plan
      queryClient.invalidateQueries({ queryKey: ["my-pages"] });
    },
    onError: () => toast.error("Erreur lors du suivi"),
  });

  const handleDelete = (pageId: string) => {
    if (confirm("Supprimer définitivement cette page ?")) {
      deleteMutation.mutate(pageId);
    }
    setMenuOpen(null);
  };

  const filtered = pages
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "followers") return (b._count?.followers || 0) - (a._count?.followers || 0);
      if (sortBy === "posts") return (b._count?.posts || 0) - (a._count?.posts || 0);
      return 0;
    });

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Impossible de charger vos pages.</p>
        <Button variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ["my-pages"] })} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeInUp px-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text">Mes Pages</h1>
          <p className="text-text-secondary text-sm mt-1">
            {pages.length} page{pages.length > 1 ? "s" : ""} créée{pages.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/pages/new">
          <Button variant="primary">
            <Plus size={18} /> Créer une page
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une page..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="pl-4 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text text-sm appearance-none cursor-pointer focus:outline-none focus:border-primary"
          >
            <option value="name">Nom</option>
            <option value="followers">Abonnés</option>
            <option value="posts">Publications</option>
          </select>
          <SortAsc size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-surface rounded-xl border border-border dark:border-white/10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText size={28} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">
            {search ? "Aucune page trouvée" : "Vous n'avez pas encore de page"}
          </h3>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            {search
              ? "Essayez avec d'autres mots-clés."
              : "Créez une page pour votre entreprise, marque ou communauté."}
          </p>
          {!search && (
            <Link href="/dashboard/pages/new">
              <Button variant="primary">Créer votre première page</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((page) => (
            <div key={page.id} className="card-premium overflow-hidden !p-0 hover:shadow-lg transition group relative">
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(menuOpen === page.id ? null : page.id);
                  }}
                  className="p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60 transition"
                >
                  <MoreVertical size={14} />
                </button>
                {menuOpen === page.id && (
                  <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-surface border border-border rounded-xl shadow-lg py-1 z-20">
                    <Link href={`/dashboard/pages/${page.id}/edit`}>
                      <button
                        onClick={() => setMenuOpen(null)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        <Edit size={14} /> Modifier
                      </button>
                    </Link>
                    <Link href={`/pages/${page.id}`} target="_blank">
                      <button
                        onClick={() => setMenuOpen(null)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        <ExternalLink size={14} /> Voir la page
                      </button>
                    </Link>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(page.id); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </div>
                )}
              </div>

              <Link href={`/dashboard/pages/${page.id}`}>
                <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative">
                  {page.coverImage ? (
                    <img src={page.coverImage} alt="" className="w-full h-full object-cover" />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className="px-4 -mt-8 relative z-10">
                  <div className="w-16 h-16 rounded-full border-4 border-white dark:border-surface bg-primary/10 flex items-center justify-center overflow-hidden">
                    {page.imageUrl ? (
                      <img src={page.imageUrl} alt={page.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-primary/40">{page.name[0]}</span>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 mt-1">
                    <h3 className="font-semibold text-text truncate">{page.name}</h3>
                    {page.verified && (
                      <VerifiedIcon size={16} className="text-primary shrink-0" />
                    )}
                  </div>
                  {page.category && (
                    <p className="text-xs text-text-secondary mt-0.5">{page.category}</p>
                  )}
                  {page.description && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">{page.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border dark:border-white/10 text-sm text-text-secondary">
                    <span className="flex items-center gap-1">
                      <FileText size={14} /> {page._count?.posts || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} /> {page._count?.followers || 0}
                    </span>
                    {/* ✅ Bouton Suivre / Abonné */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        followMutation.mutate(page.id);
                      }}
                      disabled={followMutation.isPending}
                      className={`ml-auto px-3 py-1 rounded-full text-xs font-medium transition ${
                        page.isFollowing
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-primary text-white hover:bg-primary-hover"
                      }`}
                    >
                      {page.isFollowing ? (
                        <span className="flex items-center gap-1"><Check size={12} /> Abonné</span>
                      ) : (
                        "Suivre"
                      )}
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}