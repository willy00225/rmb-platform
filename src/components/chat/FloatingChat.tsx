"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Loader2 } from "lucide-react";
import { ChatView } from "@/components/chat/ChatView";
import { Session } from "next-auth";
import { StreamChat } from "stream-chat";
import { useChat } from "@/contexts/ChatContext";

export function FloatingChat({ session }: { session: Session }) {
  const { open, openChat, closeChat, channelId, friendId } = useChat();
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Connexion UNIQUE au montage du composant
  useEffect(() => {
    if (!session?.user?.id) return;

    const connect = async () => {
      setConnecting(true);
      try {
        const res = await fetch("/api/chat/token");
        const { token } = await res.json();
        const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY!);
        await client.connectUser(
          { id: session.user.id, name: session.user.name ?? "Membre" },
          token
        );
        setChatClient(client);
      } catch (err) {
        console.error("Échec de connexion au chat :", err);
      } finally {
        setConnecting(false);
      }
    };

    connect();

    return () => {
      if (chatClient) chatClient.disconnectUser();
    };
  }, [session]);

  // Écouter les nouveaux messages (si besoin pour le badge)
  useEffect(() => {
    if (!chatClient) return;
    const handler = (event: any) => {
      if (!open && event.message?.user?.id !== session.user?.id) {
        setUnreadCount(prev => prev + 1);

        // Notification push
        fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            title: event.message.user?.name || "Nouveau message",
            message: event.message.text || "Vous avez reçu un message.",
          }),
        }).catch(() => {}); // silencieux en cas d'erreur
      }
    };
    chatClient.on("message.new", handler);
    return () => { chatClient.off("message.new", handler); };
  }, [chatClient, open, session.user?.id]);

  useEffect(() => {
    if (open) setUnreadCount(0);
  }, [open]);

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => (open ? closeChat() : openChat())}
        className="fixed bottom-20 md:bottom-6 right-6 z-[100] w-14 h-14 rounded-full bg-primary text-white shadow-[0_4px_20px_rgba(0,90,58,0.5)] hover:bg-primary-hover transition-all flex items-center justify-center border-2 border-white/50"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Fenêtre de chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed bottom-36 md:bottom-24 right-6 z-50 w-80 h-96 rounded-[var(--radius-card)] bg-white dark:bg-surface border border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {connecting || !chatClient ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : (
              <ChatView
                session={session}
                channelId={channelId || undefined}
                externalClient={chatClient}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}