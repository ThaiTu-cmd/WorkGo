import * as Location from 'expo-location';

import type { EvidenceBody } from '@/api/evidenceApi';
import type { EvidencePhase } from '@/api/types';

type Coords = { latitude: number; longitude: number };

// Coordinates are optional evidence: a refused permission, an error or a slow
// fix never blocks the upload.
export async function getLocationOrNull(timeoutMs = 5000): Promise<Coords | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
    const position = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(
      (p) => ({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => null
    );
    return await Promise.race([position, timeout]);
  } catch {
    return null;
  }
}

export function buildEvidenceBody(phase: EvidencePhase, fileId: string, capturedAt: string, location: Coords | null): EvidenceBody {
  return {
    phase,
    fileId,
    capturedAt,
    ...(location ? { latitude: location.latitude, longitude: location.longitude } : {}),
  };
}
