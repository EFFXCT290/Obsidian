import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    const res = await fetch(`${API_BASE_URL}/admin/overview-stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json({ error: true }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: true }, { status: 500 });
  }
}


