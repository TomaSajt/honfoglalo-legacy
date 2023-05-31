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


export function getHungarianGameProgressPhaseName(gameState: GameState) {
    let phase = gameState.gameProgress.phase;
    if (phase === "bazisfoglalas") return "Bázisfoglalás"
    if (phase === 'terjeszkedes-valasztas') return "Terjeszkedés (választás)"
    if (phase === 'terjeszkedes-kerdes') return "Terjeszkedés (kérdés)"
    if (phase === 'felosztas-kerdes') return 'Felosztás (kérdés)'
    if (phase === 'felosztas-valasztas') return "Felosztás (választás)"
    if (phase === 'haboru') return "Háború"
    if (phase === 'game-over') return "Játék vége"
    throw new Error("Ismeretlen játékfázis!")
}