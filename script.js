// Initialize variables
let displayValue = '0'; // Only show 0 at initial load
let calculationHistory = [];
const maxHistoryPoints = 10;
let streak = 0;
let currentGraphType = 'line';

// Add new variables for scientific calculator
let isScientificMode = false;
let isRadianMode = false;
let secondaryDisplayValue = '';

// Create audio context and sounds
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function createSound(frequency, type = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Particle effect function
function createParticles(x, y, color) {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.backgroundColor = color;
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.borderRadius = '50%';
        document.body.appendChild(particle);
        
        const angle = (i * 360) / particleCount;
        const velocity = 2;
        const rad = angle * Math.PI / 180;
        
        particle.style.transform = `translate(${Math.cos(rad) * 50}px, ${Math.sin(rad) * 50}px)`;
        
        setTimeout(() => particle.remove(), 600);
    }
}

// Initialize Chart.js with enhanced styling
const ctx = document.getElementById('calculationGraph').getContext('2d');
let chart = createChart('line');

function createChart(type) {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1500,
            easing: 'easeInOutElastic'
        },
        plugins: {
            legend: {
                display: type === 'pie' || type === 'radar',
                position: 'bottom',
                labels: {
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    padding: 15,
                    usePointStyle: true
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1971c2',
                titleFont: {
                    size: 14,
                    weight: 'bold'
                },
                bodyColor: '#666',
                bodyFont: {
                    size: 13
                },
                borderColor: '#1971c2',
                borderWidth: 1,
                padding: 12,
                displayColors: true
            }
        }
    };

    const typeSpecificOptions = {
        line: {
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.4
                },
                point: {
                    radius: 6,
                    hoverRadius: 12
                }
            }
        },
        bar: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        },
        pie: {
            cutout: '30%',
            radius: '90%'
        },
        radar: {
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        backdropColor: 'transparent'
                    }
                }
            }
        },
        scatter: {
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    beginAtZero: true
                }
            }
        }
    };

    const config = {
        type: type,
        data: getChartData(type),
        options: {
            ...commonOptions,
            ...(typeSpecificOptions[type] || {})
        }
    };

    return new Chart(ctx, config);
}

function getChartData(type) {
    const labels = Array.from({ length: calculationHistory.length }, (_, i) => `${i + 1}`);
    const data = calculationHistory;

    switch (type) {
        case 'pie':
            return {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: data.map((_, i) => getColorFromIndex(i)),
                    borderColor: 'white',
                    borderWidth: 2
                }]
            };
        case 'radar':
            return {
                labels: labels,
                datasets: [{
                    label: 'Calculations',
                    data: data,
                    backgroundColor: 'rgba(25, 113, 194, 0.2)',
                    borderColor: '#1971c2',
                    borderWidth: 2,
                    pointBackgroundColor: '#1971c2'
                }]
            };
        case 'scatter':
            return {
                datasets: [{
                    label: 'Calculations',
                    data: data.map((value, index) => ({
                        x: index + 1,
                        y: value
                    })),
                    backgroundColor: '#1971c2',
                    borderColor: '#1971c2'
                }]
            };
        case 'bar':
            return {
                labels: labels,
                datasets: [{
                    label: 'Calculations',
                    data: data,
                    backgroundColor: data.map((_, i) => getColorFromIndex(i)),
                    borderColor: 'white',
                    borderWidth: 2
                }]
            };
        default: // line
            return {
                labels: labels,
                datasets: [{
                    label: 'Calculations',
                    data: data,
                    borderColor: '#1971c2',
                    backgroundColor: (context) => {
                        const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, context.chart.height);
                        gradient.addColorStop(0, 'rgba(25, 113, 194, 0.5)');
                        gradient.addColorStop(1, 'rgba(25, 113, 194, 0.0)');
                        return gradient;
                    },
                    fill: true
                }]
            };
    }
}

function getColorFromIndex(index) {
    const colors = [
        '#1971c2', '#23a6d5', '#23d5ab', '#ee7752', '#e73c7e',
        '#4c6ef5', '#40c057', '#fab005', '#fd7e14', '#cc5de8'
    ];
    return colors[index % colors.length];
}

// Update statistics
function updateStats() {
    if (calculationHistory.length === 0) return;

    const sum = calculationHistory.reduce((a, b) => a + b, 0);
    const avg = sum / calculationHistory.length;
    const max = Math.max(...calculationHistory);

    document.getElementById('averageValue').textContent = avg.toFixed(2);
    document.getElementById('sumValue').textContent = sum.toFixed(2);
    document.getElementById('maxValue').textContent = max.toFixed(2);

    // Add glow effect during updates
    document.querySelector('.calculator-container').classList.add('calculating');
    setTimeout(() => {
        document.querySelector('.calculator-container').classList.remove('calculating');
    }, 1500);
}

