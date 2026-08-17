"use client";
import { useEffect, useState } from "react";
import { useStreamChat } from "@/contexts/StreamChatContext"; // ← import corrigé
import { useSession } from "next-auth/react";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  Window,
  Thread,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";
import { CustomMessageInput } from "@/components/chat/CustomMessageInput";

export function ChatWindow({ channelId }: { channelId: string }) {
  const client = useStreamChat();
  const { data: session } = useSession();
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!client || !session?.user?.id || !channelId) return;

    const init = async () => {
      const ch = client.channel("messaging", channelId);
      await ch.watch();
      setChannel(ch);
    };

    init();
  }, [client, channelId, session?.user?.id]);

  if (!client || !channel) {
    return <div className="p-8 text-text-secondary">Chargement...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <Chat client={client}>
        <Channel channel={channel} Input={CustomMessageInput}>
          <Window>
            <ChannelHeader />
            <MessageList />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
}