import { db } from "./db";
import { meals } from "@shared/schema";

const initialMeals = [
  {
    id: "meal-001",
    name: "Grilled Chicken & Vegetables",
    description: "A healthy and delicious meal featuring perfectly grilled chicken breast served with a colorful medley of fresh vegetables.",
    cookTime: "30 mins",
    difficulty: "Easy",
    servings: 4,
    image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
    ingredients: [
      { name: "Chicken breast", amount: "2 lbs", category: "fresh" as const },
      { name: "Mixed vegetables", amount: "2 cups", category: "fresh" as const },
      { name: "Olive oil", amount: "2 tbsp", category: "pantry" as const },
      { name: "Salt", amount: "1 tsp", category: "pantry" as const },
      { name: "Black pepper", amount: "1/2 tsp", category: "pantry" as const }
    ],
    instructions: [
      "Preheat grill to medium-high heat and brush chicken with olive oil.",
      "Season chicken with salt and pepper on both sides.",
      "Grill chicken for 6-7 minutes per side until internal temperature reaches 165°F.",
      "Meanwhile, sauté vegetables in a pan with remaining olive oil until tender.",
      "Let chicken rest for 5 minutes before serving with vegetables."
    ]
  } 

];


export async function seedDatabase() {
  try {
    console.log("Seeding database with initial data...");
    
    // Check if data already exists
    const existingMeals = await db.select().from(meals);
       
    if (existingMeals.length === 0) {
      console.log("Adding initial meals...");
      await db.insert(meals).values(initialMeals);
      console.log(`Added ${initialMeals.length} meals`);
    } else {
      console.log(`Database already has ${existingMeals.length} meals, skipping meal seeding`);
    }
       
    
    console.log("Database seeding completed!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => {
    console.log("Seeding completed successfully");
  }).catch((error) => {
    console.error("Seeding failed:", error);
    throw error;
  });
}