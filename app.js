// DOM Elements
const connectBtn = document.getElementById('connectBtn');
const refreshInfoBtn = document.getElementById('refreshInfoBtn');
const readBrightnessBtn = document.getElementById('readBrightnessBtn');
const applyBrightnessBtn = document.getElementById('applyBrightnessBtn');
const readEffectBtn = document.getElementById('readEffectBtn');
const applyEffectBtn = document.getElementById('applyEffectBtn');
const applyPerfBtn = document.getElementById('applyPerfBtn');
const readPerfBtn = document.getElementById('readPerfBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const debugLog = document.getElementById('debugLog');

const deviceNameEl = document.getElementById('deviceName');
const deviceFwEl = document.getElementById('deviceFw');
const deviceBatteryEl = document.getElementById('deviceBattery');

// Inputs
const ledZoneSelect = document.getElementById('ledZone');
const ledEffectSelect = document.getElementById('ledEffect');
const ledColorInput = document.getElementById('ledColor');
const ledBrightnessInput = document.getElementById('ledBrightness');
const ledSpeedInput = document.getElementById('ledSpeed');
const ledDirectionSelect = document.getElementById('ledDirection');

const colorContainer = document.getElementById('colorContainer');
const speedContainer = document.getElementById('speedContainer');
const directionContainer = document.getElementById('directionContainer');
const pollRateSelect = document.getElementById('pollRate');
const dpiXInput = document.getElementById('dpiX');
const dpiYInput = document.getElementById('dpiY');

// State
let razerDevice = null;

// Protocol Constants
const RAZER_VENDOR_ID = 0x1532;

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
    logMessage('SYS', `Finding correct configuration interface among ${devices.length} endpoints...`, 'tx');
    
    for (const device of devices) {
        try {
            if (!device.opened) {
                await device.open();
            }

            const fwReport = RazerProtocol.encode({ command: 'GetFirmware' });
            await device.sendFeatureReport(0x00, fwReport);
            await new Promise(r => setTimeout(r, 90));
            
            const responseData = await device.receiveFeatureReport(0x00);
            let responseArray = new Uint8Array(responseData.buffer);
            
            if (responseArray.byteLength === 91 && responseArray[0] === 0x00) {
                responseArray = responseArray.slice(1);
            }
            
            razerDevice = device;
            deviceNameEl.textContent = device.productName || 'Unknown Razer Device';
            connectBtn.textContent = 'Disconnect';
            connectBtn.classList.replace('btn-primary', 'btn-secondary');
            
            enableControls(true);
            logMessage('SYS', `Successfully connected to interface: ${device.productName}`, 'tx');
            
            handleResponse(responseArray);
            
            setTimeout(async () => {
                await sendCommand({ command: 'GetBattery' });
            }, 100);

            return;
        } catch (err) {
            if (device.opened) await device.close();
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
        refreshInfoBtn, readBrightnessBtn, applyBrightnessBtn, readEffectBtn, applyEffectBtn, readPerfBtn, applyPerfBtn,
        ledZoneSelect, ledEffectSelect, ledColorInput, ledBrightnessInput, ledSpeedInput, ledDirectionSelect,
        pollRateSelect, dpiXInput, dpiYInput
    ];
    elements.forEach(el => el.disabled = !enable);
    if (enable) updateLightingUI();
}

function updateLightingUI() {
    const eff = parseInt(ledEffectSelect.value);
    
    colorContainer.classList.add('hidden');
    speedContainer.classList.add('hidden');
    directionContainer.classList.add('hidden');

    if (eff === 0) { // Static
        colorContainer.classList.remove('hidden');
    } else if (eff === 1) { // Wave
        speedContainer.classList.remove('hidden');
        directionContainer.classList.remove('hidden');
        if (ledSpeedInput.value == 1 || ledSpeedInput.value == 40) ledSpeedInput.value = 40;
    } else if (eff === 3) { // Breathing
        colorContainer.classList.remove('hidden');
    } else if (eff === 4) { // Reactive
        colorContainer.classList.remove('hidden');
        speedContainer.classList.remove('hidden');
        if (ledSpeedInput.value == 40) ledSpeedInput.value = 1;
    } else if (eff === 5) { // Starlight
        colorContainer.classList.remove('hidden');
        speedContainer.classList.remove('hidden');
        if (ledSpeedInput.value == 40) ledSpeedInput.value = 1;
    }
}
ledEffectSelect.addEventListener('change', updateLightingUI);

async function sendCommand(cmdObj) {
    if (!razerDevice) return null;

    const report = RazerProtocol.encode(cmdObj);
    logMessage('TX', { request: cmdObj, raw: report }, 'tx');

    try {
        await razerDevice.sendFeatureReport(0x00, report);
        
        await new Promise(r => setTimeout(r, 90));
        
        const responseData = await razerDevice.receiveFeatureReport(0x00);
        let responseArray = new Uint8Array(responseData.buffer);
        
        if (responseArray.byteLength === 91 && responseArray[0] === 0x00) {
            responseArray = responseArray.slice(1);
        }
        
        handleResponse(responseArray);
    } catch (err) {
        logMessage('ERROR', `Send/Receive failed: ${err.message}`, 'error');
    }
}

function handleResponse(responseArray) {
    const decoded = RazerProtocol.decode(responseArray);
    logMessage('RX', { response: decoded, raw: responseArray }, 'rx');

    if (decoded.status !== "SUCCESS") return;

    if (decoded.command === "GetFirmware") {
        deviceFwEl.textContent = decoded.version;
    } else if (decoded.command === "GetBattery") {
        deviceBatteryEl.textContent = `${decoded.percentage}%`;
    } else if (decoded.command === "GetExtendedBrightness" || decoded.command === "GetStandardBrightness") {
        ledBrightnessInput.value = decoded.brightness;
    } else if (decoded.command === "GetExtendedMatrixEffect") {
        const effMap = {
            "static": 0,
            "wave": 1,
            "spectrum": 2,
            "breathing": 3,
            "reactive": 4,
            "wheel": 5, // mapped roughly
            "starlight": 5
        };
        if (effMap[decoded.effect] !== undefined) {
            ledEffectSelect.value = effMap[decoded.effect];
            updateLightingUI();
        }
    } else if (decoded.command === "GetPollingRate") {
        pollRateSelect.value = decoded.rate;
    } else if (decoded.command === "GetDPI") {
        dpiXInput.value = decoded.dpiX;
        dpiYInput.value = decoded.dpiY;
    }
}

refreshInfoBtn.addEventListener('click', async () => {
    await sendCommand({ command: 'GetFirmware' });
    setTimeout(async () => {
        await sendCommand({ command: 'GetBattery' });
    }, 100);
});

readBrightnessBtn.addEventListener('click', async () => {
    const ledId = parseInt(ledZoneSelect.value);
    await sendCommand({ command: 'GetExtendedBrightness', ledId: ledId });
});

applyBrightnessBtn.addEventListener('click', async () => {
    const ledId = parseInt(ledZoneSelect.value);
    const brightness = parseInt(ledBrightnessInput.value);
    await sendCommand({ command: 'SetExtendedBrightness', brightness: brightness, ledId: ledId });
});

readEffectBtn.addEventListener('click', async () => {
    const ledId = parseInt(ledZoneSelect.value);
    await sendCommand({ command: 'GetExtendedMatrixEffect', ledId: ledId });
});

applyEffectBtn.addEventListener('click', async () => {
    const ledId = parseInt(ledZoneSelect.value);
    const effectIndex = parseInt(ledEffectSelect.value);
    
    // Determine effect string
    const effects = ['static', 'wave', 'spectrum', 'breathing', 'reactive', 'starlight'];
    const effectName = effects[effectIndex] || 'static';

    const cmdObj = { 
        command: 'SetExtendedMatrixEffect', 
        effect: effectName,
        ledId: ledId
    };

    // Attach only the relevant parameters for the chosen effect
    if (['static', 'reactive'].includes(effectName)) {
        const colorHex = ledColorInput.value;
        cmdObj.r = parseInt(colorHex.substr(1, 2), 16);
        cmdObj.g = parseInt(colorHex.substr(3, 2), 16);
        cmdObj.b = parseInt(colorHex.substr(5, 2), 16);
        if (effectName === 'reactive') {
            cmdObj.speed = parseInt(ledSpeedInput.value);
        }
    } else if (['breathing', 'starlight'].includes(effectName)) {
        const colorHex = ledColorInput.value;
        cmdObj.type = 1; // 1 = Single Color (2=Dual, 3=Random)
        cmdObj.r1 = parseInt(colorHex.substr(1, 2), 16);
        cmdObj.g1 = parseInt(colorHex.substr(3, 2), 16);
        cmdObj.b1 = parseInt(colorHex.substr(5, 2), 16);
        if (effectName === 'starlight') {
            cmdObj.speed = parseInt(ledSpeedInput.value);
        }
    } else if (effectName === 'wave') {
        cmdObj.direction = parseInt(ledDirectionSelect.value);
        cmdObj.speed = parseInt(ledSpeedInput.value);
    }

    await sendCommand(cmdObj);
});

readPerfBtn.addEventListener('click', async () => {
    await sendCommand({ command: 'GetPollingRate' });
    await sendCommand({ command: 'GetDPI' });
});

applyPerfBtn.addEventListener('click', async () => {
    const rate = parseInt(pollRateSelect.value);
    const dx = parseInt(dpiXInput.value);
    const dy = parseInt(dpiYInput.value);

    await sendCommand({ command: 'SetPollingRate', rate: rate });
    await sendCommand({ command: 'SetDPI', dpiX: dx, dpiY: dy });
});

// Debug Logging
function logMessage(label, data, type) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 3 });
    
    let displayData = data;
    let rawToggle = "";
    
    if (typeof data === 'object' && data.raw) {
        // We received a JSON structured payload
        const jsonStr = JSON.stringify(data.request || data.response, null, 2);
        const hexDump = Array.from(data.raw).map(b => b.toString(16).padStart(2, '0')).join(' ');
        
        displayData = `<pre class="json-payload">${jsonStr}</pre>`;
        rawToggle = ` <details style="display:inline-block; margin-left: 0.5rem; color:#888; font-size:0.75rem;">
                         <summary style="cursor: pointer;">Raw Bytes</summary>
                         <div style="word-break: break-all; margin-top: 0.25rem; font-family: monospace;">${hexDump}</div>
                      </details>`;
    } else if (typeof data === 'object') {
        displayData = JSON.stringify(data);
    }

    entry.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span class="log-data"><span class="log-label">${label}</span>${rawToggle} ${displayData}</span>
    `;
    
    debugLog.appendChild(entry);
    debugLog.scrollTop = debugLog.scrollHeight;
}

navigator.hid.getDevices().then(devices => {
    const razerDevices = devices.filter(d => d.vendorId === RAZER_VENDOR_ID);
    if (razerDevices.length > 0) {
        logMessage('SYS', `Found previously paired device: ${razerDevices[0].productName}. Click connect.`, 'tx');
    }
});
