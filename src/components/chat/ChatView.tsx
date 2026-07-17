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
import {
  Send,
  Mic,
  X,
  Paperclip,
  Smile,
  Loader2,
  FileText,
  Phone,
  Video,
} from "lucide-react";
import toast from "react-hot-toast";
import { CallModal } from "@/components/chat/CallModal";

/* ─── Émojis par catégories ─── */
const EMOJI_CATEGORIES: Record<string, string[]> = {
  "😀 Visages": ["😀","😃","😄","😁","😅","🤣","😂","🙂","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","😮‍💨","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟","🙁","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"],
  "👍 Gestes": ["👍","👎","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦵","🦶","👂","🦻","👃","🧠","🦷","🦴","👀","👁️","👅","👄"],
  "❤️ Symboles": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","🆔","⚛️","🉑","☢️","☣️","📴","📳","🈶","🈚","🈸","🈺","🈷️","✴️","🆚","💮","🉐","㊙️","㊗️","🈴","🈵","🈹","🈲","🅰️","🅱️","🆎","🆑","🅾️","🆘","❌","⭕","🛑","⛔","📛","🚫","💯","💢","♨️","🚷","🚯","🚳","🚱","🔞","📵","🚭","❗","❕","❓","❔","‼️","⁉️","🔅","🔆","〽️","⚠️","🚸","🔱","⚜️","🔰","♻️","✅","🈯","💹","❇️","✳️","❎","🌐","💠","Ⓜ️","🌀","💤","🏧","🚾","♿","🅿️","🛗","🈳","🈂️","🛂","🛃","🛄","🛅","🚰","🚹","🚺","🚼","⚧","🚻","🚮","🎦","📶","🈁","🔣","ℹ️","🔤","🔡","🔠","🆖","🆗","🆙","🆒","🆕","🆓","0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","🔢","#️⃣","*️⃣","⏏️","▶️","⏸️","⏯️","⏹️","⏺️","⏭️","⏮️","⏩","⏪","⏫","⏬","◀️","🔼","🔽","➡️","⬅️","⬆️","⬇️","↗️","↘️","↙️","↖️","↕️","↔️","↪️","↩️","⤴️","⤵️","🔀","🔁","🔂","🔄","🔃","🎵","🎶","➕","➖","➗","✖️","♾️","💲","💱","™️","©️","®️","〰️","➰","➿","🔚","🔙","🔛","🔝","🔜","✔️","☑️","🔘","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🟤","🔺","🔻","🔸","🔹","🔶","🔷","🔳","🔲","▪️","▫️","◾","◽","◼️","◻️","🟥","🟧","🟨","🟩","🟦","🟪","⬛","⬜","🟫"],
  "🐶 Animaux": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🪳","🦟","🦗","🕷️","🕸️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🪸","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🪶","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔","🐾","🐉","🐲"],
  "🍔 Nourriture": ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🫒","🧄","🧅","🥔","🍠","🥐","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🦴","🌭","🍔","🍟","🍕","🫓","🥪","🥙","🧆","🌮","🌯","🫔","🥗","🥘","🫕","🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🥛","🍼","🫖","☕","🍵","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🫗","🥃","🍸","🍹","🧉","🍾","🧊","🥄","🍴","🍽️","🥣","🥡","🥢","🧂"],
  "⚽ Activités": ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂","🪂","🏋️","🤼","🤸","🤺","⛹️","🤾","🏌️","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖️","🏵️","🎗️","🎫","🎟️","🎪","🤹","🎭","🩰","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺","🪗","🎸","🪕","🎻","🎲","♟️","🎯","🎳","🎮","🎰","🧩"],
};

