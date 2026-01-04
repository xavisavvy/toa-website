import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { HelmetProvider } from "react-helmet-async";

import { queryClient } from "./lib/queryClient";

import { useKonamiCode, ChaosGoblinMode } from "@/components/ChaosGoblinMode";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initGA, analytics } from "@/lib/analytics";
import { reportWebVitals } from "@/lib/webVitals";
import { initScrollTracking, initRageClickDetection, initSessionTracking } from "@/lib/userEngagement";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminLogin from "@/pages/AdminLogin";
import AdminOrders from "@/pages/AdminOrders";
import CharacterDetail from "@/pages/CharacterDetail";
import Characters from "@/pages/Characters";
import Checkout from "@/pages/Checkout";
import CheckoutCancel from "@/pages/CheckoutCancel";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import PressKit from "@/pages/PressKit";
import Privacy from "@/pages/Privacy";
import Shop from "@/pages/Shop";
import Sponsors from "@/pages/Sponsors";
import Sponsorship from "@/pages/Sponsorship";
import TermsOfService from "@/pages/TermsOfService";
import TrackOrder from "@/pages/TrackOrder";

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function Analytics() {
  const [location] = useLocation();

  // Initialize Google Analytics and tracking on mount
  useEffect(() => {
    initGA();
    reportWebVitals();
    initScrollTracking();
    initRageClickDetection();
    initSessionTracking();
  }, []);

  // Track page views on route change
  useEffect(() => {
    analytics.pageView(location);
  }, [location]);

  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Analytics />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/characters" component={Characters} />
        <Route path="/characters/:id" component={CharacterDetail} />
        <Route path="/shop" component={Shop} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/sponsorship" component={Sponsorship} />
        <Route path="/sponsors" component={Sponsors} />
        <Route path="/press-kit" component={PressKit} />
        <Route path="/checkout/success" component={CheckoutSuccess} />
        <Route path="/checkout/cancel" component={CheckoutCancel} />
        <Route path="/legal/privacy" component={Privacy} />
        <Route path="/legal/tos" component={TermsOfService} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/orders" component={AdminOrders} />
        
        {/* Customer Order Tracking - Privacy Protected */}
        <Route path="/track-order" component={TrackOrder} />
        
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  const [chaosMode, setChaosMode] = useState(false);

  // Ensure app rehydrates properly when navigating back (e.g., from Stripe)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Force re-render when page becomes visible
        // This helps when navigating back from external sites
        window.dispatchEvent(new Event('cart-updated'));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Activate Chaos Goblin Mode with Konami code
  useKonamiCode(() => {
    setChaosMode(true);
  });

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          
          {/* Chaos Goblin Mode Easter Egg */}
          <ChaosGoblinMode 
            active={chaosMode} 
            onComplete={() => setChaosMode(false)} 
          />
          
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
