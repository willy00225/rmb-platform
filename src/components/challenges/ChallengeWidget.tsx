"use client";
import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar"; // nous allons le créer
import { Trophy } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  goalType: string;
  goalValue: number;
  currentValue: number;
  endDate: string;
}

export function ChallengeWidget() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    fetch("/api/challenges")
      .then(res => res.json())
      .then(setChallenges);
  }, []);

  if (!challenges.length) return null;

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-lg">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Trophy size={20} className="text-yellow-400" />
        Défis en cours
      </h2>
      <div className="space-y-4">
        {challenges.map(challenge => {
          const progress = Math.min(100, (challenge.currentValue / challenge.goalValue) * 100);
          return (
            <div key={challenge.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">{challenge.title}</span>
                <span className="text-gray-400">
                  {challenge.currentValue}/{challenge.goalValue}
                </span>
              </div>
              <ProgressBar value={progress} />
              <p className="text-xs text-gray-500 mt-1">
                Jusqu'au {new Date(challenge.endDate).toLocaleDateString("fr-FR")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}