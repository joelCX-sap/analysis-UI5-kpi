import { apiService } from '../../services/api.js';

class ExcelPage {
  constructor() {
    this.currentFileId = null;
    this.analysisHistory = [];
    this.init();
  }

  init() {
    // Wait for DOM to be fully ready
    setTimeout(() => {
      this.initEventListeners();
      this.loadUploadedFiles();
    }, 100);
  }

  initEventListeners() {
    console.log('Initializing Excel page event listeners...');
    
    // File upload events
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileUploadArea = document.getElementById('fileUploadArea');

    console.log('Found elements:', {
      fileInput: !!fileInput,
      browseBtn: !!browseBtn,
      fileUploadArea: !!fileUploadArea
    });

    // Browse button click
    if (browseBtn) {
      browseBtn.addEventListener('click', () => {
        console.log('Browse button clicked');
        fileInput?.click();
      });
    }

    // File input change
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        console.log('File selected:', e.target.files);
        if (e.target.files.length > 0) {
          this.handleFileUpload(e.target.files[0]);
        }
      });
    }

    // Drag and drop events
    if (fileUploadArea) {
      fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        console.log('Drag over');
        fileUploadArea.classList.add('dragover');
      });

      fileUploadArea.addEventListener('dragleave', () => {
        console.log('Drag leave');
        fileUploadArea.classList.remove('dragover');
      });

      fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        console.log('File dropped:', e.dataTransfer.files);
        fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleFileUpload(files[0]);
        }
      });

      // Click on upload area
      fileUploadArea.addEventListener('click', () => {
        console.log('Upload area clicked');
        fileInput?.click();
      });
    }

    // Refresh files button
    const refreshBtn = document.getElementById('refreshFilesBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        console.log('Refresh files clicked');
        this.loadUploadedFiles();
      });
    }

    // Analysis events
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        console.log('Analyze button clicked');
        this.performAnalysis();
      });
    }

    // Suggestion buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('suggestion-btn')) {
        const question = e.target.getAttribute('data-question');
        const questionInput = document.getElementById('questionInput');
        if (questionInput && question) {
          questionInput.value = question;
        }
      }
    });

    // Close analysis button
    const closeAnalysisBtn = document.getElementById('closeAnalysisBtn');
    if (closeAnalysisBtn) {
      closeAnalysisBtn.addEventListener('click', () => {
        this.closeAnalysis();
      });
    }

    // Clear history button
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        this.clearAnalysisHistory();
      });
    }

    // Enter key in question input
    const questionInput = document.getElementById('questionInput');
    if (questionInput) {
      questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          this.performAnalysis();
        }
      });
    }
  }

  async handleFileUpload(file) {
    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      this.showError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    // Show upload progress
    this.showUploadProgress(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressBar = document.getElementById('progressBar');
      const progressText = document.getElementById('progressText');
      
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 90) {
          clearInterval(progressInterval);
        }
        if (progressBar) progressBar.value = Math.min(progress, 90);
      }, 200);

      // Upload file
      const response = await apiService.uploadExcel(formData);
      
      clearInterval(progressInterval);
      if (progressBar) progressBar.value = 100;
      if (progressText) progressText.textContent = 'Processing file...';

      setTimeout(() => {
        this.showUploadProgress(false);
        
        if (response.success) {
          this.showSuccess(`File "${response.filename}" uploaded successfully!`);
          this.loadUploadedFiles();
          
          // Auto-open analysis
          setTimeout(() => {
            this.openFileAnalysis(response.file_id, response.filename);
          }, 1000);
        } else {
          this.showError(response.error || 'Upload failed');
        }
      }, 500);

    } catch (error) {
      this.showUploadProgress(false);
      console.error('Upload error:', error);
      this.showError('Upload failed: ' + (error.message || 'Unknown error'));
    }
  }

  showUploadProgress(show) {
    const uploadProgress = document.getElementById('uploadProgress');
    const fileUploadArea = document.getElementById('fileUploadArea');
    
    if (!uploadProgress || !fileUploadArea) return;

    if (show) {
      uploadProgress.style.display = 'block';
      fileUploadArea.style.display = 'none';
      
      const progressBar = document.getElementById('progressBar');
      const progressText = document.getElementById('progressText');
      if (progressBar) progressBar.value = 0;
      if (progressText) progressText.textContent = 'Uploading file...';
    } else {
      uploadProgress.style.display = 'none';
      fileUploadArea.style.display = 'block';
    }
  }

  async loadUploadedFiles() {
    const filesList = document.getElementById('filesList');
    const filesLoader = document.getElementById('filesLoader');
    const noFilesText = document.getElementById('noFilesText');
    
    if (!filesList) return;

    // Show loader
    if (filesLoader) filesLoader.style.display = 'block';
    if (noFilesText) noFilesText.style.display = 'none';

    try {
      const response = await apiService.listExcelFiles();
      
      // Hide loader
      if (filesLoader) filesLoader.style.display = 'none';

      if (response.success && response.files.length > 0) {
        this.renderFilesList(response.files);
      } else {
        if (noFilesText) {
          noFilesText.style.display = 'block';
          noFilesText.textContent = 'No files uploaded yet';
        }
      }

    } catch (error) {
      console.error('Error loading files:', error);
      if (filesLoader) filesLoader.style.display = 'none';
      if (noFilesText) {
        noFilesText.style.display = 'block';
        noFilesText.textContent = 'Error loading files';
      }
    }
  }

  renderFilesList(files) {
    const filesList = document.getElementById('filesList');
    if (!filesList) return;

    filesList.innerHTML = '';

    files.forEach(file => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item fade-in';
      
      const uploadDate = new Date(file.upload_time).toLocaleString();
      
      fileItem.innerHTML = `
        <div class="file-info">
          <div class="file-name">📊 ${file.filename}</div>
          <div class="file-details">
            ${file.sheets_count} sheet${file.sheets_count !== 1 ? 's' : ''} • 
            ${file.total_rows.toLocaleString()} rows • 
            Uploaded ${uploadDate}
          </div>
        </div>
        <div class="file-actions">
          <ui5-button design="Transparent" icon="detail-view" class="analyze-file-btn" 
                      data-file-id="${file.file_id}" data-filename="${file.filename}">
            Analyze
          </ui5-button>
          <ui5-button design="Transparent" icon="delete" class="delete-file-btn" 
                      data-file-id="${file.file_id}" data-filename="${file.filename}">
            Delete
          </ui5-button>
        </div>
      `;

      filesList.appendChild(fileItem);
    });

    // Add event listeners to file action buttons
    this.attachFileActionListeners();
  }

  attachFileActionListeners() {
    // Analyze file buttons
    document.querySelectorAll('.analyze-file-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fileId = e.target.getAttribute('data-file-id');
        const filename = e.target.getAttribute('data-filename');
        this.openFileAnalysis(fileId, filename);
      });
    });

    // Delete file buttons
    document.querySelectorAll('.delete-file-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const fileId = e.target.getAttribute('data-file-id');
        const filename = e.target.getAttribute('data-filename');
        
        if (confirm(`Are you sure you want to delete "${filename}"?`)) {
          try {
            const response = await apiService.deleteExcelFile(fileId);
            if (response.success) {
              this.showSuccess(response.message);
              this.loadUploadedFiles();
              
              // Close analysis if this file was being analyzed
              if (this.currentFileId === fileId) {
                this.closeAnalysis();
              }
            } else {
              this.showError('Failed to delete file');
            }
          } catch (error) {
            console.error('Delete error:', error);
            this.showError('Failed to delete file');
          }
        }
      });
    });
  }

  async openFileAnalysis(fileId, filename) {
    this.currentFileId = fileId;
    
    const analysisSection = document.getElementById('analysisSection');
    const analysisTitle = document.getElementById('analysisTitle');
    
    if (!analysisSection || !analysisTitle) return;

    // Show analysis section
    analysisSection.style.display = 'block';
    analysisTitle.textContent = `Analysis: ${filename}`;
    
    // Scroll to analysis section
    analysisSection.scrollIntoView({ behavior: 'smooth' });

    // Load file summary
    await this.loadFileSummary(fileId);
    
    // Load data preview
    await this.loadDataPreview(fileId);

    // Show chat history for this file
    this.showChatHistory();
  }

  async loadFileSummary(fileId) {
    const fileSummary = document.getElementById('fileSummary');
    const summaryLoader = document.getElementById('summaryLoader');
    
    if (!fileSummary) return;

    // Show loader
    if (summaryLoader) summaryLoader.style.display = 'block';

    try {
      const response = await apiService.getExcelSummary(fileId);
      
      // Hide loader
      if (summaryLoader) summaryLoader.style.display = 'none';

      if (response.success) {
        fileSummary.innerHTML = `
          <div class="summary-content">${response.ai_summary}</div>
        `;
        fileSummary.classList.add('success');
      } else {
        fileSummary.innerHTML = `
          <div class="summary-content">Error loading file summary: ${response.error}</div>
        `;
        fileSummary.classList.add('error');
      }

    } catch (error) {
      console.error('Summary error:', error);
      if (summaryLoader) summaryLoader.style.display = 'none';
      fileSummary.innerHTML = `
        <div class="summary-content">Error loading file summary</div>
      `;
      fileSummary.classList.add('error');
    }
  }

  async loadDataPreview(fileId) {
    const previewContent = document.getElementById('previewContent');
    
    if (!previewContent) return;

    try {
      // Get file summary to know available sheets
      const summaryResponse = await apiService.getExcelSummary(fileId);
      
      if (summaryResponse.success && summaryResponse.metadata.sheets) {
        const sheets = Object.keys(summaryResponse.metadata.sheets);
        
        if (sheets.length > 0) {
          // Load preview for first sheet
          const previewResponse = await apiService.getExcelPreview(fileId, sheets[0]);
          
          if (previewResponse.success) {
            this.renderDataPreview(previewResponse);
          }
        }
      }

    } catch (error) {
      console.error('Preview error:', error);
      previewContent.innerHTML = '<div>Error loading data preview</div>';
    }
  }

  renderDataPreview(previewData) {
    const previewContent = document.getElementById('previewContent');
    
    if (!previewContent || !previewData.preview_data || previewData.preview_data.length === 0) {
      previewContent.innerHTML = '<div>No preview data available</div>';
      return;
    }

    // Create table
    const table = document.createElement('table');
    table.className = 'preview-table';

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    previewData.columns.forEach(column => {
      const th = document.createElement('th');
      th.textContent = column;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');
    
    previewData.preview_data.forEach(row => {
      const tr = document.createElement('tr');
      
      previewData.columns.forEach(column => {
        const td = document.createElement('td');
        const value = row[column];
        td.textContent = value !== null && value !== undefined ? String(value) : '';
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);

    // Update preview content
    previewContent.innerHTML = `
      <div style="margin-bottom: 1rem;">
        <strong>Sheet:</strong> ${previewData.sheet_name} 
        (showing ${previewData.rows_shown} of ${previewData.total_rows.toLocaleString()} rows)
      </div>
      <div style="overflow-x: auto; max-height: 400px;">
        ${table.outerHTML}
      </div>
    `;
  }

  async performAnalysis() {
    if (!this.currentFileId) {
      this.showError('Please select a file first');
      return;
    }

    const questionInput = document.getElementById('questionInput');
    const question = questionInput?.value?.trim();
    
    if (!question) {
      this.showError('Please enter a question');
      return;
    }

    const analysisResults = document.getElementById('analysisResults');
    const analysisLoader = document.getElementById('analysisLoader');
    const analysisOutput = document.getElementById('analysisOutput');
    
    if (!analysisResults || !analysisLoader || !analysisOutput) return;

    // Show analysis section and loader
    analysisResults.style.display = 'block';
    analysisLoader.style.display = 'block';
    analysisOutput.innerHTML = '';

    try {
      const response = await apiService.analyzeExcelData(this.currentFileId, question);
      
      // Hide loader
      analysisLoader.style.display = 'none';

      if (response.success) {
        analysisOutput.textContent = response.analysis;
        
        // Add to history
        this.addToAnalysisHistory(question, response.analysis);
        
        // Clear question input
        questionInput.value = '';
        
        // Show chat history
        this.showChatHistory();
        
      } else {
        analysisOutput.textContent = 'Error: ' + (response.error || 'Analysis failed');
        analysisOutput.parentElement.classList.add('error');
      }

    } catch (error) {
      console.error('Analysis error:', error);
      analysisLoader.style.display = 'none';
      analysisOutput.textContent = 'Error performing analysis: ' + (error.message || 'Unknown error');
      analysisOutput.parentElement.classList.add('error');
    }
  }

  addToAnalysisHistory(question, answer) {
    const historyItem = {
      question: question,
      answer: answer,
      timestamp: new Date().toISOString(),
      fileId: this.currentFileId
    };
    
    this.analysisHistory.push(historyItem);
    
    // Keep only last 10 analyses
    if (this.analysisHistory.length > 10) {
      this.analysisHistory = this.analysisHistory.slice(-10);
    }
  }

  showChatHistory() {
    const chatHistorySection = document.getElementById('chatHistorySection');
    const chatHistory = document.getElementById('chatHistory');
    
    if (!chatHistorySection || !chatHistory) return;

    // Filter history for current file
    const fileHistory = this.analysisHistory.filter(item => item.fileId === this.currentFileId);
    
    if (fileHistory.length === 0) {
      chatHistorySection.style.display = 'none';
      return;
    }

    chatHistorySection.style.display = 'block';
    chatHistory.innerHTML = '';

    fileHistory.forEach(item => {
      const chatItem = document.createElement('div');
      chatItem.className = 'chat-item fade-in';
      
      const timestamp = new Date(item.timestamp).toLocaleString();
      
      chatItem.innerHTML = `
        <div class="chat-question">Q: ${item.question}</div>
        <div class="chat-answer">${item.answer}</div>
        <div class="chat-timestamp">${timestamp}</div>
      `;
      
      chatHistory.appendChild(chatItem);
    });
  }

  closeAnalysis() {
    const analysisSection = document.getElementById('analysisSection');
    const chatHistorySection = document.getElementById('chatHistorySection');
    
    if (analysisSection) analysisSection.style.display = 'none';
    if (chatHistorySection) chatHistorySection.style.display = 'none';
    
    this.currentFileId = null;
  }

  clearAnalysisHistory() {
    if (confirm('Are you sure you want to clear the analysis history?')) {
      this.analysisHistory = [];
      this.showChatHistory();
    }
  }

  showSuccess(message) {
    // Simple success notification - can be enhanced with UI5 MessageToast
    console.log('Success:', message);
    
    // Create temporary success message
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--sapButton_Accept_Background);
      color: white;
      padding: 1rem;
      border-radius: 4px;
      z-index: 9999;
      animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  showError(message) {
    // Simple error notification - can be enhanced with UI5 MessageToast
    console.error('Error:', message);
    
    // Create temporary error message
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--sapButton_Reject_Background);
      color: white;
      padding: 1rem;
      border-radius: 4px;
      z-index: 9999;
      animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

// Initialize page when DOM is loaded
let excelPageInstance = null;

export function initExcelPage() {
  if (!excelPageInstance) {
    excelPageInstance = new ExcelPage();
  }
  return excelPageInstance;
}

// Export init function for router compatibility
export function init() {
  return initExcelPage();
}

// Export default function for router compatibility
export default function() {
  return initExcelPage();
}

// Auto-initialize if running directly
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExcelPage);
} else {
  initExcelPage();
}
