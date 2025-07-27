
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { type PantryItem, type Meal } from "@shared/schema";

// Helper function to format week range for display
const formatWeekRange = (weekStartDate: string) => {
  const startDate = new Date(weekStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const startMonth = monthNames[startDate.getMonth()];
  const endMonth = monthNames[endDate.getMonth()];
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
};

// Helper functions for week navigation
const addWeeks = (dateString: string, weeks: number) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + (weeks * 7));
  return date.toISOString().split('T')[0];
};

// Helper function to get the current week's Monday
const getCurrentWeekMonday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
};

export default function Pantry() {
  const { toast } = useToast();
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekMonday());
  
  // Initialize added items from localStorage
  const getStoredAddedItems = () => {
    try {
      const stored = localStorage.getItem(`addedPantryItems_${currentWeek}`);
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  };
  
  const [addedToShoppingList, setAddedToShoppingList] = useState<Set<string>>(getStoredAddedItems());

  const { data: pantryItems = [], isLoading: pantryLoading } = useQuery<PantryItem[]>({
    queryKey: ["/api/pantry-items"],
  });

  const { data: meals = [], isLoading: mealsLoading } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
  });

  const { data: mealPlan } = useQuery({
    queryKey: ["/api/meal-plans", currentWeek],
  });

  const goToPreviousWeek = () => {
    const newWeek = addWeeks(currentWeek, -1);
    const earliestWeek = addWeeks(getCurrentWeekMonday(), -26);
    if (newWeek >= earliestWeek) {
      setCurrentWeek(newWeek);
    }
  };

  const goToNextWeek = () => {
    const newWeek = addWeeks(currentWeek, 1);
    const latestWeek = addWeeks(getCurrentWeekMonday(), 4);
    if (newWeek <= latestWeek) {
      setCurrentWeek(newWeek);
    }
  };

  // Check if navigation buttons should be disabled
  const isPreviousDisabled = currentWeek <= addWeeks(getCurrentWeekMonday(), -26);
  const isNextDisabled = currentWeek >= addWeeks(getCurrentWeekMonday(), 4);

  const handleAddToShoppingList = (itemId: string, itemName: string) => {
    const newAddedItems = new Set(addedToShoppingList);
    if (newAddedItems.has(itemId)) {
      newAddedItems.delete(itemId);
      toast({ title: `${itemName} removed from shopping list` });
    } else {
      newAddedItems.add(itemId);
      toast({ title: `${itemName} added to shopping list` });
    }
    setAddedToShoppingList(newAddedItems);
    
    // Store in localStorage for persistence
    const itemsArray = Array.from(newAddedItems);
    localStorage.setItem(`addedPantryItems_${currentWeek}`, JSON.stringify(itemsArray));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "bg-accent";
      case "low-stock":
        return "bg-yellow-500";
      case "out-of-stock":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "in-stock":
        return "secondary";
      case "low-stock":
        return "outline";
      case "out-of-stock":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "in-stock":
        return "In Stock";
      case "low-stock":
        return "Low Stock";
      case "out-of-stock":
        return "Out of Stock";
      default:
        return status;
    }
  };

  // Get ingredients needed for the current week's meals with quantities
  const getRequiredPantryItems = () => {
    if (!mealPlan?.meals || meals.length === 0) {
      return [];
    }

    const weeklyMealIds = mealPlan.meals
      .filter(day => day.mealId)
      .map(day => day.mealId);

    const weeklyMeals = meals.filter(meal => weeklyMealIds.includes(meal.id));
    
    // Aggregate ingredients by name with quantities
    const ingredientMap = new Map<string, string>();
    weeklyMeals.forEach(meal => {
      if (meal.ingredients) {
        meal.ingredients.forEach(ingredient => {
          if (ingredient.category === 'pantry') {
            const ingredientName = ingredient.name.toLowerCase();
            if (ingredientMap.has(ingredientName)) {
              // Combine quantities when the same ingredient appears multiple times
              const existing = ingredientMap.get(ingredientName)!;
              ingredientMap.set(ingredientName, existing + " + " + ingredient.amount);
            } else {
              ingredientMap.set(ingredientName, ingredient.amount);
            }
          }
        });
      }
    });

    // Filter pantry items to only show those needed for this week's recipes and add quantities
    return pantryItems
      .filter(item => ingredientMap.has(item.name.toLowerCase()))
      .map(item => ({
        ...item,
        requiredQuantity: ingredientMap.get(item.name.toLowerCase()) || ""
      }));
  };

  const requiredPantryItems = getRequiredPantryItems();

  const categorizedItems = requiredPantryItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PantryItem[]>);

  const statusCounts = requiredPantryItems.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (pantryLoading || mealsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>Loading pantry items...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Weekly Pantry Items</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2 sm:space-x-4 order-2 sm:order-1">
            <Button variant="outline" onClick={goToPreviousWeek} disabled={isPreviousDisabled} size="sm">
              <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Previous Week</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            <Button variant="outline" onClick={goToNextWeek} disabled={isNextDisabled} size="sm">
              <span className="hidden sm:inline">Next Week</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
            </Button>
          </div>
          <span className="text-sm sm:text-lg font-medium text-slate-800 order-1 sm:order-2">{formatWeekRange(currentWeek)}</span>
        </div>
      </div>

      {requiredPantryItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-600">No pantry items required for this week's meal plan.</p>
          <p className="text-slate-500 text-sm mt-2">Create a meal plan for this week to see required pantry items.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(categorizedItems).map(([category, items]) => (
              <Card key={category}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    {category === "Spices & Seasonings" && "🌶️"}
                    {category === "Cooking Essentials" && "🫒"}
                    {category === "Pantry Staples" && "🍞"}
                    <span className="ml-2">{category}</span>
                  </h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center flex-1">
                          <div
                            className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(item.status)}`}
                          />
                          <div className="flex-1">
                            <span className="text-slate-800">{item.name}</span>
                            {(item as any).requiredQuantity && (
                              <div className="text-xs text-slate-500 mt-1">
                                Needed: {(item as any).requiredQuantity}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className={`text-xs ml-2 ${
                            addedToShoppingList.has(item.id) 
                              ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                              : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                          }`}
                          onClick={() => handleAddToShoppingList(item.id, item.name)}
                        >
                          {addedToShoppingList.has(item.id) ? "Added to List" : "Add to List"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pantry Summary */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Weekly Pantry Status</h3>
                <p className="text-slate-600">Items needed for this week's meal plan</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-accent">{statusCounts["in-stock"] || 0}</div>
                  <div className="text-xs text-slate-600">In Stock</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-yellow-600">{statusCounts["low-stock"] || 0}</div>
                  <div className="text-xs text-slate-600">Low Stock</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-red-500">{statusCounts["out-of-stock"] || 0}</div>
                  <div className="text-xs text-slate-600">Out of Stock</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
