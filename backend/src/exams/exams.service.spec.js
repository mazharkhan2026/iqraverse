import { ExamsService } from './exams.service.js';

const variantId = '11111111-1111-4111-8111-111111111111';
const syllabusId = '22222222-2222-4222-8222-222222222222';

describe('ExamsService', () => {
  let prisma;
  let service;
  beforeEach(() => {
    prisma = { examVariant: { findMany: jest.fn() }, syllabusVersion: { findFirst: jest.fn() } };
    service = new ExamsService(prisma);
  });

  it('maps variants to the v3.3 response and requests only active published records', async () => {
    prisma.examVariant.findMany.mockResolvedValue([
      { id: variantId, code: 'IT_GRADUATES', name: 'IT Graduates', exam: { code: 'NSCT' }, syllabusVersions: [{ id: syllabusId, edition: 'annexure-a-v1' }] },
    ]);
    expect(await service.listVariants()).toEqual([
      { id: variantId, code: 'IT_GRADUATES', name: 'IT Graduates', examCode: 'NSCT', activeSyllabusId: syllabusId, syllabusEdition: 'annexure-a-v1' },
    ]);
    expect(prisma.examVariant.findMany.mock.calls[0][0].where).toEqual({
      isActive: true, exam: { isActive: true }, syllabusVersions: { some: { status: 'published' } },
    });
  });

  it('returns chapter information inside topics and scopes the syllabus query', async () => {
    prisma.syllabusVersion.findFirst.mockResolvedValue({ subjects: [{ id: 's', name: 'Databases', chapters: [{ id: 'c', name: 'Competency topics', topics: [{ id: 't', name: 'Advanced SQL' }] }] }] });
    expect(await service.listSubjects(variantId, syllabusId)).toEqual([{ id: 's', name: 'Databases', topics: [{ id: 't', name: 'Advanced SQL', chapterId: 'c', chapterName: 'Competency topics' }] }]);
    expect(prisma.syllabusVersion.findFirst.mock.calls[0][0].where).toEqual({
      variantId, id: syllabusId, status: 'published', variant: { isActive: true, exam: { isActive: true } },
    });
  });

  it('rejects invalid identifiers without querying the database', async () => {
    await expect(service.listSubjects('not-a-uuid')).rejects.toMatchObject({ status: 400 });
    expect(prisma.syllabusVersion.findFirst).not.toHaveBeenCalled();
  });

  it('hides drafts and missing or out-of-scope editions', async () => {
    prisma.syllabusVersion.findFirst.mockResolvedValue(null);
    await expect(service.listSubjects(variantId, syllabusId)).rejects.toMatchObject({ status: 404 });
  });
});
