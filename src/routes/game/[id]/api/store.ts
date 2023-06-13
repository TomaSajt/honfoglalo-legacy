import { makeEmptyGameState } from "$lib/state";
import { writable } from "svelte/store";

export const gameState = writable(makeEmptyGameState())
