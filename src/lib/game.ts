import { getRegionIndexFromId, hungaryMapInfo } from "./mapInfo";
import type { GameState } from "./state";
import { assert, sleep } from "./utils";

export const bazisfoglalasPlayerOrder = [0, 1, 2];

export const playerOrders = [
    [0, 1, 2],
    [1, 2, 0],
    [2, 0, 1],
    [0, 2, 1],
    [1, 0, 2],
    [2, 1, 0],
];

type QuestionPrompterBase = {
    guess: (playerList: number[]) => Promise<number[]>
    choice: (playerList: number[]) => Promise<number[]>
}


export function handleBazisfoglalas(gameState: GameState, index: number, warn: (str: string) => any) {
    assert(gameState.gameProgress.phase === "bazisfoglalas");
    let neighbourhood = [index, ...getNeighbourIndices(index)];
    if (neighbourhood.some((i) => gameState.regions[i].type != "empty")) {
        warn(
            "Csak más játékossal nem szomszédos vármegyéket foglalhatsz el"
        );
        return;
    }
    let playerOrderIndex = gameState.gameProgress.playerOrderIndex;
    let currentPlayer = bazisfoglalasPlayerOrder[playerOrderIndex];

    gameState.regions[index] = {
        player: currentPlayer,
        type: "fort",
        towersRemaining: 3,
        value: 1000,
    };
    if (gameState.gameProgress.playerOrderIndex === 2) {
        gameState.gameProgress = {
            phase: "terjeszkedes-valasztas",
            playerOrderIndex: 0,
            round: 0,
        };
    } else {
        gameState.gameProgress.playerOrderIndex++;
    }
}


export function handleTerjeszkedesValasztas(gameState: GameState, index: number, warn: (str: string) => any) {
    assert(gameState.gameProgress.phase === "terjeszkedes-valasztas");
    if (gameState.regions[index].type !== "empty") {
        warn("Csak szabad vármegyéket jelölhetsz meg");
        return;
    }
    let round = gameState.gameProgress.round;
    let playerOrderIndex = gameState.gameProgress.playerOrderIndex;

    let player = playerOrders[round][playerOrderIndex];
    let neigbourIndices = getPlayerReachableRegionIndices(gameState, player);
    let emptyNeighbourCount = neigbourIndices.filter(
        (i) => gameState.regions[i].type === "empty"
    ).length;
    if (emptyNeighbourCount !== 0 && !neigbourIndices.includes(index)) {
        warn(
            "Csak az elfoglalt területeddel szomszédos vármegyéket jelölhetsz meg"
        );
        return;
    }
    gameState.regions[index] = {
        type: "marked",
        player: player,
    };
    if (gameState.gameProgress.playerOrderIndex < 2) {
        gameState.gameProgress.playerOrderIndex++;
    } else {
        gameState.gameProgress = {
            phase: "terjeszkedes-kerdes",
            round: gameState.gameProgress.round,
            options: ["A", "B", "C", "D"],
            question: "Melyik az ABC harmadik betűje?",
            submitted: [false, false, false],
            submissions: [undefined, undefined, undefined],
            solutionIndex: 2
        };
    }
}

export function handleFelosztasValasztas(gameState: GameState, index: number) {
    assert(gameState.gameProgress.phase === "felosztas-valasztas");
    if (gameState.regions[index].type !== "empty") {
        alert("Csak szabad vármegyéket jelölhetsz meg");
        return;
    }

    let player = gameState.gameProgress.player;
    let neigbourIndices = getPlayerReachableRegionIndices(gameState, player);
    let bypassNeighbourConstraint =
        neigbourIndices.filter(
            (i) => gameState.regions[i].type === "empty"
        ).length === 0;
    if (!bypassNeighbourConstraint && !neigbourIndices.includes(index)) {
        alert(
            "Csak az elfoglalt területeddel szomszédos vármegyéket jelölhetsz meg"
        );
        return;
    }

    gameState.regions[index] = {
        type: "normal",
        value: 300,
        player: player,
    };

    if (gameState.regions.filter((x) => x.type === "empty").length !== 0) {
        gameState.gameProgress = {
            phase: "felosztas-kerdes",
        };
    } else {
        gameState.gameProgress = {
            phase: "haboru",
            playerOrderIndex: 0,
            round: 0,
        };
    }
}

