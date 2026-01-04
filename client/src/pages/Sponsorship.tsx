import { Mail, Users, TrendingUp, Star, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import SEO from '@/components/SEO';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { analytics } from '@/lib/analytics';

interface SponsorshipTier {
  name: string;
  price: string;
  features: string[];
  icon: typeof Star;
  popular?: boolean;
}

const sponsorshipTiers: SponsorshipTier[] = [
  {
    name: 'Bronze',
    price: 'Starting at $250/month',
    icon: Star,
    features: [
      'Logo on website footer',
      'Social media shoutouts (1x/month)',
      'Episode credits mention',
      'Link in video descriptions',
    ],
  },
  {
    name: 'Silver',
    price: 'Starting at $500/month',
    icon: Star,
    popular: true,
    features: [
      'All Bronze benefits',
      'Logo on website homepage',
      'Social media shoutouts (2x/month)',
      'Mid-roll ad read in episodes',
      'Monthly analytics report',
      'Custom promotional content',
    ],
  },
  {
    name: 'Gold',
    price: 'Starting at $1,000/month',
    icon: Star,
    features: [
      'All Silver benefits',
      'Exclusive episode sponsorship',
      'Weekly social media features',
      'Pre-roll & mid-roll ad reads',
      'Product placement opportunities',
      'Direct audience engagement events',
      'Priority support & custom packages',
    ],
  },
];

const audienceMetrics = [
  { label: 'Monthly Listeners', value: '10,000+', icon: Users },
  { label: 'YouTube Subscribers', value: '5,000+', icon: TrendingUp },
  { label: 'Social Media Reach', value: '15,000+', icon: Star },
  { label: 'Engagement Rate', value: '12%+', icon: CheckCircle2 },
];

export default function Sponsorship() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    interest: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact/sponsor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', company: '', interest: '', message: '' });
      
      // Track successful sponsor inquiry
      analytics.formSubmit('sponsor_inquiry', true);
    } catch (error) {
      console.error('Error submitting sponsorship inquiry:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Become a Sponsor - Tales of Aneria"
        description="Partner with Tales of Aneria to reach an engaged audience of TTRPG enthusiasts. Explore our sponsorship opportunities and connect with passionate fans."
        canonical="https://talesofaneria.com/sponsorship"
      />
      <Navigation />

      <main className="pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">
              Partner with Tales of Aneria
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Reach a passionate community of TTRPG enthusiasts through authentic storytelling and engagement
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <a href="#contact">Get Started</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#packages">View Packages</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Audience Metrics */}
        <section className="py-16 bg-muted/50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="font-serif text-3xl font-semibold text-center mb-12">
              Our Reach
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {audienceMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <Card key={metric.label}>
                    <CardContent className="p-6 text-center">
                      <Icon className="h-8 w-8 mx-auto mb-4 text-primary" />
                      <div className="text-3xl font-bold mb-2">{metric.value}</div>
                      <div className="text-sm text-muted-foreground">{metric.label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Partner With Us */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="font-serif text-3xl font-semibold text-center mb-12">
              Why Partner With Us?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Engaged Audience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our community actively participates in discussions, shares content, and supports brands that
                    align with their interests in tabletop gaming and storytelling.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Authentic Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We create genuine partnerships that resonate with our audience through natural product
                    integration and storytelling that feels authentic, not forced.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Growing Platform
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Consistent growth across all platforms with dedicated fans who trust our recommendations
                    and value quality products that enhance their gaming experience.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Measurable Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Monthly analytics reports with engagement metrics, click-through rates, and audience
                    feedback to demonstrate ROI and optimize partnership strategies.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Sponsorship Packages */}
        <section id="packages" className="py-16 bg-muted/50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="font-serif text-3xl font-semibold text-center mb-4">
              Sponsorship Packages
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Choose a package that fits your goals, or contact us for a custom solution tailored to your brand.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {sponsorshipTiers.map((tier) => {
                const Icon = tier.icon;
                return (
                  <Card
                    key={tier.name}
                    className={tier.popular ? 'border-primary shadow-lg scale-105' : ''}
                  >
                    {tier.popular && (
                      <div className="bg-primary text-primary-foreground text-center py-2 rounded-t-lg font-semibold text-sm">
                        Most Popular
                      </div>
                    )}
                    <CardHeader>
                      <Icon className="h-10 w-10 text-primary mb-4" />
                      <CardTitle>{tier.name}</CardTitle>
                      <CardDescription className="text-lg font-semibold text-foreground">
                        {tier.price}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full mt-6" variant={tier.popular ? 'default' : 'outline'} asChild>
                        <a href="#contact">Contact Us</a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="text-center text-muted-foreground mt-8">
              All packages include dedicated support and flexible terms. Custom packages available.
            </p>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact" className="py-16">
          <div className="max-w-2xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-semibold mb-4">
                Let&apos;s Work Together
              </h2>
              <p className="text-muted-foreground">
                Fill out the form below and we&apos;ll get back to you within 24-48 hours to discuss how we can
                partner together.
              </p>
            </div>

            {submitStatus === 'success' && (
              <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Thank you for your interest! We&apos;ll be in touch soon.
                </AlertDescription>
              </Alert>
            )}

            {submitStatus === 'error' && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>
                  There was an error submitting your inquiry. Please try again or email us directly at
                  sponsors@talesofaneria.com
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company/Brand</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Your company name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interest">Interested In</Label>
                    <Input
                      id="interest"
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      placeholder="e.g., Silver Package, Custom Partnership"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your brand and sponsorship goals..."
                      rows={5}
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    <Mail className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send Inquiry'}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By submitting this form, you agree to be contacted regarding sponsorship opportunities.
                  </p>
                </form>
              </CardContent>
            </Card>

            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground">
                Prefer to email directly?{' '}
                <a href="mailto:sponsors@talesofaneria.com" className="text-primary hover:underline">
                  sponsors@talesofaneria.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
