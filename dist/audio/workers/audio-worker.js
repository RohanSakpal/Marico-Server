"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cosmos_1 = require("@azure/cosmos");
const v2_1 = require("@google-cloud/translate/build/src/v2");
const axios_1 = require("axios");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
const constants_1 = require("../../constants");
const common_1 = require("@nestjs/common");
const search_documents_1 = require("@azure/search-documents");
const logger = new common_1.Logger('Audio-worker');
const configService = new config_1.ConfigService();
const apiKey = configService.get('TRANSALATION_APIKEY');
const endpoint = configService.get('COSMOS_DB_ENDPOINT');
const key = configService.get('COSMOS_DB_KEY');
let azureSearchClient;
const AZURE_OPENAI_ENDPOINT = configService.get('AZURE_OPENAI_ENDPOINT');
const AZURE_OPENAI_API_KEY = configService.get('AZURE_OPENAI_API_KEY');
const AZURE_OPENAI_DEPLOYMENT = configService.get('AZURE_OPENAI_DEPLOYMENT');
const AZURE_OPEN_AI_VERSION = "2024-07-01-preview";
const AZURE_OPENAI_EMBEDDING_MODEL = configService.get('AZURE_OPENAI_EMBEDDING_DEPLOY');
const translateClient = new v2_1.Translate({ key: apiKey });
const client = new cosmos_1.CosmosClient({
    endpoint: endpoint,
    key: key
});
const database = client.database('marico-gpt');
const transcriptionContainer = database.container('Transcription');
process.on('message', async (audioProcessDtoArray) => {
    try {
        logger.log(`Transcription Audio Initializarion`);
        const transcriptionResults = await transcribeAudio(audioProcessDtoArray);
        process.send(transcriptionResults);
        process.exit();
    }
    catch (error) {
        console.error('Error in audio transcription worker:', error.message);
        process.send({ error: error.message });
        process.exit(1);
    }
});
async function transcribeAudio(audioProcessDtoArray) {
    try {
        const transcriptionPromises = audioProcessDtoArray.map(async (audioData) => {
            const { TGId, TGName, sasToken, mainLang, SecondaryLang, noOfSpek } = audioData;
            logger.log(`Transcription Audio Initialization ${TGName}`);
            const transcriptionResult = await transcribe(TGId, TGName, sasToken, mainLang, SecondaryLang, noOfSpek);
            return { TGName, transcriptionResult };
        });
        const transcriptionResults = await Promise.all(transcriptionPromises);
        return transcriptionResults;
    }
    catch (error) {
        console.error('Error in transcribing audio array:', error.message);
        throw new Error('Audio transcription failed.');
    }
}
async function transcribe(tgId, project_name, sas_url, main_language, other_languages, number_of_speakers) {
    logger.log(`Transcription of ${project_name} initiated`);
    try {
        const SUBSCRIPTION_KEY = configService.get('SUBSCRIPTION_KEY');
        const SERVICE_REGION = configService.get('SERVICE_REGION');
        const language_dict = {
            English: 'en-IN',
            Hindi: 'hi-IN',
            Tamil: 'ta-IN',
            Telugu: 'te-IN',
            Marathi: 'mr-IN',
            Kannada: 'kn-IN',
            Malayalam: 'ml-IN',
            Gujarati: 'gu-IN'
        };
        const LOCALE = language_dict[main_language];
        const all_languages = [LOCALE, ...other_languages.map((lang) => language_dict[lang])];
        const apiUrl = `https://${SERVICE_REGION}.api.cognitive.microsoft.com/speechtotext/v3.1/transcriptions`;
        const headers = {
            'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
            'Content-Type': 'application/json',
        };
        const transcriptionRequest = {
            contentUrls: [sas_url],
            properties: {
                diarizationEnabled: true,
                speakers: number_of_speakers,
                candidateLocales: all_languages,
                punctuationMode: 'DictatedAndAutomatic',
                profanityFilterMode: 'Removed',
            },
            locale: LOCALE,
            displayName: project_name,
            description: `Transcription for ${project_name}`,
        };
        logger.log(`Start of transcription process ${project_name} with ID: ${project_name}`);
        const response = await axios_1.default.post(apiUrl, transcriptionRequest, { headers });
        logger.log(`Waiting for response from transcriptionRequest of projectName ${project_name}`);
        const transcriptionUrl = response.headers['location'];
        const transcriptionId = transcriptionUrl.split('/').pop();
        logger.log(`Transcription started for ${project_name} with ID: ${transcriptionId}`);
        return await getTranscriptionResult(transcriptionUrl, headers, project_name, tgId);
    }
    catch (error) {
        console.error(`Error starting transcription for ${project_name}:`, error.message);
        throw new Error(`Transcription failed for ${project_name}.`);
    }
}
async function getTranscriptionResult(transcriptionUrl, headers, project_name, tgId) {
    let isCompleted = false;
    let transcriptionData;
    logger.log(`Getting Transcription for ${transcriptionUrl}`);
    while (!isCompleted) {
        try {
            const statusResponse = await axios_1.default.get(transcriptionUrl, { headers });
            transcriptionData = statusResponse.data;
            if (transcriptionData.status === 'Succeeded') {
                isCompleted = true;
                console.log('Transcription succeeded.');
            }
            else if (transcriptionData.status === 'Failed') {
                throw new Error('Transcription failed.');
            }
            else {
                console.log(`Transcription status: ${transcriptionData.status}. Retrying...`);
                await sleep(30000);
            }
        }
        catch (error) {
            console.error('Error polling transcription status:', error.message);
            throw new Error('Error polling transcription status.');
        }
    }
    logger.log(`Transcription ended with status : ${transcriptionData.status}`);
    const filesUrl = transcriptionData.links.files;
    const resultResponse = await axios_1.default.get(filesUrl, { headers });
    const transcriptionContentUrl = resultResponse.data.values.find((file) => file.kind === 'Transcription').links.contentUrl;
    const transcriptionResult = await axios_1.default.get(transcriptionContentUrl);
    const recognizedPhrases = transcriptionResult.data.recognizedPhrases;
    logger.log(`Transalation started for ${project_name}`);
    let combinedTranslation = "";
    const audioDataArray = await Promise.all(recognizedPhrases.map(async (item) => {
        const displayText = item.nBest && item.nBest[0] ? item.nBest[0].display : '';
        const convTime = item.offset.replace('PT', '').toLowerCase().split('.')[0] + 's';
        try {
            const translatedText = await translateText(displayText);
            return {
                speaker: item.speaker,
                timestamp: convertToTimeFormat(convTime),
                transcription: displayText,
                translation: translatedText
            };
        }
        catch (translateError) {
            console.error('Translation Error:', translateError.message);
            throw new Error('Translation failed.');
        }
    }));
    for (let i = 0; i < audioDataArray.length; i++) {
        combinedTranslation += audioDataArray[i].translation;
    }
    const summaryResponse = await getSummaryAndSentiments(constants_1.SUMMARY, combinedTranslation);
    const sentimentResponse = await getSummaryAndSentiments(constants_1.SENTIMENT_ANALYSIS, combinedTranslation);
    const vectorId = await generateEmbeddings(combinedTranslation);
    const transcriptionDocument = {
        TGName: project_name,
        TGId: tgId,
        audiodata: audioDataArray,
        summary: summaryResponse,
        sentiment_analysis: sentimentResponse,
        combinedTranslation: combinedTranslation,
        vectorId: vectorId
    };
    const response = await saveTranscriptionDocument(transcriptionDocument);
    return response;
}
async function saveTranscriptionDocument(transcriptionDocument) {
    try {
        const response = await transcriptionContainer.items.create(transcriptionDocument);
        if (response.resource) {
            console.log('Document successfully created in Cosmos DB');
        }
        else {
            console.error('Document was not inserted successfully');
        }
        return transcriptionDocument;
    }
    catch (error) {
        console.error('Error inserting document into Cosmos DB:', error.message);
        throw new Error('Failed to insert transcription document.');
    }
}
async function translateText(transcribedText) {
    try {
        const [translatedText] = await translateClient.translate(transcribedText, 'en');
        return translatedText;
    }
    catch (error) {
        console.error('Translation error:', error);
        throw new Error('Failed to translate text');
    }
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function convertToTimeFormat(timeStr) {
    let hours = 0, minutes = 0, seconds = 0;
    if (timeStr.includes('h')) {
        hours = parseInt(timeStr.split('h')[0].replace('PT', ''));
        timeStr = timeStr.split('h')[1];
    }
    if (timeStr.includes('m')) {
        minutes = parseInt(timeStr.split('m')[0]);
        timeStr = timeStr.split('m')[1];
    }
    if (timeStr.includes('s')) {
        seconds = parseInt(timeStr.split('s')[0]);
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
async function getSummaryAndSentiments(purpose, text) {
    const deployment = AZURE_OPENAI_DEPLOYMENT;
    const apiVersion = AZURE_OPEN_AI_VERSION;
    const apiKey = AZURE_OPENAI_API_KEY;
    const endpoint = AZURE_OPENAI_ENDPOINT;
    const options = {
        endpoint,
        apiKey,
        apiVersion,
        deployment: deployment,
    };
    const client2 = new openai_1.AzureOpenAI(options);
    let prompt;
    if (purpose === "Summary") {
        prompt = generateSummarizationPrompt(text);
    }
    else {
        prompt = generateSentimenAnalysisPrompt(text);
    }
    const messages = [
        { role: 'user', content: prompt }
    ];
    try {
        const stream = await client2.chat.completions.create({ messages, model: deployment, max_tokens: 500 });
        const finalSummary = stream.choices[0].message.content;
        return finalSummary;
    }
    catch (error) {
        console.error('Error during API call:', error);
        throw new Error('Failed to get summary from Azure OpenAI');
    }
}
function generateSummarizationPrompt(text) {
    const summaryLength = 500;
    return (0, constants_1.SUMMARIZATION_PROMPT_TEMPLATE)(summaryLength, text);
}
function generateSentimenAnalysisPrompt(text) {
    return (0, constants_1.SENTIMENT_ANALYSIS_PROMPT)(text);
}
async function generateEmbeddings(translation) {
    try {
        const options = {
            endpoint: AZURE_OPENAI_ENDPOINT,
            apiKey: AZURE_OPENAI_API_KEY,
            apiVersion: AZURE_OPEN_AI_VERSION,
            embeddingModel: AZURE_OPENAI_EMBEDDING_MODEL
        };
        const azureOpenAi = new openai_1.AzureOpenAI(options);
        azureSearchClient = new search_documents_1.SearchClient(configService.get('VECTOR_STORE_ADDRESS'), configService.get('AZURE_INDEX_NAME'), new search_documents_1.AzureKeyCredential(configService.get('VECTOR_STORE_PASSWORD')));
        const model = AZURE_OPENAI_EMBEDDING_MODEL;
        const embeddings = await azureOpenAi.embeddings.create({
            input: translation,
            model,
        });
        const embeddingArray = embeddings.data[0].embedding;
        const documents = {
            id: `doc-${Date.now()}`,
            metadata: translation,
            embeding_vector: embeddingArray,
        };
        const uploadResult = await azureSearchClient.uploadDocuments([documents]);
        const vectorId = uploadResult.results[0]?.key;
        return vectorId;
    }
    catch (error) {
        throw new Error(`Embedding generation failed ${error}`);
    }
}
//# sourceMappingURL=audio-worker.js.map