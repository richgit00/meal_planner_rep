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
  instructions: json("instructions").$type<Array<string>>().notNull(),
  utensils: json("utensils").$type<Array<string>>().notNull(),
});

export const mealPlans = pgTable("meal_plans", {
  id: varchar("id").primaryKey().notNull(),
  weekStartDate: text("week_start_date").notNull(),
  meals: json("meals").$type<Array<{ day: string; mealId: string | null }>>().notNull(),
});

export const insertMealSchema = createInsertSchema(meals, {
  utensils: z.array(z.string()).optional().default([]),
}).omit({
  id: true,
});

export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({
  id: true,
});

export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Meal = typeof meals.$inferSelect;

export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;