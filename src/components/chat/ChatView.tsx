"use client";
import { useEffect, useState, useRef } from "react";
import { Session } from "next-auth";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  Window,
  Thread,
} from "stream-chat-react";
import { StreamChat, Channel as StreamChannel } from "stream-chat";
import "stream-chat-react/dist/css/index.css";
import { Loader2, Phone, Video } from "lucide-react";
import toast from "react-hot-toast";
import { CallModal } from "@/components/chat/CallModal";
import { CustomMessageInput } from "@/components/chat/CustomMessageInput"; // ← import du nouveau fichier

export function ChatView({
  session,
  channelId,
  friendId,
  externalClient,
}: {
  session: Session;
  channelId?: string;
  friendId?: string;
  externalClient: StreamChat;
}) {
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendName, setFriendName] = useState<string>("");
  const isResolved = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // États pour les appels
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("video");

  useEffect(() => {
    if (!audioRef.current && typeof Audio !== "undefined") {
      audioRef.current = new Audio("/sounds/new-message.mp3");
      audioRef.current.volume = 0.3;
    }
  }, []);

  useEffect(() => {
    if (!externalClient || !session?.user?.id) return;
    if (isResolved.current) return;

    const resolveChannel = async () => {
      isResolved.current = true;
      setLoading(true);

      try {
        let targetChannel: StreamChannel;

        if (friendId) {
          // Conversation privée : l'ID est dérivé des IDs triés pour éviter les doublons
          const usersResponse = await externalClient.queryUsers({ id: { $in: [friendId] } });
          const friend = usersResponse.users[0];
          const name = friend?.name || "Ami";
          setFriendName(name);

          const shortId = (id: string) => id.substring(0, 8);
          const sortedIds = [session.user.id, friendId].sort();
          const privateChannelId = `prv-${sortedIds[0].substring(0, 8)}-${sortedIds[1].substring(0, 8)}`;

          targetChannel = externalClient.channel("messaging", privateChannelId, {
            members: [session.user.id, friendId],
          });
        } else if (channelId) {
          // Groupe ou canal existant
          targetChannel = externalClient.channel("messaging", channelId, {
            members: [session.user.id],
          });
        } else {
          // Canal général
          targetChannel = externalClient.channel("messaging", "general", {
            members: [session.user.id],
          });
        }

        await targetChannel.watch();

        setChannel(targetChannel);

        const handleNewMessage = (event: any) => {
          if (event.user?.id !== session.user.id && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        };

        targetChannel.on("message.new", handleNewMessage);

        return () => {
          targetChannel.off("message.new", handleNewMessage);
        };
      } catch (err) {
        console.error("Erreur résolution canal :", err);
        toast.error("Impossible de charger la conversation.");
      } finally {
        setLoading(false);
      }
    };

    const cleanup = resolveChannel();
    return () => {
      cleanup?.then((clean) => clean?.());
    };
  }, [externalClient, channelId, friendId, session.user.id]);

  const startCall = (type: "audio" | "video") => {
    setCallType(type);
    setShowCallModal(true);
  };

  if (loading || !channel) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* En-tête personnalisé avec boutons d'appel */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div>
          {friendId ? (
            <span className="text-sm font-semibold text-text">{friendName || "Conversation"}</span>
          ) : channelId ? (
            <span className="text-sm font-semibold text-text">Groupe</span>
          ) : (
            <span className="text-sm font-semibold text-text">Général</span>
          )}
        </div>
        {/* Boutons d'appel (uniquement en conversation privée) */}
        {friendId && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => startCall("audio")}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition"
              aria-label="Appeler en audio"
            >
              <Phone size={18} className="text-text-secondary" />
            </button>
            <button
              onClick={() => startCall("video")}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition"
              aria-label="Appeler en vidéo"
            >
              <Video size={18} className="text-text-secondary" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <Chat client={externalClient}>
          <Channel channel={channel}>
            <Window>
              <ChannelHeader />
              <MessageList />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>
      <CustomMessageInput channel={channel} />

      {/* Modal d'appel */}
      {showCallModal && (
        <CallModal
          session={session}
          callType={callType}
          onClose={() => setShowCallModal(false)}
          onCallStarted={(callId) => {
            console.log("Appel démarré :", callId);
            channel.sendMessage({
              text: `Appel ${callType} en cours...`,
            }).catch(console.error);
          }}
        />
      )}
    </div>
  );
}