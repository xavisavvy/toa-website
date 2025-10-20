import { SiYoutube, SiX, SiDiscord, SiPatreon } from "react-icons/si";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    About: [
      { label: "Our Story", href: "#about" },
      { label: "The Cast", href: "#about" },
      { label: "Contact", href: "#" },
    ],
    Content: [
      { label: "Episodes", href: "#episodes" },
      { label: "Podcast", href: "#podcast" },
      { label: "World Lore", href: "#lore" },
    ],
    Shop: [
      { label: "Merchandise", href: "#shop" },
      { label: "Etsy Store", href: "#shop" },
      { label: "Campaign Guides", href: "#shop" },
    ],
  };

  const socialLinks = [
    { icon: <SiYoutube className="h-5 w-5" />, label: "YouTube", testId: "youtube" },
    { icon: <SiX className="h-5 w-5" />, label: "X", testId: "x" },
    { icon: <SiDiscord className="h-5 w-5" />, label: "Discord", testId: "discord" },
    { icon: <SiPatreon className="h-5 w-5" />, label: "Patreon", testId: "patreon" },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          <div className="lg:col-span-2">
            <h3 className="font-serif text-2xl font-bold mb-4" data-testid="text-footer-logo">
              Tales of Aneria
            </h3>
            <p className="text-muted-foreground mb-4 max-w-sm" data-testid="text-footer-description">
              An epic TTRPG live play series exploring the mystical realm of Aneria. Join us on our adventures every week.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((link) => (
                <button
                  key={link.testId}
                  className="w-10 h-10 rounded-md bg-background hover-elevate flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={`button-footer-${link.testId}`}
                  onClick={() => console.log(`${link.label} clicked`)}
                  aria-label={link.label}
                >
                  {link.icon}
                </button>
              ))}
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
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={(e) => {
                        e.preventDefault();
                        console.log(`${link.label} clicked`);
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground" data-testid="text-copyright">
            © {currentYear} Tales of Aneria. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-privacy"
              onClick={(e) => {
                e.preventDefault();
                console.log('Privacy Policy clicked');
              }}
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-terms"
              onClick={(e) => {
                e.preventDefault();
                console.log('Terms of Service clicked');
              }}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
