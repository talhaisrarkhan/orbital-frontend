import axios, { endpoints } from 'src/utils/axios';

export async function getPosts() {
  try {
    const res = await axios.get(endpoints.post.list);
    return res.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data ||
      err?.message ||
      'Failed to load posts';

    throw new Error(message);
  }
}

export async function getPost(title: string) {
  try {
    const URL = title ? `${endpoints.post.details}?title=${title}` : '';
    const res = await axios.get(URL);
    return res.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data ||
      err?.message ||
      'Failed to load post';

    throw new Error(message);
  }
}

export async function getLatestPosts(title: string) {
  try {
    const URL = title ? `${endpoints.post.latest}?title=${title}` : '';
    const res = await axios.get(URL);
    return res.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data ||
      err?.message ||
      'Failed to load latest posts';

    throw new Error(message);
  }
}
