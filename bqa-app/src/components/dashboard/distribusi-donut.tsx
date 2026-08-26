import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const COLORS = ["#0e7c5a", "#2aa876", "#e9b949", "#3b82f6", "#8b5cf6", "#e05252"];

export function DistribusiDonut({
  data,
}: {
  data: Array<{ name: string; total: number; percent: number }>;
}) {
  const colored = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));
  const totalSantri = colored.reduce((sum, item) => sum + item.total, 0);
  const gradient = `conic-gradient(${colored
    .map((item) => `${item.color} 0 ${item.percent}%`)
    .join(", ")})`;

  return (
    <Card className="h-full">
      <CardHeader className="border-b border-line pb-4">
        <CardTitle>Distribusi Santri per Halqah</CardTitle>
        <CardDescription>Total {totalSantri} santri aktif</CardDescription>
      </CardHeader>
      <CardContent>
        {colored.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Belum ada santri aktif
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div
              role="img"
              aria-label="Diagram lingkaran distribusi santri per halqah"
              className="relative size-44 animate-spin-in rounded-full shadow-soft sm:size-[185px]"
              style={{ background: gradient }}
            >
              <div className="absolute inset-[21%] rounded-full bg-card shadow-[inset_0_2px_6px_rgba(0,0,0,0.04)]" />
              <div className="absolute inset-0 grid place-content-center text-center">
                <p className="font-display text-2xl font-extrabold">{totalSantri}</p>
                <p className="text-[11.5px] text-muted-foreground">Santri</p>
              </div>
            </div>
            <ul className="min-w-44 flex-1 space-y-2 text-[13px]">
              {colored.map((item) => (
                <li key={item.name} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="size-2.5 rounded"
                    style={{ background: item.color }}
                  />
                  {item.name}
                  <b className="ml-auto font-bold">{item.total}</b>
                  <small className="w-9 text-right text-muted-foreground">{item.percent}%</small>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
