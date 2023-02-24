export function downloadFile(filename: string, text: string) {
    let element = document.createElement("a");
    element.href = "data:text/plain;charset=utf-8," + encodeURIComponent(text);
    element.download = filename;
    element.style.display = "none";
    element.click();
}

export function loadFile(cb: (file: File) => void) {
    let input = document.createElement("input");
    input.type = "file";
    input.onchange = () => {
        let file = input.files?.item(0);
        if (file) cb(file);
    };
    input.click();
}