function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState(Object.keys(EMOJI_CATEGORIES)[0]);

  return (
    <div className="absolute bottom-12 left-0 z-50 bg-white dark:bg-surface border border-border rounded-xl shadow-xl w-72 max-h-80 flex flex-col">
      <div className="flex overflow-x-auto gap-1 p-2 border-b border-border">
        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
              activeCategory === cat
                ? "bg-primary/20 text-primary font-medium"
                : "hover:bg-gray-100 dark:hover:bg-white/10 text-text-secondary"
            }`}
          >
            {cat.split(" ")[0]}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-7 gap-1">
        {(EMOJI_CATEGORIES[activeCategory] || []).map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="text-xl hover:bg-gray-100 dark:hover:bg-white/10 p-1 rounded flex items-center justify-center"
            aria-label={`Insérer ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CustomMessageInput({ channel }: { channel: StreamChannel }) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<
    { file: File; preview: string; type: string }[]
  >([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pasteAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            addAttachment(file);
          }
        }
      }
    };
    const el = pasteAreaRef.current;
    el?.addEventListener("paste", handlePaste);
    return () => el?.removeEventListener("paste", handlePaste);
  }, []);

  const addAttachment = (file: File) => {
    if (attachments.length >= 5) {
      toast.error("Maximum 5 fichiers.");
      return;
    }
    const preview = URL.createObjectURL(file);
    const type = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
      ? "video"
      : "file";
    setAttachments((prev) => [...prev, { file, preview, type }]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erreur micro :", err);
      toast.error("Impossible d'accéder au microphone.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const cancelRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setAudioBlob(null);
  };

  const sendAudio = async () => {
    if (!audioBlob || !channel) return;
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "voice-message.webm");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Échec de l'upload audio");
      const { url } = await res.json();
      await channel.sendMessage({
        text: "",
        attachments: [{ type: "audio", asset_url: url, title: "Message vocal" }],
      });
      setAudioBlob(null);
    } catch (err) {
      toast.error("Erreur lors de l'envoi du message vocal.");
      console.error(err);
    }
  };

  const sendText = useCallback(async () => {
    if (!channel) return;

    const uploadedUrls: { url: string; type: string; title: string }[] = [];
    if (attachments.length > 0) {
      for (const att of attachments) {
        try {
          const formData = new FormData();
          formData.append("file", att.file);
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (!res.ok) throw new Error("Échec upload fichier");
          const { url } = await res.json();
          uploadedUrls.push({ url, type: att.type, title: att.file.name });
        } catch (err) {
          toast.error(`Erreur upload ${att.file.name}`);
          console.error(err);
          return;
        }
      }
    }

    if (text.trim() || uploadedUrls.length > 0) {
      try {
        await channel.sendMessage({
          text: text.trim(),
          attachments: uploadedUrls.map((u) => ({
            type: u.type,
            asset_url: u.url,
            title: u.title,
          })),
        });
        setText("");
        setAttachments([]);
        textareaRef.current?.focus();
      } catch (err) {
        toast.error("Erreur lors de l'envoi du message.");
        console.error(err);
      }
    }
  }, [text, attachments, channel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  if (audioBlob) {
    return (
      <div className="p-4 border-t border-border bg-white dark:bg-surface">
        <div className="flex items-center gap-3">
          <audio controls src={URL.createObjectURL(audioBlob)} className="flex-1 h-10" />
          <button onClick={sendAudio} className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-hover transition" aria-label="Envoyer le message vocal">
            <Send size={18} />
          </button>
          <button onClick={() => setAudioBlob(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600 transition" aria-label="Annuler">
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
          <button onClick={stopRecording} className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-hover transition" aria-label="Arrêter l'enregistrement">
            <Send size={18} />
          </button>
          <button onClick={cancelRecording} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600 transition" aria-label="Annuler l'enregistrement">
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border bg-white dark:bg-surface" ref={pasteAreaRef}>
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {attachments.map((att, idx) => (
            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              {att.type === "image" ? (
                <img src={att.preview} alt="" className="w-full h-full object-cover" />
              ) : att.type === "video" ? (
                <video src={att.preview} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <FileText size={24} className="text-text-secondary" />
                </div>
              )}
              <button
                onClick={() => removeAttachment(idx)}
                className="absolute -top-1 -right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-40"
          aria-label="Ajouter un fichier"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files) {
              Array.from(files).forEach(addAttachment);
              e.target.value = "";
            }
          }}
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Votre message..."
          rows={1}
          className="flex-1 resize-none rounded-xl bg-gray-50 dark:bg-[#1A2420] border border-border dark:border-[#2D3A32] px-4 py-3 text-text dark:text-[#F0F4F2] placeholder-text-secondary dark:placeholder-[#6B7A72] focus:outline-none focus:border-primary transition"
        />
        <div className="relative">
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            aria-label="Ajouter un emoji"
          >
            <Smile size={18} />
          </button>
          {showEmojis && (
            <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojis(false)} />
          )}
        </div>
        <button
          onClick={startRecording}
          disabled={!!text.trim() || attachments.length > 0}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-30"
          aria-label="Démarrer l'enregistrement vocal"
        >
          <Mic size={18} />
        </button>
        <button
          onClick={sendText}
          disabled={!text.trim() && attachments.length === 0}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition"
          aria-label="Envoyer le message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

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
          const usersResponse = await externalClient.queryUsers({ id: { $in: [friendId] } });
          const friend = usersResponse.users[0];
          const name = friend?.name || "Ami";
          setFriendName(name);

          const shortId = (id: string) => id.substring(0, 8);
          const privateChannelId = `prv-${shortId(session.user.id)}-${shortId(friendId)}`;

          targetChannel = externalClient.channel("messaging", privateChannelId, {
            members: [session.user.id, friendId],
          });
        } else if (channelId) {
          targetChannel = externalClient.channel("messaging", channelId, {
            members: [session.user.id],
          });
        } else {
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