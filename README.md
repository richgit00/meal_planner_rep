# MealPlanner Pro

A comprehensive weekly meal planning application built with React, Express.js, and PostgreSQL. Plan your meals, generate shopping lists automatically, and manage your pantry inventory with ease.

## Features

- 📅 **Weekly Meal Planning**: Plan meals for each day of the week
- 🛒 **Smart Shopping Lists**: Automatically generate categorized shopping lists
- 🥘 **Recipe Management**: Full admin interface for managing 25+ recipes
- 📱 **Mobile Responsive**: Works perfectly on desktop and mobile devices
- 📊 **Bulk Operations**: Import/export meals via JSON and CSV
- 🎨 **Modern UI**: Beautiful interface built with shadcn/ui components

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: TanStack Query
- **Routing**: Wouter

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account and project

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mealplanner-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your database**
   - Create a new project in [Supabase](https://supabase.com)
   - Go to Settings → Database and copy your connection string
   - Replace `[YOUR-PASSWORD]` with your actual database password

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```
   
   Edit both `.env` files and add your Supabase database URL:
   ```
   DATABASE_URL=postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres
   ```

5. **Push database schema**
   ```bash
   npm run db:push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5000`

## Usage

### Meal Planning
1. Visit the **Meal Plan** page
2. Click on any day to select a meal
3. Choose from the available recipes or leave blank
4. Your meal plan is automatically saved

### Shopping Lists
1. Go to **Shopping List** page
2. Select a week to generate a shopping list
3. Items are automatically categorized (meat, vegetables, etc.)
4. Check off items as you shop

### Pantry Management
1. Visit the **Pantry** page
2. Update stock status for pantry items
3. Items marked as "out of stock" will appear on shopping lists

### Admin Interface
1. Access the **Admin** page for meal management
2. Add new recipes with ingredients and instructions
3. Edit or delete existing meals
4. Bulk import meals from JSON or CSV files
5. Export your entire meal database

## API Endpoints

### Meals
- `GET /api/meals` - Get all meals
- `POST /api/meals` - Create a new meal
- `PUT /api/meals/:id` - Update a meal
- `DELETE /api/meals/:id` - Delete a meal
- `POST /api/meals/bulk-import` - Import multiple meals

### Meal Plans
- `GET /api/meal-plans` - Get all meal plans
- `POST /api/meal-plans` - Create a meal plan
- `PUT /api/meal-plans/:id` - Update a meal plan

### Other
- `GET /api/pantry-items` - Get pantry items
- `PUT /api/pantry-items/:id` - Update pantry item
- `GET /api/shopping-list/:weekStartDate` - Generate shopping list

## Deployment

### Deploy to Render (Recommended)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

**Quick Start:**
1. Fork this repository
2. Connect to Render and create a new Web Service
3. Add PostgreSQL database
4. Deploy automatically!

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

MIT License - see LICENSE file for details