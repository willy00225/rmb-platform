"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Channel as StreamChannel } from "stream-chat";
import {
  Send,
  Mic,
  X,
  Paperclip,
  Smile,
  Loader2,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { EmojiPicker } from "./EmojiPicker";

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

  // Gestion du collage
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) addAttachment(file);
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