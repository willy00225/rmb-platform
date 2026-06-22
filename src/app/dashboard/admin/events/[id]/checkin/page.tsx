"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { QRScanner } from "@/components/events/QRScanner";
import toast from "react-hot-toast";
import { Loader2, CheckCircle } from "lucide-react";

export default function EventCheckInPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [lastMember, setLastMember] = useState<string | null>(null);

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
        const memberRes = await fetch(`/api/users/${userId}/premium`);
        const memberData = memberRes.ok ? await memberRes.json() : {};
        setLastMember(`Membre #${userId} enregistré avec succès !`);
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
    <div className="space-y-8 animate-fadeInUp">
      <h1 className="text-3xl font-display font-bold text-text">Check-in événement</h1>
      <div className="card-premium p-6">
        <p className="text-text-secondary mb-4">
          Scannez le QR code de la carte de membre pour enregistrer sa présence.
        </p>
        {lastMember && (
          <div className="flex items-center gap-2 text-green-600 mb-4">
            <CheckCircle size={20} /> {lastMember}
          </div>
        )}
        <Button onClick={() => setScanning(true)} variant="primary" disabled={checkingIn}>
          {checkingIn ? <Loader2 className="animate-spin" size={18} /> : "Scanner un QR code"}
        </Button>
      </div>
      {scanning && <QRScanner onScan={handleScan} onClose={() => setScanning(false)} />}
    </div>
  );
}