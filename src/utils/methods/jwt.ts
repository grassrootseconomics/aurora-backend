import { SERVER } from '@/config';
import jwt from 'jsonwebtoken';

export const signJWT = (
    type: string,
    address: string,
    key = '',
    username = '',
    email = ''
): string => {
    const expireTime =
        type === 'REFRESH'
            ? Number(SERVER.REFRESH_TOKEN.EXPIRE_TIME) * 1000
            : Number(SERVER.ACCESS_TOKEN.EXPIRE_TIME) * 1000;
    const timeSinceEpoch = new Date().getTime();
    const expirationTime = timeSinceEpoch + expireTime;
    const expirationTimeInSeconds = Math.floor(expirationTime / 1000);

    try {
        return jwt.sign(
            {
                address,
                key,
                username,
                email,
                type,
            },
            type === 'REFRESH'
                ? SERVER.REFRESH_TOKEN.SECRET
                : SERVER.ACCESS_TOKEN.SECRET,
            {
                issuer:
                    type === 'REFRESH'
                        ? SERVER.REFRESH_TOKEN.ISSUER
                        : SERVER.ACCESS_TOKEN.ISSUER,
                algorithm: 'HS256',
                expiresIn: expirationTimeInSeconds,
            }
        );
    } catch (error) {
        throw error;
    }
};
