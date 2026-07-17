"use client";
import { useEffect, useRef, useState } from "react";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export function useVideoClient() {
  const { data: session } = useSession();
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [connecting, setConnecting] = useState(false);
  const hasConnected = useRef(false);

  useEffect(() => {
    if (!session?.user?.id || hasConnected.current) return;

    const connect = async () => {
      hasConnected.current = true;
      setConnecting(true);
      try {
        const res = await fetch("/api/chat/video-token");
        if (!res.ok) throw new Error("Token vidéo inaccessible");
        const { token } = await res.json();
        if (!token) throw new Error("Token vide");

        const client = new StreamVideoClient({
          apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY!,
          token,
          user: {
            id: session.user.id,
            name: session.user.name ?? "Membre",
          },
        });
        setVideoClient(client);
      } catch (err: any) {
        console.error("Erreur connexion Stream Video :", err);
        toast.error("Impossible de se connecter aux appels.");
        hasConnected.current = false;
      } finally {
        setConnecting(false);
      }
    };

    connect();

    return () => {
      if (videoClient) {
        videoClient.disconnectUser();
        hasConnected.current = false;
      }
    };
  }, [session]);

  return { videoClient, connecting };
}