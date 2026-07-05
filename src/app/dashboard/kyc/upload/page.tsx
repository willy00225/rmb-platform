"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Upload, Loader2, ShieldAlert, ImagePlus, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

// Types de documents obligatoires
const REQUIRED_TYPES = ["ID_CARD_FRONT", "ID_CARD_BACK", "SELFIE"] as const;

export default function KycUploadPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // État pour chaque type de document
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

  // Récupérer les tentatives restantes
  useEffect(() => {
    fetch("/api/kyc/attempts")
      .then(res => res.json())
      .then(data => setAttemptsLeft(data.remaining ?? null))
      .catch(() => setAttemptsLeft(null));
  }, []);

  // Récupérer les documents déjà soumis
  useEffect(() => {
    fetch("/api/kyc")
      .then(res => res.json())
      .then((docs: { type: string; status: string }[]) => {
        setExistingDocs(docs);
        setLoadingExisting(false);
      })
      .catch(() => setLoadingExisting(false));
  }, []);

  // Déterminer quels types de documents sont déjà soumis (et non rejetés définitivement)
  const getMissingTypes = () => {
    const submittedTypes = existingDocs
      .filter(doc => doc.status !== "REJECTED") // On considère que REJECTED signifie qu'il faut en renvoyer un nouveau
      .map(doc => doc.type);
    // Gérer la compatibilité de l'ancien type "ID_CARD" (recto)
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
    // Vérifier que tous les champs obligatoires (manquants) sont remplis
    const hasAllRequired = missingTypes.every(type => files[type] !== null);
    if (!hasAllRequired) {
      toast.error("Veuillez fournir tous les documents manquants.");
      return;
    }

    setUploading(true);
    try {
      // Envoyer chaque document un par un à l'API KYC
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

  return (
    <div className="max-w-md mx-auto space-y-8 animate-fadeInUp py-12">
      <h1 className="text-3xl font-display font-bold text-text">
        {missingTypes.length === 3 ? "Soumettre mes documents" : "Compléter mon dossier"}
      </h1>

      {kycLevel && (
        <div className="text-sm text-text-secondary">
          Niveau actuel : <span className="font-semibold text-primary">{kycLevel}</span>
        </div>
      )}

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
                  <p className="text-sm font-medium text-text mb-2">{getLabel(type)}</p>
                  {!previews[type] ? (
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border dark:border-white/10 rounded-2xl cursor-pointer hover:border-primary transition bg-gray-50 dark:bg-white/5">
                      <ImagePlus size={24} className="text-text-secondary mb-1" />
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
                      <img src={previews[type]!} alt={getLabel(type)} className="w-full h-32 object-cover rounded-2xl" />
                      <button
                        onClick={() => removeFile(type)}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
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