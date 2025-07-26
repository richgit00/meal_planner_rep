import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Users, Star } from "lucide-react";
import { type Meal } from "@shared/schema";

interface RecipeDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: Meal | null;
}

export function RecipeDetailModal({ open, onOpenChange, meal }: RecipeDetailModalProps) {
  if (!meal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-slate-800">{meal.name}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[80vh]">
          <div className="p-6">
            {/* Recipe Header */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <img
                  src={meal.image}
                  alt={meal.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <div>
                <div className="flex items-center space-x-6 mb-4">
                  <div className="text-center">
                    <Clock className="text-primary text-xl mb-1 mx-auto" />
                    <div className="text-sm font-medium text-slate-800">{meal.cookTime}</div>
                    <div className="text-xs text-slate-500">Cook Time</div>
                  </div>
                  <div className="text-center">
                    <Users className="text-primary text-xl mb-1 mx-auto" />
                    <div className="text-sm font-medium text-slate-800">{meal.servings} servings</div>
                    <div className="text-xs text-slate-500">Servings</div>
                  </div>
                  <div className="text-center">
                    <Star className="text-primary text-xl mb-1 mx-auto" />
                    <div className="text-sm font-medium text-slate-800">{meal.difficulty}</div>
                    <div className="text-xs text-slate-500">Difficulty</div>
                  </div>
                </div>
                <p className="text-slate-600 mb-4">{meal.description}</p>
              </div>
            </div>

            {/* Ingredients and Instructions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-slate-800 mb-4">Ingredients</h4>
                <div className="space-y-2">
                  {meal.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600 w-20 text-sm">{ingredient.amount}</span>
                      <span className="text-slate-800">{ingredient.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-slate-800 mb-4">Instructions</h4>
                <div className="space-y-4">
                  {meal.instructions.map((step, index) => (
                    <div key={index} className="flex">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </div>
                      <p className="text-slate-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
