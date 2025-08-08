import type { Express } from "express";
import { randomUUID } from "crypto";

import { db } from "./db";
import { meals, mealPlans, pantryItems, favourites } from "@shared/schema";
import { insertMealPlanSchema, insertMealSchema, insertPantryItemSchema, insertFavouriteSchema } from "@shared/schema";
import { eq, and } from "drizzle-orm";

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

  // Pantry Items
  app.get("/api/pantry-items", async (req, res) => {
    try {
      const items = await db.select().from(pantryItems);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pantry items" });
    }
  });

  app.post("/api/pantry-items/cleanup", async (req, res) => {
    try {
      console.log("🧹 Starting comprehensive pantry cleanup...");
      
      // Get all meals and their ingredients
      const allMeals = await db.select().from(meals);
      console.log(`📊 Analyzing ${allMeals.length} meals for pantry ingredients...`);
      
      // Extract all pantry ingredients from meals with better normalization
      const usedPantryIngredients = new Set<string>();
      
      allMeals.forEach(meal => {
        if (meal.ingredients && Array.isArray(meal.ingredients)) {
          meal.ingredients.forEach(ingredient => {
            if (ingredient.category === 'pantry' && ingredient.name) {
              // More thorough normalization
              let normalizedName = ingredient.name.toLowerCase().trim()
                .replace(/\s+/g, ' ')  // normalize spaces
                .replace(/[.,]/g, '')  // remove punctuation
                .replace(/\bground\b/g, '')  // remove common modifiers
                .replace(/\bfresh\b/g, '')
                .replace(/\bdried\b/g, '')
                .replace(/\bwhole\b/g, '')
                .trim();
              
              if (normalizedName) {
                usedPantryIngredients.add(normalizedName);
                console.log(`🥫 Found pantry ingredient: ${ingredient.name} -> ${normalizedName}`);
              }
            }
          });
        }
      });
      
      console.log(`📋 Total unique pantry ingredients found: ${usedPantryIngredients.size}`);
      
      // Get current pantry items
      const currentPantryItems = await db.select().from(pantryItems);
      console.log(`📦 Current pantry items in database: ${currentPantryItems.length}`);
      
      // Find which pantry items are actually used with improved matching
      const usedPantryItems = currentPantryItems.filter(item => {
        const itemNameLower = item.name.toLowerCase().trim()
          .replace(/\s+/g, ' ')
          .replace(/[.,]/g, '')
          .replace(/\bground\b/g, '')
          .replace(/\bfresh\b/g, '')
          .replace(/\bdried\b/g, '')
          .replace(/\bwhole\b/g, '')
          .trim();
        
        const isUsed = Array.from(usedPantryIngredients).some(ingredient => {
          // Exact match
          if (ingredient === itemNameLower) return true;
          
          // Partial matches (ingredient contains item name or vice versa)
          if (ingredient.includes(itemNameLower) && itemNameLower.length > 2) return true;
          if (itemNameLower.includes(ingredient) && ingredient.length > 2) return true;
          
          // Word-based matching for compound ingredients
          const ingredientWords = ingredient.split(' ');
          const itemWords = itemNameLower.split(' ');
          
          return ingredientWords.some(iWord => 
            itemWords.some(pWord => 
              (iWord === pWord && iWord.length > 2) ||
              (iWord.includes(pWord) && pWord.length > 2) ||
              (pWord.includes(iWord) && iWord.length > 2)
            )
          );
        });
        
        if (isUsed) {
          console.log(`✅ Keeping: ${item.name} (matches meal ingredients)`);
        }
        
        return isUsed;
      });
      
      // Find items to remove
      const itemsToRemove = currentPantryItems.filter(item => 
        !usedPantryItems.some(usedItem => usedItem.id === item.id)
      );
      
      console.log(`🗑️ Items to remove: ${itemsToRemove.length}`);
      itemsToRemove.forEach(item => console.log(`  - ${item.name} (${item.category})`));
      
      // Remove unused pantry items
      let removedCount = 0;
      if (itemsToRemove.length > 0) {
        for (const item of itemsToRemove) {
          await db.delete(pantryItems).where(eq(pantryItems.id, item.id));
          removedCount++;
          console.log(`🗑️ Removed: ${item.name}`);
        }
      }
      
      console.log(`✅ Pantry cleanup completed: removed ${removedCount} items, ${usedPantryItems.length} remaining`);
      
      res.json({
        message: `Pantry cleanup completed successfully`,
        removedItems: removedCount,
        remainingItems: usedPantryItems.length,
        removedItemNames: itemsToRemove.map(item => item.name),
        keptItems: usedPantryItems.map(item => item.name)
      });
      
    } catch (error) {
      console.error("❌ Pantry cleanup error:", error);
      res.status(500).json({ message: "Failed to cleanup pantry items", error: error.message });
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
      const { addedPantryItems } = req.query;
      const addedItems = addedPantryItems ? JSON.parse(addedPantryItems as string) : [];
      
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

      // Add manually added pantry items to the shopping list
      const addedPantryItemsForList = [];
      if (addedItems.length > 0) {
        for (const itemId of addedItems) {
          const pantryItem = pantryItemsData.find(p => p.id === itemId);
          if (pantryItem) {
            addedPantryItemsForList.push({
              name: pantryItem.name,
              quantity: "1", // Default quantity for manually added items
              checked: false
            });
          }
        }
      }

      const totalItems = shoppingList.meatAndFish.length + shoppingList.vegetables.length + 
                        shoppingList.fruit.length + shoppingList.seasoning.length + 
                        shoppingList.staples.length + shoppingList.other.length + 
                        addedPantryItemsForList.length;

      res.json({
        ...shoppingList,
        addedPantryItems: addedPantryItemsForList,
        summary: {
          totalItems
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate shopping list" });
    }
  });

  // Favourites routes
  app.get("/api/favourites", async (req, res) => {
    try {
      const userId = req.query.userId as string || "default-user"; // For now, use default user
      const userFavourites = await db.select().from(favourites).where(eq(favourites.userId, userId));
      res.json(userFavourites);
    } catch (error) {
      console.error("Error fetching favourites:", error);
      res.status(500).json({ message: "Failed to fetch favourites" });
    }
  });

  app.post("/api/favourites", async (req, res) => {
    try {
      const userId = req.body.userId || "default-user"; // For now, use default user
      const { mealId } = req.body;
      
      // Check if already favourited
      const existing = await db.select().from(favourites)
        .where(and(eq(favourites.mealId, mealId), eq(favourites.userId, userId)));
      
      if (existing.length > 0) {
        return res.status(400).json({ message: "Meal already favourited" });
      }

      const favouriteWithId = { 
        id: randomUUID(), 
        mealId, 
        userId 
      };
      
      const [favourite] = await db.insert(favourites).values(favouriteWithId).returning();
      res.status(201).json(favourite);
    } catch (error) {
      console.error("Error adding favourite:", error);
      res.status(500).json({ message: "Failed to add favourite" });
    }
  });

  app.delete("/api/favourites/:mealId", async (req, res) => {
    try {
      const userId = req.query.userId as string || "default-user"; // For now, use default user
      const { mealId } = req.params;
      
      const [deleted] = await db.delete(favourites)
        .where(and(eq(favourites.mealId, mealId), eq(favourites.userId, userId)))
        .returning();
        
      if (!deleted) {
        return res.status(404).json({ message: "Favourite not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favourite:", error);
      res.status(500).json({ message: "Failed to remove favourite" });
    }
  });
}
