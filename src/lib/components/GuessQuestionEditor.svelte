<script lang="ts">
    import type { GuessQuestion } from "$lib/question";

    export let currentQuestion: GuessQuestion;
</script>

<div class="flex gap-4">
    <div>Válasz:</div>
    <input type="number" bind:value={currentQuestion.solution} />
</div>
