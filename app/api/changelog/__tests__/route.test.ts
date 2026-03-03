/**
 * @jest-environment node
 */
const mockEntries = [
  { id: '1', date: '2024-01-01', title: 'Update', description: 'Changes' },
];

jest.mock('@server/services/githubService', () => ({
  githubService: {
    getChangelogEntries: jest.fn(() => Promise.resolve(mockEntries)),
  },
}));

describe('GET /api/changelog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 and entries array', async () => {
    const { GET } = await import('../route');
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.entries).toEqual(mockEntries);
  });

  it('returns entries array even when getChangelogEntries throws', async () => {
    const { githubService } = await import('@server/services/githubService');
    (githubService.getChangelogEntries as jest.Mock).mockRejectedValueOnce(new Error('API error'));
    const { GET } = await import('../route');
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.entries).toEqual([]);
    expect(data.error).toBeDefined();
  });
});
