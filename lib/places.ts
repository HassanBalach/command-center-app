export type Lead = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  score: number;
};

type Place = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
};

// Higher = better lead: busy, well-rated business with a weak web presence.
// Businesses with almost no reviews are probably tiny or inactive, so they are capped.
function score(p: Place): number {
  const reviews = p.userRatingCount ?? 0;
  let s = 0;
  if (!p.websiteUri) s += 50;
  s += Math.round(((p.rating ?? 0) / 5) * 20);
  s += Math.min(30, Math.round(Math.log10(reviews + 1) * 10));
  if (reviews < 20) s = Math.min(s, 30);
  return Math.min(100, s);
}

export type Bias = { lat: number; lng: number; radiusM: number };

export async function searchPlaces(query: string, bias?: Bias): Promise<Lead[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY is not set");

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount",
    },
    body: JSON.stringify({
      textQuery: query,
      pageSize: 20,
      ...(bias && {
        locationBias: {
          circle: {
            center: { latitude: bias.lat, longitude: bias.lng },
            radius: Math.min(50000, Math.max(500, bias.radiusM)),
          },
        },
      }),
    }),
  });
  if (!res.ok) throw new Error(`Places API ${res.status}`);

  const data = (await res.json()) as { places?: Place[] };
  return (data.places ?? [])
    .map((p) => ({
      id: p.id,
      name: p.displayName?.text ?? "Unknown",
      address: p.formattedAddress ?? "",
      phone: p.internationalPhoneNumber ?? p.nationalPhoneNumber,
      website: p.websiteUri,
      rating: p.rating,
      reviews: p.userRatingCount,
      score: score(p),
    }))
    .sort((a, b) => b.score - a.score);
}

export async function geocode(address: string) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY is not set");
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.formattedAddress,places.location",
    },
    body: JSON.stringify({ textQuery: address, pageSize: 1 }),
  });
  if (!res.ok) throw new Error(`Places API ${res.status}`);
  const data = (await res.json()) as {
    places?: { formattedAddress?: string; location?: { latitude: number; longitude: number } }[];
  };
  const p = data.places?.[0];
  if (!p?.location) return null;
  return { label: p.formattedAddress ?? address, lat: p.location.latitude, lng: p.location.longitude };
}
