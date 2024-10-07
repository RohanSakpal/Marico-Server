import { HttpStatus } from '@nestjs/common';
import { Container } from '@azure/cosmos';
import { ConfigService } from '@nestjs/config';
import { ProjectGroupDTO } from './dto/upload-audio.dto';
export declare class AudioService {
    private readonly projectContainer;
    private readonly targetContainer;
    private readonly transcriptContainer;
    private readonly config;
    private readonly logger;
    private blobServiceClient;
    private containerClient;
    constructor(projectContainer: Container, targetContainer: Container, transcriptContainer: Container, config: ConfigService);
    processAudioFiles(projectGrp: ProjectGroupDTO, targetGrp: string, files: Express.Multer.File[]): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: ({
            filename: string;
            requestId: any;
            status: string;
            error?: undefined;
        } | {
            filename: string;
            status: string;
            error: any;
            requestId?: undefined;
        })[];
    }>;
    private createProjectAndTargetGroups;
    runBackgroundTranscription(audioProcessDtoArray: {
        TGId: string;
        TGName: string;
        mainLang: string;
        SecondaryLang: string[];
        noOfSpek: number;
        sasToken: string;
    }[]): void;
    generateBlobSasUrl(fileName: string): Promise<string>;
    getAudioData(userid?: string): Promise<any[]>;
    viewData(TGName: string, TGId: string): Promise<void>;
    getAudioDetails(tgId: string, tgName: string): Promise<{
        TGId: any;
        TGName: any;
        FilePath: string;
        AudioData: any;
        Summary: any;
        SentimentAnalysis: any;
        vectorId: any;
    } | {
        message: string;
    }>;
}
