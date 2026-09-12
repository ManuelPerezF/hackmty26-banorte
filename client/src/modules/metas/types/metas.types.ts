export type SavingsGoal = { id: string; name: string; target: number };
export type GoalInput = {
  name: string;
  target: number;
  deadline?: string | null;
};
