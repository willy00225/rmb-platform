"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface StoryViewerProps {
  userId: string | null;
  onClose: () => void;
}

export function StoryViewer({ userId, onClose }: StoryViewerProps) {
  const [stories, setStories] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/stories")
      .then(res => res.json())
      .then(data => {
        const userStories = userId === "me"
          ? data.filter((s: any) => s.userId === "me") // à adapter avec l'ID réel
          : data.filter((s: any) => s.userId === userId);
        setStories(userStories);
        setCurrentIndex(0);
      });
  }, [userId]);

  const next = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const prev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (stories.length === 0) return;
    const timer = setTimeout(next, 5000); // auto-avance après 5s
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
        <button onClick={onClose} className="absolute top-6 right-6 z-10 text-white">
          <X size={32} />
        </button>

        {/* Indicateur de progression */}
        <div className="absolute top-4 left-4 right-16 flex gap-1 z-10">
          {stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  idx === currentIndex ? "w-full" : idx < currentIndex ? "w-full" : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Média */}
        <div className="max-w-md w-full h-[80vh] rounded-2xl overflow-hidden relative">
          {story.mediaType === "video" ? (
            <video src={story.mediaUrl} controls autoPlay className="w-full h-full object-cover" />
          ) : (
            <img src={story.mediaUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Navigation */}
        {currentIndex > 0 && (
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white">
            <ChevronLeft size={32} />
          </button>
        )}
        {currentIndex < stories.length - 1 && (
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 text-white">
            <ChevronRight size={32} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}