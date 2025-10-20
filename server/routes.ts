import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getPlaylistVideos } from "./youtube";

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

  const httpServer = createServer(app);

  return httpServer;
}
