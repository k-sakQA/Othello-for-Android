import { readFile } from "node:fs/promises";

export interface OpenAIClientOptions {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export const defaultModel = "gpt-5.2";
export const defaultBaseUrl = "https://api.openai.com/v1/responses";

export const isDebugEnabled = (): boolean => {
  const value = process.env.OTHELLO_DEBUG ?? "";
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

export const readImageAsDataUrl = async (path: string): Promise<string> => {
  const data = await readFile(path);
  const base64 = data.toString("base64");
  return `data:image/png;base64,${base64}`;
};

export const callOpenAI = async (
  payload: Record<string, unknown>,
  options: OpenAIClientOptions,
): Promise<string> => {
  if (!options.apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }
  const response = await fetch(options.baseUrl ?? defaultBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${text}`);
  }
  const data = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  if (typeof data.output_text === "string") {
    return data.output_text;
  }
  if (Array.isArray(data.output)) {
    const chunks: string[] = [];
    for (const item of data.output) {
      if (!Array.isArray(item.content)) continue;
      for (const content of item.content) {
        if (content?.type === "output_text" || content?.type === "text") {
          if (typeof content.text === "string") {
            chunks.push(content.text);
          }
        }
      }
    }
    if (chunks.length > 0) {
      return chunks.join("");
    }
  }
  throw new Error("Failed to extract text from OpenAI response.");
};

export const parseJsonFromText = <T>(text: string): T => {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as T;
  }
  const start = trimmed.indexOf("{");
  if (start === -1) {
    throw new Error("JSON not found in response.");
  }
  let depth = 0;
  for (let i = start; i < trimmed.length; i += 1) {
    const char = trimmed[i];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      const candidate = trimmed.slice(start, i + 1);
      return JSON.parse(candidate) as T;
    }
  }
  throw new Error("JSON end not found in response.");
};
