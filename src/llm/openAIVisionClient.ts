import type { UIElement, VisionClient } from "../core/types.js";
import type { OpenAIClientOptions } from "./openAIUtils.js";
import {
  callOpenAI,
  defaultModel,
  isDebugEnabled,
  parseJsonFromText,
  readImageAsDataUrl,
} from "./openAIUtils.js";

export class OpenAIVisionClient implements VisionClient {
  private readonly options: OpenAIClientOptions;

  constructor(options: OpenAIClientOptions) {
    this.options = options;
  }

  async analyze(screenshotPath: string): Promise<UIElement[]> {
    const dataUrl = await readImageAsDataUrl(screenshotPath);
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
                "Extract UI elements from the screenshot. " +
                "Return JSON only with shape { elements: [...] }. " +
                "Each element must include id,label,role,bounds(x,y,w,h),confidence. " +
                "Do not omit any fields. " +
                "Do not infer intent or actions; only describe visible UI structure. " +
                "Use role: button|text|input|image|unknown. " +
                "Bounds are in screen coordinates.",
            },
            { type: "input_image", image_url: dataUrl },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "ui_elements",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              elements: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    id: { type: "string" },
                    label: { type: "string" },
                    role: {
                      type: "string",
                      enum: ["button", "text", "input", "image", "unknown"],
                    },
                    bounds: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        x: { type: "number" },
                        y: { type: "number" },
                        w: { type: "number" },
                        h: { type: "number" },
                      },
                      required: ["x", "y", "w", "h"],
                    },
                    confidence: { type: "number" },
                  },
                  required: ["id", "label", "role", "bounds", "confidence"],
                },
              },
            },
            required: ["elements"],
          },
        },
      },
    };

    const text = await callOpenAI(payload, this.options);
    if (isDebugEnabled()) {
      console.log("[Vision][raw]", text);
    }
    const parsed = parseJsonFromText<{ elements: UIElement[] }>(text);
    if (isDebugEnabled()) {
      console.log(`[Vision] elements=${parsed.elements?.length ?? 0}`);
    }
    return parsed.elements ?? [];
  }
}
