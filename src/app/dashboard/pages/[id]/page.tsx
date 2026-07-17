"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  Users,
  ArrowLeft,
  Check,
  Plus,
  MapPin,
  Globe,
  Phone,
  Edit,
  ExternalLink,
} from "lucide-react";
import { PostCard } from "@/components/community/PostCard";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface PageDetail {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  coverImage?: string | null;
  website?: string | null;
  location?: string | null;
  whatsappNumber?: string | null;
  category?: string | null;
  verified: boolean;
  isFollowing: boolean;
  _count: {
    posts: number;
    followers: number;
  };
  myRole?: "ADMIN" | "EDITOR" | "MODERATOR";
  posts: any[];
}

export default function PageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: page, isLoading, error } = useQuery<PageDetail>({
    queryKey: ["page", id],
    queryFn: () => fetch(`/api/pages/${id}`).then((res) => {
      if (!res.ok) throw new Error("Page introuvable");
      return res.json();
    }),
  });

  // Récupération de isFollowing depuis la réponse initiale
  const [isFollowing, setIsFollowing] = useState(false);
  useEffect(() => {
    if (page) setIsFollowing(page.isFollowing);
  }, [page]);

  const followMutation = useMutation({
    mutationFn: () => fetch(`/api/pages/${id}/follow`, { method: "POST" }),
    onSuccess: (res) => res.json().then((data) => {
      setIsFollowing(data.followed);
      queryClient.invalidateQueries({ queryKey: ["page", id] });
      toast.success(data.followed ? "Vous suivez cette page" : "Vous ne suivez plus cette page");
    }),
    onError: () => toast.error("Action impossible"),
  });

  const handlePublish = () => {
    router.push(`/dashboard?pageId=${id}`);
  };

  const handleEditPage = () => {
    router.push(`/dashboard/pages/${id}/edit`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-text-secondary">Page introuvable.</p>
        <Button variant="secondary" onClick={() => router.back()} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeInUp pb-10">
      <button
        onClick={() => router.back()}
        className="text-primary hover:underline text-sm flex items-center gap-1"
      >
        <ArrowLeft size={16} /> Retour
      </button>

      {/* Bannière et informations principales */}
      <div className="card-premium overflow-hidden !p-0">
        {/* Bannière */}
        <div className="h-48 md:h-64 bg-gradient-to-br from-primary/20 to-primary/5 relative">
          {page.coverImage ? (
            <img src={page.coverImage} alt="" className="w-full h-full object-cover" />
          ) : null}
          {page.verified && (
            <div className="absolute top-3 right-3 bg-primary text-white text-xs px-2 py-1 rounded-full shadow">
              ✅ Page vérifiée
            </div>
          )}
        </div>

        <div className="px-6 -mt-12 relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6">
          {/* Avatar */}
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-surface bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
              {page.imageUrl ? (
                <img src={page.imageUrl} alt={page.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary/40">{page.name[0]}</span>
              )}
            </div>
            <div className="mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-text">{page.name}</h1>
              {page.category && (
                <p className="text-sm text-text-secondary mt-1">{page.category}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 md:justify-end">
            {page.myRole === "ADMIN" && (
              <Button variant="secondary" onClick={handleEditPage}>
                <Edit size={16} /> Modifier
              </Button>
            )}
            <Button
              onClick={() => followMutation.mutate()}
              variant={isFollowing ? "secondary" : "primary"}
              disabled={followMutation.isPending}
            >
              {isFollowing ? <Check size={18} /> : <Plus size={18} />}
              {isFollowing ? "Abonné" : "Suivre"}
            </Button>
            {isFollowing && (
              <Button onClick={handlePublish} variant="secondary">
                <Plus size={18} /> Publier
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Détails et contacts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {page.description && (
            <div className="card-premium p-6">
              <h2 className="text-sm font-semibold text-text-secondary uppercase mb-2">À propos</h2>
              <p className="text-text leading-relaxed">{page.description}</p>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-text mb-4">Publications</h2>
            {page.posts.length === 0 ? (
              <div className="card-premium p-8 text-center text-text-secondary italic">
                Aucune publication pour le moment.
              </div>
            ) : (
              <div className="space-y-6">
                {page.posts.map((post: any) => (
                  <PostCard key={post.id} post={post} currentUserId={session?.user?.id || ""} />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card-premium p-6">
            <h2 className="text-sm font-semibold text-text-secondary uppercase mb-3">Informations</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-text">
                <Users size={16} className="text-text-secondary" />
                <span>{page._count?.followers ?? 0} abonné{(page._count?.followers ?? 0) > 1 ? "s" : ""}</span>
              </li>
              {page.location && (
                <li className="flex items-center gap-2 text-text">
                  <MapPin size={16} className="text-text-secondary" />
                  {page.location}
                </li>
              )}
              {page.website && (
                <li className="flex items-center gap-2 text-text">
                  <Globe size={16} className="text-text-secondary" />
                  <a
                    href={page.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {page.website.replace(/^https?:\/\//, "")}
                  </a>
                </li>
              )}
              {page.whatsappNumber && (
                <li className="flex items-center gap-2 text-text">
                  <Phone size={16} className="text-text-secondary" />
                  <a
                    href={`https://wa.me/${page.whatsappNumber.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:underline"
                  >
                    Contacter sur WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className="card-premium p-6">
            <h2 className="text-sm font-semibold text-text-secondary uppercase mb-3">Statistiques</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-text">{page._count?.posts ?? 0}</p>
                <p className="text-xs text-text-secondary">Publications</p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-text">{page._count?.followers ?? 0}</p>
                <p className="text-xs text-text-secondary">Abonnés</p>
              </div>
            </div>
          </div>

          {page.myRole && (
            <div className="card-premium p-6">
              <h2 className="text-sm font-semibold text-text-secondary uppercase mb-2">Votre rôle</h2>
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                  {page.myRole === "ADMIN" ? "Administrateur" : page.myRole === "EDITOR" ? "Éditeur" : "Modérateur"}
                </span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}