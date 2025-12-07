import axios, { endpoints } from 'src/utils/axios';
import type { IUserCreatePayload } from 'src/types/user-management';

// ----------------------------------------------------------------------

export async function getUsers() {
    const res = await axios.get(endpoints.userManagement.list);
    return res.data;
}

export async function createUser(data: IUserCreatePayload) {
    const res = await axios.post(endpoints.userManagement.create, data);
    return res.data;
}

export async function deleteUser(id: string | number) {
    const res = await axios.delete(endpoints.userManagement.delete(id.toString()));
    return res.data;
}

export async function uploadUserCsv(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axios.post(endpoints.userManagement.uploadCsv, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return res.data;
}
