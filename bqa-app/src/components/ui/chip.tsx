export function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-card px-4 py-2 text-[12.5px] font-semibold text-muted-foreground shadow-soft">
      <b className="text-[13px] font-extrabold text-ink">{value}</b>
      {label}
    </span>
  );
}