export async function handleHaboru(gameState: GameState, prompter: QuestionPrompterBase, index: number) {
    let region = gameState.regions[index];
    assert(gameState.gameProgress.phase === "haboru");
    assert(region.type === "normal" || region.type === "fort");
    let round = gameState.gameProgress.round;
    let playerOrderIndex = gameState.gameProgress.playerOrderIndex;
    let player = playerOrders[round][playerOrderIndex];

    let neigbourIndices = getPlayerReachableRegionIndices(gameState, player);

    if (round !== 5 && !neigbourIndices.includes(index)) {
        alert(
            "Csak az elfoglalt területeddel szomszédos vármegyéket támadhatod meg"
        );
        return;
    }
    if (region.player === player) {
        alert("Csak más által birtokolt vármegyét támadhatsz meg");
        return;
    }

    if (region.type === "normal") {
        await startHaboruKerdesNormalFeleletvalasztos(gameState, prompter, index);
    } else {
        await startHaboruKerdesFortFeleletvalasztos(gameState, prompter, index);
    }
    progressHaboru(gameState);
}

export async function handleTerjeszkedesKerdes(gameState: GameState, prompter: QuestionPrompterBase) {
    assert(gameState.gameProgress.phase === "terjeszkedes-kerdes");
    let correct = await prompter.choice([0, 1, 2]);
    for (let i = 0; i < gameState.regions.length; i++) {
        let region = gameState.regions[i];
        if (region.type !== "marked") continue;
        if (correct.includes(region.player)) {
            gameState.regions[i] = {
                type: "normal",
                player: region.player,
                value: 200,
            };
        } else {
            gameState.regions[i] = {
                type: "empty",
            };
        }
    }
    let emptyCount = gameState.regions.filter(
        (x) => x.type === "empty"
    ).length;
    if (emptyCount >= 3 && gameState.gameProgress.round < 5) {
        gameState.gameProgress = {
            phase: "terjeszkedes-valasztas",
            playerOrderIndex: 0,
            round: gameState.gameProgress.round + 1,
        };
    } else if (emptyCount > 0) {
        gameState.gameProgress = {
            phase: "felosztas-kerdes",
        };
    } else {
        gameState.gameProgress = {
            phase: "haboru",
            round: 0,
            playerOrderIndex: 0,
        };
    }
}


export async function startFelosztasKerdes(gameState: GameState, prompter: QuestionPrompterBase) {
    assert(gameState.gameProgress.phase === "felosztas-kerdes");
    let order = await prompter.guess([0, 1, 2]);
    gameState.gameProgress = {
        phase: "felosztas-valasztas",
        player: order[0],
    };
}

async function startHaboruKerdesNormalFeleletvalasztos(gameState: GameState, prompter: QuestionPrompterBase, index: number) {
    let region = gameState.regions[index];
    assert(gameState.gameProgress.phase === "haboru");
    assert(region.type === "normal");
    let round = gameState.gameProgress.round;
    let playerOrderIndex = gameState.gameProgress.playerOrderIndex;
    let attacker = playerOrders[round][playerOrderIndex];
    let defender = region.player;
    let correct = await prompter.choice([attacker, defender].sort());
    if (correct.length == 2) {
        await sleep(500);
        startHaboruKerdesNormalTipp(gameState, prompter, index);
        return;
    }
    if (correct.length == 1) {
        let winner = correct[0];
        if (winner === attacker) {
            gameState.regions[index] = {
                type: "normal",
                player: attacker,
                value: 400,
            };
        } else {
            awardDefendedBonus(gameState, defender);
        }
    }
}

async function startHaboruKerdesNormalTipp(gameState: GameState, prompter: QuestionPrompterBase, index: number) {
    let region = gameState.regions[index];
    assert(gameState.gameProgress.phase === "haboru");
    assert(region.type === "normal");
    let round = gameState.gameProgress.round;
    let playerOrderIndex = gameState.gameProgress.playerOrderIndex;
    let attacker = playerOrders[round][playerOrderIndex];
    let defender = region.player;
    let order = await prompter.guess([attacker, defender].sort());
    let winner = order[0];
    if (winner === attacker) {
        gameState.regions[index] = {
            type: "normal",
            player: attacker,
            value: 400,
        };
    } else {
        awardDefendedBonus(gameState, defender);
    }
}

async function startHaboruKerdesFortFeleletvalasztos(gameState: GameState, prompter: QuestionPrompterBase, index: number) {
    let region = gameState.regions[index];
    assert(gameState.gameProgress.phase === "haboru");
    assert(region.type === "fort");
    let round = gameState.gameProgress.round;
    let playerOrderIndex = gameState.gameProgress.playerOrderIndex;
    let attacker = playerOrders[round][playerOrderIndex];
    let defender = region.player;
    let correct = await prompter.choice([attacker, defender].sort());
    if (correct.length == 2) {
        await sleep(500);
        await startHaboruKerdesFortTipp(gameState, prompter, index);
        return;
    }
    if (correct.length == 1) {
        let winner = correct[0];
        if (winner === attacker) {
            let alreadyDestroyed = region.towersRemaining === 0;
            damageFort(gameState, index);
            region = gameState.regions[index];
            assert(region.type === "fort");
            if (region.towersRemaining > 0) {
                await sleep(1000);
                await startHaboruKerdesFortFeleletvalasztos(gameState, prompter, index);
                return;
            }
            if (alreadyDestroyed) {
                gameState.regions[index] = {
                    ...region,
                    player: attacker,
                };
            } else {
                transferRegionOwnerships(gameState, defender, attacker);
            }
        } else {
            awardDefendedBonus(gameState, defender);
        }
    }
}

