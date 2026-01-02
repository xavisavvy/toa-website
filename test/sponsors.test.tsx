import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router } from 'wouter';

import Sponsors from '@/pages/Sponsors';

// Mock window.location
const originalLocation = window.location;

describe('Sponsors Page', () => {
  beforeEach(() => {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { href: '' };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('should render the sponsors page with all sections', () => {
    render(
      <Router>
        <Sponsors />
      </Router>
    );

    expect(screen.getByTestId('text-sponsors-title')).toHaveTextContent('Sponsors & Partners');
    expect(screen.getByTestId('text-sponsors-description')).toBeInTheDocument();
  });

  it('should display "Become Our First Sponsor" when no sponsors exist', () => {
    render(
      <Router>
        <Sponsors />
      </Router>
    );

    expect(screen.getByText('Become Our First Sponsor!')).toBeInTheDocument();
  });

  it('should render all three sponsorship tiers', () => {
    render(
      <Router>
        <Sponsors />
      </Router>
    );

    expect(screen.getByTestId('card-tier-platinum-sponsor')).toBeInTheDocument();
    expect(screen.getByTestId('card-tier-gold-sponsor')).toBeInTheDocument();
    expect(screen.getByTestId('card-tier-silver-sponsor')).toBeInTheDocument();
  });

  it('should render community metrics section', () => {
    render(
      <Router>
        <Sponsors />
      </Router>
    );

    expect(screen.getByTestId('text-metric-youtube')).toBeInTheDocument();
    expect(screen.getByTestId('text-metric-episodes')).toBeInTheDocument();
    expect(screen.getByTestId('text-metric-community')).toBeInTheDocument();
    expect(screen.getByTestId('text-metric-platforms')).toBeInTheDocument();
  });

  it('should open mailto link when "Become Sponsor" button is clicked', () => {
    render(
      <Router>
        <Sponsors />
      </Router>
    );

    const becomeButton = screen.getByTestId('button-become-sponsor');
    fireEvent.click(becomeButton);

    expect(window.location.href).toContain('mailto:TalesOfAneria@gmail.com');
    expect(window.location.href).toContain('subject=');
    expect(window.location.href).toContain('Sponsorship');
  });

  it('should render sponsorship contact form with all fields', () => {
    render(
      <Router>
        <Sponsors />
      </Router>
    );

    const form = screen.getByTestId('sponsorship-form');
    expect(form).toBeInTheDocument();
    
    expect(screen.getByTestId('input-company')).toBeInTheDocument();
    expect(screen.getByTestId('input-contact-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-email')).toBeInTheDocument();
    expect(screen.getByTestId('input-phone')).toBeInTheDocument();
    expect(screen.getByTestId('textarea-goals')).toBeInTheDocument();
    expect(screen.getByTestId('textarea-message')).toBeInTheDocument();
    expect(screen.getByTestId('button-submit-sponsorship')).toBeInTheDocument();
  });

  it('should open mailto when sponsorship form is submitted', () => {
    render(
      <Router>
        <Sponsors />
      </Router>
    );

     
    const companyInput = screen.getByTestId('input-company') as any;
    const contactNameInput = screen.getByTestId('input-contact-name') as any;
    const emailInput = screen.getByTestId('input-email') as any;
    const goalsInput = screen.getByTestId('textarea-goals') as any;
    const submitButton = screen.getByTestId('button-submit-sponsorship');
     

    fireEvent.change(companyInput, { target: { value: 'Test Company' } });
    fireEvent.change(contactNameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(goalsInput, { target: { value: 'Brand awareness' } });
    fireEvent.click(submitButton);

    expect(window.location.href).toContain('mailto:TalesOfAneria@gmail.com');
    expect(window.location.href).toContain('subject=');
    expect(window.location.href).toContain('Test%20Company');
  });

  it('should open mailto with tier-specific content when tier inquiry button is clicked', () => {
    render(
      <Router>
        <Sponsors />
      </Router>
    );

    const platinumButton = screen.getByTestId('button-inquire-platinum-sponsor');
    fireEvent.click(platinumButton);

    expect(window.location.href).toContain('mailto:TalesOfAneria@gmail.com');
    expect(window.location.href).toContain('Platinum%20Sponsor');
  });

  it('should navigate to press kit when press kit button is clicked', () => {
    render(
      <Router>
        <Sponsors />
      </Router>
    );

    const pressKitButton = screen.getByTestId('button-press-kit');
    fireEvent.click(pressKitButton);

    expect(window.location.href).toContain('/press-kit');
  });

  it('should render all sponsorship tier benefits', () => {
    render(
      <Router>
        <Sponsors />
      </Router>
    );

    // Platinum benefits
    expect(screen.getByText(/Logo featured on every episode/i)).toBeInTheDocument();
    expect(screen.getByText(/30-second dedicated sponsor segment/i)).toBeInTheDocument();

    // Gold benefits
    expect(screen.getByText(/Logo in video descriptions and end cards/i)).toBeInTheDocument();

    // Silver benefits
    expect(screen.getByText(/Logo on website sponsors page/i)).toBeInTheDocument();
  });

  it('should display "Why Partner With Us" section', () => {
    render(
      <Router>
        <Sponsors />
      </Router>
    );

    expect(screen.getByText('Why Partner With Us?')).toBeInTheDocument();
    expect(screen.getByText('Authentic Integration')).toBeInTheDocument();
    expect(screen.getByText('Passionate Audience')).toBeInTheDocument();
    expect(screen.getByText('Multi-Platform Reach')).toBeInTheDocument();
    expect(screen.getByText('Transparent Reporting')).toBeInTheDocument();
  });

  it('should display target audience section', () => {
    render(
      <Router>
        <Sponsors />
      </Router>
    );

    expect(screen.getByText('Perfect For These Brands')).toBeInTheDocument();
    expect(screen.getByText('Gaming & Entertainment')).toBeInTheDocument();
    expect(screen.getByText('Lifestyle & Services')).toBeInTheDocument();
    expect(screen.getByText('Community & Tech')).toBeInTheDocument();
  });

  it('should have proper SEO metadata', () => {
    render(
      <Router>
        <Sponsors />
      </Router>
    );

    // The SEO component should be rendered (this is a basic check)
    expect(document.title).toBeTruthy();
  });

  it('should properly encode special characters in form submission', () => {
    render(
      <Router>
        <Sponsors />
      </Router>
    );

     
    const companyInput = screen.getByTestId('input-company') as any;
    const contactNameInput = screen.getByTestId('input-contact-name') as any;
    const emailInput = screen.getByTestId('input-email') as any;
    const goalsInput = screen.getByTestId('textarea-goals') as any;
    const submitButton = screen.getByTestId('button-submit-sponsorship');
     

    fireEvent.change(companyInput, { target: { value: 'Test & Co.' } });
    fireEvent.change(contactNameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@test.com' } });
    fireEvent.change(goalsInput, { target: { value: 'Brand awareness & promotion' } });
    fireEvent.click(submitButton);

    // Check that special characters are URL encoded
    const href = window.location.href;
    expect(href).not.toContain(' '); // Spaces should be encoded
    expect(href).toContain('%20'); // Space encoding
    expect(href).toContain('%26'); // & encoding
  });
});
