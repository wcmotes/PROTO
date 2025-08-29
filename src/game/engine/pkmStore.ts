// PKM Store - Central state management for Mystical House PKM features
// Integrates with existing game store for seamless gameplay

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Note,
  NoteLink,
  Tag,
  KnowledgeQuest,
  Room,
  PKMStats,
  PKMSettings,
  KnowledgeDomain,
  NoteType,
  LinkType,
  ReviewStatus,
  SPACED_REPETITION,
  QUEST_TEMPLATES
} from '../../types/pkm';
import { pkmStorage } from '../../lib/pkmStorage';

interface PKMStore {
  // Core Data
  notes: Note[];
  links: NoteLink[];
  tags: Tag[];
  quests: KnowledgeQuest[];
  rooms: Room[];
  stats: PKMStats | null;
  settings: PKMSettings | null;

  // UI State
  currentRoom: string | null;
  selectedNote: Note | null;
  searchQuery: string;
  searchResults: Note[];
  isNotesOverlayOpen: boolean;
  isCreatingNote: boolean;
  isReviewMode: boolean;

  // Actions
  initializePKM: () => Promise<void>;
  createNote: (noteData: Partial<Note>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  collectNote: (id: string) => Promise<void>;
  searchNotes: (query: string) => Promise<void>;
  createLink: (sourceId: string, targetId: string, type: LinkType, context?: string) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  createTag: (name: string, color: string) => Promise<void>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  reviewNote: (id: string, quality: 'again' | 'hard' | 'good' | 'easy') => Promise<void>;
  getNotesDueForReview: () => Promise<Note[]>;
  updateStats: (updates: Partial<PKMStats>) => Promise<void>;
  updateSettings: (updates: Partial<PKMSettings>) => Promise<void>;
  setCurrentRoom: (roomId: string | null) => void;
  setSelectedNote: (note: Note | null) => void;
  setNotesOverlayOpen: (open: boolean) => void;
  setCreatingNote: (creating: boolean) => void;
  setReviewMode: (review: boolean) => void;
  exportData: () => Promise<string>;
  importData: (jsonData: string) => Promise<void>;
}

// Default settings
const defaultSettings: PKMSettings = {
  autoSave: true,
  defaultDomain: 'personal',
  reviewReminders: true,
  dailyReviewGoal: 10,
  theme: 'retro_snes',
  soundEffects: true,
  showBacklinks: true,
  autoLinkSimilar: false
};

// Default stats
const defaultStats: PKMStats = {
  totalNotes: 0,
  collectedNotes: 0,
  totalLinks: 0,
  reviewStreak: 0,
  wisdomPoints: 0,
  completedQuests: 0,
  averageReviewAccuracy: 0,
  mostProductiveDomain: 'personal',
  recentActivity: []
};

// Default rooms
const defaultRooms: Room[] = [
  {
    id: 'main_hall',
    name: 'Main Hall',
    domain: 'personal',
    description: 'The central hub of your mystical house',
    position: { x: 0, y: 0 },
    size: { width: 640, height: 400 },
    colorScheme: {
      primary: '#4A90E2',
      secondary: '#7ED321',
      accent: '#F5A623',
      background: '#E6F0FF',
      atmosphere: 'mystical'
    },
    isUnlocked: true,
    notePositions: [],
    furniture: [
      {
        id: 'main_desk',
        type: 'desk',
        position: { x: 220, y: 80 },
        size: { width: 120, height: 24 },
        contains: [],
        isInteractable: true,
        interactionType: 'open'
      }
    ]
  }
];

export const usePKMStore = create<PKMStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        notes: [],
        links: [],
        tags: [],
        quests: [],
        rooms: defaultRooms,
        stats: defaultStats,
        settings: defaultSettings,
        currentRoom: 'main_hall',
        selectedNote: null,
        searchQuery: '',
        searchResults: [],
        isNotesOverlayOpen: false,
        isCreatingNote: false,
        isReviewMode: false,

