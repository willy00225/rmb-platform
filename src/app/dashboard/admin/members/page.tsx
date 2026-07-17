"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  Clock,
  Ban,
  Unlock,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { UserName } from "@/components/ui/UserName";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  kycLevel: string;
  totalDonated: number;
  restrictedUntil: string | null;
}

interface MembersResponse {
  members: Member[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminMembersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<MembersResponse>({
    queryKey: ["admin-members", page, search],
    queryFn: () =>
      fetch(
        `/api/admin/members?page=${page}&search=${encodeURIComponent(search)}`
      ).then((res) => res.json()),
    placeholderData: (previousData) => previousData,
  });

  const members = data?.members || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const restrictMutation = useMutation({
    mutationFn: (params: {
      userId: string;
      action: string;
      reason?: string;
      duration?: number;
    }) =>
      fetch(`/api/admin/users/${params.userId}/restrict`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }),
    onMutate: ({ userId }) => setProcessingId(userId),
    onSettled: () => setProcessingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      toast.success("Action effectuée.");
    },
    onError: () => toast.error("Erreur lors de l'action"),
  });

  const handleRestrict = (userId: string) => {
    const reason = window.prompt("Raison de la restriction :");
    if (!reason) return;
    const durationStr = window.prompt("Durée en jours (7 par défaut) :", "7");
    const duration = parseInt(durationStr || "7");
    restrictMutation.mutate({
      userId,
      action: "restrict",
      reason,
      duration,
    });
  };

  const handleBan = (userId: string) => {
    const reason = window.prompt("Raison du bannissement :");
    if (!reason) return;
    if (window.confirm("Confirmer le bannissement permanent ?")) {
      restrictMutation.mutate({ userId, action: "ban", reason });
    }
  };

  const handleUnrestrict = (userId: string) => {
    if (window.confirm("Libérer ce membre (supprimer toute restriction) ?")) {
      restrictMutation.mutate({ userId, action: "unrestrict" });
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
          {role}
        </span>
      );
    }
    if (role === "MODERATOR") {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
          {role}
        </span>
      );
    }
    if (role === "MEMBER") {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
          {role}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-text-secondary">
        {role}
      </span>
    );
  };

  const getKycBadge = (kycLevel: string) => {
    if (kycLevel === "ID_VERIFIED" || kycLevel === "AMBASSADOR") {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
          {kycLevel}
        </span>
      );
    }
    if (kycLevel === "PHONE") {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
          {kycLevel}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-text-secondary">
        {kycLevel || "NONE"}
      </span>
    );
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-text-secondary animate-pulse">
          Chargement des membres...
        </p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <Users size={28} className="text-primary" />
            Gestion des membres
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {total} membre{total > 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="card-premium p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            placeholder="Rechercher un membre par nom ou email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>
            Page {page}/{totalPages}
          </span>
        </div>
      </div>

      {/* Tableau */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium overflow-x-auto !p-0"
      >
        {members.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <User size={28} className="text-primary opacity-70" />
            </div>
            <p className="text-lg font-medium text-text mb-1">
              Aucun membre trouvé
            </p>
            <p>
              Essayez de modifier vos critères de recherche.
            </p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border dark:border-white/10 bg-gray-50 dark:bg-white/5">
                <th className="p-4 text-left text-sm font-semibold text-text">
                  Membre
                </th>
                <th className="p-4 text-left text-sm font-semibold text-text hidden md:table-cell">
                  Email
                </th>
                <th className="p-4 text-left text-sm font-semibold text-text">
                  Rôle
                </th>
                <th className="p-4 text-left text-sm font-semibold text-text hidden sm:table-cell">
                  KYC
                </th>
                <th className="p-4 text-left text-sm font-semibold text-text hidden lg:table-cell">
                  Dons
                </th>
                <th className="p-4 text-left text-sm font-semibold text-text hidden xl:table-cell">
                  Restriction
                </th>
                <th className="p-4 text-left text-sm font-semibold text-text">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, index) => (
                <motion.tr
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`border-b border-border/50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition ${
                    processingId === m.id ? "opacity-60" : ""
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                        {m.firstName[0]}
                        {m.lastName[0]}
                      </div>
                      <span className="text-text font-medium">
                        <UserName
                          userId={m.id}
                          firstName={m.firstName}
                          lastName={m.lastName}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-text-secondary text-sm hidden md:table-cell">
                    {m.email}
                  </td>
                  <td className="p-4">{getRoleBadge(m.role)}</td>
                  <td className="p-4 hidden sm:table-cell">
                    {getKycBadge(m.kycLevel)}
                  </td>
                  <td className="p-4 text-text font-medium hidden lg:table-cell">
                    {m.totalDonated?.toLocaleString()} FCFA
                  </td>
                  <td className="p-4 text-text-secondary text-sm hidden xl:table-cell">
                    {m.restrictedUntil ? (
                      <span className="text-orange-500 dark:text-orange-400 flex items-center gap-1">
                        <Clock size={14} />
                        Jusqu&apos;au{" "}
                        {new Date(m.restrictedUntil).toLocaleDateString()}
                      </span>
                    ) : (
                      "Aucune"
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRestrict(m.id)}
                        disabled={processingId === m.id}
                        className="p-2 rounded-lg text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition"
                        title="Restreindre temporairement"
                      >
                        <Clock size={16} />
                      </button>
                      <button
                        onClick={() => handleBan(m.id)}
                        disabled={processingId === m.id}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                        title="Bannir définitivement"
                      >
                        <Ban size={16} />
                      </button>
                      <button
                        onClick={() => handleUnrestrict(m.id)}
                        disabled={processingId === m.id}
                        className="p-2 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 transition"
                        title="Libérer"
                      >
                        <Unlock size={16} />
                      </button>
                      {processingId === m.id && (
                        <Loader2
                          size={16}
                          className="animate-spin text-text-secondary ml-1"
                        />
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="secondary"
            size="sm"
          >
            <ChevronLeft size={16} className="mr-1" /> Précédent
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - page) <= 1
              )
              .map((p, index, arr) => (
                <span key={p}>
                  {index > 0 && arr[index - 1] !== p - 1 && (
                    <span className="px-1 text-text-secondary">…</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                      p === page
                        ? "bg-primary text-white"
                        : "text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
          </div>
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
    </div>
  );
}