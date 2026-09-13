import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home.jsx";

function Router() {
  return (
    <Switch>
      <Route path="/school/georgetown/:courseId" component={Home} />
      <Route path="/school/georgetown" component={Home} />
      <Route path="/school/masters" component={Home} />
      <Route path="/school" component={Home} />
      <Route path="/health/fitness" component={Home} />
      <Route path="/health/sleep" component={Home} />
      <Route path="/health/disease" component={Home} />
      <Route path="/health" component={Home} />
      <Route path="/workouts" component={Home} />
      <Route path="/fitness" component={Home} />
      <Route path="/finance/insights" component={Home} />
      <Route path="/finance/income" component={Home} />
      <Route path="/finance/debts" component={Home} />
      <Route path="/finance" component={Home} />
      <Route path="/work" component={Home} />
      <Route path="/relationships/family" component={Home} />
      <Route path="/relationships/friends" component={Home} />
      <Route path="/relationships/other" component={Home} />
      <Route path="/relationships" component={Home} />
      <Route path="/people" component={Home} />
      <Route path="/calendar" component={Home} />
      <Route path="/today" component={Home} />
      <Route path="/matrix" component={Home} />
      <Route path="/eisenhower" component={Home} />
      <Route path="/dashboard" component={Home} />
      <Route path="/" component={Home} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={Home} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
