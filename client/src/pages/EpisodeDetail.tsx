import type { Campaign, Episode } from "@shared/schema";
import { ArrowLeft, ExternalLink, Calendar, Mic, Youtube } from "lucide-react";
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
import episodesData from "@/data/episodes.json";
import { getWorldById } from "@/data/worlds";
import { useCampaignEpisodes } from "@/hooks/useCampaignEpisodes";
import {
  getCampaignBySlug,
  youtubeThumbnail,
} from "@/lib/campaigns";
import {
  getBreadcrumbSchema,
  getPodcastEpisodeSchema,
  getTVEpisodeSchema,
  getVideoSchema,
} from "@/lib/structuredData";

function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Episode Not Found - Tales of Aneria"
        description="This episode could not be found."
        noindex={true}
      />
      <Navigation />
      <div className="flex items-center justify-center py-20 pt-24">
        <div className="text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">
            Episode Not Found
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

export default function EpisodeDetail() {
  const [, params] = useRoute(
    "/campaigns/:slug/episodes/:episodeNumber"
  );

  const slug = params?.slug;
  const episodeNumberParam = params?.episodeNumber;

  const campaign = getCampaignBySlug(
    campaignsData.campaigns as Campaign[],
    slug
  );

  const world = getWorldById(campaign?.worldId ?? "");

  const liveEpisodes = useCampaignEpisodes(
    campaign?.slug,
    world,
    episodesData.episodes as Episode[]
  );

  // wouter route params are always strings — string-compare against episodeNumber
  const episode = liveEpisodes.find(
    (e) =>
      e.campaignSlug === slug &&
      String(e.episodeNumber) === episodeNumberParam
  );

  if (!campaign || !episode) {
    return <NotFound />;
  }

  const thumbnailUrl = episode.thumbnail ?? youtubeThumbnail(episode.youtubeUrl);

  const episodeUrl = `https://talesofaneria.com/campaigns/${campaign.slug}/episodes/${episode.episodeNumber}`;

  const tvEpisode = getTVEpisodeSchema({
    campaignName: campaign.name,
    campaignSlug: campaign.slug,
    episodeNumber: episode.episodeNumber,
    title: episode.title,
    summary: episode.summary,
    airDate: episode.airDate,
    url: episodeUrl,
    youtubeUrl: episode.youtubeUrl,
    thumbnailUrl,
    duration: episode.duration,
  });

  const videoObject = getVideoSchema({
    name: episode.title,
    description: episode.summary,
    thumbnailUrl: thumbnailUrl ?? "",
    uploadDate: episode.airDate,
    duration: episode.duration,
    contentUrl: episode.youtubeUrl,
  });

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "https://talesofaneria.com/" },
    { name: "Campaigns", url: "https://talesofaneria.com/campaigns" },
    {
      name: campaign.name,
      url: `https://talesofaneria.com/campaigns/${campaign.slug}`,
    },
    {
      name: `Ep ${episode.episodeNumber}: ${episode.title}`,
      url: episodeUrl,
    },
  ]);

  const graph: object[] = [tvEpisode, videoObject, breadcrumbData];

  if (episode.podcastUrl) {
    graph.push(
      getPodcastEpisodeSchema({
        title: episode.title,
        summary: episode.summary,
        airDate: episode.airDate,
        podcastUrl: episode.podcastUrl,
        campaignName: campaign.name,
      })
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  const seoTitle = `${campaign.name} — Ep ${episode.episodeNumber}: ${episode.title}`;
  const metaDescription =
    episode.summary.length > 160
      ? `${episode.summary.substring(0, 157)}...`
      : episode.summary;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoTitle}
        description={metaDescription}
        canonical={episodeUrl}
        ogType="article"
        ogImage={thumbnailUrl}
        ogImageAlt={`${episode.title} thumbnail`}
        keywords={`${campaign.name}, ${episode.title}, Tales of Aneria, TTRPG episode, D&D, live play`}
        jsonLd={structuredData}
        twitterCard="summary_large_image"
      />
      <Navigation />

      {/* Hero */}
      <div className="relative h-72 bg-gradient-to-b from-primary/20 to-background overflow-hidden pt-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-25"
            width="1920"
            height="288"
            loading="eager"
            aria-hidden="true"
          />
        )}
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-end pb-10">
          <div>
            <Link href={`/campaigns/${campaign.slug}`}>
              <Button
                variant="ghost"
                size="sm"
                className="mb-4"
                data-testid="button-back"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to {campaign.name}
              </Button>
            </Link>
            <h1
              className="font-serif text-3xl md:text-4xl font-bold mb-3"
              data-testid="text-episode-title"
            >
              Ep {episode.episodeNumber}: {episode.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{campaign.name}</Badge>
              <span
                className="text-sm text-muted-foreground inline-flex items-center gap-1"
                data-testid="text-episode-airdate"
              >
                <Calendar className="h-4 w-4" />
                {episode.airDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card data-testid="card-episode-summary">
              <CardHeader>
                <CardTitle>Episode Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert"
                  data-testid="text-episode-summary"
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                  >
                    {episode.summary}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar — outbound buttons */}
          <div className="space-y-6">
            <Card data-testid="card-watch">
              <CardContent className="pt-6">
                <Button
                  className="w-full"
                  variant="default"
                  asChild
                  data-testid="button-youtube"
                >
                  <a
                    href={episode.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-youtube"
                  >
                    <Youtube className="mr-2 h-4 w-4" />
                    Watch on YouTube
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {episode.podcastUrl && (
              <Card data-testid="card-podcast">
                <CardContent className="pt-6">
                  <Button
                    className="w-full"
                    variant="outline"
                    asChild
                    data-testid="button-podcast"
                  >
                    <a
                      href={episode.podcastUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="link-podcast"
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Listen on Podcast
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
