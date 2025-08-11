import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('Authorization');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = auth;
    const res = await fetch(`${API_BASE_URL}/admin/category`, { headers, cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.message || 'Failed to fetch categories' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('Authorization');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = auth;
    const body = await request.text();
    
    // Check if this is a reorder request
    const bodyData = JSON.parse(body);
    if (bodyData.categories && Array.isArray(bodyData.categories)) {
      // This is a reorder request
      const res = await fetch(`${API_BASE_URL}/admin/category/reorder`, { method: 'POST', headers, body });
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ error: data?.message || 'Failed to reorder categories' }, { status: res.status });
      }
      return NextResponse.json(data);
    } else {
      // This is a create category request
      const res = await fetch(`${API_BASE_URL}/admin/category`, { method: 'POST', headers, body });
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ error: data?.message || 'Failed to create category' }, { status: res.status });
      }
      return NextResponse.json(data);
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
