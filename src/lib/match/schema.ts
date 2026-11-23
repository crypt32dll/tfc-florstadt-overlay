import { z } from "zod";

/** Destination screens operators can request (excludes mid-sting "transition"). */
export const DESTINATION_VIEWS = [
  "startingSoon",
  "live",
  "standings",
  "brb",
  "ending",
] as const;

export const destinationViewSchema = z.enum(DESTINATION_VIEWS);
export type DestinationView = z.infer<typeof destinationViewSchema>;

export const matchFormatSchema = z.enum(["bestOf3", "bestOf5"]);
export type MatchFormat = z.infer<typeof matchFormatSchema>;

export const teamSideSchema = z.enum(["a", "b"]);
export type TeamSide = z.infer<typeof teamSideSchema>;

export const overlayMessageSlotSchema = z.enum(["starting", "brb", "ending"]);
export type OverlayMessageSlot = z.infer<typeof overlayMessageSlotSchema>;

export const KICKER_COLORS = [
  "black",
  "white",
  "green",
  "blue",
  "red",
] as const;
export const kickerColorSchema = z.enum(KICKER_COLORS);
export type KickerColor = z.infer<typeof kickerColorSchema>;

export const teamNameSchema = z
  .string()
  .trim()
  .min(1, "Teamname darf nicht leer sein")
  .max(40, "Maximal 40 Zeichen");

const teamLogoSchema = z.string().url().max(512).nullable().optional();

export const createRoomSchema = z.object({
  teamA: z
    .string()
    .trim()
    .min(1, "Team A: Name eingeben")
    .max(40, "Team A: Maximal 40 Zeichen")
    .default("TFC Florstadt 1"),
  teamB: z
    .string()
    .trim()
    .min(1, "Gegner: Name eingeben")
    .max(40, "Gegner: Maximal 40 Zeichen"),
  teamAColor: kickerColorSchema.optional(),
  teamBColor: kickerColorSchema.optional(),
  teamALogo: teamLogoSchema,
  teamBLogo: teamLogoSchema,
  /** When false and a live room already exists, createRoom returns LIVE_ACTIVE. */
  retargetLive: z.boolean().optional().default(false),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const verifyPinSchema = z.object({
  roomId: z.string().min(4).max(32),
  pin: z.string().regex(/^\d{4,6}$/),
});

export const mutationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("goal"),
    side: teamSideSchema,
    delta: z.union([z.literal(1), z.literal(-1)]),
  }),
  z.object({
    type: z.literal("setName"),
    side: teamSideSchema,
    name: z.string().trim().min(1).max(40),
  }),
  z.object({
    type: z.literal("setTeamLogo"),
    side: teamSideSchema,
    logoUrl: z.string().url().max(512).nullable(),
  }),

  z.object({
    type: z.literal("timer"),
    action: z.enum(["start", "pause", "reset"]),
  }),
  z.object({ type: z.literal("resetMatch") }),
  z.object({
    type: z.literal("newMatch"),
    teamA: z.string().trim().min(1).max(40).optional(),
    teamB: z.string().trim().min(1).max(40),
    teamAColor: kickerColorSchema.optional(),
    teamBColor: kickerColorSchema.optional(),
    teamALogo: teamLogoSchema,
    teamBLogo: teamLogoSchema,
    matchFormat: matchFormatSchema.optional(),
  }),
  z.object({ type: z.literal("finishMatch") }),
  z.object({ type: z.literal("finishSet") }),
  z.object({
    type: z.literal("setView"),
    view: destinationViewSchema,
  }),
  z.object({ type: z.literal("transitionComplete") }),
  z.object({
    type: z.literal("setOverlayMessage"),
    slot: overlayMessageSlotSchema,
    message: z.string().trim().max(80).nullable(),
  }),
  z.object({ type: z.literal("swapSides") }),
  z.object({
    type: z.literal("setMatchFormat"),
    format: matchFormatSchema,
  }),
  z.object({
    type: z.literal("setSfx"),
    enabled: z.boolean().optional(),
    volume: z.number().min(0).max(1).optional(),
  }),
  z.object({ type: z.literal("sfxTest") }),
  z.object({
    type: z.literal("setLineupIndex"),
    index: z.number().int().min(0).max(9),
  }),
  z.object({
    type: z.literal("editHistory"),
    index: z.number().int().min(0).max(19),
    teamA: z.string().trim().min(1).max(40).optional(),
    teamB: z.string().trim().min(1).max(40).optional(),
    scoreA: z.number().int().min(0).max(9).optional(),
    scoreB: z.number().int().min(0).max(9).optional(),
    remove: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("setTeamColor"),
    side: teamSideSchema,
    color: kickerColorSchema,
  }),
]);

/** Single source of truth for RoomMutation — Zod schema, not a hand-written twin. */
export type RoomMutation = z.infer<typeof mutationSchema>;
