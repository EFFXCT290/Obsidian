import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('Authorization');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = auth;
    const body = await request.text();
    const res = await fetch(`${API_BASE_URL}/admin/smtp/test`, { method: 'POST', headers, body });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data?.message || 'Failed to send SMTP test' }, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to send SMTP test' }, { status: 500 });
  }
}


