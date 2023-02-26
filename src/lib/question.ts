import z from 'zod';

const choiceQuestionSchema = z.object(
    {
        type: z.literal("choice"),
        question: z.string(),
        options: z.array(z.string()).length(4),
        correctIndex: z.number().int().gte(0).lt(4),
        timeLimit: z.number().int().min(1)
    }
);

const guessQuestionSchema = z.object(
    {
        type: z.literal("guess"),
        question: z.string(),
        solution: z.number(),
        timeLimit: z.number().int().min(1)
    }
);

const questionSchema = z.discriminatedUnion("type", [choiceQuestionSchema, guessQuestionSchema]);

export type ChoiceQuestion = z.infer<typeof choiceQuestionSchema>;
export type GuessQuestion = z.infer<typeof guessQuestionSchema>;
export type Question = ChoiceQuestion | GuessQuestion;

export function parseQuestionFromJsonText(text: string): Question | null {
    try {
        let obj = JSON.parse(text);
        return questionSchema.parse(obj);
    } catch (error) {
        console.log(error);
        return null;
    }
}

export function defaultChoiceQuestion(): ChoiceQuestion {
    return {
        type: "choice",
        question: "Hányan dolgoztak a Honfoglaló Legacy-n?",
        options: ["1", "2", "3", "4"],
        correctIndex: 2,
        timeLimit: 20,
    };
}
export function defaultGuessQuestion(): GuessQuestion {
    return {
        type: "guess",
        question: "Mikor készült a Honfoglaló Legacy?",
        solution: 2023,
        timeLimit: 20,
    };
}
