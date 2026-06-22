"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation simple pour activer le bouton
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = emailValid && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Veuillez entrer un email valide et un mot de passe.");
      return;
    }
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      toast.error("Email ou mot de passe incorrect.");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bkg p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        {/* Logo + titre */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <img
              src="/images/logo-rmb.png"
              alt="RMB"
              className="h-16 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-display font-bold text-primary">
            Connectez-vous
          </h1>
          <p className="text-text-secondary mt-1">
            Rejoignez le réseau mondial des Bétés
          </p>
        </div>

        <div className="card-premium p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                placeholder="vous@exemple.com"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-border dark:border-white/10 text-text placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={loading}
              disabled={!canSubmit}
            >
              <LogIn size={18} />
              Se connecter
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary">
            Pas encore membre ?{" "}
            <Link
              href="/auth/register"
              className="text-secondary hover:text-secondary-hover font-medium"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}