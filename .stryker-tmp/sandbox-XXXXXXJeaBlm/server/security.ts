function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { Express } from 'express';
import validator from 'validator';

/**
 * Configure security middleware for the Express application
 * Following OWASP Top 10:2021 best practices
 */
export function configureSecurity(app: Express) {
  if (stryMutAct_9fa48("0")) {
    {}
  } else {
    stryCov_9fa48("0");
    const isDevelopment = stryMutAct_9fa48("3") ? process.env.NODE_ENV !== 'development' : stryMutAct_9fa48("2") ? false : stryMutAct_9fa48("1") ? true : (stryCov_9fa48("1", "2", "3"), process.env.NODE_ENV === 'development');

    // A02: Cryptographic Failures - Security Headers with Helmet
    app.use(helmet({
      // Content Security Policy - Prevents XSS attacks
      contentSecurityPolicy: {
        directives: {
          defaultSrc: stryMutAct_9fa48("8") ? [] : (stryCov_9fa48("8"), ["'self'"]),
          scriptSrc: stryMutAct_9fa48("10") ? [] : (stryCov_9fa48("10"), ["'self'", "'unsafe-inline'",
          // Required for Vite in development
          "'unsafe-eval'",
          // Required for Vite in development
          "https://www.youtube.com", "https://www.google.com", "https://apis.google.com"]),
          workerSrc: stryMutAct_9fa48("17") ? [] : (stryCov_9fa48("17"), ["'self'", "blob:"]),
          // Required for Vite HMR workers
          styleSrc: stryMutAct_9fa48("20") ? [] : (stryCov_9fa48("20"), ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]),
          fontSrc: stryMutAct_9fa48("24") ? [] : (stryCov_9fa48("24"), ["'self'", "https://fonts.gstatic.com", "data:"]),
          imgSrc: stryMutAct_9fa48("28") ? [] : (stryCov_9fa48("28"), ["'self'", "data:", "https:", "http:" // For external images from YouTube, Etsy, D&D Beyond
          ]),
          connectSrc: stryMutAct_9fa48("33") ? [] : (stryCov_9fa48("33"), ["'self'", "https://www.googleapis.com", "https://openapi.etsy.com", "https://character-service.dndbeyond.com", "wss:" // For WebSocket connections in development
          ]),
          mediaSrc: stryMutAct_9fa48("39") ? [] : (stryCov_9fa48("39"), ["'self'", "https://anchor.fm", "https://*.cloudfront.net", "https://*.spotify.com", "https://*.apple.com", ...(isDevelopment ? stryMutAct_9fa48("45") ? [] : (stryCov_9fa48("45"), ["http://localhost:*", "http://127.0.0.1:*"]) : stryMutAct_9fa48("48") ? ["Stryker was here"] : (stryCov_9fa48("48"), []))]),
          frameSrc: stryMutAct_9fa48("49") ? [] : (stryCov_9fa48("49"), ["'self'", "https://www.youtube.com", "https://open.spotify.com", "https://music.youtube.com"]),
          objectSrc: stryMutAct_9fa48("54") ? [] : (stryCov_9fa48("54"), ["'none'"]),
          upgradeInsecureRequests: (stryMutAct_9fa48("58") ? process.env.NODE_ENV !== 'production' : stryMutAct_9fa48("57") ? false : stryMutAct_9fa48("56") ? true : (stryCov_9fa48("56", "57", "58"), process.env.NODE_ENV === 'production')) ? stryMutAct_9fa48("60") ? ["Stryker was here"] : (stryCov_9fa48("60"), []) : null
        }
      },
      // Strict-Transport-Security - Forces HTTPS (only in production)
      hsts: {
        maxAge: 31536000,
        // 1 year
        includeSubDomains: stryMutAct_9fa48("62") ? false : (stryCov_9fa48("62"), true),
        preload: stryMutAct_9fa48("63") ? false : (stryCov_9fa48("63"), true)
      },
      // X-Frame-Options - Prevents clickjacking
      frameguard: {
        action: 'sameorigin'
      },
      // X-Content-Type-Options - Prevents MIME sniffing
      noSniff: stryMutAct_9fa48("66") ? false : (stryCov_9fa48("66"), true),
      // X-DNS-Prefetch-Control - Controls DNS prefetching
      dnsPrefetchControl: {
        allow: stryMutAct_9fa48("68") ? true : (stryCov_9fa48("68"), false)
      },
      // Referrer-Policy - Controls referrer information
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
      }
    }));

    // A05: Security Misconfiguration - CORS Configuration
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : stryMutAct_9fa48("72") ? [] : (stryCov_9fa48("72"), ['http://localhost:5000', 'http://127.0.0.1:5000']);
    app.use(cors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (stryMutAct_9fa48("76")) {
          {}
        } else {
          stryCov_9fa48("76");
          // Allow requests with no origin (like mobile apps, Postman, or same-origin)
          if (stryMutAct_9fa48("79") ? false : stryMutAct_9fa48("78") ? true : stryMutAct_9fa48("77") ? origin : (stryCov_9fa48("77", "78", "79"), !origin)) return callback(null, stryMutAct_9fa48("80") ? false : (stryCov_9fa48("80"), true));

          // In development, allow all origins
          if (stryMutAct_9fa48("83") ? process.env.NODE_ENV !== 'development' : stryMutAct_9fa48("82") ? false : stryMutAct_9fa48("81") ? true : (stryCov_9fa48("81", "82", "83"), process.env.NODE_ENV === 'development')) {
            if (stryMutAct_9fa48("85")) {
              {}
            } else {
              stryCov_9fa48("85");
              return callback(null, stryMutAct_9fa48("86") ? false : (stryCov_9fa48("86"), true));
            }
          }

          // In production, check against allowed origins
          if (stryMutAct_9fa48("89") ? (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.replit.app')) && origin.endsWith('.repl.co') : stryMutAct_9fa48("88") ? false : stryMutAct_9fa48("87") ? true : (stryCov_9fa48("87", "88", "89"), (stryMutAct_9fa48("91") ? allowedOrigins.indexOf(origin) !== -1 && origin.endsWith('.replit.app') : stryMutAct_9fa48("90") ? false : (stryCov_9fa48("90", "91"), (stryMutAct_9fa48("93") ? allowedOrigins.indexOf(origin) === -1 : stryMutAct_9fa48("92") ? false : (stryCov_9fa48("92", "93"), allowedOrigins.indexOf(origin) !== (stryMutAct_9fa48("94") ? +1 : (stryCov_9fa48("94"), -1)))) || (stryMutAct_9fa48("95") ? origin.startsWith('.replit.app') : (stryCov_9fa48("95"), origin.endsWith('.replit.app'))))) || (stryMutAct_9fa48("97") ? origin.startsWith('.repl.co') : (stryCov_9fa48("97"), origin.endsWith('.repl.co'))))) {
            if (stryMutAct_9fa48("99")) {
              {}
            } else {
              stryCov_9fa48("99");
              callback(null, stryMutAct_9fa48("100") ? false : (stryCov_9fa48("100"), true));
            }
          } else {
            if (stryMutAct_9fa48("101")) {
              {}
            } else {
              stryCov_9fa48("101");
              callback(new Error('Not allowed by CORS'));
            }
          }
        }
      },
      credentials: stryMutAct_9fa48("103") ? false : (stryCov_9fa48("103"), true),
      methods: stryMutAct_9fa48("104") ? [] : (stryCov_9fa48("104"), ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
      allowedHeaders: stryMutAct_9fa48("110") ? [] : (stryCov_9fa48("110"), ['Content-Type', 'Authorization']),
      maxAge: 86400 // 24 hours
    }));

    // A05: Security Misconfiguration - Rate Limiting (DoS Prevention)
    const apiLimiter = rateLimit({
      windowMs: stryMutAct_9fa48("114") ? 15 * 60 / 1000 : (stryCov_9fa48("114"), (stryMutAct_9fa48("115") ? 15 / 60 : (stryCov_9fa48("115"), 15 * 60)) * 1000),
      // 15 minutes
      max: 100,
      // Limit each IP to 100 requests per windowMs
      standardHeaders: stryMutAct_9fa48("116") ? false : (stryCov_9fa48("116"), true),
      // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: stryMutAct_9fa48("117") ? true : (stryCov_9fa48("117"), false),
      // Disable the `X-RateLimit-*` headers
      message: 'Too many requests from this IP, please try again later.',
      // Skip rate limiting in development
      skip: stryMutAct_9fa48("119") ? () => undefined : (stryCov_9fa48("119"), req => stryMutAct_9fa48("122") ? process.env.NODE_ENV !== 'development' : stryMutAct_9fa48("121") ? false : stryMutAct_9fa48("120") ? true : (stryCov_9fa48("120", "121", "122"), process.env.NODE_ENV === 'development'))
    });

    // Apply rate limiting to all API routes
    app.use('/api/', apiLimiter);

    // Stricter rate limiting for potentially expensive operations
    const strictLimiter = rateLimit({
      windowMs: stryMutAct_9fa48("126") ? 15 * 60 / 1000 : (stryCov_9fa48("126"), (stryMutAct_9fa48("127") ? 15 / 60 : (stryCov_9fa48("127"), 15 * 60)) * 1000),
      // 15 minutes
      max: 30,
      // Limit each IP to 30 requests per windowMs
      message: 'Too many requests, please slow down.',
      skip: stryMutAct_9fa48("129") ? () => undefined : (stryCov_9fa48("129"), req => stryMutAct_9fa48("132") ? process.env.NODE_ENV !== 'development' : stryMutAct_9fa48("131") ? false : stryMutAct_9fa48("130") ? true : (stryCov_9fa48("130", "131", "132"), process.env.NODE_ENV === 'development'))
    });

    // Apply strict limiting to external API calls
    app.use('/api/youtube/', strictLimiter);
    app.use('/api/etsy/', strictLimiter);
    app.use('/api/podcast/', strictLimiter);
  }
}

