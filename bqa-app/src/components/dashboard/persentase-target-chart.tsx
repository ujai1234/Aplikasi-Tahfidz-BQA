import { Globe } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PersentaseTargetChart({
  data = [],
}: {
  data?: Array<{ name: string; count: number; percent: number; color: string }>;
}) {
  const defaultItems = [
    { name: "Tuntas Target", count: 0, percent: 0, color: "#10b981" },
    { name: "Sedang Process", count: 0, percent: 0, color: "#f59e0b" },
    { name: "Recovery", count: 0, percent: 0, color: "#ef4444" },
  ];

  const items = data.length > 0 ? data : defaultItems;
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="h-full">
      <CardHeader className="border-b border-line pb-3.5">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-emerald-600" />
          <CardTitle className="text-[14.5px] font-bold text-ink">
            Persentase Capaian Target Santri
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col justify-between py-6">
        <div className="space-y-6">
          {/* Progress Stack Bar */}
          <div className="space-y-2">
            <div className="flex h-7 w-full overflow-hidden rounded-xl bg-slate-100 p-1 shadow-inner">
              {items.map((item) => {
                const widthPct = total > 0 ? Math.max((item.count / total) * 100, item.count > 0 ? 5 : 0) : 0;
                return (
                  <div
                    key={item.name}
                    className="h-full transition-all duration-500 first:rounded-l-lg last:rounded-r-lg"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: item.color,
                    }}
                    title={`${item.name}: ${item.count} (${item.percent}%)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-3 gap-3">
            {items.map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-line bg-[#fbfdfc] p-3 text-center transition-all hover:bg-white hover:shadow-sm"
              >
                <span
                  className="inline-block size-2.5 rounded-full mb-1"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-xs font-semibold text-muted-foreground">{item.name}</p>
                <p className="text-lg font-extrabold text-ink">{item.count}</p>
                <p className="text-[11px] font-medium" style={{ color: item.color }}>
                  {item.percent}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 pt-3 border-t border-slate-100 text-xs font-semibold text-muted-foreground">
          {items.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="size-3 rounded-xs" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
