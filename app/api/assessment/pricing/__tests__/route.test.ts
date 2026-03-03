/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

const mockPricing = {
  subtotal: 10000,
  estimatedRange: { min: 8000, max: 12000, average: 10000 },
  features: [],
  complexity: { level: 'moderate', multiplier: 1, description: 'Standard' },
  timeline: { rush: false, multiplier: 1, description: 'Normal' },
  platform: { platforms: ['web'], price: 0 },
  design: { level: 'modern', price: 2000 },
  integrations: { count: 0, price: 0 },
  marketComparison: { lowEnd: 8000, highEnd: 12000, average: 10000 },
};

jest.mock('@server/services/pricingService', () => ({
  pricingService: {
    calculatePricing: jest.fn(() => mockPricing),
  },
}));

describe('POST /api/assessment/pricing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 and pricing for valid JSON body', async () => {
    const { pricingService } = await import('@server/services/pricingService');
    const { POST } = await import('../route');
    const body = {
      projectType: 'web-app',
      platform: ['web'],
      projectName: 'Test',
      name: 'A',
      email: 'a@b.com',
    };
    const req = new NextRequest('http://localhost/api/assessment/pricing', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.pricing).toBeDefined();
    expect(pricingService.calculatePricing).toHaveBeenCalledWith(body);
  });

  it('returns 500 when calculatePricing throws', async () => {
    const { pricingService } = await import('@server/services/pricingService');
    (pricingService.calculatePricing as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Pricing failed');
    });
    const { POST } = await import('../route');
    const req = new NextRequest('http://localhost/api/assessment/pricing', {
      method: 'POST',
      body: JSON.stringify({ projectType: 'web-app', platform: ['web'] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Failed to calculate pricing');
  });
});
