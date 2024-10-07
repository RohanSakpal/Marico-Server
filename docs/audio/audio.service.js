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
var AudioService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioService = void 0;
const common_1 = require("@nestjs/common");
const azure_database_1 = require("@nestjs/azure-database");
const cosmos_1 = require("@azure/cosmos");
const storage_blob_1 = require("@azure/storage-blob");
const config_1 = require("@nestjs/config");
const project_entity_1 = require("./entity/project.entity");
const target_entity_1 = require("./entity/target.entity");
const child_process_1 = require("child_process");
const path_1 = require("path");
const transcription_entity_1 = require("./entity/transcription.entity");
const nanoid_1 = require("nanoid");
let AudioService = AudioService_1 = class AudioService {
    constructor(projectContainer, targetContainer, transcriptContainer, config) {
        this.projectContainer = projectContainer;
        this.targetContainer = targetContainer;
        this.transcriptContainer = transcriptContainer;
        this.config = config;
        this.logger = new common_1.Logger(AudioService_1.name);
        this.blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(this.config.get('AZURE_STORAGE_CONNECTION_STRING'));
        this.containerClient = this.blobServiceClient.getContainerClient(this.config.get('AUDIO_UPLOAD_BLOB_CONTAINER'));
    }
    async processAudioFiles(projectGrp, targetGrp, files) {
        try {
            const sasUrls = [];
            const uploadPromises = files.map(async (file) => {
                try {
                    const blockBlobClient = this.containerClient.getBlockBlobClient(file.originalname);
                    const uploadBlobResponse = await blockBlobClient.uploadData(file.buffer);
                    this.logger.log(`Blob ${file.originalname} uploaded successfully: ${uploadBlobResponse.requestId}`);
                    const sasUri = blockBlobClient.url;
                    const fileName = file.originalname;
                    this.generateBlobSasUrl(file.originalname)
                        .then((sasToken) => {
                        sasUrls.push({
                            fileName,
                            sasUri, sasToken
                        });
                    });
                    return {
                        filename: file.originalname,
                        requestId: uploadBlobResponse.requestId,
                        status: 'success',
                    };
                }
                catch (uploadError) {
                    this.logger.error(`Failed to upload blob ${file.originalname}: ${uploadError.message}`);
                    return {
                        filename: file.originalname,
                        status: 'failed',
                        error: uploadError.message,
                    };
                }
            });
            const uploadResults = await Promise.all(uploadPromises);
            const finalResult = await this.createProjectAndTargetGroups(projectGrp, targetGrp, sasUrls);
            if (finalResult) {
                return {
                    statusCode: common_1.HttpStatus.CREATED,
                    message: 'Project and target groups created successfully',
                    data: uploadResults,
                };
            }
            else {
                throw new common_1.InternalServerErrorException('Failed to create project and target groups');
            }
        }
        catch (error) {
            this.logger.error(`Failed to process audio files: ${error.message}`);
            throw new common_1.InternalServerErrorException('Error processing audio files');
        }
    }
    async createProjectAndTargetGroups(project, targetGrp, sasUrls) {
        try {
            const projectName = {
                ProjId: project.ProjId,
                ProjName: project.ProjName,
                UserId: project.userid,
                TGIds: project.TGIds,
            };
            const audioProcessDtoArray = [];
            const projectResponse = await this.projectContainer.items.create(projectName);
            this.logger.log(`Project ${projectName.ProjName} created with ID ${projectName.ProjId}`);
            const targetGrpArray = Object.values(targetGrp);
            for (const group of targetGrpArray) {
                const groupObj = typeof group === 'string' ? JSON.parse(group) : group;
                const matchingSasUrl = sasUrls.find((sasUrl) => sasUrl.fileName.split('.')[0] === groupObj.TGName);
                const targetGroupEntity = {
                    TGId: (0, nanoid_1.nanoid)(),
                    TGName: groupObj.TGName,
                    ProjId: groupObj.ProjId,
                    AudioName: groupObj.AudioName,
                    Country: groupObj.Country,
                    State: groupObj.State,
                    AgeGrp: groupObj.AgeGrp,
                    CompetetionProduct: groupObj.CompetetionProduct,
                    MaricoProduct: groupObj.MaricoProduct,
                    MainLang: groupObj.MainLang,
                    SecondaryLang: groupObj.SecondaryLang,
                    noOfSpek: groupObj.noOfSpek,
                    filePath: matchingSasUrl.sasUri,
                    status: 0
                };
                await this.targetContainer.items.create(targetGroupEntity);
                audioProcessDtoArray.push({
                    TGId: targetGroupEntity.TGId,
                    TGName: groupObj.TGName,
                    mainLang: groupObj.MainLang,
                    SecondaryLang: groupObj.SecondaryLang,
                    noOfSpek: groupObj.noOfSpek,
                    sasToken: matchingSasUrl.sasToken
                });
                this.logger.log(`Target group ${targetGroupEntity.TGName} created and linked to project ${projectName.ProjName}`);
            }
            this.logger.log(`Starting Audio transcibe ${projectName.ProjName}`);
            this.runBackgroundTranscription(audioProcessDtoArray);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to create project and target groups: ${error.message}`);
            throw new common_1.InternalServerErrorException('Error creating project and target groups');
        }
    }
    runBackgroundTranscription(audioProcessDtoArray) {
        const child = (0, child_process_1.fork)((0, path_1.join)(__dirname, '../../dist/audio/workers/audio-worker.js'));
        child.send(audioProcessDtoArray);
        child.on('message', (result) => {
            console.log('Received transcription result from worker:', result);
        });
        child.on('exit', (code) => {
            console.log(`Child process exited with code ${code}`);
        });
    }
    generateBlobSasUrl(fileName) {
        const sharedKeyCredential = new storage_blob_1.StorageSharedKeyCredential(this.config.get('BLOB_CONTAINER_ACCOUNT'), this.config.get('BLOB_CONTAINER_ACCOUNT_KEY'));
        const permissions = new storage_blob_1.BlobSASPermissions();
        permissions.read = true;
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 10);
        const sasToken = (0, storage_blob_1.generateBlobSASQueryParameters)({
            containerName: this.containerClient.containerName,
            blobName: fileName,
            permissions: permissions,
            expiresOn: expiryDate,
        }, sharedKeyCredential).toString();
        const blobUrl = `${this.containerClient.url}/${fileName}?${sasToken}`;
        this.logger.log(`Generated SAS URL for blob: ${blobUrl}`);
        return Promise.resolve(blobUrl);
    }
    async getAudioData(userid) {
        try {
            let querySpecProject;
            if (userid) {
                querySpecProject = {
                    query: 'SELECT * FROM c WHERE c.userid = @userid',
                    parameters: [{ name: '@userid', value: userid }],
                };
            }
            else {
                querySpecProject = {
                    query: 'SELECT * FROM c',
                };
            }
            const { resources: projects } = await this.projectContainer.items.query(querySpecProject).fetchAll();
            if (projects.length === 0) {
                return [];
            }
            const combinedResults = [];
            for (const project of projects) {
                const projId = project.ProjId;
                const querySpecTarget = {
                    query: 'SELECT * FROM c WHERE c.ProjId = @ProjId',
                    parameters: [{ name: '@ProjId', value: projId }],
                };
                const { resources: targets } = await this.targetContainer.items.query(querySpecTarget).fetchAll();
                for (const target of targets) {
                    combinedResults.push({
                        ProjectName: project.ProjName,
                        Country: target.Country,
                        State: target.State,
                        TargetGroup: target.TGName,
                        TargetId: target.TGId,
                        AgeGroup: target.AgeGrp,
                        CompetitorGroup: target.CompetetionProduct,
                        MaricoProduct: target.MaricoProduct,
                        Status: target.status === 0 ? 'Processing' : target.status === 1 ? 'Completed' : target.status === 2 ? 'Failed' : 'Unknown'
                    });
                }
            }
            return combinedResults;
        }
        catch (error) {
            console.error('Error fetching audio data:', error.message);
            throw new common_1.InternalServerErrorException('Failed to fetch audio data');
        }
    }
    async viewData(TGName, TGId) {
    }
    async getAudioDetails(tgId, tgName) {
        try {
            const querySpecTarget = {
                query: 'SELECT * FROM c WHERE c.TGName = @TGName',
                parameters: [
                    { name: '@TGName', value: tgName },
                ],
            };
            const { resources: targetData } = await this.targetContainer.items
                .query(querySpecTarget)
                .fetchAll();
            this.logger.log(`Fetching details for  ${tgId} and ${tgName} `);
            if (targetData.length === 0) {
                return { message: 'Target data not found' };
            }
            const targetItem = targetData[0];
            const querySpecTranscription = {
                query: 'SELECT * FROM c WHERE c.TGId = @TGId AND c.TGName = @TGName',
                parameters: [
                    { name: '@TGId', value: tgId },
                    { name: '@TGName', value: tgName },
                ],
            };
            const { resources: transcriptionData } = await this.transcriptContainer.items
                .query(querySpecTranscription)
                .fetchAll();
            this.logger.log(`Fetching transcription data for  ${tgId} and ${tgName} `);
            if (transcriptionData.length === 0) {
                return { message: 'Transcription data not found' };
            }
            const transcriptionItem = transcriptionData[0];
            this.logger.log(`Combining transcription data for  ${tgId} and ${tgName} `);
            const filenameurl = await this.generateBlobSasUrl(targetItem.filePath.substring(targetItem.filePath.lastIndexOf('/') + 1));
            const combinedData = {
                TGId: targetItem.TGId,
                TGName: targetItem.TGName,
                FilePath: filenameurl,
                AudioData: transcriptionItem.audiodata,
                Summary: transcriptionItem.summary,
                SentimentAnalysis: transcriptionItem.sentiment_analysis,
                vectorId: transcriptionItem.vectorId
            };
            return combinedData;
        }
        catch (error) {
            console.error('Error fetching audio details:', error.message);
            throw new common_1.InternalServerErrorException('Failed to fetch audio details');
        }
    }
};
exports.AudioService = AudioService;
exports.AudioService = AudioService = AudioService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, azure_database_1.InjectModel)(project_entity_1.ProjectEntity)),
    __param(1, (0, azure_database_1.InjectModel)(target_entity_1.TargetGroupEntity)),
    __param(2, (0, azure_database_1.InjectModel)(transcription_entity_1.TranscriptionEntity)),
    __metadata("design:paramtypes", [cosmos_1.Container,
        cosmos_1.Container,
        cosmos_1.Container,
        config_1.ConfigService])
], AudioService);
//# sourceMappingURL=audio.service.js.map