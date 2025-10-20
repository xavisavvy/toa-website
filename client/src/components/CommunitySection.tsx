import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiYoutube, SiX, SiDiscord, SiPatreon, SiReddit } from "react-icons/si";
import socialLinksData from "@/data/social-links.json";

export default function CommunitySection() {
  const socialLinks = [
    {
      icon: <SiYoutube className="h-6 w-6" />,
      name: "YouTube",
      testId: "youtube",
      url: socialLinksData.youtube,
    },
    {
      icon: <SiX className="h-6 w-6" />,
      name: "X",
      testId: "x",
      url: socialLinksData.twitter,
    },
    {
      icon: <SiDiscord className="h-6 w-6" />,
      name: "Discord",
      testId: "discord",
      url: socialLinksData.discord,
    },
    {
      icon: <SiReddit className="h-6 w-6" />,
      name: "Reddit",
      testId: "reddit",
      url: socialLinksData.reddit,
    },
    {
      icon: <SiPatreon className="h-6 w-6" />,
      name: "Patreon",
      testId: "patreon",
      url: socialLinksData.patreon,
    },
  ];

  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2
              className="font-serif text-4xl md:text-5xl font-semibold mb-6"
              data-testid="text-community-title"
            >
              Join Our Community
            </h2>
            <p
              className="text-lg text-muted-foreground mb-8"
              data-testid="text-community-description"
            >
              Connect with fellow adventurers, get exclusive updates, and be
              part of the Tales of Aneria community. Support us on Patreon for
              behind-the-scenes content, early access to episodes, and exclusive
              perks!
            </p>

            <Card className="mb-8 bg-primary/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  <SiPatreon className="h-12 w-12 text-primary" />
                </div>
                <h3
                  className="font-serif text-2xl font-semibold mb-3"
                  data-testid="text-patreon-title"
                >
                  Support Us on Patreon
                </h3>
                <p
                  className="text-muted-foreground mb-6"
                  data-testid="text-patreon-description"
                >
                  Get exclusive content, early access, and help us create more
                  amazing episodes!
                </p>
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  data-testid="button-join-patreon"
                  onClick={() =>
                    window.open(
                      socialLinksData.patreon,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  <SiPatreon className="h-5 w-5 mr-2" />
                  Join Our Patreon
                </Button>
              </CardContent>
            </Card>

            <div>
              <h3
                className="font-semibold text-xl mb-4"
                data-testid="text-follow-us"
              >
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
                    onClick={() =>
                      window.open(link.url, "_blank", "noopener,noreferrer")
                    }
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
              <h3
                className="font-serif text-2xl font-semibold mb-4"
                data-testid="text-testimonial-title"
              >
                What Our Community Says
              </h3>
              <div className="space-y-6">
                <div className="border-l-2 border-primary pl-4">
                  <p
                    className="text-muted-foreground mb-2 italic"
                    data-testid="text-testimonial-1"
                  >
                    "This brought a tear to my eye. Love to see a campaign come
                    to fruition. The roleplay was fantastic, the story was
                    brimming with life and creativity. It was a joy to listen
                    to. Thank you all so much. I will be waiting with
                    anticipation for the next adventure."
                  </p>
                  <p
                    className="text-sm font-medium"
                    data-testid="text-testimonial-author-1"
                  >
                    - @timothyhanna6304
                  </p>
                </div>
                <div className="border-l-2 border-primary pl-4">
                  <p
                    className="text-muted-foreground mb-2 italic"
                    data-testid="text-testimonial-2"
                  >
                    "I do wanna say you guys are amazing. I have learned so much
                    as a DM and a player watching you guys. Y'all aren't overly
                    polished and I love y'all for it. Every episode has felt
                    like we are just chilling in the room with y'all as you
                    play. Thank you so much for this campaign and the Time y'all
                    put into it. Can't wait to see what y'all have in store for
                    us later!
                  </p>
                  <p
                    className="text-sm font-medium"
                    data-testid="text-testimonial-author-2"
                  >
                    - @boscobubbles8839
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
