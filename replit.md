# MealPlanner Pro - Replit.md

## Overview

MealPlanner Pro is a full-stack meal planning application built with a modern TypeScript stack. The application helps users organize weekly meals, generate shopping lists automatically, and manage pantry inventory. It features a React frontend with shadcn/ui components, an Express.js backend, and uses Drizzle ORM with PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a monorepo structure with clear separation between client and server code:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js with TypeScript for RESTful API
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **UI Framework**: shadcn/ui components with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing

## Key Components

### Frontend Architecture
- **Component Structure**: Uses shadcn/ui component library for consistent UI elements
- **State Management**: TanStack Query handles API calls and caching
- **Styling**: Tailwind CSS with CSS variables for theming
- **Routing**: File-based routing with Wouter for navigation
- **Form Handling**: React Hook Form with Zod validation
- **Admin Interface**: Full CRUD interface for meal management with bulk import/export

### Backend Architecture
- **API Structure**: RESTful endpoints organized by resource (meals, meal-plans, pantry-items)
- **Data Layer**: Drizzle ORM with type-safe schema definitions
- **Storage**: PostgreSQL database with automatic seeding of initial meal and pantry data
- **Middleware**: Express middleware for JSON parsing, logging, and error handling
- **Bulk Operations**: Support for importing meals from JSON and CSV formats

### Database Schema
- **meals**: Stores meal information including ingredients, instructions, and metadata
- **meal_plans**: Weekly meal planning data with day-to-day meal assignments
- **pantry_items**: Inventory tracking with stock status management

### Meal Database Management
The application provides multiple ways to manage the 25+ recipe database:

1. **Admin Interface** (`/admin` page):
   - Add new meals with full ingredient lists and cooking instructions
   - Edit existing meals with user-friendly forms
   - Delete meals with confirmation
   - Visual meal gallery with photos and metadata

2. **Bulk Import/Export**:
   - Import meals from JSON format (see `example-import.json`)
   - Import meals from CSV format (see `example-import.csv`)
   - Export entire meal database to JSON
   - Automatic validation and error handling

3. **API Endpoints**:
   - `POST /api/meals` - Create new meal
   - `PUT /api/meals/:id` - Update existing meal
   - `DELETE /api/meals/:id` - Delete meal
   - `POST /api/meals/bulk-import` - Import multiple meals

4. **Data Format**:
   - Ingredients categorized as "fresh" (shopping required) or "pantry" (stock items)
   - Step-by-step cooking instructions
   - Difficulty levels, cook times, and serving sizes
   - High-quality food photography from Unsplash

## Data Flow

1. **User Interaction**: Users interact with React components in the client
2. **API Calls**: TanStack Query manages HTTP requests to Express endpoints
3. **Data Processing**: Express routes validate requests and interact with storage layer
4. **Database Operations**: Drizzle ORM handles type-safe database queries
5. **Response Handling**: Data flows back through the same chain with proper error handling

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI primitives for accessible components
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire stack
- **tsx**: TypeScript execution for Node.js development

## Deployment Strategy

The application is configured for deployment on Replit with the following approach:

1. **Development**: Uses Vite dev server with hot module replacement
2. **Build Process**: 
   - Frontend: Vite builds React app to `dist/public`
   - Backend: esbuild bundles server code to `dist/index.js`
3. **Production**: Serves static files and API from single Express server
4. **Database**: Configured to use PostgreSQL via DATABASE_URL environment variable
5. **Environment**: Uses NODE_ENV to switch between development and production modes

### Key Configuration Files
- **vite.config.ts**: Frontend build configuration with path aliases
- **drizzle.config.ts**: Database migration and schema configuration
- **tsconfig.json**: TypeScript configuration for monorepo structure
- **tailwind.config.ts**: Styling configuration with theme customization

The application supports both development and production environments with appropriate optimizations for each context.

## Recent Changes (July 25, 2025)

✓ Added comprehensive admin interface for meal database management
✓ Implemented full CRUD operations for meals (Create, Read, Update, Delete)
✓ Added bulk import functionality supporting JSON and CSV formats
✓ Created export functionality for backing up meal database
✓ Enhanced API with proper validation and error handling
✓ Added example import files (example-import.json, example-import.csv)
✓ Updated navigation to include Admin page with mobile-responsive menu
✓ Migrated from in-memory storage to PostgreSQL database
✓ Added automatic database seeding with 25+ meals and pantry items
✓ Fixed navigation accessibility with mobile hamburger menu
✓ Maintained backward compatibility with existing meal planning features
✓ Successfully migrated from Neon database to user's Supabase database
✓ Removed legacy in-memory storage layer and updated all API routes to use direct database queries
✓ Cleaned up unused storage.ts file and updated routes.ts to use Drizzle ORM directly
✓ Fixed Render deployment configuration and resolved build path issues
✓ Added comprehensive deployment documentation for Render platform
✓ Created render.yaml for one-click deployment and troubleshooting guides

The application is now fully operational with the user's Supabase database and ready for production deployment on Render. The meal database is fully persistent and editable through multiple interfaces, providing flexibility for both quick manual changes and bulk data operations. All data persists between application restarts and is stored in the user's own Supabase instance. The admin interface is accessible on both desktop and mobile devices through the responsive navigation system.