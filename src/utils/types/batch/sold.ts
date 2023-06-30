export class BasicSoldBatch {
    batch: string;
    buyer: string;
    destinationCountry: string;
    pricePerKg: number;
    totalPrice: number;
    negociationTerms: string;
    cocoaType: string;

    constructor(batch: string, 
        buyer: string, 
        destinationCountry: string, 
        pricePerKg: number, 
        totalPrice: number, 
        negociationTerms: string,
        cocoaType: string) {
            this.batch = batch;
            this.buyer = buyer;
            this.destinationCountry = destinationCountry;
            this.pricePerKg = pricePerKg;
            this.totalPrice = totalPrice;
            this.negociationTerms = negociationTerms;
            this.cocoaType = cocoaType;
        }
}