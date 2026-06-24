"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
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
  };
}

export default function AdminKycPage() {
  const queryClient = useQueryClient();

  const { data: docs = [], isLoading } = useQuery<KycDocument[]>({
    queryKey: ["adminKyc"],
    queryFn: () => fetch("/api/admin/kyc").then(res => res.json()),
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
    onSuccess: ({ action }) => {
      toast.success(action === "approve" ? "Document approuvé" : "Document rejeté");
      queryClient.invalidateQueries({ queryKey: ["adminKyc"] });
    },
    onError: () => {
      toast.error("Erreur lors de l'action");
    },
  });

  const handleAction = (documentId: string, action: "approve" | "reject") => {
    mutation.mutate({ documentId, action });
  };

  if (isLoading)
    return (
      <Loader2 className="animate-spin text-primary mx-auto mt-10" size={32} />
    );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-text dark:text-white">
        Validation KYC
      </h1>
      {docs.length === 0 ? (
        <p className="text-text-secondary italic">Aucun document en attente.</p>
      ) : (
        <div className="space-y-4">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-border dark:border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text dark:text-white font-medium">
                    {doc.user.firstName} {doc.user.lastName}
                  </p>
                  <p className="text-sm text-text-secondary dark:text-gray-400">
                    {doc.user.email}
                  </p>
                  <p className="text-xs text-text-secondary dark:text-gray-500">
                    Type: {doc.type} · Soumis le{" "}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      className="text-primary dark:text-primary text-sm underline"
                    >
                      Voir le document
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAction(doc.id, "approve")}
                    variant="primary"
                    size="sm"
                  >
                    <CheckCircle size={16} /> Valider
                  </Button>
                  <Button
                    onClick={() => handleAction(doc.id, "reject")}
                    variant="secondary"
                    size="sm"
                  >
                    <XCircle size={16} /> Rejeter
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}