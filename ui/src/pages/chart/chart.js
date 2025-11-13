/* Chart page specific UI5 components */
import "@ui5/webcomponents/dist/Panel.js";
import "@ui5/webcomponents/dist/Title.js";
import "@ui5/webcomponents/dist/Button.js";
import "@ui5/webcomponents/dist/Select.js";
import "@ui5/webcomponents/dist/Option.js";

import { apiService } from "../../services/api.js";

// Global variables for charts
let allCharts = {};
let currentFilter = null;

export default function initChartPage() {
  console.log("📊 Purchase KPI Dashboard initialized");

  // Wait for DOM to be ready, then load Chart.js and initialize
  setTimeout(() => {
    loadChartJS().then(() => {
      initializeDashboard();
      initializeAnalysisFeature();
    });
  }, 100); // Small delay to ensure DOM is fully rendered
}

// Load Chart.js library dynamically
function loadChartJS() {
  return new Promise((resolve) => {
    if (window.Chart) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

async function initializeDashboard() {
  const clearButton = document.getElementById("btn-clear");
  
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      currentFilter = null;
      clearButton.hidden = true;
      // Re-render all charts without filter
      loadData();
    });
  }

  // Load data and render charts
  await loadData();
}

async function loadData() {
  try {
    console.log("📊 Loading purchase data...");
    
    // Show loading state for all panels
    showLoadingState();

    // Get optimized KPI data from our API
    const response = await fetch('http://localhost:8000/api/dashboard/kpis');
    const kpiData = await response.json();
    
    if (kpiData.error) {
      throw new Error(kpiData.error);
    }
    
    console.log(`📊 Loaded KPI data for ${kpiData.summary.total_records} records`);
    renderAllCharts(kpiData);

  } catch (error) {
    console.error("❌ Error loading data:", error);
    showErrorState(error.message);
  }
}

