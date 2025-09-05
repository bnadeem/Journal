'use client';

import { useState, useEffect } from 'react';
import { Habit } from '@/types/journal';

interface HabitEditModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitId: string, updates: Partial<Habit>) => Promise<void>;
}

export default function HabitEditModal({ habit, isOpen, onClose, onSave }: HabitEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    color: '#3b82f6',
    targetFrequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    isActive: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (habit && isOpen) {
      setFormData({
        name: habit.name || '',
        description: habit.description || '',
        category: habit.category || '',
        color: habit.color || '#3b82f6',
        targetFrequency: habit.targetFrequency || 'daily',
        isActive: habit.isActive
      });
    }
  }, [habit, isOpen]);

  if (!isOpen || !habit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      await onSave(habit.id, formData);
      onClose();
    } catch (error) {
      console.error('Error saving habit:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Edit Habit</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Habit Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
                placeholder="e.g., Morning Exercise"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
                placeholder="e.g., Health, Learning"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
                placeholder="Optional description..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Blue', value: '#3b82f6' },
                  { name: 'Green', value: '#10b981' },
                  { name: 'Purple', value: '#8b5cf6' },
                  { name: 'Orange', value: '#f97316' },
                  { name: 'Pink', value: '#ec4899' },
                  { name: 'Indigo', value: '#6366f1' },
                  { name: 'Red', value: '#ef4444' },
                  { name: 'Yellow', value: '#eab308' },
                  { name: 'Emerald', value: '#059669' },
                  { name: 'Cyan', value: '#06b6d4' }
                ].map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color.value ? 'border-gray-800 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Frequency
              </label>
              <select
                value={formData.targetFrequency}
                onChange={(e) => setFormData({ ...formData, targetFrequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Active habit (tracked in calendar)
              </label>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.name.trim() || isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}