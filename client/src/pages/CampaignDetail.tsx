import type { Campaign, Episode } from "@shared/schema";
import { ArrowLeft, BookOpen, Calendar, Users, Film } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { useRoute, Link } from "wouter";

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
import castData from "@/data/cast.json";
import episodesData from "@/data/episodes.json";
import {
  getCampaignBySlug,
  getEpisodesByCampaign,
} from "@/lib/campaigns";
import {
  getBreadcrumbSchema,
  getTVSeriesSchema,
} from "@/lib/structuredData";

interface CastMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export default function CampaignDetail() {
  const [, params] = useRoute("/campaigns/:slug");
  const slug = params?.slug;

  const campaign = getCampaignBySlug(
    campaignsData.campaigns as Campaign[],
    slug
  );

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title="Campaign Not Found - Tales of Aneria"
          description="This campaign could not be found."
          noindex={true}
        />
        <Navigation />
        <div className="flex items-center justify-center py-20 pt-24">
          <div className="text-center">
            <h1 className="text-4xl font-serif font-bold mb-4">
              Campaign Not Found
            </h1>
            <Link href="/campaigns">
              <Button data-testid="button-back-to-campaigns">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Campaigns
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const episodes = getEpisodesByCampaign(
    episodesData.episodes as Episode[],
    campaign.slug
  );

  const allCast = castData.cast as CastMember[];
  const resolvedCast: CastMember[] = campaign.cast
    .map((id) => allCast.find((c) => c.id === id))
    .filter((c): c is CastMember => Boolean(c));

  const tvSeries = getTVSeriesSchema({
    name: campaign.name,
    slug: campaign.slug,
    description: campaign.description,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    numberOfEpisodes: episodes.length,
    thumbnailUrl: campaign.thumbnail,
    cast: resolvedCast.map((c) => ({ name: c.name })),
  });

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "https://talesofaneria.com/" },
    { name: "Campaigns", url: "https://talesofaneria.com/campaigns" },
    {
      name: campaign.name,
      url: `https://talesofaneria.com/campaigns/${campaign.slug}`,
    },
  ]);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [tvSeries, breadcrumbData],
  };

  const metaDescription =
    campaign.summary.length > 160
      ? `${campaign.summary.substring(0, 157)}...`
      : campaign.summary;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${campaign.name} - Tales of Aneria`}
        description={metaDescription}
        canonical={`https://talesofaneria.com/campaigns/${campaign.slug}`}
        ogType="article"
        keywords={`${campaign.name}, Tales of Aneria, TTRPG campaign, D&D, live play`}
        jsonLd={structuredData}
        twitterCard="summary_large_image"
      />
      <Navigation />

      {/* Hero */}
      <div className="relative h-72 bg-gradient-to-b from-primary/20 to-background overflow-hidden pt-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-end pb-10">
          <div>
            <Link href="/campaigns">
              <Button
                variant="ghost"
                size="sm"
                className="mb-4"
                data-testid="button-back"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Campaigns
              </Button>
            </Link>
            <h1
              className="font-serif text-4xl md:text-5xl font-bold mb-3"
              data-testid="text-campaign-name"
            >
              {campaign.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant={campaign.status === "active" ? "default" : "secondary"}
                data-testid="badge-status"
              >
                {campaign.status === "active" ? "Active" : "Concluded"}
              </Badge>
              <span
                className="text-sm text-muted-foreground inline-flex items-center gap-1"
                data-testid="text-startdate"
              >
                <Calendar className="h-4 w-4" />
                {campaign.startDate}
                {campaign.endDate ? ` – ${campaign.endDate}` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card data-testid="card-campaign-description">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  About This Campaign
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                  >
                    {campaign.description}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-campaign-episodes">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Film className="h-5 w-5" />
                  Episodes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {episodes.length === 0 ? (
                  <p
                    className="text-sm text-muted-foreground"
                    data-testid="text-no-episodes"
                  >
                    No episodes have been published yet.
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {episodes.map((episode) => (
                      <li key={episode.id}>
                        <Link
                          href={`/campaigns/${campaign.slug}/episodes/${episode.episodeNumber}`}
                          data-testid={`link-episode-${episode.episodeNumber}`}
                          className="flex items-center justify-between gap-4 rounded-md border border-border/50 p-3 hover:border-primary hover:bg-primary/5 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              Ep {episode.episodeNumber}: {episode.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {episode.airDate}
                            </p>
                          </div>
                          <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card data-testid="card-campaign-cast">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Cast
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {resolvedCast.length === 0 ? (
                  <p
                    className="text-sm text-muted-foreground"
                    data-testid="text-no-cast"
                  >
                    Cast information coming soon.
                  </p>
                ) : (
                  resolvedCast.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3"
                      data-testid={`cast-row-${member.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.role}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
