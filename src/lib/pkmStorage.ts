// IndexedDB Storage System for Mystical House PKM
// Handles all data persistence with offline-first architecture

import { Note, NoteLink, Tag, KnowledgeQuest, Room, PKMStats, PKMSettings } from '../types/pkm';

class PKMStorage {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'MysticalHousePKM';
  private readonly dbVersion = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Notes store
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('domain', 'domain', { unique: false });
          notesStore.createIndex('type', 'type', { unique: false });
          notesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          notesStore.createIndex('createdAt', 'createdAt', { unique: false });
          notesStore.createIndex('nextReview', 'reviewData.nextReview', { unique: false });
        }

        // Links store
        if (!db.objectStoreNames.contains('links')) {
          const linksStore = db.createObjectStore('links', { keyPath: 'id' });
          linksStore.createIndex('source', 'sourceId', { unique: false });
          linksStore.createIndex('target', 'targetId', { unique: false });
          linksStore.createIndex('type', 'type', { unique: false });
        }

        // Tags store
        if (!db.objectStoreNames.contains('tags')) {
          db.createObjectStore('tags', { keyPath: 'id' });
        }

        // Quests store
        if (!db.objectStoreNames.contains('quests')) {
          db.createObjectStore('quests', { keyPath: 'id' });
        }

        // Rooms store
        if (!db.objectStoreNames.contains('rooms')) {
          db.createObjectStore('rooms', { keyPath: 'id' });
        }

        // Stats store (single record)
        if (!db.objectStoreNames.contains('stats')) {
          db.createObjectStore('stats', { keyPath: 'id' });
        }

        // Settings store (single record)
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // Notes CRUD
  async createNote(note: Note): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['notes'], 'readwrite');
    const store = transaction.objectStore('notes');
    await this.promisifyRequest(store.add(note));
  }

  async getNote(id: string): Promise<Note | null> {
    const db = this.ensureDB();
    const transaction = db.transaction(['notes'], 'readonly');
    const store = transaction.objectStore('notes');
    const result = await this.promisifyRequest(store.get(id));
    return result || null;
  }

  async updateNote(note: Note): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['notes'], 'readwrite');
    const store = transaction.objectStore('notes');
    await this.promisifyRequest(store.put(note));
  }

  async deleteNote(id: string): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['notes', 'links'], 'readwrite');

    // Delete the note
    const notesStore = transaction.objectStore('notes');
    await this.promisifyRequest(notesStore.delete(id));

    // Delete all links involving this note
    const linksStore = transaction.objectStore('links');
    const linksIndex = linksStore.index('source');
    const sourceLinks = await this.promisifyRequest(linksIndex.getAll(id));

    for (const link of sourceLinks) {
      await this.promisifyRequest(linksStore.delete(link.id));
    }

    const targetLinksIndex = linksStore.index('target');
    const targetLinks = await this.promisifyRequest(targetLinksIndex.getAll(id));

    for (const link of targetLinks) {
      await this.promisifyRequest(linksStore.delete(link.id));
    }
  }

  async getAllNotes(): Promise<Note[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['notes'], 'readonly');
    const store = transaction.objectStore('notes');
    return this.promisifyRequest(store.getAll());
  }

  async getNotesByDomain(domain: string): Promise<Note[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['notes'], 'readonly');
    const store = transaction.objectStore('notes');
    const index = store.index('domain');
    return this.promisifyRequest(index.getAll(domain));
  }

  async getNotesDueForReview(): Promise<Note[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['notes'], 'readonly');
    const store = transaction.objectStore('notes');
    const index = store.index('nextReview');
    const now = new Date();

    // Get all notes with nextReview <= now
    const range = IDBKeyRange.upperBound(now);
    const notes = await this.promisifyRequest(index.getAll(range));

    return notes.filter(note => note.reviewData.status !== 'mastered');
  }

  // Links CRUD
  async createLink(link: NoteLink): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['links'], 'readwrite');
    const store = transaction.objectStore('links');
    await this.promisifyRequest(store.add(link));
  }

  async getLinksForNote(noteId: string): Promise<NoteLink[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['links'], 'readonly');
    const store = transaction.objectStore('links');

    const sourceIndex = store.index('source');
    const targetIndex = store.index('target');

    const [sourceLinks, targetLinks] = await Promise.all([
      this.promisifyRequest(sourceIndex.getAll(noteId)),
      this.promisifyRequest(targetIndex.getAll(noteId))
    ]);

    return [...sourceLinks, ...targetLinks];
  }

  async deleteLink(id: string): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['links'], 'readwrite');
    const store = transaction.objectStore('links');
    await this.promisifyRequest(store.delete(id));
  }

  // Tags CRUD
  async createTag(tag: Tag): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['tags'], 'readwrite');
    const store = transaction.objectStore('tags');
    await this.promisifyRequest(store.add(tag));
  }

  async getAllTags(): Promise<Tag[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['tags'], 'readonly');
    const store = transaction.objectStore('tags');
    return this.promisifyRequest(store.getAll());
  }

  async updateTag(tag: Tag): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['tags'], 'readwrite');
    const store = transaction.objectStore('tags');
    await this.promisifyRequest(store.put(tag));
  }

  // Quests CRUD
  async createQuest(quest: KnowledgeQuest): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['quests'], 'readwrite');
    const store = transaction.objectStore('quests');
    await this.promisifyRequest(store.add(quest));
  }

  async getAllQuests(): Promise<KnowledgeQuest[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['quests'], 'readonly');
    const store = transaction.objectStore('quests');
    return this.promisifyRequest(store.getAll());
  }

  async updateQuest(quest: KnowledgeQuest): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['quests'], 'readwrite');
    const store = transaction.objectStore('quests');
    await this.promisifyRequest(store.put(quest));
  }

  // Rooms CRUD
  async createRoom(room: Room): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['rooms'], 'readwrite');
    const store = transaction.objectStore('rooms');
    await this.promisifyRequest(store.add(room));
  }

  async getAllRooms(): Promise<Room[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['rooms'], 'readonly');
    const store = transaction.objectStore('rooms');
    return this.promisifyRequest(store.getAll());
  }

  async updateRoom(room: Room): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['rooms'], 'readwrite');
    const store = transaction.objectStore('rooms');
    await this.promisifyRequest(store.put(room));
  }

  // Stats
  async getStats(): Promise<PKMStats | null> {
    const db = this.ensureDB();
    const transaction = db.transaction(['stats'], 'readonly');
    const store = transaction.objectStore('stats');
    const result = await this.promisifyRequest(store.get('main'));
    return result || null;
  }

  async updateStats(stats: PKMStats): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['stats'], 'readwrite');
    const store = transaction.objectStore('stats');
    await this.promisifyRequest(store.put({ ...stats, id: 'main' }));
  }

  // Settings
  async getSettings(): Promise<PKMSettings | null> {
    const db = this.ensureDB();
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const result = await this.promisifyRequest(store.get('main'));
    return result || null;
  }

  async updateSettings(settings: PKMSettings): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    await this.promisifyRequest(store.put({ ...settings, id: 'main' }));
  }

  // Search functionality
  async searchNotes(query: string): Promise<Note[]> {
    const allNotes = await this.getAllNotes();
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

    return allNotes.filter(note => {
      const searchableText = `${note.title} ${note.content} ${note.tags.join(' ')}`.toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  // Utility method to promisify IndexedDB requests
  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Export/Import functionality
  async exportData(): Promise<string> {
    const [notes, links, tags, quests, rooms, stats, settings] = await Promise.all([
      this.getAllNotes(),
      this.getAllLinks(),
      this.getAllTags(),
      this.getAllQuests(),
      this.getAllRooms(),
      this.getStats(),
      this.getSettings()
    ]);

    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      notes,
      links,
      tags,
      quests,
      rooms,
      stats,
      settings
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);

    // Clear existing data
    await this.clearAllData();

    // Import in correct order (respecting foreign keys)
    const db = this.ensureDB();
    const transaction = db.transaction(['notes', 'links', 'tags', 'quests', 'rooms', 'stats', 'settings'], 'readwrite');

    // Import notes
    const notesStore = transaction.objectStore('notes');
    for (const note of data.notes || []) {
      await this.promisifyRequest(notesStore.add(note));
    }

    // Import links
    const linksStore = transaction.objectStore('links');
    for (const link of data.links || []) {
      await this.promisifyRequest(linksStore.add(link));
    }

    // Import tags
    const tagsStore = transaction.objectStore('tags');
    for (const tag of data.tags || []) {
      await this.promisifyRequest(tagsStore.add(tag));
    }

    // Import quests
    const questsStore = transaction.objectStore('quests');
    for (const quest of data.quests || []) {
      await this.promisifyRequest(questsStore.add(quest));
    }

    // Import rooms
    const roomsStore = transaction.objectStore('rooms');
    for (const room of data.rooms || []) {
      await this.promisifyRequest(roomsStore.add(room));
    }

    // Import stats
    if (data.stats) {
      const statsStore = transaction.objectStore('stats');
      await this.promisifyRequest(statsStore.put({ ...data.stats, id: 'main' }));
    }

    // Import settings
    if (data.settings) {
      const settingsStore = transaction.objectStore('settings');
      await this.promisifyRequest(settingsStore.put({ ...data.settings, id: 'main' }));
    }
  }

  private async getAllLinks(): Promise<NoteLink[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['links'], 'readonly');
    const store = transaction.objectStore('links');
    return this.promisifyRequest(store.getAll());
  }

  private async clearAllData(): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['notes', 'links', 'tags', 'quests', 'rooms', 'stats', 'settings'], 'readwrite');

    const stores = ['notes', 'links', 'tags', 'quests', 'rooms', 'stats', 'settings'];
    for (const storeName of stores) {
      const store = transaction.objectStore(storeName);
      await this.promisifyRequest(store.clear());
    }
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
export const pkmStorage = new PKMStorage();