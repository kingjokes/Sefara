import axios from "axios";
import ToastMessage from "./toastMessage";

export const baseURL = `http://localhost:4000/api/`;

export const postRequest = async (endpoint, payload) => {
  try {
    return await axios.post(`${baseURL}${endpoint}`, payload, {});
  } catch (e) {
    console.log(e);
    return ToastMessage("error", e?.response?.data?.message || e?.message);
  }
};
