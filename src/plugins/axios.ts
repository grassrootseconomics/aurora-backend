import { ODK, WALA } from '@/config';
import axios from 'axios';

export const certAPI = axios.create({
    baseURL: WALA.URL,
});

const prototypeOdkAPI = axios.create({
    baseURL: ODK.API_URL,
});

prototypeOdkAPI.interceptors.request.use(async function (config) {
    config.headers.Authorization = 'Basic ' + ODK.BASIC_AUTH_TOKEN;
    return config;
});

export const odkAPI = prototypeOdkAPI;
