// Place this file at backend/prisma/seed-nsct.mjs. Run from backend/.
// Source: supplied four-page NSCT Areas of Competencies, Annexure A.
// Draft catalog only; no copyrighted question bank, mock or official date claims.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const areas = [
  { code: 'NETWORKS_CLOUD', name: 'Computer Networks and Cloud Computing', weight: 10, topics: [
    'Data Communication', 'Computer Networks', 'Data Link Layer', 'Network Layer', 'Transport Layer',
    'Application Layer', 'Wireless Networks', 'Cloud Computing', 'Network Security (Networks Perspective)', 'Next Generation Networks',
  ] },
  { code: 'PROGRAMMING', name: 'Programming (C++/Java/Python)', weight: 10, topics: [
    'Programming Fundamentals', 'Data Types & Variables', 'Operators & Expressions', 'Control Structures',
    'Functions / Methods', 'Input / Output Handling', 'Strings & Text Processing', 'Arrays & Collections',
    'Object-Oriented Programming (OOP)', 'Memory Management Concepts', 'Exception & Error Handling',
    'Modules, Packages & Libraries', 'Advanced Programming Concepts', 'Concurrency & Parallelism (Introductory)',
    'Debugging, Testing & Optimization', 'Software Development Practices',
  ] },
  { code: 'DSA', name: 'Data Structures & Algorithms', weight: 10, topics: [
    'Foundations of Data Structure and Algorithms', 'Linear Data Structures', 'Non-Linear Data Structures',
    'Searching Algorithms', 'Sorting Algorithms', 'Hashing', 'Tree Algorithms', 'Graph Algorithms',
    'Algorithm Design Techniques', 'Advanced Data Structures', 'String Algorithms', 'Complexity & Optimization',
  ] },
  { code: 'OS', name: 'Operating Systems', weight: 5, topics: [
    'Introduction to Operating Systems', 'Operating System Structures', 'Process Management', 'CPU Scheduling',
    'Thread Management', 'Concurrency & Synchronization', 'Deadlocks', 'Memory Management', 'File System Management',
    'Secondary Storage Management', 'Input / Output Systems', 'Protection & Security',
  ] },
  { code: 'SE', name: 'Software Engineering', weight: 10, topics: [
    'Introduction to Software Engineering', 'Software Process Models', 'Agile Software Development',
    'Software Requirements Engineering', 'Software Project Management', 'Software Design', 'Software Architecture',
    'User Interface Design', 'Software Implementation & Coding', 'Software Testing', 'Software Maintenance & Evolution',
    'Software Quality Assurance', 'Software Metrics & Measurement', 'Software Configuration Management',
    'Software Risk Management', 'Software Security Engineering',
  ] },
  { code: 'WEB', name: 'Web Development', weight: 10, topics: [
    'Introduction to Web Development', 'Web Architecture & Protocols', 'HTML Fundamentals', 'CSS Fundamentals',
    'Advanced CSS & Responsive Design', 'JavaScript Fundamentals', 'Advanced JavaScript', 'Frontend Frameworks & Libraries',
    'Backend Development Fundamentals', 'Server-Side Programming', 'Databases for Web Applications', 'Web Security',
    'Web Performance & Optimization', 'Web Testing & Debugging', 'Deployment & Hosting', 'Web APIs & Integration',
    'Modern Web Development Practices',
  ] },
  { code: 'AI_DATA', name: 'AI / Machine Learning and Data Analytics', weight: 10, topics: [
    'Introduction to AI, ML & Data Analytics', 'Mathematical Foundations', 'Python for AI & Data Analytics',
    'Data Collection & Pre-processing', 'Exploratory Data Analysis (EDA)', 'Supervised Learning', 'Ensemble Learning',
    'Unsupervised Learning', 'Model Evaluation & Validation', 'Feature Engineering & Selection', 'Deep Learning Fundamentals',
    'Advanced Deep Learning', 'Natural Language Processing (NLP)', 'Computer Vision', 'Big Data Analytics (Introductory)',
    'Model Deployment & MLOps Basics', 'AI Ethics, Security & Privacy',
  ] },
  { code: 'CYBER', name: 'Cyber Security', weight: 5, topics: [
    'Introduction to Cyber Security', 'Security Fundamentals & Principles', 'Cryptography Basics', 'Network Security',
    'Operating System Security', 'Web Application Security', 'Malware & Attack Techniques', 'Authentication & Access Control',
    'Secure Software Development', 'Wireless & Mobile Security', 'Cloud & Virtualization Security', 'Digital Forensics',
    'Incident Response & Management', 'Security Monitoring & Auditing', 'Cyber Laws & Ethics', 'Emerging Trends in Cyber Security',
  ] },
  { code: 'DATABASES', name: 'Databases', weight: 10, topics: [
    'Introduction to Database Systems', 'Database System Architecture', 'Data Models', 'Relational Database Concepts',
    'Relational Algebra & Calculus', 'Structured Query Language (SQL)', 'Advanced SQL', 'Database Design & Normalization',
    'Transaction Management', 'Concurrency Control', 'Recovery Management', 'Indexing & File Organization',
    'Query Processing & Optimization', 'Database Security', 'Distributed Databases', 'NoSQL & Modern Databases',
    'Data Warehousing & Data Mining (Introductory)',
  ] },
  { code: 'PROBLEM_SOLVING', name: 'Problem Solving And Analytical Skills', weight: 20, topics: [
    'Introduction to Problem Solving', 'Problem Understanding & Analysis', 'Logical Reasoning Fundamentals',
    'Algorithms & Flow Control', 'Data Representation & Abstraction', 'Pattern Recognition & Generalization',
    'Mathematical & Quantitative Reasoning', 'Algorithmic Thinking', 'Critical Thinking & Decision Making',
    'Debugging & Error Analysis', 'Complexity & Efficiency Awareness', 'Problem Solving Using Programming',
    'Data-Driven Problem Solving', 'Creative & Innovative Thinking', 'Real-World Problem Solving',
    'Communication & Documentation of Solutions',
  ] },
];

