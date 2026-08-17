"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  Clock,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

interface KycDocument {
  id: string;
  type: string;
  createdAt: string;
  fileUrl?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
  };
}

// 🔍 Détection des anciennes URLs Supabase
const isSupabaseUrl = (url: string) => {
  return /https?:\/\/(?:[a-z0-9-]+\.)+supabase\.co\//i.test(url);
};

export default function AdminKycPage() {
  const queryClient = useQueryClient();
  const [processingIds, setProcessingIds] = useState<Record<string, "approve" | "reject">>({});
  // État pour gérer les avatars cassés
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});

  const { data: docs = [], isLoading, isError } = useQuery<KycDocument[]>({
    queryKey: ["adminKyc"],
    queryFn: () => fetch("/api/admin/kyc").then((res) => res.json()),
  });

  const mutation = useMutation({
    mutationFn: async ({ documentId, action }: { documentId: string; action: "approve" | "reject" }) => {
      const res = await fetch("/api/admin/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, action }),
      });
      if (!res.ok) throw new Error("Erreur");
      return { documentId, action };
    },
    onSuccess: ({ action, documentId }) => {
      toast.success(action === "approve" ? "Document approuvé" : "Document rejeté");
      setProcessingIds((prev) => {
        const next = { ...prev };
        delete next[documentId];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["adminKyc"] });
    },
    onError: (_error, variables) => {
      toast.error("Erreur lors de l'action");
      setProcessingIds((prev) => {
        const next = { ...prev };
        delete next[variables.documentId];
        return next;
      });
    },
  });

  const handleAction = (documentId: string, action: "approve" | "reject") => {
    setProcessingIds((prev) => ({ ...prev, [documentId]: action }));
    mutation.mutate({ documentId, action });
  };

  const pendingCount = docs.length;

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-text-secondary animate-pulse">Chargement des documents...</p>
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
            <ShieldAlert size={28} className="text-primary" />
            Validation KYC
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Vérifiez les documents d&apos;identité des membres
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2">
            <Clock size={16} />
            {pendingCount} document{pendingCount > 1 ? "s" : ""} en attente
          </div>
        )}
      </div>

      {/* Liste des documents */}
      {docs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-8 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Aucun document en attente</h2>
          <p className="text-text-secondary max-w-md mx-auto">
            Tous les documents KYC ont été traités. Revenez plus tard.
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
          {docs.map((doc) => {
            const isProcessing = processingIds[doc.id];
            const docTypeLabel =
              doc.type === "ID_CARD"
                ? "Pièce d'identité"
                : doc.type === "SELFIE"
                ? "Selfie"
                : doc.type === "ID_CARD_FRONT"
                ? "Recto CNI"
                : doc.type === "ID_CARD_BACK"
                ? "Verso CNI"
                : doc.type;

            // ⚠️ Vérification de l'URL du document
            const isDocumentUnavailable = doc.fileUrl ? isSupabaseUrl(doc.fileUrl) : false;

            return (
              <motion.div
                key={doc.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className={`card-premium p-5 transition-all ${
                  isProcessing ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0 overflow-hidden">
                        {doc.user.avatar && !avatarErrors[doc.id] ? (
                          <img
                            src={doc.user.avatar}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={() =>
                              setAvatarErrors((prev) => ({ ...prev, [doc.id]: true }))
                            }
                          />
                        ) : (
                          `${doc.user.firstName[0]}${doc.user.lastName[0]}`
                        )}
                      </div>
                      <div>
                        <p className="text-text font-semibold">
                          {doc.user.firstName} {doc.user.lastName}
                        </p>
                        <p className="text-xs text-text-secondary">{doc.user.email}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <FileText size={14} />
                        {docTypeLabel}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(doc.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {/* Badge indisponible si nécessaire */}
                      {isDocumentUnavailable && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-medium">
                          <XCircle size={12} />
                          Document indisponible
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {doc.fileUrl && !isDocumentUnavailable && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-white/10 transition"
                        title="Voir le document"
                      >
                        <Eye size={18} />
                      </a>
                    )}
                    {isDocumentUnavailable && (
                      <span className="text-xs text-text-secondary italic">N/A</span>
                    )}
                    <Button
                      onClick={() => handleAction(doc.id, "approve")}
                      disabled={!!isProcessing}
                      variant="primary"
                      size="sm"
                    >
                      {isProcessing === "approve" ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                      <span className="ml-1 hidden sm:inline">Valider</span>
                    </Button>
                    <Button
                      onClick={() => handleAction(doc.id, "reject")}
                      disabled={!!isProcessing}
                      variant="secondary"
                      size="sm"
                    >
                      {isProcessing === "reject" ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <XCircle size={14} />
                      )}
                      <span className="ml-1 hidden sm:inline">Rejeter</span>
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