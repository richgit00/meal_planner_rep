import { Router as WouterRouter, Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import Home from "@/pages/home";
import MealPlan from "@/pages/meal-plan";
import ShoppingList from "@/pages/shopping-list";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter>
          <div className="min-h-screen bg-slate-50">
            <Header />
            <main>
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/meal-plan" component={MealPlan} />
                <Route path="/shopping-list" component={ShoppingList} />
                <Route path="/admin" component={Admin} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;