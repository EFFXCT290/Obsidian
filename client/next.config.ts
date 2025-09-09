import type { NextConfig } from "next";

// Helper function to create remote patterns from URL
function createRemotePattern(url: string) {
  try {
    const urlObj = new URL(url);
    const pattern: any = {
      protocol: urlObj.protocol.replace(':', '') as 'http' | 'https',
      hostname: urlObj.hostname,
      pathname: '/files/**',
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
      // Dynamic API domain from environment
      ...(process.env.NEXT_PUBLIC_API_URL ? 
        [createRemotePattern(process.env.NEXT_PUBLIC_API_URL)].filter(Boolean) : []),
      // Dynamic frontend domain from environment
      ...(process.env.NEXTAUTH_URL ? 
        [createRemotePattern(process.env.NEXTAUTH_URL)].filter(Boolean) : []),
    ],
    // Disable image optimization for development and when using external domains
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;
