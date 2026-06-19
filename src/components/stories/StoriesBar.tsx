"use client";
import { useEffect, useState } from "react";
import { Plus, User } from "lucide-react";

interface StoryUser {
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  stories: any[];
}

export function StoriesBar({ onStoryClick }: { onStoryClick: (userId: string) => void }) {
  const [users, setUsers] = useState<StoryUser[]>([]);

  useEffect(() => {
    fetch("/api/stories")
      .then(res => res.json())
      .then(data => {
        // Regrouper par utilisateur
        const grouped = data.reduce((acc: any, story: any) => {
          const existing = acc.find((u: any) => u.userId === story.userId);
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

  if (!users.length) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {/* Bouton "Ma story" */}
      <button
        onClick={() => onStoryClick("me")}
        className="flex flex-col items-center gap-1 flex-shrink-0"
      >
        <div className="w-16 h-16 rounded-full border-2 border-border flex items-center justify-center bg-gray-50 relative">
          <Plus size={24} className="text-text-secondary" />
        </div>
        <span className="text-xs text-text-secondary">Ma story</span>
      </button>

      {users.map(user => (
        <button
          key={user.userId}
          onClick={() => onStoryClick(user.userId)}
          className="flex flex-col items-center gap-1 flex-shrink-0"
        >
          <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-primary via-secondary to-accent">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-text-secondary" />
              )}
            </div>
          </div>
          <span className="text-xs text-text-secondary truncate max-w-[64px]">
            {user.firstName}
          </span>
        </button>
      ))}
    </div>
  );
}