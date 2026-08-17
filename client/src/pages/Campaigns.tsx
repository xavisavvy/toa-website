import type { Campaign, Episode } from "@shared/schema";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import campaignsData from "@/data/campaigns.json";
import episodesData from "@/data/episodes.json";
import { sortCampaignsByStartDateDesc } from "@/lib/campaigns";
import { getBreadcrumbSchema } from "@/lib/structuredData";

type StatusFilter = "all" | "active" | "concluded";

export default function Campaigns() {
  const campaigns = campaignsData.campaigns as Campaign[];
  const episodes = episodesData.episodes as Episode[];
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered =
    statusFilter === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === statusFilter);

  const sorted = sortCampaignsByStartDateDesc(filtered);

  const episodeCount = (slug: string): number =>
    episodes.filter((e) => e.campaignSlug === slug).length;

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "https://talesofaneria.com/" },
    { name: "Campaigns", url: "https://talesofaneria.com/campaigns" },
  ]);

  const filters: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "concluded", label: "Concluded" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Campaigns - Tales of Aneria"
        description="Browse the campaigns and sagas of Tales of Aneria — ongoing arcs and concluded narratives from our TTRPG live play series."
        canonical="https://talesofaneria.com/campaigns"
        keywords="Tales of Aneria campaigns, TTRPG campaigns, D&D campaign archive, live play episodes, Forgotten Gods Saga, Journeys Through Taebrin"
        jsonLd={breadcrumbData}
      />
      <Navigation />
      <div className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <BookOpen className="h-8 w-8" />
            </div>
            <h1
              className="font-serif text-4xl md:text-5xl font-semibold mb-6"
              data-testid="text-page-title"
            >
              Campaigns
            </h1>
            <p
              className="text-lg text-muted-foreground max-w-3xl mx-auto"
              data-testid="text-page-description"
            >
              Every saga, in order. Browse our active arcs and concluded
              campaigns — each with its own cast, episodes, and links out to
              YouTube and podcast.
            </p>
          </div>

          {/* Status Filter */}
          <div className="mb-12">
            <div className="flex flex-wrap justify-center gap-3">
              {filters.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={statusFilter === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(value)}
                  data-testid={`filter-status-${value}`}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {sorted.length === 0 ? (
            <p
              className="text-center text-muted-foreground"
              data-testid="text-empty-state"
            >
              No campaigns match this filter.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sorted.map((campaign) => (
                <Link
                  key={campaign.slug}
                  href={`/campaigns/${campaign.slug}`}
                  className="relative z-0 hover:z-10"
                >
                  <Card
                    className="overflow-hidden hover-elevate cursor-pointer transition-all h-full"
                    data-testid={`card-campaign-${campaign.slug}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle
                          className="text-xl"
                          data-testid={`text-campaign-name-${campaign.slug}`}
                        >
                          {campaign.name}
                        </CardTitle>
                        <Badge
                          variant={
                            campaign.status === "active" ? "default" : "secondary"
                          }
                          data-testid={`badge-status-${campaign.slug}`}
                        >
                          {campaign.status === "active" ? "Active" : "Concluded"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p
                        className="text-sm text-muted-foreground mb-4 line-clamp-3"
                        data-testid={`text-campaign-summary-${campaign.slug}`}
                      >
                        {campaign.summary}
                      </p>
                      <p
                        className="text-xs text-muted-foreground"
                        data-testid={`text-episode-count-${campaign.slug}`}
                      >
                        {episodeCount(campaign.slug)} episode
                        {episodeCount(campaign.slug) === 1 ? "" : "s"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
