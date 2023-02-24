export function playerIdToHungarianName(id: number) {
    if (id == 0) return "Piros";
    if (id == 1) return "Zöld";
    if (id == 2) return "Kék";
    throw new Error("Invalid player id");
}
export function playerIdToStrongCssColor(id: number) {
    if (id == 0) return "red";
    if (id == 1) return "green";
    if (id == 2) return "blue";
    throw new Error("Invalid player id");
}
export function playerIdToWeakCssColor(id: number) {
    if (id == 0) return "#fca5a5";
    if (id == 1) return "#86efac";
    if (id == 2) return "#93c5fd";
    throw new Error("Invalid player id");
}

export function playerIdToVeryWeakCssColor(id: number) {
    if (id == 0) return "#fecaca";
    if (id == 1) return "#bbf7d0";
    if (id == 2) return "#bfdbfe";
    throw new Error("Invalid player id");
}