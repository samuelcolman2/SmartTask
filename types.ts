
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: number;
  scheduledDate: string; // ISO format: YYYY-MM-DD
  subtasks: Subtask[];
  frequency?: {
    count: number;
    unit: 'week';
  };
}

export interface AIAnalysis {
  motivation: string;
  prioritySuggestion: Priority;
  steps: string[];
}
