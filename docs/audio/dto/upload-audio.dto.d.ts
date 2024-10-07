export declare class TargetGroupDto {
    TGName: string;
    ProjId: string;
    AudioName: string;
    Country: string;
    State: string;
    AgeGrp: string;
    CompetetionProduct: string[];
    MaricoProduct: string[];
    MainLang: string;
    SecondaryLang: string[];
    noOfSpek: number;
    filePath: string;
}
export declare class ProjectGroupDTO {
    ProjName: string;
    userid: string;
    ProjId: string;
    TGIds: string[];
}
export declare class UploadAudioDto {
    ProjectGroupDTO: any;
    TargetGroupDto: any;
}