function showLoadingState() {
  const panels = document.querySelectorAll('ui5-panel');
  panels.forEach(panel => {
    const content = panel.querySelector('.chart-container');
    if (!content) return;

    // Add spinner style if not exists
    if (!document.getElementById('chart-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'chart-spinner-style';
      style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    // Create/show loading overlay without removing canvas
    let overlay = content.querySelector('.loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.style.position = 'absolute';
      overlay.style.inset = '0';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.background = 'rgba(255,255,255,0.8)';
      overlay.style.zIndex = '10';
      overlay.innerHTML = `
        <div style="text-align: center; color: #0070f3;">
          <div style="width: 40px; height: 40px; border: 3px solid #0070f3; border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
          <span>Loading HANA data...</span>
        </div>
      `;
      content.appendChild(overlay);
    } else {
      overlay.style.display = 'flex';
    }
  });
}

function showErrorState(errorMessage) {
  const panels = document.querySelectorAll('ui5-panel');
  panels.forEach(panel => {
    const content = panel.querySelector('.chart-container');
    if (content) {
      content.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #d73527; text-align: center;">
          <div>
            <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
            <div><strong>Error loading data</strong></div>
            <div style="font-size: 0.9em; margin-top: 0.5rem;">${errorMessage}</div>
          </div>
        </div>
      `;
    }
  });
}

function renderAllCharts(kpiData) {
  console.log("📊 Rendering all KPI charts", kpiData);

  try {
    // Destroy existing charts
    Object.values(allCharts).forEach(chart => chart && chart.destroy());
    allCharts = {};
    
    // Remove loading overlays
    document.querySelectorAll('.loading-overlay').forEach(el => el.remove());

    // Wait a bit more for DOM to stabilize
    setTimeout(() => {
      // Render each chart type
      renderDeliveryChart(kpiData.delivery_completion);
      renderPlantChart(kpiData.plant_performance);
      renderMonthlyChart(kpiData.delivery_time_trends);
      renderOnTimeChart(kpiData.on_time_delivery);
      renderLeadTimeChart(kpiData.lead_time_analysis);
      renderFillRateChart(kpiData.material_fill_rate);
      renderStatusChart(kpiData.status_distribution);
      renderCategoryChart(kpiData.category_distribution);
      renderMovementChart(kpiData.movement_types);
      renderUOMChart(kpiData.uom_distribution);
      renderAgingChart(kpiData.open_orders_aging);
      renderDocTypesChart(kpiData.document_types);
      renderMaterialsChart(kpiData.material_analysis);
      renderDeletionChart(kpiData.deletion_stats);
      renderFreshnessChart(kpiData.freshness_analysis);

      // Update title and subtitle
      updateDashboardHeader(kpiData.summary);

      console.log("✅ All charts rendered successfully");
    }, 200);

  } catch (error) {
    console.error("❌ Error rendering charts:", error);
    showErrorState(error.message);
  }
}

function renderDeliveryChart(data) {
  const ctx = document.getElementById('chartDelivery')?.getContext('2d');
  if (!ctx || !data || Object.keys(data).length === 0) {
    showEmptyChart('chartDelivery', '📦', 'No delivery data');
    return;
  }

  const entries = Object.entries(data);
  allCharts.chartDelivery = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: entries.map(([status]) => 
        status === 'X' ? 'Complete' : 
        status === '' ? 'Pending' : 
        status || 'No Status'
      ),
      datasets: [{
        data: entries.map(([, count]) => count),
        backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#6f42c1', '#17a2b8']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Delivery Status (ELIKZ)' },
        legend: { position: 'right' }
      }
    }
  });
}

function renderPlantChart(data) {
  const ctx = document.getElementById('chartPlant')?.getContext('2d');
  if (!ctx || !data || Object.keys(data).length === 0) {
    showEmptyChart('chartPlant', '🏭', 'No plant data');
    return;
  }

  const plants = Object.entries(data)
    .sort(([,a], [,b]) => b.requested_qty - a.requested_qty)
    .slice(0, 10);

  allCharts.chartPlant = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: plants.map(([plant]) => plant),
      datasets: [
        {
          label: 'Requested',
          data: plants.map(([, stats]) => stats.requested_qty),
          backgroundColor: '#0070f3'
        },
        {
          label: 'Delivered',
          data: plants.map(([, stats]) => stats.delivered_qty),
          backgroundColor: '#28a745'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Requested vs Delivered Quantity by Plant (Top 10)' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderMonthlyChart(data) {
  const ctx = document.getElementById('chartMonth')?.getContext('2d');
  if (!ctx || !data || Object.keys(data).length === 0) {
    showEmptyChart('chartMonth', '📈', 'No time trends');
    return;
  }

  const months = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  allCharts.chartMonth = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months.map(([month]) => month),
      datasets: [{
        label: 'Average Days',
        data: months.map(([, stats]) => stats.avg_days),
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Average Delivery Time by Month' }
      },
      scales: {
        y: { 
          beginAtZero: true,
          title: { display: true, text: 'Days' }
        }
      }
    }
  });
}

function renderOnTimeChart(data) {
  const ctx = document.getElementById('chartOnTime')?.getContext('2d');
  if (!ctx || !data || !data.total_evaluated) {
    showEmptyChart('chartOnTime', '🎯', 'No punctuality data');
    return;
  }

  allCharts.chartOnTime = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['On Time', 'Late'],
      datasets: [{
        data: [data.on_time, data.late],
        backgroundColor: ['#28a745', '#dc3545']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { 
          display: true, 
          text: `On-Time Delivery: ${data.on_time_rate.toFixed(1)}% (${data.total_evaluated} deliveries)` 
        },
        legend: { position: 'bottom' }
      }
    }
  });
}

function renderLeadTimeChart(data) {
  const ctx = document.getElementById('chartLeadTime')?.getContext('2d');
  if (!ctx || !data || (!data.avg_planned_days && !data.avg_actual_days)) {
    showEmptyChart('chartLeadTime', '📈', 'No lead time data');
    return;
  }

  allCharts.chartLeadTime = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Lead Time Comparison'],
      datasets: [
        {
          label: 'Planned (days)',
          data: [data.avg_planned_days],
          backgroundColor: '#0070f3'
        },
        {
          label: 'Actual (days)',
          data: [data.avg_actual_days],
          backgroundColor: '#dc3545'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { 
          display: true, 
          text: `Lead Time - Variance: ${data.avg_variance_days.toFixed(1)} days` 
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderFillRateChart(data) {
  const ctx = document.getElementById('chartFillRate')?.getContext('2d');
  if (!ctx || !data || Object.keys(data).length === 0) {
    showEmptyChart('chartFillRate', '📦', 'No fill rate data');
    return;
  }

  const materials = Object.entries(data).slice(0, 10);

  allCharts.chartFillRate = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: materials.map(([material]) => material.substring(0, 20) + '...'),
      datasets: [{
        label: 'Fill Rate (%)',
        data: materials.map(([, stats]) => (stats.fill_rate * 100)),
        backgroundColor: materials.map(([, stats]) => 
          stats.fill_rate >= 0.9 ? '#28a745' : 
          stats.fill_rate >= 0.7 ? '#ffc107' : '#dc3545'
        )
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Fill Rate by Material (Top 10 Lowest)' }
      },
      scales: {
        x: { 
          beginAtZero: true,
          max: 100,
          title: { display: true, text: 'Percentage (%)' }
        }
      }
    }
  });
}

function renderStatusChart(data) {
  const ctx = document.getElementById('chartStatus')?.getContext('2d');
  if (!ctx || !data || Object.keys(data).length === 0) {
    showEmptyChart('chartStatus', '📋', 'No status data');
    return;
  }

  const entries = Object.entries(data).slice(0, 10);
  allCharts.chartStatus = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: entries.map(([status]) => status || 'No Status'),
      datasets: [{
        data: entries.map(([, count]) => count),
        backgroundColor: [
          '#0070f3', '#28a745', '#ffc107', '#dc3545', '#6f42c1',
          '#17a2b8', '#fd7e14', '#20c997', '#e83e8c', '#6c757d'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Document Status Distribution' },
        legend: { position: 'right' }
      }
    }
  });
}

function renderCategoryChart(data) {
  const ctx = document.getElementById('chartCategory')?.getContext('2d');
  if (!ctx || !data || Object.keys(data).length === 0) {
    showEmptyChart('chartCategory', '📊', 'No category data');
    return;
  }

  const entries = Object.entries(data).slice(0, 10);
  allCharts.chartCategory = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: entries.map(([category]) => category || 'No Category'),
      datasets: [{
        data: entries.map(([, count]) => count),
        backgroundColor: [
          '#0070f3', '#28a745', '#ffc107', '#dc3545', '#6f42c1',
          '#17a2b8', '#fd7e14', '#20c997', '#e83e8c', '#6c757d'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Document Category Distribution' },
        legend: { position: 'right' }
      }
    }
  });
}

function renderMovementChart(data) {
  const ctx = document.getElementById('chartMovement')?.getContext('2d');
  if (!ctx || !data || Object.keys(data).length === 0) {
    showEmptyChart('chartMovement', '🔄', 'No movement data');
    return;
  }

  const entries = Object.entries(data).slice(0, 10);
  allCharts.chartMovement = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: entries.map(([type]) => type || 'No Type'),
      datasets: [{
        label: 'Quantity',
        data: entries.map(([, count]) => count),
        backgroundColor: '#17a2b8'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Inventory Movement Types' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderUOMChart(data) {
  const ctx = document.getElementById('chartUOM')?.getContext('2d');
  if (!ctx || !data || Object.keys(data).length === 0) {
    showEmptyChart('chartUOM', '⚖️', 'No UOM data');
    return;
  }

  const entries = Object.entries(data).slice(0, 10);
  allCharts.chartUOM = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: entries.map(([uom]) => uom || 'No UOM'),
      datasets: [{
        data: entries.map(([, count]) => count),
        backgroundColor: [
          '#fd7e14', '#20c997', '#e83e8c', '#6c757d', '#0070f3',
          '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#17a2b8'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Unit of Measure Distribution' },
        legend: { position: 'right' }
      }
    }
  });
}

function renderAgingChart(data) {
  const ctx = document.getElementById('chartAging')?.getContext('2d');
  if (!ctx || !data || Object.keys(data).length === 0) {
    showEmptyChart('chartAging', '⏳', 'No aging data');
    return;
  }

  const buckets = ['0-30', '31-60', '61-90', '90+'];
  allCharts.chartAging = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: buckets.map(bucket => `${bucket} days`),
      datasets: [{
        label: 'Open Orders',
        data: buckets.map(bucket => data[bucket] || 0),
        backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Open Orders Aging' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderDocTypesChart(data) {
  const ctx = document.getElementById('chartDocTypes')?.getContext('2d');
  if (!ctx || !data || Object.keys(data).length === 0) {
    showEmptyChart('chartDocTypes', '📄', 'No document type data');
    return;
  }

  const entries = Object.entries(data).slice(0, 10);
  allCharts.chartDocTypes = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: entries.map(([type]) => type || 'No Type'),
      datasets: [{
        label: 'Quantity',
        data: entries.map(([, count]) => count),
        backgroundColor: '#6f42c1'
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Purchase Document Types' }
      },
      scales: {
        x: { beginAtZero: true }
      }
    }
  });
}

function renderMaterialsChart(data) {
  const ctx = document.getElementById('chartMaterials')?.getContext('2d');
  if (!ctx || !data || Object.keys(data).length === 0) {
    showEmptyChart('chartMaterials', '🔧', 'No material data');
    return;
  }

  const materials = Object.entries(data).slice(0, 10);
  allCharts.chartMaterials = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: materials.map(([material]) => material.substring(0, 15) + '...'),
      datasets: [
        {
          label: 'Requested Quantity',
          data: materials.map(([, stats]) => stats.requested_qty),
          backgroundColor: '#0070f3'
        },
        {
          label: 'Delivered Quantity',
          data: materials.map(([, stats]) => stats.delivered_qty),
          backgroundColor: '#28a745'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Material Analysis (Top 10 by Volume)' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderDeletionChart(data) {
  const ctx = document.getElementById('chartDeletion')?.getContext('2d');
  if (!ctx || !data || Object.keys(data).length === 0) {
    showEmptyChart('chartDeletion', '🗑️', 'No deletion data');
    return;
  }

  const entries = Object.entries(data);
  allCharts.chartDeletion = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: entries.map(([status]) => 
        status === '' ? 'Active' : 
        status === 'L' ? 'Deleted' : 
        status || 'No Status'
      ),
      datasets: [{
        data: entries.map(([, count]) => count),
        backgroundColor: ['#28a745', '#dc3545', '#ffc107']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Deletion Statistics' },
        legend: { position: 'bottom' }
      }
    }
  });
}

function renderFreshnessChart(data) {
  const ctx = document.getElementById('chartFreshness')?.getContext('2d');
  if (!ctx || !data || !data.evaluated) {
    showEmptyChart('chartFreshness', '🌱', 'No freshness data');
    return;
  }

  allCharts.chartFreshness = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Product Freshness'],
      datasets: [
        {
          label: 'Average (days)',
          data: [data.avg_days],
          backgroundColor: '#20c997'
        },
        {
          label: 'Minimum (days)',
          data: [data.min_days],
          backgroundColor: '#28a745'
        },
        {
          label: 'Maximum (days)',
          data: [data.max_days],
          backgroundColor: '#dc3545'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { 
          display: true, 
          text: `Freshness Analysis (${data.evaluated} products evaluated)` 
        }
      },
      scales: {
        y: { 
          beginAtZero: true,
          title: { display: true, text: 'Days from Manufacturing' }
        }
      }
    }
  });
}

function showEmptyChart(canvasId, emoji, message) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const container = canvas.parentElement;
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #666; text-align: center;">
      <div>
        <div style="font-size: 3rem; margin-bottom: 1rem;">${emoji}</div>
        <div><strong>${message}</strong></div>
        <div style="font-size: 0.9em; margin-top: 0.5rem;">No data available for this KPI</div>
      </div>
    </div>
  `;
}

function updateDashboardHeader(summary) {
  const titleElement = document.querySelector('ui5-title[level="H2"]');
  if (titleElement && summary) {
    titleElement.textContent = `📊 Purchase Documents Dashboard - ${summary.total_records.toLocaleString()} records`;
  }

  const subtitleElement = document.querySelector('ui5-label');
  if (subtitleElement && summary) {
    subtitleElement.textContent = `${summary.total_purchase_documents} POs • ${summary.unique_companies} companies • ${summary.unique_plants} plants • ${summary.unique_materials} materials • ⚡ Optimized`;
  }
}

// Initialize Analysis Feature
function initializeAnalysisFeature() {
  console.log("🔍 Initializing KPI Analysis feature");
  
  // Add event listeners to all analyze buttons
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('analyze-btn')) {
      const kpiType = event.target.getAttribute('data-kpi');
      console.log(`🔍 Analyzing KPI: ${kpiType}`);
      analyzeKPI(kpiType);
    }
  });
  
  // Modal close functionality
  const modal = document.getElementById('kpiAnalysisModal');
  const closeModal = document.getElementById('closeModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  
  if (closeModal) {
    closeModal.addEventListener('click', hideAnalysisModal);
  }
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', hideAnalysisModal);
  }
  
  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        hideAnalysisModal();
      }
    });
  }
}

