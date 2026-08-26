"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ExportButton({
  label = "Export",
  message = "Data berhasil diekspor ke berkas",
}: {
  label?: string;
  message?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => toast.success(message)}
    >
      <Download className="size-4" strokeWidth={2} />
      {label}
    </Button>
  );
}
