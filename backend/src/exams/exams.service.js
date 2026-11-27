import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service.js';

const examOrder = ['NSCT', 'MDCAT', 'NAT', 'IELTS'];
const uuid = z.uuid();

@Injectable()
export class ExamsService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async listVariants() {
    const variants = await this.prisma.examVariant.findMany({
      where: {
        isActive: true,
        exam: { isActive: true },
        syllabusVersions: { some: { status: 'published' } },
      },
      select: {
        id: true, code: true, name: true,
        exam: { select: { code: true } },
        syllabusVersions: {
          where: { status: 'published' },
          orderBy: { id: 'asc' },
          select: { id: true, edition: true },
        },
      },
      orderBy: [{ code: 'asc' }, { id: 'asc' }],
    });
    const rank = (code) => {
      const index = examOrder.indexOf(code);
      return index === -1 ? examOrder.length : index;
    };
    // The partial unique index enforces exactly one published edition at most.
    // Exclude a variant rather than guessing if the database is inconsistent.
    return variants.filter(v => v.syllabusVersions.length === 1).map(v => ({
      id: v.id,
      examCode: v.exam.code,
      code: v.code,
      name: v.name,
      activeSyllabusId: v.syllabusVersions[0].id,
      syllabusEdition: v.syllabusVersions[0].edition,
    })).sort((a, b) => rank(a.examCode) - rank(b.examCode));
  }

  async listSubjects(variantId, syllabusVersionId) {
    if (!uuid.safeParse(variantId).success ||
        (syllabusVersionId !== undefined && !uuid.safeParse(syllabusVersionId).success)) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid variant or syllabus UUID' });
    }

    // Published editions only for this initial slice. Archived-edition authorization
    // requires a reviewed access policy and historical attempt support.
    const syllabus = await this.prisma.syllabusVersion.findFirst({
      where: {
        variantId,
        status: 'published',
        ...(syllabusVersionId !== undefined ? { id: syllabusVersionId } : {}),
        variant: { isActive: true, exam: { isActive: true } },
      },
      select: {
        subjects: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: {
            id: true, name: true,
            chapters: {
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
              select: {
                id: true, name: true,
                topics: {
                  orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });
    if (!syllabus) {
      throw new NotFoundException({ code: 'SYLLABUS_NOT_FOUND', message: 'Published syllabus not found' });
    }
    return syllabus.subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      topics: subject.chapters.flatMap(chapter => chapter.topics.map(topic => ({
        id: topic.id, name: topic.name, chapterId: chapter.id, chapterName: chapter.name,
      }))),
    }));
  }
}

Inject(PrismaService)(ExamsService, undefined, 0);
