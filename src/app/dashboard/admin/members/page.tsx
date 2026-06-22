"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, Clock, Ban, Unlock } from "lucide-react";
import toast from "react-hot-toast";
import { UserName } from "@/components/ui/UserName";

export default function AdminMembersPage() {
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin-members"],
    queryFn: () => fetch("/api/admin/members").then(res => res.json()),
  });

  const restrictMutation = useMutation({
    mutationFn: ({ userId, action, reason, duration }: any) =>
      fetch(`/api/admin/users/${userId}/restrict`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason, duration }),
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
    restrictMutation.mutate({ userId, action: "restrict", reason, duration: parseInt(duration || "7") });
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

  if (isLoading) return <Loader2 className="animate-spin text-primary mx-auto mt-10" size={32} />;

  return (
    <div className="space-y-8 animate-fadeInUp">
      <h1 className="text-3xl font-display font-bold text-text">Gestion des membres</h1>

      <div className="card-premium overflow-x-auto !p-0">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border dark:border-white/10">
              <th className="p-4 text-left text-sm font-medium text-text-secondary">Nom</th>
              <th className="p-4 text-left text-sm font-medium text-text-secondary">Email</th>
              <th className="p-4 text-left text-sm font-medium text-text-secondary">Rôle</th>
              <th className="p-4 text-left text-sm font-medium text-text-secondary">KYC</th>
              <th className="p-4 text-left text-sm font-medium text-text-secondary">Dons</th>
              <th className="p-4 text-left text-sm font-medium text-text-secondary">Restriction</th>
              <th className="p-4 text-left text-sm font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m: any) => (
              <tr key={m.id} className="border-b border-border/50 dark:border-white/5">
                <td className="p-4 text-text">
                  <UserName userId={m.id} firstName={m.firstName} lastName={m.lastName} />
                </td>
                <td className="p-4 text-text-secondary">{m.email}</td>
                <td className="p-4 text-text-secondary">{m.role}</td>
                <td className="p-4 text-text-secondary">{m.kycLevel}</td>
                <td className="p-4 text-text">{m.totalDonated?.toLocaleString()} FCFA</td>
                <td className="p-4 text-text-secondary">
                  {m.restrictedUntil ? `Jusqu'au ${new Date(m.restrictedUntil).toLocaleDateString()}` : "Aucune"}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleRestrict(m.id)} className="text-orange-400 hover:text-orange-300" title="Restreindre">
                      <Clock size={16} />
                    </button>
                    <button onClick={() => handleBan(m.id)} className="text-red-400 hover:text-red-300" title="Bannir">
                      <Ban size={16} />
                    </button>
                    <button onClick={() => handleUnrestrict(m.id)} className="text-green-400 hover:text-green-300" title="Libérer">
                      <Unlock size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}