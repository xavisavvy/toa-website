import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import PrintfulShop from "@/components/PrintfulShop";
import SEO from "@/components/SEO";

export default function Shop() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Official Merchandise - Tales of Aneria"
        description="Shop exclusive Tales of Aneria merchandise. High-quality apparel, accessories, and collectibles featuring your favorite characters and moments from our TTRPG adventures."
        canonical="https://talesofaneria.com/shop"
        keywords="Tales of Aneria merchandise, TTRPG merch, D&D apparel, fantasy merchandise, Aneria shop"
      />
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 lg:py-32 bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold mb-6" data-testid="text-shop-title">
                Official Merchandise
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-shop-description">
                Explore our exclusive collection of Tales of Aneria merchandise. From apparel featuring your favorite characters to collectibles that celebrate our epic adventures, each item helps support the show and brings the world of Aneria into your everyday life.
              </p>
            </div>
          </div>
        </section>

        {/* Shop Section */}
        <section id="products" className="py-20 lg:py-32 bg-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <PrintfulShop />
          </div>
        </section>

        {/* Support Section */}
        <section className="py-20 lg:py-32 bg-card">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6">
              Thank You for Your Support
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Every purchase directly supports the production of Tales of Aneria, helping us create more epic adventures, improve our production quality, and bring you the content you love. We truly appreciate your support!
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="/#about" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 border [border-color:var(--button-outline)] shadow-xs active:shadow-none min-h-10 rounded-md px-8">
                Learn More About Us
              </a>
              <a href="https://www.patreon.com/TalesofAneria" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 bg-primary text-primary-foreground border border-primary-border min-h-10 rounded-md px-8">
                Support on Patreon
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
