"use client";
import { motion } from "framer-motion";
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
      aria-label={`Envoyer un message à ${targetUserId}`}
      className="group relative overflow-hidden"
    >
      <motion.span
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2"
      >
        <MessageCircle size={18} className="transition-colors group-hover:text-primary" />
        <span>Message</span>
      </motion.span>
      <span className="absolute inset-0 rounded-xl bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Button>
  );
}