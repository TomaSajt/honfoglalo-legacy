import { z } from "zod"
import type { MapInfo } from "./mapInfo"

const fortRegionSchema = z.object({
    type: z.literal("fort"),
    ownerId: z.number().int().min(0).max(2),
    towersRemaining: z.number().int().min(0).max(2),
    value: z.number().int()
})
const normalRegionSchema = z.object({
    type: z.literal("normal"),
    ownerId: z.number().int().min(0).max(2),
    value: z.number().int()
})
const emptyRegionSchema = z.object({
    type: z.literal("empty")
});

const regionSchema = z.discriminatedUnion('type', [
    fortRegionSchema,
    normalRegionSchema,
    emptyRegionSchema
])

const gameStateSchema = z.object({
    mapId: z.string(),
    regions: z.array(regionSchema)
})

export type Region = z.infer<typeof regionSchema>
export type GameState = z.infer<typeof gameStateSchema>


export function defaultGameState(mapInfo: MapInfo): GameState {
    return {
        mapId: mapInfo.id,
        regions: Array(mapInfo.regions.length).fill(0).map(() => ({
            type: 'empty'
        }))
    }
}
