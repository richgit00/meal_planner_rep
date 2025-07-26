import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle, ShoppingCart, Package } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { type MealPlan } from "@shared/schema";

export default function Home() {
  const { data: mealPlans } = useQuery<MealPlan[]>({
    queryKey: ["/api/meal-plans"],
  });

  // Get current week's meal plan
  const currentWeek = new Date().toISOString().split('T')[0];
  const currentMealPlan = mealPlans?.find(plan => plan.weekStartDate === currentWeek);
  const mealsPlanned = currentMealPlan?.meals.filter(day => day.mealId).length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Weekly Meal Plan</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Organise your weekly meals, generate shopping lists automatically, and keep track of your pantry essentials.
        </p>
      </div>

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
        <Link href="/meal-plan">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-3 sm:p-4 md:p-6 text-center">
              <CalendarDays className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto text-primary mb-2 sm:mb-3 md:mb-4" />
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 mb-1 sm:mb-2">Meal Plan</h3>
              <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">Plan your weekly meals</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/shopping-list">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-3 sm:p-4 md:p-6 text-center">
              <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto text-accent mb-2 sm:mb-3 md:mb-4" />
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 mb-1 sm:mb-2">Shopping List</h3>
              <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">Generated from your meal plan</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/pantry">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-3 sm:p-4 md:p-6 text-center">
              <Package className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto text-orange-500 mb-2 sm:mb-3 md:mb-4" />
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 mb-1 sm:mb-2">Pantry</h3>
              <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">Track what you have at home</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-3 sm:p-4 md:p-6 text-center">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto text-red-500 mb-2 sm:mb-3 md:mb-4" />
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 mb-1 sm:mb-2">Manage Recipes</h3>
              <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">Add and edit your recipes</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}