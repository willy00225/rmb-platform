"use client";

export const dynamic = 'force-dynamic'; // Désactive le prérendu

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Loader2, UserPlus, UserCheck, Search } from "lucide-react";
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
  };
}

interface Friend {
  id: string;
  createdAt: string;
  friend: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function FriendsPage() {
  const { data: session } = useSession();
  const { openChatWithFriend } = useChat();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);

  // Amis acceptés
  const { data: friends = [], isLoading: friendsLoading } = useQuery<Friend[]>({
    queryKey: ["friends", "accepted"],
    queryFn: () => fetch("/api/friends?status=ACCEPTED").then(res => res.json()),
  });

  // Demandes en attente
  const { data: pendingRequests = [] } = useQuery<FriendRequest[]>({
    queryKey: ["friends", "pending"],
    queryFn: () => fetch("/api/friends?status=PENDING").then(res => res.json()),
  });

  // Recherche
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
    if (res.ok) setSearchResults(await res.json());
  };

  // Ajouter un ami
  const addFriendMutation = useMutation({
    mutationFn: (userId: string) =>
      fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresseeId: userId }),
      }).then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.error || "Erreur"); });
        return res.json();
      }),
    onSuccess: () => toast.success("Invitation envoyée"),
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
      toast.success("Ami ajouté");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: () => toast.error("Erreur"),
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
    onError: () => toast.error("Erreur"),
  });

  return (
    <div className="space-y-8 pb-24 md:pb-0">
      <h1 className="text-3xl font-display font-bold text-white">Amis & Contacts</h1>

      {/* Recherche de membres */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg">
        <h2 className="text-lg font-semibold text-white mb-4">Rechercher un membre</h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
          />
          <Button onClick={handleSearch} variant="primary" className="w-full sm:w-auto">
            <Search size={18} /> Rechercher
          </Button>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-3">
            {searchResults.map((user) => (
              <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-white/5 gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      <UserName userId={user.id} firstName={user.firstName} lastName={user.lastName} />
                    </p>
                    <p className="text-sm text-gray-400 truncate max-w-[150px] sm:max-w-none">{user.email}</p>
                  </div>
                </div>
                <Button
                  onClick={() => addFriendMutation.mutate(user.id)}
                  size="sm"
                  variant="primary"
                  className="w-full sm:w-auto"
                  disabled={addFriendMutation.isPending}
                >
                  <UserPlus size={16} /> Ajouter
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demandes en attente */}
      {pendingRequests.length > 0 && (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg">
          <h2 className="text-lg font-semibold text-white mb-4">Invitations en attente</h2>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-white/5 gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                    {req.friend.firstName[0]}{req.friend.lastName[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      <UserName userId={req.friend.id} firstName={req.friend.firstName} lastName={req.friend.lastName} />
                    </p>
                    <p className="text-sm text-gray-400">Souhaite devenir ami</p>
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
                    <UserCheck size={16} /> Accepter
                  </Button>
                  <Button
                    onClick={() => rejectMutation.mutate(req.id)}
                    size="sm"
                    variant="secondary"
                    className="flex-1 sm:flex-initial"
                    disabled={rejectMutation.isPending}
                  >
                    Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste d'amis */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg">
        <h2 className="text-lg font-semibold text-white mb-4">Mes amis ({friends.length})</h2>
        {friendsLoading ? (
          <Loader2 className="animate-spin text-brand-500 mx-auto" size={24} />
        ) : friends.length === 0 ? (
          <p className="text-gray-500 italic">Aucun ami pour le moment. Recherchez des membres et ajoutez-les.</p>
        ) : (
          <div className="space-y-3">
            {friends.map((f) => (
              <div key={f.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-white/5 gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                    {f.friend.firstName[0]}{f.friend.lastName[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      <UserName userId={f.friend.id} firstName={f.friend.firstName} lastName={f.friend.lastName} />
                    </p>
                    <p className="text-sm text-gray-400">Ami depuis {new Date(f.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => openChatWithFriend(f.friend.id)} className="w-full sm:w-auto">
                  💬 Message
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}