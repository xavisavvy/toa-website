import { useQuery } from "@tanstack/react-query";
import { Video, Clock } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getBreadcrumbSchema } from "@/lib/structuredData";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
  viewCount?: string;
  description?: string;
  durationSeconds?: number;
}

type Filter = "all" | "episodes" | "shorts";
const PAGE_SIZE = 12;
const CHANNEL_URL = "https://www.youtube.com/@TalesOfAneria";

// Mirrors server/youtube.ts:633-635 EXACTLY — do not simplify.
const isShort = (v: VideoItem) =>
  v.durationSeconds !== undefined &&
  v.durationSeconds > 0 &&
  v.durationSeconds <= 60;

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};

export default function Videos() {
  const channelId = import.meta.env.VITE_YOUTUBE_CHANNEL_ID as
    | string
    | undefined;
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  const {
    data: videos,
    isLoading,
    isError,
  } = useQuery<VideoItem[]>({
    // R1 mitigation: distinct cache key from LatestEpisodes
    // (which uses ['/api/youtube/channel', channelId] with maxResults=50).
    queryKey: ["/api/youtube/channel/full", channelId],
    enabled: !!channelId,
    queryFn: async () => {
      const r = await fetch(
        `/api/youtube/channel/${channelId}?maxResults=500`
      );
      if (!r.ok) {
        throw new Error("Failed to fetch videos");
      }
      return r.json();
    },
  });

  // Reset pagination when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const filtered = useMemo(() => {
    if (!videos) {
      return [] as VideoItem[];
    }
    if (filter === "all") {
      return videos;
    }
    if (filter === "shorts") {
      return videos.filter(isShort);
    }
    return videos.filter((v) => !isShort(v));
  }, [videos, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp page if filtered list shrank below current page
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "https://talesofaneria.com/" },
    { name: "Videos", url: "https://talesofaneria.com/videos" },
  ]);

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "episodes", label: "Episodes" },
    { value: "shorts", label: "Shorts" },
  ];

  const onPrev = () => {
    if (safePage > 1) {
      setPage(safePage - 1);
    }
  };
  const onNext = () => {
    if (safePage < totalPages) {
      setPage(safePage + 1);
    }
  };

  const openVideo = (id: string) => {
    window.open(
      `https://www.youtube.com/watch?v=${id}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Videos - Tales of Aneria"
        description="Every episode and short from the Tales of Aneria YouTube channel — newest first."
        canonical="https://talesofaneria.com/videos"
        keywords="Tales of Aneria videos, YouTube archive, TTRPG episodes, shorts"
        jsonLd={breadcrumbData}
      />
      <Navigation />
      <div className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <Video className="h-8 w-8" />
            </div>
            <h1
              className="font-serif text-4xl md:text-5xl font-semibold mb-6"
              data-testid="text-page-title"
            >
              Videos
            </h1>
            <p
              className="text-lg text-muted-foreground max-w-3xl mx-auto"
              data-testid="text-page-description"
            >
              Every episode and short — newest first.
            </p>
          </div>

          {/* Filter chips */}
          <div className="mb-12">
            <div className="flex flex-wrap justify-center gap-3">
              {filters.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={filter === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(value)}
                  data-testid={`filter-type-${value}`}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-video bg-muted animate-pulse" />
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded animate-pulse mb-3" />
                    <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <Card data-testid="card-error-state">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Couldn&apos;t load videos right now — check back soon.
                </p>
                <Button
                  variant="outline"
                  data-testid="button-error-youtube-channel"
                  onClick={() =>
                    window.open(CHANNEL_URL, "_blank", "noopener,noreferrer")
                  }
                >
                  Visit our YouTube channel
                </Button>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <p
              className="text-center text-muted-foreground"
              data-testid="text-empty-state"
            >
              No videos match this filter.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visible.map((v) => (
                  <Card
                    key={v.id}
                    className="overflow-hidden hover-elevate cursor-pointer transition-all"
                    data-testid={`card-video-${v.id}`}
                    onClick={() => openVideo(v.id)}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={v.thumbnail}
                        alt={v.title}
                        className="object-cover w-full h-full"
                        width="480"
                        height="270"
                        loading="lazy"
                      />
                      {isShort(v) && (
                        <Badge
                          className="absolute top-3 left-3"
                          data-testid={`badge-shorts-${v.id}`}
                        >
                          Shorts
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3
                        className="font-semibold text-lg mb-3 line-clamp-2"
                        data-testid={`text-video-title-${v.id}`}
                      >
                        {v.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span data-testid={`text-video-date-${v.id}`}>
                          {formatDate(v.publishedAt)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" aria-hidden="true" />
                          <span data-testid={`text-video-duration-${v.id}`}>
                            {v.duration}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-12">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        data-testid="pagination-prev"
                        aria-disabled={safePage === 1}
                        aria-label="Previous page"
                        onClick={(e) => {
                          e.preventDefault();
                          if (safePage > 1) {
                            onPrev();
                          }
                        }}
                        className={
                          safePage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span
                        role="status"
                        aria-live="polite"
                        data-testid="pagination-page-indicator"
                        className="px-4 text-sm"
                      >
                        Page {safePage} of {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        data-testid="pagination-next"
                        aria-disabled={safePage === totalPages}
                        aria-label="Next page"
                        onClick={(e) => {
                          e.preventDefault();
                          if (safePage < totalPages) {
                            onNext();
                          }
                        }}
                        className={
                          safePage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
