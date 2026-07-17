"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Heart, Send, Smile, Trash2, Eye, User,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: "image" | "video" | string;
  caption?: string | null;
  user?: {
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
}

interface StoryViewerProps {
  userId: string | null;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 secondes par story

export function StoryViewer({ userId, onClose }: StoryViewerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [reply, setReply] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewsCount, setViewsCount] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);

  // Charger les stories
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

  // Réinitialiser et charger les données de la story courante
  useEffect(() => {
    if (stories.length === 0) return;
    const story = stories[currentIndex];
    // Récupérer les réactions
    fetch(`/api/stories/${story.id}/reactions`)
      .then((res) => res.json())
      .then((data) => {
        setLikesCount(data.count || 0);
        setLiked(data.likes?.some((l: any) => l.userId === session?.user?.id) || false);
      })
      .catch(() => {});

    // Récupérer les vues
    fetch(`/api/stories/${story.id}/views`)
      .then((res) => res.json())
      .then((data) => setViewsCount(data.count || 0))
      .catch(() => {});

    // Enregistrer la vue
    if (story.userId !== session?.user?.id) {
      fetch(`/api/stories/${story.id}/view`, { method: "POST" })
        .then(() => setViewsCount((prev) => prev + 1))
        .catch(() => {});
    }

    // Démarrer le timer
    startTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [currentIndex, stories, session]);

  const startTimer = () => {
    setProgress(0);
    const startTime = Date.now();
    const tick = () => {
      if (isPaused) return;
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / STORY_DURATION) * 100);
      setProgress(newProgress);
      if (newProgress >= 100) {
        next();
      } else {
        timerRef.current = setTimeout(tick, 50);
      }
    };
    timerRef.current = setTimeout(tick, 50);
  };

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
        if (newLiked) {
          setShowHeart(true);
          setTimeout(() => setShowHeart(false), 1000);
        }
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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) next();
      else prev();
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("Supprimer cette story ?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/stories/${storyId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Story supprimée");
        const newStories = stories.filter(s => s.id !== storyId);
        setStories(newStories);
        if (currentIndex >= newStories.length) {
          if (newStories.length === 0) onClose();
          else setCurrentIndex(newStories.length - 1);
        }
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (err) {
      toast.error("Erreur réseau");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!userId || (stories.length === 0 && userId !== "me")) return null;

  if (userId === "me" && stories.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
      >
        <div className="text-center text-white">
          <p className="mb-4">Vous n&apos;avez pas encore de story.</p>
          <button
            onClick={() => {
              onClose();
              router.push("/dashboard/stories/new");
            }}
            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition"
          >
            Créer une story
          </button>
        </div>
      </motion.div>
    );
  }

  const story = stories[currentIndex];
  const isOwner = session?.user?.id === story.userId;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 z-30">
          <div className="flex items-center gap-2 mb-2">
            {/* Avatar et nom (à adapter selon vos données) */}
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <span className="text-white text-sm font-medium">
              {story.user?.firstName || "Utilisateur"} {story.user?.lastName || ""}
            </span>
          </div>
          <div className="flex gap-1">
            {stories.map((_, idx) => (
              <div key={idx} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                  style={{
                    width: `${idx === currentIndex ? progress : idx < currentIndex ? 100 : 0}%`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="absolute top-6 right-6 z-30 flex gap-3">
          {isOwner && (
            <button
              onClick={() => handleDeleteStory(story.id)}
              disabled={isDeleting}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-red-500/80 transition"
            >
              <Trash2 size={22} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenu principal */}
        <div
          className="relative w-full h-full max-w-lg mx-auto"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full flex items-center justify-center p-4"
            >
              {story.mediaType === "video" ? (
                <video
                  src={story.mediaUrl}
                  controls
                  autoPlay
                  muted={false}
                  className="max-w-full max-h-full object-cover rounded-xl"
                />
              ) : (
                <img
                  src={story.mediaUrl}
                  alt=""
                  className="max-w-full max-h-full object-contain rounded-xl"
                  onDoubleClick={toggleLike}
                />
              )}
              {/* Animation de like */}
              <AnimatePresence>
                {showHeart && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <Heart size={80} fill="white" className="text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {/* Légende */}
          {story.caption && (
            <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-sm font-medium">{story.caption}</p>
            </div>
          )}
        </div>

        {/* Barre d'actions du bas */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-30">
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
            <span className="text-white text-sm">
              {likesCount > 0 && `${likesCount}`}
            </span>
            <span className="text-white text-sm flex items-center gap-1">
              <Eye size={16} /> {viewsCount}
            </span>

            <div className="flex-1 flex items-center gap-2 ml-4">
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendReply();
                }}
                placeholder="Répondre..."
                className="flex-1 py-2 px-4 rounded-full bg-white/20 text-white placeholder-white/60 text-sm border border-white/20 focus:outline-none focus:border-white/40"
              />
              <button
                onClick={() => setShowEmoji(!showEmoji)}
                className="p-2 text-white/80 hover:text-white transition"
              >
                <Smile size={20} />
              </button>
              <button
                onClick={handleSendReply}
                disabled={!reply.trim()}
                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 disabled:opacity-40 transition"
              >
                <Send size={18} />
              </button>
              {showEmoji && (
                <div className="absolute bottom-16 right-4 bg-gray-900 border border-gray-700 rounded-xl p-2 shadow-lg z-40">
                  <div className="grid grid-cols-6 gap-1">
                    {["😍", "😂", "👍", "🔥", "🎉", "💪", "😢", "😡", "❤️", "😲", "👏", "🙌"].map(
                      (emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setReply((prev) => prev + emoji);
                            setShowEmoji(false);
                          }}
                          className="text-xl hover:bg-gray-700 p-1 rounded"
                        >
                          {emoji}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}