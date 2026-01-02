import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import LatestEpisodes from "@/components/LatestEpisodes";
import PodcastSection from "@/components/PodcastSection";
import CharactersSection from "@/components/CharactersSection";
import WorldSection from "@/components/WorldSection";
import PromotionsSection from "@/components/PromotionsSection";
import ShopSection from "@/components/ShopSection";
import AboutSection from "@/components/AboutSection";
import CommunitySection from "@/components/CommunitySection";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { getOrganizationSchema, getWebSiteSchema } from "@/lib/structuredData";

export default function Home() {
  // YouTube configuration - support both channel and playlists
  // Prefer channel ID if provided (fetches all videos automatically)
  const YOUTUBE_CHANNEL_ID = import.meta.env.VITE_YOUTUBE_CHANNEL_ID;
  
  // Fallback to playlist IDs (for backward compatibility)
  const YOUTUBE_PLAYLIST_IDS_RAW = import.meta.env.VITE_YOUTUBE_PLAYLIST_IDS || import.meta.env.VITE_YOUTUBE_PLAYLIST_ID;
  const YOUTUBE_PLAYLIST_IDS = YOUTUBE_PLAYLIST_IDS_RAW 
    ? YOUTUBE_PLAYLIST_IDS_RAW.split(',').map((id: string) => id.trim()).filter(Boolean)
    : [];
  const PODCAST_FEED_URL = import.meta.env.VITE_PODCAST_FEED_URL;
  const SPOTIFY_URL = import.meta.env.VITE_PODCAST_SPOTIFY_URL;
  const APPLE_PODCASTS_URL = import.meta.env.VITE_PODCAST_APPLE_URL;
  const YOUTUBE_MUSIC_URL = import.meta.env.VITE_PODCAST_YOUTUBE_MUSIC_URL;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      getOrganizationSchema(),
      getWebSiteSchema()
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Tales of Aneria - Epic TTRPG Live Play Series"
        description="Join us on an epic journey through the mystical world of Aneria. Watch our TTRPG live play series, explore rich lore, meet unforgettable characters, and discover exclusive merchandise from our adventures."
        canonical="https://talesofaneria.com/"
        keywords="TTRPG, Dungeons and Dragons, D&D, live play, actual play, tabletop RPG, fantasy, Aneria, podcast, YouTube, character stories, epic adventures"
        jsonLd={structuredData}
      />
      <Navigation />
      <Hero />
      <LatestEpisodes channelId={YOUTUBE_CHANNEL_ID} playlistIds={YOUTUBE_PLAYLIST_IDS} />
      <PodcastSection 
        feedUrl={PODCAST_FEED_URL}
        spotifyUrl={SPOTIFY_URL}
        applePodcastsUrl={APPLE_PODCASTS_URL}
        youtubeMusicUrl={YOUTUBE_MUSIC_URL}
      />
      <CharactersSection />
      <WorldSection />
      <PromotionsSection />
      <ShopSection />
      <AboutSection />
      <CommunitySection />
      <Footer />
    </div>
  );
}
