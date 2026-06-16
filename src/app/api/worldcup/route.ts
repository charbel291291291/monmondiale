import { NextResponse } from "next/server";

const API_BASE = "https://apiv2.apifootball.com/";

const groups: Record<string, string[]> = {
  A: ["Mexico", "South Africa", "South Korea", "Czech Republic"],
  B: ["Canada", "Bosnia & Herzegovina", "Qatar", "Switzerland"],
  C: ["Brazil", "Morocco", "Haiti", "Scotland"],
  D: ["USA", "Paraguay", "Australia", "Turkey"],
  E: ["Germany", "Curacao", "Ivory Coast", "Ecuador"],
  F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
  G: ["Belgium", "Egypt", "Iran", "New Zealand"],
  H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Senegal", "Iraq", "Norway"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "D.R. Congo", "Uzbekistan", "Colombia"],
  L: ["England", "Croatia", "Ghana", "Panama"]
};

function normalizeTeamName(name: string) {
  const n = String(name || "").trim();

  const map: Record<string, string> = {
    "Bosnia and Herzegovina": "Bosnia & Herzegovina",
    "Czechia": "Czech Republic",
    "United States": "USA",
    "South Korea Republic": "South Korea",
    "DR Congo": "D.R. Congo",
    "Congo DR": "D.R. Congo",
    "Korea Republic": "South Korea"
  };

  return map[n] || n;
}

function groupForTeam(name: string) {
  const team = normalizeTeamName(name);

  for (const [group, teams] of Object.entries(groups)) {
    if (teams.includes(team)) return group;
  }

  return "";
}

function codeForTeam(name: string) {
  const normalized = normalizeTeamName(name);

  const map: Record<string, string> = {
    Argentina: "ARG",
    Algeria: "DZA",
    France: "FRA",
    Senegal: "SEN",
    Brazil: "BRA",
    Morocco: "MAR",
    England: "ENG",
    Portugal: "POR",
    Germany: "GER",
    Spain: "ESP",
    Uruguay: "URU",
    USA: "USA",
    Mexico: "MEX",
    Canada: "CAN",
    Japan: "JPN",
    "South Korea": "KOR",
    "Czech Republic": "CZE",
    Australia: "AUS",
    Belgium: "BEL",
    Netherlands: "NED",
    Croatia: "CRO",
    Ghana: "GHA",
    Tunisia: "TUN",
    Iran: "IRI",
    Iraq: "IRQ",
    Norway: "NOR",
    Jordan: "JOR",
    Austria: "AUT",
    Colombia: "COL",
    Qatar: "QAT",
    Switzerland: "SUI",
    Egypt: "EGY",
    Turkey: "TUR",
    Paraguay: "PAR",
    Scotland: "SCO",
    Haiti: "HTI",
    Ecuador: "ECU",
    Panama: "PAN",
    "South Africa": "RSA",
    "Bosnia & Herzegovina": "BIH",
    "Saudi Arabia": "KSA",
    "Cape Verde": "CPV",
    "New Zealand": "NZL",
    Sweden: "SWE",
    Curacao: "CUW",
    "Ivory Coast": "CIV",
    "D.R. Congo": "COD",
    Uzbekistan: "UZB"
  };

  return map[normalized] || normalized.slice(0, 3).toUpperCase();
}

function normalizeStatus(status: string) {
  const raw = String(status || "").trim();
  const s = raw.toLowerCase();

  if (/^\d+(\+)?(\d+)?$/.test(raw)) return "LIVE";

  if (s.includes("finished") || s === "ft" || s.includes("after")) return "FT";
  if (s.includes("live") || s.includes("half") || s.includes("'")) return "LIVE";

  return "UPCOMING";
}

async function apiFootballOld(from: string, to: string) {
  const key = process.env.APIFOOTBALL_KEY || process.env.API_FOOTBALL_KEY;

  if (!key) {
    throw new Error("Missing APIFOOTBALL_KEY in .env.local");
  }

  const url = `${API_BASE}?action=get_events&from=${from}&to=${to}&APIkey=${key}`;

  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(`APIFootball failed with status ${res.status}`);
  }

  if (json?.error) {
    throw new Error(String(json.error));
  }

  if (!Array.isArray(json)) {
    throw new Error(JSON.stringify(json));
  }

  return json;
}

function cleanGoals(goals: any[]) {
  if (!Array.isArray(goals)) return [];

  return goals
    .map((goal: any) => {
      const homeScorer = goal.home_scorer || "";
      const awayScorer = goal.away_scorer || "";
      const homeAssist = goal.home_assist || "";
      const awayAssist = goal.away_assist || "";

      return {
        time: goal.time || "",
        scorer: homeScorer || awayScorer || "",
        assist: homeAssist || awayAssist || "",
        teamSide: homeScorer ? "home" : "away",
        score: goal.score || ""
      };
    })
    .filter((goal: any) => goal.scorer);
}


function addOneHourLebanonClock(matchDate: string, matchTime: string) {
  const safeDate = matchDate || "2026-06-01";
  const safeTime = matchTime || "00:00";

  const [year, month, day] = safeDate.split("-").map(Number);
  const [hourRaw, minuteRaw] = safeTime.split(":").map(Number);

  const hour = Number.isFinite(hourRaw) ? hourRaw : 0;
  const minute = Number.isFinite(minuteRaw) ? minuteRaw : 0;

  const shifted = new Date(Date.UTC(year, month - 1, day, hour + 1, minute, 0));

  const yyyy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(shifted.getUTCDate()).padStart(2, "0");
  const hh = String(shifted.getUTCHours()).padStart(2, "0");
  const mi = String(shifted.getUTCMinutes()).padStart(2, "0");

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const dayName = dayNames[shifted.getUTCDay()];
  const monthName = monthNames[shifted.getUTCMonth()];

  return {
    iso: `${yyyy}-${mm}-${dd}T${hh}:${mi}:00+03:00`,
    label: `${dayName}, ${dd} ${monthName} at ${hh}:${mi}`,
    time: `${hh}:${mi}`,
    date: `${dayName}, ${dd} ${monthName}`
  };
}

