<script lang="ts">
    import {
        playerIdToStrongCssColor,
        playerIdToWeakCssColor,
    } from "$lib/player";

    export let playerOrders: number[][];
    export let round: number;
    export let playerOrderIndex: number;
</script>

<div class="flex gap-2 justify-center">
    {#each playerOrders as order, i}
        <div
            class="flex outline-black -outline-offset-1 outline-2"
            class:outline={i == round}
        >
            {#each order as player, j}
                {@const isCurrent = i == round && j == playerOrderIndex}
                <div
                    class="w-4 h-4"
                    style="background-color: {isCurrent
                        ? playerIdToStrongCssColor(player)
                        : playerIdToWeakCssColor(player)};"
                />
            {/each}
        </div>
    {/each}
</div>
