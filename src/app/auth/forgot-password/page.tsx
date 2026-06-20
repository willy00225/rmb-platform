"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) setSent(true);
    else toast.error("Erreur.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bkg p-4">
      <div className="max-w-md w-full bg-white dark:bg-surface rounded-3xl p-8 border border-border shadow-2xl">
        <h1 className="text-2xl font-bold text-text text-center mb-4">Mot de passe oublié</h1>
        {sent ? (
          <div className="text-center">
            <p className="text-text-secondary mb-4">Un lien de réinitialisation a été envoyé à {email}.</p>
            <Link href="/auth/login" className="text-primary hover:underline">Retour à la connexion</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border text-text"
            />
            <Button type="submit" variant="primary" size="lg" className="w-full">Envoyer le lien</Button>
          </form>
        )}
      </div>
    </div>
  );
}