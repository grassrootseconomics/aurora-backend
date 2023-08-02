import { prisma } from '@/db';

import whitelist from './data/whitelist.json';

type CreateUserInput = {
    walletAddress: string;
    idRole: number;
    idProducer?: number;
};

export default async () => {
    console.log(`STARTING WHITELISTING PROCESS`);

    const nrUsersToWhitelist = whitelist.length;

    const producersToSeed: CreateUserInput[] = [];

    for (let i = 0; i < nrUsersToWhitelist; i++) {
        const user = whitelist[i];
        const checkExists = await prisma.user.findUnique({
            where: {
                walletAddress: user.walletAddress,
            },
        });
        // We don't seed what already exists
        if (checkExists) continue;
        if (user.producer) {
            // Seeding Association/Producer User
            const producerExists = await prisma.producer.findUnique({
                where: {
                    id: user.producer,
                },
            });

            if (producerExists) {
                producersToSeed.push({
                    walletAddress: user.walletAddress,
                    idRole: 2,
                    idProducer: producerExists.id,
                });
            } else {
                console.log(
                    `WARNING WHITELIST [${user.walletAddress}]: Producer to link to does not exist.`
                );
            }
        } else {
            if (user.role === 'project') {
                producersToSeed.push({
                    walletAddress: user.walletAddress,
                    idRole: 3,
                });
            } else {
                producersToSeed.push({
                    walletAddress: user.walletAddress,
                    idRole: 1,
                });
            }
        }
    }

    const { count } = await prisma.user.createMany({
        data: producersToSeed,
    });

    console.log(`WHITELIST PROCESS FINALE: Successfully Whitelisted ${count}`);

    console.log(`WHITELIST PROCESS ENDED`);
};
