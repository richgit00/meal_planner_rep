import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, Share2, Leaf, Package, Fish, Wheat, Apple, ChefHat, ShoppingBasket } from "lucide-react";
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
  summary: {
    totalItems: number;
    estimatedCost: string;
  };
}

export default function ShoppingList() {
  const { toast } = useToast();
  const [currentWeek] = useState("2025-07-21");
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const { data: shoppingList, isLoading } = useQuery<ShoppingListData>({
    queryKey: ["/api/shopping-list", currentWeek],
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

  const handleShareList = async () => {
    if (!shoppingList) return;

    const categories = [
      { name: 'Meat & Fish', items: shoppingList.meatAndFish, icon: '🥩' },
      { name: 'Vegetables', items: shoppingList.vegetables, icon: '🥬' },
      { name: 'Fruit', items: shoppingList.fruit, icon: '🍎' },
      { name: 'Seasoning', items: shoppingList.seasoning, icon: '🧂' },
      { name: 'Staples', items: shoppingList.staples, icon: '🌾' },
      { name: 'Other', items: shoppingList.other, icon: '🛒' },
    ];

    let shareText = '🛒 Shopping List - Week of July 21-27, 2025\n\n';
    
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

    shareText += `📊 Summary: ${shoppingList.summary.totalItems} items • ${shoppingList.summary.estimatedCost}`;

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
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Shopping List</h2>
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
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Shopping List</h2>
        <div className="flex space-x-4">
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print List
          </Button>
          <Button onClick={handleShareList}>
            <Share2 className="h-4 w-4 mr-2" />
            Share List
          </Button>
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
            <div className="text-sm text-slate-600">
              Estimated Cost: <span>{shoppingList.summary.estimatedCost}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}