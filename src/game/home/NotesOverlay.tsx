// Comprehensive PKM Interface for Mystical House
// Features: Rich text editing, linking, search, spaced repetition, knowledge quests

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../engine/gameStore';
import { usePKMStore } from '../engine/pkmStore';
import RichTextEditor from '../../components/RichTextEditor';
import { Note, KnowledgeDomain, NoteType, LinkType } from '../../types/pkm';

interface NotesOverlayProps {
  onClose: () => void;
}

type ViewMode = 'notes' | 'search' | 'review' | 'quests' | 'stats' | 'settings' | 'help';

const DOMAIN_COLORS: Record<KnowledgeDomain, string> = {
  philosophy: '#9F7AEA',
  science: '#3182CE',
  technology: '#38A169',
  art: '#D69E2E',
  history: '#E53E3E',
  personal: '#805AD5',
  projects: '#DD6B20',
  learning: '#319795'
};

const TYPE_ICONS: Record<NoteType, string> = {
  concept: '💡',
  fact: '📊',
  question: '❓',
  insight: '✨',
  task: '✅',
  reference: '📚',
  journal: '📝'
};

export default function NotesOverlay({ onClose }: NotesOverlayProps) {
  const { atmosphere } = useGameStore();
  const {
    notes,
    links,
    tags,
    quests,
    stats,
    settings,
    selectedNote,
    searchQuery,
    searchResults,
    isCreatingNote,
    isReviewMode,
    initializePKM,
    createNote,
    updateNote,
    deleteNote,
    collectNote,
    searchNotes,
    createLink,
    createTag,
    reviewNote,
    getNotesDueForReview,
    setSelectedNote,
    setCreatingNote,
    setReviewMode
  } = usePKMStore();

  const [viewMode, setViewMode] = useState<ViewMode>('notes');
  const [filterDomain, setFilterDomain] = useState<KnowledgeDomain | 'all'>('all');
  const [filterType, setFilterType] = useState<NoteType | 'all'>('all');
  const [linkTargetId, setLinkTargetId] = useState<string>('');
  const [linkType, setLinkType] = useState<LinkType>('related');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#9F7AEA');
  const [notesDue, setNotesDue] = useState<Note[]>([]);

  // Initialize PKM system
  useEffect(() => {
    initializePKM();
  }, [initializePKM]);

  // Load notes due for review
  useEffect(() => {
    const loadDueNotes = async () => {
      const due = await getNotesDueForReview();
      setNotesDue(due);
    };
    loadDueNotes();
  }, [getNotesDueForReview, notes]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    if (filterDomain !== 'all') {
      filtered = filtered.filter(note => note.domain === filterDomain);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(note => note.type === filterType);
    }

    if (searchQuery) {
      filtered = searchResults;
    }

    return filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [notes, filterDomain, filterType, searchQuery, searchResults]);

  // Atmosphere-based theming
  const theme = useMemo(() => {
    const themes = {
      horror: {
        bg: 'rgba(0,0,0,0.9)',
        panel: '#0F0F0F',
        text: '#E2E8F0',
        accent: '#8B0000',
        border: '#2C1810',
        secondary: '#1A1A2E'
      },
      dark_transition: {
        bg: 'rgba(0,0,0,0.8)',
        panel: '#1A202C',
        text: '#E2E8F0',
        accent: '#4A5568',
        border: '#4A5568',
        secondary: '#2D3748'
      },
      unsettling: {
        bg: 'rgba(255,245,230,0.9)',
        panel: '#FDF6E3',
        text: '#744210',
        accent: '#D69E2E',
        border: '#D69E2E',
        secondary: '#FAEBCB'
      },
      cheerful: {
        bg: 'rgba(255,255,255,0.95)',
        panel: '#FFFFFF',
        text: '#1A202C',
        accent: '#63B3ED',
        border: '#E2E8F0',
        secondary: '#F7FAFC'
      },
      neutral: {
        bg: 'rgba(247,250,252,0.95)',
        panel: '#FFFFFF',
        text: '#1A202C',
        accent: '#CBD5E0',
        border: '#E2E8F0',
        secondary: '#EDF2F7'
      }
    };
    return themes[atmosphere];
  }, [atmosphere]);

  // Handle note creation
  const handleCreateNote = async () => {
    setCreatingNote(true);
    setSelectedNote(null);
  };

  const handleSaveNewNote = async (noteData: Partial<Note>) => {
    await createNote(noteData);
    setCreatingNote(false);
  };

  const handleCancelNewNote = () => {
    setCreatingNote(false);
  };

  // Handle search
  const handleSearch = (query: string) => {
    searchNotes(query);
  };

  // Handle linking
  const handleCreateLink = async () => {
    if (selectedNote && linkTargetId) {
      await createLink(selectedNote.id, linkTargetId, linkType);
      setLinkTargetId('');
    }
  };

  // Handle review
  const handleReviewNote = async (noteId: string, quality: 'again' | 'hard' | 'good' | 'easy') => {
    await reviewNote(noteId, quality);
    // Reload due notes
    const due = await getNotesDueForReview();
    setNotesDue(due);
  };

  // Navigation items
  const navItems = [
    { id: 'notes', label: '📝 Notes', mode: 'notes' as ViewMode },
    { id: 'search', label: '🔍 Search', mode: 'search' as ViewMode },
    { id: 'review', label: `🧠 Review (${notesDue.length})`, mode: 'review' as ViewMode },
    { id: 'quests', label: '🎯 Quests', mode: 'quests' as ViewMode },
    { id: 'stats', label: '📊 Stats', mode: 'stats' as ViewMode },
    { id: 'settings', label: '⚙️ Settings', mode: 'settings' as ViewMode },
    { id: 'help', label: '❓ Help', mode: 'help' as ViewMode }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: theme.bg }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full h-full max-w-7xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex border"
        style={{ background: theme.panel, borderColor: theme.border }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar Navigation */}
        <div className="w-64 border-r flex flex-col" style={{ borderColor: theme.border, background: theme.secondary }}>
          <div className="p-4 border-b" style={{ borderColor: theme.border }}>
            <h2 className="text-xl font-bold" style={{ color: theme.text }}>Mystical PKM</h2>
            <p className="text-sm opacity-75" style={{ color: theme.text }}>Knowledge Management</p>
          </div>

          <nav className="flex-1 p-2">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode(item.mode)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-all ${
                  viewMode === item.mode ? 'shadow-md' : 'hover:shadow-sm'
                }`}
                style={{
                  background: viewMode === item.mode ? theme.accent : 'transparent',
                  color: viewMode === item.mode ? '#FFFFFF' : theme.text
                }}
              >
                {item.label}
              </motion.button>
            ))}
          </nav>

          <div className="p-4 border-t" style={{ borderColor: theme.border }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full py-2 rounded-lg font-medium"
              style={{ background: theme.accent, color: '#FFFFFF' }}
            >
              Return to House
            </motion.button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.text }}>
                {viewMode === 'notes' && 'Knowledge Notes'}
                {viewMode === 'search' && 'Search Knowledge'}
                {viewMode === 'review' && 'Review Session'}
                {viewMode === 'quests' && 'Knowledge Quests'}
                {viewMode === 'stats' && 'Knowledge Statistics'}
                {viewMode === 'settings' && 'PKM Settings'}
                {viewMode === 'help' && 'Help & Tutorial'}
              </h1>
              <p className="text-sm opacity-75" style={{ color: theme.text }}>
                {viewMode === 'notes' && `${filteredNotes.length} notes`}
                {viewMode === 'search' && `${searchResults.length} results`}
                {viewMode === 'review' && `${notesDue.length} notes due for review`}
                {viewMode === 'quests' && `${quests.filter(q => q.isCompleted).length}/${quests.length} quests completed`}
                {viewMode === 'stats' && `${stats?.wisdomPoints || 0} wisdom points earned`}
                {viewMode === 'settings' && 'Customize your PKM experience'}
              </p>
            </div>

            {viewMode === 'notes' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateNote}
                className="px-4 py-2 rounded-lg font-medium"
                style={{ background: theme.accent, color: '#FFFFFF' }}
              >
                ✏️ New Note
              </motion.button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            <AnimatePresence mode="wait">
              {/* Notes View */}
              {viewMode === 'notes' && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex"
                >
                  {/* Notes List */}
                  <div className="w-80 border-r pr-4" style={{ borderColor: theme.border }}>
                    {/* Filters */}
                    <div className="mb-4 space-y-2">
                      <select
                        value={filterDomain}
                        onChange={(e) => setFilterDomain(e.target.value as KnowledgeDomain | 'all')}
                        className="w-full p-2 rounded border"
                        style={{ background: theme.secondary, borderColor: theme.border, color: theme.text }}
                      >
                        <option value="all">All Domains</option>
                        {Object.keys(DOMAIN_COLORS).map(domain => (
                          <option key={domain} value={domain}>{domain.charAt(0).toUpperCase() + domain.slice(1)}</option>
                        ))}
                      </select>

                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as NoteType | 'all')}
                        className="w-full p-2 rounded border"
                        style={{ background: theme.secondary, borderColor: theme.border, color: theme.text }}
                      >
                        <option value="all">All Types</option>
                        {Object.keys(TYPE_ICONS).map(type => (
                          <option key={type} value={type}>{TYPE_ICONS[type as NoteType]} {type.charAt(0).toUpperCase() + type.slice(1)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Notes List */}
                    <div className="space-y-2">
                      {filteredNotes.map((note) => (
                        <motion.div
                          key={note.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedNote(note)}
                          className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${
                            selectedNote?.id === note.id ? 'shadow-lg' : ''
                          }`}
                          style={{
                            background: selectedNote?.id === note.id ? theme.accent : theme.secondary,
                            borderColor: DOMAIN_COLORS[note.domain],
                            color: selectedNote?.id === note.id ? '#FFFFFF' : theme.text
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span>{TYPE_ICONS[note.type]}</span>
                            <span className="text-sm opacity-75">{note.domain}</span>
                          </div>
                          <h3 className="font-semibold truncate">{note.title}</h3>
                          <p className="text-sm opacity-75 truncate">{note.content.replace(/<[^>]*>/g, '').slice(0, 50)}...</p>
                          <div className="text-xs opacity-50 mt-1">
                            {note.updatedAt.toLocaleDateString()}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Note Editor */}
                  <div className="flex-1 pl-4">
                    {isCreatingNote ? (
                      <NoteCreator
                        onSave={handleSaveNewNote}
                        onCancel={handleCancelNewNote}
                        theme={theme}
                      />
                    ) : selectedNote ? (
                      <NoteEditor
                        note={selectedNote}
                        onUpdate={updateNote}
                        onDelete={() => deleteNote(selectedNote.id)}
                        onCreateLink={setLinkTargetId}
                        theme={theme}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center" style={{ color: theme.text }}>
                          <div className="text-6xl mb-4">📚</div>
                          <h3 className="text-xl font-semibold mb-2">Select a Note</h3>
                          <p className="opacity-75">Choose a note from the list or create a new one</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Search View */}
              {viewMode === 'search' && (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-6">
                    <input
                      type="text"
                      placeholder="Search your knowledge..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full p-3 rounded-lg border-2 text-lg"
                      style={{
                        background: theme.secondary,
                        borderColor: theme.border,
                        color: theme.text
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    {searchResults.map((note) => (
                      <motion.div
                        key={note.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => {
                          setSelectedNote(note);
                          setViewMode('notes');
                        }}
                        className="p-4 rounded-lg border cursor-pointer"
                        style={{
                          background: theme.secondary,
                          borderColor: theme.border,
                          color: theme.text
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span>{TYPE_ICONS[note.type]}</span>
                          <h3 className="font-semibold">{note.title}</h3>
                          <span className="text-sm opacity-75 px-2 py-1 rounded" style={{ background: DOMAIN_COLORS[note.domain] }}>
                            {note.domain}
                          </span>
                        </div>
                        <p className="opacity-75" dangerouslySetInnerHTML={{
                          __html: note.content.length > 200 ? note.content.slice(0, 200) + '...' : note.content
                        }} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Review View */}
              {viewMode === 'review' && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {notesDue.length > 0 ? (
                    <ReviewSession
                      notes={notesDue}
                      onReview={handleReviewNote}
                      theme={theme}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎉</div>
                      <h3 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>
                        All Caught Up!
                      </h3>
                      <p className="opacity-75" style={{ color: theme.text }}>
                        No notes due for review. Great job maintaining your knowledge!
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Other views would go here */}
              {viewMode === 'quests' && (
                <motion.div
                  key="quests"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>
                      Knowledge Quests Coming Soon
                    </h3>
                    <p className="opacity-75" style={{ color: theme.text }}>
                      Gamified learning challenges to unlock new knowledge domains
                    </p>
                  </div>
                </motion.div>
              )}

              {viewMode === 'stats' && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>
                      Knowledge Statistics Coming Soon
                    </h3>
                    <p className="opacity-75" style={{ color: theme.text }}>
                      Track your learning progress and knowledge growth
                    </p>
                  </div>
                </motion.div>
              )}

              {viewMode === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SettingsPanel theme={theme} />
                </motion.div>
              )}

              {viewMode === 'help' && (
                <motion.div
                  key="help"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <HelpTutorial theme={theme} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Note Creator Component
function NoteCreator({ onSave, onCancel, theme }: any) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [domain, setDomain] = useState<KnowledgeDomain>('personal');
  const [type, setType] = useState<NoteType>('concept');

  const handleSave = () => {
    onSave({ title, content, domain, type });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 space-y-3">
        <input
          type="text"
          placeholder="Note Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 rounded-lg border-2 text-xl font-semibold"
          style={{ background: theme.secondary, borderColor: theme.border, color: theme.text }}
        />

        <div className="flex gap-3">
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as KnowledgeDomain)}
            className="flex-1 p-2 rounded border"
            style={{ background: theme.secondary, borderColor: theme.border, color: theme.text }}
          >
            {Object.keys(DOMAIN_COLORS).map(d => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value as NoteType)}
            className="flex-1 p-2 rounded border"
            style={{ background: theme.secondary, borderColor: theme.border, color: theme.text }}
          >
            {Object.keys(TYPE_ICONS).map(t => (
              <option key={t} value={t}>{TYPE_ICONS[t as NoteType]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1">
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Start writing your knowledge..."
          onSave={handleSave}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}

// Help Tutorial Component
function HelpTutorial({ theme }: any) {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: "🏠 Welcome to Mystical House PKM",
      content: "Your knowledge lives in a magical house! Navigate with WASD keys, interact with objects using E or N. This is where productivity meets adventure.",
      icon: "🏰"
    },
    {
      title: "📝 Creating Your First Note",
      content: "Click '✏️ New Note' to create your first knowledge entry. Choose a domain (Philosophy, Science, Technology, etc.) and type to organize your thoughts.",
      icon: "✏️"
    },
    {
      title: "🔗 Linking Knowledge",
      content: "Connect related notes using the '🔗 Link' button. Create bidirectional links to build a web of knowledge that grows stronger over time.",
      icon: "🔗"
    },
    {
      title: "🧠 Spaced Repetition Learning",
      content: "Review notes using the '🧠 Review' tab. Rate your recall (Again/Hard/Good/Easy) to optimize when you see each note next.",
      icon: "🧠"
    },
    {
      title: "🔍 Finding What You Need",
      content: "Use the '🔍 Search' tab to instantly find notes. Search by title, content, tags, or domain - your knowledge is always at your fingertips.",
      icon: "🔍"
    },
    {
      title: "📊 Tracking Your Progress",
      content: "Visit '📊 Stats' to see your learning progress. Track wisdom points, review streaks, and completed knowledge quests.",
      icon: "📊"
    },
    {
      title: "⚙️ Customizing Your Experience",
      content: "In '⚙️ Settings', adjust auto-save, review reminders, daily goals, and themes. Export/import your data for backup and portability.",
      icon: "⚙️"
    },
    {
      title: "🎯 Knowledge Quests (Coming Soon)",
      content: "Gamified learning challenges that unlock new knowledge domains and reward your dedication to lifelong learning.",
      icon: "🎯"
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentTutorial = tutorialSteps[currentStep];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm opacity-75" style={{ color: theme.text }}>
            Step {currentStep + 1} of {tutorialSteps.length}
          </span>
          <div className="flex gap-1">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-yellow-400' : 'bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Tutorial Content */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{currentTutorial.icon}</div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: theme.text }}>
          {currentTutorial.title}
        </h3>
        <p className="text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: theme.text }}>
          {currentTutorial.content}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={prevStep}
          disabled={currentStep === 0}
          className={`px-6 py-3 rounded-lg font-medium ${
            currentStep === 0
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-lg'
          }`}
          style={{
            background: currentStep === 0 ? theme.secondary : theme.accent,
            color: '#FFFFFF'
          }}
        >
          ← Previous
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-75 mb-2" style={{ color: theme.text }}>
            Keyboard shortcuts:
          </div>
          <div className="text-xs" style={{ color: theme.text }}>
            ← → Arrow keys • Esc to close
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={currentStep === tutorialSteps.length - 1 ? () => setCurrentStep(0) : nextStep}
          className="px-6 py-3 rounded-lg font-medium hover:shadow-lg"
          style={{ background: theme.accent, color: '#FFFFFF' }}
        >
          {currentStep === tutorialSteps.length - 1 ? '🔄 Restart' : 'Next →'}
        </motion.button>
      </div>

      {/* Quick Tips */}
      <div className="mt-8 p-4 rounded-lg border" style={{ background: theme.secondary, borderColor: theme.border }}>
        <h4 className="font-semibold mb-2" style={{ color: theme.text }}>💡 Quick Tips</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Rich Text:</strong> Use Ctrl+B/I/U for formatting, Ctrl+K for links
          </div>
          <div>
            <strong>Domains:</strong> Organize notes by knowledge areas for better discovery
          </div>
          <div>
            <strong>Links:</strong> Connect related concepts to build knowledge webs
          </div>
          <div>
            <strong>Reviews:</strong> Consistent review strengthens long-term retention
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div className="mt-6 p-4 rounded-lg border" style={{ background: theme.secondary, borderColor: theme.border }}>
        <h4 className="font-semibold mb-3" style={{ color: theme.text }}>⌨️ Essential Shortcuts</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div><strong>WASD</strong> - Move avatar</div>
          <div><strong>E/N</strong> - Interact</div>
          <div><strong>Esc</strong> - Close menus</div>
          <div><strong>Ctrl+S</strong> - Save note</div>
          <div><strong>Ctrl+B</strong> - Bold text</div>
          <div><strong>Ctrl+I</strong> - Italic text</div>
          <div><strong>Ctrl+K</strong> - Insert link</div>
          <div><strong>Shift+Enter</strong> - Quick save</div>
        </div>
      </div>
    </div>
  );
}

// Settings Panel Component
function SettingsPanel({ theme }: any) {
  const { settings, updateSettings, exportData, importData, stats } = usePKMStore();
  const [exportStatus, setExportStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mystical-house-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus('✅ Data exported successfully!');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      setExportStatus('❌ Export failed');
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importData(text);
      setImportStatus('✅ Data imported successfully!');
      setTimeout(() => setImportStatus(''), 3000);
    } catch (error) {
      setImportStatus('❌ Import failed - invalid file format');
      setTimeout(() => setImportStatus(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: theme.text }}>PKM Settings</h3>

        <div className="space-y-4">
          {/* Auto-save */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium" style={{ color: theme.text }}>Auto-save</label>
              <p className="text-sm opacity-75" style={{ color: theme.text }}>Automatically save changes</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.autoSave || false}
              onChange={(e) => updateSettings({ autoSave: e.target.checked })}
              className="w-4 h-4"
            />
          </div>

          {/* Review Reminders */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium" style={{ color: theme.text }}>Review Reminders</label>
              <p className="text-sm opacity-75" style={{ color: theme.text }}>Show notifications for due reviews</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.reviewReminders || false}
              onChange={(e) => updateSettings({ reviewReminders: e.target.checked })}
              className="w-4 h-4"
            />
          </div>

          {/* Daily Review Goal */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium" style={{ color: theme.text }}>Daily Review Goal</label>
              <p className="text-sm opacity-75" style={{ color: theme.text }}>Target reviews per day</p>
            </div>
            <input
              type="number"
              min="1"
              max="50"
              value={settings?.dailyReviewGoal || 10}
              onChange={(e) => updateSettings({ dailyReviewGoal: parseInt(e.target.value) })}
              className="w-20 px-2 py-1 rounded border text-center"
              style={{ background: theme.secondary, borderColor: theme.border, color: theme.text }}
            />
          </div>

          {/* Theme Selection */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium" style={{ color: theme.text }}>Theme</label>
              <p className="text-sm opacity-75" style={{ color: theme.text }}>Visual style</p>
            </div>
            <select
              value={settings?.theme || 'retro_snes'}
              onChange={(e) => updateSettings({ theme: e.target.value as any })}
              className="px-3 py-1 rounded border"
              style={{ background: theme.secondary, borderColor: theme.border, color: theme.text }}
            >
              <option value="retro_snes">Retro SNES</option>
              <option value="mystical">Mystical</option>
              <option value="scholarly">Scholarly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="border-t pt-6" style={{ borderColor: theme.border }}>
        <h4 className="text-md font-semibold mb-4" style={{ color: theme.text }}>Data Management</h4>

        <div className="space-y-3">
          {/* Export */}
          <div>
            <button
              onClick={handleExport}
              className="w-full px-4 py-2 rounded font-medium"
              style={{ background: theme.accent, color: '#FFFFFF' }}
            >
              📤 Export All Data
            </button>
            {exportStatus && (
              <p className="text-sm mt-1" style={{ color: exportStatus.includes('✅') ? '#38A169' : '#E53E3E' }}>
                {exportStatus}
              </p>
            )}
            <p className="text-xs opacity-75 mt-1" style={{ color: theme.text }}>
              Download a backup of all your notes, links, and settings
            </p>
          </div>

          {/* Import */}
          <div>
            <label className="block">
              <span className="sr-only">Import Data</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <button
                onClick={() => document.getElementById('import-file')?.click()}
                className="w-full px-4 py-2 rounded font-medium border-2"
                style={{ background: theme.secondary, borderColor: theme.border, color: theme.text }}
              >
                📥 Import Data
              </button>
            </label>
            {importStatus && (
              <p className="text-sm mt-1" style={{ color: importStatus.includes('✅') ? '#38A169' : '#E53E3E' }}>
                {importStatus}
              </p>
            )}
            <p className="text-xs opacity-75 mt-1" style={{ color: theme.text }}>
              Import data from a previously exported backup file
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="border-t pt-6" style={{ borderColor: theme.border }}>
        <h4 className="text-md font-semibold mb-4" style={{ color: theme.text }}>Quick Stats</h4>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 rounded" style={{ background: theme.secondary }}>
            <div className="text-2xl font-bold" style={{ color: theme.accent }}>
              {stats?.totalNotes || 0}
            </div>
            <div className="text-sm opacity-75" style={{ color: theme.text }}>Total Notes</div>
          </div>
          <div className="p-3 rounded" style={{ background: theme.secondary }}>
            <div className="text-2xl font-bold" style={{ color: theme.accent }}>
              {stats?.wisdomPoints || 0}
            </div>
            <div className="text-sm opacity-75" style={{ color: theme.text }}>Wisdom Points</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Note Editor Component
function NoteEditor({ note, onUpdate, onDelete, onCreateLink, theme }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);

  const handleSave = () => {
    onUpdate(note.id, { title: editTitle, content: editContent });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{TYPE_ICONS[note.type]}</span>
          <div>
            <h2 className="text-xl font-bold" style={{ color: theme.text }}>{note.title}</h2>
            <div className="flex items-center gap-2 text-sm opacity-75">
              <span style={{ color: DOMAIN_COLORS[note.domain] }}>{note.domain}</span>
              <span>•</span>
              <span>{note.updatedAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 rounded border"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                ✏️ Edit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCreateLink(note.id)}
                className="px-3 py-1 rounded border"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                🔗 Link
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="px-3 py-1 rounded"
                style={{ background: theme.accent, color: '#FFFFFF' }}
              >
                💾 Save
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="px-3 py-1 rounded border"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                ❌ Cancel
              </motion.button>
            </>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            className="px-3 py-1 rounded border border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          >
            🗑️ Delete
          </motion.button>
        </div>
      </div>

      {isEditing ? (
        <div className="flex-1">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full p-3 mb-4 rounded-lg border-2 text-xl font-semibold"
            style={{ background: theme.secondary, borderColor: theme.border, color: theme.text }}
          />
          <RichTextEditor
            content={editContent}
            onChange={setEditContent}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div
          className="flex-1 p-4 rounded-lg border prose max-w-none"
          style={{ background: theme.secondary, borderColor: theme.border, color: theme.text }}
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      )}
    </div>
  );
}

// Review Session Component
function ReviewSession({ notes, onReview, theme }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const currentNote = notes[currentIndex];

  if (!currentNote) return null;

  const handleReview = (quality: 'again' | 'hard' | 'good' | 'easy') => {
    onReview(currentNote.id, quality);
    setShowAnswer(false);

    if (currentIndex < notes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Review session complete
      setCurrentIndex(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <div className="text-4xl mb-2">🧠</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: theme.text }}>
          Review Session
        </h2>
        <p style={{ color: theme.text }}>
          Note {currentIndex + 1} of {notes.length}
        </p>
      </div>

      <div className="p-6 rounded-lg border-2 mb-6" style={{ background: theme.secondary, borderColor: theme.border }}>
        <div className="flex items-center gap-2 mb-3">
          <span>{TYPE_ICONS[currentNote.type]}</span>
          <h3 className="text-lg font-semibold" style={{ color: theme.text }}>
            {currentNote.title}
          </h3>
          <span className="text-sm px-2 py-1 rounded" style={{ background: DOMAIN_COLORS[currentNote.domain] }}>
            {currentNote.domain}
          </span>
        </div>

        {!showAnswer ? (
          <div className="text-center py-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAnswer(true)}
              className="px-6 py-3 rounded-lg font-medium text-lg"
              style={{ background: theme.accent, color: '#FFFFFF' }}
            >
              Show Answer
            </motion.button>
          </div>
        ) : (
          <div>
            <div
              className="mb-6 p-4 rounded border"
              style={{ background: theme.panel, borderColor: theme.border, color: theme.text }}
              dangerouslySetInnerHTML={{ __html: currentNote.content }}
            />

            <div className="flex gap-2 justify-center">
              {[
                { quality: 'again', label: 'Again', color: '#E53E3E' },
                { quality: 'hard', label: 'Hard', color: '#D69E2E' },
                { quality: 'good', label: 'Good', color: '#38A169' },
                { quality: 'easy', label: 'Easy', color: '#3182CE' }
              ].map(({ quality, label, color }) => (
                <motion.button
                  key={quality}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReview(quality as any)}
                  className="px-4 py-2 rounded font-medium text-white"
                  style={{ background: color }}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}