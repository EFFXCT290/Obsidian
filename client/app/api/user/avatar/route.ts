import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('Authorization');
    const headers: HeadersInit = {};
    if (auth) headers['Authorization'] = auth;
    const formData = await request.formData();
    const res = await fetch(`${API_BASE_URL}/user/avatar`, { method: 'POST', headers, body: formData as any });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message || 'Failed to upload avatar' }, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = request.headers.get('Authorization');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = auth;
    const res = await fetch(`${API_BASE_URL}/user/avatar`, { method: 'DELETE', headers });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message || 'Failed to remove avatar' }, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
  }
}


