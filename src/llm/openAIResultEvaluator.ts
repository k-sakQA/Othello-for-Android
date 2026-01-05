import type { EvaluationContext, ResultEvaluator, StoryEvaluation } from "../story/types.js";
import type { OpenAIClientOptions } from "./openAIUtils.js";
import { callOpenAI, defaultModel, isDebugEnabled, parseJsonFromText } from "./openAIUtils.js";

export class OpenAIResultEvaluator implements ResultEvaluator {
  private readonly options: OpenAIClientOptions;

  constructor(options: OpenAIClientOptions) {
    this.options = options;
  }

  async evaluate(context: EvaluationContext): Promise<StoryEvaluation> {
    const payload = {
      model: this.options.model ?? defaultModel,
      temperature: 0.2,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "You are a test result evaluator for a mobile web app. " +
                "Given the story and UI elements before/after, judge whether the expectation is satisfied. " +
                "Return JSON only.",
            },
            { type: "input_text", text: `Story: ${context.story}` },
            { type: "input_text", text: `Before: ${JSON.stringify(context.beforeElements)}` },
            { type: "input_text", text: `After: ${JSON.stringify(context.afterElements)}` },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "story_evaluation",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              assertion: { type: "string" },
              result: { type: "boolean" },
              confidence: { type: "number" },
              notes: { type: ["string", "null"] },
            },
            required: ["assertion", "result", "confidence", "notes"],
          },
        },
      },
    };

    const text = await callOpenAI(payload, this.options);
    if (isDebugEnabled()) {
      console.log("[ResultEvaluator][raw]", text);
    }
    const evaluation = parseJsonFromText<StoryEvaluation>(text);
    if (isDebugEnabled()) {
      console.log("[ResultEvaluator] evaluation", evaluation);
    }
    return evaluation;
  }
}
