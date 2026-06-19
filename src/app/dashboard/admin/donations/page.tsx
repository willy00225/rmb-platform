"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Check, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminDonationsPage() {
  const queryClient = useQueryClient();

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ["adminDonations"],
    queryFn: () => fetch("/api/admin/manual-donations").then(res => res.json()),
  });

  const mutation = useMutation({
    mutationFn: async ({ donationId, action }: { donationId: string; action: "confirm" | "reject" }) => {
      const res = await fetch("/api/admin/manual-donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId, action }),
      });
      if (!res.ok) throw new Error("Erreur");
      return action;
    },
    onSuccess: (action) => {
      toast.success(action === "confirm" ? "Don confirmé" : "Don rejeté");
      queryClient.invalidateQueries({ queryKey: ["adminDonations"] });
    },
    onError: () => {
      toast.error("Erreur");
    },
  });

  const handleAction = (donationId: string, action: "confirm" | "reject") => {
    mutation.mutate({ donationId, action });
  };

  if (isLoading) return <Loader2 className="animate-spin text-brand-500 mx-auto mt-10" size={32} />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-white">Validation des dons</h1>
      {donations.length === 0 ? (
        <p className="text-gray-500 italic">Aucun don en attente.</p>
      ) : (
        <div className="space-y-4">
          {donations.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
              <div>
                <p className="text-white font-medium">{d.user.firstName} {d.user.lastName}</p>
                <p className="text-sm text-gray-400">{d.amount} XOF • {d.network} • {new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleAction(d.id, "confirm")} variant="primary" size="sm">
                  <Check size={16} /> Confirmer
                </Button>
                <Button onClick={() => handleAction(d.id, "reject")} variant="secondary" size="sm">
                  <X size={16} /> Rejeter
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}