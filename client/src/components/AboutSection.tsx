import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Youtube, Twitter, Instagram, Twitch, Globe } from "lucide-react";
import castData from "@/data/cast.json";
import prestonAvatar from "@assets/cast-preston.jpg";
import brigetteAvatar from "@assets/cast-brigette.png";
import dallinAvatar from "@assets/cast-dallin.png";
import coryAvatar from "@assets/cast-cory.jpg";
import torreyAvatar from "@assets/cast-torrey.png";
import scottAvatar from "@assets/cast-scott.jpg";
import colbyAvatar from "@assets/cast-colby.png";
import ianAvatar from "@assets/cast-ian.png";
import jakeAvatar from "@assets/cast-jake.jpg";

interface SocialLinks {
  youtube?: string;
  twitter?: string;
  instagram?: string;
  twitch?: string;
  website?: string;
}

interface CastMember {
  id: string;
  name: string;
  role: string;
  characters: string[];
  isCurrent: boolean;
  avatar: string;
  socialLinks: SocialLinks;
}

export default function AboutSection() {
  const allCast: CastMember[] = castData.cast;
  const currentCast = allCast.filter((member) => member.isCurrent);
  const pastCast = allCast.filter((member) => !member.isCurrent);

  const avatarImages: Record<string, string> = {
    "cast-preston.jpg": prestonAvatar,
    "cast-brigette.png": brigetteAvatar,
    "cast-dallin.png": dallinAvatar,
    "cast-cory.jpg": coryAvatar,
    "cast-torrey.png": torreyAvatar,
    "cast-scott.jpg": scottAvatar,
    "cast-colby.png": colbyAvatar,
    "cast-ian.png": ianAvatar,
    "cast-jake.jpg": jakeAvatar,
  };

  const stats = [
    { label: "Episodes", value: "187+" },
    { label: "Subscribers", value: "5K" },
    { label: "Watch Hours", value: "92.2K" },
  ];

  const renderSocialLinks = (member: CastMember) => {
    const links = [];

    if (member.socialLinks.youtube) {
      links.push(
        <Button
          key="youtube"
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            window.open(
              member.socialLinks.youtube,
              "_blank",
              "noopener,noreferrer",
            );
          }}
          data-testid={`button-social-youtube-${member.id}`}
          aria-label={`${member.name}'s YouTube channel`}
        >
          <Youtube className="h-4 w-4" />
        </Button>,
      );
    }

    if (member.socialLinks.twitter) {
      links.push(
        <Button
          key="twitter"
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            window.open(
              member.socialLinks.twitter,
              "_blank",
              "noopener,noreferrer",
            );
          }}
          data-testid={`button-social-twitter-${member.id}`}
          aria-label={`${member.name}'s Twitter profile`}
        >
          <Twitter className="h-4 w-4" />
        </Button>,
      );
    }

    if (member.socialLinks.instagram) {
      links.push(
        <Button
          key="instagram"
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            window.open(
              member.socialLinks.instagram,
              "_blank",
              "noopener,noreferrer",
            );
          }}
          data-testid={`button-social-instagram-${member.id}`}
          aria-label={`${member.name}'s Instagram profile`}
        >
          <Instagram className="h-4 w-4" />
        </Button>,
      );
    }

    if (member.socialLinks.twitch) {
      links.push(
        <Button
          key="twitch"
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            window.open(
              member.socialLinks.twitch,
              "_blank",
              "noopener,noreferrer",
            );
          }}
          data-testid={`button-social-twitch-${member.id}`}
          aria-label={`${member.name}'s Twitch channel`}
        >
          <Twitch className="h-4 w-4" />
        </Button>,
      );
    }

    if (member.socialLinks.website) {
      links.push(
        <Button
          key="website"
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            window.open(
              member.socialLinks.website,
              "_blank",
              "noopener,noreferrer",
            );
          }}
          data-testid={`button-social-website-${member.id}`}
          aria-label={`${member.name}'s website`}
        >
          <Globe className="h-4 w-4" />
        </Button>,
      );
    }

    return links.length > 0 ? (
      <div
        className="flex items-center justify-center gap-1 mt-3"
        data-testid={`social-links-${member.id}`}
      >
        {links}
      </div>
    ) : null;
  };

  const renderCastCard = (member: CastMember) => {
    const avatarSrc =
      member.avatar && avatarImages[member.avatar]
        ? avatarImages[member.avatar]
        : member.avatar;

    return (
      <Card
        key={member.id}
        className="overflow-hidden hover-elevate transition-all"
        data-testid={`card-cast-${member.id}`}
      >
        <CardContent className="p-6 text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4">
            <AvatarImage
              src={avatarSrc}
              alt={`${member.name} - ${member.role}`}
              loading="lazy"
            />
            <AvatarFallback>
              {member.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <h4
            className="font-semibold text-lg mb-1"
            data-testid={`text-cast-name-${member.id}`}
          >
            {member.name}
          </h4>
          <p
            className="text-sm text-muted-foreground mb-3"
            data-testid={`text-cast-role-${member.id}`}
          >
            {member.role}
          </p>
          <div className="space-y-1">
            {member.characters.slice(0, 3).map((character, idx) => (
              <p
                key={idx}
                className="text-xs text-primary font-medium"
                data-testid={`text-cast-character-${member.id}-${idx}`}
              >
                {character}
              </p>
            ))}
            {member.characters.length > 3 && (
              <Badge
                variant="secondary"
                className="text-xs mt-2"
                data-testid={`badge-more-characters-${member.id}`}
              >
                +{member.characters.length - 3} more
              </Badge>
            )}
          </div>
          {renderSocialLinks(member)}
        </CardContent>
      </Card>
    );
  };

  return (
    <section id="about" className="py-20 lg:py-32 bg-card">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className="font-serif text-4xl md:text-5xl font-semibold mb-6"
            data-testid="text-about-title"
          >
            About Tales of Aneria
          </h2>
          <p
            className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8"
            data-testid="text-about-description"
          >
            Tales of Aneria is an epic tabletop RPG live play series that
            follows a group of unlikely heroes as they navigate a world
            teetering on the edge of chaos. With rich storytelling,
            unforgettable characters, and immersive world-building, each episode
            brings new adventures and unexpected twists.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-12 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div
                  className="text-4xl font-bold text-primary mb-2"
                  data-testid={`text-stat-value-${index}`}
                >
                  {stat.value}
                </div>
                <div
                  className="text-muted-foreground"
                  data-testid={`text-stat-label-${index}`}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h3
            className="font-serif text-3xl font-semibold mb-8 text-center"
            data-testid="text-current-cast-title"
          >
            Current Cast
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentCast.map(renderCastCard)}
          </div>
        </div>

        {pastCast.length > 0 && (
          <div>
            <h3
              className="font-serif text-2xl font-semibold mb-8 text-center text-muted-foreground"
              data-testid="text-past-cast-title"
            >
              Other Cast Members and Special Guests
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {pastCast.map(renderCastCard)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
