"use client";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
        isDark ? "bg-primary" : "bg-gray-300"
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 30 }}
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md ${
          isDark ? "ml-7" : "ml-1"
        }`}
      >
        {isDark ? <Moon size={14} className="text-primary" /> : <Sun size={14} className="text-secondary" />}
      </motion.span>
    </button>
  );
}