import { getTermDefinition, getTermsByCategory, searchTerms } from '../glossary';

describe('glossary', () => {
  describe('getTermDefinition', () => {
    it('returns definition for known term key', () => {
      const def = getTermDefinition('api');
      expect(def).toBeDefined();
      expect(def?.term).toBe('API');
      expect(def?.definition).toContain('software');
      expect(def?.category).toBe('technical');
    });

    it('normalizes term with spaces to key', () => {
      const def = getTermDefinition('web app');
      expect(def).toBeDefined();
      expect(def?.term).toBe('Web Application');
    });

    it('returns undefined for unknown term', () => {
      expect(getTermDefinition('xyznonexistent')).toBeUndefined();
    });
  });

  describe('getTermsByCategory', () => {
    it('returns array of terms for valid category', () => {
      const terms = getTermsByCategory('technical');
      expect(Array.isArray(terms)).toBe(true);
      expect(terms.every(t => t.category === 'technical')).toBe(true);
    });

    it('returns empty array for category with no terms', () => {
      const terms = getTermsByCategory('general');
      expect(Array.isArray(terms)).toBe(true);
    });
  });

  describe('searchTerms', () => {
    it('finds terms by term name', () => {
      const results = searchTerms('API');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.term.toLowerCase().includes('api'))).toBe(true);
    });

    it('finds terms by definition text', () => {
      const results = searchTerms('waiter');
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns empty array for no match', () => {
      expect(searchTerms('xyznonexistent123')).toEqual([]);
    });
  });
});
