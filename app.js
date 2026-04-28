// DOM Elements
const connectBtn = document.getElementById('connectBtn');
const refreshInfoBtn = document.getElementById('refreshInfoBtn');
const readBrightnessBtn = document.getElementById('readBrightnessBtn');
const applyBrightnessBtn = document.getElementById('applyBrightnessBtn');
const readEffectBtn = document.getElementById('readEffectBtn');
const applyEffectBtn = document.getElementById('applyEffectBtn');
const applyPerfBtn = document.getElementById('applyPerfBtn');
const readPerfBtn = document.getElementById('readPerfBtn');
const readScrollBtn = document.getElementById('readScrollBtn');
const applyScrollBtn = document.getElementById('applyScrollBtn');
const readPowerBtn = document.getElementById('readPowerBtn');
const applyPowerBtn = document.getElementById('applyPowerBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const showAllToggle = document.getElementById('showAllToggle');
const debugLog = document.getElementById('debugLog');
const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('aboutModal');
const closeAboutBtn = document.getElementById('closeAboutBtn');

const deviceNameEl = document.getElementById('deviceName');
const deviceSerialEl = document.getElementById('deviceSerial');
const deviceFwEl = document.getElementById('deviceFw');
const deviceBatteryEl = document.getElementById('deviceBattery');
const deviceChargingEl = document.getElementById('deviceCharging');

// Lighting inputs
const ledZoneSelect = document.getElementById('ledZone');
const ledEffectSelect = document.getElementById('ledEffect');
const ledColorInput = document.getElementById('ledColor');
const ledColor2Input = document.getElementById('ledColor2');
const ledBrightnessInput = document.getElementById('ledBrightness');
const ledSpeedInput = document.getElementById('ledSpeed');
const ledDirectionSelect = document.getElementById('ledDirection');
const breathingTypeSelect = document.getElementById('breathingType');

const colorContainer = document.getElementById('colorContainer');
const color2Container = document.getElementById('color2Container');
const speedContainer = document.getElementById('speedContainer');
const directionContainer = document.getElementById('directionContainer');
const breathingTypeContainer = document.getElementById('breathingTypeContainer');

// Performance inputs
const pollRateSelect = document.getElementById('pollRate');
const dpiXInput = document.getElementById('dpiX');
const dpiYInput = document.getElementById('dpiY');

// Scroll inputs
const scrollModeSelect = document.getElementById('scrollMode');
const scrollAccelSelect = document.getElementById('scrollAccel');
const smartReelSelect = document.getElementById('smartReel');

// Power inputs
const idleTimeInput = document.getElementById('idleTime');
const lowBatteryThresholdSelect = document.getElementById('lowBatteryThreshold');

// Cards
const ledControlCard = document.querySelector('.led-control');
const scrollControlCard = document.querySelector('.scroll-control');
const powerControlCard = document.querySelector('.power-control');

// State
let razerDevice = null;
let deviceProfile = null; // current device capability profile
const RAZER_VENDOR_ID = 0x1532;

// ── Capability-driven UI ──

function applyCapabilities(profile) {
    deviceProfile = profile;
    const showAll = showAllToggle.checked;

    // Lighting card: hidden if no LED zones
    setCapVis(ledControlCard, showAll || DeviceCapabilities.hasAnyLed(profile));

    // Scroll card
    const hasScroll = DeviceCapabilities.hasCap(profile, 'scroll_mode');
    setCapVis(scrollControlCard, showAll || hasScroll);

    // Power card
    const hasBattery = DeviceCapabilities.hasCap(profile, 'battery');
    const hasIdle = DeviceCapabilities.hasCap(profile, 'idle_time');
    setCapVis(powerControlCard, showAll || hasBattery || hasIdle);

    // Battery/Charging in device info
    setCapVis(deviceBatteryEl.parentElement, showAll || hasBattery);
    setCapVis(deviceChargingEl.parentElement, showAll || hasBattery);

    // Populate LED zone dropdown from profile zones
    updateZoneDropdown(profile, showAll);

    // Populate effect dropdown from zone capabilities
    updateEffectDropdown(profile, showAll);
}

function setCapVis(el, visible) {
    if (!el) return;
    if (visible) el.classList.remove('cap-hidden');
    else el.classList.add('cap-hidden');
}

function updateZoneDropdown(profile, showAll) {
    const prev = ledZoneSelect.value;
    ledZoneSelect.innerHTML = '';

    if (showAll) {
        // Show all standard zones
        const allZones = [
            { value: '0', label: 'All / Default (0)' },
            { value: '1', label: 'Scroll Wheel (1)' },
            { value: '4', label: 'Logo (4)' },
            { value: '5', label: 'Backlight (5)' },
        ];
        allZones.forEach(z => {
            const opt = document.createElement('option');
            opt.value = z.value; opt.textContent = z.label;
            ledZoneSelect.appendChild(opt);
        });
    } else {
        const zoneMap = { logo: ['4', 'Logo (4)'], scroll: ['1', 'Scroll Wheel (1)'], backlight: ['5', 'Backlight (5)'] };
        for (const [key, [val, label]] of Object.entries(zoneMap)) {
            if (profile.zones[key]) {
                const opt = document.createElement('option');
                opt.value = val; opt.textContent = label;
                ledZoneSelect.appendChild(opt);
            }
        }
    }

    // Restore selection if still valid
    if (ledZoneSelect.querySelector(`option[value="${prev}"]`)) {
        ledZoneSelect.value = prev;
    }
}

function updateEffectDropdown(profile, showAll) {
    const prev = ledEffectSelect.value;
    ledEffectSelect.innerHTML = '';

    let effects;
    if (showAll) {
        effects = ['none', 'static', 'wave', 'spectrum', 'breathing', 'reactive', 'starlight', 'wheel'];
    } else {
        // Merge effects from all zones
        const set = new Set();
        for (const zone of Object.values(profile.zones)) {
            zone.effects.forEach(e => set.add(e));
        }
        effects = ['none', 'static', 'wave', 'spectrum', 'breathing', 'reactive', 'starlight', 'wheel']
            .filter(e => set.has(e));
    }

    const labels = {
        none: 'None / Off', static: 'Static', wave: 'Wave', spectrum: 'Spectrum',
        breathing: 'Breathing', reactive: 'Reactive', starlight: 'Starlight', wheel: 'Wheel'
    };
    effects.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e; opt.textContent = labels[e] || e;
        ledEffectSelect.appendChild(opt);
    });

    if (ledEffectSelect.querySelector(`option[value="${prev}"]`)) {
        ledEffectSelect.value = prev;
    }
    updateLightingUI();
}

