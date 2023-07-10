export class BasicAvailableBatch {
    batch: string;
    totalWeight: number;
    cocoaType: string;
    processingDate: string;
    humidity: number;
    grainIndex: number;
    generalSensoryProfile: string;

    constructor(
        batch: string, 
        totalWeight: number, 
        cocoaType: string,
        processingDate: string, 
        humidity: number, 
        grainIndex: number,
        generalSensoryProfile: string) {
            this.batch = batch;
            this.totalWeight = totalWeight;
            this.cocoaType = cocoaType;
            this.processingDate = processingDate;
            this.humidity = humidity;
            this.grainIndex = grainIndex;
            this.generalSensoryProfile = generalSensoryProfile;
        }
}