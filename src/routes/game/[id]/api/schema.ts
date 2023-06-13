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
        id: z.string().uuid()
    })
])

export const clientMessageSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('heartbeat'),
        id: z.string()
    }),
    z.object({
        type: z.literal('interact-region'),
        index: z.number().int()
    })
])
export type ServerMessage = z.infer<typeof serverMessageSchema>
export type ClientMessage = z.infer<typeof clientMessageSchema>


