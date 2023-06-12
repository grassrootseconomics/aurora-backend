import { prisma } from '@/db';

/**
 *
 * Fetch the User Emails for a Batch Request.
 *
 * @param {string} codeBatch Code of the Batch.
 * @returns {Promise<string[]>}
 */
export const getBatchRequestUserEmails = async (
    codeBatch: string
): Promise<string[]> => {
    const userProjectEmails = await prisma.user.findMany({
        where: {
            role: {
                name: 'project',
            },
        },
        select: {
            emailAddress: true,
        },
    });

    const associationEmail = await prisma.association.findFirst({
        where: {
            producers: {
                every: {
                    producedPulps: {
                        every: {
                            batchesUsedFor: {
                                every: {
                                    batch: {
                                        code: codeBatch,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        select: {
            emailAddress: true,
        },
    });

    return userProjectEmails
        .concat(associationEmail)
        .map((emailAccount) => emailAccount.emailAddress)
        .filter((email) => email !== null);
};
