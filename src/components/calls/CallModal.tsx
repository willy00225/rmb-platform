"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import Peer from "peerjs";

export function CallModal({
  callerId,
  callerName,
  receiverId,
  receiverName,
  onClose,
}: {
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName: string;
  onClose: () => void;
}) {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const init = async () => {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(localStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;

      const peerInstance = new Peer(callerId);
      setPeer(peerInstance);

      // Appelant : appeler le destinataire
      const call = peerInstance.call(receiverId, localStream);
      call.on("stream", (remoteMediaStream) => {
        setRemoteStream(remoteMediaStream);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteMediaStream;
      });
    };

    init();

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (peer) peer.destroy();
    };
  }, [callerId, receiverId]);

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
      setIsVideoOff(!isVideoOff);
    }
  };

  const hangUp = () => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
    if (peer) peer.destroy();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black flex flex-col"
      >
        {/* Vidéo distante (plein écran) */}
        <div className="flex-1 relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Vidéo locale (petite fenêtre) */}
          <div className="absolute bottom-20 right-4 w-32 h-48 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Contrôles */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              isMuted ? "bg-red-500 text-white" : "bg-white/20 text-white"
            }`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          <button
            onClick={hangUp}
            className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center"
          >
            <PhoneOff size={28} />
          </button>
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              isVideoOff ? "bg-red-500 text-white" : "bg-white/20 text-white"
            }`}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}