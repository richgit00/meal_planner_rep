import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type Meal } from "@shared/schema";

interface MealSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meals: Meal[];
  onSelectMeal: (meal: Meal) => void;
}

export function MealSelectionModal({ open, onOpenChange, meals, onSelectMeal }: MealSelectionModalProps) {
  // Function to determine protein type from meal name and ingredients
  const getProteinType = (meal: Meal): string => {
    const name = meal.name.toLowerCase();
    const ingredientsText = meal.ingredients?.map(ing => ing.name.toLowerCase()).join(' ') || '';
    
    if (name.includes('beef') || ingredientsText.includes('beef') || name.includes('steak') || ingredientsText.includes('steak')) {
      return 'Beef';
    }
    if (name.includes('chicken') || ingredientsText.includes('chicken')) {
      return 'Chicken';
    }
    if (name.includes('pork') || ingredientsText.includes('pork') || name.includes('ham') || ingredientsText.includes('ham')) {
      return 'Pork';
    }
    if (name.includes('salmon') || name.includes('fish') || name.includes('cod') || name.includes('tuna') || 
        ingredientsText.includes('salmon') || ingredientsText.includes('fish') || ingredientsText.includes('cod')) {
      return 'Fish';
    }
    if (name.includes('turkey') || ingredientsText.includes('turkey')) {
      return 'Turkey';
    }
    if (name.includes('lamb') || ingredientsText.includes('lamb')) {
      return 'Lamb';
    }
    if (name.includes('vegetable') || name.includes('vegan') || name.includes('veggie') || 
        (!ingredientsText.includes('chicken') && !ingredientsText.includes('beef') && 
         !ingredientsText.includes('pork') && !ingredientsText.includes('fish') && 
         !ingredientsText.includes('salmon') && !ingredientsText.includes('turkey'))) {
      return 'Vegetarian';
    }
    return 'Other';
  };

  // Group meals by protein type
  const groupedMeals = meals.reduce((groups, meal) => {
    const proteinType = getProteinType(meal);
    if (!groups[proteinType]) {
      groups[proteinType] = [];
    }
    groups[proteinType].push(meal);
    return groups;
  }, {} as Record<string, Meal[]>);

  // Define the order of protein types
  const proteinOrder = ['Beef', 'Chicken', 'Pork', 'Fish', 'Turkey', 'Lamb', 'Vegetarian', 'Other'];
  const sortedGroups = proteinOrder.filter(type => groupedMeals[type]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-slate-800">Choose a Meal</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 p-6 pt-4">
          {sortedGroups.map((proteinType) => (
            <div key={proteinType} className="mb-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-2">
                {proteinType}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedMeals[proteinType].map((meal) => (
                  <div
                    key={meal.id}
                    onClick={() => {
                      onSelectMeal(meal);
                    }}
                    className="meal-option bg-slate-50 rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-primary border-2 border-transparent transition-colours duration-200"
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
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}