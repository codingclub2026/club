import { Prisma } from '@prisma/client';
import prisma from '../config/db';
import { buildRegistrationNo, extractCourseCode } from '../utils/registrationNo';

type RepairResult = {
  updated: number;
  events: number;
};

const TRANSACTION_OPTIONS = {
  maxWait: 10_000,
  timeout: 120_000,
};

export async function repairRegistrationNumbers(): Promise<RepairResult> {
  return prisma.$transaction(async (tx) => repairRegistrationNumbersInTx(tx), TRANSACTION_OPTIONS);
}

export async function repairRegistrationNumbersInTx(
  tx: Prisma.TransactionClient,
): Promise<RepairResult> {
  const registrations = await tx.registration.findMany({
    where: {
      status: { in: ['confirmed', 'attended'] },
    },
    orderBy: [{ event_id: 'asc' }, { created_at: 'asc' }],
    select: {
      id: true,
      event_id: true,
      course: true,
    },
  });

  if (registrations.length === 0) {
    return { updated: 0, events: 0 };
  }

  // Clear existing numbers first to avoid unique-constraint conflicts during reassignment.
  for (const reg of registrations) {
    await tx.registration.update({
      where: { id: reg.id },
      data: { registration_no: `__REPAIR__${reg.id}` },
    });
  }

  const byEvent = new Map<string, typeof registrations>();
  for (const reg of registrations) {
    const list = byEvent.get(reg.event_id) ?? [];
    list.push(reg);
    byEvent.set(reg.event_id, list);
  }

  let updated = 0;

  for (const [, eventRegs] of byEvent) {
    const byCourse = new Map<string, typeof registrations>();
    for (const reg of eventRegs) {
      const code = extractCourseCode(reg.course ?? undefined);
      const list = byCourse.get(code) ?? [];
      list.push(reg);
      byCourse.set(code, list);
    }

    for (const [courseCode, courseRegs] of byCourse) {
      let seq = 1;
      for (const reg of courseRegs) {
        await tx.registration.update({
          where: { id: reg.id },
          data: { registration_no: buildRegistrationNo(courseCode, seq) },
        });
        seq += 1;
        updated += 1;
      }
    }
  }

  return { updated, events: byEvent.size };
}
