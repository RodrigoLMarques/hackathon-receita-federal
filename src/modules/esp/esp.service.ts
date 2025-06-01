import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { HistoryType } from '@prisma/client';
import { createBroker } from 'aedes';
import { randomUUID } from 'crypto';
import { createServer } from 'net';
import { Server as WebSocketServer } from 'ws';
import { ApiService } from '../api/api.service';
import { HistoryEntity } from '../api/models/history.entity';

@Injectable()
export class EspService implements OnModuleInit, OnModuleDestroy {
  private broker: any;
  private mqttServer: any;
  private wsServer: WebSocketServer;
  private readonly logger = new Logger(EspService.name);

  constructor(private readonly apiService: ApiService) {}

  onModuleInit() {
    this.startMqttBroker();
  }

  onModuleDestroy() {
    this.stopMqttBroker();
  }

  private startMqttBroker() {
    this.broker = createBroker();

    this.mqttServer = createServer(this.broker.handle);
    const mqttPort = 1883;
    this.mqttServer.listen(mqttPort, () => {
      this.logger.log(`Broker MQTT rodando na porta TCP ${mqttPort}`);
    });

    const wsPort = 8883;
    this.wsServer = new WebSocketServer({ port: wsPort });
    this.wsServer.on('connection', (wsClient) => {
      const stream = WebSocketServer.createWebSocketStream(wsClient);
      this.broker.handle(stream);
    });
    this.logger.log(`Broker MQTT/WebSocket rodando na porta ${wsPort}`);

    this.broker.on('client', (client) => {
      this.logger.log(`Cliente conectado: ${client.id}`);
    });

    this.broker.on('clientDisconnect', (client) => {
      this.logger.log(`Cliente desconectado: ${client.id}`);
    });

    this.broker.on('publish', (packet, client) => {
      if (client) {
        this.logger.log(
          `Mensagem publicada por ${client.id} no tópico ${packet.topic}: ${packet.payload.toString()}`,
        );

        const payload = packet.payload.toString().split('|');

        const history: HistoryEntity = {
          id: randomUUID(),
          patientId: 'patient-id',
          date: new Date(payload[1]),
          type: payload[0] as HistoryType,
        };

        console.log(history);

        this.apiService.createHistory(history);
      }
    });

    this.broker.on('subscribe', (subscriptions, client) => {
      subscriptions.forEach((sub) => {
        this.logger.log(`Cliente ${client.id} subscreveu no tópico ${sub.topic}`);
      });
    });

    this.broker.on('unsubscribe', (unsubscriptions, client) => {
      unsubscriptions.forEach((topic) => {
        this.logger.log(`Cliente ${client.id} cancelou subscrição no tópico ${topic}`);
      });
    });
  }

  private stopMqttBroker() {
    this.logger.log('Encerrando broker MQTT...');
    this.broker.close(() => {
      this.mqttServer.close();
      this.wsServer.close();
      this.logger.log('Broker MQTT encerrado com sucesso');
    });
  }

  public publish(topic: string, message: string) {
    this.broker.publish(
      {
        topic,
        payload: message,
        qos: 0,
        retain: false,
      },
      (err) => {
        if (err) {
          console.log(message);
          this.logger.error(`Erro ao publicar mensagem: ${err.message}`);
        }
      },
    );
  }
}
