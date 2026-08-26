import { LinkMore } from "@/components/ui/link-more";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CapaianChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="border-b border-line pb-4">
        <CardTitle>Persentase Capaian per Halqah</CardTitle>
        <CardDescription>Persentase tuntas 7 hari terakhir</CardDescription>
        <CardAction>
          <LinkMore href="/laporan">Lihat detail</LinkMore>
        </CardAction>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Belum ada data capaian pada 7 hari terakhir
          </p>
        ) : (
          <div
            role="img"
            aria-label="Diagram batang capaian hafalan per halqah"
            className="flex items-stretch gap-4"
          >
            {data.map((halqah, index) => (
              <div
                key={halqah.name}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <div className="flex h-48 w-full flex-col items-center justify-end">
                  <span className="mb-1.5 text-xs font-extrabold text-primary-dark">
                    {halqah.value}%
                  </span>
                  <div
                    className="w-full max-w-10 origin-bottom animate-grow-bar rounded-b-sm rounded-t-lg bg-gradient-to-b from-[#27ab7d] to-primary shadow-[inset_0_-3px_0_rgba(0,0,0,0.08)]"
                    style={{
                      height: `${Math.max(halqah.value, 2)}%`,
                      animationDelay: `${index * 70}ms`,
                    }}
                  />
                </div>
                <span className="max-w-full truncate text-xs font-semibold text-muted-foreground">
                  {halqah.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
