export interface PredictionItem {
  className: string;
  probability: number;
}

export interface ExerciseBar {
  label: string;
  value: number;
  color: string;
}

export interface ExerciseCheckResult {
  nextStage: string;
  status: string;
  isRep: boolean;
  bars: ExerciseBar[];
}

export interface Exercise {
  name: string;
  sub: string;
  desc: string;
  muscleGroup: string;
  modelUrl: string;
  checkRep: (prediction: PredictionItem[], stage: string) => ExerciseCheckResult;
}

export interface LogItem {
  id: string;
  name: string;
  time: string;
  count: number;
}
