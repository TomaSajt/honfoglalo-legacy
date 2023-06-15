import { assert, sleep } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clientMessageSchema, type ServerMessage } from '$lib/message';
import { v4 as uuidv4 } from 'uuid'
import { bazisfoglalasPlayerOrder, handleBazisfoglalas, handleFelosztasValasztas, handleTerjeszkedesValasztas } from '$lib/game';
import { makeEmptyGameState, type GameState } from '$lib/state';
import { playerIdToHungarianName } from '$lib/player';

type StreamController = ReadableStreamDefaultController<string>

type ClientInfo = {
    readonly id: string
    readonly controller: StreamController
    readonly gameId: string
    readonly playerIndex: number
    waitingForHeartbeat: boolean
}

type GameInfo = {
    readonly id: string
    readonly playerClientIds: [string | undefined, string | undefined, string | undefined]
    readonly gameState: GameState
}

const clients = new Map<string, ClientInfo>()

const games = new Map<string, GameInfo>()

async function heartbeatLoop(id: string) {
    await sleep(5000)
    let client = clients.get(id)
    if (!client) {
        console.log("Client already disconnected, stopping heartbeat")
        return
    }
    client.waitingForHeartbeat = true;
    sendMessage(client, { type: 'heartbeat-request' })
    await sleep(10000)
    client = clients.get(id)
    if (!client) {
        console.log("Client already disconnected, stopping heartbeat")
        return
    }
    if (client.waitingForHeartbeat) {
        removeClient(client)
        console.log(`Didn't receive heartbeat in time from client with id ${id}`)
        return
    }
    await heartbeatLoop(id)
}

function getOrCreateGame(id: string): GameInfo {
    let game = games.get(id)
    if (game) return game
    game = {
        id,
        gameState: makeEmptyGameState(),
        playerClientIds: [undefined, undefined, undefined]
    }
    games.set(id, game)
    return game
}


function broadcastMessage(game: GameInfo, serverMessage: ServerMessage) {
    for (let clientId of game.playerClientIds) {
        if (clientId === undefined) continue;
        const client = clients.get(clientId)
        assert(client)
        sendMessage(client, serverMessage)
    }
}

function sendMessage(client: ClientInfo, serverMessage: ServerMessage) {
    sendMessageToController(client.controller, serverMessage)
}

function sendMessageToController(controller: StreamController, serverMessage: ServerMessage) {
    controller.enqueue(`data:${JSON.stringify(serverMessage)}\n\n`)
}

function removeClient(client: ClientInfo) {
    try { client.controller.close() }
    catch { }
    clients.delete(client.id)
    const game = games.get(client.gameId)
    assert(game)
    let playerId = game.playerClientIds.findIndex(id => id === client.id)
    assert(playerId !== -1)
    game.playerClientIds[playerId] = undefined
}

export const GET: RequestHandler = async ({ params }) => {
    let clientId = uuidv4()
    let stream = new ReadableStream<string>({
        start(controller) {
            const game = getOrCreateGame(params.gameId)
            let playerId = game.playerClientIds.findIndex(id => id === undefined)
            if (playerId === -1) {
                sendMessageToController(controller, { type: "back-to-lobby" })
                return
            }
            const client = {
                id: clientId,
                gameId: params.gameId,
                controller,
                playerIndex: 0,
                waitingForHeartbeat: false
            }
            game.playerClientIds[playerId] = clientId
            clients.set(clientId, client)
            console.log(`assigned new client with ${clientId}`)
            sendMessage(client, { type: "set-identity", id: clientId, playerId, state: game.gameState })
            heartbeatLoop(clientId)
        },
        cancel() {
            const client = clients.get(clientId)
            assert(client)
            removeClient(client)
            console.log("Closed connection with client with id " + clientId)
        }
    })
    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } })
};





export const POST: RequestHandler = async ({ request, params }) => {
    const json = await request.json()
    const parseRes = clientMessageSchema.safeParse(json)
    if (!parseRes.success) {
        throw error(400)
    }
    const message = parseRes.data
    const client = clients.get(message.clientId)
    if (!client) {
        console.log("Got message from unknown client")
        throw error(403, "Unknown client id")
    }

    const game = games.get(params.gameId)
    if (!game) {
        throw error(403, "This game does not exist")
    }

    let clientPlayerId = game.playerClientIds.findIndex(id => id === client.id)
    if (clientPlayerId === -1) {
        throw error(403, "You are not a participant in this game")
    }

    console.log(`Got message from client with id ${message.clientId}`)
    console.log(message)
    console.log("color: " + playerIdToHungarianName(clientPlayerId))
    if (message.type === 'heartbeat') {
        client.waitingForHeartbeat = false
        return new Response("ok")
    }
    if (message.type === 'interact-region') {
        const index = message.index
        const gameState = game.gameState
        console.log(`Client clicked region with index ${index}`)
        switch (gameState.gameProgress.phase) {
            case "bazisfoglalas": {
                let playerOrderIndex = gameState.gameProgress.playerOrderIndex
                let playerId = bazisfoglalasPlayerOrder[playerOrderIndex]
                if (playerId !== clientPlayerId) {
                    sendMessage(client, { type: "show-message", message: "Nem te jösz!" })
                    throw error(403)
                }
                handleBazisfoglalas(gameState, index);
                break;
            }
            case "terjeszkedes-valasztas": {
                handleTerjeszkedesValasztas(gameState, index);
                break;
            }
            case "terjeszkedes-kerdes":
                throw error(400);
            case "felosztas-kerdes":
                throw error(400);
            case "felosztas-valasztas": {
                handleFelosztasValasztas(gameState, index);
                break;
            }
            case "haboru":
                throw error(400);
            case "game-over":
                throw error(400);
        }
        broadcastMessage(game, { type: 'set-state', state: gameState })
        return new Response("ok")
    }
    throw error(400)
}