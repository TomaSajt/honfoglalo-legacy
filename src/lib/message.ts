import { gameStateSchema } from "$lib/state"
import { z } from "zod"

export const serverMessageSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('set-state'),
        state: gameStateSchema
    }),
    z.object({
        type: z.literal("heartbeat-request")
    }),
    z.object({
        type: z.literal("set-identity"),
        id: z.string().uuid(),
        playerId: z.number().int().min(0).max(2),
        state: gameStateSchema
    }),
    z.object({
        type: z.literal("back-to-lobby")
    }),
    z.object({
        type: z.literal("show-message"),
        message: z.string()
    })
])

export const clientMessageSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('heartbeat'),
        clientId: z.string().uuid()
    }),
    z.object({
        type: z.literal('interact-region'),
        clientId: z.string().uuid(),
        index: z.number().int(),
    }),
    z.object({
        type: z.literal("choose-option"),
        clientId: z.string().uuid(),
        optionIndex: z.number().int().min(0).max(3)
    })
])
export type ServerMessage = z.infer<typeof serverMessageSchema>
export type ClientMessage = z.infer<typeof clientMessageSchema>


