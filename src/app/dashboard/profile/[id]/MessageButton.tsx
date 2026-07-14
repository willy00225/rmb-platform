"use client";
import { Button } from "@/components/ui/Button";
import { useChat } from "@/contexts/ChatContext";
import { MessageCircle } from "lucide-react";

export function MessageButton({ targetUserId }: { targetUserId: string }) {
  const { openChatWithFriend } = useChat();

  return (
    <Button
      variant="secondary"
      size="lg"
      onClick={() => openChatWithFriend(targetUserId)}
    >
      <MessageCircle size={18} /> Message
    </Button>
  );
}