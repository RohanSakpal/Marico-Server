import { ChatService } from "./chat.service";
export declare class ChatController {
    private readonly chatservice;
    private readonly logger;
    constructor(chatservice: ChatService);
    askQuestionWithVectorId(question: string, vectorId: string): Promise<{
        question: string;
        answer: string;
    }>;
}
