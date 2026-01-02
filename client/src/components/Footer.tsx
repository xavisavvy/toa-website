import type React from "react";
import { SiYoutube, SiX, SiDiscord, SiPatreon, SiReddit } from "react-icons/si";
import { Link, useLocation } from "wouter";

import { AccessibleIcon } from "@/components/ui/accessible-icon";
import { analytics } from "@/lib/analytics";
import socialLinksData from "@/data/social-links.json";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [location, setLocation] = useLocation();

  const footerLinks = {
    About: [
      { label: "Our Story", href: "/#about" },
      { label: "The Cast", href: "/#about" },
      { label: "Contact", href: `mailto:${socialLinksData.email}` },
    ],
    Content: [
      { label: "Episodes", href: "/#episodes" },
      { label: "Podcast", href: "/#podcast" },
      { label: "World Lore", href: "/#lore" },
    ],
    Shop: [
      { label: "Merchandise", href: "/shop" },
      { label: "Support on Patreon", href: socialLinksData.patreon },
    ],
    Resources: [
      { label: "Press Kit", href: "/press-kit" },
      { label: "Sponsors", href: "/sponsors" },
      { label: "Characters", href: "/characters" },
    ],
  };

  const socialLinks = [
    { 
      Icon: SiYoutube, 
      label: "YouTube", 
      testId: "youtube",
      url: socialLinksData.youtube
    },
    { 
      Icon: SiX, 
      label: "X", 
      testId: "x",
      url: socialLinksData.twitter
    },
    { 
      Icon: SiDiscord, 
      label: "Discord", 
      testId: "discord",
      url: socialLinksData.discord
    },
    { 
      Icon: SiReddit, 
      label: "Reddit", 
      testId: "reddit",
      url: socialLinksData.reddit
    },
    { 
      Icon: SiPatreon, 
      label: "Patreon", 
      testId: "patreon",
      url: socialLinksData.patreon
    },
  ];

  const handleHashNavigation = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const hash = href.substring(href.indexOf('#'));
    const sectionId = hash.replace('#', '');
    
    // If we're not on the homepage, navigate to homepage with hash
    if (location !== '/') {
      setLocation(`/${hash}`);
      // Wait for navigation, then scroll
      window.setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // We're on homepage, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          <div className="lg:col-span-2">
            <h3 className="font-serif text-2xl font-bold mb-4" data-testid="text-footer-logo">
              Tales of Aneria
            </h3>
            <p className="text-muted-foreground mb-4 max-w-sm" data-testid="text-footer-description">
              An epic TTRPG live play series exploring the mystical realm of Aneria. Join us on our adventures every week.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((link) => {
                const Icon = link.Icon;
                return (
                  <button
                    key={link.testId}
                    className="w-10 h-10 rounded-md bg-background hover-elevate flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`button-footer-${link.testId}`}
                    onClick={() => {
                      analytics.externalLinkClick(link.url, link.label);
                      window.open(link.url, '_blank', 'noopener,noreferrer');
                    }}
                    aria-label={link.label}
                  >
                    <AccessibleIcon icon={Icon} className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4" data-testid={`text-footer-${category.toLowerCase()}`}>
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.includes('#') ? (
                      <a
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={(e) => handleHashNavigation(e, link.href)}
                      >
                        {link.label}
                      </a>
                    ) : link.href.startsWith('/') ? (
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        onClick={() => {
                          if (link.href.startsWith('http')) {
                            analytics.externalLinkClick(link.href, link.label);
                          }
                        }}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-sm text-muted-foreground" data-testid="text-copyright">
              © {currentYear} Tales of Aneria. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-made-by">
              Made with ❤️ by{" "}
              <a
                href="https://prestonfarr.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline transition-colors"
                data-testid="link-preston-farr"
              >
                Preston Farr
              </a>
            </p>
          </div>
          <div className="flex gap-6">
            <Link
              href="/legal/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-privacy"
            >
              Privacy Policy
            </Link>
            <Link
              href="/legal/tos"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-terms"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
