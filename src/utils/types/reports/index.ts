export type MonthlySalesInUSD = { salesInUSD: number }[];

export type MonthlyProductionOfCacao = { [owner: string]: number }[];

export type MonthlyOrganicSoldPrice = { organicSoldPrice: number }[];

export type MonthlySalesInKg = { [owner: string]: number }[];

export type MonthlyPulpCollected = { pulpKg: number }[];

/**
 * Statistics regarding producer data.
 */
export type ProducersStatistics = {
    nrCocoaProducers: number;
    nrYoungMen?: number;
    nrWomen?: number;
    nrMen?: number;
    haCocoa?: number;
    haForestConservation: number;
};

/**
 * Statistics regarding cacao data.
 */
export type CacaoStatistics = {
    kgDryCocoaAvailable: number;
    kgDryCocoaInternationallySold?: number;
};

export type DashboardStatistics = ProducersStatistics &
    Partial<CacaoStatistics>;

/**
 * Specific Report Type visible by Buyers only.
 */
export type BuyerReport = {
    productionByOrigin: MonthlyProductionOfCacao;
    internationalSalesInKg: MonthlySalesInKg;
};

/**
 * Specific Report Type visible by Producers only.
 */
export type ProducerReport = {
    productionOfDryCocoa: MonthlyProductionOfCacao;
    salesInKg: MonthlySalesInKg;
    monthlyCocoaPulp: MonthlyPulpCollected;
    monthlySalesInUSD: MonthlySalesInUSD;
};

/**
 * Specific Report Type visible by Project Users only.
 */
export type ProjectReport = {
    productionOfDryCocoa: MonthlyProductionOfCacao;
    priceOfOrganicCocoa: MonthlyOrganicSoldPrice;
    productionByRegions: MonthlyProductionOfCacao;
    monthlySalesInUSD: MonthlySalesInUSD;
};
