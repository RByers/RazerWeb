const RazerProtocol = {
    REPORT_LENGTH: 90,

    encode: function(msg) {
        const report = new Uint8Array(this.REPORT_LENGTH);
        
        report[0] = 0x00; // Status (New Command)
        report[1] = 0xFF; // Transaction ID
        report[2] = 0x00; // Remaining Packets (H)
        report[3] = 0x00; // Remaining Packets (L)
        report[4] = 0x00; // Protocol Type
        
        let cmdClass = 0, cmdId = 0, dataSize = 0, args = [];
        const varStore = msg.varStore !== undefined ? msg.varStore : 1;
        const ledId = msg.ledId !== undefined ? msg.ledId : 1;
        
        switch(msg.command) {
            // 1. Device Info & Modes
            case 'GetSerial':
                cmdClass = 0x00; cmdId = 0x82; dataSize = 0x16;
                break;
            case 'GetFirmware': 
                cmdClass = 0x00; cmdId = 0x81; dataSize = 0x02; 
                break;
            case 'SetDeviceMode':
                cmdClass = 0x00; cmdId = 0x04; dataSize = 0x02;
                args = [msg.mode || 0x00, 0x00];
                break;
            case 'GetDeviceMode':
                cmdClass = 0x00; cmdId = 0x84; dataSize = 0x02;
                break;
                
            // 2. Standard LED Functions
            case 'SetStandardLedState':
                cmdClass = 0x03; cmdId = 0x00; dataSize = 0x03;
                args = [varStore, ledId, msg.state ? 1 : 0];
                break;
            case 'GetStandardLedState':
                cmdClass = 0x03; cmdId = 0x80; dataSize = 0x03;
                args = [varStore, ledId];
                break;
            case 'SetStandardLedRGB':
                cmdClass = 0x03; cmdId = 0x01; dataSize = 0x05;
                args = [varStore, ledId, msg.r || 0, msg.g || 0, msg.b || 0];
                break;
            case 'GetStandardLedRGB':
                cmdClass = 0x03; cmdId = 0x81; dataSize = 0x05;
                args = [varStore, ledId];
                break;
            case 'SetStandardLedEffect':
                cmdClass = 0x03; cmdId = 0x02; dataSize = 0x03;
                args = [varStore, ledId, msg.effect || 0];
                break;
            case 'GetStandardLedEffect':
                cmdClass = 0x03; cmdId = 0x82; dataSize = 0x03;
                args = [varStore, ledId];
                break;
            case 'SetStandardBrightness':
                cmdClass = 0x03; cmdId = 0x03; dataSize = 0x03;
                args = [varStore, ledId, msg.brightness || 0];
                break;
            case 'GetStandardBrightness':
                cmdClass = 0x03; cmdId = 0x83; dataSize = 0x03;
                args = [varStore, ledId];
                break;
                
            // 3. Standard Matrix Effects
            case 'SetStandardMatrixEffect':
                cmdClass = 0x03; cmdId = 0x0A;
                if (msg.effect === 'none') {
                    args = [0x00]; dataSize = 0x01;
                } else if (msg.effect === 'wave') {
                    args = [0x01, msg.direction || 1]; dataSize = 0x02;
                } else if (msg.effect === 'reactive') {
                    args = [0x02, msg.speed || 1, msg.r || 0, msg.g || 0, msg.b || 0]; dataSize = 0x05;
                } else if (msg.effect === 'spectrum') {
                    args = [0x04]; dataSize = 0x01;
                } else if (msg.effect === 'static') {
                    args = [0x06, msg.r || 0, msg.g || 0, msg.b || 0]; dataSize = 0x04;
                } else if (msg.effect === 'starlight') {
                    args = [0x19, msg.type || 1, msg.speed || 1, msg.r1 || 0, msg.g1 || 0, msg.b1 || 0, msg.r2 || 0, msg.g2 || 0, msg.b2 || 0];
                    dataSize = msg.type === 1 ? 0x07 : 0x0A;
                } else if (msg.effect === 'breathing') {
                    args = [0x03, msg.type || 1, msg.r1 || 0, msg.g1 || 0, msg.b1 || 0, msg.r2 || 0, msg.g2 || 0, msg.b2 || 0];
                    dataSize = 0x08;
                }
                break;

            // 4. Extended Matrix Effects
            case 'SetExtendedBrightness':
                cmdClass = 0x0F; cmdId = 0x04; dataSize = 0x03;
                args = [varStore, ledId, msg.brightness || 0];
                break;
            case 'GetExtendedBrightness':
                cmdClass = 0x0F; cmdId = 0x84; dataSize = 0x03;
                args = [varStore, ledId, 0];
                break;
            case 'GetExtendedMatrixEffect':
                cmdClass = 0x0F; cmdId = 0x82; dataSize = 0x03;
                args = [varStore, ledId, 0];
                break;
            case 'SetExtendedMatrixEffect':
                cmdClass = 0x0F; cmdId = 0x02; 
                if (msg.effect === 'none') {
                    args = [varStore, ledId, 0x00];
                    dataSize = 0x06;
                } else if (msg.effect === 'static') {
                    args = [varStore, ledId, 0x01, 0x00, 0x00, 0x01, msg.r || 0, msg.g || 0, msg.b || 0];
                    dataSize = 0x09;
                } else if (msg.effect === 'wave') {
                    args = [varStore, ledId, 0x04, msg.direction || 1, msg.speed || 0x28, 0x00];
                    dataSize = 0x06;
                } else if (msg.effect === 'spectrum') {
                    args = [varStore, ledId, 0x03, 0x00, 0x00, 0x00];
                    dataSize = 0x06;
                } else if (msg.effect === 'breathing') {
                    const type = msg.type || 1; // 1=Single, 2=Dual, 3=Random
                    args = [varStore, ledId, 0x02, type, 0x00, type, msg.r1 || 0, msg.g1 || 0, msg.b1 || 0, msg.r2 || 0, msg.g2 || 0, msg.b2 || 0];
                    dataSize = type === 3 ? 0x06 : (type === 1 ? 0x09 : 0x0C);
                } else if (msg.effect === 'reactive') {
                    args = [varStore, ledId, 0x05, 0x00, msg.speed || 1, 0x01, msg.r || 0, msg.g || 0, msg.b || 0];
                    dataSize = 0x09;
                } else if (msg.effect === 'starlight') {
                    const type = msg.type || 1;
                    args = [varStore, ledId, 0x07, 0x00, msg.speed || 1, type, msg.r1 || 0, msg.g1 || 0, msg.b1 || 0, msg.r2 || 0, msg.g2 || 0, msg.b2 || 0];
                    dataSize = type === 3 ? 0x06 : (type === 1 ? 0x09 : 0x0C);
                } else if (msg.effect === 'wheel') {
                    args = [varStore, ledId, 0x0A, msg.direction || 1, msg.speed || 0x28, 0x00];
                    dataSize = 0x06;
                } else {
                    throw new Error("Unknown extended effect: " + msg.effect);
                }
                break;
                
            // 5. DPI & Sensor
            case 'GetPollingRate':
                cmdClass = 0x00; cmdId = 0x85; dataSize = 0x01;
                args = [0];
                break;
            case 'SetPollingRate':
                cmdClass = 0x00; cmdId = 0x05; dataSize = 0x01;
                args = [msg.rate === 1000 ? 0x01 : (msg.rate === 125 ? 0x08 : 0x02)];
                break;
            case 'SetHighPollingRate':
                cmdClass = 0x00; cmdId = 0x40; dataSize = 0x02;
                let hzFlag = 0x08; // 1000Hz default
                if (msg.rate === 8000) hzFlag = 0x01;
                else if (msg.rate === 4000) hzFlag = 0x02;
                else if (msg.rate === 2000) hzFlag = 0x04;
                args = [0x00, hzFlag];
                break;
            case 'GetDPI':
                cmdClass = 0x04; cmdId = 0x85; dataSize = 0x07;
                args = [varStore, 0,0,0,0, 0,0];
                break;
            case 'SetDPI':
                cmdClass = 0x04; cmdId = 0x05; dataSize = 0x07;
                args = [
                    varStore, 
                    ((msg.dpiX || 0) >> 8) & 0xFF, (msg.dpiX || 0) & 0xFF,
                    ((msg.dpiY || 0) >> 8) & 0xFF, (msg.dpiY || 0) & 0xFF,
                    0, 0
                ];
                break;
            case 'GetDPIStages':
                cmdClass = 0x04; cmdId = 0x86; dataSize = 0x26;
                args = [varStore];
                break;
            case 'SetDPIStages':
                cmdClass = 0x04; cmdId = 0x06; dataSize = 0x26;
                args = [varStore, msg.activeStage || 1, msg.stages ? msg.stages.length : 0];
                if (msg.stages) {
                    for (let i = 0; i < msg.stages.length; i++) {
                        const s = msg.stages[i];
                        args.push(i + 1, (s.x >> 8) & 0xFF, s.x & 0xFF, (s.y >> 8) & 0xFF, s.y & 0xFF, 0, 0);
                    }
                }
                break;

            // 6. Miscellaneous
            case 'GetBattery': 
                cmdClass = 0x07; cmdId = 0x80; dataSize = 0x02; 
                break;
            case 'GetChargingStatus':
                cmdClass = 0x07; cmdId = 0x84; dataSize = 0x02;
                break;
            case 'SetLowBatteryThreshold':
                cmdClass = 0x07; cmdId = 0x01; dataSize = 0x01;
                args = [msg.threshold || 0];
                break;
            case 'SetIdleTime':
                cmdClass = 0x07; cmdId = 0x03; dataSize = 0x02;
                args = [(msg.seconds >> 8) & 0xFF, msg.seconds & 0xFF];
                break;
            case 'SetScrollMode':
                cmdClass = 0x02; cmdId = 0x14; dataSize = 0x02;
                args = [varStore, msg.mode || 0]; // 0=Tactile, 1=FreeSpin
                break;
            case 'SetScrollAcceleration':
                cmdClass = 0x02; cmdId = 0x16; dataSize = 0x02;
                args = [varStore, msg.state ? 1 : 0];
                break;
            case 'SetSmartReel':
                cmdClass = 0x02; cmdId = 0x17; dataSize = 0x02;
                args = [varStore, msg.state ? 1 : 0];
                break;
                
            default:
                throw new Error("Unknown command: " + msg.command);
        }

        report[5] = dataSize;
        report[6] = cmdClass;
        report[7] = cmdId;
        
        for (let i = 0; i < args.length && i < 80; i++) {
            report[8 + i] = args[i];
        }

        // Calculate CRC
        let crc = 0;
        for (let i = 2; i < 88; i++) {
            crc ^= report[i];
        }
        report[88] = crc;
        report[89] = 0x00; // Reserved

        return report;
    },

    decode: function(report) {
        if (!report || report.length < 90) return { error: "Invalid report length" };
        
        const statusMap = {
            0x00: "NEW", 0x01: "BUSY", 0x02: "SUCCESS",
            0x03: "FAIL", 0x04: "TIMEOUT", 0x05: "NOT_SUPPORTED"
        };
        
        const res = {
            status: statusMap[report[0]] || `UNKNOWN(${report[0]})`,
            transactionId: report[1],
            dataSize: report[5],
            commandClass: report[6],
            commandId: report[7],
            rawArgs: Array.from(report.slice(8, 8 + report[5]))
        };

        const c = res.commandClass;
        const i = res.commandId;
        const a = res.rawArgs;

        // Semantic mapping
        if (c === 0x00 && i === 0x81) {
            res.command = "GetFirmware";
            res.version = `v${a[0]}.${a[1]}`;
        } else if (c === 0x00 && i === 0x82) {
            res.command = "GetSerial";
            res.serial = a.map(x => String.fromCharCode(x)).join('').replace(/\0/g, '');
        } else if (c === 0x00 && (i === 0x84 || i === 0x04)) {
            res.command = i === 0x84 ? "GetDeviceMode" : "SetDeviceMode";
            res.mode = a[0];
        } else if (c === 0x03 && (i === 0x80 || i === 0x00)) {
            res.command = i === 0x80 ? "GetStandardLedState" : "SetStandardLedState";
            res.varStore = a[0]; res.ledId = a[1]; res.state = a[2] === 1;
        } else if (c === 0x03 && (i === 0x81 || i === 0x01)) {
            res.command = i === 0x81 ? "GetStandardLedRGB" : "SetStandardLedRGB";
            res.varStore = a[0]; res.ledId = a[1]; res.r = a[2]; res.g = a[3]; res.b = a[4];
        } else if (c === 0x03 && (i === 0x82 || i === 0x02)) {
            res.command = i === 0x82 ? "GetStandardLedEffect" : "SetStandardLedEffect";
            res.varStore = a[0]; res.ledId = a[1]; res.effect = a[2];
        } else if (c === 0x03 && (i === 0x83 || i === 0x03)) {
            res.command = i === 0x83 ? "GetStandardBrightness" : "SetStandardBrightness";
            res.varStore = a[0]; res.ledId = a[1]; res.brightness = a[2];
        } else if (c === 0x03 && i === 0x0A) {
            res.command = "SetStandardMatrixEffect";
            res.effectId = a[0];
        } else if (c === 0x0F && (i === 0x84 || i === 0x04)) {
            res.command = i === 0x84 ? "GetExtendedBrightness" : "SetExtendedBrightness";
            res.varStore = a[0]; res.ledId = a[1]; res.brightness = a[2];
        } else if (c === 0x0F && (i === 0x82 || i === 0x02)) {
            res.command = i === 0x82 ? "GetExtendedMatrixEffect" : "SetExtendedMatrixEffect";
            if (a.length >= 3) {
                res.varStore = a[0]; res.ledId = a[1]; 
                const effMap = {
                    0x00: "none", 0x01: "static", 0x02: "breathing",
                    0x03: "spectrum", 0x04: "wave", 0x05: "reactive",
                    0x07: "starlight", 0x0A: "wheel"
                };
                res.effect = effMap[a[2]] || `unknown(${a[2]})`;
                
                if (a[2] === 0x01 && a.length >= 9) {
                    res.r = a[6]; res.g = a[7]; res.b = a[8];
                } else if (a[2] === 0x04 && a.length >= 5) {
                    res.direction = a[3]; res.speed = a[4];
                } else if (a[2] === 0x05 && a.length >= 9) {
                    res.speed = a[4]; res.r = a[6]; res.g = a[7]; res.b = a[8];
                } else if (a[2] === 0x02 && a.length >= 12) {
                    res.type = a[3];
                    if (a[3] === 1 || a[3] === 2) { res.r1 = a[6]; res.g1 = a[7]; res.b1 = a[8]; }
                    if (a[3] === 2) { res.r2 = a[9]; res.g2 = a[10]; res.b2 = a[11]; }
                } else if (a[2] === 0x07 && a.length >= 12) {
                    res.speed = a[4]; res.type = a[5];
                    if (a[5] === 1 || a[5] === 2) { res.r1 = a[6]; res.g1 = a[7]; res.b1 = a[8]; }
                    if (a[5] === 2) { res.r2 = a[9]; res.g2 = a[10]; res.b2 = a[11]; }
                }
            }
        } else if (c === 0x00 && (i === 0x85 || i === 0x05)) {
            res.command = i === 0x85 ? "GetPollingRate" : "SetPollingRate";
            res.rate = a[0] === 0x01 ? 1000 : (a[0] === 0x08 ? 125 : 500);
        } else if (c === 0x00 && i === 0x40) {
            res.command = "SetHighPollingRate";
            res.hzFlag = a[1];
        } else if (c === 0x04 && (i === 0x85 || i === 0x05)) {
            res.command = i === 0x85 ? "GetDPI" : "SetDPI";
            res.varStore = a[0];
            res.dpiX = (a[1] << 8) | a[2];
            res.dpiY = (a[3] << 8) | a[4];
        } else if (c === 0x04 && (i === 0x86 || i === 0x06)) {
            res.command = i === 0x86 ? "GetDPIStages" : "SetDPIStages";
            res.varStore = a[0];
            res.activeStage = a[1];
            res.stageCount = a[2];
            res.stages = [];
            for (let j = 0; j < res.stageCount; j++) {
                const off = 3 + (j * 7);
                if (off + 4 < a.length) {
                    res.stages.push({
                        id: a[off],
                        x: (a[off+1] << 8) | a[off+2],
                        y: (a[off+3] << 8) | a[off+4]
                    });
                }
            }
        } else if (c === 0x07 && i === 0x80) {
            res.command = "GetBattery";
            res.percentage = Math.round((a[1] / 255) * 100);
        } else if (c === 0x07 && i === 0x84) {
            res.command = "GetChargingStatus";
            res.isCharging = a[1] === 1;
        } else if (c === 0x07 && i === 0x01) {
            res.command = "SetLowBatteryThreshold";
            res.threshold = a[0];
        } else if (c === 0x07 && i === 0x03) {
            res.command = "SetIdleTime";
            res.seconds = (a[0] << 8) | a[1];
        } else if (c === 0x02 && i === 0x14) {
            res.command = "SetScrollMode";
            res.varStore = a[0]; res.mode = a[1];
        } else if (c === 0x02 && i === 0x16) {
            res.command = "SetScrollAcceleration";
            res.varStore = a[0]; res.state = a[1] === 1;
        } else if (c === 0x02 && i === 0x17) {
            res.command = "SetSmartReel";
            res.varStore = a[0]; res.state = a[1] === 1;
        } else {
            // Unmapped incoming command
            res.command = `Unknown`;
        }

        delete res.rawArgs;

        return res;
    }
};
