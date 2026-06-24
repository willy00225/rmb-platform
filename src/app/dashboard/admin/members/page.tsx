"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  Clock,
  Ban,
  Unlock,
  Search,
  ChevronLeft,
  ChevronRight,
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

interface RestrictParams {
  userId: string;
  action: string;
  reason?: string;
  duration?: number;
}

export default function AdminMembersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<MembersResponse>({
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
    mutationFn: (params: RestrictParams) =>
      fetch(`/api/admin/users/${params.userId}/restrict`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      toast.success("Action effectuée.");
    },
  });

  const handleRestrict = (userId: string) => {
    const reason = prompt("Raison de la restriction :");
    if (!reason) return;
    const duration = prompt("Durée en jours (7 par défaut) :", "7");
    restrictMutation.mutate({
      userId,
      action: "restrict",
      reason,
      duration: parseInt(duration || "7"),
    });
  };

  const handleBan = (userId: string) => {
    const reason = prompt("Raison du bannissement :");
    if (!reason) return;
    if (confirm("Confirmer le bannissement ?")) {
      restrictMutation.mutate({ userId, action: "ban", reason });
    }
  };

  const handleUnrestrict = (userId: string) => {
    restrictMutation.mutate({ userId, action: "unrestrict" });
  };

  return (
    <div className="space-y-8 animate-fadeInUp">
      <h1 className="text-3xl font-display font-bold text-text dark:text-white">
        Gestion des membres
      </h1>

      {/* Barre de recherche */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-surface border border-border dark:border-white/10 text-text dark:text-white placeholder-text-secondary dark:placeholder-gray-500 focus:outline-none focus:border-primary transition"
          />
          <button
            onClick={() => setPage(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-text-secondary hover:text-primary"
            title="Rechercher"
          >
            <Search size={16} />
          </button>
        </div>
        <span className="text-sm text-text-secondary dark:text-gray-400">
          {total} membre{total > 1 ? "s" : ""} · Page {page}/{totalPages}
        </span>
      </div>

      {/* Tableau */}
      <div className="card-premium overflow-x-auto !p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : members.length === 0 ? (
          <p className="text-text-secondary italic p-6 text-center">
            Aucun membre trouvé.
          </p>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border dark:border-white/10">
                <th className="p-4 text-left text-sm font-medium text-text-secondary">
                  Nom
                </th>
                <th className="p-4 text-left text-sm font-medium text-text-secondary">
                  Email
                </th>
                <th className="p-4 text-left text-sm font-medium text-text-secondary">
                  Rôle
                </th>
                <th className="p-4 text-left text-sm font-medium text-text-secondary">
                  KYC
                </th>
                <th className="p-4 text-left text-sm font-medium text-text-secondary">
                  Dons
                </th>
                <th className="p-4 text-left text-sm font-medium text-text-secondary">
                  Restriction
                </th>
                <th className="p-4 text-left text-sm font-medium text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-border/50 dark:border-white/5"
                >
                  <td className="p-4 text-text">
                    <UserName
                      userId={m.id}
                      firstName={m.firstName}
                      lastName={m.lastName}
                    />
                  </td>
                  <td className="p-4 text-text-secondary">{m.email}</td>
                  <td className="p-4 text-text-secondary">{m.role}</td>
                  <td className="p-4 text-text-secondary">{m.kycLevel}</td>
                  <td className="p-4 text-text">
                    {m.totalDonated?.toLocaleString()} FCFA
                  </td>
                  <td className="p-4 text-text-secondary">
                    {m.restrictedUntil
                      ? `Jusqu'au ${new Date(m.restrictedUntil).toLocaleDateString()}`
                      : "Aucune"}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRestrict(m.id)}
                        className="text-orange-400 dark:text-orange-300 hover:text-orange-300 dark:hover:text-orange-200"
                        title="Restreindre"
                      >
                        <Clock size={16} />
                      </button>
                      <button
                        onClick={() => handleBan(m.id)}
                        className="text-red-400 dark:text-red-300 hover:text-red-300 dark:hover:text-red-200"
                        title="Bannir"
                      >
                        <Ban size={16} />
                      </button>
                      <button
                        onClick={() => handleUnrestrict(m.id)}
                        className="text-green-400 dark:text-green-300 hover:text-green-300 dark:hover:text-green-200"
                        title="Libérer"
                      >
                        <Unlock size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="secondary"
            size="sm"
          >
            <ChevronLeft size={16} /> Précédent
          </Button>
          <span className="text-sm text-text-secondary dark:text-gray-400">
            Page {page} / {totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
            variant="secondary"
            size="sm"
          >
            Suivant <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}