import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, ShoppingCart, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MealSelectionModal } from "@/components/meal-selection-modal";
import { RecipeDetailModal } from "@/components/recipe-detail-modal";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Meal, type MealPlan, type CookedMeal } from "@shared/schema";

/* ----------------------------- Utilities ----------------------------- */

// Format a Date as YYYY-MM-DD in LOCAL time (no timezone shift)
function ymdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Small fetch helper that throws on non-2xx
const fetchJSON = async <T,>(url: string): Promise<T> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${url}`);
  return r.json();
};

/* ------------------------- Week/Date helpers ------------------------- */

// Helper function to get week dates from a start date (display only)
const getWeekDates = (weekStartDate: string) => {
  const startDate = new Date(weekStartDate);
  const days: { name: string; date: string }[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];

    // Fixed Saturday-first labels
    const dayName = ["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"][i];

    days.push({
      name: dayName,
      date: `${monthNames[date.getMonth()]} ${date.getDate()}`
    });
  }

  return days;
};

// Helper to format week range for display
const formatWeekRange = (weekStartDate: string) => {
  const startDate = new Date(weekStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const startMonth = monthNames[startDate.getMonth()];
  const endMonth = monthNames[endDate.getMonth()];
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();

  return startMonth === endMonth
    ? `${startMonth} ${startDay}-${endDay}`
    : `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
};

// Add/subtract full weeks; normalise to midday to avoid DST rollovers
const addWeeks = (dateString: string, weeks: number) => {
  const date = new Date(dateString);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + weeks * 7);
  return ymdLocal(date);
};

// Get the current week's Saturday in LOCAL time
const getCurrentWeekSaturday = () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0); // avoid DST/clock edges
  const dayOfWeek = today.getDay(); // Sun=0, Mon=1, ... Sat=6
  const diff = (dayOfWeek + 1) % 7; // days since Saturday
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - diff);
  return ymdLocal(saturday);
};

/* ------------------------------ Component ------------------------------ */

