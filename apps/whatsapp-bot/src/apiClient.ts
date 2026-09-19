import axios from "axios";

const baseURL = process.env.API_BASE_URL ?? "http://localhost:4000/api";

export const api = axios.create({ baseURL, timeout: 10_000 });
