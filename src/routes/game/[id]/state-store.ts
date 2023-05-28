import { makeEmptyGameState, type GameState } from '$lib/state';
import { writable } from 'svelte/store';


export let gameState = writable<GameState>(makeEmptyGameState());

