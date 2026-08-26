export function hitungPredikat(nilai: number): {
  predikat: string;
  lulus: boolean;
} {
  if (nilai >= 90) return { predikat: "Mumtaz", lulus: true };
  if (nilai >= 80) return { predikat: "Jayyid Jiddan", lulus: true };
  if (nilai >= KKM) return { predikat: "Jayyid", lulus: true };
  return { predikat: "Rasib", lulus: false };
}

export const KKM = 70;
