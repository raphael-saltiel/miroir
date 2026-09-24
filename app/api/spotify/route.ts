export const dynamic = "force-dynamic";

type Image = { url: string; width: number };

// Jeton d'accès gardé en mémoire tant que l'instance serveur vit, pour ne pas le renouveler à chaque appel.
let access: { token: string; expires: number } | null = null;

async function accessToken() {
  if (access && access.expires > Date.now()) return access.token;
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) throw new Error("Variables SPOTIFY_* manquantes");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: SPOTIFY_REFRESH_TOKEN }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Token Spotify ${res.status}`);
  const data = await res.json();
  access = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return access.token;
}

export async function GET() {
  try {
    const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${await accessToken()}` },
      cache: "no-store",
    });
    if (res.status === 204) return Response.json({ playing: false });
    if (!res.ok) throw new Error(`Spotify ${res.status}`);

    const data = await res.json();
    const track = data.item;
    if (!data.is_playing || !track || data.currently_playing_type !== "track") return Response.json({ playing: false });

    const images: Image[] = track.album.images;
    return Response.json({
      playing: true,
      title: track.name,
      artist: track.artists.map((a: { name: string }) => a.name).join(", "),
      image: (images.find((i) => i.width <= 300) ?? images[0])?.url ?? null,
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
