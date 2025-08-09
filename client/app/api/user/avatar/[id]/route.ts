import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = request.headers.get('Authorization');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = auth;

    // Fetch current profile to resolve avatar URL
    const profileRes = await fetch(`${API_BASE_URL}/auth/profile`, { headers, cache: 'no-store' });
    const profile = await profileRes.json();
    if (!profileRes.ok) return NextResponse.json({ error: profile?.message || 'Failed to fetch profile' }, { status: profileRes.status });

    const { id } = await context.params;

    if (!profile?.id || profile.id !== id) {
      // For safety, only allow current user's avatar via this proxy
      return NextResponse.json({ image: '', userId: id });
    }

    const avatarPath: string | undefined = profile.avatarUrl;
    if (!avatarPath) return NextResponse.json({ image: '', userId: id });

    const imgRes = await fetch(`${API_BASE_URL}${avatarPath}`, { cache: 'no-store' });
    if (!imgRes.ok) return NextResponse.json({ image: '', userId: id });
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    return NextResponse.json({ image: base64, contentType, userId: id });
  } catch (err) {
    const { id } = await context.params;
    return NextResponse.json({ image: '', userId: id }, { status: 200 });
  }
}


