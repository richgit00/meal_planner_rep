import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Upload, Download, Save, Users } from "lucide-react";
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
  const [selectedRecipe, setSelectedRecipe] = useState<Meal | null>(null);

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

  const createMealMutation = useMutation({
    mutationFn: async (mealData: InsertMeal) => {
      return await apiRequest("POST", "/api/meals", mealData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: "Meal created successfully!" });
      setShowMealDialog(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create meal", variant: "destructive" });
    },
  });

  const updateMealMutation = useMutation({
    mutationFn: async ({ id, ...mealData }: { id: string } & Partial<InsertMeal>) => {
      return await apiRequest("PUT", `/api/meals/${id}`, mealData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: "Meal updated successfully!" });
      setShowMealDialog(false);
      setEditingMeal(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update meal", variant: "destructive" });
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/meals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: "Meal deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete meal", variant: "destructive" });
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

    if (editingMeal) {
      updateMealMutation.mutate({ id: editingMeal.id, ...mealData });
    } else {
      createMealMutation.mutate(mealData);
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

  const deleteMeal = (id: string) => {
    deleteMealMutation.mutate(id);
  };

  const exportMeals = () => {
    const dataStr = JSON.stringify(meals, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'meals.json';
    link.click();
    URL.revokeObjectURL(url);
  };

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
          <Button onClick={exportMeals} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Meals
          </Button>

          {/*
          <Button onClick={importMeals} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Meals
          </Button>
          */}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Import Meals</DialogTitle>
              </DialogHeader>
              <Textarea
                placeholder="Paste JSON array of meals here"
                className="min-h-[200px]"
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
              />
              <div className="flex justify-end space-x-2 mt-4">
                <Button type="button" variant="secondary" onClick={() => setBulkImportText("")}>
                  Clear
                </Button>
                <Button type="button" onClick={handleBulkImport}>
                  Import
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
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
                    <Button type="button" variant="outline" onClick={() => setShowMealDialog(false)}>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {meals?.map((meal) => (
          <Card key={meal.id} className="overflow-hidden">
            <div 
              className="h-32 sm:h-40 md:h-48 w-full bg-cover bg-center cursor-pointer"
              style={{ backgroundImage: `url(${meal.image})` }}
              onClick={() => setSelectedRecipe(meal)}
            />
            <CardContent className="p-3 sm:p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base md:text-lg flex-1 pr-2 line-clamp-2">{meal.name}</h3>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[32px] p-2"
                    onClick={() => handleEdit(meal)}
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="min-h-[32px] p-2"
                    onClick={() => deleteMeal(meal.id)}
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm mb-3 line-clamp-2">{meal.description}</p>
              <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                <span>{meal.cookTime}</span>
                <span>{meal.difficulty}</span>
              </div>
              <div className="text-sm text-slate-600">
                <strong>Servings:</strong> {meal.servings}<br />
                <strong>Ingredients:</strong> {meal.ingredients?.length || 0}<br />
                <strong>Steps:</strong> {meal.instructions?.length || 0}
              </div>
            </CardContent>
          </Card>
        ))}</div>

      {selectedRecipe && (
        <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedRecipe.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="aspect-video w-full bg-cover bg-center rounded-lg" 
                   style={{ backgroundImage: `url(${selectedRecipe.image})` }} />
              <p className="text-slate-600">{selectedRecipe.description}</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><strong>Cook Time:</strong> {selectedRecipe.cookTime}</div>
                <div><strong>Difficulty:</strong> {selectedRecipe.difficulty}</div>
                <div><strong>Servings:</strong> {selectedRecipe.servings}</div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Ingredients:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedRecipe.ingredients?.map((ing, index) => (
                    <li key={index} className="text-sm">{ing.amount} {ing.name}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  {selectedRecipe.instructions?.map((step, index) => (
                    <li key={index} className="text-sm">{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>


    </div>
  );
}