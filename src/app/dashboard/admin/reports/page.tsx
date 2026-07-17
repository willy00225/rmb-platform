"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Flag,
  User,
  Clock,
  MessageSquare,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

interface Report {
  id: string;
  reason: string;
  createdAt: string;
  reporter: { firstName: string; lastName: string };
  post?: { content: string };
  comment?: { content: string };
}

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [processingIds, setProcessingIds] = useState<Record<string, "RESOLVED" | "DISMISSED">>({});

  const { data: reports = [], isLoading, isError } = useQuery<Report[]>({
    queryKey: ["adminReports"],
    queryFn: () => fetch("/api/admin/reports").then((res) => res.json()),
  });

  const resolveMutation = useMutation({
    mutationFn: async ({
      reportId,
      status,
    }: {
      reportId: string;
      status: "RESOLVED" | "DISMISSED";
    }) => {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status }),
      });
      if (!res.ok) throw new Error("Erreur");
      return { reportId, status };
    },
    onMutate: ({ reportId, status }) => {
      setProcessingIds((prev) => ({ ...prev, [reportId]: status }));
    },
    onSettled: (_data, _error, variables) => {
      setProcessingIds((prev) => {
        const next = { ...prev };
        delete next[variables.reportId];
        return next;
      });
    },
    onSuccess: ({ status }) => {
      toast.success(status === "RESOLVED" ? "Signalement résolu" : "Signalement ignoré");
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
    },
    onError: () => toast.error("Erreur lors de l'action"),
  });

  const handleResolve = (reportId: string, status: "RESOLVED" | "DISMISSED") => {
    resolveMutation.mutate({ reportId, status });
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-text-secondary animate-pulse">Chargement des signalements...</p>
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-20 text-red-500">
        <AlertTriangle size={32} className="mx-auto mb-2" />
        Erreur de chargement. Veuillez réessayer.
      </div>
    );

  const pendingCount = reports.length;

  return (
    <div className="space-y-8 animate-fadeInUp pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
              <Flag size={22} className="text-orange-600 dark:text-orange-400" />
            </div>
            Modération
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Examinez les signalements et prenez les mesures nécessaires
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2">
            <AlertTriangle size={16} />
            {pendingCount} signalement{pendingCount > 1 ? "s" : ""} en attente
          </div>
        )}
      </div>

      {/* Liste des signalements */}
      {reports.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-8 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">
            Aucun signalement en attente
          </h2>
          <p className="text-text-secondary max-w-md mx-auto">
            Tous les signalements ont été traités. La communauté est en ordre !
          </p>
        </motion.div>
      ) : (
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
          className="space-y-4"
        >
          {reports.map((report) => {
            const isProcessing = processingIds[report.id];

            return (
              <motion.div
                key={report.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className={`card-premium p-5 transition-all ${
                  isProcessing ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* En-tête du signalement */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <Flag size={16} className="text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-text font-medium">
                          Signalement de {report.reporter.firstName} {report.reporter.lastName}
                        </p>
                        <p className="text-xs text-text-secondary flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(report.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Raison */}
                    <div className="mt-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20">
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                        Raison : {report.reason}
                      </p>
                    </div>

                    {/* Contenu signalé */}
                    {report.post && (
                      <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10">
                        <p className="text-xs font-medium text-text-secondary mb-1 flex items-center gap-1">
                          <FileText size={14} />
                          Publication signalée
                        </p>
                        <p className="text-text text-sm italic">
                          &ldquo;{report.post.content.substring(0, 150)}
                          {report.post.content.length > 150 ? "..." : ""}&rdquo;
                        </p>
                      </div>
                    )}
                    {report.comment && (
                      <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10">
                        <p className="text-xs font-medium text-text-secondary mb-1 flex items-center gap-1">
                          <MessageSquare size={14} />
                          Commentaire signalé
                        </p>
                        <p className="text-text text-sm italic">
                          &ldquo;{report.comment.content.substring(0, 150)}
                          {report.comment.content.length > 150 ? "..." : ""}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:self-start">
                    <Button
                      onClick={() => handleResolve(report.id, "RESOLVED")}
                      disabled={!!isProcessing}
                      variant="primary"
                      size="sm"
                    >
                      {isProcessing === "RESOLVED" ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                      <span className="ml-1 hidden sm:inline">Résoudre</span>
                    </Button>
                    <Button
                      onClick={() => handleResolve(report.id, "DISMISSED")}
                      disabled={!!isProcessing}
                      variant="secondary"
                      size="sm"
                    >
                      {isProcessing === "DISMISSED" ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <XCircle size={14} />
                      )}
                      <span className="ml-1 hidden sm:inline">Ignorer</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}