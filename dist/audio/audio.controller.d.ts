import { HttpStatus } from '@nestjs/common';
import { AudioService } from './audio.service';
export declare class AudioController {
    private readonly audioService;
    private readonly logger;
    constructor(audioService: AudioService);
    uploadAudioFiles(projectDto: string, targetGrpDto: string, files: Express.Multer.File[]): Promise<{
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
    getAudioList(userid?: string): Promise<{
        data: any[];
        message: string;
    }>;
    getAudioDetails(tgId: string, tgName: string): Promise<{
        data: {
            TGId: any;
            TGName: any;
            FilePath: string;
            AudioData: any;
            Summary: any;
            SentimentAnalysis: any;
            vectorId: any;
        } | {
            message: string;
        };
        message: string;
    }>;
}
