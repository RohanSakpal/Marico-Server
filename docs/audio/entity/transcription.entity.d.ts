export declare class TranscriptionEntity {
    TGId: string;
    TGName: string;
    audiodata: AudioData[];
    summary: string;
    sentiment_analysis: string;
    combinedTranslation: string;
    vectorId: string;
}
declare class AudioData {
    speaker: string;
    timestamp: string;
    transcription: string;
    translation: string;
}
export {};
