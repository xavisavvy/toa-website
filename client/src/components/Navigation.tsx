import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Episodes", href: "#episodes" },
    { label: "Podcast", href: "#podcast" },
    { label: "Lore", href: "#lore" },
    { label: "Shop", href: "#shop" },
    { label: "About", href: "#about" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-xl md:text-2xl font-bold" data-testid="text-nav-logo">
              Tales of Aneria
            </h2>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-foreground/80 hover:text-foreground transition-colors"
                data-testid={`link-nav-${item.label.toLowerCase()}`}
                onClick={(e) => {
                  e.preventDefault();
                  console.log(`Navigate to ${item.label}`);
                }}
              >
                {item.label}
              </a>
            ))}
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="button-menu-toggle"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="px-6 py-4 space-y-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block py-2 text-foreground/80 hover:text-foreground transition-colors"
                data-testid={`link-mobile-${item.label.toLowerCase()}`}
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(false);
                  console.log(`Navigate to ${item.label}`);
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
