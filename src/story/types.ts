import type { ActionType, UIElement, UIRole } from "../core/types.js";

export interface UserStory {
  id: string;
  story: string;
}

export interface StoryPlanContext {
  story: string;
  elements: UIElement[];
  stepIndex: number;
}

export interface StoryActionTarget {
  id?: string | null;
  label?: string | null;
  role?: UIRole | null;
  x_ratio?: number | null;
  y_ratio?: number | null;
  direction?: "up" | "down" | null;
}

export interface StoryAction {
  action: ActionType | "finish";
  target?: StoryActionTarget | null;
  inputText?: string | null;
  notes?: string | null;
}

export interface StoryPlanner {
  decide(context: StoryPlanContext): Promise<StoryAction>;
}

export interface EvaluationContext {
  story: string;
  beforeElements: UIElement[];
  afterElements: UIElement[];
}

export interface StoryEvaluation {
  assertion: string;
  result: boolean;
  confidence: number;
  notes?: string | null;
}

export interface ResultEvaluator {
  evaluate(context: EvaluationContext): Promise<StoryEvaluation>;
}

export interface StoryResult {
  id: string;
  story: string;
  action?: StoryAction;
  evaluation?: StoryEvaluation;
  error?: string;
}
