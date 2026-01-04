import { Mail, Send } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function SponsorshipForm() {
  const [formData, setFormData] = useState({
    company: '',
    contactName: '',
    email: '',
    phone: '',
    goals: '',
    message: '',
  });

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const handleChange = (e: any) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailBody = `Hi Tales of Aneria team,

I&apos;m interested in partnering with you!

Company: ${formData.company || 'N/A'}
Contact Name: ${formData.contactName || 'N/A'}
Email: ${formData.email || 'N/A'}
Phone: ${formData.phone || 'N/A'}

Sponsorship Goals:
${formData.goals || 'N/A'}

Additional Message:
${formData.message || 'N/A'}

I would like to discuss:
- Available sponsorship packages and pricing
- Timeline and available slots
- Media kit and audience analytics
- References from current sponsors

Thank you!`;

    const subject = `Sponsorship Inquiry - ${formData.company || 'Potential Partner'}`;
    const mailtoLink = `mailto:contact@talesofaneria.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    window.location.href = mailtoLink;
  };

  return (
    <Card className="max-w-2xl mx-auto" data-testid="sponsorship-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Contact Us About Sponsorship
        </CardTitle>
        <CardDescription>
          Fill out the form below and we&apos;ll open your email client with a pre-filled message.{' '}
          You can review and send it from there.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company"
                name="company"
                placeholder="Acme Corp"
                value={formData.company}
                onChange={handleChange}
                required
                data-testid="input-company"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contactName">
                Contact Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactName"
                name="contactName"
                placeholder="John Doe"
                value={formData.contactName}
                onChange={handleChange}
                required
                data-testid="input-contact-name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@acme.com"
                value={formData.email}
                onChange={handleChange}
                required
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleChange}
                data-testid="input-phone"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">
              Sponsorship Goals <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="goals"
              name="goals"
              placeholder="What do you hope to achieve through this sponsorship? (e.g., brand awareness, product promotion, community engagement)"
              value={formData.goals}
              onChange={handleChange}
              required
              rows={3}
              data-testid="textarea-goals"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Additional Information (Optional)</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Tell us more about your company, budget range, preferred timeline, or any specific questions..."
              value={formData.message}
              onChange={handleChange}
              rows={4}
              data-testid="textarea-message"
            />
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>What happens next?</strong>
            </p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Review your information above</li>
              <li>Click "Open Email Client" to create a pre-filled email</li>
              <li>Your default email app will open with all details included</li>
              <li>Review, make any edits, and send when ready</li>
            </ol>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            data-testid="button-submit-sponsorship"
          >
            <Send className="mr-2 h-4 w-4" />
            Open Email Client
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
