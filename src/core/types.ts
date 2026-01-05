export type ActionType = "tap" | "input" | "scroll" | "back";

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type UIRole = "button" | "text" | "input" | "image" | "unknown";

export interface ActionTarget {
  id?: string;
  label?: string;
  role?: UIRole;
  x?: number;
  y?: number;
  bounds?: Bounds;
  direction?: "up" | "down";
}

export interface RouteStep {
  index: number;
  action: ActionType;
  target?: ActionTarget;
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
  id: string;
  label: string;
  role: UIRole;
  bounds: Bounds;
  confidence: number;
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
  target?: ActionTarget | null;
  inputText?: string | null;
  notes?: string | null;
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
  getScreenSize(): Promise<{ width: number; height: number }>;
}

export interface ExplorerOptions {
  url: string;
  intent: string;
  maxSteps: number;
}

export interface ReplayerOptions {
  route: Route;
  url?: string;
}
