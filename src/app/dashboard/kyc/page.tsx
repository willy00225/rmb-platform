"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Upload, CheckCircle, XCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function KycPage() {
  const queryClient = useQueryClient();

  // Récupération des documents
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["kycDocs"],
    queryFn: () => fetch("/api/kyc").then(res => res.json()),
  });

  // Mutation pour soumettre un document
  const uploadMutation = useMutation({
    mutationFn: ({ type, fileUrl }: { type: string; fileUrl: string }) =>
      fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, fileUrl }),
      }).then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.error || "Erreur"); });
        return res.json();
      }),
    onSuccess: () => {
      toast.success("Document soumis");
      queryClient.invalidateQueries({ queryKey: ["kycDocs"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleUpload = (type: string) => {
    const fileUrl = prompt("Entrez l'URL du fichier (pour test) :");
    if (!fileUrl) return;
    uploadMutation.mutate({ type, fileUrl });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-white">Vérification d'identité (KYC)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg">
          <h2 className="text-lg font-semibold text-white mb-4">Soumettre un document</h2>
          <div className="space-y-3">
            <Button
              onClick={() => handleUpload("ID_CARD")}
              variant="secondary"
              className="w-full justify-start"
              disabled={uploadMutation.isPending}
            >
              <Upload size={16} /> Pièce d'identité (CNI, Passeport)
            </Button>
            <Button
              onClick={() => handleUpload("SELFIE")}
              variant="secondary"
              className="w-full justify-start"
              disabled={uploadMutation.isPending}
            >
              <Upload size={16} /> Selfie avec la pièce
            </Button>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg">
          <h2 className="text-lg font-semibold text-white mb-4">Mes documents</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full" />
            </div>
          ) : docs.length === 0 ? (
            <p className="text-gray-500 italic">Aucun document soumis.</p>
          ) : (
            <ul className="space-y-3">
              {docs.map((doc: any) => (
                <li key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div>
                    <p className="text-white">{doc.type === "ID_CARD" ? "Pièce d'identité" : "Selfie"}</p>
                    <p className="text-sm text-gray-400">
                      {doc.status === "PENDING" && <span className="flex items-center gap-1"><Clock size={14} /> En attente</span>}
                      {doc.status === "APPROVED" && <span className="flex items-center gap-1 text-green-400"><CheckCircle size={14} /> Validé</span>}
                      {doc.status === "REJECTED" && <span className="flex items-center gap-1 text-red-400"><XCircle size={14} /> Rejeté</span>}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}