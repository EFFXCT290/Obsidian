import { FastifyRequest } from 'fastify';

/**
 * Extract the real client IP address from various proxy headers
 * Handles Cloudflare, Nginx, and other reverse proxies
 * 
 * @param request Fastify request object
 * @returns The real client IP address
 */
export function extractRealClientIP(request: FastifyRequest): string {
  let clientIP = request.ip;
  
  // Headers to check in order of preference
  const ipHeaders = [
    'cf-connecting-ip',        // Cloudflare
    'x-forwarded-for',         // Standard proxy header
    'x-real-ip',              // Nginx
    'x-client-ip',            // Some proxies
    'x-forwarded',            // Some proxies
    'x-cluster-client-ip',    // Some load balancers
    'forwarded-for',          // Some proxies
    'forwarded'               // RFC 7239
  ];
  
  for (const header of ipHeaders) {
    const headerValue = request.headers[header];
    if (headerValue) {
      let ip: string;
      
      if (Array.isArray(headerValue)) {
        ip = headerValue[0];
      } else {
        ip = headerValue;
      }
      
      // Handle comma-separated IPs (take the first one)
      if (ip.includes(',')) {
        ip = ip.split(',')[0].trim();
      }
      
      // Validate IP format (basic validation)
      if (isValidIP(ip)) {
        clientIP = ip;
        console.log(`[IP Extraction] Using ${header}: ${clientIP}`);
        break;
      }
    }
  }
  
  // Normalize IPv6-mapped IPv4 addresses
  if (clientIP.startsWith('::ffff:')) {
    clientIP = clientIP.substring(7);
  }
  
  console.log(`[IP Extraction] Final client IP: ${clientIP} (original: ${request.ip})`);
  return clientIP;
}

/**
 * Basic IP address validation
 * @param ip IP address to validate
 * @returns true if valid IP format
 */
function isValidIP(ip: string): boolean {
  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 validation (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  // IPv6-mapped IPv4
  const ipv6MappedRegex = /^::ffff:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ipv6MappedRegex.test(ip);
}

/**
 * Check if the request is coming through Cloudflare
 * @param request Fastify request object
 * @returns true if request is from Cloudflare
 */
export function isCloudflareRequest(request: FastifyRequest): boolean {
  return !!(request.headers['cf-connecting-ip'] || request.headers['cf-ray']);
}

/**
 * Get Cloudflare country code if available
 * @param request Fastify request object
 * @returns Country code or null
 */
export function getCloudflareCountry(request: FastifyRequest): string | null {
  const country = request.headers['cf-ipcountry'];
  return country ? (Array.isArray(country) ? country[0] : country) : null;
}
