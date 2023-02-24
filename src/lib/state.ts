import { z } from "zod";
import { hungaryMapInfo, type MapInfo } from "./mapInfo";




const fortRegionSchema = z.object({
    type: z.literal("fort"),
    ownerId: z.number().int().min(0).max(2),
    towersRemaining: z.number().int().min(0).max(2),
    value: z.number().int()
});
const normalRegionSchema = z.object({
    type: z.literal("normal"),
    ownerId: z.number().int().min(0).max(2),
    value: z.number().int()
});
const emptyRegionSchema = z.object({
    type: z.literal("empty")
});



const regionSchema = z.discriminatedUnion('type', [
    fortRegionSchema,
    normalRegionSchema,
    emptyRegionSchema
]);

const bazisfoglalasSchema = z.object({
    type: z.literal("bazisfoglalas"),
    player: z.number().min(0).max(2)
});

const terjeszkedesSchema = z.object({
    type: z.literal("terjeszkedes"),
    round: z.number().min(0).max(5)
});

const felosztasSchema = z.object({
    type: z.literal("felosztas"),
});

const haboruSchema = z.object({
    type: z.literal("haboru"),
    round: z.number().min(0).max(17)
});

const gameProgressScema = z.discriminatedUnion('type', [bazisfoglalasSchema, terjeszkedesSchema, felosztasSchema, haboruSchema]);

export const gameStateSchema = z.object({
    regions: z.array(regionSchema),
    gameProgress: gameProgressScema
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
            player: 0
        }
    };
}
