import {
  LOCAL_CRESTS_BY_SOURCE_KEY,
  LOCAL_CRESTS_BY_TEAM_ID,
} from "@/lib/tfvh/crests.generated";

/** Sportsmanager filename stem, e.g. I72T1753214547 from …/I72T…W240H240.png */
export function crestSourceKey(url: string): string | null {
  const m = url.match(/\/(I\d+T\d+)/i);
  return m?.[1] ?? null;
}

/**
 * Map a crest URL (remote TFVH or already local) to `/crests/{teamId}.ext`.
 * Returns null when we have no committed file — callers must not hotlink TFVH.
 */
export function localizeCrestUrl(
  url: string | null | undefined,
  teamId?: string | null,
): string | null {
  if (!url && !teamId) return null;
  if (url?.startsWith("/crests/")) return url;
  if (teamId && LOCAL_CRESTS_BY_TEAM_ID[teamId]) {
    return LOCAL_CRESTS_BY_TEAM_ID[teamId];
  }
  if (url) {
    const key = crestSourceKey(url);
    if (key && LOCAL_CRESTS_BY_SOURCE_KEY[key]) {
      return LOCAL_CRESTS_BY_SOURCE_KEY[key];
    }
  }
  return null;
}
