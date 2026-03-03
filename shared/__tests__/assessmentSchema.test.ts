import { projectAssessmentSchema } from '../assessmentSchema';

const validAssessment = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  projectName: 'My App',
  projectType: 'web-app' as const,
  projectDescription: 'A full-stack web application with dashboard, auth, and API integration for our team.',
  targetAudience: 'Internal teams and external partners',
  mainGoals: ['Increase efficiency'],
  platform: ['web' as const],
  mustHaveFeatures: ['User authentication'],
};

describe('projectAssessmentSchema', () => {
  it('accepts valid assessment payload', () => {
    const result = projectAssessmentSchema.safeParse(validAssessment);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Jane Doe');
      expect(result.data.email).toBe('jane@example.com');
      expect(result.data.projectType).toBe('web-app');
    }
  });

  it('rejects name shorter than 2 characters', () => {
    const result = projectAssessmentSchema.safeParse({
      ...validAssessment,
      name: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = projectAssessmentSchema.safeParse({
      ...validAssessment,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects projectDescription shorter than 50 characters', () => {
    const result = projectAssessmentSchema.safeParse({
      ...validAssessment,
      projectDescription: 'Short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty mainGoals', () => {
    const result = projectAssessmentSchema.safeParse({
      ...validAssessment,
      mainGoals: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid projectType', () => {
    const result = projectAssessmentSchema.safeParse({
      ...validAssessment,
      projectType: 'invalid-type',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields when provided', () => {
    const result = projectAssessmentSchema.safeParse({
      ...validAssessment,
      budgetRange: '10k-25k',
      preferredTimeline: '1-3-months',
      newsletter: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.budgetRange).toBe('10k-25k');
      expect(result.data.preferredTimeline).toBe('1-3-months');
      expect(result.data.newsletter).toBe(true);
    }
  });

  it('rejects empty platform array', () => {
    const result = projectAssessmentSchema.safeParse({
      ...validAssessment,
      platform: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty mustHaveFeatures', () => {
    const result = projectAssessmentSchema.safeParse({
      ...validAssessment,
      mustHaveFeatures: [],
    });
    expect(result.success).toBe(false);
  });
});
