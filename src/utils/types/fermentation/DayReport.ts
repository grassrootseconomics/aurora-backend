export type DayReport = {
    temperatureMass: number;
    phMass: number;
    phCotiledon: number;
};

export type DayReportUpdate = Partial<DayReport>;
