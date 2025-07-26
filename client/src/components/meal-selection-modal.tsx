import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type Meal } from "@shared/schema";

interface MealSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meals: Meal[];
  onSelectMeal: (meal: Meal) => void;
}

export function MealSelectionModal({ open, onOpenChange, meals, onSelectMeal }: MealSelectionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800">Choose a Meal</DialogTitle>
        </DialogHeader>
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meals.map((meal) => (
              <div
                key={meal.id}
                onClick={() => {
                  onSelectMeal(meal);
                  onOpenChange(false);
                }}
                className="meal-option bg-slate-50 rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-primary border-2 border-transparent transition-colors duration-200"
              >
                <img
                  src={meal.image}
                  alt={meal.name}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <h4 className="font-medium text-slate-800 mb-1">{meal.name}</h4>
                <p className="text-sm text-slate-500 mb-2">{meal.description}</p>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>{meal.cookTime}</span>
                  <span>{meal.difficulty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
