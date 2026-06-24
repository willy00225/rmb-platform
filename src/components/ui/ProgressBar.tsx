export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-brand-500 to-amber-500 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
