# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a personal journal repository with both markdown entries and a Next.js web application. It contains:

1. **Daily markdown entries** organized by year and month in the format `YYYY/MMM/DD.md` (e.g., `2025/Sep/4.md`)
2. **A Next.js journal application** (in root directory) that provides a web interface for managing and viewing entries
3. **Habit tracking system** with JSON-based data storage
4. **Templates and utilities** for consistent journal formatting

```
├── 2025/                    # Journal entries by year
│   ├── Jul/
│   ├── Aug/
│   └── Sep/
├── src/                     # Next.js web application source
│   ├── app/                # App Router pages and API routes
│   ├── components/         # Reusable UI components
│   ├── lib/               # Utility functions and operations
│   └── types/             # TypeScript type definitions
├── habits.json             # Habit tracking data
├── daily-template.md       # Template for new journal entries
└── package.json            # Root package configuration
```

## File Structure and Naming Convention

### Journal Entries
- **Entry Files**: Daily journal entries are stored as `{day}.md` files within month directories
- **Directory Structure**: `{YEAR}/{Month}/` where months are abbreviated (Jul, Aug, Sep, etc.)
- **Content Format**: Markdown files with optional frontmatter, personal reflections and structured daily thoughts
- **Monthly Summaries**: `summary.md` files within each month directory for periodic reflection

### Web Application
- **Framework**: Next.js 14+ with App Router and TypeScript
- **Styling**: TailwindCSS with custom notebook-inspired theming
- **State Management**: Zustand for client-side state
- **UI Components**: Custom components with Heroicons
- **Markdown Processing**: gray-matter for frontmatter, react-markdown for rendering

## Core Features

### Journal Management
- **Web Interface**: Full-featured Next.js app for creating, editing, and viewing entries
- **Calendar Views**: Monthly and yearly calendar navigation with entry indicators  
- **Rich Editor**: Markdown editor with live preview and notebook-style aesthetics
- **Auto-save**: Automatic saving with debounced writes to prevent data loss
- **Search & Navigation**: Browse entries by date, view monthly summaries
- **Template Integration**: Daily template system for consistent entry structure

### Habit Tracking
- **Habit Management**: Create, edit, and deactivate habits with categories and colors
- **Collapsible Calendar**: Visual calendar with expand/collapse functionality for better UX
- **Day Labels**: Calendar displays proper day headers (S, M, T, W, T, F, S) for easy navigation
- **Progress Tracking**: Color-coded completion status with hover tooltips and today highlighting
- **Statistics**: Real-time completion rates, streak tracking, and performance metrics
- **Flexible Frequency**: Support for daily, weekly, and monthly habit targets
- **Performance Optimized**: Efficient API calls that only load data when calendar is expanded

### API Routes
- `GET/POST/PUT /api/entries/[...slug]`: CRUD operations for journal entries
- `GET/POST /api/summaries/[year]/[month]`: Monthly summary management
- `GET/POST/PUT/DELETE /api/habits`: Habit management operations
- `GET/POST /api/habits/[habitId]/logs`: Habit completion logging

## Development Commands

### Journal App
- **Development**: `npm run dev` (uses Turbopack)
- **Build**: `npm run build`  
- **Lint**: `npm run lint`
- **Start**: `npm run start`

### Dependencies
The web application uses modern React/Next.js stack:
- React 19, Next.js 15.5+, TypeScript 5
- TailwindCSS 4, Heroicons, clsx, tailwind-merge
- date-fns, gray-matter, react-markdown, rehype-highlight
- zustand for state management

## Working with the Repository

### Journal Entries
- Maintain the established `YYYY/MMM/DD.md` directory structure
- Use the provided daily template for new entries when appropriate
- Entries support markdown with optional YAML frontmatter
- Monthly summary files can be created to synthesize themes and reflections

### Web Application Development  
- Follow existing component patterns and TypeScript interfaces
- Use the established file operation utilities in `lib/file-operations.ts`
- Maintain the notebook aesthetic with warm color palette and subtle animations
- Test both file system operations and API routes when making changes

### Habit System
- Habits are stored in `habits.json` with logs tracked separately  
- Habit completion data stored in `YYYY/MMM/DD-habits.json` files per day
- Calendar component (`HabitCalendar.tsx`) uses collapsible design pattern
- API route `/api/habits/[habitId]/logs` optimized for date range queries
- Form inputs have proper text styling (`text-gray-900`, `placeholder-gray-500`)
- Use the established API patterns for creating new habit-related features
- Maintain data consistency between the JSON storage and UI state

### Recent Improvements (September 2025)
- **Enhanced Calendar UX**: Added collapsible habit calendars with day headers
- **Performance Optimization**: API calls only execute when calendar is expanded
- **Better Form Styling**: Fixed text color issues in habit creation forms
- **Error Handling**: Improved loading states and error messages
- **Visual Design**: Added proper day labels and today highlighting

### Major Design System Update (September 2025)
- **Unified Modern Design**: Updated entire application to match habits page aesthetic
  - Changed from gradient backgrounds to clean `bg-gray-50`
  - Adopted modern card design with `rounded-xl`, `border border-gray-200`, `shadow-sm`
  - Consistent header pattern with icon + title + description
  - Modern button styling with proper hover states
- **Updated Pages**: Main journal, year view, month view, new entry, edit entry, individual entry
- **Side-by-Side Layout**: Journal entries now display alongside habit tracking for integrated experience
- **Enhanced Components**: JournalEditor, NewEntryButton, and navigation components updated
- **Responsive Design**: Maintained mobile-first approach with improved desktop layouts

### Habit Formation Science Integration
- **Research-Based Tracking**: Implemented Dr. Phillippa Lally's habit formation research
- **Four-Stage Model**: Initiation (1-21 days) → Development (22-66 days) → Stabilization (67-154 days) → Automatic (155+ days)
- **Habit Permanence Metrics**: Automaticity score, consistency tracking, formation progress
- **Dynamic Start Date**: Uses earliest completed log rather than creation date for accurate tracking
- **Extended Data Range**: Fetches 2+ months of historical data to capture pre-system habits
- **Milestone Tracking**: Progress indicators and next milestone encouragement
- **Edit Functionality**: Full habit CRUD operations with modern modal interface

### Architectural Patterns
- **Consistent Layout Structure**: All pages follow modern header + content card pattern
- **Integrated Habit Tracking**: Habits displayed alongside journal content where relevant
- **Sticky Sidebars**: Habit trackers remain visible during scrolling for better UX
- **Error State Management**: Consistent error handling and loading states across all pages
- **Navigation Consistency**: Breadcrumb-style navigation in headers with proper button styling