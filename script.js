let originalData = [];
let filteredData = [];
let charts = {};
let selectedStatuses = [];
let selectedDrivers = [];

// Initialize timestamp updates
function updateTimestamps() {
    const now = new Date();
    const timestamp = now.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    // Update main timestamp
    const currentTimeElement = document.getElementById('currentTime');
    if (currentTimeElement) {
        currentTimeElement.textContent = timestamp;
    }
    
    // Update all chart timestamps
    const chartTimestamps = [
        'statusChartTime',
        'driverChartTime', 
        'driverCumulativeChartTime',
        'hourlyChartTime',
        'cancellationChartTime',
        'metricsChartTime',
        'driverTableTime',
        'recentRidesTime'
    ];
    
    chartTimestamps.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = `Generated: ${timestamp}`;
        }
    });
}

// Initialize upload handlers
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('csvFile').addEventListener('change', handleFileUpload);
    
    const headerSection = document.querySelector('.header');
    headerSection.addEventListener('dragover', handleDragOver);
    headerSection.addEventListener('drop', handleDrop);
    headerSection.addEventListener('dragleave', handleDragLeave);
    
    // Filter handlers  
    document.getElementById('dateFilter').addEventListener('change', applyFilters);
    
    // Multiselect handlers
    document.getElementById('statusFilter').addEventListener('click', () => toggleDropdown('statusDropdown'));
    document.getElementById('driverFilter').addEventListener('click', () => toggleDropdown('driverDropdown'));
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.multiselect-container')) {
            document.querySelectorAll('.multiselect-dropdown').forEach(dropdown => {
                dropdown.classList.remove('open');
            });
        }
    });
    
    // Reposition dropdowns on window resize
    window.addEventListener('resize', () => {
        document.querySelectorAll('.multiselect-dropdown.open').forEach(dropdown => {
            const container = dropdown.closest('.multiselect-container');
            if (container) {
                const trigger = container.querySelector('.multiselect');
                const rect = trigger.getBoundingClientRect();
                
                dropdown.style.top = `${rect.bottom + 8}px`;
                dropdown.style.left = `${rect.left}px`;
                dropdown.style.width = `${rect.width}px`;
            }
        });
    });
    
    // Initialize timestamps
    updateTimestamps();
    setInterval(updateTimestamps, 1000); // Update every second
});

// Chart.js data label plugin configuration
const chartDataLabelOptions = {
    plugins: {
        datalabels: {
            display: true,
            color: '#FFFFFF',
            font: {
                family: 'JetBrains Mono',
                size: 12,
                weight: 'bold'
            },
            formatter: (value, context) => {
                // Format numbers for better readability
                if (value === 0) return '';
                if (value < 1000) return value.toString();
                if (value < 1000000) return (value / 1000).toFixed(1) + 'k';
                return (value / 1000000).toFixed(1) + 'M';
            },
            anchor: 'center',
            align: 'center'
        }
    }
};

