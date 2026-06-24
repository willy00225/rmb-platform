"use client";
import { useState, useEffect } from "react";
import { Phone, Video } from "lucide-react";
import { CallModal } from "./CallModal";

export function CallButton({
  callerId,
  callerName,
  receiverId,
  receiverName,
}: {
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName: string;
}) {
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);

  // Écouter les appels entrants via PeerJS (à connecter plus tard)
  useEffect(() => {
    // On pourrait utiliser un événement personnalisé ou une socket
  }, []);

  const startCall = () => {
    setInCall(true);
  };

  const acceptCall = () => {
    setIncomingCall(false);
    setInCall(true);
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={startCall}
          className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition"
          title="Appel vidéo"
        >
          <Video size={18} />
        </button>
        <button
          onClick={startCall}
          className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition"
          title="Appel audio"
        >
          <Phone size={18} />
        </button>
      </div>

      {inCall && (
        <CallModal
          callerId={callerId}
          callerName={callerName}
          receiverId={receiverId}
          receiverName={receiverName}
          onClose={() => setInCall(false)}
        />
      )}

      {incomingCall && (
        <div className="fixed bottom-24 right-6 z-[150] p-4 bg-white border border-border rounded-2xl shadow-lg">
          <p className="text-text font-medium mb-3">{receiverName} vous appelle...</p>
          <div className="flex gap-2">
            <button
              onClick={acceptCall}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm"
            >
              Répondre
            </button>
            <button
              onClick={() => setIncomingCall(false)}
              className="px-4 py-2 bg-gray-100 text-text-secondary rounded-xl text-sm"
            >
              Refuser
            </button>
          </div>
        </div>
      )}
    </>
  );
}
