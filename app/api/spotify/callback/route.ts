// Échange le code d'autorisation contre un refresh token, à copier dans SPOTIFY_REFRESH_TOKEN.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return new Response(`Autorisation refusée : ${url.searchParams.get("error")}`, { status: 400 });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: `${url.origin}/api/spotify/callback` }),
  });
  const data = await res.json();
  if (!res.ok) return new Response(`Erreur Spotify : ${JSON.stringify(data)}`, { status: 502 });

  return new Response(
    `Copie cette valeur dans la variable Vercel SPOTIFY_REFRESH_TOKEN, puis redéploie :\n\n${data.refresh_token}\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } },
  );
}