/**
 * A10: Server-Side Request Forgery (SSRF) Protection
 * Validates URLs to prevent SSRF attacks
 */
export function validateUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  if (stryMutAct_9fa48("137")) {
    {}
  } else {
    stryCov_9fa48("137");
    // Check if URL is valid
    if (stryMutAct_9fa48("140") ? false : stryMutAct_9fa48("139") ? true : stryMutAct_9fa48("138") ? validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true
    }) : (stryCov_9fa48("138", "139", "140"), !validator.isURL(url, {
      protocols: stryMutAct_9fa48("142") ? [] : (stryCov_9fa48("142"), ['http', 'https']),
      require_protocol: stryMutAct_9fa48("145") ? false : (stryCov_9fa48("145"), true),
      require_valid_protocol: stryMutAct_9fa48("146") ? false : (stryCov_9fa48("146"), true)
    }))) {
      if (stryMutAct_9fa48("147")) {
        {}
      } else {
        stryCov_9fa48("147");
        return {
          valid: stryMutAct_9fa48("149") ? true : (stryCov_9fa48("149"), false),
          error: 'Invalid URL format'
        };
      }
    }
    try {
      if (stryMutAct_9fa48("151")) {
        {}
      } else {
        stryCov_9fa48("151");
        const parsedUrl = new URL(url);

        // A10: SSRF - Block private/internal IP addresses
        const hostname = stryMutAct_9fa48("152") ? parsedUrl.hostname.toUpperCase() : (stryCov_9fa48("152"), parsedUrl.hostname.toLowerCase());

        // Block localhost
        if (stryMutAct_9fa48("155") ? (hostname === 'localhost' || hostname === '127.0.0.1') && hostname === '::1' : stryMutAct_9fa48("154") ? false : stryMutAct_9fa48("153") ? true : (stryCov_9fa48("153", "154", "155"), (stryMutAct_9fa48("157") ? hostname === 'localhost' && hostname === '127.0.0.1' : stryMutAct_9fa48("156") ? false : (stryCov_9fa48("156", "157"), (stryMutAct_9fa48("159") ? hostname !== 'localhost' : stryMutAct_9fa48("158") ? false : (stryCov_9fa48("158", "159"), hostname === 'localhost')) || (stryMutAct_9fa48("162") ? hostname !== '127.0.0.1' : stryMutAct_9fa48("161") ? false : (stryCov_9fa48("161", "162"), hostname === '127.0.0.1')))) || (stryMutAct_9fa48("165") ? hostname !== '::1' : stryMutAct_9fa48("164") ? false : (stryCov_9fa48("164", "165"), hostname === '::1')))) {
          if (stryMutAct_9fa48("167")) {
            {}
          } else {
            stryCov_9fa48("167");
            return {
              valid: stryMutAct_9fa48("169") ? true : (stryCov_9fa48("169"), false),
              error: 'Access to localhost is not allowed'
            };
          }
        }

        // Block private IP ranges (IPv4)
        const privateIPv4Patterns = stryMutAct_9fa48("171") ? [] : (stryCov_9fa48("171"), [stryMutAct_9fa48("172") ? /10\./ : (stryCov_9fa48("172"), /^10\./), // 10.0.0.0/8
        stryMutAct_9fa48("176") ? /^172\.(1[6-9]|2[0-9]|3[^0-1])\./ : stryMutAct_9fa48("175") ? /^172\.(1[6-9]|2[^0-9]|3[0-1])\./ : stryMutAct_9fa48("174") ? /^172\.(1[^6-9]|2[0-9]|3[0-1])\./ : stryMutAct_9fa48("173") ? /172\.(1[6-9]|2[0-9]|3[0-1])\./ : (stryCov_9fa48("173", "174", "175", "176"), /^172\.(1[6-9]|2[0-9]|3[0-1])\./), // 172.16.0.0/12
        stryMutAct_9fa48("177") ? /192\.168\./ : (stryCov_9fa48("177"), /^192\.168\./), // 192.168.0.0/16
        stryMutAct_9fa48("178") ? /169\.254\./ : (stryCov_9fa48("178"), /^169\.254\./) // 169.254.0.0/16 (link-local)
        ]);
        for (const pattern of privateIPv4Patterns) {
          if (stryMutAct_9fa48("179")) {
            {}
          } else {
            stryCov_9fa48("179");
            if (stryMutAct_9fa48("181") ? false : stryMutAct_9fa48("180") ? true : (stryCov_9fa48("180", "181"), pattern.test(hostname))) {
              if (stryMutAct_9fa48("182")) {
                {}
              } else {
                stryCov_9fa48("182");
                return {
                  valid: stryMutAct_9fa48("184") ? true : (stryCov_9fa48("184"), false),
                  error: 'Access to private IP addresses is not allowed'
                };
              }
            }
          }
        }

        // Block private IPv6 addresses
        if (stryMutAct_9fa48("188") ? hostname.includes(':') || hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80') : stryMutAct_9fa48("187") ? false : stryMutAct_9fa48("186") ? true : (stryCov_9fa48("186", "187", "188"), hostname.includes(':') && (stryMutAct_9fa48("191") ? (hostname.startsWith('fc') || hostname.startsWith('fd')) && hostname.startsWith('fe80') : stryMutAct_9fa48("190") ? true : (stryCov_9fa48("190", "191"), (stryMutAct_9fa48("193") ? hostname.startsWith('fc') && hostname.startsWith('fd') : stryMutAct_9fa48("192") ? false : (stryCov_9fa48("192", "193"), (stryMutAct_9fa48("194") ? hostname.endsWith('fc') : (stryCov_9fa48("194"), hostname.startsWith('fc'))) || (stryMutAct_9fa48("196") ? hostname.endsWith('fd') : (stryCov_9fa48("196"), hostname.startsWith('fd'))))) || (stryMutAct_9fa48("198") ? hostname.endsWith('fe80') : (stryCov_9fa48("198"), hostname.startsWith('fe80'))))))) {
          if (stryMutAct_9fa48("200")) {
            {}
          } else {
            stryCov_9fa48("200");
            return {
              valid: stryMutAct_9fa48("202") ? true : (stryCov_9fa48("202"), false),
              error: 'Access to private IP addresses is not allowed'
            };
          }
        }

        // Block AWS metadata service
        if (stryMutAct_9fa48("206") ? hostname !== '169.254.169.254' : stryMutAct_9fa48("205") ? false : stryMutAct_9fa48("204") ? true : (stryCov_9fa48("204", "205", "206"), hostname === '169.254.169.254')) {
          if (stryMutAct_9fa48("208")) {
            {}
          } else {
            stryCov_9fa48("208");
            return {
              valid: stryMutAct_9fa48("210") ? true : (stryCov_9fa48("210"), false),
              error: 'Access to metadata service is not allowed'
            };
          }
        }
        return {
          valid: stryMutAct_9fa48("213") ? false : (stryCov_9fa48("213"), true)
        };
      }
    } catch (error) {
      if (stryMutAct_9fa48("214")) {
        {}
      } else {
        stryCov_9fa48("214");
        return {
          valid: stryMutAct_9fa48("216") ? true : (stryCov_9fa48("216"), false),
          error: 'Invalid URL'
        };
      }
    }
  }
}

