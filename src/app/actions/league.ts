"use server";

import { type ActionResult, actionFail, actionOk } from "@/lib/action/result";
import { actionLog } from "@/lib/logger.server";
import {
  fetchVerbandsligaSuedTeams,
  type LeagueTeam,
} from "@/lib/tfvh/league-teams";

const log = actionLog("league");

export type LeagueTeamsPayload = {
  teams: LeagueTeam[];
  source: "live" | "fallback";
  fetchedAt: number;
};

export async function getLeagueTeams(): Promise<
  ActionResult<LeagueTeamsPayload>
> {
  try {
    const result = await fetchVerbandsligaSuedTeams();
    return actionOk(result);
  } catch (e) {
    log.error("getLeagueTeams failed", e);
    return actionFail(
      "UNKNOWN",
      e instanceof Error ? e.message : "Liga-Teams laden fehlgeschlagen",
    );
  }
}
