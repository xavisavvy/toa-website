import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import LatestEpisodes from "@/components/LatestEpisodes";
import PodcastSection from "@/components/PodcastSection";
import WorldSection from "@/components/WorldSection";
import PromotionsSection from "@/components/PromotionsSection";
import ShopSection from "@/components/ShopSection";
import AboutSection from "@/components/AboutSection";
import CommunitySection from "@/components/CommunitySection";
import Footer from "@/components/Footer";

export default function Home() {
  const YOUTUBE_PLAYLIST_ID = import.meta.env.VITE_YOUTUBE_PLAYLIST_ID;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <LatestEpisodes playlistId={YOUTUBE_PLAYLIST_ID} />
      <PodcastSection />
      <WorldSection />
      <PromotionsSection />
      <ShopSection />
      <AboutSection />
      <CommunitySection />
      <Footer />
    </div>
  );
}
