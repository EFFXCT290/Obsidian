import type { NextConfig } from "next";

// Interface for remote pattern configuration
interface RemotePattern {
  protocol: 'http' | 'https';
  hostname: string;
  pathname: string;
  port?: string;
}

// Helper function to create remote patterns from URL
function createRemotePattern(url: string, pathname: string = '/files/**'): RemotePattern | null {
  try {
    const urlObj = new URL(url);
    const pattern: RemotePattern = {
      protocol: urlObj.protocol.replace(':', '') as 'http' | 'https',
      hostname: urlObj.hostname,
      pathname: pathname,
    };
    
    // Only add port if it's not the default port
    if (urlObj.port && 
        !((urlObj.protocol === 'https:' && urlObj.port === '443') || 
          (urlObj.protocol === 'http:' && urlObj.port === '80'))) {
      pattern.port = urlObj.port;
    }
    
    return pattern;
  } catch {
    return null;
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Local development patterns
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/files/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3001',
        pathname: '/files/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      // Dynamic API domain from environment - files
      ...(process.env.NEXT_PUBLIC_API_URL ? 
        [createRemotePattern(process.env.NEXT_PUBLIC_API_URL, '/files/**')].filter((pattern): pattern is RemotePattern => pattern !== null) : []),
      // Dynamic API domain from environment - uploads (avatars, etc.)
      ...(process.env.NEXT_PUBLIC_API_URL ? 
        [createRemotePattern(process.env.NEXT_PUBLIC_API_URL, '/uploads/**')].filter((pattern): pattern is RemotePattern => pattern !== null) : []),
      // Dynamic frontend domain from environment
      ...(process.env.NEXTAUTH_URL ? 
        [createRemotePattern(process.env.NEXTAUTH_URL)].filter((pattern): pattern is RemotePattern => pattern !== null) : []),
    ],
    // Disable image optimization for development and when using external domains
    // Also disable in production if having issues with external image optimization
    unoptimized: process.env.NODE_ENV === 'development' || process.env.DISABLE_IMAGE_OPTIMIZATION === 'true',
  },
};

export default nextConfig;
