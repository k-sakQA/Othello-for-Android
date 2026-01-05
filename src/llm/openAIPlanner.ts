import type { Planner, PlannerContext, PlannerDecision } from "../core/types.js";
import type { OpenAIClientOptions } from "./openAIUtils.js";
import { callOpenAI, defaultModel, isDebugEnabled, parseJsonFromText } from "./openAIUtils.js";

export class OpenAIPlanner implements Planner {
  private readonly options: OpenAIClientOptions;

  constructor(options: OpenAIClientOptions) {
    this.options = options;
  }

  async decide(context: PlannerContext): Promise<PlannerDecision> {
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
                "Given intent and UI elements, choose the next action only as JSON. " +
                "Actions: tap|input|scroll|back|finish. " +
                "If action is tap/input, include target with x,y or bounds. " +
                "You may also include target.id/label/role for traceability. " +
                "If input, include inputText. " +
                "If scroll, include target.direction = up|down. " +
                "All top-level keys must be present; use null for non-applicable fields. " +
                "Return JSON only.",
            },
            {
              type: "input_text",
              text: `Intent: ${context.intent}`,
            },
            {
              type: "input_text",
              text: `StepIndex: ${context.stepIndex}`,
            },
            {
              type: "input_text",
              text: `Elements: ${JSON.stringify(context.elements)}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "planner_decision",
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
                  x: { type: ["number", "null"] },
                  y: { type: ["number", "null"] },
                  bounds: {
                    type: ["object", "null"],
                    additionalProperties: false,
                    properties: {
                      x: { type: ["number", "null"] },
                      y: { type: ["number", "null"] },
                      w: { type: ["number", "null"] },
                      h: { type: ["number", "null"] },
                    },
                    required: ["x", "y", "w", "h"],
                  },
                  direction: {
                    type: ["string", "null"],
                    enum: ["up", "down"],
                  },
                },
                required: ["id", "label", "role", "x", "y", "bounds", "direction"],
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
      console.log("[Planner][raw]", text);
    }
    const decision = parseJsonFromText<PlannerDecision>(text);
    if (isDebugEnabled()) {
      console.log("[Planner] decision", decision);
    }
    return decision;
  }
}
