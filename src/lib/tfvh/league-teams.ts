import "server-only";

import { actionLog } from "@/lib/logger.server";
import { localizeCrestUrl } from "@/lib/tfvh/localize-crest";
import {
  LEAGUE_TEAMS_FALLBACK,
  type LeagueTeam,
  parseTeamDetailsLogo,
  parseVerbandsligaTeams,
  toHiResCrestUrl,
} from "@/lib/tfvh/parse-league-teams";

export { localizeCrestUrl } from "@/lib/tfvh/localize-crest";
export type { LeagueTeam } from "@/lib/tfvh/parse-league-teams";
export {
  findLeagueTeam,
  LEAGUE_TEAMS_FALLBACK,
  parseTeamDetailsLogo,
  parseVerbandsligaTeams,
  toHiResCrestUrl,
} from "@/lib/tfvh/parse-league-teams";

const log = actionLog("tfvh");

export const TFVH_LEAGUE_URL = "https://tfvh.de/index.php/verbandsliga-sued";

export type LeagueTeamsResult = {
  teams: LeagueTeam[];
  source: "live" | "fallback";
  fetchedAt: number;
};

let memoryCache: LeagueTeamsResult | null = null;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const FETCH_HEADERS = {
  "User-Agent": "TFCFlorstadtOverlay/0.1 (+https://tfc-florstadt.de)",
  Accept: "text/html",
} as const;

function withLocalCrest(
  team: LeagueTeam,
  remoteHint?: string | null,
): LeagueTeam {
  return {
    ...team,
    logoUrl:
      localizeCrestUrl(remoteHint ?? team.logoUrl, team.id) ?? team.logoUrl,
  };
}

function teamDetailsUrl(id: string): string {
  return `${TFVH_LEAGUE_URL}?task=team_details&id=${encodeURIComponent(id)}`;
}

/**
 * Live scrape only discovers names/ids. Logos always resolve to /public/crests
 * (pnpm sync:crests). team_details is only used to improve source-key matching
 * when a new club appears before the next sync.
 */
async function enrichTeamLogo(team: LeagueTeam): Promise<LeagueTeam> {
  const local = localizeCrestUrl(team.logoUrl, team.id);
  if (local) return { ...team, logoUrl: local };

  try {
    const res = await fetch(teamDetailsUrl(team.id), {
      headers: FETCH_HEADERS,
      next: { revalidate: 21_600 },
    });
    if (!res.ok) throw new Error(`TFVH team ${team.id} HTTP ${res.status}`);
    const html = await res.text();
    const remote = parseTeamDetailsLogo(html) ?? toHiResCrestUrl(team.logoUrl);
    return withLocalCrest(team, remote);
  } catch (err) {
    log.warn(`team crest resolve failed for ${team.id}`, err);
    return withLocalCrest(team);
  }
}

export async function fetchVerbandsligaSuedTeams(opts?: {
  force?: boolean;
}): Promise<LeagueTeamsResult> {
  const now = Date.now();
  if (
    !opts?.force &&
    memoryCache &&
    now - memoryCache.fetchedAt < CACHE_TTL_MS
  ) {
    return memoryCache;
  }

  try {
    const res = await fetch(TFVH_LEAGUE_URL, {
      headers: FETCH_HEADERS,
      next: { revalidate: 21_600 },
    });
    if (!res.ok) {
      throw new Error(`TFVH HTTP ${res.status}`);
    }
    const html = await res.text();
    const parsed = parseVerbandsligaTeams(html);
    if (parsed.length === 0) {
      throw new Error("TFVH parse returned 0 teams");
    }

    const teams = await Promise.all(parsed.map(enrichTeamLogo));

    memoryCache = { teams, source: "live", fetchedAt: now };
    log.info("league teams scraped", {
      count: teams.length,
      withLogo: teams.filter((t) => t.logoUrl?.startsWith("/crests/")).length,
    });
    return memoryCache;
  } catch (err) {
    log.warn("league scrape failed — using fallback", err);
    memoryCache = {
      teams: LEAGUE_TEAMS_FALLBACK,
      source: "fallback",
      fetchedAt: now,
    };
    return memoryCache;
  }
}
