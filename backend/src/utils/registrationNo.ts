export function extractCourseCode(course: string | undefined): string {
  if (!course?.trim()) return 'GEN';

  const normalized = course
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const isBtech = /\bB\s*TECH\b|\bBTECH\b/.test(normalized);
  const isDiploma = /\bDIPLOMA\b/.test(normalized);
  const isCse = /\bCSE\b|\bCOMPUTER SCIENCE\b/.test(normalized);
  const isBca = /\bBCA\b/.test(normalized);

  if (isBtech && isCse) return 'BTCSE';
  if (isDiploma && isCse) return 'DCSE';
  if (isBca) return 'BCA';

  const fallback = normalized
    .replace(/\bB\s*TECH\b|\bBTECH\b|\bDIPLOMA\b/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5);

  return fallback || 'GEN';
}

export function buildRegistrationNo(courseCode: string, sequence: number): string {
  return `RKDF/${courseCode}/${String(sequence).padStart(3, '0')}`;
}

export function getRegistrationPrefix(course: string | undefined): string {
  return `RKDF/${extractCourseCode(course)}/`;
}