/**
 * A03: Injection - Input validation helper
 * Validates and sanitizes string inputs
 */
export function validateString(input: string, maxLength: number = 1000): {
  valid: boolean;
  error?: string;
  sanitized?: string;
} {
  if (stryMutAct_9fa48("218")) {
    {}
  } else {
    stryCov_9fa48("218");
    if (stryMutAct_9fa48("221") ? typeof input === 'string' : stryMutAct_9fa48("220") ? false : stryMutAct_9fa48("219") ? true : (stryCov_9fa48("219", "220", "221"), typeof input !== 'string')) {
      if (stryMutAct_9fa48("223")) {
        {}
      } else {
        stryCov_9fa48("223");
        return {
          valid: stryMutAct_9fa48("225") ? true : (stryCov_9fa48("225"), false),
          error: 'Input must be a string'
        };
      }
    }
    if (stryMutAct_9fa48("229") ? input.length !== 0 : stryMutAct_9fa48("228") ? false : stryMutAct_9fa48("227") ? true : (stryCov_9fa48("227", "228", "229"), input.length === 0)) {
      if (stryMutAct_9fa48("230")) {
        {}
      } else {
        stryCov_9fa48("230");
        return {
          valid: stryMutAct_9fa48("232") ? true : (stryCov_9fa48("232"), false),
          error: 'Input cannot be empty'
        };
      }
    }
    if (stryMutAct_9fa48("237") ? input.length <= maxLength : stryMutAct_9fa48("236") ? input.length >= maxLength : stryMutAct_9fa48("235") ? false : stryMutAct_9fa48("234") ? true : (stryCov_9fa48("234", "235", "236", "237"), input.length > maxLength)) {
      if (stryMutAct_9fa48("238")) {
        {}
      } else {
        stryCov_9fa48("238");
        return {
          valid: stryMutAct_9fa48("240") ? true : (stryCov_9fa48("240"), false),
          error: `Input exceeds maximum length of ${maxLength} characters`
        };
      }
    }

    // Trim and sanitize
    const sanitized = stryMutAct_9fa48("242") ? validator : (stryCov_9fa48("242"), validator.trim(input));
    const escaped = validator.escape(sanitized);
    return {
      valid: stryMutAct_9fa48("244") ? false : (stryCov_9fa48("244"), true),
      sanitized: escaped
    };
  }
}

