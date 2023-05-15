import { prisma } from '@/db';

import associations from './data/associations.json';
import batches from './data/batches.json';
import departments from './data/departments.json';
import dryingPhases from './data/dryingPhases.json';
import fermentationPhases from './data/fermentationPhases.json';
import fermentationFlips from './data/flips.json';
import producerBatches from './data/producerBatches.json';
import producers from './data/producers.json';
import pulpBatches from './data/pulpBatches.json';
import pulps from './data/pulps.json';
import sales from './data/sales.json';
import storages from './data/storages.json';

// This needs some automation
// Possibly via an ordered array of collection names
// and parsing the data folder contents with the help of the array.
const main = async () => {
    console.log(`STARTING SEEDING PROCESS`);
    const associationsSeeded = await prisma.association.count();
    if (associationsSeeded === 0) {
        console.log(`Seeding Associations!`);
        await prisma.association.createMany({ data: associations });
        console.log(`Complete!`);
    }
    const departmentsSeeded = await prisma.department.count();
    if (departmentsSeeded === 0) {
        console.log(`Seeding Departments!`);
        await prisma.department.createMany({ data: departments });
        console.log(`Complete!`);
    }
    const batchesSeeded = await prisma.batch.count();
    if (batchesSeeded === 0) {
        console.log(`Seeding Batches!`);
        await prisma.batch.createMany({ data: batches });
        console.log(`Complete!`);
    }
    const salesSeeded = await prisma.sale.count();
    if (salesSeeded === 0) {
        console.log(`Seeding Sales!`);
        await prisma.sale.createMany({ data: sales });
        console.log(`Complete!`);
    }
    const storagesSeeded = await prisma.storage.count();
    if (storagesSeeded === 0) {
        console.log(`Seeding Storage!`);
        await prisma.storage.createMany({ data: storages });
        console.log(`Complete!`);
    }
    const dryingPhasesSeeded = await prisma.dryingPhase.count();
    if (dryingPhasesSeeded === 0) {
        console.log(`Seeding Drying Phases!`);
        await prisma.dryingPhase.createMany({ data: dryingPhases });
        console.log(`Complete!`);
    }
    const fermentationPhasesSeeded = await prisma.fermentationPhase.count();
    if (fermentationPhasesSeeded === 0) {
        console.log(`Seeding Fermentation Phases!`);
        await prisma.fermentationPhase.createMany({ data: fermentationPhases });
        console.log(`Complete!`);
    }
    const fermentationFlipsSeeded = await prisma.fermentationFlip.count();
    if (fermentationFlipsSeeded === 0) {
        console.log(`Seeding Fermentation Phases Flips!`);
        await prisma.fermentationFlip.createMany({ data: fermentationFlips });
        console.log(`Complete!`);
    }
    const producersSeeded = await prisma.producer.count();
    if (producersSeeded === 0) {
        console.log(`Seeding Producers!`);
        await prisma.producer.createMany({ data: producers });
        console.log(`Complete!`);
    }
    const pulpsSeeded = await prisma.pulp.count();
    if (pulpsSeeded === 0) {
        console.log(`Seeding Pulps!`);
        await prisma.pulp.createMany({ data: pulps });
        console.log(`Complete!`);
    }
    const producerBatchesSeeded = await prisma.producersBatch.count();
    if (producerBatchesSeeded === 0) {
        console.log(`Seeding Links between Producers & Batches!`);
        await prisma.producersBatch.createMany({ data: producerBatches });
        console.log(`Complete!`);
    }
    const pulpBatchesSeeded = await prisma.pulpBatch.count();
    if (pulpBatchesSeeded === 0) {
        console.log(`Seeding Links between Pulp & Batches!`);
        await prisma.pulpBatch.createMany({ data: pulpBatches });
        console.log(`Complete!`);
    }
    console.log(`SEEDING PROCESS ENDED SUCCESSFULLY!`);
};

main();
