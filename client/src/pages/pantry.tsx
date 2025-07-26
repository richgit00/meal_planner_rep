import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type PantryItem } from "@shared/schema";

export default function Pantry() {
  const { toast } = useToast();

  const { data: pantryItems = [], isLoading } = useQuery<PantryItem[]>({
    queryKey: ["/api/pantry-items"],
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PUT", `/api/pantry-items/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pantry-items"] });
      toast({ title: "Pantry item updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update pantry item", variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "bg-accent";
      case "low-stock":
        return "bg-yellow-500";
      case "out-of-stock":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "in-stock":
        return "secondary";
      case "low-stock":
        return "outline";
      case "out-of-stock":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "in-stock":
        return "In Stock";
      case "low-stock":
        return "Low Stock";
      case "out-of-stock":
        return "Out of Stock";
      default:
        return status;
    }
  };

  const categorizedItems = pantryItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PantryItem[]>);

  const statusCounts = pantryItems.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>Loading pantry items...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Weekly Meal Plan</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {Object.entries(categorizedItems).map(([category, items]) => (
          <Card key={category}>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 flex items-center">
                {category === "Spices & Seasonings" && "🌶️"}
                {category === "Cooking Essentials" && "🫒"}
                {category === "Pantry Staples" && "🍞"}
                <span className="ml-2">{category}</span>
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-slate-800 text-sm sm:text-base truncate">{item.name}</span>
                      <div className="flex items-center mt-1">
                        <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${getStatusColor(item.status)}`}></div>
                        <span className="text-xs sm:text-sm text-slate-600 capitalize truncate">{getStatusText(item.status).replace('-', ' ')}</span>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(item.status)} className="text-xs">
                      {getStatusText(item.status)}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2 flex-shrink-0 min-h-[32px] text-xs sm:text-sm"
                      onClick={() => {
                        // setSelectedItem(item);
                        // setEditModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pantry Summary */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Pantry Status</h3>
            <p className="text-slate-600">Keep track of your essential cooking ingredients</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-accent">{statusCounts["in-stock"] || 0}</div>
              <div className="text-xs text-slate-600">In Stock</div>
            </div>
            <div>
              <div className="text-xl font-bold text-yellow-600">{statusCounts["low-stock"] || 0}</div>
              <div className="text-xs text-slate-600">Low Stock</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-500">{statusCounts["out-of-stock"] || 0}</div>
              <div className="text-xs text-slate-600">Out of Stock</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}