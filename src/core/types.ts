export type ActionType = "tap" | "input" | "scroll" | "back";

export interface RouteStep {
  index: number;
  action: ActionType;
  target?: {
    label?: string;
    kind?: string;
    x?: number;
    y?: number;
    direction?: "up" | "down";
  };
  inputText?: string;
  screenshotPath?: string;
  notes?: string;
}

export interface Route {
  id: string;
  createdAt: string;
  steps: RouteStep[];
}

export interface UIElement {
  label?: string;
  kind?: string;
  x: number;
  y: number;
}

export interface VisionClient {
  analyze(screenshotPath: string): Promise<UIElement[]>;
}

export interface PlannerContext {
  intent: string;
  stepIndex: number;
  elements: UIElement[];
  history: RouteStep[];
  lastScreenshotPath: string;
}

export interface PlannerDecision {
  action: ActionType | "finish";
  target?: RouteStep["target"];
  inputText?: string;
  notes?: string;
}

export interface Planner {
  decide(context: PlannerContext): Promise<PlannerDecision>;
}

export interface AndroidDevice {
  openUrl(url: string): Promise<void>;
  captureScreenshot(): Promise<string>;
  tap(x: number, y: number): Promise<void>;
  inputText(x: number, y: number, text: string): Promise<void>;
  scroll(direction: "up" | "down"): Promise<void>;
  back(): Promise<void>;
}

export interface ExplorerOptions {
  url: string;
  intent: string;
  maxSteps: number;
}
