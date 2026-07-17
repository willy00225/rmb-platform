"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  X,
  Loader2,
} from "lucide-react";
import {
  StreamVideo,
  StreamCall,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useVideoClient } from "@/hooks/useVideoClient";
import { Call } from "@stream-io/video-react-sdk";
import toast from "react-hot-toast";

interface CallModalProps {
  session: any;
  callId?: string | null;
  callType?: "audio" | "video";
  onClose: () => void;
  onCallStarted?: (callId: string) => void;
}

function CallUI({ onHangup }: { onHangup: () => void }) {
  const call = useCall();
  const { useParticipants, useLocalParticipant } = useCallStateHooks();
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const toggleMic = () => {
    if (call) {
      call.microphone.toggle();
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (call) {
      call.camera.toggle();
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
        {participants.map((participant) => {
          const isLocal = participant.userId === localParticipant?.userId;
          return (
            <div
              key={participant.sessionId}
              className="relative rounded-2xl overflow-hidden bg-gray-900"
            >
              <video
                className="w-full h-full object-cover"
                ref={(el) => {
                  if (el && participant.videoStream) {
                    el.srcObject = participant.videoStream;
                  }
                }}
                autoPlay
                playsInline
                muted={isLocal}
              />
              <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-white text-sm">
                {participant.userId} {isLocal ? "(Vous)" : ""}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent">
        <button
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
            isMuted ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button
          onClick={onHangup}
          className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition"
        >
          <PhoneOff size={28} />
        </button>
        <button
          onClick={toggleCamera}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
            isVideoOff ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>
      </div>
    </div>
  );
}

export function CallModal({
  session,
  callId,
  callType = "video",
  onClose,
  onCallStarted,
}: CallModalProps) {
  const { videoClient } = useVideoClient();
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!videoClient || !session?.user?.id) return;

    const setupCall = async () => {
      setLoading(true);
      try {
        let call: Call;

        if (callId) {
          call = videoClient.call("default", callId);
          await call.join();
          toast.success("Appel rejoint");
        } else {
          const newCallId = `call-${Date.now()}`;
          call = videoClient.call("default", newCallId);
          await call.create({
            data: {
              members: [{ user_id: session.user.id }],
              custom: { callType },
            },
          });
          await call.join();
          onCallStarted?.(newCallId);
        }

        setCurrentCall(call);
      } catch (err) {
        console.error("Erreur lors de l'appel :", err);
        toast.error("Impossible de démarrer l'appel.");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    setupCall();

    return () => {
      if (currentCall) {
        currentCall.leave();
      }
    };
  }, [videoClient, callId, callType]);

  const handleHangup = useCallback(async () => {
    if (currentCall) {
      await currentCall.leave();
    }
    setCurrentCall(null);
    onClose();
  }, [currentCall, onClose]);

  if (!videoClient) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
      >
        {loading && !currentCall ? (
          <div className="flex flex-col items-center gap-4 text-white">
            <Loader2 className="animate-spin" size={48} />
            <p className="text-lg font-medium">
              {callId ? "Connexion à l'appel..." : "Création de l'appel..."}
            </p>
          </div>
        ) : currentCall ? (
          <StreamVideo client={videoClient}>
            <StreamCall call={currentCall}>
              <CallUI onHangup={handleHangup} />
            </StreamCall>
          </StreamVideo>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}