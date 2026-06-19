"use client";
import { useState } from "react";
import { PostCard } from "@/components/community/PostCard";
import { Send, ImageIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function FeedPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);

  // Récupération des posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => fetch("/api/posts").then(res => res.json()),
  });

  // Mutation de création de post
  const createPostMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPost, mediaUrl, mediaType, sharedPostId }),
      });
      if (!res.ok) throw new Error("Erreur de publication");
      return res.json();
    },
    onSuccess: (newPostData) => {
      toast.success("Publication créée !");
      setNewPost("");
      setMediaUrl(null);
      setMediaType(null);
      setSharedPostId(null);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: () => toast.error("Erreur lors de la publication"),
  });

  const handleCreatePost = async () => {
    if (!newPost.trim() && !mediaUrl) return;
    createPostMutation.mutate();
  };

  const handleShare = (postId: string) => {
    setSharedPostId(postId);
    setNewPost("Partage...");
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <h1 className="text-3xl font-display font-bold text-text">Fil d’actualité</h1>

      {/* Zone de publication */}
      <div className="rounded-[var(--radius-card)] bg-white border border-border shadow-[var(--shadow-card)] p-6">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Partagez une nouvelle, une pensée..."
          rows={3}
          className="w-full resize-none rounded-xl bg-gray-50 border border-border px-4 py-3 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-4">
            <label className="cursor-pointer flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition">
              <ImageIcon size={18} />
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append("file", file);
                  const res = await fetch("/api/upload", { method: "POST", body: formData });
                  if (res.ok) {
                    const { url } = await res.json();
                    setMediaUrl(url);
                    setMediaType(file.type.startsWith("video") ? "video" : "image");
                  }
                }}
              />
              Ajouter une photo/vidéo
            </label>
            {mediaUrl && <span className="text-xs text-primary truncate">{mediaUrl.split("/").pop()}</span>}
          </div>
          <button
            onClick={handleCreatePost}
            disabled={(!newPost.trim() && !mediaUrl) || createPostMutation.isPending}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <Send size={18} />
            {createPostMutation.isPending ? "Publication..." : "Publier"}
          </button>
        </div>
      </div>

      {/* Liste des posts */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-text-secondary italic">Aucune publication pour le moment. Soyez le premier à poster !</p>
        ) : (
          posts.map((post: any) => (
            <PostCard key={post.id} post={post} currentUserId={session?.user?.id || ""} onShare={handleShare} />
          ))
        )}
      </div>
    </div>
  );
}