"use client";

import "flag-icons/css/flag-icons.min.css";
import { useEffect, useMemo, useState } from "react";
import { InstallPwaButton } from "@/components/InstallPwaButton";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type Goal = {
  time: string;
  scorer: string;
  assist: string;
  teamSide: "home" | "away";
  score: string;
};

type Match = {
  id: string;
  group: string;
  groupKey: string;
  status: "LIVE" | "FT" | "UPCOMING";
  minute: string;
  date: string;
  lebanonTimeLabel?: string;
  lebanonTime?: string;
  lebanonDate?: string;
  venue: string;
  home: string;
  away: string;
  homeCode: string;
  awayCode: string;
  homeScore: number | null;
  awayScore: number | null;
  goalsInfo: Goal[];
};

type StandingRow = {
  rank: number;
  team: string;
  code: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

type StandingGroup = {
  group: string;
  rows: StandingRow[];
};

type PersonStat = {
  name: string;
  team: string;
  code: string;
  goals?: number;
  assists?: number;
};

type ApiData = {
  source: string;
  updatedAt: string;
  matches: Match[];
  scorers: PersonStat[];
  assisters: PersonStat[];
  standingsGroups: StandingGroup[];
};

const tabs = ["Live", "Upcoming", "Results", "Standings", "Top Scorers", "Top Assisters"] as const;

function flagCode(code: string) {
  const map: Record<string, string> = {
    ARG: "ar",
    DZA: "dz",
    FRA: "fr",
    SEN: "sn",
    BRA: "br",
    MAR: "ma",
    ENG: "gb-eng",
    SCO: "gb-sct",
    POR: "pt",
    GER: "de",
    ESP: "es",
    URU: "uy",
    USA: "us",
    MEX: "mx",
    CAN: "ca",
    JPN: "jp",
    KOR: "kr",
    CZE: "cz",
    AUS: "au",
    BEL: "be",
    NED: "nl",
    CRO: "hr",
    GHA: "gh",
    TUN: "tn",
    IRI: "ir",
    IRQ: "iq",
    NOR: "no",
    JOR: "jo",
    AUT: "at",
    COL: "co",
    QAT: "qa",
    SUI: "ch",
    EGY: "eg",
    TUR: "tr",
    PAR: "py",
    HTI: "ht",
    ECU: "ec",
    PAN: "pa",
    RSA: "za",
    BIH: "ba",
    KSA: "sa",
    CPV: "cv",
    NZL: "nz",
    SWE: "se",
    CUW: "cw",
    CIV: "ci",
    COD: "cd",
    UZB: "uz"
  };

  return map[String(code || "").toUpperCase()] || String(code || "").toLowerCase();
}

function FlagBox({ code }: { code: string }) {
  const fc = flagCode(code);

  return (
    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/90 shadow-lg shadow-black/20">
      <span className={`fi fi-${fc} h-full w-full bg-cover`} />
    </div>
  );
}

function SmallFlag({ code }: { code: string }) {
  const fc = flagCode(code);

  return <span className={`fi fi-${fc} mr-2 rounded-sm`} />;
}

function formatLebanonTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Beirut",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusStyle(status: string) {
  if (status === "LIVE") return "bg-red-500/20 text-red-200 border-red-400/30";
  if (status === "FT") return "bg-emerald-500/20 text-emerald-200 border-emerald-400/30";
  return "bg-sky-500/20 text-sky-200 border-sky-400/30";
}

