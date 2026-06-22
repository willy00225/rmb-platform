"use client";
import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";

export function DocumentsSection() {
  return (
    <section id="documents" className="py-12 md:py-20 bg-surface dark:bg-surface overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl md:text-4xl font-display font-bold text-text mb-4 break-words">
          Règlements & Statuts
        </h2>
        <p className="text-sm md:text-base text-text-secondary mb-10 break-words">
          Consultez ou téléchargez les documents officiels.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-8">
          {[
            { name: "Statuts", file: "/documents/Statuts_RMB.pdf" },
            { name: "Règlement intérieur", file: "/documents/Reglement_RMB.pdf" },
          ].map((doc) => (
            <a
              key={doc.name}
              href={doc.file}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center p-6 bg-white dark:bg-bkg rounded-2xl border border-border shadow-sm hover:shadow-md transition"
            >
              <FileText size={32} className="text-primary mb-3" />
              <h3 className="text-base font-semibold text-text break-words">{doc.name}</h3>
              <Download size={18} className="mt-3 text-text-secondary" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}