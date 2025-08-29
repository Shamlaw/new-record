// Record Room Data Viewer - Main JavaScript File

// Global variables
let currentPage = 1;
let itemsPerPage = 10;
let currentSection = 'home';
let talukData = [];
let villageData = [];
let filteredTalukData = [];
let filteredVillageData = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

// Initialize application
function initializeApp() {
    // Show home section by default
    showSection('home');
    
    // Add smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const section = this.getAttribute('href').substring(1);
                showSection(section);
            }
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Search input event listeners
    document.getElementById('taluk-search').addEventListener('input', debounce(searchTalukData, 300));
    document.getElementById('village-search').addEventListener('input', debounce(searchVillageData, 300));
    
    // Filter change event listeners
    document.getElementById('taluk-year-filter').addEventListener('change', searchTalukData);
    document.getElementById('taluk-office-filter').addEventListener('change', searchTalukData);
    document.getElementById('village-district-filter').addEventListener('change', searchVillageData);
    document.getElementById('village-taluk-filter').addEventListener('change', searchVillageData);
    document.getElementById('village-year-filter').addEventListener('change', searchVillageData);
}

// Show specific section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show requested section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('fade-in-up');
        currentSection = sectionName;
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`a[href="#${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Load data for specific sections
        if (sectionName === 'taluk-data' && talukData.length === 0) {
            loadTalukData();
        } else if (sectionName === 'village-data' && villageData.length === 0) {
            loadVillageData();
        }
    }
}

// Load initial data
function loadInitialData() {
    // This would typically load from API, but for demo we'll use mock data
    console.log('Loading initial data...');
}

// Load Taluk Office data
async function loadTalukData() {
    try {
        showTableLoading('taluk-data-table');
        
        // Simulate API call - replace with actual API endpoint
        const response = await fetch('php/get_taluk_data.php');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        talukData = data.data || [];
        filteredTalukData = [...talukData];
        
        // Populate filter dropdowns
        populateTalukFilters();
        
        // Display data
        displayTalukData();
        
    } catch (error) {
        console.error('Error loading taluk data:', error);
        showTableError('taluk-data-table', 'Failed to load data. Please try again.');
        
        // For demo purposes, load mock data
        loadMockTalukData();
    }
}

// Load Village data
async function loadVillageData() {
    try {
        showTableLoading('village-data-table');
        
        // Simulate API call - replace with actual API endpoint
        const response = await fetch('php/get_village_data.php');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        villageData = data.data || [];
        filteredVillageData = [...villageData];
        
        // Populate filter dropdowns
        populateVillageFilters();
        
        // Display data
        displayVillageData();
        
    } catch (error) {
        console.error('Error loading village data:', error);
        showTableError('village-data-table', 'Failed to load data. Please try again.');
        
        // For demo purposes, load mock data
        loadMockVillageData();
    }
}

// Search Taluk data
function searchTalukData() {
    const searchTerm = document.getElementById('taluk-search').value.toLowerCase();
    const yearFilter = document.getElementById('taluk-year-filter').value;
    const officeFilter = document.getElementById('taluk-office-filter').value;
    
    filteredTalukData = talukData.filter(item => {
        const matchesSearch = !searchTerm || 
            item.Office_Name.toLowerCase().includes(searchTerm) ||
            item.File_No.toLowerCase().includes(searchTerm) ||
            item.Sub.toLowerCase().includes(searchTerm);
            
        const matchesYear = !yearFilter || item.Year === yearFilter;
        const matchesOffice = !officeFilter || item.Office_Name === officeFilter;
        
        return matchesSearch && matchesYear && matchesOffice;
    });
    
    currentPage = 1;
    displayTalukData();
}

// Search Village data
function searchVillageData() {
    const searchTerm = document.getElementById('village-search').value.toLowerCase();
    const districtFilter = document.getElementById('village-district-filter').value;
    const talukFilter = document.getElementById('village-taluk-filter').value;
    const yearFilter = document.getElementById('village-year-filter').value;
    
    filteredVillageData = villageData.filter(item => {
        const matchesSearch = !searchTerm || 
            item.Office_Name.toLowerCase().includes(searchTerm) ||
            item.File_No?.toLowerCase().includes(searchTerm) ||
            item.Sub?.toLowerCase().includes(searchTerm);
            
        const matchesDistrict = !districtFilter || item.district_code.toString() === districtFilter;
        const matchesTaluk = !talukFilter || item.taluk_code.toString() === talukFilter;
        const matchesYear = !yearFilter || item.Year === yearFilter;
        
        return matchesSearch && matchesDistrict && matchesTaluk && matchesYear;
    });
    
    currentPage = 1;
    displayVillageData();
}

// Display Taluk data in table
function displayTalukData() {
    const tableBody = document.getElementById('taluk-data-table');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredTalukData.slice(startIndex, endIndex);
    
    if (pageData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center empty-state">
                    <i class="fas fa-search"></i>
                    <p>No records found matching your criteria.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = pageData.map(item => `
        <tr>
            <td>${item.Sl_No}</td>
            <td>${item.Office_Name}</td>
            <td><span class="badge bg-light text-dark">${item.File_No}</span></td>
            <td>${item.Year}</td>
            <td><span class="badge bg-primary">${item['data-category']}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="viewFile(${item.file_id})">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        </tr>
    `).join('');
    
    // Update pagination
    updatePagination('taluk-pagination', filteredTalukData.length, displayTalukData);
}

// Display Village data in table
function displayVillageData() {
    const tableBody = document.getElementById('village-data-table');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredVillageData.slice(startIndex, endIndex);
    
    if (pageData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center empty-state">
                    <i class="fas fa-search"></i>
                    <p>No records found matching your criteria.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = pageData.map(item => `
        <tr>
            <td>${item.Sl_No}</td>
            <td><span class="badge bg-info">${item.district_code}</span></td>
            <td><span class="badge bg-warning">${item.taluk_code}</span></td>
            <td><span class="badge bg-secondary">${item.village_code}</span></td>
            <td>${item.Office_Name}</td>
            <td>${item.Year}</td>
            <td><span class="badge bg-success">${item['data-category']}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-success btn-action" onclick="viewFile(${item.file_id})">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        </tr>
    `).join('');
    
    // Update pagination
    updatePagination('village-pagination', filteredVillageData.length, displayVillageData);
}

// Populate Taluk filters
function populateTalukFilters() {
    const years = [...new Set(talukData.map(item => item.Year))].sort();
    const offices = [...new Set(talukData.map(item => item.Office_Name))].sort();
    
    const yearSelect = document.getElementById('taluk-year-filter');
    const officeSelect = document.getElementById('taluk-office-filter');
    
    yearSelect.innerHTML = '<option value="">All Years</option>' + 
        years.map(year => `<option value="${year}">${year}</option>`).join('');
        
    officeSelect.innerHTML = '<option value="">All Offices</option>' + 
        offices.map(office => `<option value="${office}">${office}</option>`).join('');
}

// Populate Village filters
function populateVillageFilters() {
    const districts = [...new Set(villageData.map(item => item.district_code))].sort();
    const taluks = [...new Set(villageData.map(item => item.taluk_code))].sort();
    const years = [...new Set(villageData.map(item => item.Year))].sort();
    
    const districtSelect = document.getElementById('village-district-filter');
    const talukSelect = document.getElementById('village-taluk-filter');
    const yearSelect = document.getElementById('village-year-filter');
    
    districtSelect.innerHTML = '<option value="">All Districts</option>' + 
        districts.map(district => `<option value="${district}">District ${district}</option>`).join('');
        
    talukSelect.innerHTML = '<option value="">All Taluks</option>' + 
        taluks.map(taluk => `<option value="${taluk}">Taluk ${taluk}</option>`).join('');
        
    yearSelect.innerHTML = '<option value="">All Years</option>' + 
        years.map(year => `<option value="${year}">${year}</option>`).join('');
}

// Update pagination
function updatePagination(paginationId, totalItems, displayFunction) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById(paginationId);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${currentPage - 1}, '${displayFunction.name}')">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}, '${displayFunction.name}')">${i}</a>
            </li>
        `;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${currentPage + 1}, '${displayFunction.name}')">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
    }
    
    pagination.innerHTML = paginationHTML;
}

