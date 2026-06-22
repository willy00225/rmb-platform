"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Upload, Loader2, Camera, AlertTriangle, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

export default function KycUploadPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [type, setType] = useState("ID_CARD");
  const [uploading, setUploading] = useState(false);

  // Optionnel : récupérer les tentatives restantes
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  useEffect(() => {
    // Appeler une API pour connaître le nombre de tentatives restantes
    fetch("/api/kyc/attempts")
      .then(res => res.json())
      .then(data => setAttemptsLeft(data.remaining ?? null))
      .catch(() => setAttemptsLeft(null));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Vérification du type de fichier
    if (!selected.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image (JPEG, PNG, etc.).");
      return;
    }

    // Vérification de la taille (max 10 Mo)
    if (selected.size > 10 * 1024 * 1024) {
      toast.error("La taille du fichier ne doit pas dépasser 10 Mo.");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      // 1. Upload du fichier
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Échec de l'upload");
      const { url } = await uploadRes.json();

      // 2. Créer le document KYC
      const kycRes = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, fileUrl: url }),
      });
      if (!kycRes.ok) {
        const err = await kycRes.json();
        throw new Error(err.error || "Erreur création KYC");
      }

      toast.success("Document soumis avec succès. Il sera examiné par un administrateur.");
      router.push("/dashboard/kyc");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setUploading(false);
    }
  };

  const kycLevel = session?.user?.kycLevel;

  return (
    <div className="max-w-md mx-auto space-y-8 animate-fadeInUp py-12">
      <h1 className="text-3xl font-display font-bold text-text">Soumettre un document</h1>

      {/* Statut KYC actuel */}
      {kycLevel && (
        <div className="text-sm text-text-secondary">
          Niveau actuel : <span className="font-semibold text-primary">{kycLevel}</span>
        </div>
      )}

      {/* Avertissement */}
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3">
        <ShieldAlert size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
            Documents officiels obligatoires
          </p>
          <p className="text-xs text-red-700 dark:text-red-400 mt-1">
            Toute tentative de fraude entraînera la suspension de votre compte. 
            Veuillez fournir des documents authentiques et lisibles.
          </p>
        </div>
      </div>

      {/* Tentatives restantes */}
      {attemptsLeft !== null && (
        <div className={`p-3 rounded-xl text-sm ${
          attemptsLeft > 0 ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300" :
          "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300"
        }`}>
          {attemptsLeft > 0 ? (
            <p>Il vous reste <strong>{attemptsLeft}</strong> tentative{attemptsLeft > 1 ? "s" : ""} aujourd'hui.</p>
          ) : (
            <p>Vous avez atteint la limite de soumissions pour aujourd'hui. Veuillez réessayer demain.</p>
          )}
        </div>
      )}

      <div className="card-premium p-6 space-y-6">
        <div>
          <label className="text-sm text-text-secondary">Type de document</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text"
          >
            <option value="ID_CARD">Pièce d'identité (CNI, Passeport)</option>
            <option value="SELFIE">Selfie avec la pièce d'identité</option>
          </select>
        </div>

        {!preview ? (
          <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border dark:border-white/10 rounded-2xl cursor-pointer hover:border-primary transition bg-gray-50 dark:bg-white/5">
            <Camera size={40} className="text-text-secondary mb-2" />
            <span className="text-text-secondary">Cliquez pour choisir une photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={attemptsLeft === 0}
            />
          </label>
        ) : (
          <div className="relative">
            <img src={preview} alt="Aperçu" className="w-full h-48 object-cover rounded-2xl" />
            <button
              onClick={() => { setFile(null); setPreview(null); }}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
            >
              ✕
            </button>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!file || uploading || attemptsLeft === 0}
          variant="primary"
          size="lg"
          className="w-full"
        >
          {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
          <span className="ml-2">{uploading ? "Envoi..." : "Soumettre"}</span>
        </Button>
      </div>
    </div>
  );
}