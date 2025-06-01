import { Controller, Get, Param } from '@nestjs/common';
import { ApiService } from './api.service';
import { PatientDTO } from './models/patient.dto';

@Controller('patient')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get(':patientId')
  async getPatientData(@Param('patientId') patientId: string): Promise<PatientDTO> {
    return await this.apiService.getPatientData(patientId);
  }
}
