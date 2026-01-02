import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function CheckoutCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <Card className="border-2 border-muted">
            <CardContent className="p-12 text-center">
              <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              
              <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
                Checkout Cancelled
              </h1>
              
              <p className="text-lg text-muted-foreground mb-6">
                Your order was cancelled. No charges were made.
              </p>

              <p className="text-sm text-muted-foreground mb-8">
                If you experienced any issues during checkout, please contact us and we'll be happy to help.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  onClick={() => setLocation('/shop')}
                >
                  Return to Shop
                </Button>
                
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation('/')}
                >
                  Go to Homepage
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
