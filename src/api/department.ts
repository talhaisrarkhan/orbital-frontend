import useSWR from 'swr';
import { useMemo } from 'react';

import axios, { fetcher, endpoints } from 'src/utils/axios';

import type { IDepartment, IDepartmentCreatePayload } from 'src/types/department';

// ----------------------------------------------------------------------

export function useGetDepartments() {
    const URL = endpoints.department.list;

    const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

    const memoizedValue = useMemo(
        () => ({
            departments: (data as IDepartment[]) || [],
            departmentsLoading: isLoading,
            departmentsError: error,
            departmentsValidating: isValidating,
            departmentsEmpty: !isLoading && !data?.length,
        }),
        [data, error, isLoading, isValidating]
    );

    return memoizedValue;
}

export function useGetDepartment(id: string) {
    const URL = id ? endpoints.department.details(id) : null;

    const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

    const memoizedValue = useMemo(
        () => ({
            department: data as IDepartment,
            departmentLoading: isLoading,
            departmentError: error,
            departmentValidating: isValidating,
        }),
        [data, error, isLoading, isValidating]
    );

    return memoizedValue;
}

// ----------------------------------------------------------------------

export async function createDepartment(payload: IDepartmentCreatePayload) {
    const res = await axios.post(endpoints.department.create, payload);
    return res.data;
}

export async function deleteDepartment(id: string) {
    const res = await axios.delete(endpoints.department.delete(id));
    return res.data;
}

export async function changeDepartmentHead(id: string, headId: string) {
    const res = await axios.patch(endpoints.department.changeHead(id), { headId });
    return res.data;
}
