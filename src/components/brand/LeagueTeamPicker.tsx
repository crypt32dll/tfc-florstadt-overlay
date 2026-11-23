"use client";

import { type Ref, useEffect, useId, useMemo, useRef, useState } from "react";
import { getLeagueTeams } from "@/app/actions/league";
import { TeamCrest } from "@/components/brand/TeamCrest";
import {
  LEAGUE_TEAMS_FALLBACK,
  type LeagueTeam,
} from "@/lib/tfvh/parse-league-teams";

type Props = {
  label: string;
  name: string;
  value: string;
  logoUrl: string | null;
  onChange: (next: { name: string; logoUrl: string | null }) => void;
  /** Drop teams whose name includes this (case-insensitive), e.g. Florstadt for opponent. */
  excludeNameIncludes?: string;
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
  placeholder?: string;
};

export function LeagueTeamPicker({
  label,
  name: fieldName,
  value,
  logoUrl,
  onChange,
  excludeNameIncludes,
  error,
  inputRef,
  placeholder = "Teamname…",
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [teams, setTeams] = useState<LeagueTeam[]>(LEAGUE_TEAMS_FALLBACK);
  const [source, setSource] = useState<"live" | "fallback" | "loading">(
    "loading",
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let cancelled = false;
    void getLeagueTeams().then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setTeams(res.data.teams);
        setSource(res.data.source);
      } else {
        setTeams(LEAGUE_TEAMS_FALLBACK);
        setSource("fallback");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const options = useMemo(() => {
    const needle = excludeNameIncludes?.trim().toLowerCase();
    if (!needle) return teams;
    return teams.filter((t) => !t.name.toLowerCase().includes(needle));
  }, [teams, excludeNameIncludes]);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options;
    return options.filter((t) => t.name.toLowerCase().includes(q));
  }, [options, value]);

  const pick = (team: LeagueTeam) => {
    onChange({ name: team.name, logoUrl: team.logoUrl });
    setOpen(false);
    setActiveIndex(-1);
  };

  const assignInputRef = (node: HTMLInputElement | null) => {
    if (typeof inputRef === "function") inputRef(node);
    else if (inputRef && "current" in inputRef) {
      (inputRef as { current: HTMLInputElement | null }).current = node;
    }
  };

  return (
    <div className="space-y-1.5" ref={rootRef}>
      <label className="block space-y-1.5 text-sm text-muted">
        {label}
        <div className="flex items-center gap-2">
          <TeamCrest src={logoUrl} alt="" size={32} className="shadow-sm" />
          <div className="relative min-w-0 flex-1">
            <input
              ref={assignInputRef}
              name={fieldName}
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                activeIndex >= 0 && filtered[activeIndex]
                  ? `${listId}-opt-${filtered[activeIndex].id}`
                  : undefined
              }
              autoComplete="off"
              value={value}
              maxLength={40}
              onChange={(e) => {
                const nextName = e.target.value;
                const hit = options.find(
                  (t) => t.name.toLowerCase() === nextName.trim().toLowerCase(),
                );
                onChange({
                  name: nextName,
                  logoUrl: hit?.logoUrl ?? null,
                });
                setOpen(true);
                setActiveIndex(-1);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                  setOpen(true);
                  return;
                }
                if (!open) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((i) =>
                    Math.min(i + 1, Math.max(filtered.length - 1, 0)),
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && activeIndex >= 0) {
                  const hit = filtered[activeIndex];
                  if (hit) {
                    e.preventDefault();
                    pick(hit);
                  }
                } else if (e.key === "Escape") {
                  setOpen(false);
                  setActiveIndex(-1);
                }
              }}
              placeholder={placeholder}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${fieldName}-error` : undefined}
              className={`glass-input w-full text-base text-white ${
                error ? "border-red-400/60" : ""
              }`}
            />

            {open && filtered.length > 0 && (
              <div
                id={listId}
                role="listbox"
                className="absolute top-full right-0 left-0 z-30 mt-1 max-h-56 overflow-auto rounded-[var(--radius-control)] border border-[var(--glass-border)] bg-[rgba(8,12,20,0.96)] py-1 shadow-lg backdrop-blur-md"
              >
                {filtered.map((t, index) => {
                  const active = index === activeIndex;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      id={`${listId}-opt-${t.id}`}
                      role="option"
                      aria-selected={active || t.name === value}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white ${
                        active
                          ? "bg-[var(--brand-accent-soft)]"
                          : "hover:bg-white/10"
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(t);
                      }}
                    >
                      <TeamCrest
                        src={t.logoUrl}
                        alt=""
                        size={22}
                        className="shrink-0"
                      />
                      <span className="truncate">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </label>

      {error && (
        <p
          id={`${fieldName}-error`}
          role="alert"
          className="text-xs text-red-300"
        >
          {error}
        </p>
      )}
      {source === "fallback" && (
        <p className="text-[0.65rem] text-muted">
          Offline-Liste (TFVH gerade nicht erreichbar).
        </p>
      )}
    </div>
  );
}
