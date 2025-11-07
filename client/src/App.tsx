import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Workflows from "@/pages/workflows";
import VisualWorkflow from "@/pages/visual-workflow";
import { TransactionDetails } from "@/pages/transaction-details";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/workflows" component={Workflows} />
      <Route path="/visual" component={VisualWorkflow} />
      <Route path="/transaction" component={TransactionDetails} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
