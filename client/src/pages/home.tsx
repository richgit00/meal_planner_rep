
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Heart, ShoppingCart, Package } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { type MealPlan } from "@shared/schema";

export default function Home() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-3 sm:mb-4 px-2">Weekly Meal Planner</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 max-w-7xl mx-auto">
        {/* Meal Plan Card */}
        <Link href="/meal-plan">
          <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200 hover:border-primary active:scale-95 transition-transform">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <CalendarDays className="text-blue-500 text-xl sm:text-2xl" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">Meal Plan</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">Plan your weekly meals and view your schedule</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Shopping List Card */}
        <Link href="/shopping-list">
          <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200 hover:border-primary active:scale-95 transition-transform">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <ShoppingCart className="text-orange-500 text-xl sm:text-2xl" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">Shopping List</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">Auto-generated shopping list based on your meal plan</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Pantry Card */}
        <Link href="/pantry">
          <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200 hover:border-primary active:scale-95 transition-transform">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Package className="text-green-500 text-xl sm:text-2xl" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">Pantry</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">View required pantry items and add to shopping list</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Favourites Card */}
        <Link href="/favourites">
          <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200 hover:border-primary active:scale-95 transition-transform">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Heart className="text-red-500 text-xl sm:text-2xl" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">Favourites</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">View your favourite meals</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Admin Card */}
        <Link href="/admin">
          <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200 hover:border-primary active:scale-95 transition-transform">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Package className="text-purple-500 text-xl sm:text-2xl" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">Admin</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">Edit and add meals</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