        // Initialize PKM system
        initializePKM: async () => {
          try {
            await pkmStorage.init();

            // Load all data from storage
            const [notes, links, tags, quests, rooms, stats, settings] = await Promise.all([
              pkmStorage.getAllNotes(),
              pkmStorage.getAllLinks(),
              pkmStorage.getAllTags(),
              pkmStorage.getAllQuests(),
              pkmStorage.getAllRooms(),
              pkmStorage.getStats(),
              pkmStorage.getSettings()
            ]);

            set({
              notes,
              links,
              tags,
              quests,
              rooms: rooms.length > 0 ? rooms : defaultRooms,
              stats: stats || defaultStats,
              settings: settings || defaultSettings
            });
          } catch (error) {
            console.error('Failed to initialize PKM:', error);
            // Initialize with defaults if storage fails
            set({
              rooms: defaultRooms,
              stats: defaultStats,
              settings: defaultSettings
            });
          }
        },

        // Note management
        createNote: async (noteData) => {
          const settings = get().settings || defaultSettings;
          const now = new Date();

          const newNote: Note = {
            id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: noteData.title || 'Untitled Note',
            content: noteData.content || '',
            type: noteData.type || 'concept',
            domain: noteData.domain || settings.defaultDomain,
            tags: noteData.tags || [],
            createdAt: now,
            updatedAt: now,
            position: noteData.position || { x: Math.random() * 600, y: Math.random() * 350, room: get().currentRoom || 'main_hall' },
            isCollected: noteData.isCollected || false,
            reviewData: {
              status: 'new',
              easeFactor: SPACED_REPETITION.INITIAL_EASE,
              interval: SPACED_REPETITION.INITIAL_INTERVAL,
              nextReview: new Date(now.getTime() + SPACED_REPETITION.INITIAL_INTERVAL * 24 * 60 * 60 * 1000),
              reviewCount: 0,
              lastReviewed: null,
              correctStreak: 0,
              totalReviews: 0
            },
            metadata: {
              wordCount: (noteData.content || '').split(/\s+/).filter(word => word.length > 0).length,
              readingTime: Math.ceil(((noteData.content || '').length / 200)), // Rough estimate: 200 chars per minute
              links: [],
              backlinks: [],
              attachments: [],
              importance: 3
            }
          };

          await pkmStorage.createNote(newNote);

          set(state => ({
            notes: [...state.notes, newNote]
          }));

          // Update stats
          const updatedStats = {
            ...get().stats!,
            totalNotes: get().stats!.totalNotes + 1,
            recentActivity: [
              {
                id: `activity_${Date.now()}`,
                type: 'note_created',
                timestamp: now,
                description: `Created note: ${newNote.title}`,
                points: 10
              },
              ...get().stats!.recentActivity.slice(0, 9)
            ]
          };
          await get().updateStats(updatedStats);
        },

        updateNote: async (id, updates) => {
          const state = get();
          const noteIndex = state.notes.findIndex(note => note.id === id);
          if (noteIndex === -1) return;

          const updatedNote = {
            ...state.notes[noteIndex],
            ...updates,
            updatedAt: new Date(),
            metadata: {
              ...state.notes[noteIndex].metadata,
              wordCount: updates.content ? updates.content.split(/\s+/).filter(word => word.length > 0).length : state.notes[noteIndex].metadata.wordCount,
              readingTime: updates.content ? Math.ceil(updates.content.length / 200) : state.notes[noteIndex].metadata.readingTime
            }
          };

          await pkmStorage.updateNote(updatedNote);

          set(state => ({
            notes: state.notes.map(note => note.id === id ? updatedNote : note)
          }));
        },

        deleteNote: async (id) => {
          await pkmStorage.deleteNote(id);

          set(state => ({
            notes: state.notes.filter(note => note.id !== id),
            links: state.links.filter(link => link.sourceId !== id && link.targetId !== id)
          }));

          // Update stats
          const updatedStats = {
            ...get().stats!,
            totalNotes: Math.max(0, get().stats!.totalNotes - 1)
          };
          await get().updateStats(updatedStats);
        },

