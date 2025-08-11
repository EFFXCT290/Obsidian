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
    console.log('POST request received at /api/admin/category');
    
    const auth = request.headers.get('Authorization');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = auth;
    
    const body = await request.text();
    console.log('Request body:', body);
    
    // Check the type of request based on body content
    const bodyData = JSON.parse(body);
    console.log('Parsed body data:', bodyData);
    
    if (bodyData.categories && Array.isArray(bodyData.categories)) {
      // This is a reorder request
      console.log('Processing reorder request');
      const res = await fetch(`${API_BASE_URL}/admin/category/reorder`, { method: 'POST', headers, body });
      const data = await res.json();
      if (!res.ok) {
        console.log('Reorder failed:', data);
        return NextResponse.json({ error: data?.message || 'Failed to reorder categories' }, { status: res.status });
      }
      console.log('Reorder success:', data);
      return NextResponse.json(data);
    } else if (bodyData.categoryId && (bodyData.newParentId !== undefined || bodyData.newOrder !== undefined)) {
      // This is a move category request
      console.log('Processing move request to:', `${API_BASE_URL}/admin/category/move`);
      const res = await fetch(`${API_BASE_URL}/admin/category/move`, { method: 'POST', headers, body });
      console.log('Move response status:', res.status);
      const data = await res.json();
      console.log('Move response data:', data);
      if (!res.ok) {
        console.log('Move failed:', data);
        return NextResponse.json({ error: data?.message || 'Failed to move category' }, { status: res.status });
      }
      console.log('Move success:', data);
      return NextResponse.json(data);
    } else {
      // This is a create category request
      console.log('Processing create request');
      const res = await fetch(`${API_BASE_URL}/admin/category`, { method: 'POST', headers, body });
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ error: data?.message || 'Failed to create category' }, { status: res.status });
      }
      return NextResponse.json(data);
    }
  } catch (err) {
    console.error('Error in POST /api/admin/category:', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
