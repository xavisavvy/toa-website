import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Mail, TrendingUp, Users, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";
import { getBreadcrumbSchema } from "@/lib/structuredData";
import socialLinksData from "@/data/social-links.json";

export default function Sponsors() {
  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "https://talesofaneria.com/" },
    { name: "Sponsors", url: "https://talesofaneria.com/sponsors" }
  ]);

  const sponsorTiers = [
    {
      name: "Platinum Sponsor",
      icon: <Sparkles className="h-8 w-8" />,
      description: "Premium sponsorship with maximum visibility and benefits",
      benefits: [
        "Logo featured on every episode and video description",
        "30-second dedicated sponsor segment in each episode",
        "Premium placement on website homepage",
        "Monthly social media shoutouts across all platforms",
        "Exclusive behind-the-scenes content and access",
        "Custom integration opportunities in campaigns",
        "Quarterly strategy meetings with the team"
      ],
      color: "text-purple-500"
    },
    {
      name: "Gold Sponsor",
      icon: <TrendingUp className="h-8 w-8" />,
      description: "Strong brand presence with excellent exposure",
      benefits: [
        "Logo in video descriptions and end cards",
        "Featured on website sponsors page",
        "Regular social media mentions",
        "Access to exclusive content",
        "Custom sponsorship messages",
        "Bi-annual check-ins with the team"
      ],
      color: "text-amber-500"
    },
    {
      name: "Silver Sponsor",
      icon: <Users className="h-8 w-8" />,
      description: "Great visibility and community engagement",
      benefits: [
        "Logo on website sponsors page",
        "Mentioned in quarterly sponsor roundups",
        "Social media thank you posts",
        "Access to patron-only content",
        "Early access to announcements"
      ],
      color: "text-slate-400"
    }
  ];

  interface Sponsor {
    name: string;
    tier: string;
    logo: string;
    website: string;
  }

  const currentSponsors: Sponsor[] = [
    // Add actual sponsors here as they come in
    // Example:
    // {
    //   name: "Sponsor Company",
    //   tier: "Platinum",
    //   logo: "/sponsors/company-logo.png",
    //   website: "https://example.com"
    // }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Sponsors & Partners - Tales of Aneria"
        description="Support Tales of Aneria and reach our passionate TTRPG community. Explore sponsorship opportunities and learn about our current partners and supporters."
        canonical="https://talesofaneria.com/sponsors"
        keywords="sponsorship, partners, TTRPG sponsors, D&D sponsors, podcast sponsorship, YouTube sponsorship, brand partnership"
        jsonLd={breadcrumbData}
      />
      <Navigation />
      
      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <Heart className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-6" data-testid="text-sponsors-title">
              Sponsors & Partners
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto" data-testid="text-sponsors-description">
              Help us continue creating epic adventures and reach a passionate community of TTRPG enthusiasts. 
              Our sponsors make it possible to bring high-quality content to our audience every week.
            </p>
          </div>

          {/* Current Sponsors Section */}
          {currentSponsors.length > 0 ? (
            <div className="mb-20">
              <h2 className="font-serif text-3xl font-semibold mb-8 text-center">Our Amazing Sponsors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentSponsors.map((sponsor, index) => (
                  <Card key={index} className="hover-elevate cursor-pointer" data-testid={`card-sponsor-${index}`}>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <img 
                        src={sponsor.logo} 
                        alt={`${sponsor.name} logo`}
                        className="h-20 w-auto mb-4 object-contain"
                      />
                      <h3 className="font-semibold text-lg mb-2">{sponsor.name}</h3>
                      <Badge variant="outline" className="mb-4">{sponsor.tier} Sponsor</Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(sponsor.website, '_blank', 'noopener,noreferrer')}
                        data-testid={`button-sponsor-website-${index}`}
                      >
                        Visit Website
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-20">
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-serif text-2xl font-semibold mb-3">Become Our First Sponsor!</h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    We're currently looking for partners who share our passion for storytelling and the TTRPG community. 
                    Be among the first to support our journey and gain exclusive benefits.
                  </p>
                  <Button 
                    size="lg"
                    onClick={() => window.location.href = `mailto:${socialLinksData.email}?subject=Sponsorship Inquiry`}
                    data-testid="button-become-sponsor"
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    Inquire About Sponsorship
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sponsorship Tiers */}
          <div className="mb-20">
            <h2 className="font-serif text-3xl font-semibold mb-4 text-center">Sponsorship Opportunities</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Choose the sponsorship tier that best fits your marketing goals and budget. All tiers include authentic 
              integration with our content and genuine engagement with our community.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {sponsorTiers.map((tier, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-tier-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardHeader>
                    <div className={`mb-4 ${tier.color}`}>
                      {tier.icon}
                    </div>
                    <CardTitle className="font-serif text-2xl mb-2">{tier.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {tier.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        const subject = encodeURIComponent(`${tier.name} Sponsorship Inquiry - Tales of Aneria`);
                        const body = encodeURIComponent(`Hi Tales of Aneria team,\n\nI'm interested in learning more about the ${tier.name} sponsorship opportunity.\n\nPlease send me more information about:\n- Pricing and availability\n- Detailed analytics and audience demographics\n- Customization options\n- Next steps\n\nLooking forward to hearing from you!\n\nBest regards`);
                        window.location.href = `mailto:${socialLinksData.email}?subject=${subject}&body=${body}`;
                      }}
                      data-testid={`button-inquire-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Inquire About {tier.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center mt-6">
              Custom packages available. Contact us to discuss your specific needs.
            </p>
          </div>

          {/* Audience Metrics */}
          <div className="mb-20">
            <h2 className="font-serif text-3xl font-semibold mb-8 text-center">Our Community & Reach</h2>
            <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
              Connect with a highly engaged TTRPG community across multiple platforms
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2" data-testid="text-metric-youtube">Multi-Platform</div>
                  <p className="text-sm text-muted-foreground">YouTube, Podcast, Social</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2" data-testid="text-metric-episodes">Weekly</div>
                  <p className="text-sm text-muted-foreground">Consistent Content</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2" data-testid="text-metric-community">High</div>
                  <p className="text-sm text-muted-foreground">Engagement Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2" data-testid="text-metric-platforms">Global</div>
                  <p className="text-sm text-muted-foreground">Audience Reach</p>
                </CardContent>
              </Card>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Contact us for detailed analytics and audience demographics
            </p>
          </div>

          {/* Why Partner With Us */}
          <div className="mb-20">
            <h2 className="font-serif text-3xl font-semibold mb-8 text-center">Why Partner With Us?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Authentic Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We only partner with brands that align with our values and resonate with our audience. 
                    Your sponsorship is integrated naturally into our content, never forced or disruptive.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Passionate Audience</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our community is highly engaged and supportive. TTRPG fans are known for their loyalty 
                    and enthusiasm, making them ideal customers for the right products and services.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Multi-Platform Reach</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Your brand gains exposure across YouTube, podcast platforms, social media, and our website. 
                    We maximize your visibility across all our channels.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Transparent Reporting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We provide regular analytics and insights about your sponsorship performance, including 
                    reach, engagement, and audience feedback to measure your ROI.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Target Audience & Ideal Sponsors */}
          <div className="mb-20">
            <h2 className="font-serif text-3xl font-semibold mb-8 text-center">Perfect For These Brands</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="text-lg">Gaming & Entertainment</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• TTRPG publishers & game designers</li>
                    <li>• Dice makers & gaming accessories</li>
                    <li>• Virtual tabletop platforms</li>
                    <li>• Board game companies</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="text-lg">Lifestyle & Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Subscription boxes & services</li>
                    <li>• Online education platforms</li>
                    <li>• Creative software & tools</li>
                    <li>• Apparel & merchandise brands</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="text-lg">Community & Tech</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Discord bots & community tools</li>
                    <li>• Streaming equipment & tech</li>
                    <li>• Audio/video production tools</li>
                    <li>• Fan art & commission platforms</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div>
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-12 text-center">
                <h2 className="font-serif text-3xl font-semibold mb-4">Ready to Partner With Us?</h2>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Let's discuss how we can create a sponsorship package that meets your goals and resonates 
                  with our community. We're excited to hear from you!
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button 
                    size="lg"
                    onClick={() => {
                      const subject = encodeURIComponent('Sponsorship Inquiry - Tales of Aneria');
                      const body = encodeURIComponent('Hi Tales of Aneria team,\n\nI\'m interested in partnering with you!\n\nPlease provide:\n- Sponsorship packages and pricing\n- Available slots and timeline\n- Media kit and analytics\n- References from current sponsors\n\nCompany: \nContact: \nGoals: \n\nThank you!');
                      window.location.href = `mailto:${socialLinksData.email}?subject=${subject}&body=${body}`;
                    }}
                    data-testid="button-contact-sponsor"
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    Contact Us About Sponsorship
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => window.location.href = '/press-kit'}
                    data-testid="button-press-kit"
                  >
                    Download Press Kit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
