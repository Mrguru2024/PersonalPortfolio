/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

describe('POST /api/assessment', () => {
  it('returns 400 for invalid JSON body', async () => {
    const { POST } = await import('../route');
    const req = new NextRequest('http://localhost/api/assessment', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('returns 400 for empty object (validation failure)', async () => {
    const { POST } = await import('../route');
    const req = new NextRequest('http://localhost/api/assessment', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(data.message || data.details).toBeDefined();
  });

  it('returns 400 for invalid email in payload', async () => {
    const { POST } = await import('../route');
    const invalidPayload = {
      name: 'Jane',
      email: 'not-an-email',
      projectName: 'P',
      projectType: 'web-app',
      projectDescription: 'A'.repeat(50),
      targetAudience: 'A'.repeat(10),
      mainGoals: ['Goal'],
      platform: ['web'],
      mustHaveFeatures: ['Auth'],
    };
    const req = new NextRequest('http://localhost/api/assessment', {
      method: 'POST',
      body: JSON.stringify(invalidPayload),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});
