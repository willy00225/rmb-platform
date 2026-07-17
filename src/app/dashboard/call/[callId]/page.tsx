"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, PhoneOff } from "lucide-react";
import {
  StreamVideo,
  StreamCall,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import { Call } from "@stream-io/video-react-sdk";
import { useSession } from "next-auth/react";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";

function CallUI({ onHangup }: { onHangup: () => void }) {
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
        {participants.map((p) => (
          <div key={p.sessionId} className="relative rounded-2xl overflow-hidden bg-gray-900">
            <video
              className="w-full h-full object-cover"
              ref={(el) => {
                if (el && p.videoStream) el.srcObject = p.videoStream;
              }}
              autoPlay
              playsInline
            />
            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-white text-sm">
              {p.userId}
            </div>
          </div>
        ))}
      </div>
      <div className="p-6 flex items-center justify-center">
        <button
          onClick={onHangup}
          className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition"
        >
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
}

export default function CallPage() {
  const { callId } = useParams<{ callId: string }>();
  const { data: session } = useSession();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!callId || !session?.user?.id) return;

    const setup = async () => {
      try {
        const tokenRes = await fetch("/api/chat/video-token");
        if (!tokenRes.ok) throw new Error("Impossible de récupérer le token");
        const { token } = await tokenRes.json();

        const client = new StreamVideoClient({
          apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY!,
          token,
          user: { id: session.user.id, name: session.user.name ?? "Membre" },
        });
        setClient(client);

        const c = client.call("default", callId);
        await c.join();
        setCall(c);
      } catch (err: any) {
        console.error(err);
        setError("Impossible de rejoindre l'appel.");
        toast.error("Impossible de rejoindre l'appel.");
      } finally {
        setLoading(false);
      }
    };

    setup();

    return () => {
      if (client) client.disconnectUser();
    };
  }, [callId, session]);

  const hangup = () => {
    if (call) call.leave();
    window.close(); // ou rediriger vers /dashboard
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <p>{error}</p>
      </div>
    );
  }

  if (loading || !call) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

  return (
    <StreamVideo client={client!}>
      <StreamCall call={call}>
        <CallUI onHangup={hangup} />
      </StreamCall>
    </StreamVideo>
  );
}