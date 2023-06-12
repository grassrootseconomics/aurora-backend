export type Flip = {
    type: string;
    time: number;
    temp: number;
    ambient: number;
    humidity: number;
};

export type FlipUpdate = Partial<Flip>;
