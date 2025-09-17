import axios from "axios";

const API_BASE_URL = "http://13.220.115.202:8000/app/api/v1";

export async function chatWithBot(payload: {
  history: any[];
  currentInput: string;
}): Promise<any> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/conversation/chat`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "API call failed");
  }
}
