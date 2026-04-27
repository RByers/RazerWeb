const RazerProtocol = {
    REPORT_LENGTH: 90,

    // LED zone IDs
    LED: {
        ZERO: 0x00,
        SCROLL_WHEEL: 0x01,
        BATTERY: 0x03,
        LOGO: 0x04,
        BACKLIGHT: 0x05,
        MACRO: 0x07,
        GAME: 0x08,
        RIGHT_SIDE: 0x10,
        LEFT_SIDE: 0x11,
        CHARGING: 0x20,
        FAST_CHARGING: 0x21,
        FULLY_CHARGED: 0x22
    },

    // Standard (class 0x03, cmd 0x0A) matrix effect IDs
    MATRIX_EFFECT: {
        NONE: 0x00,
        WAVE: 0x01,
        REACTIVE: 0x02,
        BREATHING: 0x03,
        SPECTRUM: 0x04,
        CUSTOM_FRAME: 0x05,
        STATIC: 0x06,
        STARLIGHT: 0x19
    },

    // Extended (class 0x0F, cmd 0x02) effect IDs
    EXTENDED_EFFECT: {
        NONE: 0x00,
        STATIC: 0x01,
        BREATHING: 0x02,
        SPECTRUM: 0x03,
        WAVE: 0x04,
        REACTIVE: 0x05,
        STARLIGHT: 0x07,
        CUSTOM_FRAME: 0x08,
        WHEEL: 0x0A
    },

    // Mouse extended (class 0x03, cmd 0x0D) effect IDs
    MOUSE_EXTENDED_EFFECT: {
        NONE: 0x00,
        REACTIVE: 0x02,
        BREATHING: 0x03,
        SPECTRUM: 0x04,
        STATIC: 0x06
    },

    // Classic LED effect IDs (class 0x03, cmd 0x02)
    CLASSIC_EFFECT: {
        STATIC: 0x00,
        BLINKING: 0x01,
        BREATHING: 0x02,
        SPECTRUM: 0x04
    },

    // Polling rate byte mappings (v1: class 0x00, cmd 0x05/0x85)
    POLL_RATE_V1: {
        1000: 0x01,
        500: 0x02,
        125: 0x08
    },

    // Polling rate byte mappings (v2: class 0x00, cmd 0x40/0xC0)
    POLL_RATE_V2: {
        8000: 0x01,
        4000: 0x02,
        2000: 0x04,
        1000: 0x08,
        500: 0x10,
        250: 0x20,
        125: 0x40
    },

    encode: function(msg) {
        const report = new Uint8Array(this.REPORT_LENGTH);

        report[0] = 0x00; // Status (New Command)
        report[1] = msg.transactionId !== undefined ? msg.transactionId : 0xFF;
        report[2] = 0x00; // Remaining Packets (H)
        report[3] = 0x00; // Remaining Packets (L)
        report[4] = 0x00; // Protocol Type

        let cmdClass = 0, cmdId = 0, dataSize = 0, args = [];
        const varStore = msg.varStore !== undefined ? msg.varStore : 1;
        const ledId = msg.ledId !== undefined ? msg.ledId : 1;

        switch(msg.command) {
            // ── Device Info & Modes (Class 0x00) ──
            case 'GetSerial':
                cmdClass = 0x00; cmdId = 0x82; dataSize = 0x16;
                break;
            case 'GetFirmware':
                cmdClass = 0x00; cmdId = 0x81; dataSize = 0x02;
                break;
            case 'SetDeviceMode':
                cmdClass = 0x00; cmdId = 0x04; dataSize = 0x02;
                args = [msg.mode || 0x00, msg.param || 0x00];
                break;
            case 'GetDeviceMode':
                cmdClass = 0x00; cmdId = 0x84; dataSize = 0x02;
                break;

            // ── Polling Rate v1 (Class 0x00) ──
            case 'GetPollingRate':
                cmdClass = 0x00; cmdId = 0x85; dataSize = 0x01;
                break;
            case 'SetPollingRate':
                cmdClass = 0x00; cmdId = 0x05; dataSize = 0x01;
                args = [this.POLL_RATE_V1[msg.rate] || 0x01];
                break;

            // ── Polling Rate v2 / HyperPolling (Class 0x00) ──
            case 'SetHighPollingRate':
                cmdClass = 0x00; cmdId = 0x40; dataSize = 0x02;
                args = [0x00, this.POLL_RATE_V2[msg.rate] || 0x08];
                break;
            case 'GetHighPollingRate':
                cmdClass = 0x00; cmdId = 0xC0; dataSize = 0x01;
                break;

            // ── Standard LED Functions (Class 0x03) ──
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
            case 'SetStandardLedBlinking':
                cmdClass = 0x03; cmdId = 0x04; dataSize = 0x04;
                args = [varStore, ledId, 0x05, 0x05];
                break;

            // ── Standard Matrix Effects (Class 0x03, Cmd 0x0A) ──
            case 'SetStandardMatrixEffect':
                cmdClass = 0x03; cmdId = 0x0A;
                if (msg.effect === 'none') {
                    args = [0x00]; dataSize = 0x01;
                } else if (msg.effect === 'wave') {
                    args = [0x01, msg.direction || 1]; dataSize = 0x02;
                } else if (msg.effect === 'reactive') {
                    args = [0x02, msg.speed || 1, msg.r || 0, msg.g || 0, msg.b || 0]; dataSize = 0x05;
                } else if (msg.effect === 'breathing') {
                    const type = msg.type || 1;
                    if (type === 3) {
                        args = [0x03, 0x03]; dataSize = 0x08;
                    } else if (type === 2) {
                        args = [0x03, 0x02, msg.r1 || 0, msg.g1 || 0, msg.b1 || 0, msg.r2 || 0, msg.g2 || 0, msg.b2 || 0]; dataSize = 0x08;
                    } else {
                        args = [0x03, 0x01, msg.r1 || 0, msg.g1 || 0, msg.b1 || 0]; dataSize = 0x08;
                    }
                } else if (msg.effect === 'spectrum') {
                    args = [0x04]; dataSize = 0x01;
                } else if (msg.effect === 'custom_frame') {
                    args = [0x05, varStore]; dataSize = 0x02;
                } else if (msg.effect === 'static') {
                    args = [0x06, msg.r || 0, msg.g || 0, msg.b || 0]; dataSize = 0x04;
                } else if (msg.effect === 'starlight') {
                    const type = msg.type || 1;
                    if (type === 3) {
                        args = [0x19, 0x03, msg.speed || 1]; dataSize = 0x04;
                    } else if (type === 2) {
                        args = [0x19, 0x02, msg.speed || 1, msg.r1 || 0, msg.g1 || 0, msg.b1 || 0, msg.r2 || 0, msg.g2 || 0, msg.b2 || 0]; dataSize = 0x0A;
                    } else {
                        args = [0x19, 0x01, msg.speed || 1, msg.r1 || 0, msg.g1 || 0, msg.b1 || 0]; dataSize = 0x07;
                    }
                }
                break;

            // ── Standard Matrix Custom Frame (Class 0x03, Cmd 0x0B) ──
            case 'SetStandardMatrixCustomFrame':
                cmdClass = 0x03; cmdId = 0x0B; dataSize = 0x46;
                args = [0xFF, msg.row || 0, msg.startCol || 0, msg.stopCol || 0];
                if (msg.rgbData) {
                    for (let b = 0; b < msg.rgbData.length; b++) args.push(msg.rgbData[b]);
                }
                break;

            // ── Mouse Extended Matrix Effects (Class 0x03, Cmd 0x0D) ──
            case 'SetMouseExtendedMatrixEffect':
                cmdClass = 0x03; cmdId = 0x0D;
                if (msg.effect === 'none') {
                    args = [varStore, ledId, 0x00]; dataSize = 0x03;
                } else if (msg.effect === 'static') {
                    args = [varStore, ledId, 0x06, msg.r || 0, msg.g || 0, msg.b || 0]; dataSize = 0x06;
                } else if (msg.effect === 'spectrum') {
                    args = [varStore, ledId, 0x04]; dataSize = 0x03;
                } else if (msg.effect === 'reactive') {
                    args = [varStore, ledId, 0x02, msg.speed || 1, msg.r || 0, msg.g || 0, msg.b || 0]; dataSize = 0x07;
                } else if (msg.effect === 'breathing') {
                    const type = msg.type || 1;
                    if (type === 3) {
                        args = [varStore, ledId, 0x03, 0x03]; dataSize = 0x0A;
                    } else if (type === 2) {
                        args = [varStore, ledId, 0x03, 0x02, msg.r1 || 0, msg.g1 || 0, msg.b1 || 0, msg.r2 || 0, msg.g2 || 0, msg.b2 || 0]; dataSize = 0x0A;
                    } else {
                        args = [varStore, ledId, 0x03, 0x01, msg.r1 || 0, msg.g1 || 0, msg.b1 || 0]; dataSize = 0x0A;
                    }
                }
                break;
            case 'GetMouseExtendedMatrixEffect':
                cmdClass = 0x03; cmdId = 0x8D; dataSize = 0x03;
                args = [varStore, ledId];
                break;

            // ── Extended Matrix Effects (Class 0x0F) ──
            case 'SetExtendedBrightness':
                cmdClass = 0x0F; cmdId = 0x04; dataSize = 0x03;
                args = [varStore, ledId, msg.brightness || 0];
                break;
            case 'GetExtendedBrightness':
                cmdClass = 0x0F; cmdId = 0x84; dataSize = 0x03;
                args = [varStore, ledId, 0];
                break;
            case 'GetExtendedMatrixEffect':
                cmdClass = 0x0F; cmdId = 0x82; dataSize = 0x0C;
                args = [varStore, ledId];
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
                    const type = msg.type || 1;
                    if (type === 3) {
                        // Random: only varStore, ledId, effectId — no type byte
                        args = [varStore, ledId, 0x02];
                        dataSize = 0x06;
                    } else if (type === 2) {
                        args = [varStore, ledId, 0x02, 0x02, 0x00, 0x02, msg.r1 || 0, msg.g1 || 0, msg.b1 || 0, msg.r2 || 0, msg.g2 || 0, msg.b2 || 0];
                        dataSize = 0x0C;
                    } else {
                        args = [varStore, ledId, 0x02, 0x01, 0x00, 0x01, msg.r1 || 0, msg.g1 || 0, msg.b1 || 0];
                        dataSize = 0x09;
                    }
                } else if (msg.effect === 'reactive') {
                    args = [varStore, ledId, 0x05, 0x00, msg.speed || 1, 0x01, msg.r || 0, msg.g || 0, msg.b || 0];
                    dataSize = 0x09;
                } else if (msg.effect === 'starlight') {
                    const type = msg.type || 1;
                    if (type === 3) {
                        // Random: no type byte at args[5], no colors
                        args = [varStore, ledId, 0x07, 0x00, msg.speed || 1];
                        dataSize = 0x06;
                    } else if (type === 2) {
                        args = [varStore, ledId, 0x07, 0x00, msg.speed || 1, 0x02, msg.r1 || 0, msg.g1 || 0, msg.b1 || 0, msg.r2 || 0, msg.g2 || 0, msg.b2 || 0];
                        dataSize = 0x0C;
                    } else {
                        args = [varStore, ledId, 0x07, 0x00, msg.speed || 1, 0x01, msg.r1 || 0, msg.g1 || 0, msg.b1 || 0];
                        dataSize = 0x09;
                    }
                } else if (msg.effect === 'custom_frame') {
                    args = [0x00, 0x00, 0x08];
                    dataSize = 0x06;
                } else if (msg.effect === 'wheel') {
                    args = [varStore, ledId, 0x0A, msg.direction || 1, msg.speed || 0x28, 0x00];
                    dataSize = 0x06;
                } else {
                    throw new Error("Unknown extended effect: " + msg.effect);
                }
                break;

            // ── Extended Matrix Custom Frame (Class 0x0F, Cmd 0x03) ──
            case 'SetExtendedMatrixCustomFrame':
                cmdClass = 0x0F; cmdId = 0x03; dataSize = 0x47;
                args = [0x00, 0x00, msg.row || 0, msg.startCol || 0, msg.stopCol || 0];
                if (msg.rgbData) {
                    for (let b = 0; b < msg.rgbData.length; b++) args.push(msg.rgbData[b]);
                }
                break;

            // ── DPI & Sensor (Class 0x04) ──
            case 'GetDPI':
                cmdClass = 0x04; cmdId = 0x85; dataSize = 0x07;
                args = [varStore, 0, 0, 0, 0, 0, 0];
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
                    for (let s = 0; s < msg.stages.length; s++) {
                        const stage = msg.stages[s];
                        args.push(s + 1, (stage.x >> 8) & 0xFF, stage.x & 0xFF, (stage.y >> 8) & 0xFF, stage.y & 0xFF, 0, 0);
                    }
                }
                break;

            // ── Power / Battery (Class 0x07) ──
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
            case 'GetLowBatteryThreshold':
                cmdClass = 0x07; cmdId = 0x81; dataSize = 0x01;
                break;
            case 'SetDockBrightness':
                cmdClass = 0x07; cmdId = 0x02; dataSize = 0x01;
                args = [msg.brightness || 0];
                break;
            case 'GetDockBrightness':
                cmdClass = 0x07; cmdId = 0x82; dataSize = 0x01;
                break;
            case 'SetIdleTime':
                cmdClass = 0x07; cmdId = 0x03; dataSize = 0x02;
                args = [(msg.seconds >> 8) & 0xFF, msg.seconds & 0xFF];
                break;
            case 'GetIdleTime':
                cmdClass = 0x07; cmdId = 0x83; dataSize = 0x02;
                break;

            // ── Scroll Wheel (Class 0x02) ──
            case 'SetScrollMode':
                cmdClass = 0x02; cmdId = 0x14; dataSize = 0x02;
                args = [varStore, msg.mode || 0]; // 0=Tactile, 1=FreeSpin
                break;
            case 'GetScrollMode':
                cmdClass = 0x02; cmdId = 0x94; dataSize = 0x02;
                args = [varStore];
                break;
            case 'SetScrollAcceleration':
                cmdClass = 0x02; cmdId = 0x16; dataSize = 0x02;
                args = [varStore, msg.state ? 1 : 0];
                break;
            case 'GetScrollAcceleration':
                cmdClass = 0x02; cmdId = 0x96; dataSize = 0x02;
                args = [varStore];
                break;
            case 'SetSmartReel':
                cmdClass = 0x02; cmdId = 0x17; dataSize = 0x02;
                args = [varStore, msg.state ? 1 : 0];
                break;
            case 'GetSmartReel':
                cmdClass = 0x02; cmdId = 0x97; dataSize = 0x02;
                args = [varStore];
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

        // CRC: XOR of bytes 2-87
        let crc = 0;
        for (let i = 2; i < 88; i++) {
            crc ^= report[i];
        }
        report[88] = crc;
        report[89] = 0x00;

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
            rawArgs: Array.from(report.slice(8, 8 + Math.min(report[5], 80)))
        };

        const c = res.commandClass;
        const id = res.commandId;
        const a = res.rawArgs;

        // ── Device Info (Class 0x00) ──
        if (c === 0x00 && id === 0x81) {
            res.command = "GetFirmware";
            res.version = `v${a[0]}.${a[1]}`;
        } else if (c === 0x00 && id === 0x82) {
            res.command = "GetSerial";
            res.serial = a.map(x => String.fromCharCode(x)).join('').replace(/\0/g, '');
        } else if (c === 0x00 && (id === 0x84 || id === 0x04)) {
            res.command = id === 0x84 ? "GetDeviceMode" : "SetDeviceMode";
            res.mode = a[0];
            res.param = a[1];

        // ── Polling Rate v1 (Class 0x00) ──
        } else if (c === 0x00 && (id === 0x85 || id === 0x05)) {
            res.command = id === 0x85 ? "GetPollingRate" : "SetPollingRate";
            const rateMap = { 0x01: 1000, 0x02: 500, 0x08: 125 };
            res.rate = rateMap[a[0]] || a[0];

        // ── Polling Rate v2 (Class 0x00) ──
        } else if (c === 0x00 && (id === 0xC0 || id === 0x40)) {
            res.command = id === 0xC0 ? "GetHighPollingRate" : "SetHighPollingRate";
            const v2Map = { 0x01: 8000, 0x02: 4000, 0x04: 2000, 0x08: 1000, 0x10: 500, 0x20: 250, 0x40: 125 };
            const flag = a.length >= 2 ? a[1] : a[0];
            res.rate = v2Map[flag] || flag;

        // ── Standard LED State (Class 0x03) ──
        } else if (c === 0x03 && (id === 0x80 || id === 0x00)) {
            res.command = id === 0x80 ? "GetStandardLedState" : "SetStandardLedState";
            res.varStore = a[0]; res.ledId = a[1]; res.state = a[2] === 1;
        } else if (c === 0x03 && (id === 0x81 || id === 0x01)) {
            res.command = id === 0x81 ? "GetStandardLedRGB" : "SetStandardLedRGB";
            res.varStore = a[0]; res.ledId = a[1]; res.r = a[2]; res.g = a[3]; res.b = a[4];
        } else if (c === 0x03 && (id === 0x82 || id === 0x02)) {
            res.command = id === 0x82 ? "GetStandardLedEffect" : "SetStandardLedEffect";
            res.varStore = a[0]; res.ledId = a[1]; res.effect = a[2];
        } else if (c === 0x03 && (id === 0x83 || id === 0x03)) {
            res.command = id === 0x83 ? "GetStandardBrightness" : "SetStandardBrightness";
            res.varStore = a[0]; res.ledId = a[1]; res.brightness = a[2];
        } else if (c === 0x03 && (id === 0x04)) {
            res.command = "SetStandardLedBlinking";
            res.varStore = a[0]; res.ledId = a[1];

        // ── Standard Matrix Effects (Class 0x03, Cmd 0x0A) ──
        } else if (c === 0x03 && id === 0x0A) {
            res.command = "SetStandardMatrixEffect";
            const stdEffMap = {
                0x00: "none", 0x01: "wave", 0x02: "reactive", 0x03: "breathing",
                0x04: "spectrum", 0x05: "custom_frame", 0x06: "static", 0x19: "starlight"
            };
            res.effect = stdEffMap[a[0]] || `unknown(${a[0]})`;
            res.effectId = a[0];
            if (a[0] === 0x01) { // wave
                res.direction = a[1];
            } else if (a[0] === 0x02) { // reactive
                res.speed = a[1]; res.r = a[2]; res.g = a[3]; res.b = a[4];
            } else if (a[0] === 0x03) { // breathing
                res.type = a[1]; // 1=single, 2=dual, 3=random
                if (a[1] === 1) { res.r1 = a[2]; res.g1 = a[3]; res.b1 = a[4]; }
                if (a[1] === 2) { res.r1 = a[2]; res.g1 = a[3]; res.b1 = a[4]; res.r2 = a[5]; res.g2 = a[6]; res.b2 = a[7]; }
            } else if (a[0] === 0x06) { // static
                res.r = a[1]; res.g = a[2]; res.b = a[3];
            } else if (a[0] === 0x19) { // starlight
                res.type = a[1]; res.speed = a[2];
                if (a[1] === 1) { res.r1 = a[3]; res.g1 = a[4]; res.b1 = a[5]; }
                if (a[1] === 2) { res.r1 = a[3]; res.g1 = a[4]; res.b1 = a[5]; res.r2 = a[6]; res.g2 = a[7]; res.b2 = a[8]; }
            }

        // ── Standard Matrix Custom Frame (Class 0x03, Cmd 0x0B) ──
        } else if (c === 0x03 && id === 0x0B) {
            res.command = "SetStandardMatrixCustomFrame";
            res.frameId = a[0]; res.row = a[1]; res.startCol = a[2]; res.stopCol = a[3];

        // ── Mouse Extended Matrix Effects (Class 0x03, Cmd 0x0D/0x8D) ──
        } else if (c === 0x03 && (id === 0x0D || id === 0x8D)) {
            res.command = id === 0x8D ? "GetMouseExtendedMatrixEffect" : "SetMouseExtendedMatrixEffect";
            if (a.length >= 3) {
                res.varStore = a[0]; res.ledId = a[1];
                const mouseEffMap = {
                    0x00: "none", 0x02: "reactive", 0x03: "breathing",
                    0x04: "spectrum", 0x06: "static"
                };
                res.effect = mouseEffMap[a[2]] || `unknown(${a[2]})`;
                if (a[2] === 0x06 && a.length >= 6) { // static
                    res.r = a[3]; res.g = a[4]; res.b = a[5];
                } else if (a[2] === 0x02 && a.length >= 7) { // reactive
                    res.speed = a[3]; res.r = a[4]; res.g = a[5]; res.b = a[6];
                } else if (a[2] === 0x03) { // breathing
                    res.type = a.length >= 4 ? a[3] : 3;
                    if (res.type === 1 && a.length >= 7) { res.r1 = a[4]; res.g1 = a[5]; res.b1 = a[6]; }
                    if (res.type === 2 && a.length >= 10) { res.r1 = a[4]; res.g1 = a[5]; res.b1 = a[6]; res.r2 = a[7]; res.g2 = a[8]; res.b2 = a[9]; }
                }
            }

        // ── Extended Brightness (Class 0x0F) ──
        } else if (c === 0x0F && (id === 0x84 || id === 0x04)) {
            res.command = id === 0x84 ? "GetExtendedBrightness" : "SetExtendedBrightness";
            res.varStore = a[0]; res.ledId = a[1]; res.brightness = a[2];

        // ── Extended Matrix Effects (Class 0x0F, Cmd 0x02/0x82) ──
        } else if (c === 0x0F && (id === 0x82 || id === 0x02)) {
            res.command = id === 0x82 ? "GetExtendedMatrixEffect" : "SetExtendedMatrixEffect";
            if (a.length >= 3) {
                res.varStore = a[0]; res.ledId = a[1];
                const effMap = {
                    0x00: "none", 0x01: "static", 0x02: "breathing",
                    0x03: "spectrum", 0x04: "wave", 0x05: "reactive",
                    0x07: "starlight", 0x08: "custom_frame", 0x0A: "wheel"
                };
                res.effect = effMap[a[2]] || `unknown(${a[2]})`;

                if (a[2] === 0x01) { // static
                    if (a.length >= 9) { res.r = a[6]; res.g = a[7]; res.b = a[8]; }
                } else if (a[2] === 0x02) { // breathing
                    // type at args[3]: 0x00 or missing = random, 0x01 = single, 0x02 = dual
                    res.type = (a.length >= 4 && a[3] !== 0) ? a[3] : 3;
                    if (res.type === 1 && a.length >= 9) { res.r1 = a[6]; res.g1 = a[7]; res.b1 = a[8]; }
                    if (res.type === 2 && a.length >= 12) { res.r1 = a[6]; res.g1 = a[7]; res.b1 = a[8]; res.r2 = a[9]; res.g2 = a[10]; res.b2 = a[11]; }
                } else if (a[2] === 0x03) { // spectrum
                    // no additional params
                } else if (a[2] === 0x04) { // wave
                    if (a.length >= 5) { res.direction = a[3]; res.speed = a[4]; }
                } else if (a[2] === 0x05) { // reactive
                    if (a.length >= 6) { res.speed = a[4]; }
                    if (a.length >= 9) { res.r = a[6]; res.g = a[7]; res.b = a[8]; }
                } else if (a[2] === 0x07) { // starlight
                    if (a.length >= 5) { res.speed = a[4]; }
                    // type at args[5]: 0x00 or missing = random, 0x01 = single, 0x02 = dual
                    res.type = (a.length >= 6 && a[5] !== 0) ? a[5] : 3;
                    if (res.type === 1 && a.length >= 9) { res.r1 = a[6]; res.g1 = a[7]; res.b1 = a[8]; }
                    if (res.type === 2 && a.length >= 12) { res.r1 = a[6]; res.g1 = a[7]; res.b1 = a[8]; res.r2 = a[9]; res.g2 = a[10]; res.b2 = a[11]; }
                } else if (a[2] === 0x0A) { // wheel
                    if (a.length >= 5) { res.direction = a[3]; res.speed = a[4]; }
                }
            }

        // ── Extended Matrix Custom Frame (Class 0x0F, Cmd 0x03) ──
        } else if (c === 0x0F && id === 0x03) {
            res.command = "SetExtendedMatrixCustomFrame";
            res.row = a[2]; res.startCol = a[3]; res.stopCol = a[4];

        // ── DPI (Class 0x04) ──
        } else if (c === 0x04 && (id === 0x85 || id === 0x05)) {
            res.command = id === 0x85 ? "GetDPI" : "SetDPI";
            res.varStore = a[0];
            res.dpiX = (a[1] << 8) | a[2];
            res.dpiY = (a[3] << 8) | a[4];
        } else if (c === 0x04 && (id === 0x86 || id === 0x06)) {
            res.command = id === 0x86 ? "GetDPIStages" : "SetDPIStages";
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

        // ── Battery / Power (Class 0x07) ──
        } else if (c === 0x07 && id === 0x80) {
            res.command = "GetBattery";
            res.percentage = Math.round((a[1] / 255) * 100);
        } else if (c === 0x07 && id === 0x84) {
            res.command = "GetChargingStatus";
            res.isCharging = a[1] === 1;
        } else if (c === 0x07 && (id === 0x01 || id === 0x81)) {
            res.command = id === 0x81 ? "GetLowBatteryThreshold" : "SetLowBatteryThreshold";
            res.threshold = a[0];
        } else if (c === 0x07 && (id === 0x02 || id === 0x82)) {
            res.command = id === 0x82 ? "GetDockBrightness" : "SetDockBrightness";
            res.brightness = a[0];
        } else if (c === 0x07 && (id === 0x03 || id === 0x83)) {
            res.command = id === 0x83 ? "GetIdleTime" : "SetIdleTime";
            res.seconds = (a[0] << 8) | a[1];

        // ── Scroll Wheel (Class 0x02) ──
        } else if (c === 0x02 && (id === 0x14 || id === 0x94)) {
            res.command = id === 0x94 ? "GetScrollMode" : "SetScrollMode";
            res.varStore = a[0]; res.mode = a[1];
        } else if (c === 0x02 && (id === 0x16 || id === 0x96)) {
            res.command = id === 0x96 ? "GetScrollAcceleration" : "SetScrollAcceleration";
            res.varStore = a[0]; res.state = a[1] === 1;
        } else if (c === 0x02 && (id === 0x17 || id === 0x97)) {
            res.command = id === 0x97 ? "GetSmartReel" : "SetSmartReel";
            res.varStore = a[0]; res.state = a[1] === 1;

        } else {
            res.command = `Unknown(0x${c.toString(16).padStart(2,'0')},0x${id.toString(16).padStart(2,'0')})`;
        }

        delete res.rawArgs;
        return res;
    }
};
