export type GigType = "FCFS" | "CONTEST" | "MILESTONE";
export type GigStatus = "OPEN" | "IN_PROGRESS" | "IN_REVIEW" | "SETTLED" | "DISPUTED";

export interface GigItem {
  id: string;
  title: string;
  summary: string;
  description: string;
  creator: string;
  rewardAmount: string;
  rewardToken: string;
  gigType: GigType;
  status: GigStatus;
  isSealed: boolean;
  deadlineTimestamp: number; // Unix timestamp in seconds
  hypeCount: number;
  submissionsCount: number;
  skillTags: string[];
  deliverables: string[];
  clientRating?: number;
  winnerAddress?: string;
  createdAt: number;
}

export interface SubmissionItem {
  id: string;
  gigId: string;
  hustler: string;
  submittedAt: number;
  isSealed: boolean;
  deliverableUri: string;
  commitHash?: string;
  isWinner?: boolean;
}

export interface ActivityItem {
  id: string;
  type: "PAYOUT" | "HYPE" | "BURN" | "CLAIM";
  text: string;
  timestamp: string;
  txHash: string;
}
