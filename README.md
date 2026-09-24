# Miroir

Page plein écran pour miroir connecté (Raspberry Pi 4, écran 1920x1080 en paysage).

- `/mirror` : horloge, météo Paris (Open-Meteo, côté client), séance et agenda du jour.
- `/api/calendar` : lit les .ics iCloud publics et renvoie les événements du jour (Europe/Paris).

## Variables d'environnement

| Nom | Obligatoire | Rôle |
| --- | --- | --- |
| `ICS_URL` | oui | Agenda principal (URL `webcal://` ou `https://`) |
| `ICS_SPORT_URL` | non | Calendrier des séances |

## Développement

```
npm install
ICS_URL=... npm run dev
```

## Limite connue

Les événements récurrents peuvent être décalés d'une heure autour des changements d'heure.
