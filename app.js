// DOM Elements
const connectBtn = document.getElementById('connectBtn');
const refreshInfoBtn = document.getElementById('refreshInfoBtn');
const applyLightingBtn = document.getElementById('applyLightingBtn');
const applyPerfBtn = document.getElementById('applyPerfBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const debugLog = document.getElementById('debugLog');

const deviceNameEl = document.getElementById('deviceName');
const deviceFwEl = document.getElementById('deviceFw');
const deviceBatteryEl = document.getElementById('deviceBattery');

// Inputs
const ledEffectSelect = document.getElementById('ledEffect');
const ledColorInput = document.getElementById('ledColor');
const ledBrightnessInput = document.getElementById('ledBrightness');
const pollRateSelect = document.getElementById('pollRate');
const dpiXInput = document.getElementById('dpiX');
const dpiYInput = document.getElementById('dpiY');

// State
let razerDevice = null;
let transactionId = 0;

// Protocol Constants
const RAZER_VENDOR_ID = 0x1532;
const REPORT_LENGTH = 90;

// Connect to WebHID
connectBtn.addEventListener('click', async () => {
    if (razerDevice) {
        await disconnectDevice();
        return;
    }

    try {
        const devices = await navigator.hid.requestDevice({
            filters: [{ vendorId: RAZER_VENDOR_ID }]
        });

        if (devices.length > 0) {
            await connectDevice(devices);
        }
    } catch (err) {
        logMessage('ERROR', `Connection failed: ${err.message}`, 'error');
    }
});

async function connectDevice(devices) {
    // A single physical Razer mouse exposes multiple HID interfaces (devices).
    // We need to find the interface that accepts our Feature Reports.
    logMessage('SYS', `Finding correct configuration interface among ${devices.length} endpoints...`, 'tx');
    
    for (const device of devices) {
        try {
            if (!device.opened) {
                await device.open();
            }

            // Try to send a Get Firmware Version feature report
            const fwReport = buildReport(0x00, 0x81, 0x02, []);
            await device.sendFeatureReport(0x00, fwReport);
            
            // Wait 90ms to give the device plenty of time to process
            await new Promise(r => setTimeout(r, 90));
            
            // Try to receive the response
            const responseData = await device.receiveFeatureReport(0x00);
            let responseArray = new Uint8Array(responseData.buffer);
            
            // If WebHID included the Report ID (0x00) as the first byte, strip it
            if (responseArray.byteLength === 91 && responseArray[0] === 0x00) {
                responseArray = responseArray.slice(1);
            }
            
            // If we succeed, this is the correct interface!
            razerDevice = device;
            deviceNameEl.textContent = device.productName || 'Unknown Razer Device';
            connectBtn.textContent = 'Disconnect';
            connectBtn.classList.replace('btn-primary', 'btn-secondary');
            
            enableControls(true);
            logMessage('SYS', `Successfully connected to interface: ${device.productName}`, 'tx');
            
            // Parse the firmware response we just got
            parseResponse(responseArray);
            
            // Fetch battery info
            setTimeout(async () => {
                const batReport = buildReport(0x07, 0x80, 0x02, []);
                await sendReport(batReport);
            }, 100);

            return; // Exit once we found the right one
        } catch (err) {
            // This interface didn't work, close it and try the next one
            if (device.opened) await device.close();
            console.log(`Interface ${device.productName} failed:`, err);
        }
    }

    logMessage('ERROR', `Could not find a working configuration interface for this device.`, 'error');
}

async function disconnectDevice() {
    if (razerDevice) {
        await razerDevice.close();
        razerDevice = null;
        
        deviceNameEl.textContent = 'Not Connected';
        deviceFwEl.textContent = 'N/A';
        deviceBatteryEl.textContent = 'N/A';
        connectBtn.textContent = 'Connect Device';
        connectBtn.classList.replace('btn-secondary', 'btn-primary');
        
        enableControls(false);
        logMessage('SYS', 'Device disconnected', 'error');
    }
}

function enableControls(enable) {
    const elements = [
        refreshInfoBtn, applyLightingBtn, applyPerfBtn,
        ledEffectSelect, ledColorInput, ledBrightnessInput,
        pollRateSelect, dpiXInput, dpiYInput
    ];
    elements.forEach(el => el.disabled = !enable);
}

// OpenRazer Protocol Logic
function calculateCrc(report) {
    let crc = 0;
    for (let i = 2; i < 88; i++) {
        crc ^= report[i];
    }
    return crc;
}

function buildReport(commandClass, commandId, dataSize, args) {
    const report = new Uint8Array(REPORT_LENGTH);
    
    // Header
    report[0] = 0x00; // Status (New Command)
    report[1] = 0xFF; // Transaction ID (OpenRazer uses 0xFF)
    report[2] = 0x00; // Remaining Packets (H)
    report[3] = 0x00; // Remaining Packets (L)
    report[4] = 0x00; // Protocol Type
    report[5] = dataSize;
    report[6] = commandClass;
    report[7] = commandId;

    // Arguments
    if (args && args.length > 0) {
        for (let i = 0; i < args.length && i < 80; i++) {
            report[8 + i] = args[i];
        }
    }

    // CRC
    report[88] = calculateCrc(report);
    report[89] = 0x00; // Reserved

    return report;
}

async function sendReport(report) {
    if (!razerDevice) return null;

    const hexDump = Array.from(report).map(b => b.toString(16).padStart(2, '0')).join(' ');
    logMessage('TX', hexDump, 'tx');

    try {
        await razerDevice.sendFeatureReport(0x00, report);
        
        // Wait 90ms for device to process command
        await new Promise(r => setTimeout(r, 90));
        
        // Fetch the response
        const responseData = await razerDevice.receiveFeatureReport(0x00);
        let responseArray = new Uint8Array(responseData.buffer);
        
        // If WebHID included the Report ID (0x00) as the first byte, strip it
        if (responseArray.byteLength === 91 && responseArray[0] === 0x00) {
            responseArray = responseArray.slice(1);
        }
        
        const rxDump = Array.from(responseArray).map(b => b.toString(16).padStart(2, '0')).join(' ');
        logMessage('RX', rxDump, 'rx');
        
        parseResponse(responseArray);
    } catch (err) {
        logMessage('ERROR', `Send/Receive failed: ${err.message}`, 'error');
    }
}

function parseResponse(response) {
    // Only process our transaction
    // If status == 0x02 (Success), we can read data
    const status = response[0];
    const cmdClass = response[6];
    const cmdId = response[7];
    const args = response.slice(8, 88);

    if (status !== 0x02) return;

    // Get Firmware Version: Class 0x00, CMD 0x81
    if (cmdClass === 0x00 && cmdId === 0x81) {
        deviceFwEl.textContent = `v${args[0]}.${args[1]}`;
    }

    // Get Battery Level: Class 0x07, CMD 0x80
    if (cmdClass === 0x07 && cmdId === 0x80) {
        const battery = args[1];
        deviceBatteryEl.textContent = `${Math.round((battery / 255) * 100)}%`;
    }
}

// App Actions
async function fetchDeviceInfo() {
    // Get Firmware
    const fwReport = buildReport(0x00, 0x81, 0x02, []);
    await sendReport(fwReport);

    // Get Battery
    setTimeout(async () => {
        const batReport = buildReport(0x07, 0x80, 0x02, []);
        await sendReport(batReport);
    }, 100);
}

refreshInfoBtn.addEventListener('click', fetchDeviceInfo);

applyLightingBtn.addEventListener('click', async () => {
    const effect = parseInt(ledEffectSelect.value);
    const colorHex = ledColorInput.value;
    const r = parseInt(colorHex.substr(1, 2), 16);
    const g = parseInt(colorHex.substr(3, 2), 16);
    const b = parseInt(colorHex.substr(5, 2), 16);
    const brightness = parseInt(ledBrightnessInput.value);

    // Set Brightness (Standard: Class 0x03, CMD 0x03)
    const brightReport = buildReport(0x03, 0x03, 0x03, [0x01, 0x00, brightness]); // VarStore=1, LedId=0 (typically scroll or logo)
    await sendReport(brightReport);

    setTimeout(async () => {
        let effectReport;
        if (effect === 0) { // Static (Standard Matrix Static: Class 0x03, CMD 0x0A, Effect 0x06)
            effectReport = buildReport(0x03, 0x0A, 0x04, [0x06, r, g, b]);
        } else if (effect === 1) { // Wave
            effectReport = buildReport(0x03, 0x0A, 0x02, [0x01, 0x01]); // Dir 1
        } else if (effect === 2) { // Spectrum
            effectReport = buildReport(0x03, 0x0A, 0x01, [0x04]);
        } else if (effect === 3) { // Breathing (Random)
            effectReport = buildReport(0x03, 0x0A, 0x08, [0x03, 0x03, 0,0,0, 0,0,0]);
        } else if (effect === 4) { // Reactive
            effectReport = buildReport(0x03, 0x0A, 0x05, [0x02, 0x01, r, g, b]);
        } else if (effect === 5) { // Starlight
            effectReport = buildReport(0x03, 0x0A, 0x01, [0x19, 0x03, 0x01, 0,0,0, 0,0,0]);
        }
        if (effectReport) await sendReport(effectReport);
    }, 100);
});

applyPerfBtn.addEventListener('click', async () => {
    const rate = parseInt(pollRateSelect.value);
    const dx = parseInt(dpiXInput.value);
    const dy = parseInt(dpiYInput.value);

    // Set Polling Rate (Class 0x00, CMD 0x05)
    let rateArg = 0x02; // 500Hz
    if (rate === 1000) rateArg = 0x01;
    if (rate === 125) rateArg = 0x08;
    const rateReport = buildReport(0x00, 0x05, 0x01, [rateArg]);
    await sendReport(rateReport);

    // Set DPI (Class 0x04, CMD 0x05)
    setTimeout(async () => {
        const dxH = (dx >> 8) & 0xFF;
        const dxL = dx & 0xFF;
        const dyH = (dy >> 8) & 0xFF;
        const dyL = dy & 0xFF;
        const dpiReport = buildReport(0x04, 0x05, 0x07, [0x01, dxH, dxL, dyH, dyL, 0x00, 0x00]);
        await sendReport(dpiReport);
    }, 100);
});

// Debug Logging
function logMessage(label, data, type) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 3 });
    
    entry.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span class="log-data"><span class="log-label">${label}</span> ${data}</span>
    `;
    
    debugLog.appendChild(entry);
    debugLog.scrollTop = debugLog.scrollHeight;
}

clearLogBtn.addEventListener('click', () => {
    debugLog.innerHTML = '';
});

// WebHID auto-connect on load if already granted
navigator.hid.getDevices().then(devices => {
    const razerDevices = devices.filter(d => d.vendorId === RAZER_VENDOR_ID);
    if (razerDevices.length > 0) {
        logMessage('SYS', `Found previously paired device: ${razerDevices[0].productName}. Click connect.`, 'tx');
    }
});
