import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const meals = pgTable("meals", {
  id: varchar("id").primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  cookTime: text("cook_time").notNull(),
  difficulty: text("difficulty").notNull(),
  servings: integer("servings").notNull(),
  image: text("image").notNull(),
  ingredients: json("ingredients").$type<Array<{ name: string; amount: string; category: 'fresh' | 'pantry' }>>().notNull(),
  utensils: json("utensils").$type<Array<string>>().notNull(),
  instructions: json("instructions").$type<Array<string>>().notNull(),
});

export const mealPlans = pgTable("meal_plans", {
  id: varchar("id").primaryKey().notNull(),
  weekStartDate: text("week_start_date").notNull(),
  meals: json("meals").$type<Array<{ day: string; mealId: string | null }>>().notNull(),
});

export const pantryItems = pgTable("pantry_items", {
  id: varchar("id").primaryKey().notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
});

export const favourites = pgTable("favourites", {
  id: varchar("id").primaryKey().notNull(),
  mealId: varchar("meal_id").notNull().references(() => meals.id),
  userId: varchar("user_id").notNull(), // For future user system
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
});

export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({
  id: true,
});

export const insertPantryItemSchema = createInsertSchema(pantryItems).omit({
  id: true,
});

export const insertFavouriteSchema = createInsertSchema(favourites).omit({
  id: true,
  createdAt: true,
});

export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Meal = typeof meals.$inferSelect;

export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;

export type InsertPantryItem = z.infer<typeof insertPantryItemSchema>;
export type PantryItem = typeof pantryItems.$inferSelect;

export type InsertFavourite = z.infer<typeof insertFavouriteSchema>;
export type Favourite = typeof favourites.$inferSelect;