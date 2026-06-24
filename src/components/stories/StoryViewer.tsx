"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Heart, Send, Smile } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: "image" | "video" | string;
}

interface StoryViewerProps {
  userId: string | null;
  onClose: () => void;
}

export function StoryViewer({ userId, onClose }: StoryViewerProps) {
  const { data: session } = useSession();
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [reply, setReply] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (!userId) return;

    fetch("/api/stories")
      .then((res) => res.json())
      .then((data: Story[]) => {
        const targetUserId = userId === "me" ? session?.user?.id : userId;
        if (!targetUserId) return;

        const userStories = data.filter((s) => s.userId === targetUserId);
        setStories(userStories);
        setCurrentIndex(0);
      })
      .catch(() => {});
  }, [userId, session]);

  // Charger les likes de la story courante
  useEffect(() => {
    if (stories.length === 0) return;
    const story = stories[currentIndex];
    fetch(`/api/stories/${story.id}/reactions`)
      .then((res) => res.json())
      .then((data) => {
        setLikesCount(data.count);
        setLiked(data.likes.some((l: any) => l.userId === session?.user?.id));
      })
      .catch(() => {});
  }, [currentIndex, stories, session]);

  const toggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const story = stories[currentIndex];
    try {
      const res = await fetch(`/api/stories/${story.id}/like`, { method: "POST" });
      if (res.ok) {
        const { liked: newLiked } = await res.json();
        setLiked(newLiked);
        setLikesCount((prev) => prev + (newLiked ? 1 : -1));
      }
    } catch (err) {
      toast.error("Erreur");
    } finally {
      setIsLiking(false);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim()) return;
    const story = stories[currentIndex];
    try {
      const res = await fetch(`/api/stories/${story.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply.trim() }),
      });
      if (res.ok) {
        setReply("");
        setShowEmoji(false);
        toast.success("Réponse envoyée");
      } else {
        toast.error("Erreur");
      }
    } catch (err) {
      toast.error("Erreur réseau");
    }
  };

  const next = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const prev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, currentTarget } = e;
    const { left, width } = currentTarget.getBoundingClientRect();
    const middle = left + width / 2;
    if (clientX < middle) prev();
    else next();
  };

  // Double‑tap pour liker
  const [lastTap, setLastTap] = useState(0);
  const handleDoubleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      toggleLike();
    }
    setLastTap(now);
  };

  useEffect(() => {
    if (stories.length === 0) return;
    const timer = setTimeout(next, 5000);
    return () => clearTimeout(timer);
  }, [currentIndex, stories, next]);

  if (!userId || stories.length === 0) return null;

  const story = stories[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
      >
        {/* Fermer */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-30 text-white hover:text-gray-300 transition"
        >
          <X size={36} />
        </button>

        {/* Barre de progression */}
        <div className="absolute top-4 left-4 right-16 flex gap-1.5 z-30">
          {stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-1.5 rounded-full bg-white/30 overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: "0%" }}
                animate={{
                  width: idx === currentIndex ? "100%" : idx < currentIndex ? "100%" : "0%",
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
        </div>

        {/* Zone de contenu */}
        <div
          className="relative w-full h-full max-w-4xl mx-auto flex items-center justify-center"
          onDoubleClick={handleDoubleTap}
          onClick={handleTap}
        >
          {/* Média */}
          <div className="w-full h-[85vh] mx-4 rounded-2xl overflow-hidden">
            {story.mediaType === "video" ? (
              <video
                src={story.mediaUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={story.mediaUrl}
                alt=""
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Flèches */}
          {currentIndex > 0 && (
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
            >
              <ChevronLeft size={28} />
            </button>
          )}
          {currentIndex < stories.length - 1 && (
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>

        {/* Barre d'actions en bas */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-30 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Réaction + compteur */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLike}
                disabled={isLiking}
                className={`p-2 rounded-full ${
                  liked ? "text-red-500" : "text-white"
                } hover:bg-white/20 transition`}
              >
                <Heart size={28} fill={liked ? "currentColor" : "none"} />
              </button>
              {likesCount > 0 && (
                <span className="text-white text-sm font-medium">
                  {likesCount} j&apos;adore{likesCount > 1 ? "nt" : ""}
                </span>
              )}
            </div>

            {/* Barre de réponse rapide */}
            <div className="flex items-center gap-2 flex-1 ml-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendReply();
                  }}
                  placeholder="Répondre..."
                  className="w-full py-2 px-4 pr-10 rounded-full bg-white/20 text-white placeholder-white/70 text-sm border border-white/20 focus:outline-none focus:border-white/50"
                />
                <button
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
                >
                  <Smile size={18} />
                </button>
                {showEmoji && (
                  <div className="absolute bottom-10 right-0 bg-surface border border-border rounded-xl p-2 shadow-lg z-40">
                    <div className="grid grid-cols-6 gap-1">
                      {["😍", "😂", "👍", "🔥", "🎉", "💪", "😢", "😡", "❤️", "😲", "👏", "🙌"].map(
                        (emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setReply((prev) => prev + emoji);
                              setShowEmoji(false);
                            }}
                            className="text-xl hover:bg-gray-100 dark:hover:bg-white/10 p-1 rounded"
                          >
                            {emoji}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleSendReply}
                disabled={!reply.trim()}
                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-40 transition"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}