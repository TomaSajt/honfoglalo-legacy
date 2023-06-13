import { z } from "zod";
import { hungaryMapInfo } from "./mapInfo";


export const regionSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal("fort"),
        player: z.number().int().min(0).max(2),
        towersRemaining: z.number().int().min(0).max(3),
        value: z.number().int()
    }),
    z.object({
        type: z.literal("normal"),
        player: z.number().int().min(0).max(2),
        value: z.number().int()
    }),
    z.object({
        type: z.literal("marked"),
        player: z.number().int().min(0).max(2)
    }),
    z.object({
        type: z.literal("empty")
    })
]);

export const gameProgressScema = z.discriminatedUnion('phase', [
    z.object({
        phase: z.literal("bazisfoglalas"),
        playerOrderIndex: z.number().int().min(0).max(2)
    }),
    z.object({
        phase: z.literal("terjeszkedes-valasztas"),
        playerOrderIndex: z.number().int().min(0).max(2),
        round: z.number().int().min(0).max(5)
    }),
    z.object({
        phase: z.literal("terjeszkedes-kerdes"),
        round: z.number().int().min(0).max(5)
    }),
    z.object({
        phase: z.literal("felosztas-kerdes"),
    }),
    z.object({
        phase: z.literal("felosztas-valasztas"),
        player: z.number().int().min(0).max(2)
    }),
    z.object({
        phase: z.literal("haboru"),
        playerOrderIndex: z.number().int().min(0).max(2),
        round: z.number().int().min(0).max(5)
    }),
    z.object({
        phase: z.literal("game-over"),
    })
]);

export const gameStateSchema = z.object({
    startTimestamp: z.number().int(),
    regions: z.array(regionSchema),
    gameProgress: gameProgressScema,
    defendedCounts: z.array(z.number()).length(3),
});

export type Region = z.infer<typeof regionSchema>;
export type GameState = z.infer<typeof gameStateSchema>;
export type GameProgress = z.infer<typeof gameProgressScema>;


export function makeEmptyGameState(): GameState {
    return {
        startTimestamp: Date.now(),
        regions: Array(hungaryMapInfo.regions.length).fill(0).map(() => ({
            type: 'empty'
        })),
        gameProgress: {
            phase: "bazisfoglalas",
            playerOrderIndex: 0
        },
        defendedCounts: [0, 0, 0]
    };
}


export function tryParseState(text: string) {
    try {
        return gameStateSchema.safeParse(JSON.parse(text));
    } catch (e) {
        return {
            success: false,
            error: e
        } as const
    }
}
