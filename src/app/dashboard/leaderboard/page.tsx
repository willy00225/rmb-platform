"use client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Medal } from "lucide-react";

export default function LeaderboardPage() {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetch("/api/leaderboard").then(res => res.json()),
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-text">Classement</h1>
      {isLoading ? (
        <Loader2 className="animate-spin text-primary mx-auto mt-10" size={32} />
      ) : (
        <div className="rounded-2xl bg-white border border-border overflow-hidden">
          {members.map((m: any, idx: number) => (
            <div key={m.id} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
              <span className="text-2xl font-bold text-primary w-8">
                {idx + 1 <= 3 ? (
                  <Medal
                    size={24}
                    className={
                      idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : "text-amber-600"
                    }
                  />
                ) : (
                  idx + 1
                )}
              </span>
              <div className="flex-1">
                <p className="text-text font-medium">{m.firstName} {m.lastName}</p>
                <p className="text-sm text-text-secondary">Niv. {m.level} · {m.xp} XP</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}