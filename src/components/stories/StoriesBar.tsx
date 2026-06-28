"use client";
import { useEffect, useState } from "react";
import { Plus, User } from "lucide-react";
import { useSession } from "next-auth/react"; // ✅ import ajouté

// Type d'une story telle que renvoyée par l'API
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
  const { data: session } = useSession(); // ✅ récupère l'utilisateur connecté
  const [users, setUsers] = useState<StoryUser[]>([]);

  useEffect(() => {
    fetch("/api/stories")
      .then(res => res.json())
      .then((data: Story[]) => {
        const currentUserId = session?.user?.id; // ID de l'utilisateur connecté

        const grouped = data.reduce<StoryUser[]>((acc, story) => {
          // ✅ On ignore les stories de l'utilisateur connecté (elles seront dans "Ma story")
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
        setUsers(grouped);
      })
      .catch(() => {});
  }, [session]); // ✅ dépend de la session

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {/* Bouton "Ma story" toujours visible */}
      <button
        onClick={() => onStoryClick("me")}
        className="flex flex-col items-center gap-1 flex-shrink-0"
      >
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-gray-50 dark:bg-white/5 hover:border-primary transition-colors">
          <Plus size={24} className="text-text-secondary" />
        </div>
        <span className="text-xs text-text-secondary font-medium">Ma story</span>
      </button>

      {/* Stories des autres membres (si présentes) */}
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