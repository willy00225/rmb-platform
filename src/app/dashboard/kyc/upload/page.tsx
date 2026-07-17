"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Upload, Loader2, ShieldAlert, ImagePlus, X, Check, CheckCircle, FileText, Clock, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

const REQUIRED_TYPES = ["ID_CARD_FRONT", "ID_CARD_BACK", "SELFIE"] as const;

export default function KycUploadPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [files, setFiles] = useState<Record<string, File | null>>({
    ID_CARD_FRONT: null,
    ID_CARD_BACK: null,
    SELFIE: null,
  });
  const [previews, setPreviews] = useState<Record<string, string | null>>({
    ID_CARD_FRONT: null,
    ID_CARD_BACK: null,
    SELFIE: null,
  });

  const [uploading, setUploading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [existingDocs, setExistingDocs] = useState<{ type: string; status: string }[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    fetch("/api/kyc/attempts")
      .then(res => res.json())
      .then(data => setAttemptsLeft(data.remaining ?? null))
      .catch(() => setAttemptsLeft(null));
  }, []);

  useEffect(() => {
    fetch("/api/kyc")
      .then(res => res.json())
      .then((docs: { type: string; status: string }[]) => {
        setExistingDocs(docs);
        setLoadingExisting(false);
      })
      .catch(() => setLoadingExisting(false));
  }, []);

  const getMissingTypes = () => {
    const submittedTypes = existingDocs
      .filter(doc => doc.status !== "REJECTED")
      .map(doc => doc.type);
    if (submittedTypes.includes("ID_CARD") && !submittedTypes.includes("ID_CARD_FRONT")) {
      submittedTypes.push("ID_CARD_FRONT");
    }
    return REQUIRED_TYPES.filter(type => !submittedTypes.includes(type));
  };

  const missingTypes = getMissingTypes();

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string
  ) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image (JPEG, PNG, etc.).");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      toast.error("La taille du fichier ne doit pas dépasser 10 Mo.");
      return;
    }

    setFiles(prev => ({ ...prev, [type]: selected }));
    setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(selected) }));
  };

  const removeFile = (type: string) => {
    setFiles(prev => ({ ...prev, [type]: null }));
    setPreviews(prev => ({ ...prev, [type]: null }));
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Échec de l'upload");
    const { url } = await res.json();
    return url;
  };

  const handleSubmit = async () => {
    const hasAllRequired = missingTypes.every(type => files[type] !== null);
    if (!hasAllRequired) {
      toast.error("Veuillez fournir tous les documents manquants.");
      return;
    }

    setUploading(true);
    try {
      for (const type of missingTypes) {
        const file = files[type];
        if (!file) continue;
        const fileUrl = await uploadFile(file);
        const kycRes = await fetch("/api/kyc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, fileUrl }),
        });
        if (!kycRes.ok) {
          const err = await kycRes.json();
          throw new Error(err.error || `Erreur pour ${type}`);
        }
      }

      toast.success("Documents soumis avec succès. Ils seront examinés par un administrateur.");
      router.push("/dashboard/kyc");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const kycLevel = session?.user?.kycLevel;

  const getLabel = (type: string) => {
    switch (type) {
      case "ID_CARD_FRONT": return "Recto de la pièce d'identité";
      case "ID_CARD_BACK": return "Verso de la pièce d'identité";
      case "SELFIE": return "Selfie (portrait tenant la pièce)";
      default: return type;
    }
  };

  const completedCount = 3 - missingTypes.length;

  return (
    <div className="max-w-md mx-auto space-y-8 animate-fadeInUp py-8 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-display font-bold text-text">
          {missingTypes.length === 3 ? "Soumettre mes documents" : "Compléter mon dossier"}
        </h1>
        {kycLevel && (
          <p className="text-sm text-text-secondary mt-2">
            Niveau actuel : <span className="font-semibold text-primary">{kycLevel}</span>
          </p>
        )}
      </div>

      {/* Barre de progression */}
      <div className="card-premium p-4">
        <div className="flex items-center justify-between mb-2">
          {REQUIRED_TYPES.map((type, idx) => {
            const isDone = !missingTypes.includes(type);
            return (
              <div key={type} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isDone ? "bg-primary text-white" : "bg-gray-200 dark:bg-white/10 text-text-secondary"
                }`}>
                  {isDone ? <Check size={14} /> : idx + 1}
                </div>
                <span className="text-[10px] mt-1 text-center text-text-secondary">
                  {type === "ID_CARD_FRONT" ? "Recto" : type === "ID_CARD_BACK" ? "Verso" : "Selfie"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(completedCount / 3) * 100}%` }} />
        </div>
        <p className="text-xs text-text-secondary mt-2 text-center">
          {completedCount}/3 document{completedCount > 1 ? "s" : ""} fourni{completedCount > 1 ? "s" : ""}
        </p>
      </div>

      {/* Alerte de sécurité */}
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3">
        <ShieldAlert size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
            {missingTypes.length === 3 ? "Trois documents obligatoires" : "Documents restants à fournir"}
          </p>
          <p className="text-xs text-red-700 dark:text-red-400 mt-1">
            {missingTypes.length === 3
              ? "Veuillez fournir le recto et le verso de votre pièce d'identité, ainsi qu'un selfie (portrait) tenant la pièce. Toute fraude entraînera la suspension de votre compte."
              : "Vous devez encore fournir les documents manquants pour finaliser votre vérification d'identité."}
          </p>
        </div>
      </div>

      {/* Tentatives restantes */}
      {attemptsLeft !== null && (
        <div className={`p-3 rounded-xl text-sm ${
          attemptsLeft > 0
            ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300"
            : "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300"
        }`}>
          {attemptsLeft > 0 ? (
            <p>Il vous reste <strong>{attemptsLeft}</strong> tentative{attemptsLeft > 1 ? "s" : ""} aujourd'hui.</p>
          ) : (
            <p>Vous avez atteint la limite de soumissions pour aujourd'hui. Veuillez réessayer demain.</p>
          )}
        </div>
      )}

      {loadingExisting ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="card-premium p-6 space-y-6">
          {/* Documents déjà soumis (avec statut) */}
          {existingDocs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <FileText size={16} className="text-primary" /> Documents déjà soumis
              </h3>
              {existingDocs.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10">
                  <div className="flex items-center gap-2">
                    {doc.status === "PENDING" ? (
                      <Clock size={14} className="text-yellow-500" />
                    ) : doc.status === "APPROVED" ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <XCircle size={14} className="text-red-500" />
                    )}
                    <span className="text-sm text-text">{getLabel(doc.type)}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    doc.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : doc.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {doc.status === "PENDING" ? "En attente" : doc.status === "APPROVED" ? "Validé" : "Rejeté"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {missingTypes.length === 0 ? (
            <div className="text-center py-4">
              <Check size={48} className="mx-auto text-green-500 mb-2" />
              <p className="text-text font-medium">Vous avez déjà fourni tous les documents requis.</p>
              <Button onClick={() => router.push("/dashboard/kyc")} variant="primary" className="mt-4">
                Voir mon statut
              </Button>
            </div>
          ) : (
            <>
              {missingTypes.map(type => (
                <div key={type}>
                  <p className="text-sm font-medium text-text mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                    {getLabel(type)}
                  </p>
                  {!previews[type] ? (
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border dark:border-white/10 rounded-2xl cursor-pointer hover:border-primary transition bg-gray-50 dark:bg-white/5 group">
                      <ImagePlus size={24} className="text-text-secondary mb-1 group-hover:text-primary transition" />
                      <span className="text-text-secondary text-xs">Cliquez pour choisir</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, type)}
                        className="hidden"
                        disabled={attemptsLeft === 0}
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <img src={previews[type]!} alt={getLabel(type)} className="w-full h-32 object-cover rounded-2xl border border-border" />
                      <button
                        onClick={() => removeFile(type)}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <Button
                onClick={handleSubmit}
                disabled={missingTypes.some(type => !files[type]) || uploading || attemptsLeft === 0}
                variant="primary"
                size="lg"
                className="w-full"
              >
                {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                <span className="ml-2">{uploading ? "Envoi..." : "Soumettre les documents"}</span>
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}