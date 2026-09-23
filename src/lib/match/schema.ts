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

export const teamNameSchema = z
  .string()
  .trim()
  .min(1, "Teamname darf nicht leer sein")
  .max(32, "Maximal 32 Zeichen");

export const createRoomSchema = z.object({
  pin: z
    .string()
    .regex(/^\d{4,6}$/, "PIN muss 4–6 Ziffern haben")
    .optional(),
  teamA: z
    .string()
    .trim()
    .min(1, "Team A: Name eingeben")
    .max(32, "Team A: Maximal 32 Zeichen"),
  teamB: z
    .string()
    .trim()
    .min(1, "Team B: Name eingeben")
    .max(32, "Team B: Maximal 32 Zeichen"),
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
    name: z.string().trim().min(1).max(32),
  }),
  z.object({
    type: z.literal("timer"),
    action: z.enum(["start", "pause", "reset"]),
  }),
  z.object({ type: z.literal("resetMatch") }),
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
]);

/** Single source of truth for RoomMutation — Zod schema, not a hand-written twin. */
export type RoomMutation = z.infer<typeof mutationSchema>;
