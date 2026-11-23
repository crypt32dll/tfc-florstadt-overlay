"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { MatchState } from "@/lib/match/types";

export type SfxKind = "goal" | "switch" | "set";

const FILE_SFX: Record<SfxKind, string> = {
  goal: "/sfx/goal.mp3",
  set: "/sfx/set.mp3",
  switch: "/sfx/switch.mp3",
};

const fileReady = new Map<SfxKind, boolean | "pending">();

function playTone(
  ctx: AudioContext,
  {
    freq,
    duration,
    type = "sine",
    volume,
    when = 0,
  }: {
    freq: number;
    duration: number;
    type?: OscillatorType;
    volume: number;
    when?: number;
  },
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + when;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function playSynth(ctx: AudioContext, kind: SfxKind, volume: number) {
  const v = Math.min(1, Math.max(0, volume)) * 0.35;
  if (kind === "goal") {
    playTone(ctx, { freq: 520, duration: 0.12, type: "triangle", volume: v });
    playTone(ctx, {
      freq: 780,
      duration: 0.18,
      type: "triangle",
      volume: v * 0.85,
      when: 0.08,
    });
    return;
  }
  if (kind === "set") {
    playTone(ctx, {
      freq: 340,
      duration: 0.15,
      type: "square",
      volume: v * 0.7,
    });
    playTone(ctx, {
      freq: 510,
      duration: 0.2,
      type: "square",
      volume: v * 0.6,
      when: 0.12,
    });
    playTone(ctx, {
      freq: 680,
      duration: 0.28,
      type: "triangle",
      volume: v,
      when: 0.28,
    });
    return;
  }
  playTone(ctx, {
    freq: 420,
    duration: 0.22,
    type: "sawtooth",
    volume: v * 0.45,
  });
  playTone(ctx, {
    freq: 280,
    duration: 0.28,
    type: "sawtooth",
    volume: v * 0.35,
    when: 0.1,
  });
}

/** Prefer `/public/sfx/{kind}.mp3` when present; else Web Audio tones. */
export function playSfx(ctx: AudioContext, kind: SfxKind, volume: number) {
  const ready = fileReady.get(kind);
  if (ready === true) {
    const audio = new Audio(FILE_SFX[kind]);
    audio.volume = Math.min(1, Math.max(0, volume));
    void audio.play().catch(() => playSynth(ctx, kind, volume));
    return;
  }
  if (ready !== "pending") {
    fileReady.set(kind, "pending");
    void fetch(FILE_SFX[kind], { method: "HEAD" })
      .then((res) => {
        fileReady.set(kind, res.ok);
      })
      .catch(() => {
        fileReady.set(kind, false);
      });
  }
  playSynth(ctx, kind, volume);
}

function ensureAudioContext(ref: { current: AudioContext | null }) {
  if (!ref.current) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ref.current = new AC();
  }
  if (ref.current.state === "suspended") {
    void ref.current.resume();
  }
  return ref.current;
}

/**
 * Plays short stingers in the OBS overlay browser source.
 * Debounces rapid goals; respects sfxEnabled / reduced motion.
 */
export function useOverlaySfx(state: MatchState) {
  const reduceMotion = useReducedMotion();
  const ctxRef = useRef<AudioContext | null>(null);
  const prevRef = useRef<{
    revision: number;
    goals: number;
    sets: number;
    view: MatchState["activeView"];
    sfxPing: number;
  } | null>(null);
  const lastGoalAt = useRef(0);

  const revision = state.revision;
  const scoreA = state.teamA.score;
  const scoreB = state.teamB.score;
  const setsA = state.sets.a;
  const setsB = state.sets.b;
  const activeView = state.activeView;
  const sfxPing = state.sfxPing ?? 0;
  const sfxEnabled = state.sfxEnabled;
  const sfxVolume = state.sfxVolume;

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = {
      revision,
      goals: scoreA + scoreB,
      sets: setsA + setsB,
      view: activeView,
      sfxPing,
    };
    if (!prev) return;
    if (reduceMotion) return;
    if (revision <= prev.revision) return;

    try {
      if (sfxPing > prev.sfxPing) {
        playSfx(ensureAudioContext(ctxRef), "switch", sfxVolume || 0.7);
        return;
      }

      if (!sfxEnabled) return;

      const goals = scoreA + scoreB;
      const sets = setsA + setsB;
      const now = Date.now();

      if (sets > prev.sets) {
        playSfx(ensureAudioContext(ctxRef), "set", sfxVolume);
        return;
      }
      if (goals > prev.goals && now - lastGoalAt.current > 180) {
        lastGoalAt.current = now;
        playSfx(ensureAudioContext(ctxRef), "goal", sfxVolume);
        return;
      }
      if (activeView === "transition" && prev.view !== "transition") {
        playSfx(ensureAudioContext(ctxRef), "switch", sfxVolume);
      }
    } catch {
      // Audio may be blocked until OBS enables source audio
    }
  }, [
    revision,
    scoreA,
    scoreB,
    setsA,
    setsB,
    activeView,
    sfxPing,
    sfxEnabled,
    sfxVolume,
    reduceMotion,
  ]);
}
