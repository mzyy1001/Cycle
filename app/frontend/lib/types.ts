export type Task = {
    id: number;
    task: string;
    mood: string[];
    timestamp: string;
    length: number;
    isCompleted: boolean;
    isLocked: boolean;
  };