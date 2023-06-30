import { ODK, WALA } from '@/config';
import axios from 'axios';

export const odkAPI = axios.create({
    baseURL: ODK.API_URL,
});

export const certAPI = axios.create({
    baseURL: WALA.URL,
});
