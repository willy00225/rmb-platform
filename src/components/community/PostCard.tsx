"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Send,
  ThumbsUp,
  Share2,
  User,
  MoreHorizontal,
  Trash2,
  Pencil,
  Check,
  X,
  Heart,
  CornerDownRight,
} from "lucide-react";
import { UserName } from "@/components/ui/UserName";
import toast from "react-hot-toast";

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
  parentId?: string | null;
  replies?: Comment[];
  likes?: { userId: string }[];
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

const MAX_CONTENT_LENGTH = 280;

export function PostCard({
  post,
  currentUserId,
  currentUserIsPremium,
  onShare,
  onDelete,
}: {
  post: Post;
  currentUserId: string;
  currentUserIsPremium?: boolean;
  onShare?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}) {
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [likes, setLikes] = useState<PostLike[]>(post.likes);
  const [liked, setLiked] = useState(post.likes.some((l) => l.userId === currentUserId));
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const [isContentExpanded, setIsContentExpanded] = useState(false);

  const isOwner = currentUserId === post.userId;

  const totalComments = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

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
      setComments([...comments, { ...comment, replies: [], likes: [] }]);
      setNewComment("");
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: replyContent, parentId }),
    });
    if (res.ok) {
      const reply = await res.json();
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...(c.replies || []), { ...reply, likes: [] }] }
            : c
        )
      );
      setReplyContent("");
      setReplyingTo(null);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    const allComments = [...comments, ...comments.flatMap((c) => c.replies || [])];
    const comment = allComments.find((c) => c.id === commentId);
    const alreadyLiked = comment?.likes?.some((l) => l.userId === currentUserId);

    const method = alreadyLiked ? "DELETE" : "POST";
    const res = await fetch(`/api/comments/${commentId}/like`, { method });
    if (res.ok) {
      const updateLikes = (list: Comment[]): Comment[] =>
        list.map((c) => {
          if (c.id === commentId) {
            const newLikes = alreadyLiked
              ? (c.likes || []).filter((l) => l.userId !== currentUserId)
              : [...(c.likes || []), { userId: currentUserId }];
            return { ...c, likes: newLikes };
          }
          if (c.replies) {
            return { ...c, replies: updateLikes(c.replies) };
          }
          return c;
        });
      setComments(updateLikes(comments));
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEditContent(updated.content);
      setIsEditing(false);
      toast.success("Publication modifiée");
    } else {
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette publication ?")) return;
    setIsDeleting(true);
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Publication supprimée");
      if (onDelete) onDelete(post.id);
    } else {
      toast.error("Erreur lors de la suppression");
    }
    setIsDeleting(false);
  };

  const contentIsLong = post.content && post.content.length > MAX_CONTENT_LENGTH;
  const displayedContent =
    contentIsLong && !isContentExpanded
      ? post.content?.substring(0, MAX_CONTENT_LENGTH) + "..."
      : post.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-6 relative"
    >
      {isOwner && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            <MoreHorizontal size={18} className="text-text-secondary" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-surface border border-border dark:border-white/10 rounded-xl shadow-lg py-1 z-20">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <Pencil size={14} /> Modifier
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleDelete();
                }}
                disabled={isDeleting}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          )}
        </div>
      )}

      {post.sharedPost && (
        <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10">
          <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
            <Share2 size={14} />
            <span className="flex items-center gap-1">
              <UserName
                userId={post.userId}
                firstName={post.user.firstName}
                lastName={post.user.lastName}
                isPremium={post.user.isPremium}
              />
              a partagé
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {post.sharedPost.user.avatar ? (
                <img src={post.sharedPost.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={14} />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-text flex items-center gap-1">
                <UserName
                  userId={post.sharedPost.userId}
                  firstName={post.sharedPost.user.firstName}
                  lastName={post.sharedPost.user.lastName}
                  isPremium={post.sharedPost.user.isPremium}
                />
              </p>
              <p className="text-sm text-text-secondary">{post.sharedPost.content}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {post.user.avatar ? (
            <img src={post.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={18} />
          )}
        </div>
        <div>
          <div className="text-sm font-semibold text-text flex items-center gap-1">
            <UserName
              userId={post.userId}
              firstName={post.user.firstName}
              lastName={post.user.lastName}
              isPremium={post.user.isPremium}
            />
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

      {isEditing ? (
        <div className="mb-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 px-3 py-2 text-sm text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSaveEdit}
              disabled={!editContent.trim()}
              className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition flex items-center gap-1"
            >
              <Check size={14} /> Enregistrer
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.content);
              }}
              className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-white/10 text-text text-sm font-medium hover:bg-gray-300 dark:hover:bg-white/20 transition flex items-center gap-1"
            >
              <X size={14} /> Annuler
            </button>
          </div>
        </div>
      ) : (
        post.content && (
          <div className="mb-4">
            <p className="text-text leading-relaxed">{displayedContent}</p>
            {contentIsLong && (
              <button
                onClick={() => setIsContentExpanded(!isContentExpanded)}
                className="text-primary text-sm font-medium hover:underline mt-1"
              >
                {isContentExpanded ? "Voir moins" : "Voir plus"}
              </button>
            )}
          </div>
        )
      )}

      {post.mediaUrl && (
        <div className="mb-4 rounded-xl overflow-hidden">
          {post.mediaType === "video" ? (
            <video controls className="w-full max-h-96 rounded-xl">
              <source src={post.mediaUrl} type="video/mp4" />
            </video>
          ) : (
            <img src={post.mediaUrl} alt="" className="w-full max-h-96 object-cover rounded-xl" />
          )}
        </div>
      )}

      <div className="flex items-center gap-6 border-t border-border dark:border-white/10 pt-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm ${
            liked ? "text-primary" : "text-text-secondary"
          } hover:text-primary transition`}
        >
          <ThumbsUp size={16} fill={liked ? "currentColor" : "none"} />
          {likes.length} J&apos;aime{likes.length > 1 ? "s" : ""}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition"
        >
          <MessageCircle size={16} />
          {totalComments} commentaire{totalComments > 1 ? "s" : ""}
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

      {showComments && (
        <div className="mt-4 space-y-4">
          {comments.map((comment) => (
            <div key={comment.id}>
              <div className="flex items-start gap-3 pl-4 border-l-2 border-border dark:border-white/10">
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-text-secondary">
                  <User size={12} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text">
                    <span className="font-medium">
                      <UserName
                        userId={comment.userId}
                        firstName={comment.user.firstName}
                        lastName={comment.user.lastName}
                        isPremium={comment.user.isPremium}
                      />
                    </span>{" "}
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-text-secondary">
                      {new Date(comment.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className={`flex items-center gap-1 text-xs ${
                        comment.likes?.some((l) => l.userId === currentUserId)
                          ? "text-red-500"
                          : "text-text-secondary"
                      } hover:text-red-500 transition`}
                    >
                      <Heart
                        size={12}
                        fill={
                          comment.likes?.some((l) => l.userId === currentUserId)
                            ? "currentColor"
                            : "none"
                        }
                      />
                      {comment.likes?.length || 0}
                    </button>
                    <button
                      onClick={() =>
                        setReplyingTo(replyingTo === comment.id ? null : comment.id)
                      }
                      className="text-xs text-text-secondary hover:text-text transition flex items-center gap-1"
                    >
                      <CornerDownRight size={12} />
                      Répondre
                    </button>
                  </div>

                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3 pl-6">
                          <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-text-secondary">
                            <User size={10} />
                          </div>
                          <div>
                            <p className="text-sm text-text">
                              <span className="font-medium">
                                <UserName
                                  userId={reply.userId}
                                  firstName={reply.user.firstName}
                                  lastName={reply.user.lastName}
                                  isPremium={reply.user.isPremium}
                                />
                              </span>{" "}
                              {reply.content}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-text-secondary">
                                {new Date(reply.createdAt).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <button
                                onClick={() => handleLikeComment(reply.id)}
                                className={`flex items-center gap-1 text-xs ${
                                  reply.likes?.some((l) => l.userId === currentUserId)
                                    ? "text-red-500"
                                    : "text-text-secondary"
                                } hover:text-red-500 transition`}
                              >
                                <Heart
                                  size={12}
                                  fill={
                                    reply.likes?.some((l) => l.userId === currentUserId)
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                                {reply.likes?.length || 0}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {replyingTo === comment.id && (
                    <div className="mt-2 flex items-center gap-2">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Votre réponse..."
                        rows={1}
                        className="flex-1 resize-none rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 px-3 py-2 text-sm text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
                      />
                      <button
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyContent.trim()}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  )}
                </div>
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