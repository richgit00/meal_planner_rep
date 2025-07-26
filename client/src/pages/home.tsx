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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Meal Plan Card */}
        <Link href="/meal-plan">
          <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200 hover:border-primary">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="text-primary text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Meal Plan</h3>
                <p className="text-slate-600 text-sm">Plan your weekly meals and view your dining schedule</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Shopping List Card */}
        <Link href="/shopping-list">
          <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200 hover:border-primary">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="text-orange-500 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Shopping List</h3>
                <p className="text-slate-600 text-sm">Auto-generated shopping list based on your meal plan</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Pantry Items Card */}
        <Link href="/pantry">
          <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200 hover:border-primary">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="text-purple-500 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Pantry Items</h3>
                <p className="text-slate-600 text-sm">Manage your pantry staples and essential ingredients</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
