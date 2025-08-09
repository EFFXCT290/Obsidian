import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization') || request.headers.get('Authorization');
    const headers: HeadersInit = {};
    if (authToken) headers['Authorization'] = authToken;
    const res = await fetch(`${API_BASE_URL}/user/invites`, { headers, cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message || 'Failed to fetch invites' }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization') || request.headers.get('Authorization');
    const headers: HeadersInit = {};
    if (authToken) headers['Authorization'] = authToken;
    const res = await fetch(`${API_BASE_URL}/user/invites`, { method: 'POST', headers });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message || 'Failed to create invite' }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing invite id' }, { status: 400 });
    const authToken = request.headers.get('authorization') || request.headers.get('Authorization');
    const headers: HeadersInit = {};
    if (authToken) headers['Authorization'] = authToken;
    const res = await fetch(`${API_BASE_URL}/user/invites?id=${id}`, { method: 'DELETE', headers });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message || 'Failed to cancel invite' }, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to cancel invite' }, { status: 500 });
  }
}


