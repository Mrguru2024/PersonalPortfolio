import { getFeatureId, getFeatureDisplayName } from '../featureMapping';

describe('featureMapping', () => {
  describe('getFeatureId', () => {
    it('returns feature id for exact display name', () => {
      expect(getFeatureId('Basic Authentication')).toBe('basic-auth');
      expect(getFeatureId('Payment Processing')).toBe('payment-processing');
    });

    it('returns feature id for alternate display name', () => {
      expect(getFeatureId('Search')).toBe('search-functionality');
      expect(getFeatureId('Admin Panel')).toBe('admin-panel');
    });

    it('returns null for unknown feature name', () => {
      expect(getFeatureId('Unknown Feature')).toBeNull();
    });

    it('is case-insensitive', () => {
      expect(getFeatureId('payment processing')).toBe('payment-processing');
    });
  });

  describe('getFeatureDisplayName', () => {
    it('returns display name for known feature id', () => {
      expect(getFeatureDisplayName('basic-auth')).toBe('Basic Authentication');
      expect(getFeatureDisplayName('payment-processing')).toBe('Payment Processing');
    });

    it('returns formatted fallback for unknown id', () => {
      const result = getFeatureDisplayName('unknown-feature-id');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
