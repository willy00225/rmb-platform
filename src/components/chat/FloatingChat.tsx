"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Loader2, ChevronLeft, Users } from "lucide-react";
import { ChatView } from "@/components/chat/ChatView";
import { Session } from "next-auth";
import { StreamChat } from "stream-chat";
import type { Event, ChannelMemberResponse, MessageResponse } from "stream-chat";
import { useChat } from "@/contexts/ChatContext";
import toast from "react-hot-toast";

/* ---------------------------------- types --------------------------------- */
interface ChannelPreview {
  id: string;
  name: string;
  lastMessage?: string;
  updatedAt?: Date;
  friendId?: string;
  isGeneral?: boolean;
}

interface MessageEvent extends Event {
  message?: MessageResponse & { user?: { id: string; name?: string }; text?: string };
}

/* ------------------------------ hooks maison ----------------------------- */
function useStreamConnection(session: Session) {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [connecting, setConnecting] = useState(false);
  const hasConnected = useRef(false);

  useEffect(() => {
    if (!session?.user?.id || hasConnected.current) return;

    const connect = async () => {
      if (!session.user?.id) return;
      hasConnected.current = true;
      setConnecting(true);
      try {
        const res = await fetch("/api/chat/token");
        if (!res.ok) throw new Error("Impossible de récupérer le token chat");
        const { token } = await res.json();
        if (!token) {
          toast.error("Token chat vide, connexion impossible.");
          hasConnected.current = false;
          return;
        }

        const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY!);
        await client.connectUser(
          { id: session.user.id, name: session.user.name ?? "Membre" },
          token
        );
        setChatClient(client);
      } catch (err: any) {
        console.error("Échec de connexion au chat :", err);
        toast.error(err?.message ?? "Échec de connexion au chat.");
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

  return { chatClient, connecting };
}

function usePrivateChannels(chatClient: StreamChat | null, userId: string, open: boolean) {
  const [privateChannels, setPrivateChannels] = useState<ChannelPreview[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  useEffect(() => {
    if (!chatClient || !open) return;

    const load = async () => {
      setLoadingChannels(true);
      try {
        // ✅ Filtre simple : tous les canaux de l'utilisateur
        const filter = { members: { $in: [userId] } };
        const sort = { last_message_at: -1 as const };
        const result = await chatClient.queryChannels(filter, sort, {
          watch: false,
          state: true,
        });

        // ✅ On exclut le canal "general" côté client
        const filtered = result.filter((channel) => channel.id !== "general");

        const previews: ChannelPreview[] = filtered
          .map((channel) => {
            const members = Object.values(channel.state.members).filter(
              (m: ChannelMemberResponse) => m.user_id !== userId
            );
            const friendId = members[0]?.user_id;
            const name = friendId
              ? (members[0]?.user?.name as string) || "Ami"
              : channel.id || "Sans nom";
            const lastMessage = channel.state.messages?.[channel.state.messages.length - 1];
            const updatedAt = lastMessage?.created_at
              ? new Date(lastMessage.created_at)
              : undefined;

            return {
              id: channel.id || "",
              name,
              lastMessage: lastMessage?.text ?? undefined,
              updatedAt,
              friendId,
              isGeneral: false,
            };
          })
          .filter((ch) => ch.id);

        previews.sort((a, b) => {
          const timeA = a.updatedAt?.getTime() ?? 0;
          const timeB = b.updatedAt?.getTime() ?? 0;
          return timeB - timeA;
        });

        setPrivateChannels(previews);
      } catch (err) {
        console.error("Erreur chargement conversations privées", err);
        toast.error("Impossible de charger les conversations privées.");
      } finally {
        setLoadingChannels(false);
      }
    };

    load();
  }, [chatClient, open, userId]);

  return { privateChannels, loadingChannels };
}

function useUnreadMessages(chatClient: StreamChat | null, userId: string, open: boolean) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!chatClient) return;
    const handler = (event: Event) => {
      const msg = event as MessageEvent;
      if (!open && msg.message?.user?.id !== userId) {
        setUnreadCount((prev) => prev + 1);
      }
    };
    chatClient.on("message.new", handler);
    return () => {
      chatClient.off("message.new", handler);
    };
  }, [chatClient, open, userId]);

  useEffect(() => {
    if (open) setUnreadCount(0);
  }, [open]);

  return unreadCount;
}

/* ------------------------------ composant -------------------------------- */
export function FloatingChat({ session }: { session: Session }) {
  const { open, openChat, closeChat, friendId } = useChat();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);

  const { chatClient, connecting } = useStreamConnection(session);
  const unreadCount = useUnreadMessages(chatClient, session.user.id, open);
  const { privateChannels, loadingChannels } = usePrivateChannels(
    chatClient,
    session.user.id,
    open
  );

  // Quand le chat s'ouvre avec un friendId (depuis un profil ami), ouvrir la conversation
  useEffect(() => {
    if (!open || !chatClient || !friendId) return;

    const openPrivateFromContext = async () => {
      const shortId = (id: string) => id.substring(0, 8);
      const channelId = `prv-${shortId(session.user.id)}-${shortId(friendId)}`;

      const existingChannel = chatClient.channel("messaging", channelId);
      await existingChannel.watch();

      setActiveChannelId(channelId);
      setActiveFriendId(friendId);
    };

    openPrivateFromContext();
  }, [open, chatClient, friendId, session.user.id]);

  const conversations: ChannelPreview[] = [
    {
      id: "general",
      name: "Général",
      lastMessage: "Chat communautaire",
      updatedAt: undefined,
      friendId: undefined,
      isGeneral: true,
    },
    ...privateChannels,
  ];

  const openConversation = useCallback(
    (channelId: string, friendId?: string) => {
      setActiveChannelId(channelId);
      setActiveFriendId(friendId || null);
    },
    []
  );

  const backToList = useCallback(() => {
    setActiveChannelId(null);
    setActiveFriendId(null);
  }, []);

  useEffect(() => {
    if (!open) {
      setActiveChannelId(null);
      setActiveFriendId(null);
    }
  }, [open]);

  return (
    <>
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
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 p-3 border-b border-border dark:border-white/10">
                  <button
                    onClick={backToList}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition"
                  >
                    <ChevronLeft size={18} className="text-text-secondary" />
                  </button>
                  <h3 className="text-sm font-semibold text-text dark:text-white">
                    {activeChannelId === "general" ? "Général" : "Conversation privée"}
                  </h3>
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
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-3 border-b border-border dark:border-white/10">
                  <h3 className="text-sm font-semibold text-text dark:text-white">Messages</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loadingChannels ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="animate-spin text-primary" size={20} />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-text-secondary text-sm">
                      Aucune conversation
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => openConversation(conv.id, conv.friendId)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                            conv.isGeneral
                              ? "bg-blue-100 text-blue-600"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {conv.isGeneral ? <Users size={18} /> : conv.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text dark:text-white truncate">
                            {conv.name}
                          </p>
                          {conv.lastMessage && (
                            <p className="text-xs text-text-secondary truncate">
                              {conv.lastMessage}
                            </p>
                          )}
                        </div>
                        {conv.updatedAt && (
                          <span className="text-[10px] text-text-secondary flex-shrink-0">
                            {conv.updatedAt.toLocaleDateString() ===
                            new Date().toLocaleDateString()
                              ? conv.updatedAt.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : conv.updatedAt.toLocaleDateString()}
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