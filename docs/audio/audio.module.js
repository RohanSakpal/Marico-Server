"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioModule = void 0;
const common_1 = require("@nestjs/common");
const audio_controller_1 = require("./audio.controller");
const audio_service_1 = require("./audio.service");
const target_entity_1 = require("./entity/target.entity");
const azure_database_1 = require("@nestjs/azure-database");
const project_entity_1 = require("./entity/project.entity");
const config_1 = require("@nestjs/config");
const transcription_entity_1 = require("./entity/transcription.entity");
let AudioModule = class AudioModule {
};
exports.AudioModule = AudioModule;
exports.AudioModule = AudioModule = __decorate([
    (0, common_1.Module)({
        imports: [azure_database_1.AzureCosmosDbModule.forFeature([
                {
                    collection: 'TargetGroups',
                    dto: target_entity_1.TargetGroupEntity
                },
                {
                    collection: 'Projects',
                    dto: project_entity_1.ProjectEntity
                },
                {
                    collection: 'Transcription',
                    dto: transcription_entity_1.TranscriptionEntity
                }
            ]), config_1.ConfigModule.forRoot()],
        controllers: [audio_controller_1.AudioController],
        providers: [audio_service_1.AudioService]
    })
], AudioModule);
//# sourceMappingURL=audio.module.js.map