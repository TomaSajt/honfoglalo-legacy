export function playerIdToHungarianName(id: number) {
    if (id == 0) return "Piros";
    if (id == 1) return "Zöld";
    if (id == 2) return "Kék";
    return "Ismeretlen"
}

export function playerIdToStringId(id: number) {
    if (id == 0) return "red";
    if (id == 1) return "green";
    if (id == 2) return "blue";
    return "colourless"
}

export function playerIdToStrongCssColor(id: number) {
    if (id == 0) return "#af0000";
    if (id == 1) return "#00af00";
    if (id == 2) return "#0000af";
    return "white"
}

export function playerIdToWeakCssColor(id: number) {
    if (id == 0) return "#fca5a5";
    if (id == 1) return "#86efac";
    if (id == 2) return "#93c5fd";
    return "white"
}