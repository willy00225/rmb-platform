import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Upload, Clock, CheckCircle, XCircle, ArrowRight, FileCheck, Camera, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function KycPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { kycDocuments: { orderBy: { createdAt: "desc" } } },
  });

  if (!user) redirect("/auth/login");

  const isVerified = user.kycLevel === "ID_VERIFIED" || user.kycLevel === "AMBASSADOR";
  const hasPending = user.kycDocuments.some((doc) => doc.status === "PENDING");

  // Déterminer le statut global pour la barre de progression
  const statusStep = isVerified ? 3 : hasPending ? 2 : 1;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeInUp py-8 px-4">
      {/* En-tête */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
          <ShieldCheck size={40} className="text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-text">
          Vérification d&apos;identité
        </h1>
        <p className="text-text-secondary mt-3 max-w-lg mx-auto">
          Pour accéder à toutes les fonctionnalités du Réseau Mondial des Bétés, veuillez vérifier votre identité en quelques étapes simples.
        </p>
      </div>

      {/* Barre de progression */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-4">
          {["Soumission", "Vérification", "Validé"].map((label, index) => {
            const step = index + 1;
            const isActive = step <= statusStep;
            const isCurrent = step === statusStep;
            return (
              <div key={label} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    isActive
                      ? "bg-primary text-white"
                      : "bg-gray-200 dark:bg-white/10 text-text-secondary"
                  } ${isCurrent ? "ring-4 ring-primary/30" : ""}`}
                >
                  {step === 1 ? <Upload size={18} /> : step === 2 ? <Clock size={18} /> : <CheckCircle size={18} />}
                </div>
                <span className="text-xs mt-2 text-center font-medium text-text">{label}</span>
              </div>
            );
          })}
        </div>
        <div className="relative w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${((statusStep - 1) / 2) * 100}%` }}
          />
        </div>
      </div>

      {/* Carte principale selon l'état */}
      {isVerified ? (
        <div className="card-premium p-8 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border-2 border-green-500/30">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-text">Vérification réussie</h2>
          <p className="text-text-secondary mt-2 max-w-md mx-auto">
            Votre identité a été vérifiée. Vous pouvez maintenant profiter pleinement de toutes les fonctionnalités de la plateforme.
          </p>
          <Link href="/dashboard">
            <Button variant="primary" size="lg" className="mt-6">
              Accéder au tableau de bord <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      ) : hasPending ? (
        <div className="card-premium p-8 text-center bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-500/10 dark:to-amber-500/10 border-2 border-yellow-500/30">
          <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
            <Clock size={36} className="text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-text">Vérification en cours</h2>
          <p className="text-text-secondary mt-2 max-w-md mx-auto">
            Vos documents ont bien été reçus et sont en cours d&apos;examen par notre équipe.
          </p>
          <p className="text-text-secondary mt-1 text-sm">
            Vous recevrez une notification dès que votre identité sera vérifiée. En attendant, vous pouvez continuer à compléter votre profil.
          </p>
          <Link href="/dashboard/profile">
            <Button variant="secondary" size="lg" className="mt-6">
              Aller à mon profil
            </Button>
          </Link>
        </div>
      ) : (
        <div className="card-premium p-8">
          <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
            <FileCheck size={24} className="text-primary" />
            Documents requis
          </h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Upload size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-text font-medium">Pièce d&apos;identité</p>
                <p className="text-text-secondary text-sm">CNI, passeport, carte consulaire (recto/verso)</p>
              </div>
            </li>
            <li className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Camera size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-text font-medium">Selfie avec votre pièce</p>
                <p className="text-text-secondary text-sm">Une photo de vous tenant votre pièce d&apos;identité</p>
              </div>
            </li>
          </ul>

          {/* Historique des documents */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-text">Mes documents soumis</h3>
            {user.kycDocuments.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 dark:bg-white/5 rounded-xl border border-border dark:border-white/10">
                <AlertTriangle size={24} className="mx-auto text-text-secondary mb-2" />
                <p className="text-text-secondary italic">Aucun document soumis pour le moment.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {user.kycDocuments.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      {doc.type === "ID_CARD" ? (
                        <Upload size={18} className="text-text-secondary" />
                      ) : (
                        <Camera size={18} className="text-text-secondary" />
                      )}
                      <span className="text-text">
                        {doc.type === "ID_CARD" ? "Pièce d'identité" : "Selfie"}
                      </span>
                    </div>
                    <span
                      className={`flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${
                        doc.status === "PENDING"
                          ? "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                          : doc.status === "APPROVED"
                          ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {doc.status === "PENDING" && <Clock size={14} />}
                      {doc.status === "APPROVED" && <CheckCircle size={14} />}
                      {doc.status === "REJECTED" && <XCircle size={14} />}
                      {doc.status === "PENDING"
                        ? "En attente"
                        : doc.status === "APPROVED"
                        ? "Validé"
                        : "Rejeté"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-8 flex gap-4 justify-center">
            <Link href="/dashboard/kyc/upload">
              <Button variant="primary" size="lg">
                <Upload size={18} className="mr-2" /> Soumettre un document
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}