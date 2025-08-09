import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, ShoppingCart, Plus, X, Check, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MealSelectionModal } from "@/components/meal-selection-modal";
import { RecipeDetailModal } from "@/components/recipe-detail-modal";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Meal, type MealPlan, type PantryItem } from "@shared/schema";

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

export default function MealPlan() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekMonday());
  const [cookedMeals, setCookedMeals] = useState<Set<string>>(new Set());
  const [favoriteMeals, setFavoriteMeals] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('favoriteMeals');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: meals = [], isLoading: mealsLoading } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
  });

  const { data: favouritesData = [] } = useQuery<Array<{ mealId: string }>>({
    queryKey: ["/api/favourites"],
  });

  // Update favourite meals state when data changes
  React.useEffect(() => {
    if (favouritesData) {
      setFavoriteMeals(new Set(favouritesData.map(f => f.mealId)));
    }
  }, [favouritesData]);

  const { data: pantryItems = [], isLoading: pantryLoading } = useQuery<PantryItem[]>({
    queryKey: ["/api/pantry-items"],
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
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/meal-plans", currentWeek], data);
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      queryClient.refetchQueries({ queryKey: ["/api/meal-plans", currentWeek] });
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
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/meal-plans", currentWeek], data);
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      queryClient.refetchQueries({ queryKey: ["/api/meal-plans", currentWeek] });
      toast({ title: "Meal plan updated successfully!" });
    },
    onError: (error: any) => {
      console.error("Meal plan update failed:", error);
      toast({ title: "Failed to update meal plan", variant: "destructive" });
    },
  });

  const weekDays = getWeekDates(currentWeek);
  const currentMeals = mealPlan?.meals || weekDays.map(day => ({ day: day.name, mealId: null }));

  const handleAddMealClick = (dayName: string) => {
    setSelectedDay(dayName);
    setShowMealModal(true);
  };

  const handleMealSelect = async (meal: Meal) => {
    if (!selectedDay) return;

    setIsUpdating(true);
    setShowMealModal(false);
    setSelectedDay(null);

    const updatedMeals = weekDays.map(day => ({
      day: day.name,
      mealId: day.name === selectedDay ? meal.id : 
              mealPlan?.meals.find(m => m.day === day.name)?.mealId || null
    }));

    try {
      if (mealPlan) {
        await updateMealPlanMutation.mutateAsync({ 
          id: mealPlan.id, 
          meals: updatedMeals 
        });
      } else {
        await createMealPlanMutation.mutateAsync({
          weekStartDate: currentWeek,
          meals: updatedMeals
        });
      }
      toast({ title: "Meal added successfully!" });
    } catch (error) {
      toast({ title: "Failed to add meal", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMealClick = (mealId: string) => {
    if (meals && meals.length > 0) {
      const meal = meals.find(m => m.id === mealId);
      if (meal) {
        setSelectedMeal(meal);
        setShowRecipeModal(true);
      }
    }
  };

  const handleMealDelete = async (dayName: string) => {
    if (!mealPlan) return;

    setIsUpdating(true);

    const updatedMeals = mealPlan.meals.map(dayMeal =>
      dayMeal.day === dayName ? { ...dayMeal, mealId: null } : dayMeal
    );

    try {
      await updateMealPlanMutation.mutateAsync({ 
        id: mealPlan.id, 
        meals: updatedMeals 
      });
      toast({ title: "Meal removed successfully!" });
    } catch (error) {
      toast({ title: "Failed to remove meal", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };



  const goToPreviousWeek = () => {
    const newWeek = addWeeks(currentWeek, -1);
    const earliestWeek = addWeeks(getCurrentWeekMonday(), -26);
    if (newWeek >= earliestWeek) {
      setCurrentWeek(newWeek);
      setCookedMeals(new Set()); // Reset cooked status when changing weeks
    }
  };

  const goToNextWeek = () => {
    const newWeek = addWeeks(currentWeek, 1);
    const latestWeek = addWeeks(getCurrentWeekMonday(), 4);
    if (newWeek <= latestWeek) {
      setCurrentWeek(newWeek);
      setCookedMeals(new Set()); // Reset cooked status when changing weeks
    }
  };

  const toggleCookedStatus = (dayName: string, mealId: string) => {
    const cookedKey = `${dayName}-${mealId}`;
    const newCookedMeals = new Set(cookedMeals);

    if (cookedMeals.has(cookedKey)) {
      newCookedMeals.delete(cookedKey);
      toast({ title: "Marked as not cooked" });
    } else {
      newCookedMeals.add(cookedKey);
      toast({ title: "Marked as cooked! 🍽️" });
    }

    setCookedMeals(newCookedMeals);
  };

  const toggleFavoriteStatus = async (mealId: string) => {
    const isFavorite = favoriteMeals.has(mealId);
    try {
      let response;
      if (isFavorite) {
        // Remove from favourites
        response = await fetch(`/api/favourites/${mealId}?userId=default-user`, {
          method: 'DELETE',
        });
      } else {
        // Add to favourites
        response = await fetch('/api/favourites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mealId, userId: 'default-user' }),
        });
      }

      if (response.ok) {
        // Update local state immediately for better UX
        setFavoriteMeals(prev => {
          const newSet = new Set(prev);
          if (isFavorite) {
            newSet.delete(mealId);
          } else {
            newSet.add(mealId);
          }
          localStorage.setItem('favoriteMeals', JSON.stringify([...newSet]));
          return newSet;
        });

        // Invalidate favorites cache across all pages and force refetch
        queryClient.invalidateQueries({ queryKey: ["/api/favourites"] });
        queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
        queryClient.refetchQueries({ queryKey: ["/api/favourites"] });

        toast({
          title: isFavorite ? "Removed from favorites" : "Added to favorites",
        });
      }
    } catch (error) {
      console.error('Error updating favourite:', error);
      toast({ title: "Failed to update favourite", variant: "destructive" });
    }
  };

  // Check if navigation buttons should be disabled
  const isPreviousDisabled = currentWeek <= addWeeks(getCurrentWeekMonday(), -26);
  const isNextDisabled = currentWeek >= addWeeks(getCurrentWeekMonday(), 4);

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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Weekly Meal Plan</h2>
        <div className="flex flex-col sm:flex-flex-row items-start sm:items-center gap-2 sm:gap-4">
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
          <span className="text-sm sm:text-lg font-medium text-slate-800 text-center sm:text-left min-w-0 flex-shrink-0">{formatWeekRange(currentWeek)}</span>
        </div>
      </div>

      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 mb-8">
        {weekDays.map((day) => {
          const dayMeal = currentMeals.find(m => m.day === day.name);
          const meal = dayMeal?.mealId ? meals.find(m => m.id === dayMeal.mealId) : null;

          return (
            <Card key={day.name}>
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-slate-800">{day.name}</h3>
                  <p className="text-sm text-slate-500">{day.date}</p>
                </div>
                <div
                  className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors duration-200 min-h-[120px] flex flex-col justify-center relative"
                  onClick={() => handleAddMealClick(day.name)}
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
                          className={`w-full h-20 object-cover rounded-lg transition-opacity ${
                            cookedMeals.has(`${day.name}-${meal.id}`) ? 'opacity-60' : ''
                          }`}
                        />
                        <h4 className={`font-medium text-sm ${
                          cookedMeals.has(`${day.name}-${meal.id}`) ? 'text-slate-500 line-through' : 'text-slate-800'
                        }`}>
                          {meal.name}
                        </h4>
                        <p className="text-xs text-slate-500">{meal.cookTime}</p>
                      </div>
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          variant={cookedMeals.has(`${day.name}-${meal.id}`) ? "default" : "outline"}
                          className={`w-full text-xs ${
                            cookedMeals.has(`${day.name}-${meal.id}`) 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'hover:bg-green-50 hover:text-green-700 hover:border-green-300'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCookedStatus(day.name, meal.id);
                          }}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          {cookedMeals.has(`${day.name}-${meal.id}`) ? 'Cooked!' : 'Mark Cooked'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`absolute top-1 left-1 h-6 w-6 p-0 z-10 ${
                            favoriteMeals.has(meal.id) 
                              ? 'text-red-500 hover:text-red-600' 
                              : 'text-slate-400 hover:text-red-500'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteStatus(meal.id);
                          }}
                        >
                          <Heart className={`h-4 w-4 ${favoriteMeals.has(meal.id) ? 'fill-current' : ''}`} />
                        </Button>
                      </div>
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