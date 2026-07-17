"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  MapPin,
  CalendarDays,
  Heart,
  TrendingUp,
  Users,
  MessageCircle,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import { PostCard } from "@/components/community/PostCard";
import { ChallengeWidget } from "@/components/challenges/ChallengeWidget";
import { LiveWidget } from "@/components/live/LiveWidget";
import { RadioWidget } from "@/components/radio/RadioWidget";

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  coverImage: string | null;
  bio: string | null;
  level: number;
  xp: number;
  createdAt: string;
  dateOfBirth: string | null;
  city: string | null;
  village: string | null;
  canton: string | null;
  currentCity: string | null;
  currentVillage: string | null;
  currentCountry: string;
  phone: string | null;
  fonction: string | null;
  totalDonated: number;
};

export function ProfileClient({
  user,
  friendsCount,
  posts,
  badges,
  familyData,
  recentPhotos,
  friendsPreview,
  followedPages,
  postCount,
  commentCount,
  donationCount,
  currentUserId,
}: {
  user: UserData;
  friendsCount: number;
  posts: any[];
  badges: any[];
  familyData: any;
  recentPhotos: { id: string; url: string }[];
  friendsPreview: any[];
  followedPages: any[];
  postCount: number;
  commentCount: number;
  donationCount: number;
  currentUserId: string;
}) {
  const [activeTab, setActiveTab] = useState<"posts" | "photos" | "about">("posts");

  return (
    <div className="space-y-6 animate-fadeInUp pb-10">
      {/* Bannière et avatar */}
      <div className="card-premium overflow-hidden !p-0">
        <div
          className="h-48 md:h-64 bg-gradient-to-br from-primary/20 to-primary/5 relative"
          style={
            user.coverImage
              ? { backgroundImage: `url(${user.coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }
              : {}
          }
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-surface bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </span>
                )}
              </div>
              <div className="mb-2 text-white">
                <h1 className="text-2xl md:text-3xl font-bold drop-shadow-lg">
                  {user.firstName} {user.lastName}
                </h1>
                {user.fonction && <p className="text-white/80 text-sm">{user.fonction}</p>}
                <p className="text-white/70 text-xs flex items-center gap-2 mt-1">
                  {user.currentCity && <><MapPin size={12} /> {user.currentCity}</>}
                  {user.village && <span>· {user.village}</span>}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/settings"
              className="bg-white/20 backdrop-blur hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm font-medium transition"
            >
              Modifier mon profil
            </Link>
          </div>
        </div>
      </div>

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
          <p className="text-2xl font-bold text-text">{user.totalDonated.toLocaleString()} F</p>
          <p className="text-xs text-text-secondary">Dons</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex border-b border-border">
        {(["posts", "photos", "about"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text"
            }`}
          >
            {tab === "posts" ? "Publications" : tab === "photos" ? "Photos" : "À propos"}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
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

      {activeTab === "about" && (
        <div className="space-y-6">
          {user.bio && (
            <div className="card-premium p-4">
              <h3 className="font-semibold text-text mb-1">Bio</h3>
              <p className="text-text-secondary text-sm">{user.bio}</p>
            </div>
          )}
          <div className="card-premium p-4">
            <h3 className="font-semibold text-text mb-2">Détails</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              {user.dateOfBirth && (
                <li className="flex items-center gap-2"><CalendarDays size={14} /> Né(e) le {new Date(user.dateOfBirth).toLocaleDateString("fr-FR")}</li>
              )}
              {user.city && <li className="flex items-center gap-2"><MapPin size={14} /> Ville : {user.city}</li>}
              {user.village && <li className="flex items-center gap-2"><MapPin size={14} /> Village : {user.village}</li>}
              {user.canton && <li className="flex items-center gap-2"><MapPin size={14} /> Canton : {user.canton}</li>}
              <li className="flex items-center gap-2"><TrendingUp size={14} /> Niveau {user.level} · {user.xp} XP</li>
            </ul>
          </div>

          {/* Famille */}
          <div className="card-premium p-4">
            <h3 className="font-semibold text-text mb-2">Famille</h3>
            {familyData.parents.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-text-secondary">Parents</p>
                <div className="flex flex-wrap gap-2">
                  {familyData.parents.map((p: any) => (
                    <span key={p.id} className="text-sm text-text">{p.firstName} {p.lastName}</span>
                  ))}
                </div>
              </div>
            )}
            {familyData.children.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-text-secondary">Enfants</p>
                <div className="flex flex-wrap gap-2">
                  {familyData.children.map((p: any) => (
                    <span key={p.id} className="text-sm text-text">{p.firstName} {p.lastName}</span>
                  ))}
                </div>
              </div>
            )}
            {familyData.spouses.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-text-secondary">Conjoint(e)</p>
                {familyData.spouses.map((p: any) => (
                  <span key={p.id} className="text-sm text-text">{p.firstName} {p.lastName}</span>
                ))}
              </div>
            )}
            {familyData.siblings.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-text-secondary">Frères/sœurs</p>
                <div className="flex flex-wrap gap-2">
                  {familyData.siblings.map((p: any) => (
                    <span key={p.id} className="text-sm text-text">{p.firstName} {p.lastName}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="card-premium p-4">
            <h3 className="font-semibold text-text mb-2">Badges</h3>
            {badges.length === 0 ? (
              <p className="text-text-secondary text-sm">Aucun badge.</p>
            ) : (
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
            )}
          </div>

          {/* Pages suivies */}
          {followedPages.length > 0 && (
            <div className="card-premium p-4">
              <h3 className="font-semibold text-text mb-2">Pages suivies</h3>
              <div className="grid grid-cols-2 gap-3">
                {followedPages.map((page) => (
                  <Link key={page.id} href={`/dashboard/pages/${page.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                      {page.imageUrl ? <img src={page.imageUrl} alt="" className="w-full h-full object-cover" /> : page.name[0]}
                    </div>
                    <span className="text-sm text-text truncate">{page.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Amis en aperçu */}
          {friendsPreview.length > 0 && (
            <div className="card-premium p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-text">Amis</h3>
                <Link href="/dashboard/friends" className="text-primary text-sm hover:underline">
                  Voir tous ({friendsCount})
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {friendsPreview.map((friend) => (
                  <Link key={friend.id} href={`/dashboard/profile/${friend.id}`} className="text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/10 mx-auto overflow-hidden">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-secondary">
                          <User size={20} />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-1 truncate">{friend.firstName}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RadioWidget />
        <ChallengeWidget />
        <LiveWidget />
      </div>
    </div>
  );
}