        collectNote: async (id) => {
          const state = get();
          const note = state.notes.find(n => n.id === id);
          if (!note || note.isCollected) return;

          const updatedNote = { ...note, isCollected: true };
          await pkmStorage.updateNote(updatedNote);

          set(state => ({
            notes: state.notes.map(n => n.id === id ? updatedNote : n)
          }));

          // Update stats
          const updatedStats = {
            ...get().stats!,
            collectedNotes: get().stats!.collectedNotes + 1,
            wisdomPoints: get().stats!.wisdomPoints + 5
          };
          await get().updateStats(updatedStats);
        },

        // Search functionality
        searchNotes: async (query) => {
          if (!query.trim()) {
            set({ searchQuery: '', searchResults: [] });
            return;
          }

          const results = await pkmStorage.searchNotes(query);
          set({ searchQuery: query, searchResults: results });
        },

        // Link management
        createLink: async (sourceId, targetId, type, context) => {
          const newLink: NoteLink = {
            id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sourceId,
            targetId,
            type,
            strength: 5,
            createdAt: new Date(),
            context
          };

          await pkmStorage.createLink(newLink);

          set(state => ({
            links: [...state.links, newLink]
          }));

          // Update note metadata
          const state = get();
          const sourceNote = state.notes.find(n => n.id === sourceId);
          const targetNote = state.notes.find(n => n.id === targetId);

          if (sourceNote) {
            await get().updateNote(sourceId, {
              metadata: {
                ...sourceNote.metadata,
                links: [...sourceNote.metadata.links.filter(l => l !== targetId), targetId]
              }
            });
          }

          if (targetNote) {
            await get().updateNote(targetId, {
              metadata: {
                ...targetNote.metadata,
                backlinks: [...targetNote.metadata.backlinks.filter(l => l !== sourceId), sourceId]
              }
            });
          }

          // Update stats
          const updatedStats = {
            ...get().stats!,
            totalLinks: get().stats!.totalLinks + 1
          };
          await get().updateStats(updatedStats);
        },

        deleteLink: async (id) => {
          const state = get();
          const link = state.links.find(l => l.id === id);
          if (!link) return;

          await pkmStorage.deleteLink(id);

          set(state => ({
            links: state.links.filter(l => l.id !== id)
          }));

          // Update note metadata
          const sourceNote = state.notes.find(n => n.id === link.sourceId);
          const targetNote = state.notes.find(n => n.id === link.targetId);

          if (sourceNote) {
            await get().updateNote(link.sourceId, {
              metadata: {
                ...sourceNote.metadata,
                links: sourceNote.metadata.links.filter(l => l !== link.targetId)
              }
            });
          }

          if (targetNote) {
            await get().updateNote(link.targetId, {
              metadata: {
                ...targetNote.metadata,
                backlinks: targetNote.metadata.backlinks.filter(l => l !== link.sourceId)
              }
            });
          }

          // Update stats
          const updatedStats = {
            ...get().stats!,
            totalLinks: Math.max(0, get().stats!.totalLinks - 1)
          };
          await get().updateStats(updatedStats);
        },

        // Tag management
        createTag: async (name, color) => {
          const newTag: Tag = {
            id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            color,
            description: '',
            noteCount: 0,
            createdAt: new Date()
          };

          await pkmStorage.createTag(newTag);

          set(state => ({
            tags: [...state.tags, newTag]
          }));
        },

        updateTag: async (id, updates) => {
          const state = get();
          const tagIndex = state.tags.findIndex(tag => tag.id === id);
          if (tagIndex === -1) return;

          const updatedTag = { ...state.tags[tagIndex], ...updates };
          await pkmStorage.updateTag(updatedTag);

          set(state => ({
            tags: state.tags.map(tag => tag.id === id ? updatedTag : tag)
          }));
        },

