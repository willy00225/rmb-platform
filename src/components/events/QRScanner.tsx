"use client";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

export function QRScanner({ onScan, onClose }: { onScan: (userId: string) => void; onClose: () => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" }, // caméra arrière
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Le QR code contient directement l'ID utilisateur
          scanner.stop().catch(() => {});
          onScan(decodedText);
        },
        () => {} // ignore les erreurs de scan
      )
      .catch((err) => setError("Impossible d'accéder à la caméra : " + err.message));

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <button onClick={onClose} className="absolute -top-10 right-0 text-white">
          <X size={32} />
        </button>
        <div id="qr-reader" className="w-full" />
        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        <p className="text-white text-center mt-4">Placez le QR code du membre dans le cadre</p>
      </div>
    </div>
  );
}
