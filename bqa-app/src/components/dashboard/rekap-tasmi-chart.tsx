import { Award } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RekapTasmiChart({
  data = [],
}: {
  data?: Array<{ name: string; count: number }>;
}) {
  const defaultItems = [
    { name: "Mumtaz", count: 0 },
    { name: "Jayyid Jiddan", count: 0 },
    { name: "Jayyid", count: 0 },
    { name: "Rasib", count: 0 },
    { name: "Belum Ujian", count: 0 },
  ];

  const items = data.length > 0 ? data : defaultItems;
  const maxCount = Math.max(...items.map((i) => i.count), 1);

  return (
    <Card className="h-full">
      <CardHeader className="border-b border-line pb-3.5">
        <div className="flex items-center gap-2">
          <Award className="size-4 text-amber-500" />
          <CardTitle className="text-[14.5px] font-bold text-ink">
            Rekap Predikat Tasmi&apos; Akhir
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="py-6">
        <div className="flex items-stretch gap-3">
          {/* Y Axis scale */}
          <div className="flex flex-col justify-between py-1 text-right text-[11px] font-bold text-slate-400 w-4">
            <span>{maxCount}</span>
            <span>{Math.round(maxCount / 2)}</span>
            <span>0</span>
          </div>

          {/* Bars container */}
          <div className="flex-1 flex items-end gap-2.5 h-48 border-b border-l border-slate-200 pl-2 pb-1">
            {items.map((item, idx) => {
              const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              const barColor =
                item.name === "Mumtaz"
                  ? "bg-emerald-500"
                  : item.name === "Jayyid Jiddan"
                  ? "bg-teal-500"
                  : item.name === "Jayyid"
                  ? "bg-blue-500"
                  : item.name === "Rasib"
                  ? "bg-rose-500"
                  : "bg-slate-300";

              return (
                <div
                  key={item.name}
                  className="flex-1 flex flex-col items-center justify-end h-full group"
                >
                  <span className="text-[11px] font-bold text-slate-600 mb-1 opacity-80 group-hover:opacity-100">
                    {item.count}
                  </span>
                  <div
                    className={`w-full max-w-12 rounded-t-md ${barColor} transition-all duration-500 group-hover:brightness-110 shadow-xs`}
                    style={{
                      height: `${Math.max(heightPercent, 3)}%`,
                      animationDelay: `${idx * 80}ms`,
                    }}
                  />
                  <span className="truncate w-full text-center text-[10.5px] font-semibold text-slate-500 mt-2 block" title={item.name}>
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
