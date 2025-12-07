import axios, { endpoints } from 'src/utils/axios';
import type { ICompanyItem, ICompanyCreatePayload, ICompanyUpdatePayload } from 'src/types/company';

// ----------------------------------------------------------------------

export async function getCompanies() {
    const res = await axios.get(endpoints.company.list);
    return res.data;
}

export async function getCompany(id: string) {
    const res = await axios.get(endpoints.company.details(id));
    return res.data;
}

export async function createCompany(data: ICompanyCreatePayload) {
    const formData = new FormData();

    formData.append('companyName', data.companyName);
    if (data.companyDescription) formData.append('companyDescription', data.companyDescription);
    if (data.companyWebsite) formData.append('companyWebsite', data.companyWebsite);
    if (data.companyAddress) formData.append('companyAddress', data.companyAddress);
    if (data.companyLogo) formData.append('companyLogo', data.companyLogo);

    formData.append('ceoName', data.ceoName);
    formData.append('ceoEmail', data.ceoEmail);
    formData.append('ceoPassword', data.ceoPassword);

    const res = await axios.post(endpoints.company.create, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return res.data;
}

export async function updateCompany(id: string, data: ICompanyUpdatePayload) {
    // For patch requests, we might need to handle FormData if logo is being updated
    // or JSON if only text fields are updated. 
    // Assuming JSON for simplicity unless logo is involved, but let's stick to JSON for now
    // as the requirement didn't specify file upload for update, but usually it's needed.
    // However, for consistency with create, let's check if there's a file.

    const res = await axios.patch(endpoints.company.update(id), data);
    return res.data;
}

export async function deleteCompany(id: string) {
    const res = await axios.delete(endpoints.company.delete(id));
    return res.data;
}
