import { LEAGUE_TEAMS_LOCAL } from "@/lib/tfvh/crests.generated";
import { localizeCrestUrl } from "@/lib/tfvh/localize-crest";

export type LeagueTeam = {
  /** Sportsmanager team_details id */
  id: string;
  name: string;
  /** Always a local `/crests/…` path when available */
  logoUrl: string | null;
};

/** Snapshot when live scrape fails — logos from public/crests (pnpm sync:crests). */
export const LEAGUE_TEAMS_FALLBACK: LeagueTeam[] = LEAGUE_TEAMS_LOCAL.map(
  (t) => ({
    id: t.id,
    name: t.name,
    logoUrl: t.logoUrl,
  }),
);

const TEAM_ROW_RE =
  /<a href="\/index\.php\/verbandsliga-sued\?task=team_details&id=(\d+)">([^<]+)<\/a>[\s\S]*?(?:<img src="(https:\/\/tfvh\.de\/images\/sportsmanager\/vereine\/[^"]+)"|<\/tr>)/gi;

function decodeEntities(value: string): string {
  return value
    .replace(/&uuml;/gi, "ü")
    .replace(/&Uuml;/gi, "Ü")
    .replace(/&auml;/gi, "ä")
    .replace(/&Auml;/gi, "Ä")
    .replace(/&ouml;/gi, "ö")
    .replace(/&Ouml;/gi, "Ö")
    .replace(/&szlig;/gi, "ß")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, n: string) =>
      String.fromCharCode(Number.parseInt(n, 10)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) =>
      String.fromCharCode(Number.parseInt(n, 16)),
    )
    .trim();
}

/**
 * Sportsmanager serves sized crest variants in the filename (`W28H28`, `W240H240`).
 * Table thumbs are 28×28; team_details pages use 240×240.
 */
export function toHiResCrestUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  return url.replace(/W\d+H\d+/i, "W240H240");
}

/** Crest from a `task=team_details` HTML page. */
export function parseTeamDetailsLogo(html: string): string | null {
  const match = html.match(
    /src="(https:\/\/tfvh\.de\/images\/sportsmanager\/vereine\/[^"]+W240H240\.[a-zA-Z]+)"/i,
  );
  return match?.[1] ?? null;
}

/** Pure parser — remote URLs are localized via committed crests map. */
export function parseVerbandsligaTeams(html: string): LeagueTeam[] {
  const teams: LeagueTeam[] = [];
  const seen = new Set<string>();
  TEAM_ROW_RE.lastIndex = 0;
  let match: RegExpExecArray | null = TEAM_ROW_RE.exec(html);
  while (match) {
    const id = match[1];
    const name = decodeEntities(match[2]);
    const remote = toHiResCrestUrl(match[3] ?? null);
    if (id && name && !seen.has(id)) {
      seen.add(id);
      teams.push({
        id,
        name,
        logoUrl: localizeCrestUrl(remote, id),
      });
    }
    match = TEAM_ROW_RE.exec(html);
  }
  return teams;
}

/** Prefer exact name, else prefix / includes (e.g. „TFC Florstadt“ → „… 1“). */
export function findLeagueTeam(
  teams: LeagueTeam[],
  name: string,
): LeagueTeam | undefined {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  return (
    teams.find((t) => t.name.toLowerCase() === needle) ??
    teams.find((t) => t.name.toLowerCase().startsWith(needle)) ??
    teams.find((t) => t.name.toLowerCase().includes(needle))
  );
}