export default function MealPlan() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekSaturday());

  // Debug: ensure we're anchored to Saturday locally
  // console.log("Computed currentWeek (local):", currentWeek);

  /* ------------------------------ Queries ------------------------------ */

  const { data: meals = [], isLoading: mealsLoading } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
    queryFn: () => fetchJSON<Meal[]>("/api/meals"),
  });

  // IMPORTANT: include currentWeek in the actual request, not just the key
  // If your API uses querystring instead, switch to `/api/meal-plans?week=${currentWeek}`
  const { data: mealPlan } = useQuery<MealPlan>({
    queryKey: ["/api/meal-plans", currentWeek],
    queryFn: () => fetchJSON<MealPlan>(`/api/meal-plans/${currentWeek}`),
    retry: false,
  });

  const { data: cookedMealsData = [] } = useQuery<CookedMeal[]>({
    queryKey: ["/api/cooked-meals", currentWeek],
    queryFn: () => fetchJSON<CookedMeal[]>(`/api/cooked-meals/${currentWeek}`),
    retry: false,
  });

  /* ----------------------------- Mutations ----------------------------- */

  const createMealPlanMutation = useMutation({
    mutationFn: async (newMealPlan: { weekStartDate: string; meals: Array<{ day: string; mealId: string | null }> }) => {
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

  const markCookedMutation = useMutation({
    mutationFn: async ({ weekStartDate, day, mealId }: { weekStartDate: string; day: string; mealId: string }) => {
      return await apiRequest("POST", "/api/cooked-meals", {
        weekStartDate,
        day,
        mealId,
        cookedAt: new Date().toISOString(), // timestamp OK in UTC for events
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cooked-meals", currentWeek] });
    },
    onError: (error: any) => {
      console.error("Mark cooked failed:", error);
      toast({ title: "Failed to mark as cooked", variant: "destructive" });
    },
  });

  const unmarkCookedMutation = useMutation({
    mutationFn: async ({ weekStartDate, day, mealId }: { weekStartDate: string; day: string; mealId: string }) => {
      return await apiRequest("DELETE", `/api/cooked-meals/${weekStartDate}/${day}/${mealId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cooked-meals", currentWeek] });
    },
    onError: (error: any) => {
      console.error("Unmark cooked failed:", error);
      toast({ title: "Failed to unmark as cooked", variant: "destructive" });
    },
  });

  /* --------------------------- Derived state --------------------------- */

  const weekDays = getWeekDates(currentWeek);
  const currentMeals = mealPlan?.meals || weekDays.map((day) => ({ day: day.name, mealId: null }));

  /* ------------------------------ Handlers ----------------------------- */

  const handleDayClick = (dayName: string) => {
    setSelectedDay(dayName);
    setShowMealModal(true);
  };

  const handleMealSelect = (meal: Meal) => {
    if (!selectedDay) return;

    const updatedMeals = currentMeals.map((dayMeal) =>
      dayMeal.day === selectedDay ? { ...dayMeal, mealId: meal.id } : dayMeal
    );

    if (mealPlan) {
      updateMealPlanMutation.mutate({ id: mealPlan.id, meals: updatedMeals });
    } else {
      createMealPlanMutation.mutate({
        weekStartDate: currentWeek, // TEXT column expects "YYYY-MM-DD"
        meals: updatedMeals,
      });
    }
  };

  const handleMealClick = (mealId: string) => {
    const meal = meals.find((m) => m.id === mealId);
    if (meal) {
      setSelectedMeal(meal);
      setShowRecipeModal(true);
    }
  };

  const handleMealDelete = (dayName: string) => {
    const updatedMeals = currentMeals.map((dayMeal) =>
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

  const goToPreviousWeek = () => {
    const newWeek = addWeeks(currentWeek, -1);
    const earliestWeek = addWeeks(getCurrentWeekSaturday(), -26);
    if (newWeek >= earliestWeek) setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = addWeeks(currentWeek, 1);
    const latestWeek = addWeeks(getCurrentWeekSaturday(), 4);
    if (newWeek <= latestWeek) setCurrentWeek(newWeek);
  };

  const isCooked = (dayName: string, mealId: string) =>
    cookedMealsData.some((cooked) => cooked.day === dayName && cooked.mealId === mealId);

  const toggleCookedStatus = (dayName: string, mealId: string) => {
    const cookedStatus = isCooked(dayName, mealId);

    if (cookedStatus) {
      unmarkCookedMutation.mutate({ weekStartDate: currentWeek, day: dayName, mealId });
      toast({ title: "Marked as not cooked" });
    } else {
      markCookedMutation.mutate({ weekStartDate: currentWeek, day: dayName, mealId });
      toast({ title: "Marked as cooked! 🍽️" });
    }
  };

  const isPreviousDisabled = currentWeek <= addWeeks(getCurrentWeekSaturday(), -26);
  const isNextDisabled = currentWeek >= addWeeks(getCurrentWeekSaturday(), 4);

  const handleGenerateShoppingList = async () => {
    const hasPlannedMeals = currentMeals.some((dayMeal) => dayMeal.mealId);
    if (!hasPlannedMeals) {
      toast({
        title: "No meals planned",
        description: "Please add some meals to your weekly plan first.",
        variant: "destructive",
      });
      return;
    }

    // Clear caches and ensure fresh data
    queryClient.removeQueries({ queryKey: ["/api/meal-plans"] });
    queryClient.removeQueries({ queryKey: ["/api/shopping-list"] });

    await queryClient.prefetchQuery({
      queryKey: ["/api/meal-plans", currentWeek],
      queryFn: () => fetchJSON<MealPlan>(`/api/meal-plans/${currentWeek}`),
    });

    setLocation(`/shopping-list?week=${currentWeek}`);
  };

  /* ------------------------------ Render ------------------------------- */

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Weekly Meal Plan</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center space-x-2">
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
          <span className="text-sm sm:text-lg font-medium text-slate-800 text-center sm:text-left min-w-0 flex-shrink-0">
            {formatWeekRange(currentWeek)}
          </span>
        </div>
      </div>

      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 mb-8">
        {getWeekDates(currentWeek).map((day) => {
          const dayMeal = currentMeals.find((m) => m.day === day.name);
          const meal = dayMeal?.mealId ? meals.find((m) => m.id === dayMeal.mealId) : null;

          return (
            <Card key={day.name}>
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-slate-800">{day.name}</h3>
                  <p className="text-sm text-slate-500">{day.date}</p>
                </div>
                <div
                  className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors duration-200 min-h-[120px] flex flex-col justify-center"
                  onClick={() => handleDayClick(day.name)}
                >
                  {meal ? (
                    <div className="space-y-2 relative">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 h-8 w-8 sm:h-6 sm:w-6 p-0 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMealDelete(day.name);
                        }}
                      >
                        <X className="h-4 w-4 sm:h-3 sm:w-3" />
                      </Button>
                      <div
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMealClick(meal.id);
                        }}
                      >
                        <img
                          src={meal.image}
                          alt={meal.name}
                          className={`w-full h-24 object-cover rounded-lg transition-opacity ${
                            isCooked(day.name, meal.id) ? "opacity-60" : ""
                          }`}
                        />
                        <h4
                          className={`font-medium text-sm ${
                            isCooked(day.name, meal.id) ? "text-slate-500 line-through" : "text-slate-800"
                          }`}
                        >
                          {meal.name}
                        </h4>
                        <p className="text-xs text-slate-500">{meal.cookTime}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={isCooked(day.name, meal.id) ? "default" : "outline"}
                        className={`text-xs px-2 py-1 h-7 ${
                          isCooked(day.name, meal.id)
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCookedStatus(day.name, meal.id);
                        }}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {isCooked(day.name, meal.id) ? "Cooked!" : "Mark Cooked"}
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Plus className="text-slate-400 text-2xl mb-2 mx-auto" />
                      <p className="text-slate-500 text-sm">Add Meal</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center">
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