// Change page
function changePage(page, functionName) {
    currentPage = page;
    if (functionName === 'displayTalukData') {
        displayTalukData();
    } else if (functionName === 'displayVillageData') {
        displayVillageData();
    }
}

// View file function
function viewFile(fileId) {
    // This would typically open a file viewer or download the file
    alert(`Viewing file with ID: ${fileId}`);
    console.log('File ID:', fileId);
}

// Show table loading state
function showTableLoading(tableId) {
    const tableBody = document.getElementById(tableId);
    const colSpan = tableId === 'taluk-data-table' ? 6 : 8;
    
    tableBody.innerHTML = `
        <tr>
            <td colspan="${colSpan}" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 mb-0">Loading data...</p>
            </td>
        </tr>
    `;
}

// Show table error state
function showTableError(tableId, message) {
    const tableBody = document.getElementById(tableId);
    const colSpan = tableId === 'taluk-data-table' ? 6 : 8;
    
    tableBody.innerHTML = `
        <tr>
            <td colspan="${colSpan}" class="text-center empty-state">
                <i class="fas fa-exclamation-triangle text-warning"></i>
                <p class="text-danger">${message}</p>
                <button class="btn btn-sm btn-outline-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </td>
        </tr>
    `;
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load mock data for demonstration
function loadMockTalukData() {
    talukData = [
        {
            Sl_No: 1,
            'data-category': 'File',
            'data-year': '1999-2000',
            'data-ofcname': 'Taluk Office, ಯಲಹಂಕ',
            onclick: 'fnViewFile(24047722,215)',
            Office_Name: 'Taluk Office, ಯಲಹಂಕ',
            File_No: 'RRT(DIS) CR 259/1999-00',
            Volume_No: null,
            Sub: 'RRT(DIS) CR 259/1999-00',
            Year: '1999-2000',
            file_id: 24047722,
            office_code: 215,
            File_Name: 'extracted_data_215_100_20250826_204726.json',
            No_OF_Records_Extracted: 1
        },
        // Add more mock data as needed
    ];
    
    filteredTalukData = [...talukData];
    populateTalukFilters();
    displayTalukData();
}

function loadMockVillageData() {
    villageData = [
        {
            Sl_No: 1,
            district_code: 19,
            taluk_code: 9,
            hobli_code: 1,
            village_code: 72,
            'data-category': 'Register',
            'data-year': '1990-1991',
            'data-ofcname': 'Taluk Office, ಮಾಲೂರು',
            onclick: 'fnViewFile(24530361,100)',
            Office_Name: 'Taluk Office, ಮಾಲೂರು',
            File_No: null,
            Volume_No: null,
            Sub: null,
            Year: '1990-1991',
            file_id: 24530361,
            office_code: 100,
            File_Name: 'ಕಸಬ_ಅಗರಹರ_20250829_125227.json',
            No_OF_Records_Extracted: 1
        },
        // Add more mock data as needed
    ];
    
    filteredVillageData = [...villageData];
    populateVillageFilters();
    displayVillageData();
}