// Personal Knowledge Management Types for the Mystical House PKM System

export type KnowledgeDomain = 'philosophy' | 'science' | 'technology' | 'art' | 'history' | 'personal' | 'projects' | 'learning';

export type NoteType = 'concept' | 'fact' | 'question' | 'insight' | 'task' | 'reference' | 'journal';

export type LinkType = 'related' | 'prerequisite' | 'follows' | 'contradicts' | 'expands' | 'references';

export type ReviewStatus = 'new' | 'learning' | 'reviewing' | 'mastered';

export interface Note {
  id: string;
  title: string;
  content: string; // Rich text content
  type: NoteType;
  domain: KnowledgeDomain;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  position: { x: number; y: number; room: string }; // Position in the house
  isCollected: boolean;
  reviewData: ReviewData;
  metadata: NoteMetadata;
}

export interface ReviewData {
  status: ReviewStatus;
  easeFactor: number; // Spaced repetition ease factor
  interval: number; // Days between reviews
  nextReview: Date;
  reviewCount: number;
  lastReviewed: Date | null;
  correctStreak: number;
  totalReviews: number;
}

export interface NoteMetadata {
  wordCount: number;
  readingTime: number; // minutes
  links: string[]; // IDs of linked notes
  backlinks: string[]; // IDs of notes linking to this one
  attachments: string[]; // File paths or URLs
  importance: 1 | 2 | 3 | 4 | 5; // 1=low, 5=critical
}

export interface NoteLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: LinkType;
  strength: number; // 1-10, how strong the connection is
  createdAt: Date;
  context?: string; // Why these notes are linked
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  noteCount: number;
  createdAt: Date;
}

export interface KnowledgeQuest {
  id: string;
  title: string;
  description: string;
  objective: string;
  domain: KnowledgeDomain;
  requiredNotes: string[]; // Note IDs that must be collected
  reward: QuestReward;
  difficulty: 'easy' | 'medium' | 'hard' | 'epic';
  isCompleted: boolean;
  progress: number; // 0-100
  createdAt: Date;
  completedAt?: Date;
}

export interface QuestReward {
  wisdomPoints: number;
  unlocksRoom?: string;
  unlocksFeature?: string;
  specialEffect?: string;
}

export interface Room {
  id: string;
  name: string;
  domain: KnowledgeDomain;
  description: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  colorScheme: RoomColorScheme;
  isUnlocked: boolean;
  unlockRequirement?: string;
  notePositions: NotePosition[];
  furniture: Furniture[];
}

export interface RoomColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  atmosphere: 'mystical' | 'scholarly' | 'creative' | 'technical' | 'contemplative';
}

export interface NotePosition {
  noteId: string;
  x: number;
  y: number;
  collected: boolean;
  visualType: 'scroll' | 'book' | 'crystal' | 'artifact' | 'floating';
}

export interface Furniture {
  id: string;
  type: 'bookshelf' | 'desk' | 'cabinet' | 'chest' | 'altar' | 'portal';
  position: { x: number; y: number };
  size: { width: number; height: number };
  contains: string[]; // Note IDs
  isInteractable: boolean;
  interactionType: 'open' | 'read' | 'search' | 'meditate';
}

export interface SearchResult {
  note: Note;
  relevanceScore: number;
  matchedTerms: string[];
  context: string; // Snippet showing the match
}

export interface PKMStats {
  totalNotes: number;
  collectedNotes: number;
  totalLinks: number;
  reviewStreak: number;
  wisdomPoints: number;
  completedQuests: number;
  averageReviewAccuracy: number;
  mostProductiveDomain: KnowledgeDomain;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'note_created' | 'note_reviewed' | 'quest_completed' | 'link_created';
  timestamp: Date;
  description: string;
  points?: number;
}

export interface PKMSettings {
  autoSave: boolean;
  defaultDomain: KnowledgeDomain;
  reviewReminders: boolean;
  dailyReviewGoal: number;
  theme: 'retro_snes' | 'mystical' | 'scholarly';
  soundEffects: boolean;
  showBacklinks: boolean;
  autoLinkSimilar: boolean;
}

// Spaced Repetition Algorithm Constants
export const SPACED_REPETITION = {
  INITIAL_EASE: 2.5,
  MIN_EASE: 1.3,
  MAX_EASE: 3.0,
  EASY_MULTIPLIER: 1.3,
  GOOD_MULTIPLIER: 1.0,
  HARD_MULTIPLIER: 0.8,
  AGAIN_MULTIPLIER: 0.5,
  INITIAL_INTERVAL: 1, // days
  GRADUATING_INTERVAL: 4, // days
} as const;

// Knowledge Quest Templates
export const QUEST_TEMPLATES = {
  exploration: {
    title: 'Knowledge Explorer',
    description: 'Collect notes from different domains to build your understanding',
    objective: 'Collect 10 notes from at least 3 different domains',
    reward: { wisdomPoints: 100, unlocksFeature: 'domain_navigation' }
  },
  connection: {
    title: 'Link Weaver',
    description: 'Create meaningful connections between your notes',
    objective: 'Create 5 links between related notes',
    reward: { wisdomPoints: 150, unlocksFeature: 'link_visualization' }
  },
  mastery: {
    title: 'Master Scholar',
    description: 'Achieve mastery through consistent review',
    objective: 'Review 20 notes with 90% accuracy',
    reward: { wisdomPoints: 200, unlocksRoom: 'mastery_hall' }
  }
} as const;