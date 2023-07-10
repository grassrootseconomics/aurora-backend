import { prisma } from '@/db';
import { Department } from '@prisma/client';

import { DepartmentHarvestDate } from '@/utils/types/reports';

/**
 *
 * Fetches every Department from the Department Table.
 *
 * @returns {Promise<Department[]>}
 */
export const getAllDepartments = (): Promise<Department[]> => {
    return prisma.department.findMany();
};

/**
 *
 * Fetches a single Department Record by its Id from the Department Table.
 *
 * @param {number} id Id of the Department.
 * @returns {Promise<Department | null>}
 */
export const getDepartmentById = (id: number): Promise<Department | null> => {
    return prisma.department.findUnique({ where: { id } });
};

export const getDepartmentsByName = (departmentName: string) => {
    return prisma.department.findMany({
        where: {
            name: departmentName,
        },
    });
};

/**
 *
 * Fetch departments by name and map to harvest dates
 *
 * @param {string} departmentName Name of the Department.
 * @returns {Promise<DepartmentHarvestDate[]>} A list of departments and their harvest dates.
 */
export const getDepartmentsHarvestDatesByName = async (
    departmentName: string
): Promise<DepartmentHarvestDate[]> => {
    const departments = await getDepartmentsByName(departmentName);

    return departments.map((dep) => {
        return {
            department: dep.name,
            harvestDate: dep.nextHarvest,
        };
    });
};

type UpdateDepartment = {
    name?: string;
    description?: string;
    nextHarvest?: Date;
};

export const updateDepartment = (
    id: number,
    updatedDepartment: UpdateDepartment
) => {
    return prisma.department.update({
        where: {
            id,
        },
        data: updatedDepartment,
    });
};
