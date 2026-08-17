"use client";
import { useEffect, useState } from "react";
import { Session } from "next-auth";
import { Channel as StreamChannel } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  Window,
  Thread,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";
import { CustomMessageInput } from "@/components/chat/CustomMessageInput"; // ← import corrigé
import { useStreamChat } from "@/contexts/StreamChatContext"; // ← client global

export function LiveChat({
  channelId,
  session,
}: {
  channelId: string;
  session: Session;
}) {
  const client = useStreamChat();
  const [channel, setChannel] = useState<StreamChannel | null>(null);

  useEffect(() => {
    if (!client || !channelId) return;

    const ch = client.channel("messaging", channelId);
    ch.watch().then(() => setChannel(ch));
  }, [client, channelId]);

  if (!client || !channel) {
    return <p className="text-gray-400 p-4">Chargement du chat...</p>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <Chat client={client}>
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
    </div>
  );
}