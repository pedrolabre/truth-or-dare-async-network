export type ActionChallengeType = 'dare';

export type ActionChallengeStatus =
  | 'active'
  | 'submitted'
  | 'concluded'
  | 'failed'
  | 'expired';

export type ActionProofMediaType = 'none' | 'video' | 'audio' | 'file';

export type ActionProofDraftInput = {
  mediaType: Exclude<ActionProofMediaType, 'none'>;
  localUri?: string | null;
  durationSeconds?: number | null;
  fileName?: string | null;
};

export type ActionParticipant = {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string | null;
};

export type ActionProofDraft = {
  id: string | null;
  mediaType: ActionProofMediaType;
  localUri?: string | null;
  durationSeconds?: number | null;
  fileName?: string | null;
  text?: string;
  uploadedAt?: string | null;
};

export type ActionChallenge = {
  id: string;
  type: ActionChallengeType;
  title: string;
  description?: string;
  creatorName: string;
  creatorInitials: string;
  createdAtLabel: string;
  participants: ActionParticipant[];
  status: ActionChallengeStatus;
  attemptsUsed?: number;
  maxAttempts?: number | null;
  expiresAtLabel?: string | null;
  timeRemainingLabel?: string | null;
  completedAt?: string | null;
  proofRequired: true;
  proofCtaLabel: string;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  existingProofCount: number;
  draftProof?: ActionProofDraft | null;
};

export type ActionParamValue = string | string[] | undefined;

export type ActionScreenParams = {
  dareId?: ActionParamValue;
  challengeId?: ActionParamValue; // compatibilidade temporária
  title?: ActionParamValue;
  challenger?: ActionParamValue;
  status?: ActionParamValue;
  attemptsUsed?: ActionParamValue;
  maxAttempts?: ActionParamValue;
  expiresAt?: ActionParamValue;
  expiresIn?: ActionParamValue;
};

export type ActionScreenState = {
  challenge: ActionChallenge;
  canSubmitProof: boolean;
  canOpenProofPreview: boolean;
  isExpired: boolean;
  isCompleted: boolean;
  progressValue: number;
};

export type ProofMediaType = Exclude<ActionProofMediaType, 'none'>;

export type SubmitDareProofPayload = {
  mediaType: ProofMediaType;
  fileUrl: string;
  durationSeconds: number | null;
  text: string;
};

export type SubmitDareProofResponse = {
  id: string;
  dareId: string;
  userId: string;
  mediaType: ProofMediaType;
  fileUrl: string;
  durationSeconds: number | null;
  text: string | null;
  createdAt: string;
};

export type SubmitProofPayload = SubmitDareProofPayload;