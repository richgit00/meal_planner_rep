import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Save, ShoppingCart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MealSelectionModal } from "@/components/meal-selection-modal";
import { RecipeDetailModal } from "@/components/recipe-detail-modal";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Meal, type MealPlan } from "@shared/schema";

const DAYS_OF_WEEK = [
  { name: "Monday", date: "July 21" },
  { name: "Tuesday", date: "July 22" },
  { name: "Wednesday", date: "July 23" },
  { name: "Thursday", date: "July 24" },
  { name: "Friday", date: "July 25" },
  { name: "Saturday", date: "July 26" },
  { name: "Sunday", date: "July 27" },
];

export default function MealPlan() {
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [currentWeek] = useState("2025-07-21"); // Week starting Monday July 21, 2025

  const { data: meals = [], isLoading: mealsLoading } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
  });

  const { data: mealPlan } = useQuery<MealPlan>({
    queryKey: ["/api/meal-plans", currentWeek],
    retry: false,
  });

  const createMealPlanMutation = useMutation({
    mutationFn: async (newMealPlan: { weekStartDate: string; meals: Array<{ day: string; mealId: string | null }> }) => {
      return await apiRequest("POST", "/api/meal-plans", newMealPlan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({ title: "Meal plan saved successfully!" });
    },
    onError: () => {
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
    onError: () => {
      toast({ title: "Failed to update meal plan", variant: "destructive" });
    },
  });

  const currentMeals = mealPlan?.meals || DAYS_OF_WEEK.map(day => ({ day: day.name, mealId: null }));

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Weekly Meal Planner</h2>
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Week
          </Button>
          <span className="text-lg font-medium text-slate-800">March 11-17, 2024</span>
          <Button variant="outline">
            Next Week
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 mb-8">
        {DAYS_OF_WEEK.map((day) => {
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
                  className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors duration-200 min-h-[120px] flex flex-col justify-center"
                  onClick={() => handleDayClick(day.name)}
                >
                  {meal ? (
                    <div
                      className="space-y-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMealClick(meal.id);
                      }}
                    >
                      <img
                        src={meal.image}
                        alt={meal.name}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <h4 className="font-medium text-slate-800 text-sm">{meal.name}</h4>
                      <p className="text-xs text-slate-500">{meal.cookTime}</p>
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
      <div className="flex justify-center space-x-4">
        <Button onClick={saveMealPlan} disabled={createMealPlanMutation.isPending || updateMealPlanMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save Meal Plan
        </Button>
        <Button variant="outline" className="bg-accent text-white hover:bg-emerald-600">
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
