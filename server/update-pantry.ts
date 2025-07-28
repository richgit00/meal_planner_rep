
import { db } from "./db";
import { meals, pantryItems } from "@shared/schema";

async function updatePantryItems() {
  try {
    console.log("🔍 Analyzing meal ingredients to update pantry items...");
    
    // Get all meals and their ingredients
    const allMeals = await db.select().from(meals);
    console.log(`📊 Found ${allMeals.length} meals to analyze`);
    
    // Extract all pantry ingredients from meals
    const usedPantryIngredients = new Set<string>();
    
    allMeals.forEach(meal => {
      if (meal.ingredients && Array.isArray(meal.ingredients)) {
        meal.ingredients.forEach(ingredient => {
          if (ingredient.category === 'pantry' && ingredient.name) {
            // Normalize ingredient names for better matching
            const normalizedName = ingredient.name.toLowerCase().trim();
            usedPantryIngredients.add(normalizedName);
          }
        });
      }
    });
    
    console.log(`🥫 Found ${usedPantryIngredients.size} unique pantry ingredients in meals:`);
    console.log(Array.from(usedPantryIngredients).sort());
    
    // Get current pantry items
    const currentPantryItems = await db.select().from(pantryItems);
    console.log(`📦 Current pantry items: ${currentPantryItems.length}`);
    
    // Find which pantry items are actually used
    const usedPantryItems = currentPantryItems.filter(item => {
      const itemNameLower = item.name.toLowerCase().trim();
      
      // Check for exact matches or partial matches
      return Array.from(usedPantryIngredients).some(ingredient => 
        ingredient.includes(itemNameLower) || 
        itemNameLower.includes(ingredient) ||
        ingredient === itemNameLower
      );
    });
    
    console.log(`✅ Pantry items that are used: ${usedPantryItems.length}`);
    usedPantryItems.forEach(item => console.log(`  - ${item.name} (${item.category})`));
    
    // Find items to remove
    const itemsToRemove = currentPantryItems.filter(item => 
      !usedPantryItems.some(usedItem => usedItem.id === item.id)
    );
    
    console.log(`🗑️ Pantry items to remove: ${itemsToRemove.length}`);
    itemsToRemove.forEach(item => console.log(`  - ${item.name} (${item.category})`));
    
    // Remove unused pantry items
    if (itemsToRemove.length > 0) {
      for (const item of itemsToRemove) {
        await db.delete(pantryItems).where(eq(pantryItems.id, item.id));
        console.log(`🗑️ Removed: ${item.name}`);
      }
    }
    
    // Get final count
    const finalPantryItems = await db.select().from(pantryItems);
    console.log(`\n✅ Pantry cleanup complete!`);
    console.log(`📊 Final pantry items count: ${finalPantryItems.length}`);
    console.log(`🧹 Removed ${itemsToRemove.length} unused items`);
    
  } catch (error) {
    console.error("❌ Error updating pantry items:", error);
  }
}

// Import the eq function
import { eq } from "drizzle-orm";

export { updatePantryItems };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updatePantryItems().then(() => {
    console.log("Script completed");
    process.exit(0);
  });
}
