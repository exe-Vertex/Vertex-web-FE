# Vertex

A student-focused AI project planning web app designed for design students and creative teams.

## Tech Stack
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React

## Design System

### Colors
- **Primary**: `#22C55E` (Green 500)
- **Primary Gradient**: `linear-gradient(90deg, #22C55E 0%, #EAB308 100%)`
- **Accent**: `#06B6D4` (Cyan 500)
- **Dark Background**: `#0A0F1A`
- **Card Background**: `#0F1A2A`
- **Surface**: `#162032`
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `#94A3B8` (Slate 400)

### Typography
- **Headings**: Poppins / Inter (Display)
- **Body**: Inter (Sans)

### Spacing & Radius
- **Radius**: 
  - Buttons/Inputs: `rounded-xl` (12px)
  - Cards: `rounded-2xl` (16px)
- **Spacing**: Standard Tailwind spacing scale (4px base)

### Shadows
- **Card**: `shadow-sm` (subtle) -> `shadow-lg` (hover)
- **Primary Button**: `shadow-lg shadow-indigo-500/30`

## Project Structure
- `/src/components`: Reusable UI and feature components
  - `/ui`: Basic atoms (Button, Card, Badge, Avatar)
  - `/layout`: Header, Footer
  - `/landing`: Landing page sections
  - `/dashboard`: Dashboard specific widgets
  - `/modals`: Dialogs
- `/src/pages`: Page composition
- `/src/data`: Mock data
- `/src/types.ts`: TypeScript definitions

## Features
- **Landing Page**: Responsive, with hero, features, pricing, and interactive modal.
- **Dashboard**: Kanban and Timeline views, task management.
- **AI Assistant**: Floating widget for quick actions.
- **Responsive**: Mobile-first design.

## Development
1. Install dependencies: `npm install`
2. Run dev server: `npm run dev`
