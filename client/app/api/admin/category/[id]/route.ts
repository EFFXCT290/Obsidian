import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = request.headers.get('Authorization');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = auth;
    const body = await request.text();
    const res = await fetch(`${API_BASE_URL}/admin/category/${params.id}`, { 
      method: 'PUT', 
      headers, 
      body 
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.message || 'Failed to update category' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = request.headers.get('Authorization');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = auth;
    const res = await fetch(`${API_BASE_URL}/admin/category/${params.id}`, { 
      method: 'DELETE', 
      headers 
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.message || 'Failed to delete category' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
