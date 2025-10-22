import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getPlaylistVideos } from "./youtube";
import { getPodcastFeed } from "./podcast";
import { getShopListings } from "./etsy";
import { getCharacterData } from "./dndbeyond";
import { validateUrl, validateNumber, logSecurityEvent } from "./security";

export async function registerRoutes(app: Express): Promise<Server> {
  // A03: Injection Prevention - Validate YouTube playlist ID
  app.get("/api/youtube/playlist/:playlistId", async (req, res) => {
    try {
      const { playlistId } = req.params;
      
      // A03: Validate playlistId format (YouTube playlist IDs are alphanumeric with hyphens/underscores)
      if (!/^[a-zA-Z0-9_-]+$/.test(playlistId)) {
        logSecurityEvent('INVALID_PLAYLIST_ID', { playlistId, ip: req.ip });
        return res.status(400).json({ error: 'Invalid playlist ID format' });
      }

      // A03: Validate maxResults parameter
      const maxResultsInput = req.query.maxResults as string;
      const validation = validateNumber(maxResultsInput || '10', 1, 100);
      
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const videos = await getPlaylistVideos(playlistId, validation.value!);
      res.json(videos);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      res.status(500).json({ error: 'Failed to fetch YouTube playlist' });
    }
  });

  // A10: SSRF Prevention - Validate and sanitize podcast feed URL
  app.post("/api/podcast/feed", async (req, res) => {
    try {
      const { feedUrl, limit } = req.body;
      
      if (!feedUrl) {
        return res.status(400).json({ error: 'feedUrl is required' });
      }

      // A10: SSRF Protection - Validate URL to prevent attacks
      const urlValidation = validateUrl(feedUrl);
      if (!urlValidation.valid) {
        logSecurityEvent('SSRF_ATTEMPT', { 
          feedUrl, 
          ip: req.ip,
          error: urlValidation.error 
        });
        return res.status(400).json({ error: urlValidation.error });
      }

      // A03: Validate limit parameter
      const limitValidation = validateNumber(limit || 10, 1, 50);
      if (!limitValidation.valid) {
        return res.status(400).json({ error: limitValidation.error });
      }
      
      const episodes = await getPodcastFeed(feedUrl, limitValidation.value!);
      res.json(episodes);
    } catch (error) {
      console.error('Error fetching podcast feed:', error);
      res.status(500).json({ error: 'Failed to fetch podcast feed' });
    }
  });

  // A03: Injection Prevention - Validate Etsy shop ID
  app.get("/api/etsy/shop/:shopId/listings", async (req, res) => {
    try {
      const { shopId } = req.params;
      
      // A03: Validate shopId format (Etsy shop IDs are alphanumeric)
      if (!/^[a-zA-Z0-9]+$/.test(shopId)) {
        logSecurityEvent('INVALID_SHOP_ID', { shopId, ip: req.ip });
        return res.status(400).json({ error: 'Invalid shop ID format' });
      }

      // A03: Validate limit parameter
      const limitInput = req.query.limit as string;
      const validation = validateNumber(limitInput || '8', 1, 50);
      
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      
      const products = await getShopListings(shopId, validation.value!);
      res.json(products);
    } catch (error) {
      console.error('Error fetching Etsy listings:', error);
      res.status(500).json({ error: 'Failed to fetch Etsy products' });
    }
  });

  // A03: Injection Prevention - Validate D&D Beyond character ID
  app.get("/api/dndbeyond/character/:characterId", async (req, res) => {
    try {
      const { characterId } = req.params;
      
      // A03: Validate characterId format (D&D Beyond character IDs are numeric)
      if (!/^\d+$/.test(characterId)) {
        logSecurityEvent('INVALID_CHARACTER_ID', { characterId, ip: req.ip });
        return res.status(400).json({ error: 'Invalid character ID format' });
      }
      
      const characterData = await getCharacterData(characterId);
      res.json(characterData);
    } catch (error) {
      console.error('Error fetching D&D Beyond character:', error);
      res.status(500).json({ error: 'Failed to fetch character data' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
