export type UserId = string;

export const USER_IDS: UserId[] = ["emmanuel", "vanessa", "laura", "juan-manuel"];

export const CATEGORIES = ["Programación", "HTML y CSS", "Inglés", "Diseño"] as const;
export type Category = (typeof CATEGORIES)[number];

export const DURATIONS = [15, 30] as const;
export type Duration = (typeof DURATIONS)[number];

export interface Skill {
  level?: "Inicial" | "Intermedio" | "Avanzado";
  id: string;
  name: string;
  category: Category;
}

export interface DayAvailability {
  /** 0 = domingo … 6 = sábado */
  day: number;
  from: string; // "HH:MM"
  to: string; // "HH:MM"
}

export type Availability = DayAvailability[];

export interface Profile {
  timeZone?: string | undefined;
  blockedDates?: string[] | undefined;
  id: UserId;
  name: string;
  tagline: string;
  bio?: string;
  photoUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  teaches: Skill[];
  learns: string[];
  availability: Availability;
}

export type RescueStatus = "open" | "accepted" | "completed" | "withdrawn";

export interface Rescue {
  attentionFlow?: boolean;
  timing?: "immediate" | "scheduled";
  scenarioId?: DemoScenario;
  id: string;
  authorId: UserId;
  title: string;
  description: string;
  category: Category;
  minutes: Duration;
  status: RescueStatus;
  helperId?: UserId;
  sessionId?: string;
  createdAt: number;
}

export type SessionStatus = "pending" | "accepted" | "completed" | "declined" | "cancelled";

export interface Session {
  /** Present only in the isolated demonstration ledger. */
  demo?: boolean;
  scenarioId?: DemoScenario;
  earlyDemo?: { byUserId: UserId; at: number; auditId: string };
  scheduledAt?: number | undefined;
  timeZone?: string;
  reschedule?: { scheduledAt: number; timeZone: string; proposedBy: UserId; proposedAt: number };
  scheduleHistory?: { scheduledAt: number; timeZone: string; replacedAt: number }[];
  attentionFlow?: boolean | undefined;
  attentionStartedAt?: number;
  attentionEndedAt?: number;
  reservedSources?: { regular: number; earned: number };
  id: string;
  learnerId: UserId;
  mentorId: UserId;
  minutes: Duration;
  topic: string;
  note?: string;
  origin: "explore" | "rescue";
  rescueId?: string;
  status: SessionStatus;
  learnerConfirmed: boolean;
  mentorConfirmed: boolean;
  createdAt: number;
  acceptedAt?: number;
  completedAt?: number;
  cancelledAt?: number;
  cancelledBy?: UserId;
}

export interface Movement {
  id: string;
  scenarioId?: DemoScenario;
  kind: "welcome" | "session" | "topup" | "earned" | "withdrawal";
  withdrawalId?: string;
  priceCop?: number;
  spentSources?: { regular: number; earned: number };
  topupId?: string;
  sessionId?: string;
  fromId?: UserId;
  toId: UserId;
  minutes: number;
  concept: string;
  at: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: UserId;
  body: string;
  clientId: string;
  createdAt: number;
}

export type NotificationKind =
  | "request"
  | "accepted"
  | "declined"
  | "message"
  | "cancelled"
  | "reminder"
  | "confirmation"
  | "completed"
  | "balance"
  | "rescue";

export interface SkillNotification {
  id: string;
  eventKey: string;
  userId: UserId;
  sessionId: string;
  rescueId?: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: number;
  readAt?: number;
}

export type DemoScenario = "agenda" | "chat" | "reputation" | "onboarding" | "matching" | "impact" | "moderation" | "rescues";

export interface Review {
  id: string;
  sessionId: string;
  authorId: UserId;
  targetId: UserId;
  rating: number;
  comment: string;
  createdAt: number;
  scenarioId?: DemoScenario;
}

export interface CommunityReport {
  id: string;
  sessionId: string;
  authorId: UserId;
  reportedId: UserId;
  reason: "conducta" | "inasistencia" | "incumplimiento" | "otro";
  details: string;
  status: "open" | "resolved";
  createdAt: number;
  resolution?: string;
  resolvedAt?: number;
  resolvedBy?: UserId;
  scenarioId?: DemoScenario;
}

export interface ModeratorAction {
  id: string;
  reportId: string;
  moderatorId: UserId;
  decision: string;
  createdAt: number;
  scenarioId?: DemoScenario;
}

export interface CommunityRestriction {
  id: string;
  targetId: UserId;
  moderatorId: UserId;
  reason: string;
  active: boolean;
  createdAt: number;
  updatedAt?: number;
  scenarioId?: DemoScenario;
}

export interface OnboardingProgress {
  step: number;
  completed: boolean;
}

export interface PresentationState {
  enabled: boolean;
  collapsed?: boolean | undefined;
  adminEnabled?: boolean;
  scenario?: DemoScenario | undefined;
  /** Previous profile values saved only for the relevant prepared scenario. */
  profileBackups?: Partial<Record<DemoScenario, Partial<Record<UserId, Profile>>>>;
  onboardingBackups?: Partial<Record<DemoScenario, Record<UserId, OnboardingProgress | undefined>>>;
}

export interface RescueDraft {
  title: string;
  description: string;
  category: Category;
  minutes: Duration;
}

export interface DemoState {
  /** Anonymous occupied intervals projected by the server, never private sessions. */
  busySlots?: Record<UserId, { start: number; end: number }[]> | undefined;
  testing?: boolean;
  topups?: {
    id: string;
    userId: UserId;
    minutes: number;
    priceCop: number;
    status: "pending" | "approved" | "rejected";
    createdAt: number;
  }[];
  testPackages?: { minutes: number; priceCop: number }[];
  requestDrafts?: Record<
    UserId,
    {
      mentorId: UserId;
      topic: string;
      minutes: Duration;
      note: string;
      scheduledAt?: number | undefined;
      timeZone?: string | undefined;
    }
  >;
  version: 1;
  seq: number;
  activeUserId: UserId;
  profiles: Record<UserId, Profile>;
  rescues: Rescue[];
  sessions: Session[];
  messages?: ChatMessage[];
  notifications?: SkillNotification[];
  reviews?: Review[];
  reports?: CommunityReport[];
  moderationLog?: ModeratorAction[];
  restrictions?: CommunityRestriction[];
  onboarding?: Record<UserId, OnboardingProgress>;
  presentation?: PresentationState;
  communitySummary?: { users: number; sessions: number; completed: number; reportsOpen: number };
  movements: Movement[];
  drafts: Partial<Record<UserId, RescueDraft>>;
}
