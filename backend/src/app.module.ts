import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { BatchesModule } from './modules/batches/batches.module';
import { DictionariesModule } from './modules/dictionaries/dictionaries.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProjectImportsModule } from './modules/project-imports/project-imports.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ReviewSchemesModule } from './modules/review-schemes/review-schemes.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { TreeDictionariesModule } from './modules/tree-dictionaries/tree-dictionaries.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('mongo.uri'),
        autoIndex: configService.getOrThrow<boolean>('mongo.autoIndex'),
        serverSelectionTimeoutMS: configService.getOrThrow<number>(
          'mongo.serverSelectionTimeoutMs',
        ),
      }),
    }),
    UsersModule,
    SessionsModule,
    AuthModule,
    BatchesModule,
    DictionariesModule,
    TreeDictionariesModule,
    OrganizationsModule,
    ReviewSchemesModule,
    ProjectsModule,
    ProjectImportsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AllExceptionsFilter],
})
export class AppModule {}
