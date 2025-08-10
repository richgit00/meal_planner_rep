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
  },
  {
    id: "meal-002",
    name: "Pasta Marinara",
    description: "Fresh pasta with homemade marinara sauce and aromatic herbs.",
    cookTime: "25 mins",
    difficulty: "Easy",
    servings: 4,
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
    ingredients: [
      { name: "Pasta", amount: "1 lb", category: "pantry" as const },
      { name: "Canned tomatoes", amount: "2 cans", category: "pantry" as const },
      { name: "Fresh basil", amount: "1 bunch", category: "fresh" as const },
      { name: "Garlic", amount: "4 cloves", category: "fresh" as const },
      { name: "Olive oil", amount: "3 tbsp", category: "pantry" as const }
    ],
    instructions: [
      "Cook pasta according to package directions.",
      "Heat olive oil in a large pan and sauté minced garlic.",
      "Add canned tomatoes and simmer for 15 minutes.",
      "Season with salt, pepper, and fresh basil.",
      "Toss with cooked pasta and serve immediately."
    ]
  },
  {
    id: "meal-003",
    name: "Beef Stir Fry",
    description: "Quick and flavorful beef stir fry with crisp vegetables and savory sauce.",
    cookTime: "20 mins",
    difficulty: "Medium",
    servings: 4,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
    ingredients: [
      { name: "Beef sirloin", amount: "1.5 lbs", category: "fresh" as const },
      { name: "Bell peppers", amount: "2 cups", category: "fresh" as const },
      { name: "Soy sauce", amount: "1/4 cup", category: "pantry" as const },
      { name: "Ginger", amount: "1 tbsp", category: "fresh" as const },
      { name: "Vegetable oil", amount: "2 tbsp", category: "pantry" as const }
    ],
    instructions: [
      "Slice beef thinly against the grain.",
      "Heat oil in a wok or large skillet over high heat.",
      "Cook beef for 2-3 minutes until browned.",
      "Add vegetables and stir fry for 3-4 minutes.",
      "Add soy sauce and ginger, cook for 1 more minute."
    ]
  },
  {
    id: "meal-004",
    name: "Salmon with Rice",
    description: "Pan-seared salmon served over fluffy rice with lemon and herbs.",
    cookTime: "35 mins",
    difficulty: "Medium",
    servings: 4,
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
    ingredients: [
      { name: "Salmon fillets", amount: "4 pieces", category: "fresh" as const },
      { name: "Rice", amount: "2 cups", category: "pantry" as const },
      { name: "Lemon", amount: "1 whole", category: "fresh" as const },
      { name: "Butter", amount: "3 tbsp", category: "fresh" as const },
      { name: "Dill", amount: "2 tbsp", category: "fresh" as const }
    ],
    instructions: [
      "Cook rice according to package directions.",
      "Season salmon with salt and pepper.",
      "Heat butter in a large skillet over medium-high heat.",
      "Cook salmon for 4-5 minutes per side until flaky.",
      "Serve over rice with lemon wedges and fresh dill."
    ]
  },
  {
    id: "meal-005",
    name: "Vegetable Curry",
    description: "Aromatic vegetable curry with coconut milk and warm spices.",
    cookTime: "40 mins",
    difficulty: "Medium",
    servings: 6,
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
    ingredients: [
      { name: "Mixed vegetables", amount: "3 cups", category: "fresh" as const },
      { name: "Coconut milk", amount: "1 can", category: "pantry" as const },
      { name: "Curry powder", amount: "2 tbsp", category: "pantry" as const },
      { name: "Onion", amount: "1 large", category: "fresh" as const },
      { name: "Garlic", amount: "3 cloves", category: "fresh" as const }
    ],
    instructions: [
      "Sauté diced onion and garlic until fragrant.",
      "Add curry powder and cook for 1 minute.",
      "Add vegetables and coconut milk.",
      "Simmer for 25 minutes until vegetables are tender.",
      "Season with salt and serve over rice."
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