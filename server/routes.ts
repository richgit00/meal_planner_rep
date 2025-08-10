import type { Express } from "express";
import { randomUUID } from "crypto";

import { db } from "./db";
import { meals, mealPlans } from "@shared/schema";
import { insertMealPlanSchema, insertMealSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<void> {
  // Meals
  app.get("/api/meals", async (req, res) => {
    try {
      const mealsData = await db.select().from(meals);
      res.json(mealsData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  app.get("/api/meals/:id", async (req, res) => {
    try {
      const meal = await db.select().from(meals).where(eq(meals.id, req.params.id));
      if (meal.length === 0) {
        return res.status(404).json({ message: "Meal not found" });
      }
      res.json(meal[0]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meal" });
    }
  });

  app.post("/api/meals", async (req, res) => {
    try {
      const validated = insertMealSchema.parse(req.body);
      const mealWithId = { ...validated, id: randomUUID() };
      const [meal] = await db.insert(meals).values(mealWithId).returning();
      res.status(201).json(meal);
    } catch (error) {
      res.status(400).json({ message: "Invalid meal data" });
    }
  });

  app.put("/api/meals/:id", async (req, res) => {
    try {
      console.log(`🔄 PUT /api/meals/${req.params.id} called`);
      console.log(`📤 Request body:`, req.body);

      // Validate the incoming data
      const validated = insertMealSchema.partial().parse(req.body);
      console.log(`✅ Validated data:`, validated);

      // First check if meal exists
      const existingMeal = await db.select().from(meals).where(eq(meals.id, req.params.id));
      if (existingMeal.length === 0) {
        console.log(`❌ Meal not found with ID: ${req.params.id}`);
        return res.status(404).json({ message: "Meal not found" });
      }

      // Update the meal
      const [updatedMeal] = await db.update(meals)
        .set(validated)
        .where(eq(meals.id, req.params.id))
        .returning();

      console.log(`📊 Database update result:`, updatedMeal);
      console.log(`✅ Successfully updated meal:`, updatedMeal);
      res.json(updatedMeal);
    } catch (error) {
      console.error(`❌ Error updating meal:`, error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid meal data format", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update meal", error: error.message });
      }
    }
  });

  app.delete("/api/meals/:id", async (req, res) => {
    try {
      console.log(`🗑️ DELETE /api/meals/${req.params.id} called`);

      // First check if meal exists
      const existingMeal = await db.select().from(meals).where(eq(meals.id, req.params.id));
      if (existingMeal.length === 0) {
        console.log(`❌ Meal not found with ID: ${req.params.id}`);
        return res.status(404).json({ message: "Meal not found" });
      }

      // Delete the meal
      const [deleted] = await db.delete(meals)
        .where(eq(meals.id, req.params.id))
        .returning();

      console.log(`✅ Successfully deleted meal:`, deleted);
      res.status(204).send();
    } catch (error) {
      console.error(`❌ Error deleting meal:`, error);
      res.status(500).json({ message: "Failed to delete meal", error: error.message });
    }
  });

  // Bulk import meals
  app.post("/api/meals/bulk-import", async (req, res) => {
    try {
      let mealsToImport;

      // Handle both direct array and wrapped object formats
      if (Array.isArray(req.body)) {
        mealsToImport = req.body;
      } else if (req.body.meals && Array.isArray(req.body.meals)) {
        mealsToImport = req.body.meals;
      } else {
        return res.status(400).json({ message: "Expected array of meals or object with meals property" });
      }

      const createdMeals = [];
      const errors = [];

      for (let i = 0; i < mealsToImport.length; i++) {
        const mealData = mealsToImport[i];
        try {
          console.log(`Processing meal ${i + 1}:`, mealData);
          const validated = insertMealSchema.parse(mealData);
          const mealWithId = { ...validated, id: randomUUID() };
          const [meal] = await db.insert(meals).values(mealWithId).returning();
          createdMeals.push(meal);
          console.log(`✅ Successfully imported meal: ${meal.name}`);
        } catch (error) {
          console.error(`❌ Failed to import meal ${i + 1}:`, mealData, error);
          errors.push({
            index: i + 1,
            meal: mealData.name || `Row ${i + 1}`,
            error: error.message
          });
        }
      }

      res.json({ 
        message: `Successfully imported ${createdMeals.length} out of ${mealsToImport.length} meals`,
        imported: createdMeals.length,
        total: mealsToImport.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Bulk import error:", error);
      res.status(500).json({ message: "Failed to import meals", error: error.message });
    }
  });

  // Meal Plans
  app.get("/api/meal-plans", async (req, res) => {
    try {
      const mealPlansData = await db.select().from(mealPlans);
      res.json(mealPlansData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meal plans" });
    }
  });

  app.get("/api/meal-plans/:weekStartDate", async (req, res) => {
    try {
      const mealPlan = await db.select().from(mealPlans).where(eq(mealPlans.weekStartDate, req.params.weekStartDate));
      if (mealPlan.length === 0) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      res.json(mealPlan[0]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meal plan" });
    }
  });

  app.post("/api/meal-plans", async (req, res) => {
    try {
      console.log("Creating meal plan with data:", req.body);
      const validated = insertMealPlanSchema.parse(req.body);
      const mealPlanWithId = { ...validated, id: randomUUID() };
      const [mealPlan] = await db.insert(mealPlans).values(mealPlanWithId).returning();
      res.status(201).json(mealPlan);
    } catch (error) {
      console.error("Meal plan creation error:", error);
      res.status(400).json({ message: "Invalid meal plan data", error: error.message });
    }
  });

  app.put("/api/meal-plans/:id", async (req, res) => {
    try {
      console.log("Updating meal plan with data:", req.body);
      const validated = insertMealPlanSchema.partial().parse(req.body);
      const [mealPlan] = await db.update(mealPlans)
        .set(validated)
        .where(eq(mealPlans.id, req.params.id))
        .returning();
      if (!mealPlan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      res.json(mealPlan);
    } catch (error) {
      console.error("Meal plan update error:", error);
      res.status(400).json({ message: "Invalid meal plan data", error: error.message });
    }
  });



  // Shopping List Generation
  app.get("/api/shopping-list/:weekStartDate", async (req, res) => {
    try {
      const mealPlanResult = await db.select().from(mealPlans).where(eq(mealPlans.weekStartDate, req.params.weekStartDate));
      if (mealPlanResult.length === 0) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      const mealPlan = mealPlanResult[0];

      const mealsData = await db.select().from(meals);

      const selectedMeals = mealPlan.meals
        .filter(day => day.mealId)
        .map(day => mealsData.find(meal => meal.id === day.mealId))
        .filter(meal => meal && meal.ingredients);

      // Aggregate ingredients by name and category
      const ingredientMap = new Map<string, { quantity: string; category: string }>();

      selectedMeals.forEach(meal => {
        if (meal && meal.ingredients && Array.isArray(meal.ingredients)) {
          meal.ingredients.forEach(ingredient => {
            if (ingredient && ingredient.name && ingredient.amount) {
              const ingredientName = ingredient.name.trim();
              const category = ingredient.category || 'other';

              if (ingredientMap.has(ingredientName)) {
                const existing = ingredientMap.get(ingredientName)!;
                ingredientMap.set(ingredientName, {
                  quantity: existing.quantity + " + " + ingredient.amount,
                  category: existing.category
                });
              } else {
                ingredientMap.set(ingredientName, {
                  quantity: ingredient.amount,
                  category: category
                });
              }
            }
          });
        }
      });

      // Create dynamic shopping list based on actual categories from ingredients
      const categoryMap = new Map<string, Array<{ name: string; quantity: string; checked: boolean }>>();

      // Process each ingredient and group by actual category
      Array.from(ingredientMap.entries()).forEach(([name, data]) => {
        const item = { name, quantity: data.quantity, checked: false };
        const category = data.category;

        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(item);
      });

      // Define the preferred order: fresh first, then vegetables, finishing with pantry/seasonings
      const categoryOrder = [
        'fresh', 'vegetables', 'fruit', 'dairy', 'meat', 'grains', 
        'pantry', 'seasonings', 'spices', 'condiments', 'other'
      ];

      // Build the shopping list in the preferred order
      const shoppingList: any = {};
      let totalItems = 0;

      // First, add categories in the preferred order if they exist
      categoryOrder.forEach(preferredCategory => {
        for (const [actualCategory, items] of categoryMap.entries()) {
          if (actualCategory.toLowerCase() === preferredCategory) {
            shoppingList[actualCategory] = items;
            totalItems += items.length;
            categoryMap.delete(actualCategory);
          }
        }
      });

      // Then add any remaining categories not in the preferred order
      for (const [category, items] of categoryMap.entries()) {
        shoppingList[category] = items;
        totalItems += items.length;
      }

      res.json({
        ...shoppingList,
        summary: {
          totalItems
        }
      });
    } catch (error) {
      console.error("Error generating shopping list:", error);
      res.status(500).json({ message: "Failed to generate shopping list", error: error.message });
    }
  });
}