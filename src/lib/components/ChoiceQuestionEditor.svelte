<script lang="ts">
    import type { ChoiceQuestion } from "$lib/question";

    export let currentQuestion: ChoiceQuestion;
</script>

<div class="grid grid-cols-2 gap-x-4 gap-y-2">
    {#each currentQuestion.options as option, i}
        {@const correct = i == currentQuestion.correctIndex}
        <div class="bg-gray-300 flex gap-2">
            <div class="flex-grow">
                <input class="text-center px-1 w-full" bind:value={option} />
            </div>
            <button
                class="aspect-square flex-shrink-0 h-full"
                class:bg-green-500={correct}
                class:bg-red-500={!correct}
                on:click={() => (currentQuestion.correctIndex = i)}
            />
        </div>
    {/each}
</div>