// KPI Analysis Function
async function analyzeKPI(kpiType) {
  try {
    // Show modal with loading state
    showAnalysisModal(kpiType);
    
    // Create context-aware prompt for the KPI
    const kpiContext = getKPIContext(kpiType);
    
    // Call the backend analyzer
    console.log(`🚀 Calling backend analyzer for ${kpiType}`);
    const response = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: kpiContext.prompt
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const analysisResult = await response.json();
    
    // Display the analysis result
    displayAnalysisResult(kpiContext.title, analysisResult.analysis);
    
  } catch (error) {
    console.error('❌ Error analyzing KPI:', error);
    displayAnalysisError(error.message);
  }
}

// Get context for each KPI type
function getKPIContext(kpiType) {
  const kpiContexts = {
    'delivery_completion': {
      title: '🚚 Delivery Status Analysis',
      prompt: 'Analyze the delivery status of purchase documents. Focus on the percentage of completed vs pending deliveries, identify patterns and provide recommendations to improve delivery efficiency.'
    },
    'plant_performance': {
      title: '🏭 Plant Performance Analysis',
      prompt: 'Analyze plant performance in terms of requested vs delivered quantities. Identify best and worst performing plants, and provide insights on possible causes and improvement recommendations.'
    },
    'delivery_time_trends': {
      title: '⏱️ Delivery Time Trends Analysis',
      prompt: 'Analyze temporal trends in delivery times by month. Identify seasonal patterns, improvement or deterioration trends, and provide recommendations to optimize delivery times.'
    },
    'on_time_delivery': {
      title: '🎯 On-Time Delivery Analysis',
      prompt: 'Analyze on-time vs late delivery metrics. Calculate on-time delivery percentage, identify factors impacting punctuality and provide strategies to improve date compliance.'
    },
    'lead_time_analysis': {
      title: '📈 Lead Time Analysis',
      prompt: 'Analyze the comparison between planned vs actual lead times. Identify significant variances, delay patterns, and provide recommendations to improve planning accuracy.'
    },
    'material_fill_rate': {
      title: '📦 Material Fill Rate Analysis',
      prompt: 'Analyze materials with lowest fill rate (fulfillment percentage). Identify most problematic materials, possible causes of low fulfillment and strategies to improve availability.'
    },
    'status_distribution': {
      title: '📋 Document Status Analysis',
      prompt: 'Analyze the distribution of purchase document statuses. Identify predominant statuses, possible bottlenecks in process flow and recommendations to optimize processing.'
    },
    'category_distribution': {
      title: '📊 Document Category Analysis',
      prompt: 'Analyze the distribution of purchase document categories. Identify most frequent categories, usage patterns, and provide insights on procurement strategy.'
    },
    'movement_types': {
      title: '🔄 Movement Types Analysis',
      prompt: 'Analyze the most frequent inventory movement types. Identify operational patterns, movement efficiency, and recommendations to optimize inventory management.'
    },
    'uom_distribution': {
      title: '⚖️ Unit of Measure Analysis',
      prompt: 'Analyze the distribution of units of measure used. Identify predominant UOMs, possible standardization opportunities and recommendations to simplify management.'
    },
    'open_orders_aging': {
      title: '⏳ Open Orders Aging Analysis',
      prompt: 'Analyze the aging of open orders by day ranges. Identify orders requiring urgent attention, delay patterns and strategies to reduce order aging.'
    },
    'document_types': {
      title: '📄 Document Types Analysis',
      prompt: 'Analyze the most used purchase document types. Identify usage patterns, efficiency by document type and recommendations to optimize document processes.'
    },
    'material_analysis': {
      title: '🔧 Material Volume Analysis',
      prompt: 'Analyze materials with highest transaction volume. Identify most critical materials for the business, demand patterns and strategies to optimize management of these key materials.'
    },
    'deletion_stats': {
      title: '🗑️ Deletion Statistics Analysis',
      prompt: 'Analyze statistics of deleted vs active documents. Identify deletion patterns, possible issues in purchasing process and recommendations to improve data quality.'
    },
    'freshness_analysis': {
      title: '🌱 Product Freshness Analysis',
      prompt: 'Analyze time from manufacturing to delivery of products. Identify products with best and worst freshness, quality impact and strategies to optimize supply chain.'
    }
  };
  
  return kpiContexts[kpiType] || {
    title: '🔍 KPI Analysis',
    prompt: `Analyze the ${kpiType} KPI data and provide relevant business insights.`
  };
}