/**
 * A03: Injection - Validate numeric input
 */
export function validateNumber(input: any, min: number = 1, max: number = 1000): {
  valid: boolean;
  error?: string;
  value?: number;
} {
  if (stryMutAct_9fa48("245")) {
    {}
  } else {
    stryCov_9fa48("245");
    const num = parseInt(input);
    if (stryMutAct_9fa48("247") ? false : stryMutAct_9fa48("246") ? true : (stryCov_9fa48("246", "247"), isNaN(num))) {
      if (stryMutAct_9fa48("248")) {
        {}
      } else {
        stryCov_9fa48("248");
        return {
          valid: stryMutAct_9fa48("250") ? true : (stryCov_9fa48("250"), false),
          error: 'Input must be a valid number'
        };
      }
    }
    if (stryMutAct_9fa48("254") ? num < min && num > max : stryMutAct_9fa48("253") ? false : stryMutAct_9fa48("252") ? true : (stryCov_9fa48("252", "253", "254"), (stryMutAct_9fa48("257") ? num >= min : stryMutAct_9fa48("256") ? num <= min : stryMutAct_9fa48("255") ? false : (stryCov_9fa48("255", "256", "257"), num < min)) || (stryMutAct_9fa48("260") ? num <= max : stryMutAct_9fa48("259") ? num >= max : stryMutAct_9fa48("258") ? false : (stryCov_9fa48("258", "259", "260"), num > max)))) {
      if (stryMutAct_9fa48("261")) {
        {}
      } else {
        stryCov_9fa48("261");
        return {
          valid: stryMutAct_9fa48("263") ? true : (stryCov_9fa48("263"), false),
          error: `Number must be between ${min} and ${max}`
        };
      }
    }
    return {
      valid: stryMutAct_9fa48("266") ? false : (stryCov_9fa48("266"), true),
      value: num
    };
  }
}

/**
 * A09: Security Logging and Monitoring
 * Logs security-related events
 */
export function logSecurityEvent(event: string, details: Record<string, any>) {
  if (stryMutAct_9fa48("267")) {
    {}
  } else {
    stryCov_9fa48("267");
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      ...details
    };

    // In production, this should integrate with a proper logging service
    console.warn('[SECURITY]', JSON.stringify(logEntry));
  }
}