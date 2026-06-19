"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, Shield, UserX, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { UserName } from "@/components/ui/UserName";

export default function AdminMembersPage() {
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["adminMembers"],
    queryFn: () => fetch("/api/admin/members").then(res => res.json()),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Erreur");
      return { userId, role };
    },
    onSuccess: ({ userId, role }) => {
      toast.success("Rôle mis à jour");
      queryClient.setQueryData(["adminMembers"], (old: any[]) =>
        old?.map(m => (m.id === userId ? { ...m, role } : m))
      );
    },
    onError: () => toast.error("Erreur lors de la mise à jour du rôle"),
  });

  const updateKycMutation = useMutation({
    mutationFn: async ({ userId, kycLevel }: { userId: string; kycLevel: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kycLevel }),
      });
      if (!res.ok) throw new Error("Erreur");
      return { userId, kycLevel };
    },
    onSuccess: ({ userId, kycLevel }) => {
      toast.success("KYC mis à jour");
      queryClient.setQueryData(["adminMembers"], (old: any[]) =>
        old?.map(m => (m.id === userId ? { ...m, kycLevel } : m))
      );
    },
    onError: () => toast.error("Erreur lors de la mise à jour du KYC"),
  });

  if (isLoading) return <Loader2 className="animate-spin text-brand-500 mx-auto mt-10" size={32} />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-white">Gestion des membres</h1>

      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-4 text-left text-sm font-medium text-gray-400">Nom</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400">Email</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400">Rôle</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400">KYC</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400">Niv.</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400">Dons</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400">Inscrit le</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m: any) => (
              <tr key={m.id} className="border-b border-white/5">
                <td className="p-4 text-white">
                  <UserName userId={m.id} firstName={m.firstName} lastName={m.lastName} />
                </td>
                <td className="p-4 text-gray-300">{m.email}</td>
                <td className="p-4 text-gray-300">
                  <select
                    value={m.role}
                    onChange={(e) => updateRoleMutation.mutate({ userId: m.id, role: e.target.value })}
                    className="px-2 py-1 rounded bg-white/10 border border-white/10 text-white text-sm"
                  >
                    <option value="MEMBER">Membre</option>
                    <option value="MODERATOR">Modérateur</option>
                    <option value="ADMIN">Admin</option>
                    {m.role === "SUPER_ADMIN" && <option value="SUPER_ADMIN">Super Admin</option>}
                  </select>
                </td>
                <td className="p-4 text-gray-300">
                  <select
                    value={m.kycLevel}
                    onChange={(e) => updateKycMutation.mutate({ userId: m.id, kycLevel: e.target.value })}
                    className="px-2 py-1 rounded bg-white/10 border border-white/10 text-white text-sm"
                  >
                    <option value="NONE">Aucun</option>
                    <option value="PHONE">Téléphone</option>
                    <option value="ID_VERIFIED">Pièce vérifiée</option>
                    <option value="AMBASSADOR">Ambassadeur</option>
                  </select>
                </td>
                <td className="p-4 text-white">{m.level}</td>
                <td className="p-4 text-white">{m.totalDonated.toLocaleString()} XOF</td>
                <td className="p-4 text-gray-300">{new Date(m.createdAt).toLocaleDateString("fr-FR")}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateRoleMutation.mutate({ userId: m.id, role: "SUSPENDED" })}
                      className="text-red-400 hover:text-red-300"
                      title="Suspendre"
                    >
                      <UserX size={16} />
                    </button>
                    <button
                      onClick={() => updateKycMutation.mutate({ userId: m.id, kycLevel: "ID_VERIFIED" })}
                      className="text-green-400 hover:text-green-300"
                      title="Valider KYC"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      onClick={() => updateKycMutation.mutate({ userId: m.id, kycLevel: "NONE" })}
                      className="text-gray-400 hover:text-gray-300"
                      title="Réinitialiser KYC"
                    >
                      <XCircle size={16} />
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