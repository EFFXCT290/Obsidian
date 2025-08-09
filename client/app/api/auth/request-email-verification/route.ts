import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export async function POST(req: NextRequest) {
  try {
    let auth = req.headers.get('authorization') || '';
    // Fallback: try cookie if header missing
    if (!auth) {
      const cookie = req.cookies.get('authToken')?.value;
      if (cookie) auth = `Bearer ${cookie}`;
    }
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const res = await fetch(`${API_BASE_URL}/auth/request-email-verification`, {
      method: 'POST',
      headers: { Authorization: auth },
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data?.error || 'Failed to request verification email' }, { status: res.status });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to request verification email' }, { status: 500 });
  }
}


