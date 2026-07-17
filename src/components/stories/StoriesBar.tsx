"use client";
import { useEffect, useState } from "react";
import { Plus, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

interface Story {
  id: string;
  userId: string;
  mediaUrl?: string;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
}

interface StoryUser {
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  stories: Story[];
}

export function StoriesBar({ onStoryClick }: { onStoryClick: (userId: string) => void }) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<StoryUser[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/stories")
      .then((res) => res.json())
      .then((data: Story[]) => {
        const currentUserId = session?.user?.id;
        const mine = data.filter((s) => s.userId === currentUserId);
        setMyStories(mine);

        const others = data.reduce<StoryUser[]>((acc, story) => {
          if (story.userId === currentUserId) return acc;
          const existing = acc.find((u) => u.userId === story.userId);
          if (existing) {
            existing.stories.push(story);
          } else {
            acc.push({
              userId: story.userId,
              firstName: story.user.firstName,
              lastName: story.user.lastName,
              avatar: story.user.avatar,
              stories: [story],
            });
          }
          return acc;
        }, []);
        setUsers(others);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-[72px] h-[72px] rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
            <div className="w-12 h-3 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide">
      {/* Ma story */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onStoryClick("me")}
        className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
      >
        <div
          className={`w-[72px] h-[72px] rounded-full p-[2px] ${
            myStories.length > 0
              ? "bg-gradient-to-br from-primary via-secondary to-accent"
              : "border-2 border-dashed border-primary/60 hover:border-primary"
          } transition-colors`}
        >
          <div className="w-full h-full rounded-full bg-white dark:bg-surface flex items-center justify-center overflow-hidden relative">
            {myStories.length > 0 ? (
              <img
                src={myStories[myStories.length - 1].mediaUrl}
                alt="Ma story"
                className="w-full h-full object-cover"
              />
            ) : (
              <Plus size={28} className="text-primary" />
            )}
          </div>
        </div>
        <span className={`text-xs font-medium ${myStories.length > 0 ? "text-primary" : "text-text-secondary"}`}>
          Ma story
        </span>
      </motion.button>

      {/* Autres utilisateurs */}
      {users.map((user) => (
        <motion.button
          key={user.userId}
          whileTap={{ scale: 0.95 }}
          onClick={() => onStoryClick(user.userId)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
        >
          <div className="w-[72px] h-[72px] rounded-full p-[2.5px] bg-gradient-to-br from-primary via-secondary to-accent shadow-sm">
            <div className="w-full h-full rounded-full bg-white dark:bg-surface flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <User size={30} className="text-text-secondary" />
                </div>
              )}
            </div>
          </div>
          <span className="text-xs text-text-secondary truncate max-w-[72px] group-hover:text-text transition-colors">
            {user.firstName}
          </span>
        </motion.button>
      ))}
    </div>
  );
}