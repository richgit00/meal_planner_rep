import type { Express } from "express";

import { db } from "./db";
import { meals, mealPlans, pantryItems } from "@shared/schema";
import { insertMealPlanSchema, insertMealSchema, insertPantryItemSchema } from "@shared/schema";
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
      const [meal] = await db.insert(meals).values(validated).returning();
      res.status(201).json(meal);
    } catch (error) {
      res.status(400).json({ message: "Invalid meal data" });
    }
  });

  app.put("/api/meals/:id", async (req, res) => {
    try {
      const validated = insertMealSchema.partial().parse(req.body);
      const [meal] = await db.update(meals)
        .set(validated)
        .where(eq(meals.id, req.params.id))
        .returning();
      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      res.json(meal);
    } catch (error) {
      res.status(400).json({ message: "Invalid meal data" });
    }
  });

  app.delete("/api/meals/:id", async (req, res) => {
    try {
      const [deleted] = await db.delete(meals)
        .where(eq(meals.id, req.params.id))
        .returning();
      if (!deleted) {
        return res.status(404).json({ message: "Meal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete meal" });
    }
  });

  // Bulk import meals
  app.post("/api/meals/bulk-import", async (req, res) => {
    try {
      const { meals: mealsToImport } = req.body;
      if (!Array.isArray(mealsToImport)) {
        return res.status(400).json({ message: "Expected array of meals" });
      }

      const createdMeals = [];
      for (const mealData of mealsToImport) {
        try {
          const validated = insertMealSchema.parse(mealData);
          const [meal] = await db.insert(meals).values(validated).returning();
          createdMeals.push(meal);
        } catch (error) {
          console.error("Failed to import meal:", mealData, error);
        }
      }

      res.json({ 
        message: `Successfully imported ${createdMeals.length} meals`,
        imported: createdMeals.length,
        total: mealsToImport.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to import meals" });
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
      const validated = insertMealPlanSchema.parse(req.body);
      const [mealPlan] = await db.insert(mealPlans).values(validated).returning();
      res.status(201).json(mealPlan);
    } catch (error) {
      res.status(400).json({ message: "Invalid meal plan data" });
    }
  });

  app.put("/api/meal-plans/:id", async (req, res) => {
    try {
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
      res.status(400).json({ message: "Invalid meal plan data" });
    }
  });

  // Pantry Items
  app.get("/api/pantry-items", async (req, res) => {
    try {
      const items = await db.select().from(pantryItems);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pantry items" });
    }
  });

  app.put("/api/pantry-items/:id", async (req, res) => {
    try {
      const [updatedItem] = await db.update(pantryItems)
        .set(req.body)
        .where(eq(pantryItems.id, req.params.id))
        .returning();
      if (!updatedItem) {
        return res.status(404).json({ message: "Pantry item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      res.status(400).json({ message: "Failed to update pantry item" });
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
      const pantryItemsData = await db.select().from(pantryItems);
      
      const selectedMeals = mealPlan.meals
        .filter(day => day.mealId)
        .map(day => mealsData.find(meal => meal.id === day.mealId))
        .filter(meal => meal && meal.ingredients);

      const shoppingList = {
        meatAndFish: [] as Array<{ name: string; quantity: string; checked: boolean }>,
        vegetables: [] as Array<{ name: string; quantity: string; checked: boolean }>,
        fruit: [] as Array<{ name: string; quantity: string; checked: boolean }>,
        seasoning: [] as Array<{ name: string; quantity: string; checked: boolean }>,
        staples: [] as Array<{ name: string; quantity: string; checked: boolean }>,
        other: [] as Array<{ name: string; quantity: string; checked: boolean }>
      };

      // Category mapping function
      const categorizeIngredient = (name: string, originalCategory: 'fresh' | 'pantry'): keyof typeof shoppingList => {
        const lowerName = name.toLowerCase();
        
        // Meat and Fish
        if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('pork') || 
            lowerName.includes('fish') || lowerName.includes('salmon') || lowerName.includes('turkey') ||
            lowerName.includes('lamb') || lowerName.includes('bacon') || lowerName.includes('ham') ||
            lowerName.includes('ribeye') || lowerName.includes('sirloin') || lowerName.includes('thighs')) {
          return 'meatAndFish';
        }
        
        // Vegetables
        if (lowerName.includes('onion') || lowerName.includes('garlic') || lowerName.includes('pepper') ||
            lowerName.includes('tomato') || lowerName.includes('mushroom') || lowerName.includes('carrot') ||
            lowerName.includes('celery') || lowerName.includes('lettuce') || lowerName.includes('spinach') ||
            lowerName.includes('broccoli') || lowerName.includes('cauliflower') || lowerName.includes('eggplant') ||
            lowerName.includes('vegetable') || lowerName.includes('ginger') || lowerName.includes('herbs') ||
            lowerName.includes('basil') || lowerName.includes('dill') || lowerName.includes('thyme')) {
          return 'vegetables';
        }
        
        // Fruit
        if (lowerName.includes('apple') || lowerName.includes('banana') || lowerName.includes('orange') ||
            lowerName.includes('lemon') || lowerName.includes('lime') || lowerName.includes('berry') ||
            lowerName.includes('grape') || lowerName.includes('pear') || lowerName.includes('peach')) {
          return 'fruit';
        }
        
        // Seasoning
        if (lowerName.includes('salt') || lowerName.includes('pepper') || lowerName.includes('spice') ||
            lowerName.includes('oregano') || lowerName.includes('cumin') || lowerName.includes('paprika') ||
            lowerName.includes('curry') || lowerName.includes('chili') || lowerName.includes('saffron') ||
            lowerName.includes('cinnamon') || lowerName.includes('sauce') || lowerName.includes('vinegar') ||
            lowerName.includes('paste') || originalCategory === 'pantry' && 
            (lowerName.includes('powder') || lowerName.includes('seasoning'))) {
          return 'seasoning';
        }
        
        // Staples
        if (lowerName.includes('rice') || lowerName.includes('pasta') || lowerName.includes('bread') ||
            lowerName.includes('flour') || lowerName.includes('sugar') || lowerName.includes('oil') ||
            lowerName.includes('butter') || lowerName.includes('milk') || lowerName.includes('cheese') ||
            lowerName.includes('stock') || lowerName.includes('broth') || lowerName.includes('wine') ||
            lowerName.includes('coconut milk') || lowerName.includes('beans') || lowerName.includes('can')) {
          return 'staples';
        }
        
        return 'other';
      };

      // Aggregate ingredients by name
      const ingredientMap = new Map<string, { quantity: string; category: 'fresh' | 'pantry' }>();

      selectedMeals.forEach(meal => {
        if (meal && meal.ingredients && Array.isArray(meal.ingredients)) {
          meal.ingredients.forEach(ingredient => {
            if (ingredient && ingredient.name && ingredient.amount) {
              const ingredientName = ingredient.name.trim();
              if (ingredientMap.has(ingredientName)) {
                // Keep existing quantity for now (could be improved to sum quantities)
                const existing = ingredientMap.get(ingredientName)!;
                ingredientMap.set(ingredientName, {
                  quantity: existing.quantity + " + " + ingredient.amount,
                  category: ingredient.category || existing.category
                });
              } else {
                ingredientMap.set(ingredientName, {
                  quantity: ingredient.amount,
                  category: ingredient.category || 'pantry'
                });
              }
            }
          });
        }
      });

      // Process each ingredient and categorize
      Array.from(ingredientMap.entries()).forEach(([name, details]) => {
        // Check if pantry item is in stock
        const pantryItem = pantryItemsData.find(p => 
          p.name.toLowerCase().includes(name.toLowerCase()) || 
          name.toLowerCase().includes(p.name.toLowerCase())
        );
        const needToShop = details.category === 'fresh' || !pantryItem || pantryItem.status !== 'in-stock';
        
        if (needToShop) {
          const item = { name, quantity: details.quantity, checked: false };
          const category = categorizeIngredient(name, details.category);
          shoppingList[category].push(item);
        }
      });

      const totalItems = shoppingList.meatAndFish.length + shoppingList.vegetables.length + 
                        shoppingList.fruit.length + shoppingList.seasoning.length + 
                        shoppingList.staples.length + shoppingList.other.length;

      res.json({
        ...shoppingList,
        summary: {
          totalItems
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate shopping list" });
    }
  });
}
