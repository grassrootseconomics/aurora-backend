import { SERVER } from '@/config';
import { prisma } from '@/db';
import { Nonce, User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { recoverMessageAddress } from 'viem';

import { generateRandomString } from '@/utils/methods/generators';
import { signJWT } from '@/utils/methods/jwt';
import ApiError from '@/utils/types/errors/ApiError';

/**
 *
 * Creates a new nonce for a user with specified wallet address.
 *
 * If the user does not exist, it will create that user with a Buyers Role as default.
 *
 * @param {string} address Wallet to create Nonce for.
 * @returns {Promise<string>} New Nonce.
 */
export const getNonce = async (address: string): Promise<string> => {
    const user: User = await prisma.user.findUnique({
        where: {
            walletAddress: address,
        },
    });

    if (!user) {
        await prisma.user.create({
            data: {
                walletAddress: address,
            },
        });
    }

    const nonce: string = generateRandomString(20);

    await prisma.nonce.upsert({
        where: {
            userWallet: address,
        },
        update: {
            substance: nonce,
            expiration: new Date(),
        },
        create: {
            substance: nonce,
            expiration: new Date(),
            userWallet: address,
        },
    });

    return nonce;
};

/**
 *
 * Generates a new refresh token for a wallet.
 *
 * Requires a signed nonce to decode and validate for the specified user wallet.
 *
 * @param {string} userWallet User Wallet
 * @param {string} nonce Generated Nonce.
 * @param {string} signature Signed Nonce
 * @returns {Promise<string>} Generated Refresh Token.
 */
export const getRefreshToken = async (
    userWallet: string,
    nonce: string,
    signature: string
): Promise<string> => {
    const user: User = await prisma.user.findUnique({
        where: {
            walletAddress: userWallet,
        },
    });

    if (!user) {
        throw new ApiError(404, 'Incorrect Account!');
    }

    const nonceExists: Nonce = await prisma.nonce.findUnique({
        where: {
            userWallet: userWallet,
        },
    });

    if (!nonceExists) {
        throw new ApiError(404, 'None not Found!');
    }

    // Recover the address from the signature.

    const recoveredAddress = await recoverMessageAddress({
        message: nonce,
        signature: signature as `0x${string}`,
    });

    if (
        recoveredAddress.toString().toLowerCase() !==
        userWallet.toString().toLowerCase()
    ) {
        throw new ApiError(400, 'Incorrect Signature');
    }

    // update the nonce with a new expiration date (refresh token based)
    await prisma.nonce.update({
        where: {
            userWallet,
        },
        data: {
            expiration: new Date(Date.now() + SERVER.REFRESH_TOKEN.EXPIRE_TIME),
        },
    });

    // Return the refresh token
    return signJWT('REFRESH', userWallet, nonce, user.username);
};

/**
 *
 * Generates a new access token for a wallet.
 *
 * Process requires an already generated refresh token for a user wallet.
 *
 * @param {string} refreshToken Generated Refresh Token.
 * @returns {Promise<string>} Generated Access Token.
 */
export const getAccessToken = async (refreshToken: string): Promise<string> => {
    const decoded = jwt.verify(refreshToken, SERVER.REFRESH_TOKEN.SECRET);

    const nonceExists = await prisma.nonce.findFirst({
        where: {
            userWallet: decoded['address'],
            substance: decoded['key'],
        },
    });
    if (!nonceExists || decoded['type'] !== 'REFRESH') {
        throw new ApiError(401, 'Account Unauthorized!');
    }
    const accountExists = await prisma.user.findUnique({
        where: {
            walletAddress: decoded['address'],
        },
    });
    if (!accountExists) {
        throw new ApiError(401, 'Account Does not Exist!');
    }

    return signJWT('ACCESS', decoded['address']);
};
