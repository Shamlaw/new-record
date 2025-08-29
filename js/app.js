// Record Room Data Viewer - Main JavaScript File

// Global variables
let currentPage = 1;
let itemsPerPage = 50; // Changed default to 50
let currentSection = 'home';
let talukData = [];
let villageData = [];
let filteredTalukData = [];
let filteredVillageData = [];
let villageCodeData = []; // New: store village_code table data
let totalRecords = 0; // New: total records from server
let totalPages = 1; // New: total pages from server

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
    document.getElementById('village-category-filter').addEventListener('change', handleCategoryChange);
    document.getElementById('village-district-filter').addEventListener('change', handleDistrictChange);
    document.getElementById('village-taluk-filter').addEventListener('change', handleTalukChange);
    document.getElementById('village-hobli-filter').addEventListener('change', handleHobliChange);
    document.getElementById('village-village-filter').addEventListener('change', searchVillageData);
    document.getElementById('village-year-filter').addEventListener('change', searchVillageData);
    document.getElementById('village-per-page').addEventListener('change', handlePerPageChange);
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
        
        // Build query parameters
        const params = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage
        });
        
        // Add filters if they exist
        const searchTerm = document.getElementById('village-search')?.value;
        const categoryFilter = document.getElementById('village-category-filter')?.value;
        const districtFilter = document.getElementById('village-district-filter')?.value;
        const talukFilter = document.getElementById('village-taluk-filter')?.value;
        const hobliFilter = document.getElementById('village-hobli-filter')?.value;
        const villageFilter = document.getElementById('village-village-filter')?.value;
        const yearFilter = document.getElementById('village-year-filter')?.value;
        
        if (searchTerm) params.append('search', searchTerm);
        if (categoryFilter) params.append('category', categoryFilter);
        if (districtFilter) params.append('district', districtFilter);
        if (talukFilter) params.append('taluk', talukFilter);
        if (hobliFilter) params.append('hobli', hobliFilter);
        if (villageFilter) params.append('village', villageFilter);
        if (yearFilter) params.append('year', yearFilter);
        
        const response = await fetch(`php/get_village_data.php?${params}`);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to load data');
        }
        
        villageData = data.data || [];
        villageCodeData = data.village_codes || [];
        filteredVillageData = [...villageData]; // For client-side compatibility
        
        // Update pagination info
        const paginationInfo = data.pagination || {};
        totalRecords = paginationInfo.total || 0;
        totalPages = paginationInfo.pages || 1;
        
        // Populate filter dropdowns (only on first load)
        if (currentPage === 1 && !document.getElementById('village-district-filter').children.length > 1) {
            populateVillageFilters();
        }
        
        // Initialize table headers
        updateTableHeaders();
        
        // Display data
        displayVillageDataFromServer();
        
    } catch (error) {
        console.error('Error loading village data:', error);
        showTableError('village-data-table', 'Failed to load data. Please try again.');
        
        // For demo purposes, load mock data
        loadMockVillageData();
    }
}

