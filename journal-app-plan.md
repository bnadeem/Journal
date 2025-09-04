# Personal Journal NextJS App - Development Plan

## Project Overview
A beautiful, intuitive NextJS web application that recreates the experience of writing in a physical journal. The app will maintain the existing file structure (`YYYY/MMM/DD.md`) while providing a seamless digital writing experience with notebook-like aesthetics and smooth animations.

## Core Features

### 1. Journal Entry Management
- **Create New Entry**: Click-to-create new daily entries following the `YYYY/MMM/DD.md` pattern
- **Edit Existing Entry**: Click any entry to edit with live preview
- **Auto-save**: Automatic saving as user types (debounced)
- **Daily Template Integration**: Option to start with the daily template structure
- **Rich Text Support**: Markdown rendering with live preview

### 2. Monthly Summary System
- **Auto-generated Summary Pages**: `summary.md` files for each month
- **Summary Templates**: Structured format for monthly reflections
- **Theme Analysis**: Automatic highlighting of recurring themes from daily entries
- **Monthly Overview**: Visual timeline of entries within each month

### 3. Navigation & Organization
- **Calendar View**: Visual calendar showing entries by date
- **Monthly Navigation**: Easy switching between months/years
- **Search Functionality**: Full-text search across all entries
- **Quick Jump**: Recent entries, bookmarks, or specific date navigation

## UI/UX Design Philosophy

### Notebook Aesthetics
- **Lined Paper Background**: Subtle horizontal lines mimicking notebook paper
- **Margin Lines**: Left margin line for authentic notebook feel
- **Paper Texture**: Subtle paper texture overlay
- **Handwriting Font**: Option for handwriting-style fonts (Kalam, Caveat)
- **Spiral Binding**: Visual spiral binding on the left side

### Animations & Interactions
- **Page Turning Animation**: Smooth page flip when switching between entries
- **Writing Effects**: Typewriter effect for new text (optional)
- **Fade Transitions**: Smooth transitions between months/entries
- **Hover Effects**: Subtle lift/shadow effects on interactive elements
- **Loading States**: Paper-themed loading animations

### Color Scheme
- **Primary**: Warm paper tones (#F7F5F3, #FEFDFB)
- **Secondary**: Soft blue ink (#2563EB, #1E40AF)
- **Accents**: Gentle earth tones (#92400E, #713F12)
- **Text**: Dark charcoal (#1F2937) for readability
- **Lines**: Subtle gray (#E5E7EB) for notebook lines

## Technical Architecture

### Frontend Stack
- **Framework**: NextJS 14 (App Router)
- **Styling**: TailwindCSS + Custom CSS for animations
- **UI Components**: Headless UI or Radix UI primitives
- **Animations**: Framer Motion for complex animations
- **Icons**: Heroicons or Lucide React
- **Typography**: Inter + Google Fonts (Kalam for handwriting feel)

### Data Management
- **File System**: Maintain existing markdown file structure
- **State Management**: Zustand for client-side state
- **Caching**: SWR or TanStack Query for data fetching
- **Auto-save**: Debounced saves to prevent data loss

### API Routes
- **GET /api/entries/[...slug]**: Fetch specific entry or list entries
- **POST /api/entries**: Create new entry
- **PUT /api/entries/[...slug]**: Update existing entry
- **GET /api/summaries/[year]/[month]**: Get monthly summary
- **POST /api/summaries/[year]/[month]**: Create/update monthly summary

### File Structure
```
journal-app/
├── src/
│   ├── app/
│   │   ├── page.tsx (Landing/Calendar view)
│   │   ├── entry/
│   │   │   └── [...slug]/page.tsx (Dynamic entry page)
│   │   ├── month/
│   │   │   └── [year]/[month]/page.tsx (Monthly view)
│   │   └── api/
│   │       ├── entries/
│   │       └── summaries/
│   ├── components/
│   │   ├── ui/ (Reusable UI components)
│   │   ├── journal/ (Journal-specific components)
│   │   ├── animations/ (Animation components)
│   │   └── layout/ (Layout components)
│   ├── lib/
│   │   ├── file-operations.ts (File system operations)
│   │   ├── markdown.ts (Markdown parsing/rendering)
│   │   └── utils.ts (Utility functions)
│   └── types/
│       └── journal.ts (TypeScript interfaces)
```

## Key Components

### 1. JournalEditor
- **Rich markdown editor** with live preview
- **Notebook styling** with lines and margins
- **Auto-save functionality**
- **Template insertion**
- **Word count and date display**

### 2. CalendarView
- **Monthly calendar grid**
- **Entry indicators** (dots or highlights on dates with entries)
- **Quick entry creation**
- **Month/year navigation**

### 3. EntryCard
- **Preview of entry content**
- **Date and metadata**
- **Edit/delete actions**
- **Smooth hover animations**

### 4. MonthlyView
- **List of all entries in month**
- **Monthly summary section**
- **Navigation between entries**
- **Theme analysis visualization**

### 5. PageTransition
- **Smooth page flip animation**
- **Loading states**
- **Direction-aware transitions**

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Set up NextJS project with TailwindCSS
- Create basic file system operations
- Build core routing structure
- Implement basic markdown rendering

### Phase 2: Core Features (Week 2)
- Journal editor with notebook styling
- Entry CRUD operations
- Calendar navigation
- Monthly summary system

### Phase 3: Polish & Animations (Week 3)
- Page flip animations
- Notebook aesthetic refinements
- Auto-save implementation
- Search functionality

### Phase 4: Enhanced Features (Week 4)
- Theme analysis for summaries
- Advanced animations
- Mobile responsiveness
- Performance optimization

## Responsive Design
- **Desktop**: Full notebook experience with sidebar navigation
- **Tablet**: Adapted layout maintaining notebook feel
- **Mobile**: Streamlined interface with swipe gestures for navigation

## Performance Considerations
- **Static Generation**: Pre-generate entry pages where possible
- **Lazy Loading**: Load entries on demand
- **Image Optimization**: Optimize any decorative elements
- **Code Splitting**: Split by routes and features

## Accessibility
- **Keyboard Navigation**: Full keyboard support for all features
- **Screen Reader**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Ensure sufficient contrast ratios
- **Focus Management**: Clear focus indicators

## Future Enhancements
- **Export Options**: PDF export with notebook styling
- **Backup/Sync**: Cloud backup integration
- **Mobile App**: React Native version
- **Collaboration**: Shared journals or comments
- **AI Integration**: Writing prompts or theme analysis

## Success Metrics
- **User Experience**: Smooth, delightful writing experience
- **Performance**: Fast load times (<2s initial load)
- **Data Integrity**: No data loss, reliable auto-save
- **Aesthetic**: Beautiful, authentic notebook feel
- **Functionality**: All CRUD operations working seamlessly