import { HistoryType } from '@prisma/client';

export type HistoryEntity = {
  id: string;
  patientId: string;
  date: Date;
  type: HistoryType;
};
