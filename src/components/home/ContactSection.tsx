"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import { ContactInfo } from "./ContactInfo";

export function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });
    if (res.ok) {
      toast.success("Message envoyé !");
      setName("");
      setEmail("");
      setMessage("");
    } else {
      toast.error("Erreur lors de l'envoi.");
    }
    setLoading(false);
  };

  return (
    <section id="contact" className="py-12 md:py-20 bg-bkg dark:bg-bkg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl md:text-4xl font-display font-bold text-text text-center mb-10">Contactez-nous</h2>
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto">
          <ContactInfo />
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Votre nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-surface border border-border text-text placeholder-text-secondary text-sm"
            />
            <input
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-surface border border-border text-text placeholder-text-secondary text-sm"
            />
            <textarea
              placeholder="Votre message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-surface border border-border text-text placeholder-text-secondary text-sm"
            />
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer"} <Send size={16} className="ml-2" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}