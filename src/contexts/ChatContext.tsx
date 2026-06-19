"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

type ChatContextType = {
  open: boolean;
  channelId: string | null;
  friendId: string | null;
  openChat: (channelId?: string) => void;
  openChatWithFriend: (friendId: string) => void;
  closeChat: () => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [friendId, setFriendId] = useState<string | null>(null);

  const openChat = useCallback((cid?: string) => {
    if (cid) setChannelId(cid);
    setOpen(true);
  }, []);

  const openChatWithFriend = useCallback((fid: string) => {
    setFriendId(fid);
    setChannelId(null); // La résolution du canal se fera dans le FloatingChat
    setOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setOpen(false);
    setChannelId(null);
    setFriendId(null);
  }, []);

  return (
    <ChatContext.Provider value={{ open, channelId, friendId, openChat, openChatWithFriend, closeChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
}