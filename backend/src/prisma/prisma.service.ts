import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Prisma 6 con engine "library" no expone el evento `beforeExit` en tipos.
    // Cerramos la app cuando Node vaya a salir.
    process.on('beforeExit', () => {
      void app.close();
    });
  }
}

