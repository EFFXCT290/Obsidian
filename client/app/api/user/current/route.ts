import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(req: NextRequest) {
  try {
    // Forward Authorization header from client → backend
    const auth = req.headers.get('authorization') || '';

    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json({ user: data });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}


