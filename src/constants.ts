import type { Exercise, PredictionItem } from "./types";

export const EXERCISES_DATA: Record<string, Exercise> = {
  jj: {
    name: "Jumping Jack",
    sub: "Full Body",
    desc: "Latihan kardio intensif untuk melatih kelincahan, kekuatan kaki, dan kebugaran jantung.",
    muscleGroup: "Full Body & Cardio",
    modelUrl: "https://teachablemachine.withgoogle.com/models/3CAetVQU_/",
    checkRep: (prediction: PredictionItem[], stage: string) => {
      const probLompat = prediction.find(p => p.className === "JumpingJackLompat")?.probability || 0;
      const probBerdiri = prediction.find(p => p.className === "JumpingJackBerdiri")?.probability || 0;

      let nextStage = stage;
      let status = "READY";
      let isRep = false;

      // Logic: Lompat memicu stage 'down'
      if (probLompat > 0.90 && stage !== "down") {
        nextStage = "down";
        status = "JUMP!";
      }
      if (probBerdiri > 0.95 && stage === "down") {
        nextStage = "up";
        status = "EXCELLENT REP!";
        isRep = true;
      }

      return {
        nextStage,
        status,
        isRep,
        bars: [
          { label: "JumpingJackLompat", value: probLompat, color: "bg-rose-500 shadow-rose-500/20" },
          { label: "JumpingJackBerdiri", value: probBerdiri, color: "bg-red-600 shadow-red-600/20" }
        ]
      };
    }
  },
  pushup: {
    name: "Push Up",
    sub: "Chest & Triceps",
    desc: "Melatih kekuatan otot dada, bahu, lengan, serta kestabilan otot inti (core).",
    muscleGroup: "Chest, Triceps, Shoulders",
    modelUrl: "https://teachablemachine.withgoogle.com/models/on812O7_M/",
    checkRep: (prediction: PredictionItem[], stage: string) => {
      const probUp = prediction.find(p => p.className === "PushUp-Atas")?.probability || 0;
      const probDown = prediction.find(p => p.className === "PushUp-Bawah")?.probability || 0;

      let nextStage = stage;
      let status = stage === "up" ? "PLANK POSITION" : "HOLD POSITION";
      let isRep = false;

      if (probDown > 0.95 && stage !== "down") {
        nextStage = "down";
        status = "PUSH DOWN!";
      }
      if (probUp > 0.95 && stage === "down") {
        nextStage = "up";
        status = "PERFECT PUSH!";
        isRep = true;
      }

      return {
        nextStage,
        status,
        isRep,
        bars: [
          { label: "PushUp-Atas", value: probUp, color: "bg-rose-500 shadow-rose-500/20" },
          { label: "PushUp-Bawah", value: probDown, color: "bg-red-600 shadow-red-600/20" }
        ]
      };
    }
  },
  situp: {
    name: "Sit Up",
    sub: "Core & Abs",
    desc: "Menargetkan kekuatan otot perut (abs), pinggul, dan stabilitas punggung bawah.",
    muscleGroup: "Core & Abdominals",
    modelUrl: "https://teachablemachine.withgoogle.com/models/XqmMR6npf/",
    checkRep: (prediction: PredictionItem[], stage: string) => {
      const probDown = prediction.find(p => p.className === "SitDown")?.probability || 0;
      const probUp = prediction.find(p => p.className === "SitUp")?.probability || 0;

      let nextStage = stage;
      let status = stage === "up" ? "START FORM" : "MID CRUNCH";
      let isRep = false;

      if (probDown > 0.95 && stage !== "down") {
        nextStage = "down";
        status = "LAYING DOWN";
      }
      if (probUp > 0.95 && stage === "down") {
        nextStage = "up";
        status = "REP SUCCESS!";
        isRep = true;
      }

      return {
        nextStage,
        status,
        isRep,
        bars: [
          { label: "SitUp", value: probUp, color: "bg-rose-500 shadow-rose-500/20" },
          { label: "SitDown", value: probDown, color: "bg-red-600 shadow-red-600/20" }
        ]
      };
    }
  },
  squat: {
    name: "Squat",
    sub: "Legs & Glutes",
    desc: "Latihan kekuatan dasar untuk melatih otot paha depan, paha belakang, glutes, dan stabilitas otot inti.",
    muscleGroup: "Quadriceps, Glutes, Hamstrings, Core",
    modelUrl: "https://teachablemachine.withgoogle.com/models/_sSbu9Td4/",
    checkRep: (prediction: PredictionItem[], stage: string) => {
      const probDown = prediction[0]?.probability || 0; // Squatting (Down)
      const probUp = prediction[1]?.probability || 0;   // Standing (Up)

      let nextStage = stage;
      let status = "READY";
      let isRep = false;

      if (probDown > 0.95 && stage !== "down") {
        nextStage = "down";
        status = "SQUAT DOWN";
      }
      if (probUp > 0.95 && stage === "down") {
        nextStage = "up";
        status = "PERFECT SQUAT!";
        isRep = true;
      }

      return {
        nextStage,
        status,
        isRep,
        bars: [
          { label: "Squat - Bawah", value: probDown, color: "bg-rose-500 shadow-rose-500/20" },
          { label: "Squat - Atas", value: probUp, color: "bg-red-600 shadow-red-600/20" }
        ]
      };
    }
  },
  lunge: {
    name: "Lunges",
    sub: "Legs & Balance",
    desc: "Latihan unilateral untuk meningkatkan stabilitas kaki, kekuatan paha depan, paha belakang, dan glutes.",
    muscleGroup: "Quadriceps, Glutes, Balance",
    modelUrl: "https://teachablemachine.withgoogle.com/models/CPyQ8UUR_/",
    checkRep: (prediction: PredictionItem[], stage: string) => {
      const probDown = prediction.find(p => p.className === "Lunges")?.probability || 0;
      const probUp = prediction.find(p => p.className === "Berdiri")?.probability || 0;

      let nextStage = stage;
      let status = "READY";
      let isRep = false;

      if (probDown > 0.95 && stage !== "down") {
        nextStage = "down";
        status = "LUNGE STEP";
      }
      if (probUp > 0.95 && stage === "down") {
        nextStage = "up";
        status = "UPRIGHT STANCE";
        isRep = true;
      }

      return {
        nextStage,
        status,
        isRep,
        bars: [
          { label: "Lunges", value: probDown, color: "bg-rose-500 shadow-rose-500/20" },
          { label: "Berdiri", value: probUp, color: "bg-red-600 shadow-red-600/20" }
        ]
      };
    }
  }
};
