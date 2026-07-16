"use client";
import { useEffect, useState, useCallback, useRef } from "react";
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
import { Send, Mic, X } from "lucide-react";

// ─── Input personnalisé avec notes vocales (inchangé) ───
export function CustomMessageInput({ channel }: { channel: StreamChannel }) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erreur d'accès au micro :", err);
      alert("Impossible d'accéder au microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioBlob(null);
    }
  };

  const sendAudio = async () => {
    if (!audioBlob || !channel) return;
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "voice-message.webm");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Échec de l'upload");
      const { url } = await uploadRes.json();

      await channel.sendMessage({
        text: "",
        attachments: [{ type: "audio", asset_url: url, title: "Message vocal" }],
      });
      setAudioBlob(null);
    } catch (err) {
      console.error("Erreur envoi audio :", err);
    }
  };

  const sendText = useCallback(async () => {
    if (!text.trim() || !channel) return;
    try {
      await channel.sendMessage({ text: text.trim() });
      setText("");
    } catch (err) {
      console.error("Erreur d'envoi :", err);
    }
  }, [text, channel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  if (audioBlob) {
    return (
      <div className="p-4 border-t border-border bg-white dark:bg-surface">
        <div className="flex items-center gap-3">
          <audio controls src={URL.createObjectURL(audioBlob)} className="flex-1 h-10" />
          <button
            onClick={sendAudio}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-hover transition"
          >
            <Send size={18} />
          </button>
          <button
            onClick={() => setAudioBlob(null)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="p-4 border-t border-border bg-white dark:bg-surface">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-red-500 dark:text-red-400 font-medium text-sm">🎙️ Enregistrement...</span>
          </div>
          <button
            onClick={stopRecording}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-hover transition"
          >
            <Send size={18} />
          </button>
          <button
            onClick={cancelRecording}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border bg-white dark:bg-surface">
      <div className="flex items-center gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Votre message..."
          rows={1}
          className="flex-1 resize-none rounded-xl bg-gray-50 dark:bg-[#1A2420] border border-border dark:border-[#2D3A32] px-4 py-3 text-text dark:text-[#F0F4F2] placeholder-text-secondary dark:placeholder-[#6B7A72] focus:outline-none focus:border-primary transition"
        />
        <button
          onClick={startRecording}
          disabled={!!text.trim()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-30"
        >
          <Mic size={18} />
        </button>
        <button
          onClick={sendText}
          disabled={!text.trim()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Composant ChatView principal ───
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

  useEffect(() => {
    if (!externalClient || !session?.user?.id) return;
    if (isResolved.current) return;

    const resolveChannel = async () => {
      isResolved.current = true;
      setLoading(true);

      try {
        let targetChannel: StreamChannel;

        // Conversation privée avec un ami
        if (friendId) {
          const usersResponse = await externalClient.queryUsers({ id: { $in: [friendId] } });
          const friend = usersResponse.users[0];
          const name = friend?.name || "Ami";
          setFriendName(name);

          // ✅ ID court pour respecter la limite de 64 caractères
          const shortId = (id: string) => id.substring(0, 8);
          const privateChannelId = `prv-${shortId(session.user.id)}-${shortId(friendId)}`;

          targetChannel = externalClient.channel("messaging", privateChannelId, {
            members: [session.user.id, friendId],
          });
        }
        // Canal spécifique (groupe, live, etc.)
        else if (channelId) {
          targetChannel = externalClient.channel("messaging", channelId, {
            members: [session.user.id],
          });
        }
        // Canal général par défaut
        else {
          targetChannel = externalClient.channel("messaging", "general", {
            members: [session.user.id],
          });
        }

        await targetChannel.watch();

        if (friendId && friendName) {
          await (targetChannel as any).updatePartial({ set: { name: friendName } });
        }
        if (!channelId && !friendId) {
          await (targetChannel as any).updatePartial({ set: { name: "Général" } });
        }

        setChannel(targetChannel);
      } catch (err) {
        console.error("Erreur résolution canal :", err);
      } finally {
        setLoading(false);
      }
    };

    resolveChannel();
  }, [externalClient, channelId, friendId, session.user.id]);

  if (loading || !channel) {
    return (
      <div className="flex items-center justify-center h-full text-text-secondary">
        <div className="animate-pulse">Chargement du chat...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
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
    </div>
  );
}