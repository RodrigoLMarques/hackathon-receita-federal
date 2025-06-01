import { Injectable } from '@nestjs/common';
import { History, HistoryType } from '@prisma/client';
import { DateTime } from 'luxon';
import { prisma } from 'src/config/prisma-client';
import { HistoryEntity } from './models/history.entity';
import { PatientDTO, PatientHistoryDTO } from './models/patient.dto';

@Injectable()
export class ApiService {
  async createHistory(history: HistoryEntity): Promise<void> {
    await prisma.history.create({
      data: history,
    });
  }

  async getPatientData(patientId: string): Promise<PatientDTO> {
    const patient = await prisma.patient.findUnique({
      where: {
        id: patientId,
      },
    });

    const recentHistory = await prisma.history.findMany({
      where: {
        patientId: patientId,
        date: {
          gte: DateTime.now().minus({ days: 1 }).toJSDate(),
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const groupedHistory = this.groupRecentHistory(recentHistory);

    const isEmergency = groupedHistory.some(
      (history) =>
        history.type === HistoryType.LONG &&
        DateTime.fromJSDate(history.date) >= DateTime.now().minus({ minutes: 1 }),
    );

    const isCalled =
      groupedHistory.some(
        (history) =>
          history.type === HistoryType.SHORT &&
          DateTime.fromJSDate(history.date) >= DateTime.now().minus({ minutes: 1 }),
      ) && !isEmergency;

    const lastDiffMinutes = groupedHistory[0]
      ? Math.round(
          DateTime.now().diff(DateTime.fromJSDate(groupedHistory[0].date), 'minutes').minutes,
        )
      : 60 * 24;

    return {
      id: patient.id,
      name: patient.name,
      medicalCondition: patient.medicalCondition,
      observations: patient.observations,
      contactName: patient.contactName,
      contactNumber: patient.contactNumber,
      isEmergency,
      isCalled,
      lastDiffMinutes: lastDiffMinutes,
      history: groupedHistory.map((history) => {
        return {
          id: history.id,
          date: history.date,
          type: history.type,
          status: history.status,
        };
      }),
    };
  }

  groupRecentHistory(historyList: History[]): PatientHistoryDTO[] {
    if (!historyList.length) return [];

    const grouped: PatientHistoryDTO[] = [];
    let i = 0;

    while (i < historyList.length) {
      const current = historyList[i];
      const status = current.type === 'LONG' ? 'Emergência do Paciente' : 'Chamado do Paciente';

      if (i === historyList.length - 1) {
        grouped.push({ ...current, status });
        break;
      }

      const next = historyList[i + 1];
      const timeDiff = Math.abs(
        DateTime.fromJSDate(current.date).diff(DateTime.fromJSDate(next.date), 'seconds').seconds,
      );

      if (timeDiff <= 10) {
        if (current.type === HistoryType.SHORT && next.type === HistoryType.SHORT) {
          grouped.push({
            ...current,
            type: HistoryType.SHORT_SHORT,
            status: 'Chamados consecutivos',
          });
          i += 2;
          continue;
        }

        if (current.type === HistoryType.SHORT && next.type === HistoryType.LONG) {
          grouped.push({
            ...current,
            type: HistoryType.SHORT_LONG,
            status: 'Chamado seguido de emergência',
          });
          i += 2;
          continue;
        }

        if (current.type === HistoryType.LONG && next.type === HistoryType.LONG) {
          grouped.push({
            ...current,
            type: HistoryType.LONG_LONG,
            status: 'Emergências consecutivas',
          });
          i += 2;
          continue;
        }
      }

      grouped.push({ ...current, status });
      i++;
    }

    return grouped;
  }
}
