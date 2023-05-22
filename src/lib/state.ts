import { z } from "zod";
import { hungaryMapInfo } from "./mapInfo";

const fortRegionSchema = z.object({
    type: z.literal("fort"),
    player: z.number().int().min(0).max(2),
    towersRemaining: z.number().int().min(0).max(3),
    value: z.number().int()
});
const normalRegionSchema = z.object({
    type: z.literal("normal"),
    player: z.number().int().min(0).max(2),
    value: z.number().int()
});
const markedRegionSchema = z.object({
    type: z.literal("marked"),
    player: z.number().int().min(0).max(2)
});
const emptyRegionSchema = z.object({
    type: z.literal("empty")
});



const regionSchema = z.discriminatedUnion('type', [
    fortRegionSchema,
    normalRegionSchema,
    markedRegionSchema,
    emptyRegionSchema
]);


const bazisfoglalasSchema = z.object({
    type: z.literal("bazisfoglalas"),
    playerOrderIndex: z.number().int().min(0).max(2)
});

const terjeszkedesSchema = z.object({
    type: z.literal("terjeszkedes"),
    playerOrderIndex: z.number().int().min(0).max(2),
    round: z.number().int().min(0).max(5)
});

const terjeszkedesKerdesSchema = z.object({
    type: z.literal("terjeszkedes-kerdes"),
    round: z.number().int().min(0).max(5)
});

const felosztasKerdesSchema = z.object({
    type: z.literal("felosztas-kerdes"),
});

const felosztasSchema = z.object({
    type: z.literal("felosztas"),
    player: z.number().int().min(0).max(2)
});

const haboruSchema = z.object({
    type: z.literal("haboru"),
    playerOrderIndex: z.number().int().min(0).max(2),
    round: z.number().int().min(0).max(5)
});

const gameOverSchema = z.object({
    type: z.literal("game-over"),
});

const gameProgressScema = z.discriminatedUnion('type', [bazisfoglalasSchema, terjeszkedesSchema, terjeszkedesKerdesSchema, felosztasKerdesSchema, felosztasSchema, haboruSchema, gameOverSchema]);

export const gameStateSchema = z.object({
    regions: z.array(regionSchema),
    gameProgress: gameProgressScema,
    defendedCounts: z.array(z.number()).length(3),
});

export type Region = z.infer<typeof regionSchema>;
export type GameState = z.infer<typeof gameStateSchema>;
export type GameProgress = z.infer<typeof gameProgressScema>;


export function defaultGameState(): GameState {
    return {
        regions: Array(hungaryMapInfo.regions.length).fill(0).map(() => ({
            type: 'empty'
        })),
        gameProgress: {
            type: "bazisfoglalas",
            playerOrderIndex: 0
        },
        defendedCounts: [0, 0, 0]
    };
}


export function tryParseState(text: string) {
    try {
        let res = gameStateSchema.safeParse(JSON.parse(text));
        return res;
    } catch (e) {
        return {
            success: false,
            error: e
        } as const
    }
}
