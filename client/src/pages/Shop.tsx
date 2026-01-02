import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import PrintfulShop from "@/components/PrintfulShop";
import SEO from "@/components/SEO";

export default function Shop() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Official Merchandise & Support - Tales of Aneria Shop"
        description="Shop exclusive Tales of Aneria merchandise, support us on Patreon, make a donation, or become a sponsor. High-quality apparel, accessories, and collectibles from our epic TTRPG adventures. Every purchase supports the show!"
        canonical="https://talesofaneria.com/shop"
        keywords="Tales of Aneria merchandise, TTRPG merch, D&D apparel, fantasy merchandise, Aneria shop, support TTRPG, Patreon, donate to actual play, sponsor TTRPG show"
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
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6">
                More Ways to Support Tales of Aneria
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Every purchase, donation, and subscription directly supports the production of Tales of Aneria. Your support helps us create more epic adventures, improve production quality, and bring you the content you love!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {/* Patreon */}
              <div className="shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm hover-elevate transition-all">
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" role="img" viewBox="0 0 24 24" className="h-8 w-8" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.957 7.21c-.004-3.064-2.391-5.576-5.191-6.482-3.478-1.125-8.064-.962-11.384.604C2.357 3.231 1.093 7.391 1.046 11.54c-.039 3.411.302 12.396 5.369 12.46 3.765.047 4.326-4.804 6.068-7.141 1.24-1.662 2.836-2.132 4.801-2.618 3.376-.836 5.678-3.501 5.673-7.031Z"></path>
                    </svg>
                  </div>
                  <h3 className="font-serif text-2xl font-semibold mb-3">Become a Patron</h3>
                  <p className="text-muted-foreground mb-6">
                    Join our Patreon for exclusive content, early access to episodes, behind-the-scenes footage, and special perks for supporters.
                  </p>
                  <a 
                    href="https://www.patreon.com/TalesofAneria" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 bg-primary text-primary-foreground border border-primary-border min-h-10 rounded-md px-8 w-full"
                  >
                    Join Patreon
                  </a>
                </div>
              </div>

              {/* Direct Donations */}
              <div className="shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm hover-elevate transition-all">
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                    </svg>
                  </div>
                  <h3 className="font-serif text-2xl font-semibold mb-3">One-Time Donation</h3>
                  <p className="text-muted-foreground mb-6">
                    Make a direct one-time donation to support the show. Every contribution helps us continue creating epic TTRPG content.
                  </p>
                  <a 
                    href={import.meta.env.VITE_STRIPE_DONATION_URL || "https://www.patreon.com/TalesofAneria"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 bg-primary text-primary-foreground border border-primary-border min-h-10 rounded-md px-8 w-full"
                  >
                    Make a Donation
                  </a>
                </div>
              </div>

              {/* Sponsorship */}
              <div className="shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm hover-elevate transition-all">
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                      <path d="M4 22h16"></path>
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                    </svg>
                  </div>
                  <h3 className="font-serif text-2xl font-semibold mb-3">Become a Sponsor</h3>
                  <p className="text-muted-foreground mb-6">
                    Partner with Tales of Aneria through sponsorship opportunities. Reach our engaged TTRPG community while supporting quality content.
                  </p>
                  <a 
                    href="/sponsors"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 bg-primary text-primary-foreground border border-primary-border min-h-10 rounded-md px-8 w-full"
                  >
                    Learn About Sponsorship
                  </a>
                </div>
              </div>
            </div>

            {/* Thank You Message */}
            <div className="text-center max-w-3xl mx-auto">
              <p className="text-lg text-muted-foreground mb-6">
                We're incredibly grateful for your support! Whether you purchase merchandise, join our Patreon, make a donation, or become a sponsor, you're helping us continue our adventures in Aneria and beyond.
              </p>
              <a href="/#about" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 border [border-color:var(--button-outline)] shadow-xs active:shadow-none min-h-10 rounded-md px-8">
                Learn More About Tales of Aneria
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
