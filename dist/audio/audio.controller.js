"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AudioController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioController = void 0;
const common_1 = require("@nestjs/common");
const audio_service_1 = require("./audio.service");
const platform_express_1 = require("@nestjs/platform-express");
const utility_1 = require("../utility");
const swagger_1 = require("@nestjs/swagger");
let AudioController = AudioController_1 = class AudioController {
    constructor(audioService) {
        this.audioService = audioService;
        this.logger = new common_1.Logger(AudioController_1.name);
    }
    async uploadAudioFiles(projectDto, targetGrpDto, files) {
        try {
            const projectGroupDto = JSON.parse(projectDto);
            console.log(projectGroupDto, targetGrpDto);
            if (!files || files.length === 0) {
                throw new common_1.HttpException('No files uploaded', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.log(`Received request to upload ${files.length} files for project ${projectGroupDto.ProjName}`);
            const result = await this.audioService.processAudioFiles(projectGroupDto, targetGrpDto, files);
            return {
                statusCode: result.statusCode,
                message: result.message,
                data: result.data,
            };
        }
        catch (error) {
            this.logger.error(`Failed to upload audio files: ${error.message}`);
            throw new common_1.HttpException({
                statusCode: error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message || 'Internal Server Error',
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAudioList(userid) {
        try {
            const audioData = await this.audioService.getAudioData(userid);
            return { data: audioData, message: 'Audio data fetched successfully' };
        }
        catch (error) {
            console.error('Error fetching audio data:', error.message);
            throw new common_1.InternalServerErrorException('Failed to fetch audio data');
        }
    }
    async getAudioDetails(tgId, tgName) {
        try {
            console.log(tgId, tgName);
            const audioDetails = await this.audioService.getAudioDetails(tgId, tgName);
            return { data: audioDetails, message: 'Audio details fetched successfully' };
        }
        catch (error) {
            console.error('Error fetching audio details:', error.message);
            throw new common_1.InternalServerErrorException('Failed to fetch audio details');
        }
    }
};
exports.AudioController = AudioController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload audio files and process them' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files'), utility_1.ParseJsonInterceptor),
    __param(0, (0, common_1.Body)('Project')),
    __param(1, (0, common_1.Body)('TargetGrp')),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array]),
    __metadata("design:returntype", Promise)
], AudioController.prototype, "uploadAudioFiles", null);
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Body)('userid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AudioController.prototype, "getAudioList", null);
__decorate([
    (0, common_1.Get)('details'),
    __param(0, (0, common_1.Query)('tgId')),
    __param(1, (0, common_1.Query)('tgName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AudioController.prototype, "getAudioDetails", null);
exports.AudioController = AudioController = AudioController_1 = __decorate([
    (0, swagger_1.ApiTags)('Audio Management'),
    (0, common_1.Controller)('audio'),
    __metadata("design:paramtypes", [audio_service_1.AudioService])
], AudioController);
//# sourceMappingURL=audio.controller.js.map