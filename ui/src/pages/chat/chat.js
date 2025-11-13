/* Chat-specific UI5 components */
import "@ui5/webcomponents/dist/Label.js";
import "@ui5/webcomponents/dist/Select.js";
import "@ui5/webcomponents/dist/Option.js";
import "@ui5/webcomponents/dist/TextArea.js";
import "@ui5/webcomponents/dist/Panel.js";

import { apiService } from "../../services/api.js";

export default function initChatPage() {
  console.log("🤖 SAP Purchase Data AI Chat initialized");

  // Initialize example buttons
  initializeExampleButtons();

  // Initialize chat functionality
  const sendButton = document.getElementById("send-button");

  if (sendButton) {
    sendButton.addEventListener("click", async () => {
      await processChatQuery();
    });

    // Add Enter key support for better UX
    const promptInput = document.getElementById("prompt-input");
    if (promptInput) {
      promptInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          sendButton.click();
        }
      });
    }
  }

  // Initialize with a helpful message
  setTimeout(() => {
    console.log("🔄 Checking API status...");
    checkApiStatus();
  }, 500);
}

// Initialize example buttons
function initializeExampleButtons() {
  const examples = {
    'example-btn-1': "Analyze our overall delivery performance and identify the main issues affecting on-time delivery rates across all plants.",
    'example-btn-2': "Compare delivery performance across different plants. Which plants are performing best and worst in terms of on-time delivery?",
    'example-btn-3': "Analyze lead time trends over the past months. Are we improving or getting worse? What factors are impacting our lead times?"
  };

  Object.entries(examples).forEach(([buttonId, exampleText]) => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', () => {
        const promptInput = document.getElementById("prompt-input");
        if (promptInput) {
          promptInput.value = exampleText;
          promptInput.focus();
        }
      });
    }
  });
}

// Process chat query
async function processChatQuery() {
  const promptInput = document.getElementById("prompt-input");
  const responsePanel = document.getElementById("response-panel");
  const responseContainer = document.getElementById("response-container");
  const sendButton = document.getElementById("send-button");

  const prompt = promptInput.value.trim();

  if (!prompt) {
    alert("Please enter a question about your purchase data.");
    return;
  }

  // Show loading state
  responsePanel.collapsed = false;
  responseContainer.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; color: #0070f3;">
      <div style="width: 20px; height: 20px; border: 2px solid #0070f3; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <span>🤖 Analyzing your SAP data with AI...</span>
    </div>
    <div style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
      • Connecting to SAP HANA database<br>
      • Processing 28,988+ purchase documents<br>
      • Generating AI-powered insights
    </div>
    <style>
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  `;
  sendButton.loading = true;

  try {
    console.log("🚀 Sending query to AI analyzer:", prompt);
    
    // Use the new /analyze endpoint for all queries
    const response = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: prompt
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const analysisResult = await response.json();
    
    // Format the response nicely
    responseContainer.innerHTML = `
      <div style="margin-bottom: 1.5rem; padding: 1rem; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #28a745;">
        <strong>🤖 AI Analysis Complete</strong>
        <div style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
          Analysis based on real-time SAP HANA data (28,988+ purchase documents)
        </div>
      </div>
      
      <div style="line-height: 1.6; margin-bottom: 1.5rem;">
        ${formatAnalysisText(analysisResult.analysis)}
      </div>
      
      <div style="border-top: 1px solid #eee; padding-top: 1rem; margin-top: 1rem; font-size: 0.9em; color: #666;">
        <strong>📊 Data Source:</strong><br>
        • Real-time connection to SAP HANA<br>
        • Purchase Documents table: COEAI.PurchaseDocuments<br>
        • Analysis timestamp: ${analysisResult.timestamp ? new Date(analysisResult.timestamp).toLocaleString('en-US') : 'N/A'}<br>
        • Query processed: "${prompt}"
      </div>
      
      <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #17a2b8;">
        <strong>💡 Try asking:</strong><br>
        • "What are our key delivery performance metrics?"<br>
        • "Which materials have the lowest fill rates?"<br>
        • "How do our plants compare in terms of efficiency?"<br>
        • "What trends do you see in our supply chain data?"
      </div>
    `;

  } catch (error) {
    console.error("❌ Error:", error);
    responseContainer.innerHTML = `
      <div style="color: #d73527; margin-bottom: 1rem;">
        <strong>❌ Analysis Error:</strong>
      </div>
      <div style="background: #ffeaea; padding: 1rem; border-radius: 4px; border-left: 4px solid #d73527;">
        ${error.message}
      </div>
      <div style="margin-top: 1rem; font-size: 0.9em; color: #666;">
        <strong>🔧 Possible Solutions:</strong><br>
        • Verify the API server is running on port 8000<br>
        • Check SAP HANA connection configuration<br>
        • Ensure all required services are operational<br>
        • Try a simpler query to test connectivity
      </div>
    `;
  } finally {
    sendButton.loading = false;
  }
}

// Format analysis text with basic HTML formatting
function formatAnalysisText(text) {
  if (!text) return '<p>No analysis received.</p>';
  
  // Convert line breaks to HTML and add basic formatting
  return text
    .split('\n\n')
    .map(paragraph => {
      // Check if it looks like a heading (starts with number or capital letters)
      if (paragraph.match(/^[A-Z\d\s]+[:]/)) {
        return `<h4 style="color: #0070f3; margin: 1rem 0 0.5rem 0;">${paragraph}</h4>`;
      }
      // Check if it's a list item
      if (paragraph.match(/^[-•]\s/)) {
        return `<ul style="margin: 0.5rem 0; padding-left: 1.5rem;"><li>${paragraph.replace(/^[-•]\s/, '')}</li></ul>`;
      }
      return `<p style="margin: 0.5rem 0;">${paragraph}</p>`;
    })
    .join('');
}

// Function to check API status and show helpful info
async function checkApiStatus() {
  try {
    const health = await apiService.checkHealth();
    console.log("✅ API Status:", health);
    
    if (health.status === "healthy") {
      const responseContainer = document.getElementById("response-container");
      if (responseContainer && !responseContainer.textContent.trim()) {
        responseContainer.innerHTML = `
          <div style="background: #e8f5e8; padding: 1rem; border-radius: 4px; border-left: 4px solid #28a745;">
            <strong>✅ System Ready for Analysis</strong><br><br>
            <strong>📊 Service Status:</strong><br>
            • API: ${health.services?.api || 'N/A'}<br>
            • SAP HANA: ${health.services?.hana || 'N/A'}<br>
            • AI Chat: ${health.services?.chat || 'N/A'}<br><br>
            <strong>💡 Ask questions like:</strong><br>
            • "What's our overall delivery performance?"<br>
            • "Which plants need improvement?"<br>
            • "Show me trends in our purchase data"<br>
            • "Analyze our supply chain efficiency"
          </div>
        `;
      }
    }
  } catch (error) {
    console.warn("⚠️ API not available:", error.message);
    const responseContainer = document.getElementById("response-container");
    if (responseContainer && !responseContainer.textContent.trim()) {
      responseContainer.innerHTML = `
        <div style="background: #fff3cd; padding: 1rem; border-radius: 4px; border-left: 4px solid #ffc107;">
          <strong>⚠️ API Connection Issue</strong><br><br>
          To use the AI chat with purchase data, ensure that:<br>
          • The API server is running on <code>http://localhost:8000</code><br>
          • SAP HANA connection is properly configured<br>
          • All required services are operational<br><br>
          <strong>🚀 To start the server:</strong><br>
          <code>cd api && python main.py</code>
        </div>
      `;
    }
  }
}
