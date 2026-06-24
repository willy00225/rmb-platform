"use client";
import { useEffect, useState } from "react";
import { Plus, User } from "lucide-react";

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
  const [users, setUsers] = useState<StoryUser[]>([]);

  useEffect(() => {
    fetch("/api/stories")
      .then(res => res.json())
      .then((data: Story[]) => {
        const grouped = data.reduce<StoryUser[]>((acc, story) => {
          const existing = acc.find(u => u.userId === story.userId);
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
        setUsers(grouped);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex gap-5 overflow-x-auto pb-4 px-1">
      {/* Bouton "Ma story" toujours visible */}
      <button
        onClick={() => onStoryClick("me")}
        className="flex flex-col items-center gap-1.5 flex-shrink-0"
      >
        <div className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-gray-50 dark:bg-white/5 hover:border-primary transition-colors">
          <Plus size={32} className="text-text-secondary" />
        </div>
        <span className="text-xs text-text-secondary font-medium">Ma story</span>
      </button>

      {users.map(user => (
        <button
          key={user.userId}
          onClick={() => onStoryClick(user.userId)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0"
        >
          <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-br from-primary via-secondary to-accent">
            <div className="w-full h-full rounded-full bg-white dark:bg-surface flex items-center justify-center overflow-hidden border-2 border-white dark:border-surface">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={28} className="text-text-secondary" />
              )}
            </div>
          </div>
          <span className="text-xs text-text-secondary truncate max-w-[80px]">
            {user.firstName}
          </span>
        </button>
      ))}
    </div>
  );
}