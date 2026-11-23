"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { TeamCrest } from "@/components/brand/TeamCrest";
import { KickerFigure } from "@/components/overlay/KickerFigure";
import type { MatchState, TeamSide } from "@/lib/match/types";

type Banner = {
  side: TeamSide;
  name: string;
  scoreA: number;
  scoreB: number;
  color: MatchState["teamAColor"];
  logo: string | null;
  key: number;
};

const SHOW_MS = 2200;

/**
 * Short lower-third burst on goal — local overlay UI, no MatchState write.
 *
 * Hide timer lives in a ref so effect re-runs (rapid goals / set end / view
 * change) don't clear the timeout without also clearing the banner.
 */
export function GoalBanner({ state }: { state: MatchState }) {
  const reduceMotion = useReducedMotion();
  const prev = useRef<{
    a: number;
    b: number;
    revision: number;
  } | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const hideBanner = () => {
    clearHideTimer();
    setBanner(null);
  };

  const scheduleHide = () => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      setBanner(null);
    }, SHOW_MS);
  };

  useEffect(() => () => clearHideTimer(), []);

  useEffect(() => {
    const last = prev.current;
    prev.current = {
      a: state.teamA.score,
      b: state.teamB.score,
      revision: state.revision,
    };
    if (!last) return;
    if (state.revision <= last.revision) return;

    const onLiveSurface =
      state.activeView === "live" || state.activeView === "transition";

    if (!onLiveSurface) {
      hideBanner();
      return;
    }

    let side: TeamSide | null = null;
    if (state.teamA.score > last.a) side = "a";
    else if (state.teamB.score > last.b) side = "b";

    if (!side) {
      // Set/game reset dropped the score — don't leave a stale TOR bar.
      if (state.teamA.score < last.a || state.teamB.score < last.b) {
        hideBanner();
      }
      return;
    }

    setBanner({
      side,
      name: side === "a" ? state.teamA.name : state.teamB.name,
      scoreA: state.teamA.score,
      scoreB: state.teamB.score,
      color: side === "a" ? state.teamAColor : state.teamBColor,
      logo: side === "a" ? state.teamALogo : state.teamBLogo,
      key: state.revision,
    });
    scheduleHide();
  }, [
    state.revision,
    state.teamA.score,
    state.teamB.score,
    state.teamA.name,
    state.teamB.name,
    state.teamAColor,
    state.teamBColor,
    state.teamALogo,
    state.teamBLogo,
    state.activeView,
  ]);

  return (
    <AnimatePresence>
      {banner && (
        <motion.div
          key={banner.key}
          className="pointer-events-none absolute bottom-[17.5rem] left-1/2 z-30 w-[min(720px,90%)] -translate-x-1/2"
          initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: reduceMotion ? 0 : 0.28 }}
        >
          {/*
            TOR sits absolutely above the name so the flex row only centers
            crest / kicker / name / score on one optical mid-line.
          */}
          <div className="overlay-glass overlay-glass-accent flex items-center justify-center gap-4 px-6 py-4">
            <TeamCrest src={banner.logo} alt="" size={36} />
            <KickerFigure color={banner.color} size={32} />
            <div className="relative min-w-0 max-w-[18rem] pt-3 text-center">
              <div className="pointer-events-none absolute inset-x-0 top-0 text-[0.7rem] leading-none tracking-[0.22em] text-[var(--brand-accent)] uppercase">
                Tor
              </div>
              <div className="overlay-score truncate text-3xl leading-none md:text-4xl">
                {banner.name}
              </div>
            </div>
            <div className="overlay-score flex h-[1em] items-center text-4xl leading-none tabular-nums md:text-5xl">
              <span className="leading-none">{banner.scoreA}</span>
              <span className="inline-flex h-full items-center px-[0.06em] text-[0.72em] leading-none text-[var(--brand-accent)]">
                :
              </span>
              <span className="leading-none">{banner.scoreB}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
