import { SERVER } from '@/config';
import jwt from 'jsonwebtoken';

/**
 *
 * Signs and creates a jwt token.
 *
 * Parameters are added to the jwt content. These are user details.
 *
 * @param type Type of JWT (REFRESH or ACCESS).
 * @param {string} address User Wallet Address.
 * @param {string} key Nonce or Unique Key.
 * @param {string} name Username or User Name.
 * @param {string} role User Role Title.
 * @returns
 */
export const signJWT = (
    type: 'REFRESH' | 'ACCESS',
    address: string,
    key: string = '',
    name: string = '',
    role: string = 'Buyer'
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
                role,
                name,
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