function transferRegionOwnerships(gameState: GameState, fromPlayer: number, toPlayer: number) {
    for (let i = 0; i < gameState.regions.length; i++) {
        let region = gameState.regions[i];
        if (region.type !== "normal" && region.type !== "fort") continue;
        if (region.player !== fromPlayer) continue;
        gameState.regions[i] = {
            ...region,
            player: toPlayer,
        };
    }
    gameState.defendedCounts[toPlayer] +=
        gameState.defendedCounts[fromPlayer];
    gameState.defendedCounts[fromPlayer] = 0;
}

async function startHaboruKerdesFortTipp(gameState: GameState, prompter: QuestionPrompterBase, index: number) {
    let region = gameState.regions[index];
    assert(gameState.gameProgress.phase === "haboru");
    assert(region.type === "fort");
    let round = gameState.gameProgress.round;
    let playerOrderIndex = gameState.gameProgress.playerOrderIndex;
    let attacker = playerOrders[round][playerOrderIndex];
    let defender = region.player;
    let order = await prompter.guess(
        [attacker, defender].sort()
    );
    let winner = order[0];
    if (winner === attacker) {
        let alreadyDestroyed = region.towersRemaining === 0;
        damageFort(gameState, index);
        region = gameState.regions[index];
        assert(region.type === "fort");
        if (region.towersRemaining > 0) {
            await sleep(500);
            await startHaboruKerdesFortFeleletvalasztos(gameState, prompter, index);
            return;
        }
        if (alreadyDestroyed) {
            gameState.regions[index] = {
                ...region,
                player: attacker,
            };
        } else {
            transferRegionOwnerships(gameState, defender, attacker);
        }
    } else {
        awardDefendedBonus(gameState, defender);
    }
}

function damageFort(gameState: GameState, index: number) {
    let region = gameState.regions[index];
    assert(region.type === "fort");
    let newTowers = Math.max(0, region.towersRemaining - 1);
    gameState.regions[index] = {
        ...region,
        towersRemaining: newTowers,
    };
}

function awardDefendedBonus(gameState: GameState, player: number) {
    gameState.defendedCounts[player]++;
}

function progressHaboru(gameState: GameState) {
    assert(gameState.gameProgress.phase === "haboru");
    if (gameState.gameProgress.playerOrderIndex < 2)
        gameState.gameProgress.playerOrderIndex++;
    else {
        gameState.gameProgress.playerOrderIndex = 0;
        if (gameState.gameProgress.round < 5)
            gameState.gameProgress.round++;
        else {
            gameState.gameProgress = {
                phase: "game-over",
            };
        }
    }
    assert(gameState.gameProgress.phase === "haboru");
    let playersInGame = new Set<number>();
    for (let region of gameState.regions) {
        if (region.type !== "fort" && region.type !== "normal") continue;
        playersInGame.add(region.player);
    }

    let round = gameState.gameProgress.round;
    let playerOrderIndex = gameState.gameProgress.playerOrderIndex;
    let player = playerOrders[round][playerOrderIndex];

    if (playersInGame.size < 2) {
        gameState.gameProgress = {
            phase: "game-over",
        };
        return;
    }
    if (!playersInGame.has(player)) {
        progressHaboru(gameState);
    }
}

function getNeighbourIndices(index: number) {
    let regionInfo = hungaryMapInfo.regions[index];
    return regionInfo.neighbours.map((id) => getRegionIndexFromId(id));
}

function getPlayerReachableRegionIndices(gameState: GameState, player: number) {
    let playerRegionIndices: number[] = [];
    for (let i = 0; i < hungaryMapInfo.regions.length; i++) {
        let regionState = gameState.regions[i];
        if (regionState.type !== "fort" && regionState.type !== "normal")
            continue;
        if (regionState.player !== player) continue;
        playerRegionIndices.push(i);
    }
    let neighbourIndicesSet = new Set(
        playerRegionIndices.flatMap((i) => [i, ...getNeighbourIndices(i)])
    );
    return [...neighbourIndicesSet];
}
