import { writable } from 'svelte/store';
import { type GameState, defaultGameState } from './state';


export let gameState = writable<GameState>(defaultGameState());