// Display Village data from server (with server-side pagination)
function displayVillageDataFromServer() {
    const tableBody = document.getElementById('village-data-table');
    const categoryFilter = document.getElementById('village-category-filter').value;
    
    if (villageData.length === 0) {
        const colSpan = getColumnCount();
        tableBody.innerHTML = `
            <tr>
                <td colspan="${colSpan}" class="text-center empty-state">
                    <i class="fas fa-search"></i>
                    <p>No records found matching your criteria.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = villageData.map(item => {
        const districtName = getNameFromCode('district', item.district_code);
        const talukName = getNameFromCode('taluk', item.district_code, item.taluk_code);
        const hobliName = getNameFromCode('hobli', item.district_code, item.taluk_code, item.hobli_code);
        const villageName = getNameFromCode('village', item.district_code, item.taluk_code, item.hobli_code, item.village_code);
        
        if (categoryFilter === 'File') {
            // For File category: Sl. No, District, Taluk, Hobli, Village, Office Name, File No, Sub, Year, Actions
            return `
                <tr>
                    <td>${item.Sl_No}</td>
                    <td><span class="badge bg-info">${districtName}</span></td>
                    <td><span class="badge bg-warning">${talukName}</span></td>
                    <td><span class="badge bg-secondary">${hobliName}</span></td>
                    <td><span class="badge bg-primary">${villageName}</span></td>
                    <td>${item.Office_Name}</td>
                    <td><span class="badge bg-light text-dark">${item.File_No || 'N/A'}</span></td>
                    <td>${item.Sub || 'N/A'}</td>
                    <td>${item.Year}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-success btn-action" onclick="viewFile(${item.file_id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        } else if (categoryFilter === 'Register') {
            // For Register category: Sl. No, District, Taluk, Hobli, Village, Office Name, Volume No, Year, Actions
            return `
                <tr>
                    <td>${item.Sl_No}</td>
                    <td><span class="badge bg-info">${districtName}</span></td>
                    <td><span class="badge bg-warning">${talukName}</span></td>
                    <td><span class="badge bg-secondary">${hobliName}</span></td>
                    <td><span class="badge bg-primary">${villageName}</span></td>
                    <td>${item.Office_Name}</td>
                    <td><span class="badge bg-light text-dark">${item.Volume_No || 'N/A'}</span></td>
                    <td>${item.Year}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-success btn-action" onclick="viewFile(${item.file_id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        } else {
            // For All categories: Show all columns
            return `
                <tr>
                    <td>${item.Sl_No}</td>
                    <td><span class="badge bg-info">${districtName}</span></td>
                    <td><span class="badge bg-warning">${talukName}</span></td>
                    <td><span class="badge bg-secondary">${hobliName}</span></td>
                    <td><span class="badge bg-primary">${villageName}</span></td>
                    <td>${item.Office_Name}</td>
                    <td><span class="badge bg-light text-dark">${item.File_No || 'N/A'}</span></td>
                    <td><span class="badge bg-light text-dark">${item.Volume_No || 'N/A'}</span></td>
                    <td>${item.Sub || 'N/A'}</td>
                    <td>${item.Year}</td>
                    <td><span class="badge bg-success">${item['data-category']}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-success btn-action" onclick="viewFile(${item.file_id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        }
    }).join('');
    
    // Update pagination
    updateServerPagination();
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
    currentPage = 1; // Reset to first page
    loadVillageData(); // Reload data with new filters
}

// Handle category change
function handleCategoryChange() {
    updateTableHeaders();
    searchVillageData();
}

// Handle district change
function handleDistrictChange() {
    populateTalukOptions();
    document.getElementById('village-hobli-filter').innerHTML = '<option value="">All Hoblis</option>';
    document.getElementById('village-village-filter').innerHTML = '<option value="">All Villages</option>';
    searchVillageData();
}

// Handle taluk change
function handleTalukChange() {
    populateHobliOptions();
    document.getElementById('village-village-filter').innerHTML = '<option value="">All Villages</option>';
    searchVillageData();
}

// Handle hobli change
function handleHobliChange() {
    populateVillageOptions();
    searchVillageData();
}

// Handle per page change
function handlePerPageChange() {
    itemsPerPage = parseInt(document.getElementById('village-per-page').value);
    currentPage = 1;
    loadVillageData(); // Reload with new page size
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
    const categoryFilter = document.getElementById('village-category-filter').value;
    
    if (pageData.length === 0) {
        const colSpan = getColumnCount();
        tableBody.innerHTML = `
            <tr>
                <td colspan="${colSpan}" class="text-center empty-state">
                    <i class="fas fa-search"></i>
                    <p>No records found matching your criteria.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = pageData.map(item => {
        const districtName = getNameFromCode('district', item.district_code);
        const talukName = getNameFromCode('taluk', item.district_code, item.taluk_code);
        const hobliName = getNameFromCode('hobli', item.district_code, item.taluk_code, item.hobli_code);
        const villageName = getNameFromCode('village', item.district_code, item.taluk_code, item.hobli_code, item.village_code);
        
        if (categoryFilter === 'File') {
            // For File category: Sl. No, District, Taluk, Hobli, Village, Office Name, File No, Sub, Year, Actions
            return `
                <tr>
                    <td>${item.Sl_No}</td>
                    <td><span class="badge bg-info">${districtName}</span></td>
                    <td><span class="badge bg-warning">${talukName}</span></td>
                    <td><span class="badge bg-secondary">${hobliName}</span></td>
                    <td><span class="badge bg-primary">${villageName}</span></td>
                    <td>${item.Office_Name}</td>
                    <td><span class="badge bg-light text-dark">${item.File_No || 'N/A'}</span></td>
                    <td>${item.Sub || 'N/A'}</td>
                    <td>${item.Year}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-success btn-action" onclick="viewFile(${item.file_id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        } else if (categoryFilter === 'Register') {
            // For Register category: Sl. No, District, Taluk, Hobli, Village, Office Name, Volume No, Year, Actions
            return `
                <tr>
                    <td>${item.Sl_No}</td>
                    <td><span class="badge bg-info">${districtName}</span></td>
                    <td><span class="badge bg-warning">${talukName}</span></td>
                    <td><span class="badge bg-secondary">${hobliName}</span></td>
                    <td><span class="badge bg-primary">${villageName}</span></td>
                    <td>${item.Office_Name}</td>
                    <td><span class="badge bg-light text-dark">${item.Volume_No || 'N/A'}</span></td>
                    <td>${item.Year}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-success btn-action" onclick="viewFile(${item.file_id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        } else {
            // For All categories: Show all columns
            return `
                <tr>
                    <td>${item.Sl_No}</td>
                    <td><span class="badge bg-info">${districtName}</span></td>
                    <td><span class="badge bg-warning">${talukName}</span></td>
                    <td><span class="badge bg-secondary">${hobliName}</span></td>
                    <td><span class="badge bg-primary">${villageName}</span></td>
                    <td>${item.Office_Name}</td>
                    <td><span class="badge bg-light text-dark">${item.File_No || 'N/A'}</span></td>
                    <td><span class="badge bg-light text-dark">${item.Volume_No || 'N/A'}</span></td>
                    <td>${item.Sub || 'N/A'}</td>
                    <td>${item.Year}</td>
                    <td><span class="badge bg-success">${item['data-category']}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-success btn-action" onclick="viewFile(${item.file_id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        }
    }).join('');
    
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

// Update table headers based on category
function updateTableHeaders() {
    const categoryFilter = document.getElementById('village-category-filter').value;
    const tableHeader = document.getElementById('village-table-header');
    
    if (categoryFilter === 'File') {
        // File category: Sl. No, District, Taluk, Hobli, Village, Office Name, File No, Sub, Year, Actions
        tableHeader.innerHTML = `
            <tr>
                <th>Sl. No</th>
                <th>District</th>
                <th>Taluk</th>
                <th>Hobli</th>
                <th>Village</th>
                <th>Office Name</th>
                <th>File No</th>
                <th>Sub</th>
                <th>Year</th>
                <th>Actions</th>
            </tr>
        `;
    } else if (categoryFilter === 'Register') {
        // Register category: Sl. No, District, Taluk, Hobli, Village, Office Name, Volume No, Year, Actions
        tableHeader.innerHTML = `
            <tr>
                <th>Sl. No</th>
                <th>District</th>
                <th>Taluk</th>
                <th>Hobli</th>
                <th>Village</th>
                <th>Office Name</th>
                <th>Volume No</th>
                <th>Year</th>
                <th>Actions</th>
            </tr>
        `;
    } else {
        // All categories: Show all columns
        tableHeader.innerHTML = `
            <tr>
                <th>Sl. No</th>
                <th>District</th>
                <th>Taluk</th>
                <th>Hobli</th>
                <th>Village</th>
                <th>Office Name</th>
                <th>File Number</th>
                <th>Volume Number</th>
                <th>Sub</th>
                <th>Year</th>
                <th>Category</th>
                <th>Actions</th>
            </tr>
        `;
    }
}

// Get column count based on category
function getColumnCount() {
    const categoryFilter = document.getElementById('village-category-filter').value;
    if (categoryFilter === 'File') return 10;
    if (categoryFilter === 'Register') return 9;
    return 12;
}

// Get name from code using village_code data
function getNameFromCode(type, districtCode, talukCode = null, hobliCode = null, villageCode = null) {
    if (!villageCodeData || villageCodeData.length === 0) {
        // Fallback to showing codes if village_code data not available
        switch(type) {
            case 'district': return `District ${districtCode}`;
            case 'taluk': return `Taluk ${talukCode}`;
            case 'hobli': return `Hobli ${hobliCode}`;
            case 'village': return `Village ${villageCode}`;
            default: return 'N/A';
        }
    }
    
    const matchingRecord = villageCodeData.find(record => {
        if (type === 'district') {
            return record.DistrictCode == districtCode;
        } else if (type === 'taluk') {
            return record.DistrictCode == districtCode && record.TalukCode == talukCode;
        } else if (type === 'hobli') {
            return record.DistrictCode == districtCode && record.TalukCode == talukCode && record.HobliCode == hobliCode;
        } else if (type === 'village') {
            return record.DistrictCode == districtCode && record.TalukCode == talukCode && record.HobliCode == hobliCode && record.VillageCode == villageCode;
        }
        return false;
    });
    
    if (matchingRecord) {
        switch(type) {
            case 'district': return matchingRecord.DistrictName;
            case 'taluk': return matchingRecord.TalukName;
            case 'hobli': return matchingRecord.HobliName;
            case 'village': return matchingRecord.VillageName;
            default: return 'N/A';
        }
    }
    
    // Fallback
    switch(type) {
        case 'district': return `District ${districtCode}`;
        case 'taluk': return `Taluk ${talukCode}`;
        case 'hobli': return `Hobli ${hobliCode}`;
        case 'village': return `Village ${villageCode}`;
        default: return 'N/A';
    }
}

// Populate Village filters
function populateVillageFilters() {
    populateDistrictOptions();
    populateYearOptions();
    // Set default per page
    document.getElementById('village-per-page').value = '50';
}

// Populate district options from village_code data
function populateDistrictOptions() {
    const districtSelect = document.getElementById('village-district-filter');
    
    if (villageCodeData && villageCodeData.length > 0) {
        const districts = [...new Set(villageCodeData.map(item => ({
            code: item.DistrictCode,
            name: item.DistrictName
        })))].sort((a, b) => a.code - b.code);
        
        districtSelect.innerHTML = '<option value="">All Districts</option>' + 
            districts.map(district => `<option value="${district.code}">${district.name}</option>`).join('');
    } else {
        // Fallback: use district codes from villagedata
        const districts = [...new Set(villageData.map(item => item.district_code))].sort();
        districtSelect.innerHTML = '<option value="">All Districts</option>' + 
            districts.map(district => `<option value="${district}">District ${district}</option>`).join('');
    }
}

// Populate taluk options based on selected district
function populateTalukOptions() {
    const selectedDistrict = document.getElementById('village-district-filter').value;
    const talukSelect = document.getElementById('village-taluk-filter');
    
    if (!selectedDistrict) {
        talukSelect.innerHTML = '<option value="">All Taluks</option>';
        return;
    }
    
    if (villageCodeData && villageCodeData.length > 0) {
        const taluks = [...new Set(villageCodeData
            .filter(item => item.DistrictCode == selectedDistrict)
            .map(item => ({
                code: item.TalukCode,
                name: item.TalukName
            })))].sort((a, b) => a.code - b.code);
        
        talukSelect.innerHTML = '<option value="">All Taluks</option>' + 
            taluks.map(taluk => `<option value="${taluk.code}">${taluk.name}</option>`).join('');
    } else {
        // Fallback: use taluk codes from villagedata
        const taluks = [...new Set(villageData
            .filter(item => item.district_code == selectedDistrict)
            .map(item => item.taluk_code))].sort();
        talukSelect.innerHTML = '<option value="">All Taluks</option>' + 
            taluks.map(taluk => `<option value="${taluk}">Taluk ${taluk}</option>`).join('');
    }
}

// Populate hobli options based on selected district and taluk
function populateHobliOptions() {
    const selectedDistrict = document.getElementById('village-district-filter').value;
    const selectedTaluk = document.getElementById('village-taluk-filter').value;
    const hobliSelect = document.getElementById('village-hobli-filter');
    
    if (!selectedDistrict || !selectedTaluk) {
        hobliSelect.innerHTML = '<option value="">All Hoblis</option>';
        return;
    }
    
    if (villageCodeData && villageCodeData.length > 0) {
        const hoblis = [...new Set(villageCodeData
            .filter(item => item.DistrictCode == selectedDistrict && item.TalukCode == selectedTaluk)
            .map(item => ({
                code: item.HobliCode,
                name: item.HobliName
            })))].sort((a, b) => a.code - b.code);
        
        hobliSelect.innerHTML = '<option value="">All Hoblis</option>' + 
            hoblis.map(hobli => `<option value="${hobli.code}">${hobli.name}</option>`).join('');
    } else {
        // Fallback: use hobli codes from villagedata
        const hoblis = [...new Set(villageData
            .filter(item => item.district_code == selectedDistrict && item.taluk_code == selectedTaluk)
            .map(item => item.hobli_code))].sort();
        hobliSelect.innerHTML = '<option value="">All Hoblis</option>' + 
            hoblis.map(hobli => `<option value="${hobli}">Hobli ${hobli}</option>`).join('');
    }
}

// Populate village options based on selected district, taluk, and hobli
function populateVillageOptions() {
    const selectedDistrict = document.getElementById('village-district-filter').value;
    const selectedTaluk = document.getElementById('village-taluk-filter').value;
    const selectedHobli = document.getElementById('village-hobli-filter').value;
    const villageSelect = document.getElementById('village-village-filter');
    
    if (!selectedDistrict || !selectedTaluk || !selectedHobli) {
        villageSelect.innerHTML = '<option value="">All Villages</option>';
        return;
    }
    
    if (villageCodeData && villageCodeData.length > 0) {
        const villages = [...new Set(villageCodeData
            .filter(item => item.DistrictCode == selectedDistrict && item.TalukCode == selectedTaluk && item.HobliCode == selectedHobli)
            .map(item => ({
                code: item.VillageCode,
                name: item.VillageName
            })))].sort((a, b) => a.code - b.code);
        
        villageSelect.innerHTML = '<option value="">All Villages</option>' + 
            villages.map(village => `<option value="${village.code}">${village.name}</option>`).join('');
    } else {
        // Fallback: use village codes from villagedata
        const villages = [...new Set(villageData
            .filter(item => item.district_code == selectedDistrict && item.taluk_code == selectedTaluk && item.hobli_code == selectedHobli)
            .map(item => item.village_code))].sort();
        villageSelect.innerHTML = '<option value="">All Villages</option>' + 
            villages.map(village => `<option value="${village}">Village ${village}</option>`).join('');
    }
}

// Populate year options
function populateYearOptions() {
    const years = [...new Set(villageData.map(item => item.Year))].sort();
    const yearSelect = document.getElementById('village-year-filter');
    
    yearSelect.innerHTML = '<option value="">All Years</option>' + 
        years.map(year => `<option value="${year}">${year}</option>`).join('');
}
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

// Update server pagination for village data
function updateServerPagination() {
    const pagination = document.getElementById('village-pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changeServerPage(${currentPage - 1})">
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
                <a class="page-link" href="#" onclick="changeServerPage(${i})">${i}</a>
            </li>
        `;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changeServerPage(${currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
    }
    
    pagination.innerHTML = paginationHTML;
}

// Change page for server-side pagination
function changeServerPage(page) {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
        currentPage = page;
        loadVillageData();
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
    let colSpan = 6; // default for taluk
    if (tableId === 'village-data-table') {
        colSpan = getColumnCount();
    }
    
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
    let colSpan = 6; // default for taluk
    if (tableId === 'village-data-table') {
        colSpan = getColumnCount();
    }
    
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
            Volume_No: 'VOL-001',
            Sub: null,
            Year: '1990-1991',
            file_id: 24530361,
            office_code: 100,
            File_Name: 'ಕಸಬ_ಅಗರಹರ_20250829_125227.json',
            No_OF_Records_Extracted: 1
        },
        {
            Sl_No: 2,
            district_code: 19,
            taluk_code: 9,
            hobli_code: 1,
            village_code: 73,
            'data-category': 'File',
            'data-year': '1991-1992',
            'data-ofcname': 'Taluk Office, ಮಾಲೂರು',
            onclick: 'fnViewFile(24530362,100)',
            Office_Name: 'Taluk Office, ಮಾಲೂರು',
            File_No: 'FILE-001-1992',
            Volume_No: null,
            Sub: 'Land Records and Survey Settlement',
            Year: '1991-1992',
            file_id: 24530362,
            office_code: 100,
            File_Name: 'test_file_2.json',
            No_OF_Records_Extracted: 1
        }
        // Add more mock data as needed
    ];
    
    // Mock village_code data
    villageCodeData = [
        {
            Sl_No: 1,
            DistrictCode: 19,
            DistrictName: 'ಮಾಲೂರು',
            TalukCode: 9,
            TalukName: 'ಮಾಲೂರು ತಾಲೂಕು',
            HobliCode: 1,
            HobliName: 'ಮಾಲೂರು ಹೊಬ್ಳಿ',
            VillageCode: 72,
            VillageName: 'ಕಸಬ ಅಗರಹರ'
        },
        {
            Sl_No: 2,
            DistrictCode: 19,
            DistrictName: 'ಮಾಲೂರು',
            TalukCode: 9,
            TalukName: 'ಮಾಲೂರು ತಾಲೂಕು',
            HobliCode: 1,
            HobliName: 'ಮಾಲೂರು ಹೊಬ್ಳಿ',
            VillageCode: 73,
            VillageName: 'ಟೆಸ್ಟ್ ವಿಲೇಜ್'
        }
    ];
    
    filteredVillageData = [...villageData];
    populateVillageFilters();
    updateTableHeaders();
    displayVillageData();
}