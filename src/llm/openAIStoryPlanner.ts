import type { StoryAction, StoryPlanContext, StoryPlanner } from "../story/types.js";
import type { OpenAIClientOptions } from "./openAIUtils.js";
import { callOpenAI, defaultModel, isDebugEnabled, parseJsonFromText } from "./openAIUtils.js";

export class OpenAIStoryPlanner implements StoryPlanner {
  private readonly options: OpenAIClientOptions;

  constructor(options: OpenAIClientOptions) {
    this.options = options;
  }

  async decide(context: StoryPlanContext): Promise<StoryAction> {
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
                "You are a test planner for a mobile web app. " +
                "Given the story and UI elements, choose the next action as JSON. " +
                "Actions: tap|input|scroll|back|finish. " +
                "For tap/input, use normalized x_ratio/y_ratio (0..1). " +
                "Absolute coordinates are forbidden. " +
                "All top-level keys must be present; use null for non-applicable fields. " +
                "Return JSON only.",
            },
            { type: "input_text", text: `Story: ${context.story}` },
            { type: "input_text", text: `StepIndex: ${context.stepIndex}` },
            { type: "input_text", text: `Elements: ${JSON.stringify(context.elements)}` },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "story_action",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              action: {
                type: "string",
                enum: ["tap", "input", "scroll", "back", "finish"],
              },
              target: {
                type: ["object", "null"],
                additionalProperties: false,
                properties: {
                  id: { type: ["string", "null"] },
                  label: { type: ["string", "null"] },
                  role: {
                    type: ["string", "null"],
                    enum: ["button", "text", "input", "image", "unknown"],
                  },
                  x_ratio: { type: ["number", "null"] },
                  y_ratio: { type: ["number", "null"] },
                  direction: {
                    type: ["string", "null"],
                    enum: ["up", "down"],
                  },
                },
                required: ["id", "label", "role", "x_ratio", "y_ratio", "direction"],
              },
              inputText: { type: ["string", "null"] },
              notes: { type: ["string", "null"] },
            },
            required: ["action", "target", "inputText", "notes"],
          },
        },
      },
    };

    const text = await callOpenAI(payload, this.options);
    if (isDebugEnabled()) {
      console.log("[StoryPlanner][raw]", text);
    }
    const decision = parseJsonFromText<StoryAction>(text);
    if (isDebugEnabled()) {
      console.log("[StoryPlanner] decision", decision);
    }
    return decision;
  }
}
