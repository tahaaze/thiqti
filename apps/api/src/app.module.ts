import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VehiclesModule } from "./vehicles/vehicles.module";
import { ReputationModule } from "./reputation/reputation.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || "thiqti",
      password: process.env.DB_PASSWORD || "thiqti_secret",
      database: process.env.DB_NAME || "thiqti",
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== "production",
    }),
    VehiclesModule,
    ReputationModule,
  ],
})
export class AppModule {}
