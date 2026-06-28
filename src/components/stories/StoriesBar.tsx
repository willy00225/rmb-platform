"use client";
import { useEffect, useState } from "react";
import { Plus, User } from "lucide-react";
import { useSession } from "next-auth/react";

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

  useEffect(() => {
    fetch("/api/stories")
      .then(res => res.json())
      .then((data: Story[]) => {
        const currentUserId = session?.user?.id;
        const mine = data.filter(s => s.userId === currentUserId);
        setMyStories(mine);

        const others = data.reduce<StoryUser[]>((acc, story) => {
          if (story.userId === currentUserId) return acc;
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
        setUsers(others);
      })
      .catch(() => {});
  }, [session]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {/* Mon cercle */}
      <button
        onClick={() => onStoryClick("me")}
        className="flex flex-col items-center gap-1 flex-shrink-0"
      >
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary bg-gray-50 dark:bg-white/5 flex items-center justify-center overflow-hidden">
          {myStories.length > 0 ? (
            <img
              src={myStories[myStories.length - 1].mediaUrl}
              alt="Ma story"
              className="w-full h-full object-cover"
            />
          ) : (
            <Plus size={24} className="text-primary" />
          )}
        </div>
        <span className="text-xs font-medium text-primary">Ma story</span>
      </button>

      {/* Autres utilisateurs */}
      {users.map(user => (
        <button
          key={user.userId}
          onClick={() => onStoryClick(user.userId)}
          className="flex flex-col items-center gap-1 flex-shrink-0"
        >
          <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-primary via-secondary to-accent">
            <div className="w-full h-full rounded-full bg-white dark:bg-surface flex items-center justify-center overflow-hidden">
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