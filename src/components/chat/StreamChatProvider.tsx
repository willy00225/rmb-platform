"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { StreamChat } from "stream-chat";

interface StreamChatState {
  client: StreamChat | null;
  connecting: boolean;
  error: string | null;
}

const StreamChatContext = createContext<StreamChatState>({
  client: null,
  connecting: true,
  error: null,
});

export function StreamChatProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [connecting, setConnecting] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<StreamChat | null>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      setClient(null);
      setConnecting(false);
      setError("Utilisateur non connecté");
      return;
    }

    let isCancelled = false;
    setConnecting(true);
    setError(null);

    const init = async () => {
      try {
        const res = await fetch("/api/chat/token");
        if (!res.ok) {
          throw new Error("Impossible de récupérer le token chat");
        }
        const { token } = await res.json();
        if (!token) {
          throw new Error("Token chat vide");
        }

        const chatClient = StreamChat.getInstance(
          process.env.NEXT_PUBLIC_STREAM_API_KEY!
        );
        await chatClient.connectUser(
          { id: session.user.id, name: session.user.name || "Membre" },
          token
        );

        if (isCancelled) {
          await chatClient.disconnectUser();
          return;
        }

        clientRef.current = chatClient;
        setClient(chatClient);
        setConnecting(false);
      } catch (err: any) {
        console.error("Erreur connexion Stream:", err);
        if (!isCancelled) {
          setClient(null);
          setConnecting(false);
          setError(err?.message ?? "Erreur de connexion");
        }
      }
    };

    init();

    return () => {
      isCancelled = true;
      const currentClient = clientRef.current;
      if (currentClient) {
        currentClient.disconnectUser();
        clientRef.current = null;
        setClient(null);
        setConnecting(false);
      }
    };
  }, [session?.user?.id]);

  return (
    <StreamChatContext.Provider value={{ client, connecting, error }}>
      {children}
    </StreamChatContext.Provider>
  );
}

/**
 * Hook rétrocompatible : retourne uniquement le client StreamChat.
 * Utilisé par les composants existants.
 */
export function useStreamChat() {
  const context = useContext(StreamChatContext);
  return context.client;
}

/**
 * Hook complet : retourne le client, l'état de connexion et l'erreur éventuelle.
 */
export function useStreamChatState() {
  return useContext(StreamChatContext);
}