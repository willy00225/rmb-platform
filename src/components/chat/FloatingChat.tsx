"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  MessageCircle,
  X,
  Loader2,
  ChevronLeft,
  Users,
  Search,
  Plus,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { ChatView } from "@/components/chat/ChatView";
import { CreateGroupModal } from "@/components/chat/CreateGroupModal";
import { Session } from "next-auth";
import { StreamChat } from "stream-chat";
import type { Event, ChannelMemberResponse, MessageResponse } from "stream-chat";
import { useChat } from "@/contexts/ChatContext";
import { useStreamChatState } from "@/contexts/StreamChatContext"; // ← fichier à créer
import toast from "react-hot-toast";

/* ---------------------------------- types --------------------------------- */
interface ChannelPreview {
  id: string;
  name: string;
  lastMessage?: string;
  updatedAt?: Date;
  friendId?: string;
  isGeneral?: boolean;
  avatarUrl?: string;
  unread?: number;
}

interface MessageEvent extends Event {
  message?: MessageResponse & { user?: { id: string; name?: string }; text?: string };
}

/* ------------------------------ helpers ----------------------------- */
const AVATAR_COLORS = [
  "#6C5CE7", "#00B894", "#0984E3", "#FDCB6E", "#E17055",
  "#00CEC9", "#A29BFE", "#55E6C1", "#FDA7DF", "#636E72",
];

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ------------------------------ hooks maison ----------------------------- */
function usePrivateChannels(chatClient: StreamChat | null, userId: string, open: boolean) {
  const [privateChannels, setPrivateChannels] = useState<ChannelPreview[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  useEffect(() => {
    if (!chatClient || !open) return;

    const load = async () => {
      setLoadingChannels(true);
      try {
        const filter = { members: { $in: [userId] } };
        const sort = { last_message_at: -1 as const };
        const result = await chatClient.queryChannels(filter, sort, {
          watch: false,
          state: true,
        });

        const filtered = result.filter((channel) => channel.id !== "general");

        const previews: ChannelPreview[] = filtered
          .map((channel) => {
            // Conversion explicite pour aider TypeScript
            const members = (Object.values(channel.state.members) as ChannelMemberResponse[]).filter(
              (m) => m.user_id !== userId
            );
            const friendId = members[0]?.user_id;
            const friendUser = members[0]?.user;
            const name = friendId
              ? friendUser?.name || "Ami"
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
              avatarUrl: friendUser?.image || undefined,
              unread: channel.countUnread(),
            };
          })
          .filter((ch) => Boolean(ch.id)); // ← LIGNE CORRIGÉE (sans type predicate)

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialisation du son (création paresseuse)
    if (!audioRef.current && typeof Audio !== "undefined") {
      audioRef.current = new Audio("/sounds/new-message.mp3");
      audioRef.current.volume = 0.3;
    }
  }, []);

  useEffect(() => {
    if (!chatClient) return;
    const handler = (event: Event) => {
      const msg = event as MessageEvent;
      if (!open && msg.message?.user?.id !== userId) {
        setUnreadCount((prev) => prev + 1);
        // Jouer un son discret
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
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
  const [searchTerm, setSearchTerm] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Swipe to dismiss (mobile)
  const dragY = useMotionValue(0);
  const opacity = useTransform(dragY, [0, 200], [1, 0]);
  const scale = useTransform(dragY, [0, 200], [1, 0.9]);

  // ✅ Récupération des états du client Stream
  const { client: chatClient, connecting, error } = useStreamChatState();

  const unreadCount = useUnreadMessages(chatClient, session.user.id, open);
  const { privateChannels, loadingChannels } = usePrivateChannels(
    chatClient,
    session.user.id,
    open
  );

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K pour ouvrir/fermer
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        if (open) closeChat();
        else openChat();
      }
      // Escape pour revenir à la liste
      if (e.key === "Escape" && open && activeChannelId) {
        setActiveChannelId(null);
        setActiveFriendId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, activeChannelId, openChat, closeChat]);

  // Ouvrir automatiquement la conversation avec un ami si friendId est fourni
  useEffect(() => {
    if (!open || !chatClient || !friendId) return;

    const openPrivateFromContext = async () => {
      const shortId = (id: string) => id.substring(0, 8);
      // ✅ IDs triés pour éviter les doublons
      const ids = [session.user.id, friendId].sort();
      const channelId = `prv-${ids[0].substring(0, 8)}-${ids[1].substring(0, 8)}`;

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

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {/* Bouton flottant */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => (open ? closeChat() : openChat())}
        className="fixed bottom-20 md:bottom-6 right-6 z-[100] w-14 h-14 rounded-full bg-primary text-white shadow-[0_4px_20px_rgba(0,90,58,0.5)] hover:bg-primary-hover transition-all flex items-center justify-center border-2 border-white/50"
        aria-label={open ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Fenêtre de chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 200 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                closeChat();
              }
            }}
            style={{ y: dragY, opacity, scale }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25 }}
            className={`fixed bottom-36 md:bottom-24 right-6 z-50 rounded-2xl bg-white dark:bg-surface border border-border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
              isExpanded
                ? "w-[90vw] md:w-[600px] h-[85vh]"
                : "w-[340px] md:w-80 h-[500px] max-h-[70vh]"
            }`}
            role="dialog"
            aria-label="Messagerie"
          >
            {connecting ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4">
                <Loader2 className="animate-spin text-primary" size={24} />
                <span className="text-sm text-text-secondary">Connexion au chat…</span>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 text-center">
                <p className="text-sm text-red-500 font-medium">Erreur de connexion</p>
                <p className="text-xs text-text-secondary">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-sm hover:bg-primary-hover transition"
                >
                  Réessayer
                </button>
              </div>
            ) : activeChannelId ? (
              /* Vue conversation active */
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 p-3 border-b border-border dark:border-white/10">
                  <button
                    onClick={backToList}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition"
                    aria-label="Retour à la liste"
                  >
                    <ChevronLeft size={18} className="text-text-secondary" />
                  </button>
                  <h3 className="text-sm font-semibold text-text dark:text-white flex-1">
                    {activeChannelId === "general" ? "Général" : "Conversation privée"}
                  </h3>
                  {/* Bouton plein écran (desktop) */}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition hidden md:block"
                    aria-label={isExpanded ? "Réduire" : "Agrandir"}
                  >
                    {isExpanded ? <Minimize2 size={16} className="text-text-secondary" /> : <Maximize2 size={16} className="text-text-secondary" />}
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <ChatView
                    session={session}
                    channelId={activeChannelId}
                    friendId={activeFriendId || undefined}
                    externalClient={chatClient!}
                  />
                </div>
              </div>
            ) : (
              /* Liste des conversations */
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-3 border-b border-border dark:border-white/10 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text dark:text-white">Messages</h3>
                  <motion.button
                    whileTap={{ rotate: 90 }}
                    onClick={() => setShowGroupModal(true)}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition"
                    title="Nouveau groupe"
                    aria-label="Créer un nouveau groupe"
                  >
                    <Plus size={18} className="text-text-secondary" />
                  </motion.button>
                </div>
                <div className="px-3 pb-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher une conversation..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text text-xs placeholder-text-secondary focus:outline-none focus:border-primary transition"
                      aria-label="Rechercher une conversation"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto" role="listbox" aria-label="Liste des conversations">
                  {loadingChannels ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="animate-spin text-primary" size={20} />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-text-secondary text-sm px-4 text-center">
                      <MessageCircle size={24} className="mb-2 opacity-50" />
                      {searchTerm ? "Aucune conversation trouvée." : "Aucune conversation pour le moment."}
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <motion.button
                        key={conv.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openConversation(conv.id, conv.friendId)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left"
                        role="option"
                        aria-selected={false}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            openConversation(conv.id, conv.friendId);
                          }
                        }}
                      >
                        <div className="relative">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: conv.isGeneral
                                ? "rgba(59,130,246,0.1)"
                                : conv.avatarUrl
                                ? "transparent"
                                : stringToColor(conv.name),
                              color: conv.isGeneral
                                ? "#3B82F6"
                                : conv.avatarUrl
                                ? "transparent"
                                : "#FFFFFF",
                            }}
                          >
                            {conv.isGeneral ? (
                              <Users size={18} />
                            ) : conv.avatarUrl ? (
                              <img
                                src={conv.avatarUrl}
                                alt={conv.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold">{conv.name[0].toUpperCase()}</span>
                            )}
                          </div>
                          {conv.unread && conv.unread > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-text dark:text-white truncate">
                              {conv.name}
                            </p>
                            {conv.updatedAt && (
                              <span className="text-[10px] text-text-secondary flex-shrink-0 ml-2">
                                {conv.updatedAt.toLocaleDateString() ===
                                new Date().toLocaleDateString()
                                  ? conv.updatedAt.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : conv.updatedAt.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary truncate mt-0.5">
                            {conv.lastMessage || ""}
                          </p>
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de création de groupe */}
      {showGroupModal && chatClient && (
        <CreateGroupModal
          chatClient={chatClient}
          userId={session.user.id}
          onClose={() => setShowGroupModal(false)}
          onGroupCreated={(channelId) => {
            setShowGroupModal(false);
            setActiveChannelId(channelId);
            setActiveFriendId(null);
          }}
        />
      )}
    </>
  );
}