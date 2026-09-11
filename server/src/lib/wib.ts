export interface WibParts {
  date: string;
  time: string;
  day: number;
  timestamp: string;
}

export function wibNow(): Date {
  // Always shift UTC epoch by +7 hours (420 minutes) to get WIB time components using getUTC* methods
  return new Date(Date.now() + 420 * 60_000);
}

export function wibParts(input: Date = wibNow()): WibParts {
  const yyyy = String(input.getUTCFullYear()).padStart(4, "0");
  const mm = String(input.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(input.getUTCDate()).padStart(2, "0");
  const hh = String(input.getUTCHours()).padStart(2, "0");
  const mi = String(input.getUTCMinutes()).padStart(2, "0");
  const ss = String(input.getUTCSeconds()).padStart(2, "0");
  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${mi}`,
    day: input.getUTCDay(),
    timestamp: `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`,
  };
}

export function wibDaysAgo(days: number): string {
  return wibParts(new Date(wibNow().getTime() - days * 86_400_000)).date;
}

export function isWithinWindow(time: string, start: string, end: string): boolean {
  return time >= start && time <= end;
}

export function haversineMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}
