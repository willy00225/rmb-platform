import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Upload, Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic'; // Désactive le prérendu pour éviter l'erreur React Query

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

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeInUp py-12">
      <div className="text-center">
        <ShieldCheck size={64} className="mx-auto text-primary mb-4" />
        <h1 className="text-3xl font-display font-bold text-text">Vérification d'identité</h1>
        <p className="text-text-secondary mt-2">
          Pour accéder à toutes les fonctionnalités du Réseau Mondial des Bétés, veuillez vérifier votre identité.
        </p>
      </div>

      {isVerified ? (
        <div className="card-premium p-8 text-center">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-text">Vérification réussie</h2>
          <p className="text-text-secondary mt-2">
            Votre identité a été vérifiée. Vous pouvez maintenant profiter de toutes les fonctionnalités.
          </p>
          <Link href="/dashboard">
            <Button variant="primary" className="mt-6">
              Accéder au tableau de bord <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      ) : hasPending ? (
        <div className="card-premium p-8 text-center">
          <Clock size={48} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold text-text">Vérification en cours</h2>
          <p className="text-text-secondary mt-2">
            Vos documents ont bien été reçus et sont en cours d'examen par notre équipe.
          </p>
          <p className="text-text-secondary mt-1">
            Vous recevrez une notification dès que votre identité sera vérifiée. En attendant, vous pouvez continuer à compléter votre profil.
          </p>
          <Link href="/dashboard/profile">
            <Button variant="secondary" className="mt-6">
              Aller à mon profil
            </Button>
          </Link>
        </div>
      ) : (
        <div className="card-premium p-8">
          <h2 className="text-xl font-bold text-text mb-4">Documents requis</h2>
          <ul className="space-y-3 text-text-secondary">
            <li className="flex items-center gap-3">
              <Upload size={18} className="text-primary" />
              Une pièce d'identité (CNI, passeport, carte consulaire)
            </li>
            <li className="flex items-center gap-3">
              <Upload size={18} className="text-primary" />
              Un selfie avec votre pièce d'identité
            </li>
          </ul>

          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-text">Mes documents soumis</h3>
            {user.kycDocuments.length === 0 ? (
              <p className="text-text-secondary italic">Aucun document soumis pour le moment.</p>
            ) : (
              <ul className="space-y-3">
                {user.kycDocuments.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10"
                  >
                    <span className="text-text">
                      {doc.type === "ID_CARD" ? "Pièce d'identité" : "Selfie"}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-sm ${
                        doc.status === "PENDING"
                          ? "text-yellow-500"
                          : doc.status === "APPROVED"
                          ? "text-green-500"
                          : "text-red-500"
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

          <div className="mt-8 flex gap-4">
            <Link href="/dashboard/kyc/upload">
              <Button variant="primary">
                <Upload size={18} className="mr-2" /> Soumettre un document
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}