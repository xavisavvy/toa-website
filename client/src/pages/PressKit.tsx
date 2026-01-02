import { Download, FileText, Image, Palette, Mail, ExternalLink } from "lucide-react";

import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import socialLinksData from "@/data/social-links.json";
import { getBreadcrumbSchema } from "@/lib/structuredData";

export default function PressKit() {
  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "https://talesofaneria.com/" },
    { name: "Press Kit", url: "https://talesofaneria.com/press-kit" }
  ]);

  const downloadPressKit = () => {
    // Create a list of files to download
    const files = [
      { name: 'logo-icon.png', path: '/press-kit/logo-icon.png' },
      { name: 'social-preview.png', path: '/press-kit/social-preview.png' },
      { name: 'BRAND_GUIDELINES.txt', path: '/press-kit/BRAND_GUIDELINES.txt' }
    ];

    // Download each file individually (browser will handle multiple downloads)
    files.forEach((file, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = file.path;
        link.download = file.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 500); // Stagger downloads to avoid browser blocking
    });
  };

  const brandColors = [
    { name: "Primary Purple", hex: "#9333EA", rgb: "147, 51, 234", usage: "Main brand color, CTAs, highlights" },
    { name: "Accent Amber", hex: "#F59E0B", rgb: "245, 158, 11", usage: "Secondary accent, warmth, energy" },
    { name: "Dark Background", hex: "#0A0A0B", rgb: "10, 10, 11", usage: "Primary background, depth" },
    { name: "Light Text", hex: "#FAFAFA", rgb: "250, 250, 250", usage: "Primary text, high contrast" }
  ];

  const assets = [
    {
      title: "Logo Icon",
      description: "D20 die logo in PNG format with transparent background",
      type: "image",
      file: "/press-kit/logo-icon.png",
      specs: "PNG • Transparent • 512x512px"
    },
    {
      title: "Social Preview Image",
      description: "Optimized image for social media sharing",
      type: "image",
      file: "/press-kit/social-preview.png",
      specs: "PNG • 1200x630px • Social media optimized"
    },
    {
      title: "Brand Guidelines",
      description: "Complete brand guidelines, usage rules, and press information",
      type: "document",
      file: "/press-kit/BRAND_GUIDELINES.txt",
      specs: "TXT • Brand guidelines & media info"
    }
  ];

  const quickFacts = [
    { label: "Series Type", value: "TTRPG Actual Play / Live Play" },
    { label: "Primary Platform", value: "YouTube & Podcast" },
    { label: "Content Style", value: "Cinematic D&D storytelling" },
    { label: "Episode Frequency", value: "Weekly" },
    { label: "Tagline", value: "An epic journey through a world of magic, mystery, and adventure" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Press Kit - Tales of Aneria Media Resources"
        description="Download the Tales of Aneria press kit including logos, brand guidelines, social media assets, and media information. Everything you need for press coverage and partnerships."
        canonical="https://talesofaneria.com/press-kit"
        keywords="press kit, media kit, brand assets, logos, TTRPG press, media resources, brand guidelines"
        jsonLd={breadcrumbData}
      />
      <Navigation />
      
      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <Download className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-6" data-testid="text-presskit-title">
              Press Kit & Media Resources
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8" data-testid="text-presskit-description">
              Download our complete press kit including logos, brand guidelines, and media assets. 
              Everything you need for press coverage, articles, or partnership materials.
            </p>
            <Button 
              size="lg" 
              onClick={downloadPressKit}
              data-testid="button-download-all"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Complete Press Kit
            </Button>
          </div>

          {/* Quick Facts */}
          <div className="mb-20">
            <h2 className="font-serif text-3xl font-semibold mb-8 text-center">Quick Facts</h2>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quickFacts.map((fact, index) => (
                    <div key={index} data-testid={`fact-${fact.label.toLowerCase().replace(/\s+/g, '-')}`}>
                      <dt className="text-sm font-semibold text-muted-foreground mb-1">{fact.label}</dt>
                      <dd className="text-base">{fact.value}</dd>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Downloadable Assets */}
          <div className="mb-20">
            <h2 className="font-serif text-3xl font-semibold mb-8 text-center">Downloadable Assets</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {assets.map((asset, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-asset-${asset.type}`}>
                  <CardHeader>
                    <div className="mb-4 text-primary">
                      {asset.type === 'image' ? <Image className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
                    </div>
                    <CardTitle className="text-xl mb-2">{asset.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{asset.description}</p>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="mb-4">{asset.specs}</Badge>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = asset.file;
                        link.download = asset.file.split('/').pop() || 'download';
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      data-testid={`button-download-${asset.type}`}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Brand Colors */}
          <div className="mb-20">
            <h2 className="font-serif text-3xl font-semibold mb-8 text-center">Brand Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {brandColors.map((color, index) => (
                <Card key={index} data-testid={`card-color-${color.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-20 h-20 rounded-lg border border-border flex-shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{color.name}</h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>HEX: <code className="text-foreground">{color.hex}</code></p>
                          <p>RGB: <code className="text-foreground">{color.rgb}</code></p>
                          <p className="text-xs mt-2">{color.usage}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="mb-20">
            <h2 className="font-serif text-3xl font-semibold mb-8 text-center">Typography</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Headings: Cinzel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-serif space-y-2">
                    <p className="text-4xl">Tales of Aneria</p>
                    <p className="text-2xl">Epic Adventures Await</p>
                    <p className="text-xl">Join the Journey</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Elegant serif font for headers, titles, and brand name. Conveys epic, fantasy aesthetic.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => window.open('https://fonts.google.com/specimen/Cinzel', '_blank', 'noopener,noreferrer')}
                    data-testid="button-font-cinzel"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Google Fonts
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Body: Inter</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-base">Clean, modern sans-serif typography</p>
                    <p className="text-sm">Excellent readability at all sizes</p>
                    <p className="text-xs">Perfect for body text and UI elements</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Clean sans-serif font for body text, descriptions, and UI. Ensures excellent readability.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => window.open('https://fonts.google.com/specimen/Inter', '_blank', 'noopener,noreferrer')}
                    data-testid="button-font-inter"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Google Fonts
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Usage Guidelines */}
          <div className="mb-20">
            <h2 className="font-serif text-3xl font-semibold mb-8 text-center">Usage Guidelines</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Permitted Uses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <span>News articles and reviews</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <span>Social media posts and shares</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <span>Educational content about TTRPGs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <span>Podcasts and video essays (with attribution)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <span>Event promotions featuring our content</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Prohibited Uses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <span>Claiming our content as your own</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <span>Modifying our logo or brand colors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <span>Commercial use without permission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <span>Creating confusing derivative works</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <span>Misrepresenting our brand or values</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact */}
          <div>
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-12 text-center">
                <Palette className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h2 className="font-serif text-3xl font-semibold mb-4">Need Something Else?</h2>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Looking for high-resolution files, additional formats, custom assets, or have questions about usage? 
                  We're happy to help!
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button 
                    size="lg"
                    onClick={() => window.location.href = `mailto:${socialLinksData.email}?subject=Press Kit Request`}
                    data-testid="button-contact-press"
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    Contact Press Team
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => window.location.href = '/sponsors'}
                    data-testid="button-view-sponsors"
                  >
                    View Sponsorship Opportunities
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
