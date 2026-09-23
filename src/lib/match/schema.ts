import { z } from "zod";

export const teamSideSchema = z.enum(["a", "b"]);

export const createRoomSchema = z.object({
  pin: z
    .string()
    .regex(/^\d{4,6}$/, "PIN muss 4–6 Ziffern haben")
    .optional(),
  teamA: z.string().trim().max(32).optional(),
  teamB: z.string().trim().max(32).optional(),
});

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
  z.object({
    type: z.literal("setView"),
    view: z.enum(["startingSoon", "live", "standings"]),
  }),
  z.object({ type: z.literal("transitionComplete") }),
  z.object({
    type: z.literal("setStartingMessage"),
    message: z.string().trim().max(80).nullable(),
  }),
  z.object({ type: z.literal("swapSides") }),
  z.object({
    type: z.literal("setTargetScore"),
    targetScore: z.number().int().min(1).max(99).nullable(),
  }),
]);

export type MutationInput = z.infer<typeof mutationSchema>;
