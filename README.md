# Miroir

Page plein écran pour miroir connecté (Raspberry Pi 4, écran 1920x1080 en paysage).

- `/mirror` : horloge, météo Paris (Open-Meteo, côté client), séance et agenda du jour.
- `/api/calendar` : lit les .ics iCloud publics et renvoie les événements du jour (Europe/Paris).
- `/api/spotify` : morceau en cours de lecture sur Spotify, affiché sous la météo.

## Variables d'environnement

| Nom | Obligatoire | Rôle |
| --- | --- | --- |
| `ICS_URL` | oui | Agenda principal (URL `webcal://` ou `https://`) |
| `ICS_SPORT_URL` | non | Calendrier des séances |
| `SPOTIFY_CLIENT_ID` | non | App créée sur developer.spotify.com |
| `SPOTIFY_CLIENT_SECRET` | non | Idem |
| `SPOTIFY_REFRESH_TOKEN` | non | Obtenu une fois via `/api/spotify/login` |

Pour Spotify, déclarer `https://<domaine>/api/spotify/callback` comme Redirect URI de l'app.

## Développement

```
npm install
ICS_URL=... npm run dev
```

## Limite connue

Les événements récurrents peuvent être décalés d'une heure autour des changements d'heure.
