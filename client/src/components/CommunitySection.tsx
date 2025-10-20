import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SiYoutube, SiX, SiDiscord, SiPatreon } from "react-icons/si";
import { Mail } from "lucide-react";
import { useState } from "react";

export default function CommunitySection() {
  const [email, setEmail] = useState("");

  const socialLinks = [
    { icon: <SiYoutube className="h-6 w-6" />, name: "YouTube", testId: "youtube" },
    { icon: <SiX className="h-6 w-6" />, name: "X", testId: "x" },
    { icon: <SiDiscord className="h-6 w-6" />, name: "Discord", testId: "discord" },
    { icon: <SiPatreon className="h-6 w-6" />, name: "Patreon", testId: "patreon" },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter subscription:', email);
    setEmail("");
  };

  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-6" data-testid="text-community-title">
              Join Our Community
            </h2>
            <p className="text-lg text-muted-foreground mb-8" data-testid="text-community-description">
              Connect with fellow adventurers, get exclusive updates, and be part of the Tales of Aneria community. 
              Subscribe to our newsletter for behind-the-scenes content and early access to new episodes.
            </p>

            <Card className="mb-8">
              <CardContent className="p-6">
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="text-sm font-medium mb-2 block">
                      Email Address
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        data-testid="input-newsletter-email"
                        required
                      />
                      <Button type="submit" data-testid="button-subscribe">
                        <Mail className="h-4 w-4 mr-2" />
                        Subscribe
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div>
              <h3 className="font-semibold text-xl mb-4" data-testid="text-follow-us">
                Follow Us
              </h3>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((link) => (
                  <Button
                    key={link.testId}
                    variant="outline"
                    size="lg"
                    className="flex-1 min-w-[140px]"
                    data-testid={`button-social-${link.testId}`}
                    onClick={() => console.log(`${link.name} clicked`)}
                  >
                    {link.icon}
                    <span className="ml-2">{link.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-8">
              <h3 className="font-serif text-2xl font-semibold mb-4" data-testid="text-testimonial-title">
                What Our Community Says
              </h3>
              <div className="space-y-6">
                <div className="border-l-2 border-primary pl-4">
                  <p className="text-muted-foreground mb-2 italic" data-testid="text-testimonial-1">
                    "Tales of Aneria has completely captivated me! The storytelling is incredible and the characters are so well-developed. Can't wait for each new episode!"
                  </p>
                  <p className="text-sm font-medium" data-testid="text-testimonial-author-1">
                    - Sarah K.
                  </p>
                </div>
                <div className="border-l-2 border-primary pl-4">
                  <p className="text-muted-foreground mb-2 italic" data-testid="text-testimonial-2">
                    "This is the best TTRPG actual play I've ever watched. The world-building is phenomenal and the cast has amazing chemistry!"
                  </p>
                  <p className="text-sm font-medium" data-testid="text-testimonial-author-2">
                    - Mike T.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
