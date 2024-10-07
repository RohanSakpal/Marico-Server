import { ConfigService } from "@nestjs/config";
export interface Document {
    id: string;
    embeding_vector: number[];
    metadata: string;
}
export declare class ChatService {
    private readonly config;
    private readonly logger;
    private azureSearchClient;
    private openaiClientChat;
    constructor(config: ConfigService);
    getTextByVectorId(vectorId: string): Promise<Document | null>;
    generateAnswerFromDocuments(question: string, relatedDocs: Document[]): Promise<string>;
}
