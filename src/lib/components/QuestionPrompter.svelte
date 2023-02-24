<script lang="ts">
    import GuessQuestionInGame from "$lib/components/GuessQuestionInGame.svelte";
    import ScreenOverlay from "$lib/components/ScreenOverlay.svelte";
    import { defaultGuessQuestion, type GuessQuestion } from "$lib/question";

    let currentQuestion = defaultGuessQuestion();
    let showQuestion = false;

    let players: number[] = [];
    let resultCallback: (order: number[]) => any = () => {};

    export function startGuess(
        question: GuessQuestion,
        playerList: number[],
        cb: (order: number[]) => any
    ) {
        currentQuestion = question;
        players = playerList;
        resultCallback = cb;
        showQuestion = true;
    }
</script>

{#if showQuestion}
    <ScreenOverlay>
        <GuessQuestionInGame
            {currentQuestion}
            {players}
            onResult={(order) => {
                showQuestion = false;
                resultCallback(order);
            }}
        />
    </ScreenOverlay>
{/if}
