"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Send, ThumbsUp, Share2, User, Star } from "lucide-react";
import { UserName } from "@/components/ui/UserName";

// Types
interface UserBrief {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  isPremium?: boolean;
}
interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: UserBrief;
  userId: string;
}
interface PostLike {
  userId: string;
}
interface Post {
  id: string;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  createdAt: string;
  user: UserBrief;
  userId: string;
  comments: Comment[];
  likes: PostLike[];
  sharedPost?: Post | null;
  sharedBy?: { user: UserBrief }[];
}

// Badge Premium
function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 ml-1.5 px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-medium border border-yellow-300">
      <Star size={10} fill="currentColor" /> Premium
    </span>
  );
}

export function PostCard({
  post,
  currentUserId,
  currentUserIsPremium,
  onShare,
}: {
  post: Post;
  currentUserId: string;
  currentUserIsPremium?: boolean;
  onShare?: (postId: string) => void;
}) {
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [likes, setLikes] = useState<PostLike[]>(post.likes);
  const [liked, setLiked] = useState(post.likes.some((l) => l.userId === currentUserId));
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  const handleLike = async () => {
    const method = liked ? "DELETE" : "POST";
    const res = await fetch(`/api/posts/${post.id}/like`, { method });
    if (res.ok) {
      setLiked(!liked);
      if (liked) {
        setLikes(likes.filter((l) => l.userId !== currentUserId));
      } else {
        setLikes([...likes, { userId: currentUserId }]);
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });
    if (res.ok) {
      const comment = await res.json();
      setComments([...comments, comment]);
      setNewComment("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-6"
    >
      {/* Partagé ? */}
      {post.sharedPost && (
        <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10">
          <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
            <Share2 size={14} />
            <span>
              {post.user.firstName} {post.user.lastName} a partagé
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {post.sharedPost.user.avatar ? (
                <img
                  src={post.sharedPost.user.avatar}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={14} />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-text">
                <UserName
                  userId={post.sharedPost.user.id}
                  firstName={post.sharedPost.user.firstName}
                  lastName={post.sharedPost.user.lastName}
                />
                {post.sharedPost.user.isPremium && <PremiumBadge />}
              </p>
              <p className="text-sm text-text-secondary">{post.sharedPost.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* En-tête utilisateur */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {post.user.avatar ? (
            <img
              src={post.user.avatar}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User size={18} />
          )}
        </div>
        <div>
          <div className="text-sm font-semibold text-text">
            <UserName
              userId={post.user.id}
              firstName={post.user.firstName}
              lastName={post.user.lastName}
            />
            {post.user.isPremium && <PremiumBadge />}
          </div>
          <p className="text-xs text-text-secondary">
            {new Date(post.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* Contenu */}
      {post.content && <p className="text-text leading-relaxed mb-4">{post.content}</p>}

      {/* Média */}
      {post.mediaUrl && (
        <div className="mb-4 rounded-xl overflow-hidden">
          {post.mediaType === "video" ? (
            <video controls className="w-full max-h-96 rounded-xl">
              <source src={post.mediaUrl} type="video/mp4" />
            </video>
          ) : (
            <img
              src={post.mediaUrl}
              alt=""
              className="w-full max-h-96 object-cover rounded-xl"
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 border-t border-border dark:border-white/10 pt-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm ${
            liked ? "text-primary" : "text-text-secondary"
          } hover:text-primary transition`}
        >
          <ThumbsUp size={16} fill={liked ? "currentColor" : "none"} />
          {likes.length} J’aime{likes.length > 1 ? "s" : ""}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition"
        >
          <MessageCircle size={16} />
          {comments.length} commentaire{comments.length > 1 ? "s" : ""}
        </button>
        {onShare && (
          <button
            onClick={() => onShare(post.id)}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition"
          >
            <Share2 size={16} /> Partager
          </button>
        )}
      </div>

      {/* Commentaires */}
      {showComments && (
        <div className="mt-3 space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex items-start gap-3 pl-4 border-l-2 border-border dark:border-white/10"
            >
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-text-secondary">
                <User size={12} />
              </div>
              <div>
                <p className="text-sm text-text">
                  <span className="font-medium">
                    <UserName
                      userId={comment.user.id}
                      firstName={comment.user.firstName}
                      lastName={comment.user.lastName}
                    />
                    {comment.user.isPremium && <PremiumBadge />}
                  </span>{" "}
                  {comment.content}
                </p>
                <span className="text-xs text-text-secondary">
                  {new Date(comment.createdAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Écrire un commentaire..."
              rows={1}
              className="flex-1 resize-none rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 px-3 py-2 text-sm text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}