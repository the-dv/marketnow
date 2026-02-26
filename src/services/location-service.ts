import type { RegionContext } from "@/types/domain";

type Coordinates = {
  lat: number;
  lng: number;
};

const UF_TO_MACRO_REGION: Record<string, RegionContext["macroRegion"]> = {
  AC: "N",
  AL: "NE",
  AP: "N",
  AM: "N",
  BA: "NE",
  CE: "NE",
  DF: "CO",
  ES: "SE",
  GO: "CO",
  MA: "NE",
  MT: "CO",
  MS: "CO",
  MG: "SE",
  PA: "N",
  PB: "NE",
  PR: "S",
  PE: "NE",
  PI: "NE",
  RJ: "SE",
  RN: "NE",
  RS: "S",
  RO: "N",
  RR: "N",
  SC: "S",
  SP: "SE",
  SE: "NE",
  TO: "N",
};

export async function getCurrentPosition(): Promise<Coordinates> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    throw new Error("LOCATION_UNAVAILABLE");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => reject(new Error("LOCATION_DENIED")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

export function mapUfToMacroRegion(uf?: string): RegionContext["macroRegion"] {
  if (!uf) return undefined;

  return UF_TO_MACRO_REGION[uf.toUpperCase()];
}

// MVP placeholder. A reverse geocoding provider will be connected in the next step.
export async function resolveRegionFromCoords(
  _lat: number,
  _lng: number,
): Promise<RegionContext> {
  void _lat;
  void _lng;
  return { country: "BR" };
}
