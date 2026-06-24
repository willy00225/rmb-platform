"use client";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export function PreferencesSection() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="rounded-[var(--radius-card)] bg-white dark:bg-surface border border-border p-6">
      <h2 className="text-xl font-semibold text-text mb-4">Préférences</h2>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isDark ? (
            <Moon size={20} className="text-primary" />
          ) : (
            <Sun size={20} className="text-secondary" />
          )}
          <div>
            <p className="text-text font-medium">Mode sombre</p>
            <p className="text-sm text-text-secondary">
              Activez le thème sombre pour plus de confort visuel.
            </p>
          </div>
        </div>

        {/* Toggle intégré directement */}
        <button
          onClick={toggleTheme}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
            isDark ? "bg-primary" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transform transition-transform duration-300 ${
              isDark ? "translate-x-7" : "translate-x-1"
            }`}
          >
            {isDark ? (
              <Moon size={14} className="text-primary" />
            ) : (
              <Sun size={14} className="text-secondary" />
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
