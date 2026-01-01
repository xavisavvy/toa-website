import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getPlaylistVideos } from "./youtube";
import { getPodcastFeed } from "./podcast";
import { getShopListings } from "./etsy";
import { getCharacterData } from "./dndbeyond";
import { validateUrl, validateNumber, logSecurityEvent } from "./security";
import { metrics } from "./monitoring";
import { registerHealthRoutes } from "./health";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoints (for Kubernetes, Docker, monitoring)
  registerHealthRoutes(app);
  
  // Metrics endpoint
  app.get("/api/metrics", (req, res) => {
    res.json(metrics.getMetrics());
  });
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
      const validation = validateNumber(maxResultsInput || '1000', 1, 10000);
      
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

  // Audio proxy endpoint to bypass CORS restrictions
  // Uses redirect approach for better production reliability
  app.get("/api/podcast/audio-proxy", async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL parameter is required' });
      }

      // Decode URL if it's double-encoded
      let decodedUrl = url;
      try {
        // Handle multiple levels of encoding
        while (decodedUrl.includes('%25')) {
          decodedUrl = decodeURIComponent(decodedUrl);
        }
      } catch {
        // If decoding fails, use original
      }

      // Validate URL to prevent SSRF attacks
      const urlValidation = validateUrl(decodedUrl);
      if (!urlValidation.valid) {
        logSecurityEvent('SSRF_ATTEMPT', { 
          url: decodedUrl, 
          ip: req.ip,
          error: urlValidation.error 
        });
        return res.status(400).json({ error: urlValidation.error });
      }

      // Only allow audio from known podcast hosting domains
      const allowedDomains = ['anchor.fm', 'cloudfront.net', 'spotify.com', 'apple.com', 'spreaker.com', 'buzzsprout.com', 'libsyn.com', 'podbean.com', 'simplecast.com', 'transistor.fm', 'captivate.fm', 'megaphone.fm', 'omny.fm', 'acast.com'];
      const urlObj = new URL(decodedUrl);
      const isAllowed = allowedDomains.some(domain => 
        urlObj.hostname.endsWith(domain) || urlObj.hostname === domain
      );

      if (!isAllowed) {
        logSecurityEvent('UNAUTHORIZED_AUDIO_DOMAIN', { url: decodedUrl, ip: req.ip });
        return res.status(403).json({ error: 'Audio URL from unauthorized domain' });
      }

      // Follow redirects to get the final audio URL
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(decodedUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          redirect: 'follow',
          signal: controller.signal,
        });

        clearTimeout(timeout);

        // Get the final URL after redirects
        const finalUrl = response.url;
        
        // Redirect client to the actual audio source
        res.redirect(302, finalUrl);
      } catch (headError) {
        clearTimeout(timeout);
        // If HEAD request fails, try direct redirect
        res.redirect(302, decodedUrl);
      }
    } catch (error: any) {
      console.error('Error proxying audio:', error?.message || error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to proxy audio file' });
      }
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
