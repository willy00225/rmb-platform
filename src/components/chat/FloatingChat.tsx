"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Loader2, ChevronLeft, Search } from "lucide-react";
import { ChatView } from "@/components/chat/ChatView";
import { Session } from "next-auth";
import { StreamChat } from "stream-chat";
import type { Event } from "stream-chat";
import { useChat } from "@/contexts/ChatContext";

interface ChannelPreview {
  id: string;
  name: string;
  lastMessage?: string;
  updatedAt?: Date;
  isPrivate: boolean;
  friendId?: string;
}

export function FloatingChat({ session }: { session: Session }) {
  const { open, openChat, closeChat } = useChat();
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const hasConnected = useRef(false);

  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelPreview[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  // Connexion UNIQUE au montage du composant
  useEffect(() => {
    if (!session?.user?.id || hasConnected.current) return;

    const connect = async () => {
      if (!session.user?.id) return;
      hasConnected.current = true;
      setConnecting(true);
      try {
        const res = await fetch("/api/chat/token");
        const { token } = await res.json();
        if (!token) {
          console.warn("Token chat vide, connexion annulée.");
          hasConnected.current = false;
          return;
        }
        const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY!);
        await client.connectUser(
          { id: session.user.id, name: session.user.name ?? "Membre" },
          token
        );
        setChatClient(client);
      } catch (err) {
        console.error("Échec de connexion au chat :", err);
        hasConnected.current = false;
      } finally {
        setConnecting(false);
      }
    };

    connect();

    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
        hasConnected.current = false;
      }
    };
  }, [session, chatClient]);

  // Charger les conversations récentes
  useEffect(() => {
    if (!chatClient || !open || activeChannelId) return;
    const loadChannels = async () => {
      setLoadingChannels(true);
      try {
        const filter = { members: { $in: [session.user.id] } };
        const sort: { last_message_at: -1 } = { last_message_at: -1 };
        const result = await chatClient.queryChannels(filter, sort, {
          watch: false,
          state: true,
        });

        const previews: ChannelPreview[] = result
          .map((channel) => {
            const members = Object.values(channel.state.members).filter(
              (m: any) => m.user_id !== session.user.id
            );
            const isPrivate = members.length === 1 && channel.id !== "general";
            const friendId = isPrivate ? members[0]?.user_id : undefined;
            const name =
              isPrivate
                ? (members[0]?.user?.name as string) || "Ami"
                : ((channel.data as any)?.name as string) || channel.id || "Sans nom";

            const lastMessage = channel.state.messages?.[channel.state.messages.length - 1];
            const updatedAt = lastMessage?.created_at
              ? new Date(lastMessage.created_at)
              : undefined;

            return {
              id: channel.id || "",
              name,
              lastMessage: lastMessage?.text || undefined,
              updatedAt,
              isPrivate,
              friendId,
            };
          })
          .filter((ch) => ch.id !== "");

        previews.sort((a, b) => {
          if (a.isPrivate && !b.isPrivate) return -1;
          if (!a.isPrivate && b.isPrivate) return 1;
          const timeA = a.updatedAt?.getTime() || 0;
          const timeB = b.updatedAt?.getTime() || 0;
          return timeB - timeA;
        });

        setChannels(previews);
      } catch (err) {
        console.error("Erreur chargement des conversations", err);
      } finally {
        setLoadingChannels(false);
      }
    };

    loadChannels();
  }, [chatClient, open, activeChannelId, session.user.id]);

  // Écouter les nouveaux messages (badge)
  useEffect(() => {
    if (!chatClient) return;
    const handler = (event: Event) => {
      const msg = event as Event & {
        message?: { user?: { id: string; name?: string }; text?: string };
      };
      if (!open && msg.message?.user?.id !== session.user?.id) {
        setUnreadCount((prev) => prev + 1);
      }
    };
    chatClient.on("message.new", handler);
    return () => { chatClient.off("message.new", handler); };
  }, [chatClient, open, session.user?.id]);

  useEffect(() => { if (open) setUnreadCount(0); }, [open]);

  const openConversation = (channelId: string, friendId?: string) => {
    setActiveChannelId(channelId);
    if (friendId) setActiveFriendId(friendId);
  };

  const backToList = () => {
    setActiveChannelId(null);
    setActiveFriendId(null);
  };

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
            ) : activeChannelId ? (
              /* Conversation active */
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between p-3 border-b border-border dark:border-white/10">
                  <button
                    onClick={backToList}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition"
                  >
                    <ChevronLeft size={18} className="text-text-secondary" />
                  </button>
                  <h3 className="text-sm font-semibold text-text dark:text-white">
                    {activeFriendId ? "Conversation privée" : "Général"}
                  </h3>
                  <div className="w-8" />
                </div>
                <div className="flex-1 min-h-0">
                  <ChatView
                    session={session}
                    channelId={activeChannelId}
                    friendId={activeFriendId || undefined}
                    externalClient={chatClient}
                  />
                </div>
              </div>
            ) : (
              /* Liste des conversations */
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-3 border-b border-border dark:border-white/10">
                  <h3 className="text-sm font-semibold text-text dark:text-white">Messages</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loadingChannels ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="animate-spin text-primary" size={20} />
                    </div>
                  ) : channels.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-text-secondary text-sm">
                      Aucune conversation récente
                    </div>
                  ) : (
                    channels.map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => openConversation(ch.id, ch.friendId)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                          {ch.isPrivate ? ch.name[0] : "#"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text dark:text-white truncate">
                            {ch.name}
                          </p>
                          {ch.lastMessage && (
                            <p className="text-xs text-text-secondary truncate">{ch.lastMessage}</p>
                          )}
                        </div>
                        {ch.updatedAt && (
                          <span className="text-[10px] text-text-secondary flex-shrink-0">
                            {ch.updatedAt.toLocaleDateString() === new Date().toLocaleDateString()
                              ? ch.updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : ch.updatedAt.toLocaleDateString()}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}