showAllToggle.addEventListener('change', () => {
    if (deviceProfile) applyCapabilities(deviceProfile);
});

ledZoneSelect.addEventListener('change', () => {
    if (deviceProfile && !showAllToggle.checked) {
        updateEffectDropdown(deviceProfile, false);
    }
});

// ── Connection ──

connectBtn.addEventListener('click', async () => {
    if (razerDevice) { await disconnectDevice(); return; }
    try {
        const devices = await navigator.hid.requestDevice({ filters: [{ vendorId: RAZER_VENDOR_ID }] });
        if (devices.length > 0) await connectDevice(devices);
    } catch (err) {
        logMessage('ERROR', `Connection failed: ${err.message}`, 'error');
    }
});

async function connectDevice(devices) {
    for (const device of devices) {
        try {
            if (!device.opened) await device.open();

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

            // Look up device profile by PID
            const profile = DeviceCapabilities.getProfile(device.productId) || DeviceCapabilities.defaultProfile;
            if (!DeviceCapabilities.getProfile(device.productId)) {
                logMessage('SYS', `Successfully connected to ${device.productName} (Unknown PID 0x${device.productId.toString(16).padStart(4, '0')}). Showing all controls.<br><pre class="json-payload">${JSON.stringify(profile, null, 2)}</pre>`, 'tx');
            } else {
                logMessage('SYS', `Successfully connected to ${device.productName} (Matched profile: ${profile.name})<br><pre class="json-payload">${JSON.stringify(profile, null, 2)}</pre>`, 'tx');
            }

            applyCapabilities(profile);
            enableControls(true);

            handleResponse(responseArray);

            // Fetch additional info based on capabilities
            setTimeout(async () => {
                await sendCommand({ command: 'GetSerial' });
                if (DeviceCapabilities.hasCap(profile, 'battery')) {
                    await sendCommand({ command: 'GetBattery' });
                    await sendCommand({ command: 'GetChargingStatus' });
                }
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
        deviceProfile = null;

        deviceNameEl.textContent = 'Not Connected';
        deviceSerialEl.textContent = 'N/A';
        deviceFwEl.textContent = 'N/A';
        deviceBatteryEl.textContent = 'N/A';
        deviceChargingEl.textContent = 'N/A';
        connectBtn.textContent = 'Connect Device';
        connectBtn.classList.replace('btn-secondary', 'btn-primary');

        enableControls(false);
        // Show all cards again when disconnected
        [ledControlCard, scrollControlCard, powerControlCard].forEach(c => c && c.classList.remove('cap-hidden'));
        [deviceBatteryEl.parentElement, deviceChargingEl.parentElement].forEach(e => e && e.classList.remove('cap-hidden'));
        logMessage('SYS', 'Device disconnected', 'error');
    }
}

function enableControls(enable) {
    const elements = [
        refreshInfoBtn, readBrightnessBtn, applyBrightnessBtn, readEffectBtn, applyEffectBtn,
        readPerfBtn, applyPerfBtn, readScrollBtn, applyScrollBtn, readPowerBtn, applyPowerBtn,
        ledZoneSelect, ledEffectSelect, ledColorInput, ledColor2Input, ledBrightnessInput,
        ledSpeedInput, ledDirectionSelect, breathingTypeSelect,
        pollRateSelect, dpiXInput, dpiYInput,
        scrollModeSelect, scrollAccelSelect, smartReelSelect,
        idleTimeInput, lowBatteryThresholdSelect
    ];
    elements.forEach(el => el.disabled = !enable);
    if (enable) updateLightingUI();
}

// ── Lighting UI ──

function updateLightingUI() {
    const eff = ledEffectSelect.value;

    colorContainer.classList.add('hidden');
    color2Container.classList.add('hidden');
    speedContainer.classList.add('hidden');
    directionContainer.classList.add('hidden');
    breathingTypeContainer.classList.add('hidden');

    if (eff === 'static') {
        colorContainer.classList.remove('hidden');
    } else if (eff === 'wave' || eff === 'wheel') {
        speedContainer.classList.remove('hidden');
        directionContainer.classList.remove('hidden');
    } else if (eff === 'breathing') {
        breathingTypeContainer.classList.remove('hidden');
        updateBreathingUI();
    } else if (eff === 'reactive') {
        colorContainer.classList.remove('hidden');
        speedContainer.classList.remove('hidden');
    } else if (eff === 'starlight') {
        breathingTypeContainer.classList.remove('hidden');
        speedContainer.classList.remove('hidden');
        updateBreathingUI();
    }
}

function updateBreathingUI() {
    const type = parseInt(breathingTypeSelect.value);
    colorContainer.classList.add('hidden');
    color2Container.classList.add('hidden');
    if (type === 1) {
        colorContainer.classList.remove('hidden');
    } else if (type === 2) {
        colorContainer.classList.remove('hidden');
        color2Container.classList.remove('hidden');
    }
}

ledEffectSelect.addEventListener('change', updateLightingUI);
breathingTypeSelect.addEventListener('change', updateBreathingUI);

// ── Command send/receive ──

async function sendCommand(cmdObj) {
    if (!razerDevice) return null;

    // Apply device-specific transaction ID
    if (deviceProfile && deviceProfile.transactionId && cmdObj.transactionId === undefined) {
        cmdObj.transactionId = deviceProfile.transactionId;
    }

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

function hexColor(r, g, b) {
    return '#' + [r, g, b].map(x => (x || 0).toString(16).padStart(2, '0')).join('');
}

function handleResponse(responseArray) {
    const decoded = RazerProtocol.decode(responseArray);
    logMessage('RX', { response: decoded, raw: responseArray }, 'rx');

    if (decoded.status !== "SUCCESS") return;

    switch (decoded.command) {
        case "GetFirmware":
            deviceFwEl.textContent = decoded.version;
            break;
        case "GetSerial":
            deviceSerialEl.textContent = decoded.serial;
            break;
        case "GetBattery":
            deviceBatteryEl.textContent = `${decoded.percentage}%`;
            break;
        case "GetChargingStatus":
            deviceChargingEl.textContent = decoded.isCharging ? 'Yes' : 'No';
            break;
        case "GetExtendedBrightness":
        case "GetStandardBrightness":
            ledBrightnessInput.value = decoded.brightness;
            break;
        case "GetExtendedMatrixEffect":
        case "GetMouseExtendedMatrixEffect":
            populateEffectUI(decoded);
            break;
        case "GetPollingRate":
        case "GetHighPollingRate":
            pollRateSelect.value = decoded.rate;
            break;
        case "GetDPI":
            dpiXInput.value = decoded.dpiX;
            dpiYInput.value = decoded.dpiY;
            break;
        case "GetScrollMode":
            scrollModeSelect.value = decoded.mode;
            break;
        case "GetScrollAcceleration":
            scrollAccelSelect.value = decoded.state ? '1' : '0';
            break;
        case "GetSmartReel":
            smartReelSelect.value = decoded.state ? '1' : '0';
            break;
        case "GetIdleTime":
            idleTimeInput.value = decoded.seconds;
            break;
        case "GetLowBatteryThreshold":
            lowBatteryThresholdSelect.value = decoded.threshold;
            break;
    }
}

function populateEffectUI(decoded) {
    if (!decoded.effect) return;

    const option = ledEffectSelect.querySelector(`option[value="${decoded.effect}"]`);
    if (option) ledEffectSelect.value = decoded.effect;
    updateLightingUI();

    if (decoded.r !== undefined) ledColorInput.value = hexColor(decoded.r, decoded.g, decoded.b);
    if (decoded.r1 !== undefined) ledColorInput.value = hexColor(decoded.r1, decoded.g1, decoded.b1);
    if (decoded.r2 !== undefined) ledColor2Input.value = hexColor(decoded.r2, decoded.g2, decoded.b2);
    if (decoded.speed !== undefined) ledSpeedInput.value = decoded.speed;
    if (decoded.direction !== undefined) ledDirectionSelect.value = decoded.direction;
    if (decoded.type !== undefined) {
        breathingTypeSelect.value = decoded.type;
        updateBreathingUI();
    }
}

// ── Event Handlers ──

refreshInfoBtn.addEventListener('click', async () => {
    await sendCommand({ command: 'GetFirmware' });
    await sendCommand({ command: 'GetSerial' });
    if (deviceProfile && DeviceCapabilities.hasCap(deviceProfile, 'battery')) {
        await sendCommand({ command: 'GetBattery' });
        await sendCommand({ command: 'GetChargingStatus' });
    }
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
    const effectName = ledEffectSelect.value;

    const cmdObj = {
        command: 'SetExtendedMatrixEffect',
        effect: effectName,
        ledId: ledId
    };

    if (effectName === 'static') {
        const c = ledColorInput.value;
        cmdObj.r = parseInt(c.substr(1, 2), 16);
        cmdObj.g = parseInt(c.substr(3, 2), 16);
        cmdObj.b = parseInt(c.substr(5, 2), 16);
    } else if (effectName === 'reactive') {
        const c = ledColorInput.value;
        cmdObj.r = parseInt(c.substr(1, 2), 16);
        cmdObj.g = parseInt(c.substr(3, 2), 16);
        cmdObj.b = parseInt(c.substr(5, 2), 16);
        cmdObj.speed = parseInt(ledSpeedInput.value);
    } else if (effectName === 'breathing' || effectName === 'starlight') {
        const type = parseInt(breathingTypeSelect.value);
        cmdObj.type = type;
        if (type === 1 || type === 2) {
            const c1 = ledColorInput.value;
            cmdObj.r1 = parseInt(c1.substr(1, 2), 16);
            cmdObj.g1 = parseInt(c1.substr(3, 2), 16);
            cmdObj.b1 = parseInt(c1.substr(5, 2), 16);
        }
        if (type === 2) {
            const c2 = ledColor2Input.value;
            cmdObj.r2 = parseInt(c2.substr(1, 2), 16);
            cmdObj.g2 = parseInt(c2.substr(3, 2), 16);
            cmdObj.b2 = parseInt(c2.substr(5, 2), 16);
        }
        if (effectName === 'starlight') {
            cmdObj.speed = parseInt(ledSpeedInput.value);
        }
    } else if (effectName === 'wave' || effectName === 'wheel') {
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

readScrollBtn.addEventListener('click', async () => {
    await sendCommand({ command: 'GetScrollMode' });
    await sendCommand({ command: 'GetScrollAcceleration' });
    await sendCommand({ command: 'GetSmartReel' });
});

applyScrollBtn.addEventListener('click', async () => {
    await sendCommand({ command: 'SetScrollMode', mode: parseInt(scrollModeSelect.value) });
    await sendCommand({ command: 'SetScrollAcceleration', state: scrollAccelSelect.value === '1' });
    await sendCommand({ command: 'SetSmartReel', state: smartReelSelect.value === '1' });
});

readPowerBtn.addEventListener('click', async () => {
    await sendCommand({ command: 'GetIdleTime' });
    await sendCommand({ command: 'GetLowBatteryThreshold' });
});

applyPowerBtn.addEventListener('click', async () => {
    const seconds = parseInt(idleTimeInput.value);
    const threshold = parseInt(lowBatteryThresholdSelect.value);
    await sendCommand({ command: 'SetIdleTime', seconds: seconds });
    await sendCommand({ command: 'SetLowBatteryThreshold', threshold: threshold });
});

clearLogBtn.addEventListener('click', () => { debugLog.innerHTML = ''; });

aboutBtn.addEventListener('click', () => {
    aboutModal.classList.remove('hidden');
});

closeAboutBtn.addEventListener('click', () => {
    aboutModal.classList.add('hidden');
});

// Close modal when clicking outside
aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) {
        aboutModal.classList.add('hidden');
    }
});

// ── Debug Logging ──

function logMessage(label, data, type) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;

    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });

    let displayData = data;
    let rawToggle = "";

    if (typeof data === 'object' && data.raw) {
        const jsonStr = JSON.stringify(data.request || data.response, null, 2);
        const hexDump = Array.from(data.raw).map(b => b.toString(16).padStart(2, '0')).join(' ');

        displayData = `<pre class="json-payload">${jsonStr}</pre>`;
        rawToggle = ` <details style="display:inline-block; margin-left: 0.5rem; color:#888; font-size:0.75rem;">
                         <summary style="cursor: pointer;">Raw Bytes</summary>
                         <div style="word-break: break-all; margin-top: 0.25rem; font-family: monospace;">${hexDump}</div>
                      </details>`;
    } else if (typeof data === 'object') {
        displayData = `<pre class="json-payload">${JSON.stringify(data, null, 2)}</pre>`;
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
