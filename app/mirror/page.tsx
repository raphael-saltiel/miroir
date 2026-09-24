"use client";

import { useEffect, useState } from "react";

const TZ = "Europe/Paris";
const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522" +
  "&current=temperature_2m,weather_code" +
  "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
  "&timezone=Europe%2FParis&forecast_days=1";

type CalendarEvent = { title: string; start: string; end: string; allDay: boolean };
type Calendar = { agenda: CalendarEvent[]; sport: CalendarEvent[] };
type Track = { playing: boolean; title?: string; artist?: string; image?: string | null };
type Weather = { temp: number; code: number; max: number; min: number; rain: number };

const CLOUD_TOP = "M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2";
const SUN_RAYS = ["M12 2v2", "M12 20v2", "m4.9 4.9 1.4 1.4", "m17.7 17.7 1.4 1.4", "M2 12h2", "M20 12h2", "m6.3 17.7-1.4 1.4", "m19.1 4.9-1.4 1.4"];

// Pictos en trait blanc, par groupe de codes WMO renvoyés par Open-Meteo.
const WEATHER: { codes: number[]; label: string; paths: string[]; sun?: boolean }[] = [
  { codes: [0], label: "Ciel dégagé", paths: SUN_RAYS, sun: true },
  {
    codes: [1, 2],
    label: "Peu nuageux",
    paths: ["M12 2v2", "m4.9 4.9 1.4 1.4", "M20 12h2", "m19.1 4.9-1.4 1.4", "M15.9 12.7a4 4 0 0 0-5.9-4.1", "M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"],
  },
  { codes: [3], label: "Couvert", paths: ["M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z"] },
  { codes: [45, 48], label: "Brouillard", paths: [CLOUD_TOP, "M16 17H7", "M17 21H9"] },
  { codes: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82], label: "Pluie", paths: [CLOUD_TOP, "M16 14v6", "M8 14v6", "M12 16v6"] },
  { codes: [71, 73, 75, 77, 85, 86], label: "Neige", paths: [CLOUD_TOP, "M8 15h.01", "M8 19h.01", "M12 17h.01", "M12 21h.01", "M16 15h.01", "M16 19h.01"] },
  { codes: [95, 96, 99], label: "Orage", paths: [CLOUD_TOP, "m13 12-3 5h4l-3 5"] },
];

function WeatherIcon({ code }: { code: number }) {
  const w = WEATHER.find((x) => x.codes.includes(code));
  if (!w) return null;
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {w.sun && <circle cx="12" cy="12" r="4" />}
      {w.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

const fmt = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, ...options }).format(date);

const hour = (iso: string) => fmt(new Date(iso), { hour: "2-digit", minute: "2-digit" });

function useInterval(callback: () => void, ms: number) {
  useEffect(() => {
    callback();
    const id = setInterval(callback, ms);
    return () => clearInterval(id);
  }, [ms]);
}

function EventList({ events, empty, now }: { events: CalendarEvent[]; empty: string; now: Date }) {
  if (events.length === 0) return <p className="empty">{empty}</p>;
  return (
    <ul className="events">
      {events.map((e, i) => (
        <li key={i} className={!e.allDay && new Date(e.end) < now ? "past" : undefined}>
          <span className="time">{e.allDay ? "Journée" : hour(e.start)}</span>
          <span className="title">{e.title}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Mirror() {
  const [now, setNow] = useState<Date | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [calendarError, setCalendarError] = useState(false);
  const [track, setTrack] = useState<Track | null>(null);

  useInterval(() => setNow(new Date()), 1000);

  useInterval(() => {
    fetch(WEATHER_URL)
      .then((r) => r.json())
      .then((d) =>
        setWeather({
          temp: d.current.temperature_2m,
          code: d.current.weather_code,
          max: d.daily.temperature_2m_max[0],
          min: d.daily.temperature_2m_min[0],
          rain: d.daily.precipitation_probability_max[0],
        }),
      )
      .catch(() => {});
  }, 15 * 60 * 1000);

  useInterval(() => {
    fetch("/api/calendar", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Calendar) => {
        setCalendar(d);
        setCalendarError(false);
      })
      .catch(() => setCalendarError(true));
  }, 5 * 60 * 1000);

  useInterval(() => {
    fetch("/api/spotify", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setTrack)
      .catch(() => setTrack(null));
  }, 15 * 1000);

  // Rechargement complet chaque jour à 4h du matin (heure locale du Pi).
  useEffect(() => {
    const next = new Date();
    next.setHours(4, 0, 0, 0);
    if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
    const id = setTimeout(() => location.reload(), next.getTime() - Date.now());
    return () => clearTimeout(id);
  }, []);

  if (!now) return null;

  return (
    <main className="mirror">
      <section className="left">
        <div className="clock">{fmt(now, { hour: "2-digit", minute: "2-digit" })}</div>
        <div className="date">{fmt(now, { weekday: "long", day: "numeric", month: "long" })}</div>
        {weather && (
          <div className="weather">
            <WeatherIcon code={weather.code} />
            <div className="temp">{Math.round(weather.temp)}°</div>
            <div className="range">
              <div>
                {Math.round(weather.min)}° / {Math.round(weather.max)}°
              </div>
              <div>pluie {weather.rain}%</div>
            </div>
          </div>
        )}
        {track?.playing && (
          <div className="track">
            {track.image && <img src={track.image} alt="" />}
            <div>
              <div className="track-title">{track.title}</div>
              <div className="track-artist">{track.artist}</div>
            </div>
          </div>
        )}
      </section>

      <section className="right">
        <div className="block sport">
          <h2>Séance</h2>
          {calendar && <EventList events={calendar.sport} empty="Repos" now={now} />}
        </div>
        <div className="block">
          <h2>Agenda</h2>
          {calendarError && !calendar && <p className="empty">Agenda indisponible</p>}
          {calendar && <EventList events={calendar.agenda} empty="Rien de prévu" now={now} />}
        </div>
      </section>
    </main>
  );
}
