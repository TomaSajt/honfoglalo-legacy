export function assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
        let errorMsg = "Assertion Error.";
        if (msg) errorMsg += ` Reason: ${msg}`;
        throw new Error(errorMsg);
    }
}