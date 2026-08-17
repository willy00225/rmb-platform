"use client";
import { useEffect, useState, useMemo } from "react";
import { useStreamChat } from "@/contexts/StreamChatContext";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import type { ChannelSort } from "stream-chat"; // ← import pour le typage

export default function ChatPage() {
  const client = useStreamChat();
  const { data: session } = useSession();
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client || !session?.user?.id) return;

    const fetchChannels = async () => {
      const filter = { type: "messaging", members: { $in: [session.user.id] } };
      // ✅ Correction : typage explicite du tri
      const sort: ChannelSort = { last_message_at: -1 };
      const channelList = await client.queryChannels(filter, sort, {
        watch: false,
        state: true,
      });
      setChannels(channelList);
      setLoading(false);
    };

    fetchChannels();

    const handler = (event: any) => {
      fetchChannels();
    };
    client.on("message.new", handler);

    return () => {
      client.off("message.new", handler);
    };
  }, [client, session?.user?.id]);

  const conversations = useMemo(() => {
    return channels.map((ch) => {
      const otherMember = Object.values(ch.state.members || {}).find(
        (m: any) => m.user_id !== session?.user?.id
      ) as any;
      const lastMessage = ch.state.messages?.[ch.state.messages.length - 1];
      const unreadCount = ch.countUnread();
      return {
        id: ch.id,
        name: otherMember?.user?.name || "Conversation",
        lastMessage: lastMessage?.text || "Aucun message",
        unreadCount,
      };
    });
  }, [channels, session?.user?.id]);

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col md:flex-row">
      <div className="w-full md:w-72 border-r border-border overflow-y-auto">
        <h2 className="p-4 text-lg font-semibold text-text">Messages</h2>
        {loading ? (
          <Loader2 className="animate-spin text-primary mx-auto mt-10" size={32} />
        ) : (
          <ul>
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  onClick={() => setActiveChannelId(conv.id)}
                  className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 ${
                    activeChannelId === conv.id ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {conv.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text truncate">{conv.name}</p>
                    <p className="text-sm text-text-secondary truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-primary text-white text-xs rounded-full px-2 py-1">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {activeChannelId ? (
          <ChatWindow channelId={activeChannelId} />
        ) : (
          <div className="h-full flex items-center justify-center text-text-secondary">
            Sélectionnez une conversation
          </div>
        )}
      </div>
    </div>
  );
}