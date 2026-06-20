"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [expired, setExpired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) {
      setDone(true);
      toast.success("Mot de passe changé !");
    } else {
      const err = await res.json();
      if (err.error?.includes("expiré")) setExpired(true);
      toast.error(err.error || "Erreur");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bkg p-4">
      <div className="max-w-md w-full bg-white dark:bg-surface rounded-3xl p-8 border border-border shadow-2xl">
        {done ? (
          <div className="text-center">
            <p className="text-primary font-bold text-lg mb-2">Mot de passe changé !</p>
            <p className="text-text-secondary mb-4">Vous pouvez maintenant vous connecter.</p>
            <Button onClick={() => router.push("/auth/login")} variant="primary">Se connecter</Button>
          </div>
        ) : expired ? (
          <div className="text-center">
            <p className="text-red-500 mb-4">Le lien a expiré.</p>
            <Button onClick={() => router.push("/auth/forgot-password")} variant="secondary">Redemander un lien</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="text-2xl font-bold text-text text-center">Nouveau mot de passe</h1>
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border text-text"
            />
            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading}>
              Changer le mot de passe
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}