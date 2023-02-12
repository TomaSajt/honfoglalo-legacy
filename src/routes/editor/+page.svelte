<script lang="ts">
    import ChoiceQuestionEditor from "$lib/components/ChoiceQuestionEditor.svelte";
    import GuessQuestionEditor from "$lib/components/GuessQuestionEditor.svelte";
    import { downloadFile, loadFile } from "$lib/fileUtils";
    import {
        defaultChoiceQuestion,
        defaultGuessQuestion,
        parseQuestionFromJsonText,
        type Question,
    } from "$lib/question";

    let currentQuestion: Question | undefined;
    function generateDefaultChoiceQuestion() {
        currentQuestion = defaultChoiceQuestion();
    }
    function generateDefaultGuessQuestion() {
        currentQuestion = defaultGuessQuestion();
    }

    async function processFile(file: File) {
        let text = await file.text();
        let question = parseQuestionFromJsonText(text);
        if (!question) {
            throw "Error while parsing file";
        }
        currentQuestion = question;
    }

    function save() {
        downloadFile("question.json", JSON.stringify(currentQuestion, null, 2));
    }
</script>

<div class="p-4 max-w-2xl mx-auto">
    <form
        class="min-w-fit mx-auto flex flex-col bg-slate-400 p-4 gap-4 rounded-lg"
    >
        {#if currentQuestion}
            <div class="text-center text-lg uppercase font-bold tracking">
                Kérdés szerkesztése
            </div>
            <textarea
                name=""
                id=""
                rows="3"
                class="p-1 resize-y"
                bind:value={currentQuestion.question}
            />
            {#if currentQuestion.type === "choice"}
                <ChoiceQuestionEditor {currentQuestion} />
            {/if}
            {#if currentQuestion.type === "guess"}
                <GuessQuestionEditor {currentQuestion} />
            {/if}
            <div class="flex gap-4">
                <div>Időlimit (sec):</div>
                <input
                    type="number"
                    class="w-14 text-center"
                    bind:value={currentQuestion.timeLimit}
                    min="1"
                />
            </div>
        {/if}
        <div class="flex justify-between">
            {#if currentQuestion}
                <button on:click={() => save()}>Mentés</button>
            {:else}
                <button on:click={() => generateDefaultChoiceQuestion()}>
                    Új feleletválasztós
                </button>
                <button on:click={() => generateDefaultGuessQuestion()}>
                    Új tippelős
                </button>
            {/if}
            <button on:click={() => loadFile(processFile)}>Betöltés</button>
        </div>
    </form>
</div>
