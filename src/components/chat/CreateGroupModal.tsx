"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { X, Plus, Users, Search, Check, User, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface FriendOption {
  id: string;
  name: string;
  avatar?: string | null;
}

interface CreateGroupModalProps {
  chatClient: any;
  userId: string;
  onClose: () => void;
  onGroupCreated: (channelId: string) => void;
}

export function CreateGroupModal({
  chatClient,
  userId,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [search, setSearch] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/friends?status=ACCEPTED")
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((f: any) => ({
          id: f.friend.id,
          name: `${f.friend.firstName} ${f.friend.lastName}`,
          avatar: f.friend.avatar,
        }));
        setFriends(mapped);
      })
      .catch(() => toast.error("Impossible de charger vos amis."))
      .finally(() => setLoadingFriends(false));
  }, []);

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedFriends.length === 0) {
      toast.error("Donnez un nom et sélectionnez au moins un ami.");
      return;
    }
    setCreating(true);
    try {
      const channel = chatClient.channel("messaging", undefined, {
        name: name.trim(),
        members: [userId, ...selectedFriends],
        created_by_id: userId,
      });
      await channel.watch();
      toast.success("Groupe créé !");
      onGroupCreated(channel.id);
      onClose(); // fermeture automatique après succès
    } catch (err) {
      toast.error("Erreur lors de la création du groupe.");
    } finally {
      setCreating(false);
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Users size={18} />
              </div>
              Nouveau groupe
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-text transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nom du groupe */}
          <input
            type="text"
            placeholder="Nom du groupe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition mb-4"
          />

          {/* Recherche d'amis */}
          <div className="relative mb-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Rechercher un ami..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text text-sm placeholder-text-secondary focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Compteur de sélection */}
          {selectedFriends.length > 0 && (
            <p className="text-xs text-primary mb-2 font-medium">
              {selectedFriends.length} ami{selectedFriends.length > 1 ? "s" : ""} sélectionné{selectedFriends.length > 1 ? "s" : ""}
            </p>
          )}

          {/* Liste des amis */}
          <div className="flex-1 overflow-y-auto mb-4 min-h-[120px] max-h-48">
            {loadingFriends ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <p className="text-text-secondary text-sm text-center py-6">
                {search ? "Aucun ami trouvé." : "Aucun ami disponible."}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredFriends.map((friend) => {
                  const isSelected = selectedFriends.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      onClick={() => toggleFriend(friend.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                        isSelected
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={18} className="text-text-secondary" />
                        )}
                      </div>
                      <span className="flex-1 text-sm font-medium text-text truncate">
                        {friend.name}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bouton de création */}
          <Button
            onClick={handleCreate}
            disabled={creating || !name.trim() || selectedFriends.length === 0}
            variant="primary"
            className="w-full"
          >
            {creating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            <span className="ml-2">{creating ? "Création..." : "Créer le groupe"}</span>
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}