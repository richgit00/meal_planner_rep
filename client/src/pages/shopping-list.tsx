import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Share2, Leaf, Package, Fish, Wheat, Apple, ChefHat, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface ShoppingListItem {
  name: string;
  quantity: string;
  checked: boolean;
}

interface ShoppingListData {
  meatAndFish: ShoppingListItem[];
  vegetables: ShoppingListItem[];
  fruit: ShoppingListItem[];
  seasoning: ShoppingListItem[];
  staples: ShoppingListItem[];
  other: ShoppingListItem[];
  addedPantryItems: ShoppingListItem[];
  summary: {
    totalItems: number;
  };
}

// Helper function to format week range for display
const formatWeekRange = (weekStartDate: string) => {
  const startDate = new Date(weekStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const startMonth = monthNames[startDate.getMonth()];
  const endMonth = monthNames[endDate.getMonth()];
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
};

// Helper functions for week navigation
const addWeeks = (dateString: string, weeks: number) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + (weeks * 7));
  return date.toISOString().split('T')[0];
};

// Helper function to get the current week's Monday
const getCurrentWeekMonday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
};

export default function ShoppingList() {
  const { toast } = useToast();
  const [location] = useLocation();

  // Get week from URL params or default to current week being used in meal planner
  const urlParams = new URLSearchParams(window.location.search);
  const weekFromUrl = urlParams.get('week');
  const [currentWeek, setCurrentWeek] = useState(weekFromUrl || getCurrentWeekMonday());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  
  // Get added pantry items from localStorage or URL params
  const getAddedPantryItems = () => {
    try {
      const stored = localStorage.getItem(`addedPantryItems_${currentWeek}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };
  
  const [addedPantryItems] = useState<string[]>(getAddedPantryItems());

  const { data: shoppingList, isLoading } = useQuery<ShoppingListData>({
    queryKey: ["/api/shopping-list", currentWeek, addedPantryItems],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (addedPantryItems.length > 0) {
        params.append('addedPantryItems', JSON.stringify(addedPantryItems));
      }
      const url = `/api/shopping-list/${currentWeek}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch shopping list');
      }
      return response.json();
    },
    retry: false,
  });

  const handleItemCheck = (itemName: string, checked: boolean) => {
    const newCheckedItems = new Set(checkedItems);
    if (checked) {
      newCheckedItems.add(itemName);
    } else {
      newCheckedItems.delete(itemName);
    }
    setCheckedItems(newCheckedItems);
  };

  const goToPreviousWeek = () => {
    const newWeek = addWeeks(currentWeek, -1);
    const earliestWeek = addWeeks(getCurrentWeekMonday(), -26);
    if (newWeek >= earliestWeek) {
      setCurrentWeek(newWeek);
    }
  };

  const goToNextWeek = () => {
    const newWeek = addWeeks(currentWeek, 1);
    const latestWeek = addWeeks(getCurrentWeekMonday(), 4);
    if (newWeek <= latestWeek) {
      setCurrentWeek(newWeek);
    }
  };

  // Check if navigation buttons should be disabled
  const isPreviousDisabled = currentWeek <= addWeeks(getCurrentWeekMonday(), -26);
  const isNextDisabled = currentWeek >= addWeeks(getCurrentWeekMonday(), 4);

  const handleShareList = async () => {
    if (!shoppingList) return;

    const categories = [
      { name: 'Meat & Fish', items: shoppingList.meatAndFish, icon: '🥩' },
      { name: 'Vegetables', items: shoppingList.vegetables, icon: '🥬' },
      { name: 'Fruit', items: shoppingList.fruit, icon: '🍎' },
      { name: 'Seasoning', items: shoppingList.seasoning, icon: '🧂' },
      { name: 'Staples', items: shoppingList.staples, icon: '🌾' },
      { name: 'Other', items: shoppingList.other, icon: '🛒' },
      { name: 'Added Pantry Items', items: shoppingList.addedPantryItems || [], icon: '📦' },
    ];

    let shareText = `🛒 Shopping List - Week of ${formatWeekRange(currentWeek)}\n\n`;

    categories.forEach(category => {
      if (category.items.length > 0) {
        shareText += `${category.icon} ${category.name}:\n`;
        category.items.forEach(item => {
          const isChecked = checkedItems.has(item.name);
          shareText += `${isChecked ? '✅' : '☐'} ${item.name} - ${item.quantity}\n`;
        });
        shareText += '\n';
      }
    });

    shareText += `📊 Summary: ${shoppingList.summary.totalItems} items`;

    try {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Shopping list copied to clipboard!" });
    } catch (error) {
      toast({ title: "Failed to copy to clipboard", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>Loading shopping list...</div>
      </div>
    );
  }

  if (!shoppingList) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Shopping List</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="outline" onClick={goToPreviousWeek} disabled={isPreviousDisabled} size="sm">
                <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Previous Week</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              <Button variant="outline" onClick={goToNextWeek} disabled={isNextDisabled} size="sm">
                <span className="hidden sm:inline">Next Week</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
              </Button>
            </div>
            <span className="text-sm sm:text-lg font-medium text-slate-800 order-first sm:order-none">{formatWeekRange(currentWeek)}</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-slate-600">No meal plan found for this week. Please create a meal plan first.</p>
        </div>
      </div>
    );
  }

  const CategoryCard = ({ title, items, icon, iconColor }: { 
    title: string; 
    items: ShoppingListItem[]; 
    icon: React.ComponentType<any>; 
    iconColor: string 
  }) => {
    if (items.length === 0) return null;

    const IconComponent = icon;

    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <IconComponent className={`${iconColor} mr-2`} />
            {title}
          </h3>
          <div className="space-y-3">
            {items.map((item: ShoppingListItem, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100">
                <div className="flex items-center">
                  <Checkbox
                    checked={checkedItems.has(item.name)}
                    onCheckedChange={(checked) => handleItemCheck(item.name, checked as boolean)}
                    className="mr-3"
                  />
                  <span
                    className={`${
                      checkedItems.has(item.name)
                        ? "line-through text-slate-500"
                        : "text-slate-800"
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
                <span className="text-slate-500 text-sm">{item.quantity}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Shopping List</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2 sm:space-x-4 order-2 sm:order-1">
            <Button variant="outline" onClick={goToPreviousWeek} disabled={isPreviousDisabled} size="sm">
              <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Previous Week</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            <Button variant="outline" onClick={goToNextWeek} disabled={isNextDisabled} size="sm">
              <span className="hidden sm:inline">Next Week</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
            </Button>
            <Button onClick={handleShareList} size="sm">
              <Share2 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Share List</span>
              <span className="sm:hidden">Share</span>
            </Button>
          </div>
          <span className="text-sm sm:text-lg font-medium text-slate-800 order-1 sm:order-2">{formatWeekRange(currentWeek)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryCard 
          title="Meat & Fish" 
          items={shoppingList.meatAndFish} 
          icon={Fish} 
          iconColor="text-red-600" 
        />
        <CategoryCard 
          title="Vegetables" 
          items={shoppingList.vegetables} 
          icon={Leaf} 
          iconColor="text-green-600" 
        />
        <CategoryCard 
          title="Fruit" 
          items={shoppingList.fruit} 
          icon={Apple} 
          iconColor="text-pink-600" 
        />
        <CategoryCard 
          title="Seasoning" 
          items={shoppingList.seasoning} 
          icon={ChefHat} 
          iconColor="text-purple-600" 
        />
        <CategoryCard 
          title="Staples" 
          items={shoppingList.staples} 
          icon={Wheat} 
          iconColor="text-amber-600" 
        />
        <CategoryCard 
          title="Other" 
          items={shoppingList.other} 
          icon={ShoppingBasket} 
          iconColor="text-gray-600" 
        />
        <CategoryCard 
          title="Added Pantry Items" 
          items={shoppingList.addedPantryItems || []} 
          icon={Package} 
          iconColor="text-blue-600" 
        />
      </div>

      {/* Shopping Summary */}
      <div className="mt-8 bg-slate-100 rounded-xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Shopping Summary</h3>
            <p className="text-slate-600">Generated from your weekly meal plan</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{shoppingList.summary.totalItems} items</div>
            <div className="text-sm text-slate-600">Generated from your weekly meal plan</div>
          </div>
        </div>
      </div>
    </div>
  );
}