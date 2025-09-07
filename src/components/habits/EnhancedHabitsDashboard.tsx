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
  
  // Mobile gesture support
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isSwipeGesture, setIsSwipeGesture] = useState(false);
  
  // Analytics and insights
  const [insights, setInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

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

  // Load insights automatically
  useEffect(() => {
    if (habits.length > 0 && recentEntries.length > 0 && !insights) {
      generateInsights();
    }
  }, [habits, recentEntries]);

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
    formData.append('category', habit.category || '');
    formData.append('color', habit.color || '#3b82f6');
    formData.append('targetFrequency', habit.targetFrequency || 'daily');

    startTransition(async () => {
      await updateHabitAction(formData);
      setEditingHabit(null);
      router.refresh();
    });
  };

  const toggleHabitActive = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    startTransition(async () => {
      await toggleHabitActiveAction(habitId, !habit.isActive);
      router.refresh();
    });
  };

  const deleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
      return;
    }

    startTransition(async () => {
      await deleteHabitAction(habitId);
      setEditingHabit(null);
      router.refresh();
    });
  };

  const toggleHabit = async (habitId: string, dateString: string) => {
    startTransition(async () => {
      await toggleHabitAction(habitId, dateString, null);
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

  // Mobile gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
    setIsSwipeGesture(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(currentX - touchStart.x);
    const diffY = Math.abs(currentY - touchStart.y);

    // Mark as swipe gesture if significant movement
    if (diffX > 50 || diffY > 50) {
      setIsSwipeGesture(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const currentX = e.changedTouches[0].clientX;
    const currentY = e.changedTouches[0].clientY;
    const diffX = currentX - touchStart.x;
    const diffY = currentY - touchStart.y;

    // Swipe right to close sidebar or modals
    if (diffX > 100 && Math.abs(diffY) < 100) {
      if (selectedDay) {
        setSelectedDay(null);
      } else if (searchOpen) {
        setSearchOpen(false);
      } else if (fullEditorOpen) {
        closeFullEditor();
      }
    }

    // Swipe left to open search
    if (diffX < -100 && Math.abs(diffY) < 100 && !selectedDay && !searchOpen && !fullEditorOpen) {
      setSearchOpen(true);
    }

    // Swipe down to close full editor
    if (diffY > 100 && Math.abs(diffX) < 100 && fullEditorOpen) {
      closeFullEditor();
    }

    setTouchStart(null);
    setIsSwipeGesture(false);
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

  // Smart linking function - detect habit mentions in text
  const detectHabitMentions = (text: string) => {
    const mentions: { habitId: string; habitName: string; start: number; end: number }[] = [];
    
    habits.forEach(habit => {
      const habitName = habit.name.toLowerCase();
      const variations = [
        habitName,
        habitName.replace(/ing$/, ''), // "running" -> "run"
        habitName + 'ing', // "run" -> "running"
        habitName.replace(/e$/, 'ing'), // "exercise" -> "exercising"
      ];
      
      variations.forEach(variation => {
        const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          mentions.push({
            habitId: habit.id,
            habitName: habit.name,
            start: match.index,
            end: match.index + match[0].length
          });
        }
      });
    });
    
    // Sort by position and remove overlaps
    return mentions
      .sort((a, b) => a.start - b.start)
      .filter((mention, index, arr) => {
        if (index === 0) return true;
        const prev = arr[index - 1];
        return mention.start >= prev.end;
      });
  };

  // Function to render text with habit links
  const renderTextWithHabitLinks = (text: string, className: string = '') => {
    const mentions = detectHabitMentions(text);
    
    if (mentions.length === 0) {
      return <span className={className}>{text}</span>;
    }
    
    const elements = [];
    let lastIndex = 0;
    
    mentions.forEach((mention, index) => {
      // Add text before mention
      if (mention.start > lastIndex) {
        elements.push(
          <span key={`text-${index}`} className={className}>
            {text.slice(lastIndex, mention.start)}
          </span>
        );
      }
      
      // Add linked mention
      elements.push(
        <button
          key={`mention-${index}`}
          onClick={() => {
            const habit = habits.find(h => h.id === mention.habitId);
            if (habit) {
              // Show habit details or toggle it
              const today = new Date().toISOString().split('T')[0];
              toggleHabit(habit.id, today);
            }
          }}
          className={`${className} underline text-blue-600 hover:text-blue-800 font-medium cursor-pointer`}
          title={`Click to toggle ${mention.habitName}`}
        >
          {text.slice(mention.start, mention.end)}
        </button>
      );
      
      lastIndex = mention.end;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end" className={className}>
          {text.slice(lastIndex)}
        </span>
      );
    }
    
    return <span>{elements}</span>;
  };

  // Simple sentiment analysis
  const analyzeSentiment = (text: string): { score: number; label: string; color: string } => {
    const positiveWords = [
      'happy', 'good', 'great', 'amazing', 'wonderful', 'excellent', 'fantastic', 'awesome',
      'love', 'enjoy', 'excited', 'grateful', 'blessed', 'accomplished', 'successful',
      'proud', 'confident', 'energized', 'motivated', 'peaceful', 'calm', 'relaxed'
    ];
    
    const negativeWords = [
      'sad', 'bad', 'terrible', 'awful', 'horrible', 'hate', 'angry', 'frustrated',
      'tired', 'exhausted', 'stressed', 'overwhelmed', 'anxious', 'worried', 'depressed',
      'difficult', 'hard', 'struggle', 'pain', 'hurt', 'disappointed', 'failed'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    // Normalize score based on text length
    const normalizedScore = words.length > 0 ? score / words.length * 10 : 0;
    
    if (normalizedScore > 0.5) return { score: normalizedScore, label: 'Positive', color: 'green' };
    if (normalizedScore < -0.5) return { score: normalizedScore, label: 'Negative', color: 'red' };
    return { score: normalizedScore, label: 'Neutral', color: 'gray' };
  };

  // Generate insights
  const generateInsights = async () => {
    setLoadingInsights(true);
    try {
      // Fetch recent entries for analysis
      const response = await fetch('/api/entries?recent=true&limit=30');
      if (!response.ok) return;
      
      const data = await response.json();
      const entries = data.recent || [];
      
      if (entries.length === 0) {
        setInsights({ error: 'No entries found for analysis' });
        return;
      }
      
      // Analyze sentiment for each entry
      const entriesWithSentiment = entries.map((entry: JournalEntry) => ({
        ...entry,
        sentiment: analyzeSentiment(entry.content),
        habitMentions: detectHabitMentions(entry.content).length
      }));
      
      // Calculate correlations
      const habitCorrelations = habits.map(habit => {
        const entriesWithHabit = entriesWithSentiment.filter((entry: any) => 
          detectHabitMentions(entry.content).some(mention => mention.habitId === habit.id)
        );
        
        if (entriesWithHabit.length === 0) return null;
        
        const avgSentiment = entriesWithHabit.reduce((sum: number, entry: any) => 
          sum + entry.sentiment.score, 0) / entriesWithHabit.length;
          
        return {
          habitId: habit.id,
          habitName: habit.name,
          mentionCount: entriesWithHabit.length,
          avgSentiment,
          correlation: avgSentiment > 0 ? 'positive' : avgSentiment < 0 ? 'negative' : 'neutral'
        };
      }).filter(Boolean);
      
      // Overall statistics
      const overallSentiment = entriesWithSentiment.reduce((sum: number, entry: any) => 
        sum + entry.sentiment.score, 0) / entriesWithSentiment.length;
      
      const positiveEntries = entriesWithSentiment.filter((entry: any) => entry.sentiment.score > 0).length;
      const negativeEntries = entriesWithSentiment.filter((entry: any) => entry.sentiment.score < 0).length;
      
      // Generate suggestions based on patterns
      const suggestions = [];
      
      // Suggestion 1: Promote positive habits
      const bestHabit = habitCorrelations.find((h: any) => h.avgSentiment > 0.5);
      if (bestHabit) {
        suggestions.push({
          type: 'promote',
          icon: '🌟',
          title: `Focus more on ${bestHabit.habitName}`,
          description: `This habit consistently correlates with positive feelings. Consider increasing its frequency or exploring similar activities.`,
          color: 'green'
        });
      }

      // Suggestion 2: Address negative patterns
      const negativeHabit = habitCorrelations.find((h: any) => h.avgSentiment < -0.5);
      if (negativeHabit) {
        suggestions.push({
          type: 'address',
          icon: '🔄',
          title: `Reframe your approach to ${negativeHabit.habitName}`,
          description: `This habit appears in entries with negative sentiment. Consider adjusting your approach or exploring what makes it challenging.`,
          color: 'yellow'
        });
      }

      // Suggestion 3: Journal more on good days
      if (positiveEntries < negativeEntries * 2) {
        suggestions.push({
          type: 'journal',
          icon: '📝',
          title: 'Capture more positive moments',
          description: `You tend to journal more during difficult times. Try writing on good days too - it can help reinforce positive patterns.`,
          color: 'blue'
        });
      }

      // Suggestion 4: Habit tracking consistency
      const habitMentionRatio = entriesWithSentiment.filter((e: any) => e.habitMentions > 0).length / entries.length;
      if (habitMentionRatio < 0.3) {
        suggestions.push({
          type: 'track',
          icon: '🎯',
          title: 'Connect habits to your reflections',
          description: `Only ${Math.round(habitMentionRatio * 100)}% of entries mention habits. Reflecting on daily activities can reveal powerful patterns.`,
          color: 'purple'
        });
      }

      // Suggestion 5: Mood awareness
      if (Math.abs(overallSentiment) < 0.1) {
        suggestions.push({
          type: 'awareness',
          icon: '🧘',
          title: 'Explore emotional depth',
          description: `Your entries tend to be emotionally neutral. Consider exploring both highs and lows more deeply for richer self-understanding.`,
          color: 'indigo'
        });
      }

      setInsights({
        totalEntries: entries.length,
        overallSentiment,
        positiveEntries,
        negativeEntries,
        habitCorrelations: habitCorrelations.sort((a: any, b: any) => b.avgSentiment - a.avgSentiment),
        topPositiveHabits: habitCorrelations.filter((h: any) => h.avgSentiment > 0).slice(0, 3),
        suggestions: suggestions.slice(0, 3), // Limit to top 3 suggestions
        entriesWithSentiment: entriesWithSentiment.slice(0, 10)
      });
      
    } catch (error) {
      console.error('Error generating insights:', error);
      setInsights({ error: 'Failed to generate insights' });
    } finally {
      setLoadingInsights(false);
    }
  };

  const activeHabits = habits.filter((h: Habit) => h.isActive);
  const completionPercentage = getCompletionPercentage();

  return (
    <div 
      className="min-h-screen bg-gray-50"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
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
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Today</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(habitStats).reduce((max, stat) => Math.max(max, stat.bestStreak), 0)}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Best Streak</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{activeHabits.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Active</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.values(habitPermanence).filter((p: any) => p.permanenceStage === 'automatic').length}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Auto</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-red-500">
                  {Object.keys(habitRisks).filter(id => habitRisks[id].riskLevel === 'critical').length}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Risk</div>
              </div>
            </div>
          )}
        </div>

        {/* Main Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Today's Motivation */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xl">✨</span>
              <h2 className="text-lg font-semibold text-gray-900">Today's Motivation</h2>
            </div>
            <div className="space-y-4">
              {/* Progress celebration */}
              {completionPercentage > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🎯</span>
                    <h4 className="font-semibold text-gray-900">Daily Progress</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    You've completed <strong>{completionPercentage}%</strong> of your habits today!
                  </p>
                  {completionPercentage === 100 ? (
                    <p className="text-sm text-green-600 font-medium">🌟 Perfect day! You're building incredible momentum!</p>
                  ) : completionPercentage >= 70 ? (
                    <p className="text-sm text-blue-600 font-medium">💪 Great progress! You're so close to a perfect day!</p>
                  ) : completionPercentage >= 30 ? (
                    <p className="text-sm text-purple-600 font-medium">🚀 Good start! Every habit completed is a step forward!</p>
                  ) : (
                    <p className="text-sm text-orange-600 font-medium">🌅 New day, fresh opportunities! Your future self will thank you!</p>
                  )}
                </div>
              )}

              {/* Streak celebration */}
              {Object.values(habitStats).some(stat => stat.streak >= 3) && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🔥</span>
                    <h4 className="font-semibold text-gray-900">Streak Power</h4>
                  </div>
                  {(() => {
                    const maxStreak = Math.max(...Object.values(habitStats).map(stat => stat.streak));
                    const streakHabit = habits.find(h => habitStats[h.id]?.streak === maxStreak);
                    return (
                      <div>
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>{maxStreak}-day streak</strong> with <em>{streakHabit?.name}</em>!
                        </p>
                        <p className="text-sm text-orange-600 font-medium">
                          {maxStreak >= 21 ? "🏆 You're in the habit formation zone!" :
                           maxStreak >= 14 ? "⚡ Momentum building! You're creating lasting change!" :
                           maxStreak >= 7 ? "🌱 One week strong! The habit is taking root!" :
                           "🌟 Every day counts! You're building something amazing!"}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Journal encouragement */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📝</span>
                  <h4 className="font-semibold text-gray-900">Reflection Moment</h4>
                </div>
                {recentEntries.length > 0 ? (
                  <div>
                    <p className="text-sm text-gray-700 mb-2">
                      Your last entry was <strong>{(() => {
                        const lastEntry = recentEntries[0];
                        const entryDate = new Date(`${lastEntry.year}-${new Date(`1 ${lastEntry.month} 2000`).getMonth() + 1}-${lastEntry.day}`);
                        const daysDiff = Math.floor((new Date().getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
                        return daysDiff === 0 ? 'today' : daysDiff === 1 ? 'yesterday' : `${daysDiff} days ago`;
                      })()}</strong>
                    </p>
                    <p className="text-sm text-purple-600 font-medium">
                      💭 Your thoughts shape your reality. What will you capture today?
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-700 mb-2">Ready to start your journaling journey?</p>
                    <p className="text-sm text-purple-600 font-medium">
                      ✍️ Every great story starts with a single word. Write yours!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal Analytics */}
          {insights && !insights.error && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xl">📊</span>
                <h2 className="text-lg font-semibold text-gray-900">Personal Analytics</h2>
              </div>

              <div className="space-y-6">
                {/* Overall Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-green-600">{insights.positiveEntries}</div>
                    <div className="text-xs text-green-700">Positive</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-red-600">{insights.negativeEntries}</div>
                    <div className="text-xs text-red-700">Challenging</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-gray-600">
                      {insights.totalEntries - insights.positiveEntries - insights.negativeEntries}
                    </div>
                    <div className="text-xs text-gray-700">Neutral</div>
                  </div>
                </div>

                {/* Top Positive Habits */}
                {insights.topPositiveHabits && insights.topPositiveHabits.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      🌟 Mood Boosters
                    </h4>
                    <div className="space-y-2">
                      {insights.topPositiveHabits.slice(0, 2).map((habit: any, index: number) => (
                        <div key={habit.habitId} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">🎯</span>
                            <div>
                              <div className="font-medium text-green-900 text-sm">{habit.habitName}</div>
                              <div className="text-xs text-green-700">{habit.mentionCount} positive mentions</div>
                            </div>
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            +{habit.avgSentiment.toFixed(1)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Suggestions */}
                {insights.suggestions && insights.suggestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      💡 Quick Tip
                    </h4>
                    <div className={`p-3 rounded-lg border-l-4 ${
                      insights.suggestions[0].color === 'green' ? 'bg-green-50 border-green-400' :
                      insights.suggestions[0].color === 'yellow' ? 'bg-yellow-50 border-yellow-400' :
                      insights.suggestions[0].color === 'blue' ? 'bg-blue-50 border-blue-400' :
                      insights.suggestions[0].color === 'purple' ? 'bg-purple-50 border-purple-400' :
                      'bg-indigo-50 border-indigo-400'
                    }`}>
                      <div className="flex items-start gap-2">
                        <span className="text-sm">{insights.suggestions[0].icon}</span>
                        <div className="flex-1">
                          <h5 className={`font-medium text-sm ${
                            insights.suggestions[0].color === 'green' ? 'text-green-900' :
                            insights.suggestions[0].color === 'yellow' ? 'text-yellow-900' :
                            insights.suggestions[0].color === 'blue' ? 'text-blue-900' :
                            insights.suggestions[0].color === 'purple' ? 'text-purple-900' :
                            'text-indigo-900'
                          } mb-1`}>
                            {insights.suggestions[0].title}
                          </h5>
                          <p className={`text-xs ${
                            insights.suggestions[0].color === 'green' ? 'text-green-700' :
                            insights.suggestions[0].color === 'yellow' ? 'text-yellow-700' :
                            insights.suggestions[0].color === 'blue' ? 'text-blue-700' :
                            insights.suggestions[0].color === 'purple' ? 'text-purple-700' :
                            'text-indigo-700'
                          }`}>
                            {insights.suggestions[0].description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {loadingInsights && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-3 text-gray-500">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"></div>
                      Analyzing patterns...
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Habit Formation Cards */}
        {activeHabits.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <span className="text-2xl">🌱</span>
              Habit Formation Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeHabits.slice(0, 6).map((habit) => {
                const stats = habitStats[habit.id];
                const permanence = habitPermanence[habit.id];
                
                if (!stats || !permanence) return null;
                
                const formationDays = permanence.daysSinceStart || 0;
                const totalFormationDays = permanence.permanenceStage === 'initiation' ? 21 : 
                                         permanence.permanenceStage === 'development' ? 66 : 
                                         permanence.permanenceStage === 'stabilization' ? 154 : 365;
                const progressPercent = Math.min((formationDays / (permanence.permanenceStage === 'initiation' ? 21 : 
                                                 permanence.permanenceStage === 'development' ? 45 : 
                                                 permanence.permanenceStage === 'stabilization' ? 88 : 100)) * 100, 100);
                
                const automaticityPercent = Math.min(permanence.automaticityScore, 100);
                const strengthLabel = permanence.strengthLevel;
                
                return (
                  <div key={habit.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{habit.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                            {habit.category}
                          </span>
                          <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Active
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                          ✏️
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Formation Stage */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🌱</span>
                          <span className={`font-semibold ${
                            permanence.permanenceStage === 'initiation' ? 'text-red-600' :
                            permanence.permanenceStage === 'development' ? 'text-orange-600' :
                            permanence.permanenceStage === 'stabilization' ? 'text-blue-600' :
                            'text-green-600'
                          }`}>
                            {permanence.permanenceStage.charAt(0).toUpperCase() + permanence.permanenceStage.slice(1)} Phase
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {permanence.permanenceStage === 'initiation' ? 'Building initial momentum - requires high motivation' :
                           permanence.permanenceStage === 'development' ? 'Developing consistency - getting easier!' :
                           permanence.permanenceStage === 'stabilization' ? 'Stabilizing the habit - almost automatic!' :
                           'Habit is automatic - well done!'}
                        </p>
                        
                        <div className="mb-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Formation Progress</span>
                            <span className="text-gray-600">{Math.round(progressPercent)}% toward permanent</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                permanence.permanenceStage === 'initiation' ? 'bg-red-400' :
                                permanence.permanenceStage === 'development' ? 'bg-orange-400' :
                                permanence.permanenceStage === 'stabilization' ? 'bg-blue-400' :
                                'bg-green-400'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        <p className="text-sm text-gray-600">
                          Building foundation ({formationDays}/{permanence.permanenceStage === 'initiation' ? 21 : 
                                              permanence.permanenceStage === 'development' ? 66 : 
                                              permanence.permanenceStage === 'stabilization' ? 154 : 365} days). 
                          {permanence.permanenceStage === 'initiation' ? ' High effort required - this is normal!' :
                           permanence.permanenceStage === 'development' ? ' Getting easier each day!' :
                           permanence.permanenceStage === 'stabilization' ? ' Almost there - stay consistent!' :
                           ' Congratulations - habit formed!'}
                        </p>
                      </div>

                      {/* Next Milestone */}
                      {permanence.permanenceStage !== 'automatic' && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Next Milestone</div>
                          <div className="text-sm text-gray-600">
                            {permanence.permanenceStage === 'initiation' ? 'Development Phase' :
                             permanence.permanenceStage === 'development' ? 'Stabilization Phase' :
                             'Automatic Phase'}
                          </div>
                          <div className="text-xs text-gray-500">
                            ~{permanence.permanenceStage === 'initiation' ? (21 - formationDays) :
                               permanence.permanenceStage === 'development' ? (66 - formationDays) :
                               (154 - formationDays)} days: Almost through the hardest part! Keep going.
                          </div>
                        </div>
                      )}

                      {/* Bottom Stats */}
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{Math.round(automaticityPercent)}%</div>
                          <div className="text-xs text-gray-500">Automaticity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">Day {formationDays}</div>
                          <div className="text-xs text-gray-500">Formation</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${
                            strengthLabel === 'automatic' ? 'text-purple-600' :
                            strengthLabel === 'strong' ? 'text-green-600' :
                            strengthLabel === 'developing' ? 'text-orange-600' :
                            'text-red-600'
                          }`}>
                            {strengthLabel}
                          </div>
                          <div className="text-xs text-gray-500">Strength</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Main habit calendar area */}
          <div className="lg:col-span-3 order-2 lg:order-1">
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
                      visibleHabits={visibleHabits}
                      onDayClick={(date, dateString, dayHabits) => 
                        setSelectedDay({ date, dateString, dayHabits })
                      }
                    />
                    <HabitLegend
                      habits={habits}
                      visibleHabits={visibleHabits}
                      onToggleHabit={(habitId: string) => {
                        const today = new Date().toISOString().split('T')[0];
                        toggleHabit(habitId, today);
                      }}
                      onEditHabit={(habitId: string) => {
                        const habit = habits.find(h => h.id === habitId);
                        setEditingHabit(habit || null);
                      }}
                      onAddHabit={() => setShowCreateForm(true)}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar with journal quick entry and recent entries */}
          <div className="lg:col-span-1 order-1 lg:order-2">
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
                    {recentEntries.slice(0, 3).map((entry) => (
                      <Link
                        key={`${entry.year}-${entry.month}-${entry.day}`}
                        href={`/entry/${entry.year}/${entry.month}/${entry.day}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {entry.month} {entry.day}, {entry.year}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {renderTextWithHabitLinks(entry.content.substring(0, 100) + '...', 'text-xs text-gray-600')}
                        </div>
                      </Link>
                    ))}
                    {recentEntries.length > 3 && (
                      <Link
                        href="/year"
                        className="block text-center py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View all {recentEntries.length} entries →
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile gesture hints */}
              <div className="lg:hidden bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-blue-600">👆</span>
                  <h4 className="text-sm font-medium text-blue-900">Gesture Tips</h4>
                </div>
                <div className="space-y-1 text-xs text-blue-700">
                  <p>← Swipe left to search</p>
                  <p>→ Swipe right to close</p>
                  <p>↓ Swipe down to close editor</p>
                </div>
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
          isOpen={true}
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSave={async (habitId: string, updates: Partial<Habit>) => {
            const updatedHabit = { ...editingHabit, ...updates } as Habit;
            await updateHabit(updatedHabit);
          }}
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
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {renderTextWithHabitLinks(entry.content.substring(0, 150) + '...', 'text-sm text-gray-600')}
                      </div>
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