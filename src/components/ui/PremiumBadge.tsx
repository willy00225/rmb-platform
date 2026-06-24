export function PremiumBadge({ isPremium }: { isPremium: boolean }) {
  if (!isPremium) return null;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ml-1 flex-shrink-0"
    >
      {/* Fond bleu du cercle (intérieur plein) */}
      <circle cx="8" cy="8" r="6.5" fill="#2563eb" />

      {/* Bordure dentelée : un trait pointillé épais qui entoure le cercle */}
      <circle
        cx="8"
        cy="8"
        r="7.5"
        stroke="#2563eb"
        strokeWidth="1.5"
        strokeDasharray="2.5 2.5"
        fill="none"
      />

      {/* Coche blanche au centre */}
      <path
        d="M5 8l2 2 4-4"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}