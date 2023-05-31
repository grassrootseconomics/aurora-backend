import { ODK } from '@/config';
import axios from 'axios';

export const odkAPI = axios.create({
    baseURL: ODK.API_URL,
});
