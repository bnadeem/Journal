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
    <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{wordCount} words</span>
              <span>•</span>
              {isSaving ? (
                <span className="text-blue-600">Saving...</span>
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
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isPreviewMode ? 'Edit' : 'Preview'}
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save'}
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
      <div className="bg-gray-50/80 px-6 py-3 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Press Ctrl+S (⌘+S) to save</span>
          <div className="flex items-center space-x-4">
            <span>{content.length} characters</span>
            <span>•</span>
            {enableAutoSave ? (
              <span>Auto-save enabled ({autoSaveDelay / 1000}s delay)</span>
            ) : (
              <span>Manual save mode</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}