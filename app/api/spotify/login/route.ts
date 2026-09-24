// Étape unique : redirige vers Spotify pour autoriser la lecture du morceau en cours.
export function GET(request: Request) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) return new Response("SPOTIFY_CLIENT_ID manquante", { status: 500 });
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "user-read-currently-playing",
    redirect_uri: `${new URL(request.url).origin}/api/spotify/callback`,
  });
  return Response.redirect(`https://accounts.spotify.com/authorize?${params}`);
}
