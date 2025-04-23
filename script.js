// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    themeIcon.classList.replace('fa-moon', 'fa-sun');
} else {
    document.documentElement.classList.remove('dark');
    themeIcon.classList.replace('fa-sun', 'fa-moon');
}

themeToggle.addEventListener('click', () => {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }
});

// Mobile Menu Toggle
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Smooth Scrolling for Navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Close mobile menu if open
        mobileMenu.classList.add('hidden');
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        this.classList.add('active');
        
        // Scroll to section
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Update active nav link on scroll
window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY + 100;
    
    document.querySelectorAll('section').forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
});

// Appliance Management
const appliancesContainer = document.getElementById('appliances-container');
const addApplianceBtn = document.getElementById('add-appliance');
const commonAppliances = document.querySelectorAll('.common-appliance');
const tarifaInput = document.getElementById('tarifa');

// Inicializar tarifa desde localStorage o usar valor por defecto
if (localStorage.getItem('tarifa')) {
    tarifaInput.value = localStorage.getItem('tarifa');
}

// Almacenar tarifa en localStorage cuando cambie
tarifaInput.addEventListener('input', () => {
    const value = parseFloat(tarifaInput.value);
    if (!isNaN(value) && value > 0) {
        localStorage.setItem('tarifa', value);
        if (autoCalculate) {
            calculateConsumption();
        }
    }
});

// Validar entrada de tarifa
tarifaInput.addEventListener('blur', () => {
    validateInput(tarifaInput, 0.01, 2, "La tarifa debe ser un número positivo");
});

// Función para validar inputs numéricos
function validateInput(input, min, max, errorMessage) {
    const value = parseFloat(input.value);
    const errorMsgClass = "text-sm text-red-500 mt-1";
    let error = input.parentElement.querySelector(".input-error");
    
    // Limpiar error previo
    if (error) {
        error.remove();
        input.classList.remove("border-red-500");
    }
    
    // Validar valor
    if (isNaN(value) || value < min || (max !== undefined && value > max)) {
        error = document.createElement("div");
        error.className = "input-error " + errorMsgClass;
        error.textContent = errorMessage;
        input.parentElement.appendChild(error);
        input.classList.add("border-red-500");
        return false;
    }
    
    return true;
}

// Initialize appliances from localStorage or start with one appliance
let applianceCount = 0;
let applianceData = [];

// Load appliances from localStorage
function loadAppliances() {
    if (localStorage.getItem('appliances')) {
        try {
            applianceData = JSON.parse(localStorage.getItem('appliances'));
            
            // Clear existing appliances except the template
            const template = appliancesContainer.querySelector('.appliance-card');
            appliancesContainer.innerHTML = '';
            appliancesContainer.appendChild(template);
            
            // Add saved appliances
            applianceData.forEach(data => {
                const newAppliance = addNewAppliance(false);
                
                newAppliance.querySelector('.appliance-name').value = data.name || '';
                newAppliance.querySelector('.appliance-watts').value = data.watts || '';
                newAppliance.querySelector('.appliance-hours').value = data.hours || '';
                newAppliance.querySelector('.appliance-days').value = data.days || '';
                
                updateApplianceEstimate(newAppliance);
            });
            
            // Update count after loading
            updateApplianceCount();
            
            // Calculate with loaded appliances
            if (applianceData.length > 0) {
                calculateConsumption();
            }
        } catch (e) {
            console.error("Error loading appliances from localStorage:", e);
            // Start with one appliance if there's an error
            addNewAppliance();
        }
    } else {
        // Start with one appliance if none saved
        addNewAppliance();
    }
}

// Add common appliances
commonAppliances.forEach(appliance => {
    appliance.addEventListener('click', () => {
        const name = appliance.getAttribute('data-name');
        const watts = appliance.getAttribute('data-watts');
        const hours = appliance.getAttribute('data-hours');
        const days = appliance.getAttribute('data-days');
        
        const newAppliance = addNewAppliance();
        
        // Set values
        newAppliance.querySelector('.appliance-name').value = name;
        newAppliance.querySelector('.appliance-watts').value = watts;
        newAppliance.querySelector('.appliance-hours').value = hours;
        newAppliance.querySelector('.appliance-days').value = days;
        
        // Highlight briefly
        newAppliance.classList.add('input-highlight');
        setTimeout(() => {
            newAppliance.classList.remove('input-highlight');
        }, 1000);
        
        // Calculate estimate
        updateApplianceEstimate(newAppliance);
        
        // Save to localStorage
        saveAppliancesToLocalStorage();
    });
});

