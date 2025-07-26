import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Save, ShoppingCart, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MealSelectionModal } from "@/components/meal-selection-modal";
import { RecipeDetailModal } from "@/components/recipe-detail-modal";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Meal, type MealPlan } from "@shared/schema";

// Helper function to get week dates from a start date
const getWeekDates = (weekStartDate: string) => {
  const startDate = new Date(weekStartDate);
  const days = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Adjust for Monday start
    const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    const dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i];

    days.push({
      name: dayName,
      date: `${monthNames[date.getMonth()]} ${date.getDate()}`
    });
  }

  return days;
};

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
  const year = startDate.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
};

// Helper functions for week navigation
const addWeeks = (dateString: string, weeks: number) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + (weeks * 7));
  return date.toISOString().split('T')[0];
};

export default function MealPlan() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [currentWeek, setCurrentWeek] = useState("2025-07-21"); // Week starting Monday July 21, 2025

  const { data: meals = [], isLoading: mealsLoading } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
  });

  const { data: mealPlan } = useQuery<MealPlan>({
    queryKey: ["/api/meal-plans", currentWeek],
    retry: false,
  });

  const createMealPlanMutation = useMutation({
    mutationFn: async (newMealPlan: { weekStartDate: string; meals: Array<{ day: string; mealId: string | null }> }) => {
      console.log("Creating meal plan:", newMealPlan);
      return await apiRequest("POST", "/api/meal-plans", newMealPlan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({ title: "Meal plan saved successfully!" });
    },
    onError: (error: any) => {
      console.error("Meal plan creation failed:", error);
      toast({ title: "Failed to save meal plan", variant: "destructive" });
    },
  });

  const updateMealPlanMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; meals: Array<{ day: string; mealId: string | null }> }) => {
      console.log("Updating meal plan:", { id, updates });
      return await apiRequest("PUT", `/api/meal-plans/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({ title: "Meal plan updated successfully!" });
    },
    onError: (error: any) => {
      console.error("Meal plan update failed:", error);
      toast({ title: "Failed to update meal plan", variant: "destructive" });
    },
  });

  const weekDays = getWeekDates(currentWeek);
  const currentMeals = mealPlan?.meals || weekDays.map(day => ({ day: day.name, mealId: null }));

  const handleDayClick = (dayName: string) => {
    setSelectedDay(dayName);
    setShowMealModal(true);
  };

  const handleMealSelect = (meal: Meal) => {
    if (!selectedDay) return;

    const updatedMeals = currentMeals.map(dayMeal =>
      dayMeal.day === selectedDay ? { ...dayMeal, mealId: meal.id } : dayMeal
    );

    if (mealPlan) {
      updateMealPlanMutation.mutate({ id: mealPlan.id, meals: updatedMeals });
    } else {
      createMealPlanMutation.mutate({
        weekStartDate: currentWeek,
        meals: updatedMeals,
      });
    }
  };

  const handleMealClick = (mealId: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (meal) {
      setSelectedMeal(meal);
      setShowRecipeModal(true);
    }
  };

  const handleMealDelete = (dayName: string) => {
    const updatedMeals = currentMeals.map(dayMeal =>
      dayMeal.day === dayName ? { ...dayMeal, mealId: null } : dayMeal
    );

    if (mealPlan) {
      updateMealPlanMutation.mutate({ id: mealPlan.id, meals: updatedMeals });
    } else {
      createMealPlanMutation.mutate({
        weekStartDate: currentWeek,
        meals: updatedMeals,
      });
    }
  };

  const saveMealPlan = () => {
    if (mealPlan) {
      updateMealPlanMutation.mutate({ id: mealPlan.id, meals: currentMeals });
    } else {
      createMealPlanMutation.mutate({
        weekStartDate: currentWeek,
        meals: currentMeals,
      });
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, -1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleGenerateShoppingList = () => {
    // Check if there are any meals planned for the week
    const hasPlannedMeals = currentMeals.some(dayMeal => dayMeal.mealId);

    if (!hasPlannedMeals) {
      toast({ 
        title: "No meals planned", 
        description: "Please add some meals to your weekly plan first.",
        variant: "destructive" 
      });
      return;
    }

    // Navigate to shopping list page with current week parameter
    setLocation(`/shopping-list?week=${currentWeek}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Weekly Meal Plan</h2>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Week
          </Button>
          <span className="text-lg font-medium text-slate-800">{formatWeekRange(currentWeek)}</span>
          <Button variant="outline" onClick={goToNextWeek}>
            Next Week
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
        {weekDays.map((day) => {
          const dayMeal = currentMeals.find(m => m.day === day.name);
          const meal = dayMeal?.mealId ? meals.find(m => m.id === dayMeal.mealId) : null;

          return (
            <Card key={day.name} className="p-3 sm:p-4">
              <h3 className="font-semibold text-slate-800 mb-3 text-center text-sm sm:text-base">{day.name}</h3>

              {meal ? (
                <div className="space-y-3">
                  <div className="relative group">
                    <img 
                      src={meal.image} 
                      alt={meal.name}
                      className="w-full h-24 sm:h-28 md:h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleMealClick(meal.id)}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 h-auto min-h-[32px] min-w-[32px]"
                      onClick={(e) => {
                          e.stopPropagation();
                          handleMealDelete(day.name);
                        }}
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                  <div>
                    <h4 className="font-medium text-xs sm:text-sm text-slate-800 mb-1 line-clamp-2">{meal.name}</h4>
                    <p className="text-xs text-slate-600 mb-2">{meal.cookTime} • {meal.difficulty}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs min-h-[36px] sm:min-h-[32px]"
                      onClick={() => {
                        setSelectedDay(day.name);
                        setShowMealModal(true);
                      }}
                    >
                      Change Meal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-full h-24 sm:h-28 md:h-32 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs min-h-[36px] sm:min-h-[32px]"
                    onClick={() => {
                      setSelectedDay(day.name);
                      setShowMealModal(true);
                    }}
                  >
                    Add Meal
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button onClick={saveMealPlan} disabled={createMealPlanMutation.isPending || updateMealPlanMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save Meal Plan
        </Button>
        <Button 
          variant="outline" 
          className="bg-accent text-white hover:bg-emerald-600"
          onClick={handleGenerateShoppingList}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Generate Shopping List
        </Button>
      </div>

      <MealSelectionModal
        open={showMealModal}
        onOpenChange={setShowMealModal}
        meals={meals}
        onSelectMeal={handleMealSelect}
      />

      <RecipeDetailModal
        open={showRecipeModal}
        onOpenChange={setShowRecipeModal}
        meal={selectedMeal}
      />
    </div>
  );
}