/* Home page specific UI5 components */
import "@ui5/webcomponents/dist/Card.js";
import "@ui5/webcomponents/dist/CardHeader.js";
import "@ui5/webcomponents/dist/Panel.js";

import { apiService } from "../../services/api.js";

export default function initHomePage() {
  console.log("🏠 SAP Purchase Documents BI Home page initialized");

  // Initialize health check functionality
  const healthCheckButton = document.getElementById("health-check-button");
  const healthResponsePanel = document.getElementById("health-response-panel");
  const healthResponseContainer = document.getElementById("health-response-container");

  if (healthCheckButton && healthResponseContainer) {
    healthCheckButton.addEventListener("click", async () => {
      healthCheckButton.loading = true;
      healthResponseContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; color: #0070f3;">
          <div style="width: 16px; height: 16px; border: 2px solid #0070f3; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <span>Checking system status...</span>
        </div>
        <style>
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      `;

      if (healthResponsePanel) {
        healthResponsePanel.collapsed = false;
      }

      try {
        // Get comprehensive system status
        const [healthData, apiInfo] = await Promise.all([
          apiService.checkHealth(),
          apiService.getApiInfo().catch(() => null)
        ]);

        // Format the response nicely
        healthResponseContainer.innerHTML = `
          <div style="background: #e8f5e8; padding: 1rem; border-radius: 4px; border-left: 4px solid #28a745; margin-bottom: 1rem;">
            <strong>✅ System Operational</strong>
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <strong>📊 Service Status:</strong><br>
            • API: <span style="color: ${healthData.services?.api === 'running' ? '#28a745' : '#d73527'}">${healthData.services?.api || 'N/A'}</span><br>
            • HANA: <span style="color: ${healthData.services?.hana === 'connected' ? '#28a745' : '#d73527'}">${healthData.services?.hana || 'N/A'}</span><br>
            • AI Chat: <span style="color: ${healthData.services?.chat === 'available' ? '#28a745' : '#d73527'}">${healthData.services?.chat || 'N/A'}</span>
          </div>

          ${apiInfo ? `
            <div style="margin-bottom: 1.5rem;">
              <strong>🚀 API Information:</strong><br>
              • Service: ${apiInfo.service || 'N/A'}<br>
              • Version: ${apiInfo.version || 'N/A'}<br>
              • Status: <span style="color: #28a745">${apiInfo.status || 'N/A'}</span><br>
              • Last Check: ${new Date(healthData.timestamp).toLocaleString('en-US')}
            </div>
          ` : ''}

          <div style="margin-bottom: 1.5rem;">
            <strong>🛠️ Available Endpoints:</strong><br>
            • Health Check: <code>/health</code><br>
            • HANA Data: <code>/api/dashboard/kpis</code><br>
            • AI Analysis: <code>/analyze</code><br>
            • Chat API: <code>/api/chat/*</code><br>
            • Documentation: <code>/docs</code>
          </div>

          <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; border: 1px solid #dee2e6;">
            <details>
              <summary style="cursor: pointer; font-weight: bold;">📋 Technical Data (JSON)</summary>
              <pre style="margin-top: 1rem; font-size: 0.8em; overflow-x: auto;">${JSON.stringify(healthData, null, 2)}</pre>
            </details>
          </div>
        `;

      } catch (error) {
        console.error("❌ Health check error:", error);
        healthResponseContainer.innerHTML = `
          <div style="background: #ffeaea; padding: 1rem; border-radius: 4px; border-left: 4px solid #d73527;">
            <strong>❌ System Check Error</strong><br><br>
            <div style="background: #fff; padding: 0.5rem; border-radius: 3px; border: 1px solid #d73527; font-family: monospace; font-size: 0.9em;">
              ${error.message}
            </div>
            <br>
            <strong>🔧 Possible Solutions:</strong><br>
            • Verify the API server is running at <code>http://localhost:8000</code><br>
            • Check SAP HANA configuration in the <code>.env</code> file<br>
            • Try restarting the API server<br>
            • Ensure all required dependencies are installed
          </div>
        `;
      } finally {
        healthCheckButton.loading = false;
      }
    });
  }

  // Auto-check health on page load
  setTimeout(() => {
    if (healthCheckButton && !healthResponseContainer.textContent.trim()) {
      console.log("🔄 Auto-checking system health...");
      healthCheckButton.click();
    }
  }, 1000);
}
