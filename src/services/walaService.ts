import { certAPI } from '@/plugins/axios';

import ApiError from '@/utils/types/errors/ApiError';

export const getDataByHash = async (certification: string) => {
    try {
        const response = await certAPI.get(`/${certification}`);

        return response.data;
    } catch (err) {
        return undefined;
    }
};

export const sendXMLDataToWala = async (
    data: string
): Promise<string | undefined> => {
    try {
        const response = await certAPI.put(`/`, data, {
            headers: {
                'Content-Type': 'application/xml',
            },
        });
        return response.data;
    } catch (err) {
        console.log(err);
        switch (err.code) {
            default:
                throw new ApiError(500, err.message);
        }
    }
};
