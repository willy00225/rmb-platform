"use client";
import { useEffect, useState } from "react";
import { Session } from "next-auth";
import { StreamChat, Channel as StreamChannel } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  Window,
  Thread,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";
import { CustomMessageInput } from "@/components/chat/ChatView";

export function LiveChat({
  channelId,
  session,
}: {
  channelId: string;
  session: Session;
}) {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    const init = async () => {
      const res = await fetch("/api/chat/token");
      const { token } = await res.json();
      const chatClient = StreamChat.getInstance(
        process.env.NEXT_PUBLIC_STREAM_API_KEY!
      );
      await chatClient.connectUser(
        { id: session.user.id, name: session.user.name ?? "Membre" },
        token
      );

      const liveChannel = chatClient.channel("messaging", channelId);
      await liveChannel.watch();
      setClient(chatClient);
      setChannel(liveChannel);
    };
    init();
    return () => {
      if (client) client.disconnectUser();
    };
  }, [session, channelId]);

  if (!client || !channel)
    return <p className="text-gray-400 p-4">Chargement du chat...</p>;

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
