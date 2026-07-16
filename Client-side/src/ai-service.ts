const API_BASE = "http://localhost:5212/";

export interface ChatResponse {
    text: string;
}

export interface ChatRequest {
    messages: {
        role: string;
        content: string;
    }[];
    model?: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
}

export async function processPrompt(request: ChatRequest): Promise<string> {

    const response = await fetch(
        `${API_BASE}api/DocumentAI/Process`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
        }
    );

    if (!response.ok) {
        throw new Error(await response.text());
    }

    const result: ChatResponse = await response.json();

    return result.text;
}