
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Heart, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecipeDetailModal } from "@/components/recipe-detail-modal";
import { type Meal } from "@shared/schema";

export default function Favourites() {
  const [location, setLocation] = useLocation();
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [favouriteMeals, setFavouriteMeals] = useState<Set<string>>(new Set());

  const { data: meals = [], isLoading } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
  });

  const favouriteMealsList = meals.filter(meal => favouriteMeals.has(meal.id));

  const handleMealClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setShowRecipeModal(true);
  };

  const toggleFavouriteStatus = (mealId: string) => {
    const newFavouriteMeals = new Set(favouriteMeals);
    
    if (favouriteMeals.has(mealId)) {
      newFavouriteMeals.delete(mealId);
    } else {
      newFavouriteMeals.add(mealId);
    }
    
    setFavouriteMeals(newFavouriteMeals);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading your favourite meals...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Your Favourite Meals</h2>
        <Button variant="outline" onClick={() => setLocation("/meal-plan")}>
          Back to Meal Plan
        </Button>
      </div>

      {favouriteMealsList.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="mx-auto h-24 w-24 text-slate-300 mb-4" />
          <h3 className="text-xl font-medium text-slate-700 mb-2">No favourites yet</h3>
          <p className="text-slate-500 mb-4">
            Add meals to your favourites from the meal planning page to see them here.
          </p>
          <Button onClick={() => setLocation("/meal-plan")}>
            Go to Meal Plan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favouriteMealsList.map((meal) => (
            <Card key={meal.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <img
                  src={meal.image}
                  alt={meal.name}
                  className="w-full h-48 object-cover rounded-lg mb-2"
                  onClick={() => handleMealClick(meal)}
                />
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{meal.name}</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-red-500 hover:bg-red-600 text-white border-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavouriteStatus(meal.id);
                    }}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent onClick={() => handleMealClick(meal)}>
                <p className="text-sm text-slate-600 mb-3">{meal.description}</p>
                <div className="flex justify-between items-center mb-3">
                  <Badge variant="outline">{meal.difficulty}</Badge>
                  <div className="flex items-center space-x-3 text-sm text-slate-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {meal.cookTime}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {meal.servings}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-slate-600">
                  <strong>Ingredients:</strong> {meal.ingredients?.length || 0}<br />
                  <strong>Steps:</strong> {meal.instructions?.length || 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RecipeDetailModal
        open={showRecipeModal}
        onOpenChange={setShowRecipeModal}
        meal={selectedMeal}
      />
    </div>
  );
}
