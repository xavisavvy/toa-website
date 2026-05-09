import { describe, it, expect } from 'vitest';

import {
  getOrganizationSchema,
  getWebSiteSchema,
  getBreadcrumbSchema,
  getVideoSchema,
  getPersonSchema,
  getCreativeWorkSchema,
  getTVSeriesSchema,
  getTVEpisodeSchema,
  getPodcastEpisodeSchema,
} from '../client/src/lib/structuredData';

/**
 * Snapshot Tests for Structured Data (JSON-LD)
 * 
 * These tests ensure structured data remains consistent and valid.
 * When schemas change intentionally, update snapshots with: npm test -- -u
 */

describe('Structured Data Snapshot Tests', () => {
  describe('Organization Schema', () => {
    it('generates valid organization schema', () => {
      const schema = getOrganizationSchema();
      
      // Snapshot the entire structure
      expect(schema).toMatchSnapshot();
      
      // Verify required Schema.org fields
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBeTruthy();
      expect(schema.url).toMatch(/^https?:\/\//);
    });

    it('includes all social media links', () => {
      const schema = getOrganizationSchema();
      
      expect(schema.sameAs).toBeDefined();
      expect(schema.sameAs).toBeInstanceOf(Array);
      expect(schema.sameAs.length).toBeGreaterThan(0);
      
      // Verify all links are valid URLs
      schema.sameAs.forEach((url: string) => {
        expect(url).toMatch(/^https?:\/\//);
      });
      
      expect(schema).toMatchSnapshot();
    });

    it('includes contact information', () => {
      const schema = getOrganizationSchema();
      
      expect(schema.contactPoint).toBeDefined();
      expect(schema.contactPoint['@type']).toBe('ContactPoint');
      expect(schema.contactPoint.email).toMatch(/@/);
      
      expect(schema).toMatchSnapshot();
    });
  });

  describe('WebSite Schema', () => {
    it('generates valid website schema', () => {
      const schema = getWebSiteSchema();
      
      expect(schema).toMatchSnapshot();
      
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebSite');
      expect(schema.name).toBeTruthy();
      expect(schema.url).toMatch(/^https?:\/\//);
    });

    it('includes search action', () => {
      const schema = getWebSiteSchema();
      
      expect(schema.potentialAction).toBeDefined();
      expect(schema.potentialAction['@type']).toBe('SearchAction');
      expect(schema.potentialAction.target).toContain('{search_term_string}');
      
      expect(schema).toMatchSnapshot();
    });

    it('includes publisher information', () => {
      const schema = getWebSiteSchema();
      
      expect(schema.publisher).toBeDefined();
      expect(schema.publisher['@type']).toBe('Organization');
      expect(schema.publisher.name).toBeTruthy();
      
      expect(schema).toMatchSnapshot();
    });
  });

  describe('Breadcrumb Schema', () => {
    it('generates breadcrumb for homepage', () => {
      const items = [
        { name: 'Home', url: 'https://talesofaneria.com' },
      ];
      
      const schema = getBreadcrumbSchema(items);
      
      expect(schema).toMatchSnapshot();
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(1);
    });

    it('generates breadcrumb for nested pages', () => {
      const items = [
        { name: 'Home', url: 'https://talesofaneria.com' },
        { name: 'Characters', url: 'https://talesofaneria.com/characters' },
        { name: 'Taebrin', url: 'https://talesofaneria.com/characters/taebrin' },
      ];
      
      const schema = getBreadcrumbSchema(items);
      
      expect(schema).toMatchSnapshot();
      expect(schema.itemListElement).toHaveLength(3);
      
      // Verify positions are sequential
      schema.itemListElement.forEach((item: any, index: number) => {
        expect(item.position).toBe(index + 1);
        expect(item['@type']).toBe('ListItem');
      });
    });

    it('handles empty breadcrumb', () => {
      const schema = getBreadcrumbSchema([]);
      
      expect(schema).toMatchSnapshot();
      expect(schema.itemListElement).toHaveLength(0);
    });
  });

  describe('Video Schema', () => {
    it('generates complete video schema', () => {
      const video = {
        name: 'Tales of Aneria - Episode 1',
        description: 'The adventure begins in the mystical city of Eldoria',
        thumbnailUrl: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
        uploadDate: '2024-01-15T10:00:00Z',
        duration: 'PT1H30M',
        contentUrl: 'https://www.youtube.com/watch?v=abc123',
      };
      
      const schema = getVideoSchema(video);
      
      expect(schema).toMatchSnapshot();
      
      expect(schema['@type']).toBe('VideoObject');
      expect(schema.name).toBe(video.name);
      expect(schema.uploadDate).toMatch(/^\d{4}-\d{2}-\d{2}/);
      expect(schema.duration).toMatch(/^PT/); // ISO 8601 duration
    });

    it('generates video schema with minimal data', () => {
      const video = {
        name: 'Test Video',
        description: 'Test description',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        uploadDate: '2024-01-01T00:00:00Z',
      };
      
      const schema = getVideoSchema(video);
      
      expect(schema).toMatchSnapshot();
      expect(schema.duration).toBeUndefined();
      expect(schema.contentUrl).toBeUndefined();
    });

    it('includes publisher information', () => {
      const video = {
        name: 'Test',
        description: 'Test',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        uploadDate: '2024-01-01T00:00:00Z',
      };
      
      const schema = getVideoSchema(video);
      
      expect(schema.publisher).toBeDefined();
      expect(schema.publisher['@type']).toBe('Organization');
      expect(schema.publisher.logo).toBeDefined();
      
      expect(schema).toMatchSnapshot();
    });
  });

  describe('Person Schema', () => {
    it('generates complete person schema', () => {
      const person = {
        name: 'John Smith',
        description: 'Game Master and storyteller',
        image: 'https://example.com/john.jpg',
        sameAs: [
          'https://twitter.com/johnsmith',
          'https://www.instagram.com/johnsmith',
        ],
      };
      
      const schema = getPersonSchema(person);
      
      expect(schema).toMatchSnapshot();
      
      expect(schema['@type']).toBe('Person');
      expect(schema.name).toBe(person.name);
      expect(schema.memberOf).toBeDefined();
    });

    it('generates person schema with minimal data', () => {
      const person = {
        name: 'Jane Doe',
      };
      
      const schema = getPersonSchema(person);
      
      expect(schema).toMatchSnapshot();
      expect(schema.description).toBeUndefined();
      expect(schema.image).toBeUndefined();
      expect(schema.sameAs).toBeUndefined();
    });

    it('includes organization membership', () => {
      const person = {
        name: 'Test Person',
      };
      
      const schema = getPersonSchema(person);
      
      expect(schema.memberOf).toBeDefined();
      expect(schema.memberOf['@type']).toBe('Organization');
      expect(schema.memberOf.name).toBe('Tales of Aneria');
      
      expect(schema).toMatchSnapshot();
    });
  });

  describe('CreativeWork Schema', () => {
    it('generates character creative work schema', () => {
      const character = {
        name: 'Taebrin Oakwind',
        description: 'A wise and powerful Wood Elf Druid',
        creator: 'Preston',
        image: 'https://example.com/taebrin.jpg',
      };
      
      const schema = getCreativeWorkSchema(character);
      
      expect(schema).toMatchSnapshot();
      
      expect(schema['@type']).toBe('CreativeWork');
      expect(schema.name).toBe(character.name);
      expect(schema.creator['@type']).toBe('Person');
    });

    it('includes genre information', () => {
      const character = {
        name: 'Test Character',
        description: 'Test description',
        creator: 'Test Creator',
      };
      
      const schema = getCreativeWorkSchema(character);
      
      expect(schema.genre).toBeDefined();
      expect(schema.genre).toBeInstanceOf(Array);
      expect(schema.genre).toContain('Fantasy');
      expect(schema.genre).toContain('Dungeons & Dragons');
      
      expect(schema).toMatchSnapshot();
    });

    it('links to creative work series', () => {
      const character = {
        name: 'Test',
        description: 'Test',
        creator: 'Test',
      };
      
      const schema = getCreativeWorkSchema(character);
      
      expect(schema.isPartOf).toBeDefined();
      expect(schema.isPartOf['@type']).toBe('CreativeWorkSeries');
      expect(schema.isPartOf.name).toBe('Tales of Aneria');
      
      expect(schema).toMatchSnapshot();
    });

    it('handles missing image', () => {
      const character = {
        name: 'No Image Character',
        description: 'Character without image',
        creator: 'Creator',
      };
      
      const schema = getCreativeWorkSchema(character);
      
      expect(schema).toMatchSnapshot();
      expect(schema.image).toBeUndefined();
    });
  });

  describe('TVSeries Schema', () => {
    it('generates complete TVSeries schema', () => {
      const schema = getTVSeriesSchema({
        name: 'The Forgotten Gods Saga',
        slug: 'forgotten-gods-saga',
        description: 'An epic saga of forgotten deities returning to Aneria',
        startDate: '2024-03-15',
        numberOfEpisodes: 12,
        cast: [{ name: 'Cory Avis' }, { name: 'Preston Farr' }],
      });

      expect(schema).toMatchSnapshot();

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('TVSeries');
      expect(schema.name).toBe('The Forgotten Gods Saga');
      expect(schema.url).toContain('/campaigns/forgotten-gods-saga');
      expect(Array.isArray(schema.actor)).toBe(true);
      expect((schema.actor as Array<{ '@type': string }>)[0]['@type']).toBe('Person');
      expect(schema.genre).toContain('Tabletop RPG');
    });

    it('omits endDate and image when undefined', () => {
      const schema = getTVSeriesSchema({
        name: 'Test',
        slug: 'test',
        description: 'Test',
        startDate: '2024-01-01',
        numberOfEpisodes: 1,
        cast: [],
      });

      expect((schema as Record<string, unknown>).endDate).toBeUndefined();
      expect((schema as Record<string, unknown>).image).toBeUndefined();
    });

    it('includes endDate and image when provided', () => {
      const schema = getTVSeriesSchema({
        name: 'Test',
        slug: 'test',
        description: 'Test',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        numberOfEpisodes: 5,
        cast: [{ name: 'Cast Member' }],
      });

      expect((schema as Record<string, unknown>).endDate).toBe('2024-12-31');
      expect((schema as Record<string, unknown>).image).toBe('https://example.com/thumb.jpg');

      expect(schema).toMatchSnapshot();
    });
  });

  describe('TVEpisode Schema', () => {
    it('generates complete TVEpisode schema with embedded VideoObject', () => {
      const schema = getTVEpisodeSchema({
        campaignName: 'The Forgotten Gods Saga',
        campaignSlug: 'forgotten-gods-saga',
        episodeNumber: 1,
        title: 'Into the Mire',
        summary: 'Our heroes descend into the Mire of Forgotten Names.',
        airDate: '2024-03-15',
        url: 'https://talesofaneria.com/campaigns/forgotten-gods-saga/episodes/1',
        youtubeUrl: 'https://www.youtube.com/watch?v=PLACEHOLDER1',
        thumbnailUrl: 'https://i.ytimg.com/vi/PLACEHOLDER1/hqdefault.jpg',
        duration: 'PT2H15M',
      });

      expect(schema).toMatchSnapshot();

      expect(schema['@type']).toBe('TVEpisode');
      // CAMP-04 required Google fields on the embedded VideoObject
      const video = (schema as Record<string, unknown>).video as Record<string, unknown>;
      expect(video).toBeDefined();
      expect(video['@type']).toBe('VideoObject');
      expect(video.name).toBeTruthy();
      expect(video.thumbnailUrl).toBeTruthy();
      expect(video.uploadDate).toBeTruthy();
    });

    it('partOfSeries references the campaign', () => {
      const schema = getTVEpisodeSchema({
        campaignName: 'Test Saga',
        campaignSlug: 'test-saga',
        episodeNumber: 3,
        title: 'Test Ep',
        summary: 'Test',
        airDate: '2024-01-01',
        url: 'https://talesofaneria.com/campaigns/test-saga/episodes/3',
        youtubeUrl: 'https://www.youtube.com/watch?v=PLACEHOLDER',
      });

      const partOfSeries = (schema as Record<string, unknown>).partOfSeries as Record<string, unknown>;
      expect(partOfSeries['@type']).toBe('TVSeries');
      expect(partOfSeries.name).toBe('Test Saga');
      expect(partOfSeries.url).toContain('/campaigns/test-saga');
    });

    it('omits duration and image when undefined', () => {
      const schema = getTVEpisodeSchema({
        campaignName: 'Test',
        campaignSlug: 'test',
        episodeNumber: 1,
        title: 'Test',
        summary: 'Test',
        airDate: '2024-01-01',
        url: 'https://talesofaneria.com/campaigns/test/episodes/1',
        youtubeUrl: 'https://www.youtube.com/watch?v=PLACEHOLDER',
      });

      expect((schema as Record<string, unknown>).image).toBeUndefined();
      const video = (schema as Record<string, unknown>).video as Record<string, unknown>;
      expect(video.duration).toBeUndefined();
      expect(video.thumbnailUrl).toBeUndefined();
    });
  });

  describe('PodcastEpisode Schema', () => {
    it('generates valid PodcastEpisode schema', () => {
      const schema = getPodcastEpisodeSchema({
        title: 'Ep 1: Into the Mire',
        summary: 'The party descends into the Mire.',
        airDate: '2024-03-15',
        podcastUrl: 'https://anchor.fm/talesofaneria/episodes/ep-1',
        campaignName: 'The Forgotten Gods Saga',
      });

      expect(schema).toMatchSnapshot();

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('PodcastEpisode');
      expect(schema.name).toBe('Ep 1: Into the Mire');
      const associatedMedia = (schema as Record<string, unknown>).associatedMedia as Record<string, unknown>;
      expect(associatedMedia['@type']).toBe('MediaObject');
      expect(associatedMedia.contentUrl).toContain('anchor.fm');
      const partOfSeries = (schema as Record<string, unknown>).partOfSeries as Record<string, unknown>;
      expect(partOfSeries['@type']).toBe('PodcastSeries');
    });
  });

  describe('Schema.org Compliance', () => {
    it('all schemas have @context', () => {
      const schemas = [
        getOrganizationSchema(),
        getWebSiteSchema(),
        getBreadcrumbSchema([{ name: 'Test', url: 'https://test.com' }]),
        getVideoSchema({
          name: 'Test',
          description: 'Test',
          thumbnailUrl: 'https://test.com/thumb.jpg',
          uploadDate: '2024-01-01',
        }),
        getPersonSchema({ name: 'Test' }),
        getCreativeWorkSchema({
          name: 'Test',
          description: 'Test',
          creator: 'Test',
        }),
      ];

      schemas.forEach((schema) => {
        expect(schema['@context']).toBe('https://schema.org');
      });
    });

    it('all schemas have @type', () => {
      const schemas = [
        { schema: getOrganizationSchema(), expectedType: 'Organization' },
        { schema: getWebSiteSchema(), expectedType: 'WebSite' },
        { schema: getBreadcrumbSchema([]), expectedType: 'BreadcrumbList' },
        {
          schema: getVideoSchema({
            name: 'T',
            description: 'T',
            thumbnailUrl: 'https://t.com/t.jpg',
            uploadDate: '2024-01-01',
          }),
          expectedType: 'VideoObject',
        },
        { schema: getPersonSchema({ name: 'T' }), expectedType: 'Person' },
        {
          schema: getCreativeWorkSchema({
            name: 'T',
            description: 'T',
            creator: 'T',
          }),
          expectedType: 'CreativeWork',
        },
      ];

      schemas.forEach(({ schema, expectedType }) => {
        expect(schema['@type']).toBe(expectedType);
      });
    });

    it('schemas are valid JSON', () => {
      const schemas = [
        getOrganizationSchema(),
        getWebSiteSchema(),
        getBreadcrumbSchema([{ name: 'Test', url: 'https://test.com' }]),
        getVideoSchema({
          name: 'Test',
          description: 'Test',
          thumbnailUrl: 'https://test.com/thumb.jpg',
          uploadDate: '2024-01-01',
        }),
        getPersonSchema({ name: 'Test' }),
        getCreativeWorkSchema({
          name: 'Test',
          description: 'Test',
          creator: 'Test',
        }),
      ];

      schemas.forEach((schema) => {
        expect(() => JSON.stringify(schema)).not.toThrow();
        expect(() => JSON.parse(JSON.stringify(schema))).not.toThrow();
      });
    });
  });
});