// Update graph with enhanced animation
function updateGraph(result) {
    calculationHistory.push(result);
    if (calculationHistory.length > maxHistoryPoints) {
        calculationHistory.shift();
    }

    // Create sparkle effect on new data point
    const canvas = document.getElementById('calculationGraph');
    const rect = canvas.getBoundingClientRect();
    const x = rect.right - 30;
    const y = rect.top + (rect.height / 2);
    createSparkles(x, y);

    // Update chart and stats
    chart.data = getChartData(currentGraphType);
    chart.options.animation.duration = 1000 + (streak * 100);
    chart.update();
    updateStats();
}

// Add graph type switching
document.querySelectorAll('.graph-type-btn').forEach(button => {
    button.addEventListener('click', () => {
        const type = button.getAttribute('data-type');
        if (type === currentGraphType) return;

        // Update active button
        document.querySelector('.graph-type-btn.active').classList.remove('active');
        button.classList.add('active');

        // Transition effect
        const wrapper = document.querySelector('.graph-wrapper');
        wrapper.classList.add('transitioning');

        // Destroy current chart and create new one
        chart.destroy();
        currentGraphType = type;
        setTimeout(() => {
            chart = createChart(type);
            wrapper.classList.remove('transitioning');
        }, 300);

        // Play switch sound
        createSound(660, 'sine');
    });
});

// Mode switching
document.querySelectorAll('.mode-btn').forEach(button => {
    button.addEventListener('click', () => {
        const mode = button.getAttribute('data-mode');
        if ((mode === 'scientific' && isScientificMode) || 
            (mode === 'basic' && !isScientificMode)) return;

        // Update active button
        document.querySelector('.mode-btn.active').classList.remove('active');
        button.classList.add('active');

        // Switch calculator mode while preserving the current value
        isScientificMode = mode === 'scientific';
        document.querySelector('.basic-buttons').classList.toggle('hidden');
        document.querySelector('.scientific-buttons').classList.toggle('hidden');
        
        // Only clear if there's an error, otherwise keep the display as is
        if (displayValue === 'Error') {
            displayValue = '';
            secondaryDisplayValue = '';
        }
        
        // Play mode switch sound
        createSound(880, 'sine');
    });
});

// Angle mode switching with improved display handling
document.querySelectorAll('.angle-btn').forEach(button => {
    button.addEventListener('click', () => {
        const mode = button.getAttribute('data-angle');
        if ((mode === 'rad' && isRadianMode) || 
            (mode === 'deg' && !isRadianMode)) return;

        // Update active button
        document.querySelector('.angle-btn.active').classList.remove('active');
        button.classList.add('active');

        // Switch angle mode
        isRadianMode = mode === 'rad';
        
        // Keep current display value if it exists, otherwise show 0
        if (!displayValue || displayValue === '') {
            displayValue = '0';
        }
        
        // Show mode change in secondary display
        secondaryDisplayValue = `Mode: ${isRadianMode ? 'RAD' : 'DEG'}`;
        updateDisplay();
        
        // Play mode switch sound
        createSound(660, 'sine');
        
        // Clear the mode indicator after 1 second
        setTimeout(() => {
            if (secondaryDisplayValue === `Mode: ${isRadianMode ? 'RAD' : 'DEG'}`) {
                secondaryDisplayValue = '';
                updateDisplay();
            }
        }, 1000);
    });
});

// Update display function with improved empty display handling
function updateDisplay() {
    const display = document.getElementById('display');
    const secondaryDisplay = document.getElementById('secondaryDisplay');
    
    // Don't modify displayValue if it's empty or has content
    // Only set to '0' if it's null/undefined
    if (displayValue === null || displayValue === undefined) {
        displayValue = '';
    }
    
    // Always ensure displayValue is a string, but don't modify empty strings
    if (displayValue !== '') {
        displayValue = displayValue.toString();
    }
    
    // Handle secondary display - keep it empty if no value
    if (!secondaryDisplayValue || secondaryDisplayValue === 'null' || 
        secondaryDisplayValue === null || secondaryDisplayValue === undefined) {
        secondaryDisplayValue = '';
    }
    
    // Only show the value if it exists, otherwise show empty string
    display.value = displayValue;
    secondaryDisplay.textContent = secondaryDisplayValue;
    
    if (displayValue === 'Error') {
        display.style.color = '#dc3545';
        createSound(200, 'sawtooth');
        display.classList.add('shake');
        setTimeout(() => display.classList.remove('shake'), 500);
    } else {
        display.style.color = '#212529';
    }
}

