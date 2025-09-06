'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ReactMarkdown } from '@/lib/markdown';
import { markdownOptions } from '@/lib/markdown';

interface JournalEditorProps {
  initialContent?: string;
  title?: string;
  onSave?: (content: string) => void;
  onManualSave?: (content: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  showPreview?: boolean;
  enableAutoSave?: boolean;
  autoSaveDelay?: number;
}

export default function JournalEditor({ 
  initialContent = '', 
  title,
  onSave, 
  onManualSave,
  onCancel, 
  isLoading = false,
  showPreview = false,
  enableAutoSave = false,
  autoSaveDelay = 3000
}: JournalEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isPreviewMode, setIsPreviewMode] = useState(showPreview);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContent = useRef(initialContent);

  // Calculate word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(content !== lastSavedContent.current);
  }, [content]);

  // Auto-save functionality
  useEffect(() => {
    if (!enableAutoSave || !onSave || content === lastSavedContent.current) {
      return;
    }

    // Clear existing timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    // Set new timer
    autoSaveTimer.current = setTimeout(() => {
      handleAutoSave();
    }, autoSaveDelay);

    // Cleanup
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [content, enableAutoSave, autoSaveDelay, onSave]);

  const handleAutoSave = useCallback(async () => {
    if (!onSave || content === lastSavedContent.current || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(content);
      lastSavedContent.current = content;
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [content, onSave, isSaving]);

  const handleSave = useCallback(() => {
    if (onManualSave) {
      onManualSave(content);
    }
  }, [content, onManualSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              {title && (
                <h1 className="text-lg font-semibold text-gray-900 mb-1">{title}</h1>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{wordCount} words</span>
                <span>•</span>
                {isSaving ? (
                  <span className="text-blue-600 flex items-center space-x-1">
                    <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Saving...</span>
                  </span>
                ) : hasUnsavedChanges ? (
                  <span className="text-orange-600">Unsaved changes</span>
                ) : lastSaved ? (
                  <span className="text-green-600">
                    Saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  <span>Ready</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors border ${
                isPreviewMode 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {isPreviewMode ? '✏️ Edit' : '👁️ Preview'}
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isLoading ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative min-h-[600px]">
        {/* Notebook Lines Background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left margin line */}
          <div className="absolute left-16 top-0 bottom-0 w-px bg-red-200/60"></div>
          
          {/* Horizontal lines */}
          <div className="absolute inset-0 pt-6">
            {Array.from({ length: 40 }, (_, i) => (
              <div 
                key={i} 
                className="h-6 border-b border-blue-100/40"
                style={{ lineHeight: '24px' }}
              />
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="relative">
          {isPreviewMode ? (
            // Preview Mode
            <div className="pl-20 pr-8 py-6">
              <div className="prose prose-lg max-w-none text-gray-800">
                <ReactMarkdown {...markdownOptions}>
                  {content || '*Start writing your thoughts...*'}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            // Edit Mode
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-full min-h-[600px] pl-20 pr-8 py-6 bg-transparent border-none outline-none resize-none text-gray-800 text-lg leading-6 font-kalam"
              style={{ 
                lineHeight: '24px',
                fontFamily: 'var(--font-kalam), cursive'
              }}
              placeholder="Start writing your thoughts..."
              spellCheck="true"
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <kbd className="px-2 py-1 text-xs bg-white border border-gray-300 rounded-md">
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+S
            </kbd>
            <span>to save</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="bg-white px-2 py-1 rounded-full text-xs border border-gray-200">
              {content.length} characters
            </span>
            <span>•</span>
            {enableAutoSave ? (
              <span className="text-green-600">Auto-save ({autoSaveDelay / 1000}s)</span>
            ) : (
              <span>Manual save</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}