function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const isOpen = dropdown.classList.contains('open');
    
    // Close all other dropdowns first
    document.querySelectorAll('.multiselect-dropdown').forEach(d => {
        d.classList.remove('open');
    });
    
    if (!isOpen) {
        // Get the trigger element (parent container)
        const container = dropdown.closest('.multiselect-container');
        const trigger = container.querySelector('.multiselect');
        const rect = trigger.getBoundingClientRect();
        
        // Position the dropdown
        dropdown.style.top = `${rect.bottom + 8}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.width = `${rect.width}px`;
        
        dropdown.classList.add('open');
    }
}

function createMultiselect(containerId, dropdownId, options, selectedArray, placeholder) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = '';
    
    options.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'multiselect-option';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = option;
        checkbox.checked = selectedArray.includes(option);
        
        const label = document.createElement('label');
        label.textContent = option;
        label.style.cursor = 'pointer';
        label.style.margin = '0';
        
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                if (!selectedArray.includes(option)) {
                    selectedArray.push(option);
                }
            } else {
                const index = selectedArray.indexOf(option);
                if (index > -1) {
                    selectedArray.splice(index, 1);
                }
            }
            updateMultiselectDisplay(containerId, selectedArray, placeholder);
            applyFilters();
        });
        
        optionDiv.appendChild(checkbox);
        optionDiv.appendChild(label);
        dropdown.appendChild(optionDiv);
    });
}

function updateMultiselectDisplay(containerId, selectedArray, placeholder) {
    const container = document.getElementById(containerId);
    if (selectedArray.length === 0) {
        container.textContent = placeholder;
    } else if (selectedArray.length === 1) {
        container.textContent = selectedArray[0];
    } else {
        container.textContent = `${selectedArray.length} selected`;
    }
}

function formatDateDDMMYYYY(dateStr) {
    if (!dateStr) return '';
    const date = parseDDMMYYYY(dateStr);
    if (!date || isNaN(date)) return dateStr;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function formatTime(dateStr) {
    if (!dateStr) return '';
    const date = parseDDMMYYYY(dateStr);
    if (!date || isNaN(date)) return '';
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function parseDDMMYYYY(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    
    // Parse format: dd.mm.yyyy hh:mm:ss
    const parts = dateStr.split(' ');
    const datePart = parts[0];
    const timePart = parts[1] || '00:00:00';
    
    const dateSegments = datePart.split('.');
    const timeSegments = timePart.split(':');
    
    if (dateSegments.length !== 3) return null;
    
    const [day, month, year] = dateSegments;
    const [hour, minute, second] = timeSegments;
    
    // Validate numeric values
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const hourNum = parseInt(hour) || 0;
    const minuteNum = parseInt(minute) || 0;
    const secondNum = parseInt(second) || 0;
    
    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return null;
    
    // Create date with proper format (year, month-1, day, hour, minute, second)
    return new Date(yearNum, monthNum - 1, dayNum, hourNum, minuteNum, secondNum);
}

function handleDragOver(e) {
    e.preventDefault();
    document.querySelector('.header').style.background = 'linear-gradient(135deg, rgba(227, 30, 36, 0.2) 0%, rgba(227, 30, 36, 0.1) 100%)';
}

function handleDragLeave(e) {
    e.preventDefault();
    document.querySelector('.header').style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)';
}

function handleDrop(e) {
    e.preventDefault();
    document.querySelector('.header').style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        parseCSV(csv);
    };
    reader.readAsText(file);
}

function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(';').map(h => h.trim().replace('\ufeff', ''));
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(';');
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim() : '';
            });
            data.push(row);
        }
    }
    
    originalData = data;
    filteredData = [...data];
    populateFilters();
    
    // Set default to today
    document.getElementById('dateFilter').value = 'today';
    applyFilters(); // This will apply today filter and generate analytics
    
    document.getElementById('analytics').classList.remove('hidden');
    
    // Update timestamps after loading data
    updateTimestamps();
}

function populateFilters() {
    // Status multiselect
    const statuses = [...new Set(originalData.map(row => row.Status))].filter(Boolean);
    createMultiselect('statusFilter', 'statusDropdown', statuses, selectedStatuses, 'Select Status...');
    
    // Driver multiselect
    const drivers = [...new Set(originalData.map(row => row['Driver']))].filter(Boolean);
    createMultiselect('driverFilter', 'driverDropdown', drivers.slice(0, 20), selectedDrivers, 'Select Drivers...');
}

function applyFilters() {
    filteredData = originalData.filter(row => {
        const dateFilter = document.getElementById('dateFilter').value;
        
        // Status filter (multiselect)
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(row.Status)) return false;
        
        // Driver filter (multiselect) 
        if (selectedDrivers.length > 0 && !selectedDrivers.includes(row['Driver'])) return false;
        
        if (dateFilter) {
            const pickupDate = parseDDMMYYYY(row['Pickup date']);
            if (!pickupDate || isNaN(pickupDate)) return true; // Skip invalid dates
            
            const now = new Date();
            
            switch (dateFilter) {
                case 'today':
                    if (pickupDate.toDateString() !== now.toDateString()) return false;
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (pickupDate < weekAgo) return false;
                    break;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    if (pickupDate < monthAgo) return false;
                    break;
            }
        }
        
        return true;
    });
    
    generateAnalytics();
    updateTimestamps();
}

function generateAnalytics() {
    generateSummaryStats();
    generateStatusChart();
    generateDriverChart();
    generateDriverCumulativeChart();
    generateHourlyChart();
    generateCancellationReasons();
    generateKeyMetrics();
    generateDriverTable();
    generateRecentRides();
}

function generateSummaryStats() {
    const total = filteredData.length;
    const completed = filteredData.filter(r => r.Status === 'Completed').length;
    const cancelled = filteredData.filter(r => r.Status === 'Cancelled').length;
    const driving = filteredData.filter(r => r.Status === 'Driving').length;
    
    const totalDistance = filteredData
        .filter(r => r.Status === 'Completed')
        .reduce((sum, r) => sum + parseFloat(r['Mileage, km']?.replace(',', '.') || 0), 0);
    
    const avgDistance = completed > 0 ? (totalDistance / completed) / 1000 : 0;
    
    const uniqueDrivers = new Set(filteredData.map(r => r['Driver'])).size;
    
    // Format total distance properly
    const totalKm = Math.round(totalDistance / 1000);
    const totalKmDisplay = totalKm >= 1000 ? `${Math.round(totalKm / 1000)}k` : totalKm.toString();
    
    const html = `
        <div class="stat-box">
            <span class="stat-number">${total.toLocaleString()}</span>
            <div class="stat-label">Total Rides</div>
        </div>
        <div class="stat-box">
            <span class="stat-number">${completed.toLocaleString()}</span>
            <div class="stat-label">Completed</div>
        </div>
        <div class="stat-box">
            <span class="stat-number">${cancelled.toLocaleString()}</span>
            <div class="stat-label">Cancelled</div>
        </div>
        <div class="stat-box">
            <span class="stat-number">${driving.toLocaleString()}</span>
            <div class="stat-label">In Progress</div>
        </div>
        <div class="stat-box">
            <span class="stat-number">${totalKmDisplay}</span>
            <div class="stat-label">Total KM</div>
        </div>
        <div class="stat-box">
            <span class="stat-number">${avgDistance.toFixed(1)}</span>
            <div class="stat-label">Avg KM/Ride</div>
        </div>
        <div class="stat-box">
            <span class="stat-number">${uniqueDrivers}</span>
            <div class="stat-label">Active Drivers</div>
        </div>
        <div class="stat-box">
            <span class="stat-number">${completed > 0 ? ((completed/total)*100).toFixed(1) : 0}%</span>
            <div class="stat-label">Success Rate</div>
        </div>
    `;
    
    document.getElementById('summaryStats').innerHTML = html;
}

function generateStatusChart() {
    const ctx = document.getElementById('statusChart').getContext('2d');
    
    if (charts.status) {
        charts.status.destroy();
    }
    
    const statusCounts = {};
    filteredData.forEach(row => {
        const status = row.Status || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const colors = {
        'Completed': '#0A6846',
        'Cancelled': '#E31E24',
        'Driving': '#ea580c',
        'Start': '#0ea5e9'
    };
    
    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: Object.keys(statusCounts).map(status => colors[status] || '#64748b'),
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: 'Poppins',
                            size: 13,
                            weight: '600'
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                datalabels: {
                    display: true,
                    color: '#FFFFFF',
                    font: {
                        family: 'JetBrains Mono',
                        size: 14,
                        weight: 'bold'
                    },
                    formatter: (value, context) => {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(0);
                        return `${value}\n(${percentage}%)`;
                    }
                }
            }
        },
        plugins: [{
            id: 'datalabels'
        }]
    });
}

function generateDriverChart() {
    const ctx = document.getElementById('driverChart').getContext('2d');
    
    if (charts.driver) {
        charts.driver.destroy();
    }
    
    const driverCounts = {};
    filteredData.filter(r => r.Status === 'Completed').forEach(row => {
        const driver = row['Driver'] || 'Unknown';
        driverCounts[driver] = (driverCounts[driver] || 0) + 1;
    });
    
    const sortedDrivers = Object.entries(driverCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    charts.driver = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedDrivers.map(([driver]) => driver),
            datasets: [{
                label: 'Completed Rides',
                data: sortedDrivers.map(([,count]) => count),
                backgroundColor: '#E31E24',
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    display: true,
                    color: '#FFFFFF',
                    font: {
                        family: 'JetBrains Mono',
                        size: 12,
                        weight: 'bold'
                    },
                    anchor: 'center',
                    align: 'center',
                    formatter: (value) => value > 0 ? value.toString() : ''
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        font: {
                            family: 'JetBrains Mono'
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            family: 'Poppins',
                            weight: '500'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        },
        plugins: [{
            id: 'datalabels'
        }]
    });
}

function generateDriverCumulativeChart() {
    const ctx = document.getElementById('driverCumulativeChart').getContext('2d');
    
    if (charts.driverCumulative) {
        charts.driverCumulative.destroy();
    }
    
    // Get top 5 drivers by completed rides
    const driverCompletedCount = {};
    filteredData.filter(r => r.Status === 'Completed').forEach(row => {
        const driver = row['Driver'] || 'Unknown';
        driverCompletedCount[driver] = (driverCompletedCount[driver] || 0) + 1;
    });
    
    const topDrivers = Object.entries(driverCompletedCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([driver]) => driver);
    
    // Create cumulative data for each driver throughout the day
    const hours = Array.from({length: 24}, (_, i) => i);
    const datasets = [];
    const colors = ['#E31E24', '#0A6846', '#1E3A5F', '#ea580c', '#0ea5e9'];
    
    topDrivers.forEach((driver, index) => {
        const driverRides = filteredData
            .filter(r => r.Status === 'Completed' && r['Driver'] === driver && r['Pickup date'])
            .map(r => {
                const pickupDate = parseDDMMYYYY(r['Pickup date']);
                return { 
                    hour: pickupDate ? pickupDate.getHours() : 0,
                    date: pickupDate
                };
            })
            .filter(r => r.date && !isNaN(r.date))
            .sort((a, b) => a.date - b.date);
        
        const cumulativeData = [];
        let cumulative = 0;
        
        for (let hour = 0; hour < 24; hour++) {
            const ridesInHour = driverRides.filter(r => r.hour === hour).length;
            cumulative += ridesInHour;
            cumulativeData.push(cumulative);
        }
        
        datasets.push({
            label: driver,
            data: cumulativeData,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '30',
            borderWidth: 4,
            fill: false,
            tension: 0.2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: colors[index % colors.length],
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2
        });
    });
    
    charts.driverCumulative = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours.map(h => `${h}:00`),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: 'Poppins',
                            size: 12,
                            weight: '600'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'line'
                    }
                },
                datalabels: {
                    display: false // Too cluttered for line charts
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cumulative Completed Rides',
                        font: {
                            family: 'Poppins',
                            weight: '600'
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        font: {
                            family: 'JetBrains Mono'
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Hour of Day',
                        font: {
                            family: 'Poppins',
                            weight: '600'
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        font: {
                            family: 'JetBrains Mono'
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function generateHourlyChart() {
    const ctx = document.getElementById('hourlyChart').getContext('2d');
    
    if (charts.hourly) {
        charts.hourly.destroy();
    }
    
    const hourCounts = Array(24).fill(0);
    
    filteredData.forEach(row => {
        if (row['Pickup date']) {
            const date = parseDDMMYYYY(row['Pickup date']);
            if (date && !isNaN(date)) {
                const hour = date.getHours();
                hourCounts[hour]++;
            }
        }
    });
    
    charts.hourly = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Rides',
                data: hourCounts,
                borderColor: '#E31E24',
                backgroundColor: 'rgba(227, 30, 36, 0.15)',
                borderWidth: 4,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: '#E31E24',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    display: true,
                    color: '#E31E24',
                    font: {
                        family: 'JetBrains Mono',
                        size: 10,
                        weight: 'bold'
                    },
                    align: 'top',
                    offset: 4,
                    formatter: (value) => value > 0 ? value.toString() : ''
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        font: {
                            family: 'JetBrains Mono'
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        font: {
                            family: 'JetBrains Mono'
                        }
                    }
                }
            }
        },
        plugins: [{
            id: 'datalabels'
        }]
    });
}

function generateCancellationReasons() {
    const reasonCounts = {};
    filteredData.filter(r => r.Status === 'Cancelled').forEach(row => {
        const reason = row['Cancellation reason'] || 'Unknown';
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
    
    const sortedReasons = Object.entries(reasonCounts)
        .sort(([,a], [,b]) => b - a);
    
    const html = sortedReasons.map(([reason, count]) => 
        `<div class="metric">
            <span>${reason}</span>
            <span class="metric-value">${count}</span>
        </div>`
    ).join('');
    
    document.getElementById('cancellationReasons').innerHTML = html;
}

function generateKeyMetrics() {
    const completed = filteredData.filter(r => r.Status === 'Completed');
    const cancelled = filteredData.filter(r => r.Status === 'Cancelled');
    
    const completionRate = filteredData.length > 0 ? 
        ((completed.length / filteredData.length) * 100).toFixed(1) : 0;
    
    const avgDistance = completed.length > 0 ? 
        completed.reduce((sum, r) => sum + parseFloat(r['Mileage, km']?.replace(',', '.') || 0), 0) / completed.length / 1000 : 0;
    
    const avgRideDuration = completed.filter(r => r['Pickup date'] && r['Completion date']).length > 0 ?
        completed.filter(r => r['Pickup date'] && r['Completion date'])
            .reduce((sum, r) => {
                const pickup = parseDDMMYYYY(r['Pickup date']);
                const completion = parseDDMMYYYY(r['Completion date']);
                if (pickup && completion && !isNaN(pickup) && !isNaN(completion)) {
                    return sum + (completion - pickup);
                }
                return sum;
            }, 0) / completed.filter(r => r['Pickup date'] && r['Completion date']).length / (1000 * 60) : 0;
    
    const uniqueDrivers = new Set(filteredData.map(r => r['Driver'])).size;
    
    // Calculate average rides per driver
    const avgRidesPerDriver = uniqueDrivers > 0 ? (filteredData.length / uniqueDrivers).toFixed(1) : 0;
    
    // Calculate peak hour
    const hourCounts = {};
    filteredData.forEach(row => {
        if (row['Pickup date']) {
            const date = parseDDMMYYYY(row['Pickup date']);
            if (date && !isNaN(date)) {
                const hour = date.getHours();
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            }
        }
    });
    
    const peakHour = Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
    
    const html = `
        <div class="metric">
            <span>Completion Rate</span>
            <span class="metric-value">${completionRate}%</span>
        </div>
        <div class="metric">
            <span>Avg Distance</span>
            <span class="metric-value">${avgDistance.toFixed(1)} km</span>
        </div>
        <div class="metric">
            <span>Avg Duration</span>
            <span class="metric-value">${avgRideDuration.toFixed(0)} min</span>
        </div>
        <div class="metric">
            <span>Active Drivers</span>
            <span class="metric-value">${uniqueDrivers}</span>
        </div>
        <div class="metric">
            <span>Avg Rides/Driver</span>
            <span class="metric-value">${avgRidesPerDriver}</span>
        </div>
        <div class="metric">
            <span>Peak Hour</span>
            <span class="metric-value">${peakHour !== 'N/A' ? peakHour + ':00' : 'N/A'}</span>
        </div>
    `;
    
    document.getElementById('keyMetrics').innerHTML = html;
}

function generateDriverTable() {
    const driverStats = {};
    
    filteredData.forEach(row => {
        const driver = row['Driver'] || 'Unknown';
        if (!driverStats[driver]) {
            driverStats[driver] = {
                total: 0,
                completed: 0,
                cancelled: 0,
                distance: 0,
                morningStart: null
            };
        }
        
        driverStats[driver].total++;
        
        if (row.Status === 'Completed') {
            driverStats[driver].completed++;
            driverStats[driver].distance += parseFloat(row['Mileage, km']?.replace(',', '.') || 0);
            
            // Track earliest successful ride for morning start time
            const pickupDate = parseDDMMYYYY(row['Pickup date']);
            if (pickupDate && !isNaN(pickupDate)) {
                if (!driverStats[driver].morningStart || pickupDate < driverStats[driver].morningStart) {
                    driverStats[driver].morningStart = pickupDate;
                }
            }
        } else if (row.Status === 'Cancelled') {
            driverStats[driver].cancelled++;
        }
    });
    
    const sortedDrivers = Object.entries(driverStats)
        .sort(([,a], [,b]) => b.completed - a.completed)
        .slice(0, 20);
    
    const tbody = document.querySelector('#driverTable tbody');
    tbody.innerHTML = sortedDrivers.map(([driver, stats]) => {
        const completionRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0;
        const morningStart = stats.morningStart ? formatTime(stats.morningStart) : 'N/A';
        
        return `
            <tr>
                <td>${driver}</td>
                <td data-sort="${stats.total}">${stats.total}</td>
                <td data-sort="${stats.completed}">${stats.completed}</td>
                <td data-sort="${stats.cancelled}">${stats.cancelled}</td>
                <td data-sort="${completionRate}">${completionRate}%</td>
                <td data-sort="${stats.morningStart ? stats.morningStart.getTime() : 0}">${morningStart}</td>
                <td data-sort="${stats.distance}">${(stats.distance/1000).toFixed(1)} km</td>
            </tr>
        `;
    }).join('');
    
    // Add sorting to table
    addTableSorting('driverTable');
}

function generateRecentRides() {
    const recentRides = filteredData
        .filter(r => r['Pickup date'])
        .map(r => ({
            ...r,
            parsedDate: parseDDMMYYYY(r['Pickup date'])
        }))
        .filter(r => r.parsedDate && !isNaN(r.parsedDate))
        .sort((a, b) => b.parsedDate - a.parsedDate)
        .slice(0, 20);
    
    const tbody = document.querySelector('#recentRides tbody');
    tbody.innerHTML = recentRides.map(ride => {
        const dateStr = formatDateDDMMYYYY(ride['Pickup date']);
        const timeStr = formatTime(ride['Pickup date']);
        const dateTime = `${dateStr} ${timeStr}`;
        const distance = parseFloat(ride['Mileage, km']?.replace(',', '.') || 0) / 1000;
        const route = ride['Address'] || 'N/A';
        
        return `
            <tr>
                <td data-sort="${ride['Order code'] || ''}">${ride['Order code'] || 'N/A'}</td>
                <td data-sort="${ride['Driver'] || ''}">${ride['Driver'] || 'N/A'}</td>
                <td data-sort="${ride.Status}"><span class="status-${ride.Status ? ride.Status.toLowerCase() : 'unknown'}">${ride.Status}</span></td>
                <td data-sort="${ride['Service class'] || ''}">${ride['Service class'] || 'N/A'}</td>
                <td data-sort="${ride.parsedDate.getTime()}">${dateTime}</td>
                <td data-sort="${route}" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${route}</td>
                <td data-sort="${distance}">${distance.toFixed(1)} km</td>
            </tr>
        `;
    }).join('');
    
    // Add sorting to table
    addTableSorting('recentRides');
}

function addTableSorting(tableId) {
    const table = document.getElementById(tableId);
    const headers = table.querySelectorAll('th.sortable');
    
    headers.forEach((header, index) => {
        header.addEventListener('click', () => {
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            
            // Remove sort indicators from all headers
            headers.forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
            });
            
            // Determine sort direction
            const isCurrentlyAsc = header.dataset.sortDir === 'asc';
            const sortDir = isCurrentlyAsc ? 'desc' : 'asc';
            header.dataset.sortDir = sortDir;
            header.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
            
            // Sort rows
            rows.sort((a, b) => {
                const aCell = a.children[index];
                const bCell = b.children[index];
                
                let aVal = aCell.dataset.sort || aCell.textContent;
                let bVal = bCell.dataset.sort || bCell.textContent;
                
                // Try to parse as numbers
                const aNum = parseFloat(aVal);
                const bNum = parseFloat(bVal);
                
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
                }
                
                // String comparison
                return sortDir === 'asc' 
                    ? aVal.toString().localeCompare(bVal.toString())
                    : bVal.toString().localeCompare(aVal.toString());
            });
            
            // Re-append sorted rows
            rows.forEach(row => tbody.appendChild(row));
        });
    });
}

// Load Chart.js datalabels plugin
(function() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js';
    script.onload = function() {
        Chart.register(ChartDataLabels);
    };
    document.head.appendChild(script);
})();