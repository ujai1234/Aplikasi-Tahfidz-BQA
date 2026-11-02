/**
 * High-precision Geolocation utilities for Tahfidz App
 */

export interface AccuratePositionOptions {
  /** Target accuracy in meters to immediately accept and resolve (default: 25m) */
  targetAccuracyMeters?: number;
  /** Max time to wait for a better satellite fix before settling with best sample (default: 5000ms) */
  maxWaitMs?: number;
  /** Hard timeout before giving up if no GPS signal in ms (default: 12000ms) */
  timeoutMs?: number;
  /** Callback fired whenever a new satellite sample is received */
  onProgress?: (coords: GeolocationCoordinates, currentAccuracy: number) => void;
}

export function getAccurateCurrentPosition(
  options: AccuratePositionOptions = {}
): Promise<GeolocationCoordinates> {
  const targetAccuracy = options.targetAccuracyMeters ?? 25;
  const maxWaitMs = options.maxWaitMs ?? 5000;
  const timeoutMs = options.timeoutMs ?? 12000;
  const onProgress = options.onProgress;

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator || !navigator.geolocation) {
      reject(new Error("Browser atau perangkat tidak mendukung Geolocation GPS."));
      return;
    }

    let bestCoords: GeolocationCoordinates | null = null;
    let watchId: number | null = null;
    let isSettled = false;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let hardTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (settleTimer) {
        clearTimeout(settleTimer);
        settleTimer = null;
      }
      if (hardTimeoutTimer) {
        clearTimeout(hardTimeoutTimer);
        hardTimeoutTimer = null;
      }
    };

    const finishSuccess = (coords: GeolocationCoordinates) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      resolve(coords);
    };

    const finishError = (error: unknown) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      reject(error);
    };

    hardTimeoutTimer = setTimeout(() => {
      if (bestCoords) {
        finishSuccess(bestCoords);
      } else {
        finishError(new Error("Waktu permintaan lokasi habis. Pastikan GPS HP aktif & berada di area terbuka."));
      }
    }, timeoutMs);

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = pos.coords;
          const accuracy = coords.accuracy ?? 999;

          if (onProgress) {
            onProgress(coords, accuracy);
          }

          if (!bestCoords || accuracy < (bestCoords.accuracy ?? 999)) {
            bestCoords = coords;
          }

          if (accuracy <= targetAccuracy) {
            finishSuccess(coords);
            return;
          }

          if (!settleTimer) {
            settleTimer = setTimeout(() => {
              if (bestCoords) {
                finishSuccess(bestCoords);
              }
            }, maxWaitMs);
          }
        },
        () => {
          if (bestCoords) {
            finishSuccess(bestCoords);
          } else {
            navigator.geolocation.getCurrentPosition(
              (pos) => finishSuccess(pos.coords),
              (fallbackErr) => {
                let msg = "Gagal membaca lokasi GPS. Pastikan GPS aktif.";
                if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
                  msg = "Izin lokasi ditolak. Silakan izinkan akses lokasi (pilih Akurat/Tepat) pada browser Anda.";
                } else if (fallbackErr.code === fallbackErr.TIMEOUT) {
                  msg = "Waktu permintaan lokasi habis. Silakan muat ulang sinyal GPS.";
                }
                finishError(new Error(msg));
              },
              { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 0,
        }
      );
    } catch {
      navigator.geolocation.getCurrentPosition(
        (pos) => finishSuccess(pos.coords),
        (err) => finishError(err),
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
      );
    }
  });
}

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
