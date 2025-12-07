import useSWR from 'swr';
import { useMemo } from 'react';

import axios, { fetcher, endpoints } from 'src/utils/axios';

import type { ITeam, ITeamCreatePayload } from 'src/types/team';

// ----------------------------------------------------------------------

export function useGetTeams(departmentId?: string) {
    const URL = departmentId ? `${endpoints.team.list}?departmentId=${departmentId}` : endpoints.team.list;

    const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

    const memoizedValue = useMemo(
        () => ({
            teams: (data as ITeam[]) || [],
            teamsLoading: isLoading,
            teamsError: error,
            teamsValidating: isValidating,
            teamsEmpty: !isLoading && !data?.length,
        }),
        [data, error, isLoading, isValidating]
    );

    return memoizedValue;
}

export function useGetTeam(id: string) {
    const URL = id ? endpoints.team.details(id) : null;

    const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

    const memoizedValue = useMemo(
        () => ({
            team: data as ITeam,
            teamLoading: isLoading,
            teamError: error,
            teamValidating: isValidating,
        }),
        [data, error, isLoading, isValidating]
    );

    return memoizedValue;
}

// ----------------------------------------------------------------------

export async function createTeam(payload: ITeamCreatePayload) {
    const res = await axios.post(endpoints.team.create, payload);
    return res.data;
}

export async function deleteTeam(id: string) {
    const res = await axios.delete(endpoints.team.delete(id));
    return res.data;
}

export async function changeTeamLead(id: string, leadId: string) {
    const res = await axios.patch(endpoints.team.changeLead(id), { leadId });
    return res.data;
}

export async function addTeamMember(id: string, userId: string) {
    const res = await axios.post(endpoints.team.members(id), { userId });
    return res.data;
}

export async function updateTeamMembers(id: string, userIds: string[]) {
    const res = await axios.put(endpoints.team.members(id), { userIds });
    return res.data;
}

export async function removeTeamMember(id: string, userId: string) {
    const res = await axios.delete(endpoints.team.member(id, userId));
    return res.data;
}
