"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PostCard } from "@/components/community/PostCard";
import {
  Users,
  MessageSquare,
  User,
  Send,
  Image as ImageIcon,
  Loader2,
  UserPlus,
  UserCheck,
  ChevronDown,
  Hash,
} from "lucide-react";
import toast from "react-hot-toast";

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: string;
};

type Post = {
  id: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    isPremium: boolean;
  };
  comments: any[];
  likes: any[];
  sharesCount: number;
  sharedPost: any;
};

type Group = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  memberCount: number;
  creatorName: string;
  posts: Post[];
  members: Member[];
  isMember: boolean;
};

export function GroupDetailClient({
  group,
  currentUserId,
}: {
  group: Group;
  currentUserId: string;
}) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"posts" | "members" | "about">("posts");
  const [newPostContent, setNewPostContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Mutation pour rejoindre / quitter le groupe
  const joinMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/groups/${group.id}/join`, { method: "POST" }).then((res) => {
        if (!res.ok) throw new Error("Erreur");
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", group.id] });
      toast.success(group.isMember ? "Vous avez quitté le groupe" : "Vous avez rejoint le groupe !");
    },
    onError: () => toast.error("Erreur"),
  });

  // Mutation pour publier un post dans le groupe
  const publishMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/groups/${group.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPostContent }),
      }).then((res) => {
        if (!res.ok) throw new Error("Erreur");
        return res.json();
      }),
    onSuccess: () => {
      toast.success("Publication ajoutée");
      setNewPostContent("");
      queryClient.invalidateQueries({ queryKey: ["group", group.id] });
    },
    onError: () => toast.error("Erreur lors de la publication"),
  });

  const handlePublish = () => {
    if (!newPostContent.trim()) return;
    publishMutation.mutate();
  };

  return (
    <div className="space-y-6 animate-fadeInUp pb-10">
      {/* En-tête du groupe */}
      <div className="card-premium overflow-hidden !p-0">
        {/* Bannière du groupe */}
        <div
          className="h-40 md:h-52 bg-gradient-to-br from-primary/20 to-primary/5 relative"
          style={
            group.imageUrl
              ? { backgroundImage: `url(${group.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : {}
          }
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="text-2xl md:text-3xl font-bold drop-shadow-lg break-words">{group.name}</h1>
            <p className="text-white/80 text-sm mt-1 flex items-center gap-2">
              <Users size={16} /> {group.memberCount} membre{group.memberCount > 1 ? "s" : ""} · Créé par {group.creatorName}
            </p>
          </div>
        </div>

        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("posts")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "posts"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              Publications
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "members"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              Membres ({group.memberCount})
            </button>
            {group.description && (
              <button
                onClick={() => setActiveTab("about")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === "about"
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-text"
                }`}
              >
                À propos
              </button>
            )}
          </div>

          {group.isMember ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? (
                <Loader2 size={16} className="animate-spin mr-1" />
              ) : (
                <UserCheck size={16} className="mr-1" />
              )}
              Quitter le groupe
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? (
                <Loader2 size={16} className="animate-spin mr-1" />
              ) : (
                <UserPlus size={16} className="mr-1" />
              )}
              Rejoindre le groupe
            </Button>
          )}
        </div>
      </div>

      {/* Contenu de l'onglet */}
      <AnimatePresence mode="wait">
        {activeTab === "posts" && (
          <motion.div
            key="posts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Formulaire de publication (si membre) */}
            {group.isMember && (
              <div className="card-premium p-4">
                <div className="flex gap-3">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Écrire une publication dans le groupe..."
                    rows={2}
                    className="flex-1 resize-none rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 px-4 py-3 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
                  />
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                      <ImageIcon size={18} className="text-text-secondary" />
                      <input type="file" accept="image/*" className="hidden" />
                    </label>
                    <button
                      onClick={handlePublish}
                      disabled={!newPostContent.trim() || publishMutation.isPending}
                      className="p-2 rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50 transition"
                    >
                      {publishMutation.isPending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {group.posts.length === 0 ? (
              <div className="card-premium p-8 text-center text-text-secondary">
                <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
                <p>Aucune publication pour le moment.</p>
              </div>
            ) : (
              group.posts.map((post) => (
                <PostCard key={post.id} post={post} currentUserId={currentUserId} />
              ))
            )}
          </motion.div>
        )}

        {activeTab === "members" && (
          <motion.div
            key="members"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card-premium p-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {group.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0 overflow-hidden">
                    {member.avatar ? (
                      <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{member.firstName[0]}{member.lastName[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {member.role === "ADMIN" ? "Administrateur" : member.role === "MODERATOR" ? "Modérateur" : "Membre"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "about" && group.description && (
          <motion.div
            key="about"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card-premium p-6"
          >
            <h2 className="text-lg font-semibold text-text mb-3">À propos du groupe</h2>
            <p className="text-text-secondary whitespace-pre-line">{group.description}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}