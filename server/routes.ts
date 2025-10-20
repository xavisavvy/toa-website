import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getPlaylistVideos } from "./youtube";
import { getPodcastFeed } from "./podcast";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/youtube/playlist/:playlistId", async (req, res) => {
    try {
      const { playlistId } = req.params;
      const maxResults = parseInt(req.query.maxResults as string) || 10;
      
      const videos = await getPlaylistVideos(playlistId, maxResults);
      res.json(videos);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      res.status(500).json({ error: 'Failed to fetch YouTube playlist' });
    }
  });

  app.post("/api/podcast/feed", async (req, res) => {
    try {
      const { feedUrl, limit } = req.body;
      
      if (!feedUrl) {
        return res.status(400).json({ error: 'feedUrl is required' });
      }
      
      const episodes = await getPodcastFeed(feedUrl, limit || 10);
      res.json(episodes);
    } catch (error) {
      console.error('Error fetching podcast feed:', error);
      res.status(500).json({ error: 'Failed to fetch podcast feed' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
