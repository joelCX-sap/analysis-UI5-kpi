const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

// General Request function to the API
export async function request(endpoint, method = "GET", body = null, headers = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
  }

  return response.json();
}

// File upload request function (for multipart/form-data)
export async function uploadRequest(endpoint, formData, headers = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      ...headers
      // Note: Don't set Content-Type for FormData, let browser set it with boundary
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
  }

  return response.json();
}

// API Service object with all endpoints - Updated for Organic Valley BI API
export const apiService = {
  // Health check
  async checkHealth() {
    return request("/health");
  },

  // API Info
  async getApiInfo() {
    return request("/");
  },

  // HANA Data endpoints
  async getHanaInfo() {
    return request("/api/hana/info");
  },

  async getHanaColumns() {
    return request("/api/hana/columns");
  },

  async getAllHanaData() {
    return request("/api/hana/data/all");
  },

  async getHanaData(tableRequest = {}) {
    return request("/api/hana/data", "POST", tableRequest);
  },

  async saveHanaData() {
    return request("/api/hana/save", "POST");
  },

  // Chat AI endpoints
  async chatSimple(prompt) {
    return request("/api/chat/simple", "POST", { prompt });
  },

  async chatWithData(query) {
    return request("/api/chat/with-data", "POST", { query });
  },

  async queryPurchaseData(query) {
    return request("/api/chat/query-purchase", "POST", { query });
  },

  async queryHanaLive(query) {
    return request("/api/chat/hana-live", "POST", { query });
  },

  // Main insight endpoint (recommended for purchase data analysis)
  async getInsight(query) {
    return request("/api/insight", "POST", { query });
  },

  // Dashboard KPI endpoints
  async getDashboardKpis() {
    return request("/api/dashboard/kpis");
  },

  // KPI Analysis endpoint
  async analyzeKpi(query) {
    return request("/analyze", "POST", { query });
  },

  // Legacy chat endpoints (for compatibility if needed)
  async chatOpenAI(message) {
    return request("/api/chat/simple", "POST", { prompt: message });
  },

  async chatAnthropic(message) {
    return request("/api/chat/simple", "POST", { prompt: message });
  },

  async chatGemini(message) {
    return request("/api/chat/simple", "POST", { prompt: message });
  },

  // Excel Analysis endpoints
  async uploadExcel(formData) {
    return uploadRequest("/api/excel/upload", formData);
  },

  async listExcelFiles() {
    return request("/api/excel/files");
  },

  async getExcelSummary(fileId) {
    return request(`/api/excel/summary/${fileId}`);
  },

  async analyzeExcelData(fileId, question, sheetName = null) {
    const body = {
      file_id: fileId,
      question: question
    };
    if (sheetName) {
      body.sheet_name = sheetName;
    }
    return request("/api/excel/analyze", "POST", body);
  },

  async getExcelPreview(fileId, sheetName, rows = 20) {
    return request("/api/excel/preview", "POST", {
      file_id: fileId,
      sheet_name: sheetName,
      rows: rows
    });
  },

  async deleteExcelFile(fileId) {
    return request(`/api/excel/files/${fileId}`, "DELETE");
  }
};
