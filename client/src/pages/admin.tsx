import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertMealSchema, type Meal, type InsertMeal } from "@shared/schema";
import { z } from "zod";

const mealFormSchema = insertMealSchema.extend({
  ingredientsText: z.string().min(1, "Ingredients are required"),
  instructionsText: z.string().min(1, "Instructions are required"),
});

type MealFormData = z.infer<typeof mealFormSchema>;

export default function Admin() {
  const { toast } = useToast();
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [showMealDialog, setShowMealDialog] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");

  const { data: meals = [], isLoading } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
  });

  const form = useForm<MealFormData>({
    resolver: zodResolver(mealFormSchema),
    defaultValues: {
      name: "",
      description: "",
      cookTime: "",
      difficulty: "Easy",
      servings: 4,
      image: "",
      ingredientsText: "",
      instructionsText: "",
    },
  });

  const handleCloseDialog = () => {
    console.log("Closing dialog...");
    setShowMealDialog(false);
    setEditingMeal(null);
    
    // Use setTimeout to ensure state updates properly
    setTimeout(() => {
      form.reset({
        name: "",
        description: "",
        cookTime: "",
        difficulty: "Easy",
        servings: 4,
        image: "",
        ingredientsText: "",
        instructionsText: "",
      });
    }, 100);
  };

  const createMealMutation = useMutation({
    mutationFn: async (mealData: InsertMeal) => {
      const result = await apiRequest("POST", "/api/meals", mealData);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: "Meal created successfully!" });
    },
    onError: (error: any) => {
      console.error("Create meal error:", error);
      toast({ title: "Failed to create meal", variant: "destructive" });
    },
  });

  const updateMealMutation = useMutation({
    mutationFn: async ({ id, ...mealData }: { id: string } & Partial<InsertMeal>) => {
      const result = await apiRequest("PUT", `/api/meals/${id}`, mealData);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: "Meal updated successfully!" });
    },
    onError: (error: any) => {
      console.error("Update meal error:", error);
      toast({ 
        title: "Failed to update meal", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting meal with ID:", id);
      return await apiRequest("DELETE", `/api/meals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: "Meal deleted successfully!" });
    },
    onError: (error: any) => {
      console.error("Delete meal failed:", error);
      toast({ 
        title: "Failed to delete meal", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (meals: InsertMeal[]) => {
      return await apiRequest("POST", "/api/meals/bulk-import", { meals });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: `Successfully imported ${data.imported} out of ${data.total} meals!` });
      setBulkImportText("");
    },
    onError: () => {
      toast({ title: "Failed to import meals", variant: "destructive" });
    },
  });

  const parseIngredientsText = (text: string) => {
    return text.split('\n').filter(line => line.trim()).map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        name: parts[0] || line,
        amount: parts[1] || "1 unit",
        category: (parts[2] === "pantry" ? "pantry" : "fresh") as "fresh" | "pantry"
      };
    });
  };

  const parseInstructionsText = (text: string) => {
    return text.split('\n').filter(line => line.trim());
  };

  const formatIngredientsText = (ingredients: Array<{ name: string; amount: string; category: "fresh" | "pantry" }>) => {
    return ingredients.map(ing => `${ing.name} | ${ing.amount} | ${ing.category}`).join('\n');
  };

  const formatInstructionsText = (instructions: string[]) => {
    return instructions.join('\n');
  };

  const onSubmit = (data: MealFormData) => {
    console.log("Form submitted with data:", data);
    
    try {
      const ingredients = parseIngredientsText(data.ingredientsText);
      const instructions = parseInstructionsText(data.instructionsText);

      const mealData: InsertMeal = {
        name: data.name,
        description: data.description,
        cookTime: data.cookTime,
        difficulty: data.difficulty,
        servings: data.servings,
        image: data.image,
        ingredients,
        instructions,
      };

      console.log("Submitting meal data:", mealData);
      
      if (editingMeal) {
        console.log("Updating meal with ID:", editingMeal.id);
        updateMealMutation.mutate({ id: editingMeal.id, ...mealData });
      } else {
        console.log("Creating new meal");
        createMealMutation.mutate(mealData);
      }
      
      // Close dialog after successful submission
      handleCloseDialog();
      
    } catch (error) {
      console.error("Form submission error:", error);
      toast({ 
        title: "Form validation failed", 
        description: "Please check your inputs and try again",
        variant: "destructive" 
      });
    }
  };

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    form.reset({
      name: meal.name,
      description: meal.description,
      cookTime: meal.cookTime,
      difficulty: meal.difficulty,
      servings: meal.servings,
      image: meal.image,
      ingredientsText: formatIngredientsText(meal.ingredients),
      instructionsText: formatInstructionsText(meal.instructions),
    });
    setShowMealDialog(true);
  };

  const handleBulkImport = () => {
    try {
      const mealsData = JSON.parse(bulkImportText);
      if (Array.isArray(mealsData)) {
        bulkImportMutation.mutate(mealsData);
      } else {
        toast({ title: "Invalid format. Expected JSON array of meals.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Invalid JSON format", variant: "destructive" });
    }
  };

  const totalMeals = meals?.length ?? 0;


  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>Loading meals...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Weekly Meal Plan</h2>
        <div className="flex space-x-4">
          <Dialog open={showMealDialog} onOpenChange={setShowMealDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingMeal(null); form.reset(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Meal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingMeal ? "Edit Meal" : "Add New Meal"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cookTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cook Time</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 30 mins" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Easy">Easy</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="servings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Servings</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="ingredientsText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ingredients (one per line: "name | amount | category")</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Chicken breast | 2 lbs | fresh&#10;Salt | 1 tsp | pantry"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instructionsText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructions (one per line)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Preheat oven to 350°F&#10;Season chicken with salt and pepper&#10;Bake for 25 minutes"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMealMutation.isPending || updateMealMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      {editingMeal ? "Save Changes" : "Save Meal"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meals && meals.map((meal) => (
          <Card key={meal.id}>
            <CardHeader className="pb-2">
              <img
                src={meal.image}
                alt={meal.name}
                className="w-full h-48 object-cover rounded-lg mb-2"
              />
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{meal.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(meal)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${meal.name}"? This action cannot be undone.`)) {
                        deleteMealMutation.mutate(meal.id);
                      }
                    }}
                    disabled={deleteMealMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-3">{meal.description}</p>
              <div className="flex justify-between items-center mb-3">
                <Badge variant="outline">{meal.difficulty}</Badge>
                <span className="text-sm text-slate-500">{meal.cookTime}</span>
              </div>
              <div className="text-sm text-slate-600">
                <strong>Servings:</strong> {meal.servings}<br />
                <strong>Ingredients:</strong> {meal.ingredients?.length || 0}<br />
                <strong>Steps:</strong> {meal.instructions?.length || 0}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


    </div>
  );
}