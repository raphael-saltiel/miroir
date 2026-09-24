import ical, { type VEvent } from "node-ical";

export const dynamic = "force-dynamic";

const TZ = "Europe/Paris";

type CalendarEvent = {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
};

// Date du jour à Paris au format YYYY-MM-DD, et bornes UTC de cette journée.
function parisDay(now: Date) {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
  const [y, m, d] = ymd.split("-").map(Number);
  const offset = (date: Date) => {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: TZ,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
        .formatToParts(date)
        .map((x) => [x.type, x.value]),
    );
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - date.getTime();
  };
  const guess = new Date(Date.UTC(y, m - 1, d));
  const from = new Date(guess.getTime() - offset(guess));
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const to = new Date(next.getTime() - offset(next) - 1);
  return { ymd, from, to };
}

// node-ical crée les dates "journée entière" à minuit dans le fuseau du process.
function localYmd(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function eventsForToday(url: string, now: Date): Promise<CalendarEvent[]> {
  const res = await fetch(url.replace(/^webcal:\/\//, "https://"), { cache: "no-store" });
  if (!res.ok) throw new Error(`ICS ${res.status}`);
  const data = ical.sync.parseICS(await res.text());
  const { ymd, from, to } = parisDay(now);
  const events: CalendarEvent[] = [];

  for (const item of Object.values(data)) {
    if (!item || item.type !== "VEVENT") continue;
    const instances = ical.expandRecurringEvent(item as VEvent, { from, to, expandOngoing: true });
    for (const inst of instances) {
      if (inst.isFullDay && !(localYmd(inst.start) <= ymd && ymd < localYmd(inst.end))) continue;
      const summary = inst.summary;
      events.push({
        title: typeof summary === "string" ? summary : (summary?.val ?? ""),
        start: inst.start.toISOString(),
        end: inst.end.toISOString(),
        allDay: inst.isFullDay,
      });
    }
  }

  return events.sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start));
}

export async function GET() {
  const icsUrl = process.env.ICS_URL;
  if (!icsUrl) return Response.json({ error: "ICS_URL manquante" }, { status: 500 });
  const sportUrl = process.env.ICS_SPORT_URL;
  const now = new Date();

  try {
    const [agenda, sport] = await Promise.all([
      eventsForToday(icsUrl, now),
      sportUrl ? eventsForToday(sportUrl, now) : Promise.resolve([]),
    ]);
    return Response.json({ agenda, sport });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 });
  }
}