// Add sparkle effect function
function createSparkles(x, y) {
    const colors = ['#1971c2', '#23a6d5', '#23d5ab'];
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle sparkle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.width = '4px';
        particle.style.height = '4px';
        document.body.appendChild(particle);
        
        const angle = (i * 30) + (Math.random() * 20 - 10);
        const distance = 30 + (Math.random() * 40);
        const rad = angle * Math.PI / 180;
        
        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${Math.cos(rad) * distance}px, ${Math.sin(rad) * distance}px) scale(0)`, opacity: 0 }
        ], {
            duration: 1000,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards'
        });
        
        setTimeout(() => particle.remove(), 1000);
    }
}

// Scientific calculator functions with enhanced precision and additional functions
const scientificFunctions = {
    // Trigonometric functions
    sin: (x) => {
        const result = isRadianMode ? Math.sin(x) : Math.sin(x * Math.PI / 180);
        return Number(result.toPrecision(10));
    },
    cos: (x) => {
        const result = isRadianMode ? Math.cos(x) : Math.cos(x * Math.PI / 180);
        return Number(result.toPrecision(10));
    },
    tan: (x) => {
        const result = isRadianMode ? Math.tan(x) : Math.tan(x * Math.PI / 180);
        return Number(result.toPrecision(10));
    },
    // Inverse trigonometric functions
    asin: (x) => {
        const result = isRadianMode ? Math.asin(x) : Math.asin(x) * 180 / Math.PI;
        return Number(result.toPrecision(10));
    },
    acos: (x) => {
        const result = isRadianMode ? Math.acos(x) : Math.acos(x) * 180 / Math.PI;
        return Number(result.toPrecision(10));
    },
    atan: (x) => {
        const result = isRadianMode ? Math.atan(x) : Math.atan(x) * 180 / Math.PI;
        return Number(result.toPrecision(10));
    },
    // Hyperbolic functions
    sinh: (x) => Number(Math.sinh(x).toPrecision(10)),
    cosh: (x) => Number(Math.cosh(x).toPrecision(10)),
    tanh: (x) => Number(Math.tanh(x).toPrecision(10)),
    // Logarithmic functions
    log: (x) => Number(Math.log10(x).toPrecision(10)),
    ln: (x) => Number(Math.log(x).toPrecision(10)),
    log2: (x) => Number(Math.log2(x).toPrecision(10)),
    // Power and root functions
    sqrt: (x) => Number(Math.sqrt(x).toPrecision(10)),
    cbrt: (x) => Number(Math.cbrt(x).toPrecision(10)),
    exp: (x) => Number(Math.exp(x).toPrecision(10)),
    pow: (x, y) => Number(Math.pow(x, y).toPrecision(10)),
    // Special functions
    abs: (x) => Math.abs(x),
    fact: (x) => {
        if (!Number.isInteger(x) || x < 0) return NaN;
        if (x === 0) return 1;
        let result = 1;
        for (let i = 2; i <= x; i++) result *= i;
        return result;
    },
    mod: (x, y) => x % y,
    tenPow: (x) => Number(Math.pow(10, x).toPrecision(10)),
    // Additional scientific functions
    floor: (x) => Math.floor(x),
    ceil: (x) => Math.ceil(x),
    round: (x) => Math.round(x),
    sign: (x) => Math.sign(x),
    // Statistical functions
    random: () => Math.random(),
    // Conversion functions
    toRad: (x) => x * Math.PI / 180,
    toDeg: (x) => x * 180 / Math.PI
};

// Mathematical constants with high precision
const CONSTANTS = {
    pi: Math.PI,
    e: Math.E,
    phi: (1 + Math.sqrt(5)) / 2, // Golden ratio
    ln2: Math.LN2,
    ln10: Math.LN10,
    log2e: Math.LOG2E,
    log10e: Math.LOG10E,
    sqrt2: Math.SQRT2,
    sqrt1_2: Math.SQRT1_2
};

// Enhanced calculate function with improved scientific operation handling
function calculate() {
    try {
        let expression = displayValue
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/π/g, `(${Math.PI})`)
            .replace(/e(?![^(]*\))/g, `(${Math.E})`)
            .replace(/\^/g, '**')
            .replace(/ mod /g, '%');

        // Handle scientific functions with improved error checking
        Object.keys(scientificFunctions).forEach(func => {
            const regex = new RegExp(`${func}\\((.*?)\\)`, 'g');
            expression = expression.replace(regex, (match, p1) => {
                try {
                    const args = p1.split(',').map(arg => {
                        const evaluated = eval(arg.trim());
                        if (typeof evaluated !== 'number') {
                            throw new Error(`Invalid argument type for ${func}`);
                        }
                        return evaluated;
                    });

                    // Special handling for factorial
                    if (func === 'fact' && (!Number.isInteger(args[0]) || args[0] < 0)) {
                        throw new Error('Factorial requires a non-negative integer');
                    }

                    const result = scientificFunctions[func](...args);
                    if (isNaN(result) || !isFinite(result)) {
                        throw new Error(`Invalid result for ${func}`);
                    }
                    return `(${result})`;
                } catch (error) {
                    throw new Error(`Error in ${func}: ${error.message}`);
                }
            });
        });

        // Evaluate with additional error checking
        const result = eval(expression);
        
        // Check for valid numerical result
        if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
            throw new Error('Invalid calculation result');
        }

        // Format result based on size and precision
        let formattedResult;
        if (Math.abs(result) > 1e10 || (Math.abs(result) < 1e-10 && result !== 0)) {
            formattedResult = result.toExponential(6);
        } else {
            // Use different precision for integer vs decimal results
            formattedResult = Number.isInteger(result) 
                ? result.toString()
                : Number(result.toPrecision(10)).toString();
        }

        // Update displays
        secondaryDisplayValue = displayValue;
        displayValue = formattedResult;
        
        updateDisplay();
        updateGraph(result);
        
        // Success feedback
        createSound(440 + (streak * 50));
        const display = document.getElementById('display');
        const rect = display.getBoundingClientRect();
        createParticles(rect.right, rect.top + rect.height / 2, '#1971c2');
        
        streak++;
    } catch (error) {
        displayValue = 'Error';
        secondaryDisplayValue = error.message;
        updateDisplay();
        streak = 0;
    }
}

// Enhanced button click handler
document.querySelectorAll('.calculator button').forEach(button => {
    button.addEventListener('click', (e) => {
        const value = button.getAttribute('data-value');
        const rect = button.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        // Create ripple effect
        createParticles(x, y, button.classList.contains('operator') || button.classList.contains('function-btn') 
            ? '#1971c2' : '#212529');
        
        // Play different sounds for different button types
        if (button.classList.contains('operator') || button.classList.contains('function-btn')) {
            createSound(330, 'triangle');
        } else if (button.classList.contains('equals')) {
            createSound(440, 'sine');
        } else {
            createSound(220, 'sine');
        }

        switch (value) {
            case 'clear':
                displayValue = '0'; // Only place where we explicitly set to '0'
                secondaryDisplayValue = '';
                streak = 0;
                break;
            case 'backspace':
                if (displayValue.length <= 1) {
                    displayValue = ''; // Keep empty instead of showing '0'
                } else {
                    displayValue = displayValue.slice(0, -1);
                }
                break;
            case '=':
                calculate();
                return;
            case 'pi':
                if (displayValue === '0') {
                    displayValue = 'π';
                } else {
                    displayValue += 'π';
                }
                break;
            case 'e':
                if (displayValue === '0') {
                    displayValue = 'e';
                } else {
                    displayValue += 'e';
                }
                break;
            case 'sin':
            case 'cos':
            case 'tan':
            case 'asin':
            case 'acos':
            case 'atan':
            case 'sinh':
            case 'cosh':
            case 'tanh':
            case 'log':
            case 'ln':
            case 'log2':
            case 'sqrt':
            case 'cbrt':
            case 'abs':
            case 'fact':
                if (displayValue === '0') {
                    displayValue = `${value}(`;
                } else {
                    displayValue += `${value}(`;
                }
                break;
            case 'pow':
                displayValue += '^(';
                break;
            case '10^x':
                if (displayValue === '0') {
                    displayValue = '10^(';
                } else {
                    displayValue += '10^(';
                }
                break;
            case 'mod':
                displayValue += ' mod ';
                break;
            case '(':
            case ')':
                if (displayValue === '0' && value === '(') {
                    displayValue = '(';
                } else {
                    displayValue += value;
                }
                break;
            default:
                if (displayValue === '0' && !['/', '*', '-', '+', '.'].includes(value)) {
                    displayValue = value;
                } else {
                    displayValue += value;
                }
        }
        updateDisplay();
    });
});

// Enhanced keyboard support
document.addEventListener('keydown', (event) => {
    const key = event.key;
    
    if (/[0-9.]/.test(key)) {
        createSound(220, 'sine');
        displayValue += key;
        updateDisplay();
    } else if (['+', '-', '*', '/', '%', '(', ')'].includes(key)) {
        createSound(330, 'triangle');
        displayValue += key;
        updateDisplay();
    } else if (key === 'Enter') {
        createSound(440, 'sine');
        calculate();
    } else if (key === 'Backspace') {
        createSound(165, 'triangle');
        displayValue = displayValue.slice(0, -1);
        updateDisplay();
    } else if (key === 'Escape') {
        createSound(110, 'triangle');
        displayValue = '0';
        secondaryDisplayValue = '';
        streak = 0;
        updateDisplay();
    }
});

// Add CSS animation for shake effect
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    .shake {
        animation: shake 0.2s ease-in-out 0s 2;
    }
`;
document.head.appendChild(style);

// Add button hover effect
document.querySelectorAll('.calculator button').forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
    });
}); 