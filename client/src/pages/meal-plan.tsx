
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MealSelectionModal from "@/components/meal-selection-modal";

interface Meal {
  id: string;
  name: string;
  description: string;
  cookTime: string;
  difficulty: string;
  servings: number;
  image: string;
}

interface DayMeal {
  day: string;
  mealId: string | null;
}

interface MealPlan {
  id: string;
  weekStartDate: string;
  meals: DayMeal[];
}

const weekDays = [
  { name: "Monday", short: "Mon" },
  { name: "Tuesday", short: "Tue" },
  { name: "Wednesday", short: "Wed" },
  { name: "Thursday", short: "Thu" },
  { name: "Friday", short: "Fri" },
  { name: "Saturday", short: "Sat" },
  { name: "Sunday", short: "Sun" },
];

function formatWeekStart(date: Date): string {
  const monday = new Date(date);
  const dayOfWeek = monday.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(monday.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

export default function MealPlan() {
  const [currentWeek, setCurrentWeek] = useState(() => formatWeekStart(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch meals
  const { data: meals = [], isLoading: mealsLoading } = useQuery({
    queryKey: ["meals"],
    queryFn: async () => {
      const response = await fetch("/api/meals");
      if (!response.ok) throw new Error("Failed to fetch meals");
      return response.json();
    },
  });

  // Fetch meal plan
  const { data: mealPlan, isLoading: planLoading } = useQuery({
    queryKey: ["meal-plan", currentWeek],
    queryFn: async () => {
      const response = await fetch(`/api/meal-plans?weekStartDate=${currentWeek}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch meal plan");
      }
      return response.json();
    },
  });

  // Create meal plan mutation
  const createMealPlanMutation = useMutation({
    mutationFn: async (data: { weekStartDate: string; meals: DayMeal[] }) => {
      const response = await fetch("/api/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create meal plan");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-plan", currentWeek] });
    },
  });

  // Update meal plan mutation
  const updateMealPlanMutation = useMutation({
    mutationFn: async (data: { id: string; meals: DayMeal[] }) => {
      const response = await fetch(`/api/meal-plans/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meals: data.meals }),
      });
      if (!response.ok) throw new Error("Failed to update meal plan");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-plan", currentWeek] });
    },
  });

  const currentMeals = useMemo(() => {
    if (mealPlan?.meals) {
      return mealPlan.meals;
    }
    return weekDays.map(day => ({ day: day.name, mealId: null }));
  }, [mealPlan]);

  const handleAddMeal = (dayName: string) => {
    setSelectedDay(dayName);
    setIsModalOpen(true);
  };

  const handleMealSelect = async (mealId: string) => {
    if (!selectedDay) return;

    const updatedMeals = weekDays.map(day => {
      if (day.name === selectedDay) {
        return { day: day.name, mealId };
      }
      const existing = currentMeals.find(m => m.day === day.name);
      return { day: day.name, mealId: existing?.mealId || null };
    });

    try {
      if (mealPlan) {
        await updateMealPlanMutation.mutateAsync({
          id: mealPlan.id,
          meals: updatedMeals,
        });
      } else {
        await createMealPlanMutation.mutateAsync({
          weekStartDate: currentWeek,
          meals: updatedMeals,
        });
      }
      toast({ title: "Meal added successfully!" });
    } catch (error) {
      toast({ 
        title: "Failed to add meal", 
        variant: "destructive" 
      });
    }

    setIsModalOpen(false);
    setSelectedDay(null);
  };

  const handleMealDelete = async (dayName: string) => {
    if (!mealPlan) return;

    const updatedMeals = weekDays.map(day => {
      if (day.name === dayName) {
        return { day: day.name, mealId: null };
      }
      const existing = currentMeals.find(m => m.day === day.name);
      return { day: day.name, mealId: existing?.mealId || null };
    });

    try {
      await updateMealPlanMutation.mutateAsync({
        id: mealPlan.id,
        meals: updatedMeals,
      });
      toast({ title: "Meal removed successfully!" });
    } catch (error) {
      toast({ 
        title: "Failed to remove meal", 
        variant: "destructive" 
      });
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const current = new Date(currentWeek);
    current.setDate(current.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(formatWeekStart(current));
  };

  const getMealForDay = (dayName: string): Meal | null => {
    const dayMeal = currentMeals.find(m => m.day === dayName);
    if (!dayMeal?.mealId) return null;
    return meals.find(m => m.id === dayMeal.mealId) || null;
  };

  const formatWeekDisplay = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    return `${start.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric" 
    })} - ${end.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    })}`;
  };

  if (mealsLoading || planLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Weekly Meal Plan</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigateWeek("prev")}>
            Previous Week
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{formatWeekDisplay(currentWeek)}</span>
          </div>
          <Button variant="outline" onClick={() => navigateWeek("next")}>
            Next Week
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const meal = getMealForDay(day.name);
          
          return (
            <Card key={day.name} className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-center">{day.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {meal ? (
                  <div className="space-y-3">
                    <img
                      src={meal.image}
                      alt={meal.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div>
                      <h4 className="font-medium text-sm">{meal.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {meal.cookTime} • {meal.difficulty}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleMealDelete(day.name)}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">No meal planned</span>
                    </div>
                    <Button
                      onClick={() => handleAddMeal(day.name)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Meal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <MealSelectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDay(null);
        }}
        onSelectMeal={handleMealSelect}
        meals={meals}
      />
    </div>
  );
}
