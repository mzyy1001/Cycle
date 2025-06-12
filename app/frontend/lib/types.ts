export type Task = {
    id: number;
    task: string;
    mood: string[];
    timestamp: string;
    length: number;
    isCompleted: number; // 0 or 1
    isLocked?: boolean;
  };