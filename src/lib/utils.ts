import type { GameState } from "./state";

export function assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
        let errorMsg = "Assertion Error.";
        if (msg) errorMsg += ` Reason: ${msg}`;
        throw new Error(errorMsg);
    }
}

export function sleep(milliseconds: number) {
    return new Promise<void>(res => setTimeout(res, milliseconds))
}

export function calcScores(gameState: GameState) {
    let scores = [0, 0, 0];
    for (let region of gameState.regions) {
        if (region.type !== "fort" && region.type !== "normal") continue;
        scores[region.player] += region.value;
    }
    for (let i = 0; i < 3; i++) {
        scores[i] += 100 * gameState.defendedCounts[i];
    }
    return scores;
}


export function getHungarianGameProgressName(gameState: GameState) {
    let type = gameState.gameProgress.type;
    if (type === "bazisfoglalas") return "Bázisfoglalás"
    if (type === 'terjeszkedes') return "Terjeszkedés"
    if (type === 'terjeszkedes-kerdes') return "Terjeszkedés (kérdés)"
    if (type === 'felosztas-kerdes') return 'Felosztás (kérdés)'
    if (type === 'felosztas') return "Felosztás"
    if (type === 'haboru') return "Háború"
    if (type === 'game-over') return "Vége a játéknak!"
    return "Ismeretlen játékállapot!"
}