// this is new
import { Router as WouterRouter, Switch, Route } from "wouter";
//import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import Home from "@/pages/home";
import MealPlan from "@/pages/meal-plan";
import ShoppingList from "@/pages/shopping-list";
import Pantry from "@/pages/pantry";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} exact />
      <Route path="/meal-plan" component={MealPlan} />
      <Route path="/shopping-list" component={ShoppingList} />
      <Route path="/pantry" component={Pantry} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

// this is new
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base="/">
          <div className="min-h-screen bg-slate-50">
            <Header />
            <main>
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/meal-plan" component={MealPlan} />
                <Route path="/shopping-list" component={ShoppingList} />
                <Route path="/pantry" component={Pantry} />
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





/*function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-slate-50">
          <Header />
          <main>
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}*/

export default App;