// Device capability profiles derived from OpenRazer driver (razermouse_driver.c)
// Each profile lists the features the device actually supports.

const DeviceCapabilities = {
    // Capability flags
    FLAGS: {
        POLL_RATE: 'poll_rate',
        DPI: 'dpi',
        DPI_STAGES: 'dpi_stages',
        BATTERY: 'battery',
        IDLE_TIME: 'idle_time',
        SCROLL_MODE: 'scroll_mode',
        SCROLL_ACCEL: 'scroll_accel',
        SMART_REEL: 'smart_reel',
        // LED zones with their supported effects
        LOGO_LED: 'logo_led',
        SCROLL_LED: 'scroll_led',
        BACKLIGHT_LED: 'backlight_led',
        // Effect types (per-zone effects are tracked in zone definitions)
        EFFECT_NONE: 'effect_none',
        EFFECT_STATIC: 'effect_static',
        EFFECT_SPECTRUM: 'effect_spectrum',
        EFFECT_REACTIVE: 'effect_reactive',
        EFFECT_BREATHING: 'effect_breathing',
        EFFECT_WAVE: 'effect_wave',
        EFFECT_STARLIGHT: 'effect_starlight',
        EFFECT_WHEEL: 'effect_wheel',
        EFFECT_CUSTOM_FRAME: 'effect_custom_frame',
    },

    // Known device profiles keyed by USB PID
    // Capabilities derived from CREATE_DEVICE_FILE entries in razermouse_driver.c
    profiles: {
        // Razer Cobra (wired, no battery, logo LED only)
        0x00A3: {
            name: 'Razer Cobra',
            transactionId: 0xFF,
            caps: ['poll_rate', 'dpi', 'dpi_stages',
                   'logo_led'],
            zones: {
                logo: {
                    ledId: 0x04,
                    effects: ['none', 'static', 'spectrum', 'reactive', 'breathing']
                }
            }
        },

        // Razer Cobra Pro (wireless, battery, multi-zone)
        0x00AF: {
            name: 'Razer Cobra Pro (Wired)',
            transactionId: 0x1F,
            caps: ['poll_rate', 'dpi', 'dpi_stages', 'battery', 'idle_time',
                   'logo_led', 'scroll_led', 'backlight_led'],
            zones: {
                logo: { ledId: 0x04, effects: ['none', 'static', 'spectrum', 'wave'] },
                scroll: { ledId: 0x01, effects: ['none', 'static', 'spectrum', 'wave'] },
                backlight: { ledId: 0x05, effects: ['none', 'static', 'spectrum', 'wave'] }
            }
        },
        0x00B0: {
            name: 'Razer Cobra Pro (Wireless)',
            transactionId: 0x1F,
            caps: ['poll_rate', 'dpi', 'dpi_stages', 'battery', 'idle_time',
                   'logo_led', 'scroll_led', 'backlight_led'],
            zones: {
                logo: { ledId: 0x04, effects: ['none', 'static', 'spectrum', 'wave'] },
                scroll: { ledId: 0x01, effects: ['none', 'static', 'spectrum', 'wave'] },
                backlight: { ledId: 0x05, effects: ['none', 'static', 'spectrum', 'wave'] }
            }
        },

        // Razer Basilisk V3
        0x0099: {
            name: 'Razer Basilisk V3',
            transactionId: 0x1F,
            caps: ['poll_rate', 'dpi', 'dpi_stages',
                   'scroll_mode', 'scroll_accel', 'smart_reel',
                   'logo_led', 'scroll_led', 'backlight_led'],
            zones: {
                logo: { ledId: 0x04, effects: ['none', 'static', 'spectrum', 'wave'] },
                scroll: { ledId: 0x01, effects: ['none', 'static', 'spectrum', 'wave'] },
                backlight: { ledId: 0x05, effects: ['none', 'static', 'spectrum', 'wave'] }
            }
        },

        // Razer Basilisk V3 Pro (Wired)
        0x00AA: {
            name: 'Razer Basilisk V3 Pro (Wired)',
            transactionId: 0x1F,
            caps: ['poll_rate', 'dpi', 'dpi_stages', 'battery', 'idle_time',
                   'scroll_mode', 'scroll_accel', 'smart_reel',
                   'logo_led', 'scroll_led', 'backlight_led'],
            zones: {
                logo: { ledId: 0x04, effects: ['none', 'static', 'spectrum', 'wave'] },
                scroll: { ledId: 0x01, effects: ['none', 'static', 'spectrum', 'wave'] },
                backlight: { ledId: 0x05, effects: ['none', 'static', 'spectrum', 'wave'] }
            }
        },

        // Razer DeathAdder V3 (wired, no LEDs at all)
        0x00B2: {
            name: 'Razer DeathAdder V3',
            transactionId: 0x1F,
            caps: ['poll_rate', 'dpi', 'dpi_stages'],
            zones: {}
        },

        // Razer Viper V2 Pro (Wired)
        0x00A5: {
            name: 'Razer Viper V2 Pro (Wired)',
            transactionId: 0x1F,
            caps: ['poll_rate', 'dpi', 'dpi_stages', 'battery', 'idle_time'],
            zones: {}
        },
        // Razer Viper V2 Pro (Wireless)
        0x00A6: {
            name: 'Razer Viper V2 Pro (Wireless)',
            transactionId: 0x1F,
            caps: ['poll_rate', 'dpi', 'dpi_stages', 'battery', 'idle_time'],
            zones: {}
        },

        // Razer DeathAdder Essential
        0x006E: {
            name: 'Razer DeathAdder Essential',
            transactionId: 0xFF,
            caps: ['poll_rate', 'dpi',
                   'logo_led', 'scroll_led'],
            zones: {
                logo: { ledId: 0x04, effects: ['none', 'static', 'spectrum', 'breathing'] },
                scroll: { ledId: 0x01, effects: ['none', 'static', 'spectrum', 'breathing'] }
            }
        },

        // Razer Viper Mini
        0x008A: {
            name: 'Razer Viper Mini',
            transactionId: 0xFF,
            caps: ['poll_rate', 'dpi', 'dpi_stages',
                   'backlight_led'],
            zones: {
                backlight: {
                    ledId: 0x05,
                    effects: ['none', 'static', 'spectrum', 'reactive', 'breathing', 'wave']
                }
            }
        },
    },

    // Default profile for unknown devices — show everything
    defaultProfile: {
        name: null,
        transactionId: 0xFF,
        caps: ['poll_rate', 'dpi', 'dpi_stages', 'battery', 'idle_time',
               'scroll_mode', 'scroll_accel', 'smart_reel',
               'logo_led', 'scroll_led', 'backlight_led'],
        zones: {
            logo: { ledId: 0x04, effects: ['none', 'static', 'spectrum', 'reactive', 'breathing', 'wave', 'starlight', 'wheel'] },
            scroll: { ledId: 0x01, effects: ['none', 'static', 'spectrum', 'reactive', 'breathing', 'wave', 'starlight', 'wheel'] },
            backlight: { ledId: 0x05, effects: ['none', 'static', 'spectrum', 'reactive', 'breathing', 'wave', 'starlight', 'wheel'] }
        }
    },

    getProfile: function(productId) {
        return this.profiles[productId] || null;
    },

    hasCap: function(profile, cap) {
        return profile.caps.includes(cap);
    },

    hasAnyLed: function(profile) {
        return Object.keys(profile.zones).length > 0;
    }
};