        // Spaced repetition
        reviewNote: async (id, quality) => {
          const state = get();
          const note = state.notes.find(n => n.id === id);
          if (!note) return;

          const now = new Date();
          const reviewData = note.reviewData;

          // Calculate new ease factor and interval based on quality
          let newEaseFactor = reviewData.easeFactor;
          let newInterval = reviewData.interval;

          switch (quality) {
            case 'again':
              newEaseFactor = Math.max(SPACED_REPETITION.MIN_EASE, reviewData.easeFactor * SPACED_REPETITION.AGAIN_MULTIPLIER);
              newInterval = SPACED_REPETITION.INITIAL_INTERVAL;
              break;
            case 'hard':
              newEaseFactor = Math.max(SPACED_REPETITION.MIN_EASE, reviewData.easeFactor * SPACED_REPETITION.HARD_MULTIPLIER);
              newInterval = Math.max(1, Math.floor(reviewData.interval * SPACED_REPETITION.HARD_MULTIPLIER));
              break;
            case 'good':
              newInterval = Math.max(SPACED_REPETITION.GRADUATING_INTERVAL, Math.floor(reviewData.interval * SPACED_REPETITION.GOOD_MULTIPLIER * reviewData.easeFactor));
              break;
            case 'easy':
              newEaseFactor = Math.min(SPACED_REPETITION.MAX_EASE, reviewData.easeFactor * SPACED_REPETITION.EASY_MULTIPLIER);
              newInterval = Math.floor(reviewData.interval * SPACED_REPETITION.EASY_MULTIPLIER * reviewData.easeFactor);
              break;
          }

          const newStatus: ReviewStatus =
            quality === 'again' ? 'learning' :
            reviewData.reviewCount >= 20 ? 'mastered' :
            'reviewing';

          const updatedReviewData = {
            status: newStatus,
            easeFactor: newEaseFactor,
            interval: newInterval,
            nextReview: new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000),
            reviewCount: reviewData.reviewCount + 1,
            lastReviewed: now,
            correctStreak: quality === 'again' ? 0 : reviewData.correctStreak + 1,
            totalReviews: reviewData.totalReviews + 1
          };

          await get().updateNote(id, { reviewData: updatedReviewData });

          // Update stats
          const accuracy = quality === 'again' ? 0 : quality === 'hard' ? 0.5 : quality === 'good' ? 0.8 : 1.0;
          const updatedStats = {
            ...get().stats!,
            averageReviewAccuracy: ((get().stats!.averageReviewAccuracy * get().stats!.recentActivity.filter(a => a.type === 'note_reviewed').length) + accuracy) /
                                 (get().stats!.recentActivity.filter(a => a.type === 'note_reviewed').length + 1),
            recentActivity: [
              {
                id: `activity_${Date.now()}`,
                type: 'note_reviewed',
                timestamp: now,
                description: `Reviewed note: ${note.title}`,
                points: quality === 'easy' ? 15 : quality === 'good' ? 10 : quality === 'hard' ? 5 : 2
              },
              ...get().stats!.recentActivity.slice(0, 9)
            ]
          };
          await get().updateStats(updatedStats);
        },

        getNotesDueForReview: async () => {
          return await pkmStorage.getNotesDueForReview();
        },

        // Stats and settings
        updateStats: async (updates) => {
          const newStats = { ...get().stats!, ...updates };
          await pkmStorage.updateStats(newStats);
          set({ stats: newStats });
        },

        updateSettings: async (updates) => {
          const newSettings = { ...get().settings!, ...updates };
          await pkmStorage.updateSettings(newSettings);
          set({ settings: newSettings });
        },

        // UI state management
        setCurrentRoom: (roomId) => set({ currentRoom: roomId }),
        setSelectedNote: (note) => set({ selectedNote: note }),
        setNotesOverlayOpen: (open) => set({ isNotesOverlayOpen: open }),
        setCreatingNote: (creating) => set({ isCreatingNote: creating }),
        setReviewMode: (review) => set({ isReviewMode: review }),

        // Data export/import
        exportData: async () => {
          return await pkmStorage.exportData();
        },

        importData: async (jsonData) => {
          await pkmStorage.importData(jsonData);
          await get().initializePKM(); // Reload all data
        }
      }),
      {
        name: 'mystical-house-pkm-storage',
        partialize: (state) => ({
          currentRoom: state.currentRoom,
          settings: state.settings
        })
      }
    ),
    {
      name: 'mystical-house-pkm'
    }
  )
);