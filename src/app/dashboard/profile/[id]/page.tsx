// src/app/dashboard/profile/[id]/PublicProfileClient.tsx
"use client";
import { useState } from "react";
import { Heart, MessageCircle, ThumbsUp, Users, MapPin, TrendingUp, CalendarDays } from "lucide-react";
import Link from "next/link";
import { PostCard } from "@/components/community/PostCard";

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

type Post = any; // Utilisez le même type que dans PostCard

export function PublicProfileClient({
  userId,
  bio,
  level,
  xp,
  totalDonated,
  posts,
  badges,
  friendsCount,
  commonFriends,
  commonFriendsCount,
  recentPhotos,
  postCount,
  commentCount,
  donationCount,
  currentUserId,
}: {
  userId: string;
  bio: string | null;
  level: number;
  xp: number;
  totalDonated: number;
  posts: Post[];
  badges: Badge[];
  friendsCount: number;
  commonFriends: { id: string; firstName: string; lastName: string; avatar: string | null }[];
  commonFriendsCount: number;
  recentPhotos: { id: string; url: string }[];
  postCount: number;
  commentCount: number;
  donationCount: number;
  currentUserId: string;
}) {
  const [activeTab, setActiveTab] = useState<"posts" | "photos" | "common">("posts");

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-premium p-4 text-center">
          <Users size={20} className="text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-text">{friendsCount}</p>
          <p className="text-xs text-text-secondary">Amis</p>
        </div>
        <div className="card-premium p-4 text-center">
          <MessageCircle size={20} className="text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-text">{postCount}</p>
          <p className="text-xs text-text-secondary">Publications</p>
        </div>
        <div className="card-premium p-4 text-center">
          <ThumbsUp size={20} className="text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-text">{commentCount}</p>
          <p className="text-xs text-text-secondary">Commentaires</p>
        </div>
        <div className="card-premium p-4 text-center">
          <Heart size={20} className="text-secondary mx-auto mb-1" />
          <p className="text-2xl font-bold text-text">{totalDonated.toLocaleString()} F</p>
          <p className="text-xs text-text-secondary">Dons</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex border-b border-border">
        {(["posts", "photos", "common"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text"
            }`}
          >
            {tab === "posts" ? "Publications" : tab === "photos" ? "Photos" : "Amis en commun"}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {activeTab === "posts" && (
        <div className="space-y-6">
          {posts.length === 0 ? (
            <p className="text-text-secondary italic text-center py-8">Aucune publication.</p>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId} />
            ))
          )}
        </div>
      )}

      {activeTab === "photos" && (
        <div>
          {recentPhotos.length === 0 ? (
            <p className="text-text-secondary italic text-center py-8">Aucune photo.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {recentPhotos.map((photo) => (
                <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "common" && (
        <div>
          {commonFriends.length === 0 ? (
            <p className="text-text-secondary italic text-center py-8">Aucun ami en commun.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {commonFriends.map((friend) => (
                <Link
                  key={friend.id}
                  href={`/dashboard/profile/${friend.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-secondary">
                        <Users size={16} />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-text truncate">
                    {friend.firstName} {friend.lastName}
                  </span>
                </Link>
              ))}
              {commonFriendsCount > commonFriends.length && (
                <p className="text-xs text-text-secondary text-center col-span-full mt-2">
                  et {commonFriendsCount - commonFriends.length} autres amis en commun
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Informations supplémentaires (toujours visibles) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bio && (
          <div className="card-premium p-4">
            <h3 className="font-semibold text-text mb-1">Bio</h3>
            <p className="text-text-secondary text-sm">{bio}</p>
          </div>
        )}
        <div className="card-premium p-4">
          <h3 className="font-semibold text-text mb-2">Détails</h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-center gap-2"><TrendingUp size={14} /> Niveau {level} · {xp} XP</li>
          </ul>
        </div>
        {badges.length > 0 && (
          <div className="card-premium p-4 md:col-span-2">
            <h3 className="font-semibold text-text mb-2">Badges</h3>
            <div className="flex flex-wrap gap-4">
              {badges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <p className="text-text text-sm font-medium">{badge.name}</p>
                    <p className="text-text-secondary text-xs">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}