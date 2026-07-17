"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { QRScanner } from "@/components/events/QRScanner";
import toast from "react-hot-toast";
import {
  Loader2,
  CheckCircle,
  QrCode,
  UserPlus,
  ArrowLeft,
  Users,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default function EventCheckInPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [lastMember, setLastMember] = useState<{
    name: string;
    time: string;
  } | null>(null);

  const handleScan = async (userId: string) => {
    setScanning(false);
    setCheckingIn(true);
    try {
      const res = await fetch(`/api/events/${eventId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const now = new Date();
        setLastMember({
          name: `Membre enregistré`,
          time: now.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
        toast.success("Check-in réussi !");
      } else {
        const err = await res.json();
        toast.error(err.error || "Échec du check-in");
      }
    } catch (err) {
      toast.error("Erreur réseau");
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeInUp py-8 px-4">
      {/* Retour */}
      <Link
        href={`/dashboard/admin/events/${eventId}`}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition"
      >
        <ArrowLeft size={16} />
        Retour à l&apos;événement
      </Link>

      {/* Carte principale */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium overflow-hidden !p-0"
      >
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <QrCode size={36} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text">
            Check-in de l&apos;événement
          </h1>
          <p className="text-text-secondary mt-2 max-w-md mx-auto">
            Scannez le QR code de la carte de membre pour enregistrer sa
            présence.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Message de succès */}
          <AnimatePresence>
            {lastMember && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                      <CheckCircle
                        size={22}
                        className="text-green-600 dark:text-green-400"
                      />
                    </div>
                    <div>
                      <p className="text-green-700 dark:text-green-300 font-medium">
                        {lastMember.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Clock size={12} />
                        {lastMember.time}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bouton de scan */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setScanning(true)}
              variant="primary"
              size="lg"
              disabled={checkingIn}
              className="flex-1"
            >
              {checkingIn ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <QrCode size={20} />
              )}
              <span className="ml-2">
                {checkingIn ? "Enregistrement..." : "Scanner un QR code"}
              </span>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setLastMember(null)}
              disabled={!lastMember}
              className="sm:w-auto"
            >
              <UserPlus size={20} />
              <span className="ml-2">Scanner un autre</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-premium p-6"
      >
        <h2 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
          <Users size={20} className="text-primary" />
          Comment ça fonctionne ?
        </h2>
        <ol className="space-y-3 text-sm text-text-secondary">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>
              Le participant présente sa carte de membre numérique contenant un
              QR code.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>
              Appuyez sur &quot;Scanner un QR code&quot; et visez le code
              affiché par le participant.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>
              La présence est automatiquement enregistrée. Vous pouvez continuer
              avec le participant suivant.
            </span>
          </li>
        </ol>
      </motion.div>

      {/* Scanner modal */}
      {scanning && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  );
}