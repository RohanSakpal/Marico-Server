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
var ChatController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
let ChatController = ChatController_1 = class ChatController {
    constructor(chatservice) {
        this.chatservice = chatservice;
        this.logger = new common_1.Logger(ChatController_1.name);
    }
    async askQuestionWithVectorId(question, vectorId) {
        if (!question || !vectorId) {
            this.logger.warn('Invalid input: question or vectorId is missing');
            throw new common_1.BadRequestException('Both question and vectorId are required');
        }
        try {
            this.logger.log(`Fetching document for vector ID: ${vectorId}`);
            const document = await this.chatservice.getTextByVectorId(vectorId);
            if (!document) {
                this.logger.warn(`Document not found for vector ID: ${vectorId}`);
                return { question, answer: "I can't assist with that." };
            }
            this.logger.log(`Generating answer for question: "${question}" with vector ID: ${vectorId}`);
            const answer = await this.chatservice.generateAnswerFromDocuments(question, [document]);
            return { question, answer };
        }
        catch (error) {
            this.logger.error('Error processing chat request', error.stack);
            throw new common_1.InternalServerErrorException('An error occurred while processing your request');
        }
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)('chatVectorId'),
    __param(0, (0, common_1.Body)('question')),
    __param(1, (0, common_1.Body)('vectorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "askQuestionWithVectorId", null);
exports.ChatController = ChatController = ChatController_1 = __decorate([
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map