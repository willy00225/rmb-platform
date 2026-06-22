"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative w-full pt-16 pb-20 md:pt-32 md:pb-40 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-text leading-tight break-words">
            Bienvenue sur le <span className="text-primary">Réseau Mondial</span> des{" "}
            <span className="text-secondary">Bétés</span>
          </h1>
          <p className="mt-4 md:mt-6 text-sm sm:text-base md:text-xl text-text-secondary max-w-3xl mx-auto">
            Unis par nos racines, engagés pour notre avenir.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/auth/register">
              <Button variant="primary" size="lg" className="text-base px-8 py-4 w-full sm:w-auto">
                Rejoindre le réseau <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
            <Link href="#about">
              <Button variant="ghost" size="lg" className="text-base px-8 py-4 w-full sm:w-auto">
                En savoir plus
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}