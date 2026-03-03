import { getServiceMapping, getServiceBenefits, getServiceEducationalContent } from '../serviceMapping';

describe('serviceMapping', () => {
  describe('getServiceMapping', () => {
    it('returns mapping for known service id', () => {
      const mapping = getServiceMapping('custom-web-apps');
      expect(mapping).not.toBeNull();
      expect(mapping?.serviceId).toBe('custom-web-apps');
      expect(mapping?.title).toBe('Custom Web Applications');
      expect(mapping?.prePopulatedFields?.projectType).toBe('web-app');
    });

    it('returns null for unknown service id', () => {
      expect(getServiceMapping('unknown-service')).toBeNull();
    });

    it('returns mapping for ecommerce-solutions', () => {
      const mapping = getServiceMapping('ecommerce-solutions');
      expect(mapping?.title).toBe('E-commerce Development');
      expect(mapping?.prePopulatedFields?.paymentProcessing).toBe(true);
    });
  });

  describe('getServiceBenefits', () => {
    it('returns benefits array for known service', () => {
      const benefits = getServiceBenefits('custom-web-apps');
      expect(Array.isArray(benefits)).toBe(true);
      expect(benefits.length).toBeGreaterThan(0);
      expect(benefits[0]).toEqual(expect.any(String));
    });

    it('returns empty array for unknown service', () => {
      expect(getServiceBenefits('unknown')).toEqual([]);
    });
  });

  describe('getServiceEducationalContent', () => {
    it('returns string content for valid step', () => {
      const content = getServiceEducationalContent('custom-web-apps', 2);
      expect(typeof content).toBe('string');
      expect(content?.length).toBeGreaterThan(0);
    });

    it('returns null for unknown service', () => {
      expect(getServiceEducationalContent('unknown', 2)).toBeNull();
    });

    it('returns null for step with no content', () => {
      const content = getServiceEducationalContent('custom-web-apps', 99);
      expect(content).toBeNull();
    });
  });
});