assert.equal(areas.length, 10);
assert.equal(areas.reduce((sum, area) => sum + area.topics.length, 0), 149);
assert.equal(areas.reduce((sum, area) => sum + area.weight, 0), 100);
assert.equal(new Set(areas.map(area => area.code)).size, 10);
for (const area of areas) assert.equal(new Set(area.topics).size, area.topics.length);

// Local catalog identifiers, not official variant/edition designations.
const edition = 'annexure-a-v1';
const sourceLabel = 'Areas of Competencies for National Skill Competency Test of IT Graduates — Annexure A (4 pages)';

// Validate the transcribed dataset without connecting to the database.
if (process.argv.includes('--check-data')) {
  for (const area of areas) console.log(`${area.code}: ${area.topics.length} topics, ${area.weight}%`);
  console.log('Dataset checks passed: 10 competency areas, 149 topics, 100% weightage.');
} else {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Run from backend/.');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

  // Re-running the script retains UUIDs. Existing differing data is not overwritten.
  async function ensure(model, where, data, label) {
    const existing = await model.findUnique({ where });
    if (!existing) return model.create({ data });
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) continue;
      assert.equal(String(existing[key]), String(value), `${label}: existing ${key} differs; review before editing`);
    }
    return existing;
  }

  async function main() {
    await prisma.$transaction(async (tx) => {
      let exam = await tx.exam.findUnique({ where: { code: 'NSCT' } });
      if (!exam) exam = await tx.exam.create({ data: { code: 'NSCT', name: 'National Skill Competency Test', isActive: false } });
      let variant = await tx.examVariant.findUnique({ where: { examId_code: { examId: exam.id, code: 'IT_GRADUATES' } } });
      if (!variant) variant = await tx.examVariant.create({ data: { examId: exam.id, code: 'IT_GRADUATES', name: 'IT Graduates', isActive: false } });
      const syllabus = await ensure(tx.syllabusVersion,
        { variantId_edition: { variantId: variant.id, edition } },
        { variantId: variant.id, edition, sourceLabel, status: 'draft' }, 'NSCT syllabus');

      for (const [index, area] of areas.entries()) {
        const subject = await ensure(tx.subject,
          { syllabusVersionId_code: { syllabusVersionId: syllabus.id, code: area.code } },
          { syllabusVersionId: syllabus.id, code: area.code, name: area.name, weightage: area.weight, sortOrder: index + 1 }, area.code);
        // The annexure lists areas and topics, not chapters. This is only a UI/database grouping.
        const chapter = await ensure(tx.chapter,
          { subjectId_code: { subjectId: subject.id, code: 'TOPICS' } },
          { subjectId: subject.id, code: 'TOPICS', name: 'Competency topics', sortOrder: 1 }, area.code + ' chapter');
        for (const [i, name] of area.topics.entries()) {
          const code = `${area.code}-${String(i + 1).padStart(2, '0')}`;
          await ensure(tx.topic,
            { chapterId_code: { chapterId: chapter.id, code } },
            { chapterId: chapter.id, code, name, sortOrder: i + 1 }, code);
        }
        assert.equal(await tx.chapter.count({ where: { subjectId: subject.id } }), 1, 'Unexpected chapter count');
        assert.equal(await tx.topic.count({ where: { chapterId: chapter.id } }), area.topics.length, 'Unexpected topic count');
      }
      assert.equal(await tx.subject.count({ where: { syllabusVersionId: syllabus.id } }), 10, 'Unexpected subject count');
      assert.equal(await tx.topic.count({ where: { chapter: { subject: { syllabusVersionId: syllabus.id } } } }), 149, 'Unexpected total topics');
    }, { timeout: 60000 });
    console.log('NSCT draft seed completed: 10 subjects, 10 organizational chapters, 149 topics.');
    console.log('Total weightage: 100%. No questions or mock blueprints published.');
  }

  try { await main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { await prisma.$disconnect(); }
}
