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
    
    // Check meal name first (more reliable)
    if (name.includes('beef') || name.includes('steak') || name.includes('mince') || name.includes('ground beef')) {
      return 'Beef';
    }
    if (name.includes('chicken') || name.includes('chook')) {
      return 'Chicken';
    }
    if (name.includes('pork') || name.includes('ham') || name.includes('bacon') || name.includes('sausage')) {
      return 'Pork';
    }
    if (name.includes('salmon') || name.includes('fish') || name.includes('cod') || name.includes('tuna') || 
        name.includes('seafood') || name.includes('prawn') || name.includes('barramundi')) {
      return 'Fish';
    }
    if (name.includes('turkey')) {
      return 'Turkey';
    }
    if (name.includes('lamb') || name.includes('mutton')) {
      return 'Lamb';
    }
    if (name.includes('vegetable') || name.includes('vegan') || name.includes('veggie') || 
        name.includes('mushroom') || name.includes('tofu') || name.includes('lentil') || name.includes('bean')) {
      return 'Vegetarian';
    }
    
    // Fall back to ingredients only if name doesn't give clear indication
    if (ingredientsText.includes('beef') || ingredientsText.includes('steak') || ingredientsText.includes('mince')) {
      return 'Beef';
    }
    if (ingredientsText.includes('chicken')) {
      return 'Chicken';
    }
    if (ingredientsText.includes('pork') || ingredientsText.includes('ham') || ingredientsText.includes('bacon')) {
      return 'Pork';
    }
    if (ingredientsText.includes('salmon') || ingredientsText.includes('fish') || ingredientsText.includes('cod') || 
        ingredientsText.includes('tuna') || ingredientsText.includes('seafood')) {
      return 'Fish';
    }
    if (ingredientsText.includes('turkey')) {
      return 'Turkey';
    }
    if (ingredientsText.includes('lamb')) {
      return 'Lamb';
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
              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-2" style={{ minWidth: 'max-content' }}>
                  {groupedMeals[proteinType].map((meal) => (
                    <div
                      key={meal.id}
                      onClick={() => {
                        onSelectMeal(meal);
                        onOpenChange(false);
                      }}
                      className="meal-option bg-slate-50 rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-primary border-2 border-transparent transition-colors duration-200 flex-shrink-0"
                      style={{ width: '280px' }}
                    >
                      <img
                        src={meal.image}
                        alt={meal.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h4 className="font-medium text-slate-800 mb-1 truncate">{meal.name}</h4>
                      <p className="text-sm text-slate-500 mb-2 overflow-hidden" style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>{meal.description}</p>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>{meal.cookTime}</span>
                        <span>{meal.difficulty}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}