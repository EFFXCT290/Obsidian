/**
 * API Configuration for Fastify Backend
 * 
 * This file provides a simple API client to connect with the Fastify backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Simple API client for making requests to the Fastify backend
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Make HTTP request with error handling
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Health check endpoint
   */
  async healthCheck() {
    return this.get<{ status: string; timestamp: string; uptime: number; environment: string }>('/health');
  }

  /**
   * Get site statistics
   */
  async getStats() {
    return this.get<{
      totalUsers: number;
      totalTorrents: number;
      totalDownloads: number;
      totalUploadBytes: number;
      totalDownloadsFormatted: string;
      totalUploadFormatted: string;
    }>('/stats');
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types
export interface SiteStats {
  totalUsers: number;
  totalTorrents: number;
  totalDownloads: number;
  totalUploadBytes: number;
  totalDownloadsFormatted: string;
  totalUploadFormatted: string;
}
