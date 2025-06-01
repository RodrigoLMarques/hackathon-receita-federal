export type PatientHistoryDTO = {
  id: string;
  date: Date;
  type: string;
  status: string;
};

export type PatientDTO = {
  id: string;
  name: string;
  medicalCondition: string;
  observations: string;
  contactName: string;
  contactNumber: string;
  isEmergency: boolean;
  isCalled: boolean;
  lastDiffMinutes: number;
  history: PatientHistoryDTO[];
};
