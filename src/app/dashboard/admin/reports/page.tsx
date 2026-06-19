"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminReportsPage() {
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["adminReports"],
    queryFn: () => fetch("/api/admin/reports").then(res => res.json()),
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: "RESOLVED" | "DISMISSED" }) => {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status }),
      });
      if (!res.ok) throw new Error("Erreur");
      return { reportId, status };
    },
    onSuccess: ({ status }) => {
      toast.success(status === "RESOLVED" ? "Résolu" : "Ignoré");
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
    },
    onError: () => toast.error("Erreur lors de l'action"),
  });

  const handleResolve = (reportId: string, status: "RESOLVED" | "DISMISSED") => {
    resolveMutation.mutate({ reportId, status });
  };

  if (isLoading) return <Loader2 className="animate-spin text-brand-500 mx-auto mt-10" size={32} />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-white">Modération</h1>
      {reports.length === 0 ? (
        <p className="text-gray-500 italic">Aucun signalement en attente.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r: any) => (
            <div key={r.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400">
                Signalé par {r.reporter.firstName} {r.reporter.lastName} le {new Date(r.createdAt).toLocaleDateString("fr-FR")}
              </p>
              <p className="text-white mt-1">{r.reason}</p>
              {r.post && <p className="text-gray-300 mt-2 text-sm italic">"{r.post.content.substring(0, 100)}..."</p>}
              {r.comment && <p className="text-gray-300 mt-2 text-sm italic">"{r.comment.content.substring(0, 100)}..."</p>}
              <div className="flex gap-2 mt-3">
                <Button onClick={() => handleResolve(r.id, "RESOLVED")} variant="primary" size="sm">
                  <CheckCircle size={16} /> Résoudre
                </Button>
                <Button onClick={() => handleResolve(r.id, "DISMISSED")} variant="secondary" size="sm">
                  <XCircle size={16} /> Ignorer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}