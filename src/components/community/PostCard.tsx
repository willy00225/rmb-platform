"use client";
import { useState, useRef } from "react";
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
  ImageIcon,
  Loader2,
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
  mediaUrl?: string | null;      // ✅ média du commentaire
  mediaType?: string | null;     // ✅ type (image/video)
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
  sharesCount?: number;
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
  const [commentFile, setCommentFile] = useState<File | null>(null);          // ✅ fichier média
  const [commentFilePreview, setCommentFilePreview] = useState<string | null>(null);
  const [isUploadingComment, setIsUploadingComment] = useState(false);
  const commentFileRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);               // ✅ fichier pour réponse
  const [replyFilePreview, setReplyFilePreview] = useState<string | null>(null);
  const [isUploadingReply, setIsUploadingReply] = useState(false);
  const replyFileRef = useRef<HTMLInputElement>(null);

  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [sharesCount, setSharesCount] = useState(post.sharesCount || 0);
  const [isSharing, setIsSharing] = useState(false);

  const isOwner = currentUserId === post.userId;

  const totalComments = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  // ----- Helper : uploader un fichier vers Cloudinary -----
  const uploadFileToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      toast.error("Échec de l'upload du média");
      return null;
    }
    const { url } = await res.json();
    return url;
  };

  // ----- Likes du post -----
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

  // ----- Ajout d'un commentaire principal -----
  const handleAddComment = async () => {
    if (!newComment.trim() && !commentFile) return;
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    if (commentFile) {
      setIsUploadingComment(true);
      const url = await uploadFileToCloudinary(commentFile);
      setIsUploadingComment(false);
      if (!url) return;
      mediaUrl = url;
      mediaType = commentFile.type.startsWith("video/") ? "video" : "image";
    }

    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: newComment.trim() || "",
        mediaUrl,
        mediaType,
      }),
    });
    if (res.ok) {
      const comment = await res.json();
      setComments([...comments, { ...comment, replies: [], likes: [] }]);
      setNewComment("");
      setCommentFile(null);
      setCommentFilePreview(null);
    } else {
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  // ----- Réponse à un commentaire -----
  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() && !replyFile) return;
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    if (replyFile) {
      setIsUploadingReply(true);
      const url = await uploadFileToCloudinary(replyFile);
      setIsUploadingReply(false);
      if (!url) return;
      mediaUrl = url;
      mediaType = replyFile.type.startsWith("video/") ? "video" : "image";
    }

    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: replyContent.trim() || "",
        parentId,
        mediaUrl,
        mediaType,
      }),
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
      setReplyFile(null);
      setReplyFilePreview(null);
    } else {
      toast.error("Erreur lors de la réponse");
    }
  };

  // ----- Like d'un commentaire -----
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

  // ----- Sauvegarde de l'édition du post -----
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

  // ----- Suppression du post -----
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

  // ----- Partage immédiat -----
  const handleShare = async () => {
    setIsSharing(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sharedPostId: post.id }),
    });
    if (res.ok) {
      setSharesCount((prev) => prev + 1);
      toast.success("Publication partagée !");
    } else {
      toast.error("Erreur lors du partage");
    }
    setIsSharing(false);
  };

  const contentIsLong = post.content && post.content.length > MAX_CONTENT_LENGTH;
  const displayedContent =
    contentIsLong && !isContentExpanded
      ? post.content?.substring(0, MAX_CONTENT_LENGTH) + "..."
      : post.content;

  // ----- Rendu d'un commentaire (principal ou réponse) -----
  const renderComment = (comment: Comment) => (
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
      {/* ✅ Affichage du média du commentaire */}
      {comment.mediaUrl && (
        <div className="mt-2 rounded-xl overflow-hidden max-w-[200px]">
          {comment.mediaType === "video" ? (
            <video controls className="w-full h-auto rounded-xl">
              <source src={comment.mediaUrl} type="video/mp4" />
            </video>
          ) : (
            <img
              src={comment.mediaUrl}
              alt=""
              className="w-full h-auto object-cover rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>
      )}
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
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-6 relative"
    >
      {/* ... menu auteur, partage, en-tête, contenu, média du post ... (inchangé) */}

      {showComments && (
        <div className="mt-4 space-y-4">
          {comments.map((comment) => (
            <div key={comment.id}>
              <div className="flex items-start gap-3 pl-4 border-l-2 border-border dark:border-white/10">
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-text-secondary">
                  <User size={12} />
                </div>
                {renderComment(comment)}
              </div>

              {/* Réponses */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2 space-y-2 pl-6">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-text-secondary">
                        <User size={10} />
                      </div>
                      {renderComment(reply)}
                    </div>
                  ))}
                </div>
              )}

              {/* Formulaire de réponse */}
              {replyingTo === comment.id && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Votre réponse..."
                      rows={1}
                      className="flex-1 resize-none rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 px-3 py-2 text-sm text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
                    />
                    <button
                      onClick={() => handleReply(comment.id)}
                      disabled={(!replyContent.trim() && !replyFile) || isUploadingReply}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition"
                    >
                      {isUploadingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                    <label className="cursor-pointer text-text-secondary hover:text-primary transition">
                      <ImageIcon size={16} />
                      <input
                        type="file"
                        accept="image/*,video/*"
                        ref={replyFileRef}
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setReplyFile(f);
                            setReplyFilePreview(URL.createObjectURL(f));
                          }
                        }}
                      />
                    </label>
                  </div>
                  {replyFilePreview && (
                    <div className="relative inline-block">
                      <img src={replyFilePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                      <button
                        onClick={() => { setReplyFile(null); setReplyFilePreview(null); }}
                        className="absolute -top-1 -right-1 bg-black/50 text-white rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Formulaire de commentaire principal */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Écrire un commentaire..."
                rows={1}
                className="flex-1 resize-none rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 px-3 py-2 text-sm text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
              />
              <button
                onClick={handleAddComment}
                disabled={(!newComment.trim() && !commentFile) || isUploadingComment}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition"
              >
                {isUploadingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
              <label className="cursor-pointer text-text-secondary hover:text-primary transition">
                <ImageIcon size={16} />
                <input
                  type="file"
                  accept="image/*,video/*"
                  ref={commentFileRef}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setCommentFile(f);
                      setCommentFilePreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </label>
            </div>
            {commentFilePreview && (
              <div className="relative inline-block">
                <img src={commentFilePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                <button
                  onClick={() => { setCommentFile(null); setCommentFilePreview(null); }}
                  className="absolute -top-1 -right-1 bg-black/50 text-white rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}