"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio } from "lucide-react";

export function LiveWidget() {
  const [lives, setLives] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/live/rooms")
      .then(res => res.json())
      .then(setLives);
  }, []);

  if (!lives.length) return null;

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Radio size={20} className="text-red-400 animate-pulse" />
        Lives en direct
      </h2>
      <ul className="space-y-3">
        {lives.map(live => (
          <li key={live.id}>
            <Link href={`/dashboard/live/${live.id}`} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition">
              <div>
                <p className="text-white font-medium text-sm">{live.title}</p>
                <p className="text-xs text-gray-400">{live.host.firstName} {live.host.lastName}</p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">EN DIRECT</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}