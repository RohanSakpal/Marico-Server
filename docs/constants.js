"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SENTIMENT_ANALYSIS = exports.SUMMARY = exports.SENTIMENT_ANALYSIS_PROMPT = exports.SUMMARIZATION_PROMPT_TEMPLATE = void 0;
const SUMMARIZATION_PROMPT_TEMPLATE = (summaryLength, text) => `
  You are an expert summarizer. Your task is to summarize the following text.
  Aim for a summary that is approximately ${summaryLength} words long.
  Incorporate main ideas and essential information by eliminating extraneous language and focusing on critical aspects.
  Identify all the topics or aspects and create a proper and precise conclusion from the discussion.
  Put the clear summary; do not put unconcluded thoughts in the answer.
  
  Here is the text to summarize:
  ${text}
  
  Provide a summary based on the given guidelines.
`;
exports.SUMMARIZATION_PROMPT_TEMPLATE = SUMMARIZATION_PROMPT_TEMPLATE;
const SENTIMENT_ANALYSIS_PROMPT = (text) => `
You are an expert in sentiment analysis. Given multiple sentiment analysis, your task is to 
combine them into a cohesive sentiment analysis for each speaker. Be precise the do not provide 
mixed result give only positive and negative into result, also calculate a NPS score depends on the 
speakers positive and negative points and provide it at speaker level and at overall level.
Provide a overall sentiment and them give a breakdown of speaker level sentiment analysis of the
product feedback  with proper explanation.
                            
Here are the text to combine:
${text}
                              
Sentiment Analysis & NPS Score: 
`;
exports.SENTIMENT_ANALYSIS_PROMPT = SENTIMENT_ANALYSIS_PROMPT;
exports.SUMMARY = "Summary";
exports.SENTIMENT_ANALYSIS = "SA";
//# sourceMappingURL=constants.js.map