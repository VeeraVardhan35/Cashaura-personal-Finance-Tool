type TotalBarProps = {
  total: string;
  count: number;
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function TotalBar({ total, count }: TotalBarProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 border-[1.5px] border-ink bg-[#fafaf8] px-6 py-5 sm:flex-row sm:items-end">
      <div>
        <div className="text-[10px] uppercase tracking-[0.4em] text-[#7a7870]">Total Visible</div>
        <div className="font-display text-[32px] tracking-[0.08em] text-ink">
          &#8377;{currencyFormatter.format(Number(total))}
        </div>
      </div>
      <div className="text-[11px] tracking-[0.08em] text-[#7a7870]">
        {count} {count === 1 ? "entry" : "entries"}
      </div>
    </div>
  );
}