function mapMatch(item: any) {
  const home = normalizeTeamName(item.match_hometeam_name || "TBD");
  const away = normalizeTeamName(item.match_awayteam_name || "TBD");

  const homeScore =
    item.match_hometeam_score === "" || item.match_hometeam_score == null
      ? null
      : Number(item.match_hometeam_score);

  const awayScore =
    item.match_awayteam_score === "" || item.match_awayteam_score == null
      ? null
      : Number(item.match_awayteam_score);

  const group = groupForTeam(home) || groupForTeam(away);
  const lebanonClock = addOneHourLebanonClock(item.match_date, item.match_time);

  return {
    id: String(item.match_id),
    group: group ? `Group ${group}` : item.league_name || "World Cup",
    groupKey: group,
    status: normalizeStatus(item.match_status),
    minute: item.match_status || "",
    date: lebanonClock.iso,
    lebanonTimeLabel: lebanonClock.label,
    lebanonTime: lebanonClock.time,
    lebanonDate: lebanonClock.date,
    venue: item.match_stadium || "Venue TBD",
    home,
    away,
    homeCode: codeForTeam(home),
    awayCode: codeForTeam(away),
    homeScore,
    awayScore,
    goalsInfo: cleanGoals(item.goalscorer || [])
  };
}

function emptyStanding(team: string, index: number) {
  return {
    rank: index + 1,
    team,
    code: codeForTeam(team),
    played: 0,
    win: 0,
    draw: 0,
    loss: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0
  };
}

function buildGroupedStandings(matches: any[]) {
  return Object.entries(groups).map(([groupKey, teams]) => {
    const table: Record<string, any> = {};

    teams.forEach((team, index) => {
      table[team] = emptyStanding(team, index);
    });

    for (const match of matches) {
      if (match.groupKey !== groupKey) continue;
      if (match.status !== "FT") continue;
      if (match.homeScore === null || match.awayScore === null) continue;

      const home = match.home;
      const away = match.away;

      if (!table[home] || !table[away]) continue;

      table[home].played += 1;
      table[away].played += 1;

      table[home].gf += match.homeScore;
      table[home].ga += match.awayScore;
      table[away].gf += match.awayScore;
      table[away].ga += match.homeScore;

      table[home].gd = table[home].gf - table[home].ga;
      table[away].gd = table[away].gf - table[away].ga;

      if (match.homeScore > match.awayScore) {
        table[home].win += 1;
        table[home].points += 3;
        table[away].loss += 1;
      } else if (match.homeScore < match.awayScore) {
        table[away].win += 1;
        table[away].points += 3;
        table[home].loss += 1;
      } else {
        table[home].draw += 1;
        table[away].draw += 1;
        table[home].points += 1;
        table[away].points += 1;
      }
    }

    const rows = Object.values(table)
      .sort((a: any, b: any) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.team.localeCompare(b.team);
      })
      .map((row: any, index: number) => ({
        ...row,
        rank: index + 1
      }));

    return {
      group: groupKey,
      rows
    };
  });
}

function buildScorers(matches: any[]) {
  const scorers: Record<string, any> = {};

  for (const match of matches) {
    for (const goal of match.goalsInfo || []) {
      if (!goal.scorer) continue;

      const team = goal.teamSide === "home" ? match.home : match.away;
      const code = goal.teamSide === "home" ? match.homeCode : match.awayCode;

      if (!scorers[goal.scorer]) {
        scorers[goal.scorer] = {
          name: goal.scorer,
          team,
          code,
          goals: 0
        };
      }

      scorers[goal.scorer].goals += 1;
    }
  }

  return Object.values(scorers)
    .sort((a: any, b: any) => b.goals - a.goals)
    .slice(0, 20);
}

function buildAssisters(matches: any[]) {
  const assisters: Record<string, any> = {};

  for (const match of matches) {
    for (const goal of match.goalsInfo || []) {
      if (!goal.assist) continue;

      const team = goal.teamSide === "home" ? match.home : match.away;
      const code = goal.teamSide === "home" ? match.homeCode : match.awayCode;

      if (!assisters[goal.assist]) {
        assisters[goal.assist] = {
          name: goal.assist,
          team,
          code,
          assists: 0
        };
      }

      assisters[goal.assist].assists += 1;
    }
  }

  return Object.values(assisters)
    .sort((a: any, b: any) => b.assists - a.assists)
    .slice(0, 20);
}

export async function GET() {
  try {
    const from = "2026-06-01";
    const to = "2026-07-31";

    const events = await apiFootballOld(from, to);

    const worldCupEvents = events.filter((item: any) => {
      const league = String(item.league_name || "").toLowerCase();
      const round = String(item.match_round || "").toLowerCase();

      return (
        league.includes("world cup") ||
        league.includes("fifa world cup") ||
        round.includes("world cup")
      );
    });

    const matches = worldCupEvents.map(mapMatch);
    const standingsGroups = buildGroupedStandings(matches);
    const scorers = buildScorers(matches);
    const assisters = buildAssisters(matches);

    return NextResponse.json({
      source: "apifootball-com",
      updatedAt: new Date().toISOString(),
      matches,
      scorers,
      assisters,
      standingsGroups
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        source: "apifootball-com-error",
        updatedAt: new Date().toISOString(),
        matches: [],
        scorers: [],
        assisters: [],
        standingsGroups: [],
        error: error.message || "Failed to load data"
      },
      { status: 500 }
    );
  }
}