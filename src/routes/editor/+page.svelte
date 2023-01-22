<script lang="ts">
    import { parseQuestionFromJsonText, type Question } from "$lib/question";

    let currentQuestion: Question = {
        type: "choice",
        question: "Mi a válasz?",
        options: ["Válasz A", "Válasz B", "Válasz C", "Válasz D"],
        correctIndex: 0,
    };

    function download(filename: string, text: string) {
        var element = document.createElement("a");
        element.href =
            "data:text/plain;charset=utf-8," + encodeURIComponent(text);
        element.download = filename;
        element.style.display = "none";
        element.click();
    }

    function loadExternal() {
        let input = document.createElement("input");
        input.type = "file";
        input.onchange = () => {
            let file = input.files?.item(0);
            if (file) processFile(file);
        };
        input.click();
    }

    async function processFile(file: File) {
        let text = await file.text();
        let question = parseQuestionFromJsonText(text);
        if (!question) {
            console.log("Error while parsing file");
            return;
        }
        currentQuestion = question;
    }

    function setCorrectIndex(i: number) {
        if (currentQuestion.type !== "choice") {
            console.error(
                "You can only set correct index for 'choice' type questions"
            );
            return;
        }
        currentQuestion.correctIndex = i;
    }

    function save() {
        download("question.json", JSON.stringify(currentQuestion, null, 2));
    }
</script>

<form
    class="max-w-2xl min-w-fit mx-auto flex flex-col bg-slate-400 p-4 gap-4 rounded-lg mt-4"
>
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
        <div class="grid grid-cols-2 gap-x-4 gap-y-2">
            {#each currentQuestion.options as option, i}
                {@const correct = i == currentQuestion.correctIndex}
                <div class="bg-gray-300 flex gap-2">
                    <div class="flex-grow">
                        <input
                            class="text-center px-1 w-full"
                            bind:value={option}
                        />
                    </div>
                    <button
                        class="aspect-square flex-shrink-0 h-full"
                        class:bg-green-500={correct}
                        class:bg-red-500={!correct}
                        on:click={() => setCorrectIndex(i)}
                    />
                </div>
            {/each}
        </div>
        <div class="flex justify-between">
            <button on:click={() => save()}>Mentés</button>
            <button on:click={() => loadExternal()}>Betöltés</button>
        </div>
    {/if}
</form>
