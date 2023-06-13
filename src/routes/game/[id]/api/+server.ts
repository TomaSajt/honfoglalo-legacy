import { sleep } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clientMessageSchema, type ServerMessage } from './schema';
import { v4 as uuidv4 } from 'uuid'
import { handleBazisfoglalas, handleFelosztasValasztas, handleTerjeszkedesValasztas } from '$lib/game';
import { makeEmptyGameState } from '$lib/state';


let gameState = makeEmptyGameState()

const idToControllerMap = new Map<string, ReadableStreamDefaultController<any>>()
const waitingForHeartbeat = new Set<string>()

async function heartbeatLoop(id: string) {
    await sleep(5000)
    const controller = idToControllerMap.get(id)
    if (!controller) {
        console.log("Stopped sending heartbeat requests to client with id " + id)
        return
    }
    waitingForHeartbeat.add(id)
    sendMessage(controller, { type: 'heartbeat-request' })
    await sleep(10000)
    if (waitingForHeartbeat.has(id)) {
        controller.close()
        idToControllerMap.delete(id)
        console.log(`Didn't receive heartbeat in time from client with id ${id}`)
        return
    }
    await heartbeatLoop(id)
}

function broadcastMessage(serverMessage: ServerMessage) {
    for (let [id, controller] of idToControllerMap) {
        sendMessage(controller, serverMessage)
    }
}

function sendMessage(controller: ReadableStreamDefaultController<any>, serverMessage: ServerMessage) {
    controller.enqueue(`data:${JSON.stringify(serverMessage)}\n\n`)
}

export const GET: RequestHandler = async () => {
    let id = uuidv4()
    let stream = new ReadableStream({
        async start(controller) {
            console.log(`assigned new client with ${id}`)
            idToControllerMap.set(id, controller)
            sendMessage(controller, { type: "set-identity", id })
            heartbeatLoop(id)
        },
        cancel() {
            console.log("Closed connection with client with id " + id)
            idToControllerMap.delete(id)
            waitingForHeartbeat.delete(id)
        }
    })
    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } })
};

export const POST: RequestHandler = async ({ request }) => {
    let json = await request.json()
    let parseRes = clientMessageSchema.safeParse(json)
    if (!parseRes.success) {
        throw error(400)
    }
    let message = parseRes.data
    if (message.type === 'heartbeat') {
        waitingForHeartbeat.delete(message.id)
        console.log(`Got heartbeat from client with id ${message.id}`)
        return new Response("ok")
    }
    else if (message.type === 'interact-region') {
        const index = message.index
        console.log(`Client clicked region with index ${index}`)
        switch (gameState.gameProgress.phase) {
            case "bazisfoglalas":
                handleBazisfoglalas(gameState, index);
                break;
            case "terjeszkedes-valasztas":
                handleTerjeszkedesValasztas(gameState, index);
                break;
            case "terjeszkedes-kerdes":
                throw error(400, "Indítsd el a kérdést a folytatáshoz");
            case "felosztas-kerdes":
                throw error(400, "Indítsd el a kérdést a folytatáshoz");
            case "felosztas-valasztas":
                handleFelosztasValasztas(gameState, index);
                break;
            case "haboru":
                throw error(400, "Nincs implementálva");
            case "game-over":
                throw error(400, "A játéknak már vége van");
        }
        broadcastMessage({ type: 'set-state', state: gameState })
        return new Response("ok")
    }
    throw error(400)
}