// Show Analysis Modal
function showAnalysisModal(kpiType) {
  const modal = document.getElementById('kpiAnalysisModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalLoading = document.getElementById('modalLoading');
  const modalContent = document.getElementById('modalContent');
  
  if (modal) {
    const context = getKPIContext(kpiType);
    modalTitle.textContent = context.title;
    
    // Show loading state
    modalLoading.style.display = 'block';
    modalContent.style.display = 'none';
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  }
}

// Hide Analysis Modal
function hideAnalysisModal() {
  const modal = document.getElementById('kpiAnalysisModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
  }
}

// Display Analysis Result
function displayAnalysisResult(title, analysis) {
  const modalLoading = document.getElementById('modalLoading');
  const modalContent = document.getElementById('modalContent');
  
  if (modalLoading && modalContent) {
    // Hide loading, show content
    modalLoading.style.display = 'none';
    modalContent.style.display = 'block';
    
    // Format and display the analysis
    modalContent.innerHTML = `
      <div class="modal-analysis">
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #0070f3;">
          <strong>AI-generated analysis with real-time SAP HANA data</strong>
        </div>
        ${formatAnalysisText(analysis)}
      </div>
    `;
  }
}

// Display Analysis Error
function displayAnalysisError(errorMessage) {
  const modalLoading = document.getElementById('modalLoading');
  const modalContent = document.getElementById('modalContent');
  
  if (modalLoading && modalContent) {
    modalLoading.style.display = 'none';
    modalContent.style.display = 'block';
    
    modalContent.innerHTML = `
      <div class="modal-analysis">
        <div style="text-align: center; padding: 2rem; color: #d73527;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
          <h4>Analysis Error</h4>
          <p>Could not complete KPI analysis:</p>
          <div style="background: #ffeaea; padding: 1rem; border-radius: 4px; margin-top: 1rem;">
            <code>${errorMessage}</code>
          </div>
          <p style="margin-top: 1rem; color: #666;">
            Verify that the backend is running correctly.
          </p>
        </div>
      </div>
    `;
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
        return `<h4>${paragraph}</h4>`;
      }
      // Check if it's a list item
      if (paragraph.match(/^[-•]\s/)) {
        return `<ul><li>${paragraph.replace(/^[-•]\s/, '')}</li></ul>`;
      }
      return `<p>${paragraph}</p>`;
    })
    .join('');
}
