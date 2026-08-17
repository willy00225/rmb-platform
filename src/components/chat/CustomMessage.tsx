"use client";
import { useMessageContext } from "stream-chat-react";
import { useChat } from "@/contexts/ChatContext";

export function CustomMessage() {
  const { message, isMyMessage, groupStyles } = useMessageContext();
  const { openChatWithFriend } = useChat();

  // Gérer le cas où isMyMessage est une fonction (versions anciennes de stream-chat-react)
  const myMessage = typeof isMyMessage === "function" ? (isMyMessage as any)() : isMyMessage;

  const user = (message as any)?.user;
  const userId = user?.id;
  const userName = user?.name || "Utilisateur";
  const userImage = user?.image || "/default-avatar.png";

  // groupStyles est un tableau de chaînes, on le caste pour éviter les erreurs de type
  const styles = (groupStyles || []) as string[];
  const isFirst = styles.includes("str-chat__message--first");

  const handleUserClick = () => {
    if (userId && !myMessage) {
      openChatWithFriend(userId);
    }
  };

  return (
    <div className={`str-chat__message ${myMessage ? "str-chat__message--me" : ""} ${styles.join(" ")}`}>
      {isFirst && !myMessage ? (
        <>
          <div
            onClick={handleUserClick}
            className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 px-10"
          >
            {userName}
          </div>
          <div className="flex items-start gap-2">
            <img
              src={userImage}
              alt={userName}
              onClick={handleUserClick}
              className="w-8 h-8 rounded-full cursor-pointer object-cover"
            />
            <div className="bg-gray-100 dark:bg-gray-800 text-text rounded-2xl px-4 py-2">
              {message.text}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-start gap-2">
          {!myMessage && <div className="w-8 h-8" />}
          <div
            className={`${
              myMessage
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800 text-text"
            } rounded-2xl px-4 py-2`}
          >
            {message.text}
          </div>
        </div>
      )}
    </div>
  );
}