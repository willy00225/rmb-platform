"use client";
import { Heart, Users, Globe, Leaf } from "lucide-react";

const values = [
  { icon: Heart, title: "Solidarité", desc: "Nous nous soutenons mutuellement." },
  { icon: Users, title: "Unité", desc: "L'union fait notre force." },
  { icon: Globe, title: "Ouverture", desc: "Nous connectons les Bétés du monde." },
  { icon: Leaf, title: "Développement", desc: "Pour l'épanouissement économique." },
];

export function ValuesSection() {
  return (
    <section id="values" className="py-12 md:py-20 bg-bkg dark:bg-bkg overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl md:text-4xl font-display font-bold text-text mb-10 break-words">
          Nos piliers
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {values.map((v) => (
            <div key={v.title} className="flex flex-col items-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <v.icon className="text-primary" size={22} />
              </div>
              <h3 className="text-sm md:text-lg font-bold text-text mb-1 break-words">
                {v.title}
              </h3>
              <p className="text-xs md:text-sm text-text-secondary break-words">
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}