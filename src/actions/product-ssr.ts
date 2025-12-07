import axios, { endpoints } from 'src/utils/axios';

export async function getProducts() {
  try {
    const res = await axios.get(endpoints.product.list);
    return res.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data ||
      err?.message ||
      'Failed to load products';

    throw new Error(message);
  }
}

export async function getProduct(id: string) {
  try {
    const URL = id ? `${endpoints.product.details}?productId=${id}` : '';
    const res = await axios.get(URL);
    return res.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data ||
      err?.message ||
      'Failed to load product';

    throw new Error(message);
  }
}
