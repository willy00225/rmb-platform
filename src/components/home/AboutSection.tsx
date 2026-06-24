"use client";
import { motion } from "framer-motion";

export function AboutSection() {
  return (
    <section id="about" className="py-12 md:py-20 bg-surface dark:bg-surface overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-display font-bold text-text break-words">
            Qui sommes-nous ?
          </h2>
          <p className="mt-4 text-sm md:text-base text-text-secondary max-w-3xl mx-auto break-words">
            Le Réseau Mondial des Bhétés est une association apolitique à but non lucratif qui rassemble
            les filles et fils Bhétés du monde entier autour de valeurs de solidarité, de développement
            et de préservation culturelle.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: "Notre mission", text: "Créer un espace d'échange, d'entraide et de promotion de la culture Bhété." },
            { title: "Notre vision", text: "Devenir le carrefour incontournable de la diaspora Bhété." },
            { title: "Nos valeurs", text: "Unité, Respect, Solidarité, Excellence, Transmission." },
          ].map((item) => (
            <div key={item.title} className="bg-white dark:bg-bkg rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="text-lg font-bold text-text mb-2 break-words">{item.title}</h3>
              <p className="text-sm text-text-secondary break-words">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
