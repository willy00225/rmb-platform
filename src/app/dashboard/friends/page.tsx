"use client";

export const dynamic = 'force-dynamic'; // Désactive le prérendu

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  UserPlus,
  UserCheck,
  Search,
  MessageCircle,
  Clock,
  Users,
  UserX,
} from "lucide-react";
import toast from "react-hot-toast";
import { useChat } from "@/contexts/ChatContext";
import { UserName } from "@/components/ui/UserName";

// Interfaces
interface SearchUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
}

interface FriendRequest {
  id: string;
  createdAt: string;
  friend: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
}

interface Friend {
  id: string;
  createdAt: string;
  friend: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
}

export default function FriendsPage() {
  const { data: session } = useSession();
  const { openChatWithFriend } = useChat();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Amis acceptés
  const { data: friends = [], isLoading: friendsLoading } = useQuery<Friend[]>({
    queryKey: ["friends", "accepted"],
    queryFn: () => fetch("/api/friends?status=ACCEPTED").then((res) => res.json()),
  });

  // Demandes en attente (reçues)
  const { data: pendingRequests = [] } = useQuery<FriendRequest[]>({
    queryKey: ["friends", "pending"],
    queryFn: () => fetch("/api/friends?status=PENDING").then((res) => res.json()),
  });

  // Recherche de membres
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      } else {
        toast.error("Erreur lors de la recherche");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setIsSearching(false);
    }
  };

  // Ajouter un ami
  const addFriendMutation = useMutation({
    mutationFn: (userId: string) =>
      fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresseeId: userId }),
      }).then((res) => {
        if (!res.ok)
          return res.json().then((err) => {
            throw new Error(err.error || "Erreur");
          });
        return res.json();
      }),
    onSuccess: () => {
      toast.success("Invitation envoyée");
      // Retirer l'utilisateur des résultats de recherche
      setSearchResults((prev) => prev.filter((u) => u.id !== addFriendMutation.variables));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Accepter une invitation
  const acceptMutation = useMutation({
    mutationFn: (friendshipId: string) =>
      fetch(`/api/friends/${friendshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      }),
    onSuccess: () => {
      toast.success("Ami ajouté !");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: () => toast.error("Erreur lors de l'acceptation"),
  });

  // Refuser une invitation
  const rejectMutation = useMutation({
    mutationFn: (friendshipId: string) =>
      fetch(`/api/friends/${friendshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      }),
    onSuccess: () => {
      toast.success("Invitation refusée");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: () => toast.error("Erreur lors du refus"),
  });

  return (
    <div className="space-y-8 animate-fadeInUp pb-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text flex items-center gap-2">
            <Users size={28} className="text-primary" />
            Amis & Contacts
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {friends.length} ami{friends.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Recherche de membres */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6"
      >
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Search size={20} className="text-primary" />
          Rechercher un membre
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Nom, prénom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            variant="primary"
            className="w-full sm:w-auto"
          >
            {isSearching ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Search size={18} />
            )}
            <span className="ml-2">Rechercher</span>
          </Button>
        </div>

        {/* Résultats de recherche */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="space-y-3 pt-4 border-t border-border dark:border-white/10">
                {searchResults.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0 overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          `${user.firstName[0]}${user.lastName[0]}`
                        )}
                      </div>
                      <div>
                        <p className="text-text font-medium">
                          <UserName
                            userId={user.id}
                            firstName={user.firstName}
                            lastName={user.lastName}
                          />
                        </p>
                        <p className="text-xs text-text-secondary truncate max-w-[200px]">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => addFriendMutation.mutate(user.id)}
                      size="sm"
                      variant="primary"
                      className="w-full sm:w-auto"
                      disabled={addFriendMutation.isPending}
                    >
                      <UserPlus size={16} className="mr-1" /> Ajouter
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Invitations en attente */}
      {pendingRequests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-premium p-6"
        >
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Invitations en attente
            <span className="text-sm font-normal text-text-secondary ml-2">
              ({pendingRequests.length})
            </span>
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0 overflow-hidden">
                    {req.friend.avatar ? (
                      <img src={req.friend.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      `${req.friend.firstName[0]}${req.friend.lastName[0]}`
                    )}
                  </div>
                  <div>
                    <p className="text-text font-medium">
                      <UserName
                        userId={req.friend.id}
                        firstName={req.friend.firstName}
                        lastName={req.friend.lastName}
                      />
                    </p>
                    <p className="text-xs text-text-secondary">Souhaite devenir ami</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => acceptMutation.mutate(req.id)}
                    size="sm"
                    variant="primary"
                    className="flex-1 sm:flex-initial"
                    disabled={acceptMutation.isPending}
                  >
                    <UserCheck size={16} className="mr-1" /> Accepter
                  </Button>
                  <Button
                    onClick={() => rejectMutation.mutate(req.id)}
                    size="sm"
                    variant="secondary"
                    className="flex-1 sm:flex-initial"
                    disabled={rejectMutation.isPending}
                  >
                    <UserX size={16} className="mr-1" /> Refuser
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Liste d'amis */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card-premium p-6"
      >
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Users size={20} className="text-primary" />
          Mes amis
          <span className="text-sm font-normal text-text-secondary ml-2">
            ({friends.length})
          </span>
        </h2>

        {friendsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Users size={28} className="text-primary opacity-70" />
            </div>
            <p className="text-text-secondary italic">
              Aucun ami pour le moment.
            </p>
            <p className="text-text-secondary text-sm mt-1">
              Utilisez la recherche pour ajouter vos premiers amis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {friends.map((f) => (
              <motion.div
                key={f.id}
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0 overflow-hidden">
                    {f.friend.avatar ? (
                      <img
                        src={f.friend.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      `${f.friend.firstName[0]}${f.friend.lastName[0]}`
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-text font-medium truncate">
                      <UserName
                        userId={f.friend.id}
                        firstName={f.friend.firstName}
                        lastName={f.friend.lastName}
                      />
                    </p>
                    <p className="text-xs text-text-secondary">
                      Ami depuis {new Date(f.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openChatWithFriend(f.friend.id)}
                  className="flex-shrink-0"
                >
                  <MessageCircle size={16} className="mr-1" /> Message
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}