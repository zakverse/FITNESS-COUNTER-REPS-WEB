import type { Exercise, PredictionItem } from "./types";

export const EXERCISES_DATA: Record<string, Exercise> = {
  jj: {
    name: "Jumping Jack",
    sub: "Full Body",
    desc: "Latihan kardio intensif untuk melatih kelincahan, kekuatan kaki, dan kebugaran jantung.",
    muscleGroup: "Full Body & Cardio",
    modelUrl: "https://teachablemachine.withgoogle.com/models/jZHgQNIHN/",
    checkRep: (prediction: PredictionItem[], stage: string) => {
      const probLompat = prediction[0]?.probability || 0;
      const probBerdiri = prediction[1]?.probability || 0;
      const probTanganAtas = prediction[2]?.probability || 0;

      let nextStage = stage;
      let status = "READY";
      let isRep = false;

      // Logic: Lompat atau tangan atas memicu stage 'down'
      if ((probLompat > 0.90 || probTanganAtas > 0.90) && stage !== "down") {
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
          { label: "Jumping-Jack-lompat", value: probLompat, color: "bg-cyan-500 shadow-cyan-500/20" },
          { label: "Jumping-Jack-Berdiri", value: probBerdiri, color: "bg-emerald-500 shadow-emerald-500/20" },
          { label: "Jumping-jack-berdiri-tangan-atas", value: probTanganAtas, color: "bg-teal-500 shadow-teal-500/20" }
        ]
      };
    }
  },
  pushup: {
    name: "Push Up",
    sub: "Chest & Triceps",
    desc: "Melatih kekuatan otot dada, bahu, lengan, serta kestabilan otot inti (core).",
    muscleGroup: "Chest, Triceps, Shoulders",
    modelUrl: "https://teachablemachine.withgoogle.com/models/ho-trLhwI/",
    checkRep: (prediction: PredictionItem[], stage: string) => {
      const probUp = prediction[0]?.probability || 0;
      const probDown = prediction[1]?.probability || 0;
      const probNetral = prediction[2]?.probability || 0;

      let nextStage = stage;
      let status = stage === "up" ? "PLANK POSITION" : "HOLD POSITION";
      let isRep = false;

      if (probNetral < 0.5) {
        if (probDown > 0.95 && stage !== "down") {
          nextStage = "down";
          status = "PUSH DOWN!";
        }
        if (probUp > 0.95 && stage === "down") {
          nextStage = "up";
          status = "PERFECT PUSH!";
          isRep = true;
        }
      } else {
        status = "NETRAL / RESTING";
      }

      return {
        nextStage,
        status,
        isRep,
        bars: [
          { label: "Push Up - Atas", value: probUp, color: "bg-cyan-500 shadow-cyan-500/20" },
          { label: "Push Up - Bawah", value: probDown, color: "bg-emerald-500 shadow-emerald-500/20" },
          { label: "Netral", value: probNetral, color: "bg-slate-600 shadow-slate-600/20" }
        ]
      };
    }
  },
  situp: {
    name: "Sit Up",
    sub: "Core & Abs",
    desc: "Menargetkan kekuatan otot perut (abs), pinggul, dan stabilitas punggung bawah.",
    muscleGroup: "Core & Abdominals",
    modelUrl: "https://teachablemachine.withgoogle.com/models/uk8veRyZx/",
    checkRep: (prediction: PredictionItem[], stage: string) => {
      const probDown = prediction[0]?.probability || 0; // Rebahan
      const probUp = prediction[1]?.probability || 0;   // Duduk
      const probNetral = prediction[2]?.probability || 0;

      let nextStage = stage;
      let status = stage === "up" ? "START FORM" : "MID CRUNCH";
      let isRep = false;

      if (probNetral < 0.5) {
        if (probDown > 0.95 && stage !== "down") {
          nextStage = "down";
          status = "LAYING DOWN";
        }
        if (probUp > 0.95 && stage === "down") {
          nextStage = "up";
          status = "REP SUCCESS!";
          isRep = true;
        }
      } else {
        status = "NETRAL / RESTING";
      }

      return {
        nextStage,
        status,
        isRep,
        bars: [
          { label: "Sit Up Rebahan", value: probDown, color: "bg-cyan-500 shadow-cyan-500/20" },
          { label: "Sit Up Duduk", value: probUp, color: "bg-emerald-500 shadow-emerald-500/20" },
          { label: "Netral", value: probNetral, color: "bg-slate-600 shadow-slate-600/20" }
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
          { label: "Squat - Bawah", value: probDown, color: "bg-cyan-500 shadow-cyan-500/20" },
          { label: "Squat - Atas", value: probUp, color: "bg-emerald-500 shadow-emerald-500/20" }
        ]
      };
    }
  },
  lunge: {
    name: "Lunges",
    sub: "Legs & Balance",
    desc: "Latihan unilateral untuk meningkatkan stabilitas kaki, kekuatan paha depan, paha belakang, dan glutes.",
    muscleGroup: "Quadriceps, Glutes, Balance",
    modelUrl: "https://teachablemachine.withgoogle.com/models/lQEGyOvNo/",
    checkRep: (prediction: PredictionItem[], stage: string) => {
      const probDown = prediction[0]?.probability || 0; // Lunges
      const probUp = prediction[1]?.probability || 0;   // Berdiri

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
          { label: "Lunges", value: probDown, color: "bg-cyan-500 shadow-cyan-500/20" },
          { label: "Berdiri", value: probUp, color: "bg-emerald-500 shadow-emerald-500/20" }
        ]
      };
    }
  }
};