// Add new appliance
addApplianceBtn.addEventListener('click', () => {
    addNewAppliance();
    saveAppliancesToLocalStorage();
});

function addNewAppliance(shouldScroll = true) {
    const template = appliancesContainer.querySelector('.appliance-card');
    const newAppliance = template.cloneNode(true);
    
    // Clear inputs
    newAppliance.querySelector('.appliance-name').value = '';
    newAppliance.querySelector('.appliance-watts').value = '';
    newAppliance.querySelector('.appliance-hours').value = '';
    newAppliance.querySelector('.appliance-days').value = '';
    newAppliance.querySelector('.appliance-estimate').textContent = '0 kWh/mes';
    
    // Add delete functionality
    newAppliance.querySelector('.delete-appliance').addEventListener('click', () => {
        newAppliance.remove();
        applianceCount--;
        updateApplianceCount();
        calculateConsumption();
        saveAppliancesToLocalStorage();
    });
    
    // Add input listeners for real-time calculation
    const inputs = newAppliance.querySelectorAll('input');
    inputs.forEach(input => {
        // Validate numeric inputs
        if (input.classList.contains('appliance-watts')) {
            input.addEventListener('blur', () => {
                validateInput(input, 0, undefined, "La potencia debe ser un número positivo");
                saveAppliancesToLocalStorage();
            });
        } else if (input.classList.contains('appliance-hours')) {
            input.addEventListener('blur', () => {
                validateInput(input, 0, 24, "Las horas deben estar entre 0 y 24");
                saveAppliancesToLocalStorage();
            });
        } else if (input.classList.contains('appliance-days')) {
            input.addEventListener('blur', () => {
                validateInput(input, 0, 31, "Los días deben estar entre 0 y 31");
                saveAppliancesToLocalStorage();
            });
        }
        
        // Update on input change
        input.addEventListener('input', () => {
            updateApplianceEstimate(newAppliance);
            if (autoCalculate) {
                calculateConsumption();
            }
            // Debounce saving to localStorage
            clearTimeout(input.saveTimeout);
            input.saveTimeout = setTimeout(() => {
                saveAppliancesToLocalStorage();
            }, 500);
        });
    });
    
    appliancesContainer.appendChild(newAppliance);
    applianceCount++;
    updateApplianceCount();
    
    // Scroll to the new appliance
    if (shouldScroll) {
        setTimeout(() => {
            newAppliance.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
    
    return newAppliance;
}

function updateApplianceCount() {
    document.getElementById('appliance-count').textContent = applianceCount;
}

function updateApplianceEstimate(appliance) {
    const errorMsgClass = "text-sm text-red-500 mt-1";
    const showError = (input, message) => {
        let error = input.parentElement.querySelector(".input-error");
        if (!error) {
            error = document.createElement("div");
            error.className = "input-error " + errorMsgClass;
            input.parentElement.appendChild(error);
        }
        error.textContent = message;
        input.classList.add("border-red-500");
    };
    const clearError = (input) => {
        const error = input.parentElement.querySelector(".input-error");
        if (error) error.remove();
        input.classList.remove("border-red-500");
    };

    const watts = parseFloat(appliance.querySelector('.appliance-watts').value) || 0;
    const hours = parseFloat(appliance.querySelector('.appliance-hours').value) || 0;
    const days = parseFloat(appliance.querySelector('.appliance-days').value) || 0;
    
    const wattsInput = appliance.querySelector('.appliance-watts');
    const hoursInput = appliance.querySelector('.appliance-hours');
    const daysInput = appliance.querySelector('.appliance-days');

    clearError(wattsInput);
    clearError(hoursInput);
    clearError(daysInput);

    let hasError = false;
    if (watts < 0) {
        showError(wattsInput, "La potencia no puede ser negativa");
        hasError = true;
    }
    if (hours < 0 || hours > 24) {
        showError(hoursInput, "Las horas deben estar entre 0 y 24");
        hasError = true;
    }
    if (days < 0 || days > 31) {
        showError(daysInput, "Los días deben estar entre 0 y 31");
        hasError = true;
    }

    if (hasError) return;

    const dailyConsumption = (watts * hours) / 1000;
    const monthlyConsumption = dailyConsumption * days;
    
    // Update estimate display
    appliance.querySelector('.appliance-estimate').textContent = monthlyConsumption.toFixed(2) + ' kWh/mes';
}

// Save appliances to localStorage
function saveAppliancesToLocalStorage() {
    const appliances = document.querySelectorAll('.appliance-card');
    const applianceData = [];
    
    appliances.forEach(appliance => {
        // Skip the first one if it's the template (no values)
        const name = appliance.querySelector('.appliance-name').value;
        const watts = appliance.querySelector('.appliance-watts').value;
        const hours = appliance.querySelector('.appliance-hours').value;
        const days = appliance.querySelector('.appliance-days').value;
        
        // Only save if at least one field has a value
        if (name || watts || hours || days) {
            applianceData.push({
                name: name,
                watts: watts,
                hours: hours,
                days: days
            });
        }
    });
    
    localStorage.setItem('appliances', JSON.stringify(applianceData));
}

// Calculate Consumption
const calculateBtn = document.getElementById('calculate-btn');
let autoCalculate = false;

// Auto-calculate preference from localStorage
if (localStorage.getItem('autoCalculate') === 'true') {
    autoCalculate = true;
    // Visual indicator for auto-calculate
    calculateBtn.classList.add('bg-electric-700');
    calculateBtn.classList.add('dark:bg-electric-800');
}

calculateBtn.addEventListener('click', () => {
    // Toggle auto-calculate
    autoCalculate = !autoCalculate;
    localStorage.setItem('autoCalculate', autoCalculate);
    
    // Visual indicator for auto-calculate
    if (autoCalculate) {
        calculateBtn.classList.add('bg-electric-700');
        calculateBtn.classList.add('dark:bg-electric-800');
    } else {
        calculateBtn.classList.remove('bg-electric-700');
        calculateBtn.classList.remove('dark:bg-electric-800');
    }
    
    calculateConsumption();
});

// Charts
let consumptionChart, costChart;

function calculateConsumption() {
    const tariff = parseFloat(document.getElementById('tarifa').value) || 0.15;
    const appliances = document.querySelectorAll('.appliance-card');
    
    let totalDaily = 0;
    let totalMonthly = 0;
    let totalCost = 0;
    
    const applianceData = [];
    let totalWatts = 0;
    let totalHours = 0;
    let totalDays = 0;
    
    appliances.forEach(appliance => {
        const name = appliance.querySelector('.appliance-name').value || 'Electrodoméstico';
        const watts = parseFloat(appliance.querySelector('.appliance-watts').value) || 0;
        const hours = parseFloat(appliance.querySelector('.appliance-hours').value) || 0;
        const days = parseFloat(appliance.querySelector('.appliance-days').value) || 0;
        
        // Skip invalid entries
        if (watts < 0 || hours < 0 || hours > 24 || days < 0 || days > 31) {
            return; // Skip this appliance
        }
        
        // Calculate consumption
        const daily = (watts * hours) / 1000;
        const monthly = daily * days;
        const cost = monthly * tariff;
        
        totalDaily += daily;
        totalMonthly += monthly;
        totalCost += cost;
        
        totalWatts += watts;
        totalHours += hours;
        totalDays += days;
        
        applianceData.push({
            name: name,
            watts: watts,
            hours: hours,
            days: days,
            daily: daily,
            monthly: monthly,
            cost: cost
        });
    });
    
    // Save calculation results
    localStorage.setItem('lastCalculation', JSON.stringify({
        daily: totalDaily,
        monthly: totalMonthly,
        cost: totalCost,
        annual: totalMonthly * 12,
        annualCost: totalCost * 12
    }));
    
    // Update summary
    document.getElementById('daily-consumption').textContent = totalDaily.toFixed(2) + ' kWh';
    document.getElementById('monthly-consumption').textContent = totalMonthly.toFixed(2) + ' kWh';
    document.getElementById('monthly-cost').textContent = '€' + totalCost.toFixed(2);
    document.getElementById('annual-consumption').textContent = (totalMonthly * 12).toFixed(2) + ' kWh';
    document.getElementById('annual-cost').textContent = '€' + (totalCost * 12).toFixed(2);
    
    // Animate bars
    const maxDaily = 20; // 20 kWh as 100% for visualization
    const maxMonthly = 600; // 600 kWh as 100% for visualization
    const maxCost = 100; // €100 as 100% for visualization
    
    const dailyPercent = Math.min((totalDaily / maxDaily) * 100, 100);
    const monthlyPercent = Math.min((totalMonthly / maxMonthly) * 100, 100);
    const costPercent = Math.min((totalCost / maxCost) * 100, 100);
    
    document.getElementById('daily-bar').style.width = dailyPercent + '%';
    document.getElementById('monthly-bar').style.width = monthlyPercent + '%';
    document.getElementById('cost-bar').style.width = costPercent + '%';
    
    // Update results table
    const resultsTable = document.getElementById('results-table');
    resultsTable.innerHTML = '';
    
    if (applianceData.length === 0) {
        resultsTable.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">Añade electrodomésticos y haz clic en "Calcular Consumo"</td>
            </tr>
        `;
    } else {
        applianceData.forEach(data => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 dark:hover:bg-slate-600';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${data.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${data.watts} W</td>
                <td class="px-6 py-4 whitespace-nowrap">${data.hours} h</td>
                <td class="px-6 py-4 whitespace-nowrap">${data.days} días</td>
                <td class="px-6 py-4 whitespace-nowrap">${data.monthly.toFixed(2)} kWh</td>
                <td class="px-6 py-4 whitespace-nowrap text-electric-600 dark:text-electric-400">€${data.cost.toFixed(2)}</td>
            `;
            resultsTable.appendChild(row);
        });
    }
    
    // Update totals in table footer
    document.getElementById('total-watts').textContent = totalWatts + ' W';
    document.getElementById('total-hours').textContent = totalHours + ' h';
    document.getElementById('total-days').textContent = totalDays + ' días';
    document.getElementById('total-consumption').textContent = totalMonthly.toFixed(2) + ' kWh/mes';
    document.getElementById('total-cost').textContent = '€' + totalCost.toFixed(2);
    
    // Update charts
    updateCharts(applianceData);
    
    // Update comparison
    updateComparison(totalMonthly);
    
    // Update personalized tips
    updatePersonalizedTips(applianceData, totalMonthly);
}

function updateCharts(applianceData) {
    // Check if Chart is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }

    const ctxConsumption = document.getElementById('consumption-chart');
    const ctxCost = document.getElementById('cost-chart');
    
    // Check if chart elements exist
    if (!ctxConsumption || !ctxCost) {
        console.error('Chart elements not found');
        return;
    }
    
    const labels = applianceData.map(data => data.name);
    const consumptionData = applianceData.map(data => data.monthly);
    const costData = applianceData.map(data => data.cost);
    
    const backgroundColors = [
        'rgba(0, 168, 255, 0.7)',
        'rgba(255, 193, 7, 0.7)',
        'rgba(76, 175, 80, 0.7)',
        'rgba(156, 39, 176, 0.7)',
        'rgba(244, 67, 54, 0.7)',
        'rgba(255, 152, 0, 0.7)',
        'rgba(121, 85, 72, 0.7)'
    ];
    
    // Get theme-aware text color
    const textColor = document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#334155';
    
    // Destroy existing charts if they exist
    if (consumptionChart) {
        consumptionChart.destroy();
    }
    if (costChart) {
        costChart.destroy();
    }
    
    try {
        // Create new charts
        consumptionChart = new Chart(ctxConsumption, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: consumptionData,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: textColor
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value.toFixed(2)} kWh (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        costChart = new Chart(ctxCost, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: costData,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: textColor
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: €${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (e) {
        console.error('Error creating charts:', e);
    }
}

function updateComparison(userConsumption) {
    document.getElementById('user-consumption').textContent = userConsumption.toFixed(2);
    
    // Simulate average and efficient consumption
    const avgConsumption = 350; // Average household consumption
    const efficientConsumption = 250; // Efficient household consumption
    
    document.getElementById('avg-consumption').textContent = avgConsumption;
    document.getElementById('efficient-consumption').textContent = efficientConsumption;
    
    // Calculate differences
    const diffAvg = userConsumption - avgConsumption;
    const diffEfficient = userConsumption - efficientConsumption;
    
    const comparisonElement = document.getElementById('consumption-comparison');
    const efficiencyElement = document.getElementById('efficiency-comparison');
    
    if (diffAvg > 0) {
        comparisonElement.innerHTML = `<span class="text-red-500">+${diffAvg.toFixed(2)} kWh (${Math.abs(Math.round((diffAvg/avgConsumption)*100))}% más)</span>`;
    } else if (diffAvg < 0) {
        comparisonElement.innerHTML = `<span class="text-green-500">${diffAvg.toFixed(2)} kWh (${Math.abs(Math.round((diffAvg/avgConsumption)*100))}% menos)</span>`;
    } else {
        comparisonElement.innerHTML = `<span>Igual al promedio</span>`;
    }
    
    if (diffEfficient > 0) {
        efficiencyElement.innerHTML = `<span class="text-red-500">+${diffEfficient.toFixed(2)} kWh (${Math.abs(Math.round((diffEfficient/efficientConsumption)*100))}% más)</span>`;
    } else if (diffEfficient < 0) {
        efficiencyElement.innerHTML = `<span class="text-green-500">${diffEfficient.toFixed(2)} kWh (${Math.abs(Math.round((diffEfficient/efficientConsumption)*100))}% menos)</span>`;
    } else {
        efficiencyElement.innerHTML = `<span>Igual a hogares eficientes</span>`;
    }
}

function updatePersonalizedTips(applianceData, totalMonthly) {
    const tipsContainer = document.getElementById('personalized-tips');
    tipsContainer.innerHTML = '';
    
    if (applianceData.length === 0) {
        tipsContainer.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0 mt-1">
                    <div class="p-2 rounded-full bg-electric-100 dark:bg-electric-900 mr-4">
                        <i class="fas fa-info-circle text-electric-500 dark:text-electric-400"></i>
                    </div>
                </div>
                <div>
                    <p class="text-gray-600 dark:text-gray-300">Calcula tu consumo para recibir recomendaciones personalizadas basadas en tus electrodomésticos y patrones de uso.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Sort appliances by consumption (descending)
    const sortedAppliances = [...applianceData].sort((a, b) => b.monthly - a.monthly);
    
    // Add tips for top 3 consuming appliances
    sortedAppliances.slice(0, 3).forEach(appliance => {
        const tip = document.createElement('div');
        tip.className = 'flex items-start mb-4';
        
        let tipText = '';
        let icon = 'fa-lightbulb';
        let colorClass = 'text-electric-500 dark:text-electric-400';
        let bgClass = 'bg-electric-100 dark:bg-electric-900';
        
        if (appliance.name.toLowerCase().includes('aire') || 
            appliance.name.toLowerCase().includes('acond') || 
            appliance.name.toLowerCase().includes('calef')) {
            tipText = `Tu ${appliance.name} representa el ${Math.round((appliance.monthly/totalMonthly)*100)}% de tu consumo. Considera ajustar el termostato 1-2 grados para ahorrar hasta un 7% en su consumo.`;
            icon = 'fa-thermometer-half';
            colorClass = 'text-energy-500 dark:text-energy-400';
            bgClass = 'bg-energy-100 dark:bg-energy-900';
        } 
        else if (appliance.name.toLowerCase().includes('nevera') || 
                 appliance.name.toLowerCase().includes('frigo') || 
                 appliance.name.toLowerCase().includes('congel')) {
            tipText = `Tu ${appliance.name} consume ${appliance.monthly.toFixed(2)} kWh/mes. Asegúrate de mantener la temperatura entre 3-5°C y revisa los burletes para mejorar su eficiencia.`;
            icon = 'fa-snowflake';
        }
        else if (appliance.name.toLowerCase().includes('lava')) {
            tipText = `Usa tu ${appliance.name} con carga completa y en programas de baja temperatura para ahorrar hasta un ${Math.round((appliance.monthly/totalMonthly)*15)}% en su consumo mensual.`;
            icon = 'fa-tshirt';
        }
        else if (appliance.name.toLowerCase().includes('tv') || 
                 appliance.name.toLowerCase().includes('tele') || 
                 appliance.name.toLowerCase().includes('ordenador') ||
                 appliance.name.toLowerCase().includes('pc') ||
                 appliance.name.toLowerCase().includes('comput')) {
            tipText = `Tu ${appliance.name} consume energía incluso en standby. Conecta estos dispositivos a una regleta con interruptor para desconectarlos completamente cuando no los uses.`;
            icon = 'fa-plug';
        }
        else {
            tipText = `El ${appliance.name} representa una parte significativa de tu consumo (${appliance.monthly.toFixed(2)} kWh/mes). Considera reemplazarlo por un modelo más eficiente si tiene más de 5 años.`;
        }
        
        tip.innerHTML = `
            <div class="flex-shrink-0 mt-1">
                <div class="p-2 rounded-full ${bgClass} mr-4">
                    <i class="fas ${icon} ${colorClass}"></i>
                </div>
            </div>
            <div>
                <p class="text-gray-600 dark:text-gray-300">${tipText}</p>
            </div>
        `;
        
        tipsContainer.appendChild(tip);
    });
    
    // Add general tip based on total consumption
    const generalTip = document.createElement('div');
    generalTip.className = 'flex items-start';
    
    let generalTipText = '';
    let generalIcon = 'fa-lightbulb';
    let generalColorClass = 'text-electric-500 dark:text-electric-400';
    let generalBgClass = 'bg-electric-100 dark:bg-electric-900';
    if (totalMonthly > 500) {
        generalTipText = `Tu consumo mensual de ${totalMonthly.toFixed(2)} kWh es alto. Considera realizar una auditoría energética profesional para identificar oportunidades de ahorro.`;
        generalIcon = 'fa-exclamation-triangle';
        generalColorClass = 'text-red-500 dark:text-red-400';
        generalBgClass = 'bg-red-100 dark:bg-red-900';
    } 
    else if (totalMonthly > 300) {
        generalTipText = `Con un consumo de ${totalMonthly.toFixed(2)} kWh/mes, podrías ahorrar hasta un 20% implementando medidas de eficiencia como iluminación LED y electrodomésticos eficientes.`;
        generalIcon = 'fa-chart-line';
        generalColorClass = 'text-energy-500 dark:text-energy-400';
        generalBgClass = 'bg-energy-100 dark:bg-energy-900';
    }
    else {
        generalTipText = `¡Buen trabajo! Tu consumo de ${totalMonthly.toFixed(2)} kWh/mes es eficiente. Sigue aplicando buenas prácticas para mantenerlo bajo.`;
        generalIcon = 'fa-check-circle';
        generalColorClass = 'text-green-500 dark:text-green-400';
        generalBgClass = 'bg-green-100 dark:bg-green-900';
    }
    
    generalTip.innerHTML = `
        <div class="flex-shrink-0 mt-1">
            <div class="p-2 rounded-full ${generalBgClass} mr-4">
                <i class="fas ${generalIcon} ${generalColorClass}"></i>
            </div>
        </div>
        <div>
            <p class="text-gray-600 dark:text-gray-300">${generalTipText}</p>
        </div>
    `;
    
    tipsContainer.appendChild(generalTip);
    
    // Save tips to localStorage
    localStorage.setItem('lastTips', tipsContainer.innerHTML);
}

// Function to restore or clear calculator data
function clearAllData() {
    if (confirm('¿Estás seguro que deseas borrar todos los electrodomésticos y reiniciar la calculadora?')) {
        localStorage.removeItem('appliances');
        localStorage.removeItem('lastCalculation');
        localStorage.removeItem('lastTips');
        
        // Reset UI
        const template = appliancesContainer.querySelector('.appliance-card');
        appliancesContainer.innerHTML = '';
        appliancesContainer.appendChild(template);
        
        // Add one empty appliance
        addNewAppliance();
        
        // Reset calculations
        calculateConsumption();
    }
}

// Add a reset button
const resetButton = document.getElementById('reset-calculator');
if (resetButton) {
    resetButton.addEventListener('click', clearAllData);
}

// Function to export data as JSON
function exportData() {
    const appliances = document.querySelectorAll('.appliance-card');
    const applianceData = [];
    
    appliances.forEach(appliance => {
        const name = appliance.querySelector('.appliance-name').value;
        const watts = appliance.querySelector('.appliance-watts').value;
        const hours = appliance.querySelector('.appliance-hours').value;
        const days = appliance.querySelector('.appliance-days').value;
        
        // Only export if at least one field has a value
        if (name || watts || hours || days) {
            applianceData.push({
                name: name || 'Electrodoméstico',
                watts: parseFloat(watts) || 0,
                hours: parseFloat(hours) || 0,
                days: parseFloat(days) || 0
            });
        }
    });
    
    const exportData = {
        date: new Date().toISOString(),
        tariff: parseFloat(document.getElementById('tarifa').value) || 0.15,
        appliances: applianceData,
        calculations: {
            daily: parseFloat(document.getElementById('daily-consumption').textContent),
            monthly: parseFloat(document.getElementById('monthly-consumption').textContent),
            monthlyCost: parseFloat(document.getElementById('monthly-cost').textContent.replace('€', '')),
            annual: parseFloat(document.getElementById('annual-consumption').textContent),
            annualCost: parseFloat(document.getElementById('annual-cost').textContent.replace('€', ''))
        }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'calculadora-consumo.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
}

// Add export button
const exportButton = document.getElementById('export-data');
if (exportButton) {
    exportButton.addEventListener('click', exportData);
}

// Add import button functionality
const importButton = document.getElementById('import-data');
const importFileInput = document.getElementById('import-file');

if (importButton && importFileInput) {
    importButton.addEventListener('click', () => {
        importFileInput.click();
    });
    
    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate imported data structure
                if (!importedData.appliances || !Array.isArray(importedData.appliances)) {
                    throw new Error('Formato de archivo inválido');
                }
                
                // Set tariff if available
                if (importedData.tariff) {
                    document.getElementById('tarifa').value = importedData.tariff;
                    localStorage.setItem('tarifa', importedData.tariff);
                }
                
                // Clear existing appliances
                const template = appliancesContainer.querySelector('.appliance-card');
                appliancesContainer.innerHTML = '';
                appliancesContainer.appendChild(template);
                
                // Add imported appliances
                importedData.appliances.forEach(data => {
                    const newAppliance = addNewAppliance(false);
                    
                    newAppliance.querySelector('.appliance-name').value = data.name || '';
                    newAppliance.querySelector('.appliance-watts').value = data.watts || '';
                    newAppliance.querySelector('.appliance-hours').value = data.hours || '';
                    newAppliance.querySelector('.appliance-days').value = data.days || '';
                    
                    updateApplianceEstimate(newAppliance);
                });
                
                // Save imported data to localStorage
                saveAppliancesToLocalStorage();
                
                // Calculate with imported appliances
                calculateConsumption();
                
                alert('Datos importados correctamente');
            } catch (error) {
                console.error('Error importing data:', error);
                alert('Error al importar datos: ' + error.message);
            }
            
            // Reset file input
            importFileInput.value = '';
        };
        reader.readAsText(file);
    });
}

// Theme synchronization with charts
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    // Update charts when theme changes
    if (consumptionChart && costChart) {
        const textColor = document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#334155';
        
        consumptionChart.options.plugins.legend.labels.color = textColor;
        costChart.options.plugins.legend.labels.color = textColor;
        
        consumptionChart.update();
        costChart.update();
    }
});

// Update theme for existing charts when manually toggling theme
themeToggle.addEventListener('click', () => {
    setTimeout(() => {
        if (consumptionChart && costChart) {
            const textColor = document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#334155';
            
            consumptionChart.options.plugins.legend.labels.color = textColor;
            costChart.options.plugins.legend.labels.color = textColor;
            
            consumptionChart.update();
            costChart.update();
        }
    }, 100);
});

// Add event listeners for print button
const printButton = document.getElementById('print-report');
if (printButton) {
    printButton.addEventListener('click', () => {
        window.print();
    });
}

// Save last calculation to localStorage on beforeunload
window.addEventListener('beforeunload', () => {
    saveAppliancesToLocalStorage();
});

// Initialize with empty calculation
document.addEventListener('DOMContentLoaded', () => {
    // Load appliances from localStorage
    loadAppliances();
    
    // If no appliances were loaded, add one
    if (applianceCount === 0) {
        addNewAppliance();
    }
    
    // Initialize calculation
    calculateConsumption();
});