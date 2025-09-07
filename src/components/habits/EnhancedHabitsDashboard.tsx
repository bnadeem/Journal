'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Habit } from '@/types/journal';
import UnifiedCalendar from '@/components/habits/UnifiedCalendar';
import HabitLegend from '@/components/habits/HabitLegend';
import DaySidebar from '@/components/habits/DaySidebar';
import HabitEditModal from '@/components/habits/HabitEditModal';
import { HabitCompletion } from '@/components/habits/UnifiedCalendarDay';
import { HABIT_FORMATION_STAGES, getHabitStatusMessage, getNextMilestone } from '@/lib/habit-permanence';
import { toggleHabitAction, createHabitAction, updateHabitAction, toggleHabitActiveAction, deleteHabitAction } from '@/app/actions';
import NewEntryButton from '@/components/ui/NewEntryButton';
import { HabitData } from '@/lib/habits';
import '@/components/habits/unified-calendar.css';
import '@/components/habits/habit-legend.css';
import '@/components/habits/day-sidebar.css';

interface JournalEntry {
  year: string;
  month: string;
  day: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface EnhancedHabitsDashboardProps {
  initialHabitData: HabitData;
  initialRecentEntries: JournalEntry[];
}

export default function EnhancedHabitsDashboard({ 
  initialHabitData, 
  initialRecentEntries 
}: EnhancedHabitsDashboardProps) {
  const { habits, habitStats, habitPermanence, habitRisks } = initialHabitData;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Habit-related state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [visibleHabits, setVisibleHabits] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<{ date: Date; dateString: string; dayHabits: any[] } | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: '',
    color: '#3b82f6',
    targetFrequency: 'daily' as 'daily' | 'weekly' | 'monthly',
  });

  // Journal-related state
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>(initialRecentEntries);
  const [quickEntryContent, setQuickEntryContent] = useState('');
  const [isSubmittingQuickEntry, setIsSubmittingQuickEntry] = useState(false);
  const [quickEntryFocused, setQuickEntryFocused] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  // Search functionality
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JournalEntry[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Full editor modal
  const [fullEditorOpen, setFullEditorOpen] = useState(false);
  const [fullEditorContent, setFullEditorContent] = useState('');
  const [fullEditorDate, setFullEditorDate] = useState<Date | null>(null);
  const [savingFullEditor, setSavingFullEditor] = useState(false);

  useEffect(() => {
    if (habits.length > 0) {
      setVisibleHabits(habits.map((h: Habit) => h.id));
    }
  }, [habits]);

  // Auto-save draft functionality
  useEffect(() => {
    const savedDraft = localStorage.getItem('quick-entry-draft');
    if (savedDraft) {
      setQuickEntryContent(savedDraft);
      setHasUnsavedChanges(true);
    }
  }, []);

  useEffect(() => {
    if (quickEntryContent) {
      localStorage.setItem('quick-entry-draft', quickEntryContent);
      setHasUnsavedChanges(true);
    } else {
      localStorage.removeItem('quick-entry-draft');
      setHasUnsavedChanges(false);
    }
  }, [quickEntryContent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search functionality
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/entries?search=${encodeURIComponent(query)}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.entries || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Habit management functions
  const createHabit = async () => {
    const formData = new FormData();
    formData.append('name', newHabit.name);
    formData.append('description', newHabit.description);
    formData.append('category', newHabit.category);
    formData.append('color', newHabit.color);
    formData.append('targetFrequency', newHabit.targetFrequency);

    startTransition(async () => {
      await createHabitAction(formData);
      setNewHabit({
        name: '',
        description: '',
        category: '',
        color: '#3b82f6',
        targetFrequency: 'daily',
      });
      setShowCreateForm(false);
      router.refresh();
    });
  };

  const updateHabit = async (habit: Habit) => {
    const formData = new FormData();
    formData.append('id', habit.id);
    formData.append('name', habit.name);
    formData.append('description', habit.description || '');
    formData.append('category', habit.category);
    formData.append('color', habit.color);
    formData.append('targetFrequency', habit.targetFrequency);

    startTransition(async () => {
      await updateHabitAction(formData);
      setEditingHabit(null);
      router.refresh();
    });
  };

  const toggleHabitActive = async (habitId: string) => {
    const formData = new FormData();
    formData.append('habitId', habitId);

    startTransition(async () => {
      await toggleHabitActiveAction(formData);
      router.refresh();
    });
  };

  const deleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
      return;
    }

    const formData = new FormData();
    formData.append('habitId', habitId);

    startTransition(async () => {
      await deleteHabitAction(formData);
      setEditingHabit(null);
      router.refresh();
    });
  };

  const toggleHabit = async (habitId: string, dateString: string) => {
    const formData = new FormData();
    formData.append('habitId', habitId);
    formData.append('date', dateString);

    startTransition(async () => {
      await toggleHabitAction(formData);
      router.refresh();
    });
  };

  // Journal quick entry function
  const submitQuickEntry = async () => {
    if (!quickEntryContent.trim()) return;

    setIsSubmittingQuickEntry(true);
    const today = new Date();
    const year = today.getFullYear();
    const month = today.toLocaleString('default', { month: 'short' });
    const day = today.getDate();

    try {
      const response = await fetch(`/api/entries/${year}/${month}/${day}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: quickEntryContent,
        }),
      });

      if (response.ok) {
        setQuickEntryContent('');
        setHasUnsavedChanges(false);
        localStorage.removeItem('quick-entry-draft');
        
        const now = new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        setLastSaved(`Saved at ${now}`);
        
        // Clear the "last saved" message after 3 seconds
        setTimeout(() => setLastSaved(null), 3000);
        
        // Refresh recent entries
        const entriesResponse = await fetch('/api/entries?recent=true&limit=7');
        if (entriesResponse.ok) {
          const data = await entriesResponse.json();
          setRecentEntries(data.recent || []);
        }
      }
    } catch (error) {
      console.error('Error creating quick entry:', error);
    } finally {
      setIsSubmittingQuickEntry(false);
    }
  };

  const clearDraft = () => {
    setQuickEntryContent('');
    setHasUnsavedChanges(false);
    localStorage.removeItem('quick-entry-draft');
  };

  // Full editor functions
  const openFullEditor = (content: string = '', date: Date = new Date()) => {
    setFullEditorContent(content);
    setFullEditorDate(date);
    setFullEditorOpen(true);
  };

  const closeFullEditor = () => {
    setFullEditorOpen(false);
    setFullEditorContent('');
    setFullEditorDate(null);
  };

  const saveFullEditor = async () => {
    if (!fullEditorContent.trim() || !fullEditorDate) return;

    setSavingFullEditor(true);
    const year = fullEditorDate.getFullYear();
    const month = fullEditorDate.toLocaleString('default', { month: 'short' });
    const day = fullEditorDate.getDate();

    try {
      const response = await fetch(`/api/entries/${year}/${month}/${day}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: fullEditorContent,
        }),
      });

      if (response.ok) {
        closeFullEditor();
        
        // Clear quick entry if it was the source
        if (quickEntryContent === fullEditorContent) {
          setQuickEntryContent('');
          setHasUnsavedChanges(false);
          localStorage.removeItem('quick-entry-draft');
        }
        
        // Refresh recent entries
        const entriesResponse = await fetch('/api/entries?recent=true&limit=7');
        if (entriesResponse.ok) {
          const data = await entriesResponse.json();
          setRecentEntries(data.recent || []);
        }
      }
    } catch (error) {
      console.error('Error saving full editor entry:', error);
    } finally {
      setSavingFullEditor(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      submitQuickEntry();
    }
  };

  // Get habit completion percentage
  const getCompletionPercentage = () => {
    if (!habitStats || Object.keys(habitStats).length === 0) return 0;
    
    const totalHabits = Object.keys(habitStats).length;
    const completedToday = Object.values(habitStats).filter(stat => {
      const today = new Date().toISOString().split('T')[0];
      return stat.lastCompleted === today;
    }).length;
    
    return Math.round((completedToday / totalHabits) * 100);
  };

  const activeHabits = habits.filter((h: Habit) => h.isActive);
  const completionPercentage = getCompletionPercentage();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with metrics strip */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                🏠 Personal Growth Dashboard
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Track your habits and capture your thoughts in one unified space
              </p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <button
                onClick={() => setSearchOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                🔍 Search (⌘K)
              </button>
              <NewEntryButton />
              <Link
                href="/year"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                📚 View All Entries
              </Link>
            </div>
          </div>

          {/* Habit metrics strip */}
          {activeHabits.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Today</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(habitStats).reduce((max, stat) => Math.max(max, stat.currentStreak), 0)}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Best Streak</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{activeHabits.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Active</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.values(habitPermanence).filter((p: any) => p.stage === 'Automatic').length}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Auto</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-red-500">
                  {Object.keys(habitRisks).filter(id => habitRisks[id].riskLevel === 'high').length}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Risk</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main habit calendar area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🗓️</span>
                    <h2 className="text-xl font-semibold text-gray-900">Habit Calendar</h2>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                  >
                    + Add Habit
                  </button>
                </div>

                {activeHabits.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No habits yet</h3>
                    <p className="text-gray-500 mb-4">Create your first habit to start tracking your progress</p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                    >
                      🎯 Create Your First Habit
                    </button>
                  </div>
                ) : (
                  <>
                    <UnifiedCalendar
                      habits={habits}
                      habitStats={habitStats}
                      visibleHabits={visibleHabits}
                      onDayClick={(date, dateString, dayHabits) => 
                        setSelectedDay({ date, dateString, dayHabits })
                      }
                    />
                    <HabitLegend
                      habits={habits}
                      visibleHabits={visibleHabits}
                      onToggleVisibility={(habitId) => {
                        setVisibleHabits(prev => 
                          prev.includes(habitId) 
                            ? prev.filter(id => id !== habitId)
                            : [...prev, habitId]
                        );
                      }}
                      onEditHabit={setEditingHabit}
                      habitPermanence={habitPermanence}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar with journal quick entry and recent entries */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Quick journal entry panel */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✍️</span>
                    <h3 className="text-lg font-semibold text-gray-900">Quick Entry</h3>
                  </div>
                  {hasUnsavedChanges && (
                    <button
                      onClick={clearDraft}
                      className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                      title="Clear draft"
                    >
                      Clear draft
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={quickEntryContent}
                      onChange={(e) => setQuickEntryContent(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onFocus={() => setQuickEntryFocused(true)}
                      onBlur={() => setQuickEntryFocused(false)}
                      placeholder="What's on your mind today? (Cmd+Enter to save)"
                      className={`w-full p-3 border rounded-lg resize-none text-gray-900 placeholder-gray-500 transition-all duration-200 ${
                        quickEntryFocused 
                          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      rows={quickEntryFocused ? 6 : 4}
                    />
                    {hasUnsavedChanges && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Unsaved changes"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {lastSaved ? (
                        <span className="text-green-600">{lastSaved}</span>
                      ) : hasUnsavedChanges ? (
                        <span className="text-yellow-600">Draft saved locally</span>
                      ) : (
                        <span>Cmd+Enter to save</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {quickEntryContent.length} chars
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={submitQuickEntry}
                      disabled={!quickEntryContent.trim() || isSubmittingQuickEntry}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                    >
                      {isSubmittingQuickEntry ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </span>
                      ) : (
                        'Save Entry'
                      )}
                    </button>
                    {quickEntryContent.trim() && (
                      <button
                        onClick={() => openFullEditor(quickEntryContent)}
                        className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
                      >
                        📝 Full Editor
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent entries */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl">📚</span>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Entries</h3>
                </div>
                {recentEntries.length === 0 ? (
                  <p className="text-gray-500 text-sm">No entries yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentEntries.map((entry) => (
                      <Link
                        key={`${entry.year}-${entry.month}-${entry.day}`}
                        href={`/entry/${entry.year}/${entry.month}/${entry.day}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {entry.month} {entry.day}, {entry.year}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {entry.content.substring(0, 100)}...
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Habit creation form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Habit</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Habit name"
                value={newHabit.name}
                onChange={(e) => setNewHabit({...newHabit, name: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newHabit.description}
                onChange={(e) => setNewHabit({...newHabit, description: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
              <input
                type="text"
                placeholder="Category (e.g., Health, Work)"
                value={newHabit.category}
                onChange={(e) => setNewHabit({...newHabit, category: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
              <div className="flex gap-4">
                <input
                  type="color"
                  value={newHabit.color}
                  onChange={(e) => setNewHabit({...newHabit, color: e.target.value})}
                  className="w-16 h-12 border border-gray-200 rounded-lg cursor-pointer"
                />
                <select
                  value={newHabit.targetFrequency}
                  onChange={(e) => setNewHabit({...newHabit, targetFrequency: e.target.value as 'daily' | 'weekly' | 'monthly'})}
                  className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={createHabit}
                disabled={!newHabit.name.trim() || isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors duration-200"
              >
                {isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day sidebar */}
      {selectedDay && (
        <DaySidebar
          date={selectedDay.date}
          dateString={selectedDay.dateString}
          dayHabits={selectedDay.dayHabits}
          habits={habits}
          onClose={() => setSelectedDay(null)}
          onToggleHabit={toggleHabit}
        />
      )}

      {/* Habit edit modal */}
      {editingHabit && (
        <HabitEditModal
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSave={updateHabit}
          onToggleActive={toggleHabitActive}
          onDelete={deleteHabit}
          habitPermanence={habitPermanence[editingHabit.id]}
        />
      )}

      {/* Search modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 pt-20">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-lg">🔍</span>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your journal entries..."
                  className="w-full pl-10 pr-4 py-3 border-none bg-transparent text-lg focus:outline-none text-gray-900 placeholder-gray-500"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {searchLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center gap-3 text-gray-500">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    Searching...
                  </div>
                </div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">📭</div>
                  <p>No entries found for "{searchQuery}"</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {searchResults.map((entry, index) => (
                    <Link
                      key={`${entry.year}-${entry.month}-${entry.day}`}
                      href={`/entry/${entry.year}/${entry.month}/${entry.day}`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          {entry.month} {entry.day}, {entry.year}
                        </h4>
                        <div className="text-xs text-gray-400">
                          {entry.content.length} chars
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {entry.content.substring(0, 150)}...
                      </p>
                    </Link>
                  ))}
                </div>
              ) : !searchQuery ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">💭</div>
                  <p>Start typing to search your journal entries</p>
                  <div className="mt-4 text-xs text-gray-400">
                    <p>Try searching for words, phrases, or dates</p>
                  </div>
                </div>
              ) : null}
            </div>
            
            <div className="p-3 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span>⏎ to select</span>
                <span>↑↓ to navigate</span>
                <span>esc to close</span>
              </div>
              {searchResults.length > 0 && (
                <span>{searchResults.length} results</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full editor modal */}
      {fullEditorOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex-shrink-0 border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={closeFullEditor}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ←
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {fullEditorDate ? `Journal Entry - ${fullEditorDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}` : 'New Entry'}
                  </h2>
                  <p className="text-sm text-gray-500">Full editor mode</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-400">
                  {fullEditorContent.length} characters
                </div>
                <button
                  onClick={saveFullEditor}
                  disabled={!fullEditorContent.trim() || savingFullEditor}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                >
                  {savingFullEditor ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </span>
                  ) : (
                    'Save Entry'
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-4">
            <textarea
              value={fullEditorContent}
              onChange={(e) => setFullEditorContent(e.target.value)}
              placeholder="Write your thoughts here... Express yourself freely."
              className="w-full h-full p-6 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base leading-relaxed"
              autoFocus
            />
          </div>
          
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span>⌘+S to save</span>
                <span>Esc to close</span>
              </div>
              <div>
                Last saved: Never
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}