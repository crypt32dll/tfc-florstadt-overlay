"use client";

import { useState } from "react";
import { KickerColorPicker } from "@/components/brand/KickerColorPicker";
import { LeagueTeamPicker } from "@/components/brand/LeagueTeamPicker";
import { SmallBtn } from "@/components/control/ControlButtons";
import { GAME_LINEUP } from "@/lib/match/rules";
import type {
  KickerColor,
  MatchFormat,
  MatchState,
  RoomMutation,
} from "@/lib/match/types";

type Props = {
  state: MatchState;
  pending: boolean;
  run: (mutation: RoomMutation) => void;
  confirmRun: (message: string, mutation: RoomMutation) => void;
};

export function ControlMatchSetup({ state, pending, run, confirmRun }: Props) {
  const [showNewMatch, setShowNewMatch] = useState(false);
  const [newTeamB, setNewTeamB] = useState("");
  const [newTeamBLogo, setNewTeamBLogo] = useState<string | null>(null);
  const [newTeamBColor, setNewTeamBColor] = useState<KickerColor>(
    state.teamBColor,
  );
  const [newFormat, setNewFormat] = useState<MatchFormat>(state.matchFormat);

  const requestFormat = (format: MatchFormat) => {
    if (format === state.matchFormat) return;
    confirmRun(
      `Format auf Best of ${format === "bestOf5" ? "5" : "3"} ändern?`,
      {
        type: "setMatchFormat",
        format,
      },
    );
  };

  const submitNewMatch = () => {
    const teamB = newTeamB.trim();
    if (!teamB) return;
    confirmRun(`Neues Match gegen „${teamB}“ starten? (History wird geleert)`, {
      type: "newMatch",
      teamB,
      teamBColor: newTeamBColor,
      teamBLogo: newTeamBLogo,
      matchFormat: newFormat,
    });
    setShowNewMatch(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => requestFormat("bestOf3")}
          className={`btn text-base ${
            (state.matchFormat ?? "bestOf3") === "bestOf3"
              ? "btn-primary"
              : "btn-ghost"
          }`}
        >
          Best of 3
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => requestFormat("bestOf5")}
          className={`btn text-base ${
            state.matchFormat === "bestOf5" ? "btn-primary" : "btn-ghost"
          }`}
        >
          Best of 5
        </button>
      </div>

      <div className="glass-panel space-y-2 p-3">
        <div className="text-xs tracking-wide text-muted uppercase">
          Lineup (Spiel {state.lineupIndex + 1}/{GAME_LINEUP.length})
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {GAME_LINEUP.map((type, index) => {
            const active = index === state.lineupIndex;
            const label = type === "doppel" ? "D" : "E";
            const slotId = `L${index + 1}-${type}`;
            return (
              <button
                key={slotId}
                type="button"
                disabled={pending}
                aria-pressed={active}
                title={`Spiel ${index + 1}: ${type === "doppel" ? "Doppel" : "Einzel"}`}
                onClick={() => {
                  if (index === state.lineupIndex) return;
                  confirmRun(
                    `Zu Spiel ${index + 1} (${type === "doppel" ? "Doppel" : "Einzel"}) springen? Tore/Sätze dieses Spiels werden genullt.`,
                    { type: "setLineupIndex", index },
                  );
                }}
                className={`btn min-h-11 px-0 text-sm ${
                  active ? "btn-primary" : "btn-ghost"
                }`}
              >
                {index + 1}
                {label}
              </button>
            );
          })}
        </div>
        {state.sessionComplete && (
          <p className="text-center text-xs text-[var(--brand-accent)]">
            Matchday fertig — Ending-Screen oder neues Match.
          </p>
        )}
      </div>

      <div className="glass-panel space-y-3 p-3">
        <div className="text-xs tracking-wide text-muted uppercase">
          Kickerfarben
        </div>
        <div className="space-y-2">
          <div className="text-xs text-muted">{state.teamA.name}</div>
          <KickerColorPicker
            value={state.teamAColor}
            disabled={pending}
            label={`Farbe ${state.teamA.name}`}
            onChange={(color) =>
              run({ type: "setTeamColor", side: "a", color })
            }
          />
        </div>
        <div className="space-y-2">
          <div className="text-xs text-muted">{state.teamB.name}</div>
          <KickerColorPicker
            value={state.teamBColor}
            disabled={pending}
            label={`Farbe ${state.teamB.name}`}
            onChange={(color) =>
              run({ type: "setTeamColor", side: "b", color })
            }
          />
        </div>
      </div>

      {!showNewMatch ? (
        <SmallBtn disabled={pending} onClick={() => setShowNewMatch(true)}>
          Neues Match / Gegner
        </SmallBtn>
      ) : (
        <div className="glass-panel space-y-3 p-3">
          <div className="text-xs tracking-wide text-muted uppercase">
            Neues Match
          </div>
          <LeagueTeamPicker
            label="Gegner"
            name="newTeamB"
            value={newTeamB}
            logoUrl={newTeamBLogo}
            excludeNameIncludes="Florstadt"
            onChange={({ name, logoUrl }) => {
              setNewTeamB(name);
              setNewTeamBLogo(logoUrl);
            }}
          />
          <KickerColorPicker
            value={newTeamBColor}
            onChange={setNewTeamBColor}
            label="Farbe Gegner"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`btn text-sm ${
                newFormat === "bestOf3" ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setNewFormat("bestOf3")}
            >
              Bo3
            </button>
            <button
              type="button"
              className={`btn text-sm ${
                newFormat === "bestOf5" ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setNewFormat("bestOf5")}
            >
              Bo5
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SmallBtn disabled={pending} onClick={() => setShowNewMatch(false)}>
              Abbrechen
            </SmallBtn>
            <button
              type="button"
              disabled={pending || !newTeamB.trim()}
              onClick={submitNewMatch}
              className="btn btn-primary min-h-12 text-lg"
            >
              Starten
            </button>
          </div>
        </div>
      )}

      {state.sessionComplete && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run({ type: "setView", view: "ending" })}
          className="btn btn-primary w-full text-lg"
        >
          Matchday beenden (Ending)
        </button>
      )}
    </div>
  );
}