function MatchCard({ match }: { match: Match }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:rounded-[2rem] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">{match.group}</div>
          <div className="mt-1 text-sm text-white/50">Lebanon time: {match.lebanonTimeLabel || formatLebanonTime(match.date)}</div>
        </div>

        <div className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyle(match.status)}`}>
          {match.status}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        <div className="flex flex-col items-center text-center">
          <FlagBox code={match.homeCode} />
          <div className="mt-2 text-sm font-black leading-tight sm:mt-3 sm:text-lg">{match.home}</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-black tracking-tight sm:text-4xl">
            {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
          </div>
          <div className="mt-1 text-xs text-white/40">{match.minute || "Not Started"}</div>
        </div>

        <div className="flex flex-col items-center text-center">
          <FlagBox code={match.awayCode} />
          <div className="mt-2 text-sm font-black leading-tight sm:mt-3 sm:text-lg">{match.away}</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-black/20 p-3 text-sm text-white/50">{match.venue}</div>

      {match.status === "FT" && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 text-sm font-black text-white/70">Goals</div>

          {match.goalsInfo.length === 0 ? (
            <div className="text-sm text-white/40">No goal details available for this match.</div>
          ) : (
            <div className="space-y-2">
              {match.goalsInfo.map((goal, index) => {
                const teamCode = goal.teamSide === "home" ? match.homeCode : match.awayCode;
                const teamName = goal.teamSide === "home" ? match.home : match.away;

                return (
                  <div key={index} className="rounded-xl bg-white/[0.05] p-3 text-sm text-white/70">
                    <div className="font-bold">
                      {goal.time}' <SmallFlag code={teamCode} />
                      {goal.scorer} <span className="text-white/40">({teamName})</span>
                    </div>
                    <div className="mt-1 text-white/45">
                      Score: {goal.score || "N/A"}
                      {goal.assist ? ` | Assist: ${goal.assist}` : " | No assist"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StandingsTable({ group }: { group: StandingGroup }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:rounded-[2rem] sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-2xl font-black sm:text-3xl">Group {group.group}</div>
        <div className="rounded-2xl bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/45">
          Standings
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <table className="w-full table-fixed text-left text-[11px] sm:text-xs lg:text-sm">
          <thead className="text-[9px] uppercase tracking-widest text-white/35 sm:text-[10px]">
            <tr>
              <th className="w-[7%] py-2">#</th>
              <th className="w-[38%] py-2">Team</th>
              <th className="w-[7%] py-2 text-center">P</th>
              <th className="w-[7%] py-2 text-center">W</th>
              <th className="w-[7%] py-2 text-center">D</th>
              <th className="w-[7%] py-2 text-center">L</th>
              <th className="w-[8%] py-2 text-center">GD</th>
              <th className="w-[11%] py-2 text-right">PTS</th>
            </tr>
          </thead>

          <tbody>
            {group.rows.map((row) => (
              <tr key={row.team} className="border-t border-white/10">
                <td className="py-2 font-black sm:py-3">{row.rank}</td>

                <td className="py-2 sm:py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <SmallFlag code={row.code} />
                    <span className="truncate font-black">{row.team}</span>
                  </div>
                </td>

                <td className="text-center">{row.played}</td>
                <td className="text-center">{row.win}</td>
                <td className="text-center">{row.draw}</td>
                <td className="text-center">{row.loss}</td>

                <td className={`text-center font-black ${row.gd > 0 ? "text-emerald-300" : row.gd < 0 ? "text-red-300" : "text-white/70"}`}>
                  {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>

                <td className="text-right font-black text-amber-200">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] text-white/45">
        <div className="rounded-xl bg-black/20 p-2">GF = Goals For</div>
        <div className="rounded-xl bg-black/20 p-2">GA = Goals Against</div>
        <div className="rounded-xl bg-black/20 p-2">GD = Goal Diff</div>
      </div>
    </div>
  );
}

function StatList({ title, items, valueKey }: { title: string; items: PersonStat[]; valueKey: "goals" | "assists" }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:rounded-[2rem] sm:p-5">
      <div className="mb-4 text-xl font-black">{title}</div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-white/50">
          Data not available yet from current API response.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 p-3 sm:p-4">
              <div>
                <div className="font-black">
                  #{index + 1} <SmallFlag code={item.code} />
                  {item.name}
                </div>
                <div className="mt-1 text-sm text-white/45">{item.team}</div>
              </div>
              <div className="shrink-0 rounded-2xl bg-amber-400 px-3 py-2 text-base font-black text-black sm:px-4 sm:text-lg">
                {item[valueKey] ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<ApiData | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Live");
  const [error, setError] = useState("");

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    async function loadData() {
      try {
        const res = await fetch("/api/worldcup", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load World Cup data");
        }

        setData(json);
        setError("");

        const hasLiveMatch = Array.isArray(json.matches) && json.matches.some((m: Match) => m.status === "LIVE");

        clearInterval(intervalId);
        intervalId = setInterval(loadData, 300000);
      } catch (err: any) {
        setError(err.message || "Failed to fetch");
      }
    }

    loadData();

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, []);

  const matches = data?.matches || [];

  const visibleMatches = useMemo(() => {
    if (tab === "Live") return matches.filter((m) => m.status === "LIVE");
    if (tab === "Upcoming") return matches.filter((m) => m.status === "UPCOMING").slice(0, 12);
    if (tab === "Results") return matches.filter((m) => m.status === "FT").slice(-12).reverse();
    return [];
  }, [matches, tab]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07111f] px-3 py-4 text-white sm:px-5 sm:py-6">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-5 rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.075] to-white/[0.035] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:mb-8 sm:rounded-[2rem] sm:p-6">
          <div className="flex flex-col justify-between gap-5 text-center md:flex-row md:items-center md:text-left">
            <div>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-amber-300/20 bg-black/25 p-2 shadow-2xl shadow-black/30 md:mx-0">
  <img src="/website-logo.png" alt="Mondial 2026" className="h-full w-full object-contain" />
</div>
<div className="text-sm font-bold uppercase tracking-[0.35em] text-amber-200">Lebanon Time Always</div>
              <h1 className="mx-auto mt-4 max-w-[11ch] text-center text-[2.65rem] font-black leading-[0.98] tracking-[-0.04em] text-white sm:max-w-none sm:text-5xl md:mx-0 md:text-left md:text-6xl">Mondial 2026 Live Center</h1>
              <p className="mx-auto mt-4 max-w-md text-center text-base leading-7 text-white/45 md:mx-0 md:text-left">
                Matches, results, goals, assists, top scorers, top assisters, and grouped standings.
              </p>

              <div className="mt-5 text-center text-[10px] font-black uppercase tracking-[0.42em] text-white/22 md:text-left">
                Powered by{" "}
                <a
                  href="https://www.eyedeaz.digital"
                  target="_blank"
                  rel="noreferrer"
                  className="engraved-brand ml-1 normal-case tracking-normal text-amber-200/75 transition hover:text-amber-200"
                >
                  EyeDeaZ
                </a>
              </div>
            </div>

            <div className="mx-auto w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-black/35 to-white/[0.04] p-5 text-center text-sm text-white/45 shadow-2xl shadow-black/20 md:mx-0 md:w-auto md:min-w-[220px] md:text-left">
              Last update:
              <div className="mt-2 text-lg font-black tracking-tight text-white">{data ? formatLebanonTime(data.updatedAt) : "Loading..."}</div>
            </div>
          </div>
        </header>

        

        <div className="mb-5 grid grid-cols-3 gap-2 sm:mb-6 sm:flex sm:flex-wrap sm:gap-3">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-2xl px-3 py-3 text-[11px] font-black transition sm:rounded-full sm:px-5 sm:py-3 sm:text-sm ${
                tab === item ? "bg-amber-300 text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-red-100">
            {error}
          </div>
        )}

        {!data && !error && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-white/50">
            Loading World Cup data...
          </div>
        )}

        {data && (tab === "Live" || tab === "Upcoming" || tab === "Results") && (
          <>
            {visibleMatches.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-white/50">
                No matches in this section right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
                {visibleMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </>
        )}

        {data && tab === "Standings" && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-5">
            {data.standingsGroups.map((group) => (
              <StandingsTable key={group.group} group={group} />
            ))}
          </div>
        )}

        {data && tab === "Top Scorers" && (
          <StatList title="Top Scorers" items={data.scorers || []} valueKey="goals" />
        )}

        {data && tab === "Top Assisters" && (
          <StatList title="Top Assisters" items={data.assisters || []} valueKey="assists" />
        )}
      </div>
      
      <InstallPwaButton />
    </main>
  );
}