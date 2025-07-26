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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-[70vh] sm:max-h-96 overflow-y-auto">
          {meals?.map((meal) => (
            <Card
              key={meal.id}
              className="cursor-pointer hover:shadow-lg transition-shadow active:scale-95 transition-transform"
              onClick={() => {
                onSelectMeal(meal.id);
                onClose();
              }}
            >
              <div className="relative">
                <img
                  src={meal.image}
                  alt={meal.name}
                  className="w-full h-24 sm:h-28 md:h-32 object-cover rounded-t-lg"
                />
              </div>
              <CardContent className="p-3 sm:p-4">
                <h3 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base line-clamp-1">{meal.name}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-2 line-clamp-2">{meal.description}</p>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{meal.cookTime}</span>
                  <span>{meal.difficulty}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
}