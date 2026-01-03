import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { analytics } from "@/lib/analytics";
import { getCheckoutSession } from "@/lib/stripe";
import { clearZipCode } from "@/lib/zipCode";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear PII data after successful checkout
    clearZipCode();

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      setLocation('/');
      return;
    }

    getCheckoutSession(sessionId)
      .then(data => {
        setSession(data);
        setLoading(false);
        
        // Track successful purchase
        if (data) {
          const totalAmount = data.amount_total ? data.amount_total / 100 : 0;
          analytics.purchase(
            sessionId,
            totalAmount,
            data.line_items?.map((item: any) => item.description) || []
          );
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-6">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading order details...</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-primary/20">
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
                
                <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
                  Order Confirmed!
                </h1>
                
                <p className="text-lg text-muted-foreground mb-6">
                  Thank you for your purchase! Your order has been received and will be processed shortly.
                </p>

                {session?.customer_email && (
                  <div className="bg-muted/50 rounded-lg p-6 mb-6">
                    <p className="text-sm text-muted-foreground mb-2">
                      Confirmation sent to:
                    </p>
                    <p className="font-semibold">{session.customer_email}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    We'll send you an email with tracking information once your order ships.
                  </p>
                  
                  <p className="text-sm text-muted-foreground">
                    Orders typically ship within 2-7 business days.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                  <Button 
                    size="lg"
                    onClick={() => setLocation('/')}
                  >
                    Return to Homepage
                  </Button>
                  
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => setLocation('/shop')}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
