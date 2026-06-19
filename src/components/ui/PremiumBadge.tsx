import { CheckCircle } from "lucide-react";

export function PremiumBadge({ isPremium }: { isPremium: boolean }) {
  if (!isPremium) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full ml-1 font-medium">
      <CheckCircle size={12} className="text-blue-600" />
      Premium
    </span>
  );
}