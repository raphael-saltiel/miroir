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
type Weather = { temp: number; code: number; max: number; min: number; rain: number };

const WEATHER_LABELS: [number[], string][] = [
  [[0], "Ciel dégagé"],
  [[1, 2], "Peu nuageux"],
  [[3], "Couvert"],
  [[45, 48], "Brouillard"],
  [[51, 53, 55, 56, 57], "Bruine"],
  [[61, 63, 65, 66, 67, 80, 81, 82], "Pluie"],
  [[71, 73, 75, 77, 85, 86], "Neige"],
  [[95, 96, 99], "Orage"],
];

const weatherLabel = (code: number) => WEATHER_LABELS.find(([codes]) => codes.includes(code))?.[1] ?? "";

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

function EventList({ events, empty }: { events: CalendarEvent[]; empty: string }) {
  if (events.length === 0) return <p className="muted">{empty}</p>;
  return (
    <ul className="events">
      {events.map((e, i) => (
        <li key={i}>
          <span className="time">{e.allDay ? "Journée" : `${hour(e.start)} - ${hour(e.end)}`}</span>
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
            <div className="temp">{Math.round(weather.temp)}°</div>
            <div>
              <div>{weatherLabel(weather.code)}</div>
              <div className="muted">
                {Math.round(weather.min)}° / {Math.round(weather.max)}° · pluie {weather.rain}%
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="right">
        <h2>Séance du jour</h2>
        {calendar && <EventList events={calendar.sport} empty="Repos" />}
        <h2>Agenda</h2>
        {calendarError && !calendar && <p className="muted">Agenda indisponible</p>}
        {calendar && <EventList events={calendar.agenda} empty="Rien de prévu" />}
      </section>
    </main>
  );
}
