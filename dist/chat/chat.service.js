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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const search_documents_1 = require("@azure/search-documents");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const openai_1 = require("openai");
let ChatService = ChatService_1 = class ChatService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(ChatService_1.name);
        try {
            this.azureSearchClient = new search_documents_1.SearchClient(this.config.get('VECTOR_STORE_ADDRESS'), this.config.get('AZURE_INDEX_NAME'), new search_documents_1.AzureKeyCredential(this.config.get('VECTOR_STORE_PASSWORD')));
            const apiKey = this.config.get('AZURE_OPENAI_API_KEY');
            const apiVersion = this.config.get('AZURE_OPEN_AI_VERSION');
            const endpoint = this.config.get('AZURE_OPENAI_ENDPOINT');
            const deploymentCh = this.config.get('AZURE_OPENAI_DEPLOYMENT');
            const optionsCh = {
                endpoint,
                apiKey,
                apiVersion,
                deployment: deploymentCh,
            };
            this.openaiClientChat = new openai_1.AzureOpenAI(optionsCh);
            this.logger.log('Azure Search and OpenAI clients initialized successfully');
        }
        catch (error) {
            this.logger.error('Error initializing Azure Search or OpenAI clients', error.stack);
            throw new common_1.InternalServerErrorException('Failed to initialize external services');
        }
    }
    async getTextByVectorId(vectorId) {
        try {
            this.logger.log(`Fetching document with vector ID: ${vectorId}`);
            const document = await this.azureSearchClient.getDocument(vectorId);
            return document;
        }
        catch (error) {
            this.logger.error(`Error fetching document for vector ID: ${vectorId}`, error.stack);
            if (error.statusCode === 404) {
                return null;
            }
            throw new common_1.InternalServerErrorException('Failed to retrieve document from Azure Search');
        }
    }
    async generateAnswerFromDocuments(question, relatedDocs) {
        if (!relatedDocs || relatedDocs.length === 0) {
            this.logger.warn('No related documents provided to generate the answer');
            return 'Sorry, I could not find enough information to answer your question.';
        }
        const context = relatedDocs.map(doc => doc.metadata).join('\n');
        try {
            this.logger.log('Generating answer from OpenAI based on related documents');
            const completionResponse = await this.openaiClientChat.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant. Use the provided context to answer the question.',
                    },
                    {
                        role: 'user',
                        content: `Context: ${context}\n\nQuestion: ${question}`,
                    },
                ],
            });
            const answer = completionResponse.choices[0].message.content;
            this.logger.log('Answer generated successfully');
            return answer;
        }
        catch (error) {
            this.logger.error('Error generating answer from OpenAI', error.stack);
            throw new common_1.InternalServerErrorException('Failed to generate an answer from OpenAI');
        }
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ChatService);
//# sourceMappingURL=chat.service.js.map