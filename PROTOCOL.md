# OpenRazer HID Protocol Details

This document describes the byte-by-byte details of the OpenRazer communication protocol, extracted from the OpenRazer Linux kernel driver.

## Base Report Structure

Each USB HID report consists of 90 bytes:

| Byte Index | Field | Description |
|---|---|---|
| 0 | Status | 0x00 for New Command. (0x01 = Busy, 0x02 = Successful, 0x03 = Failure, 0x04 = Timeout, 0x05 = Not Supported) |
| 1 | Transaction ID | Used to match requests and responses. Common values: 0xFF (legacy), 0x3F (mid-gen), 0x1F (newest). |
| 2-3 | Remaining Packets | Big Endian. Number of remaining packets in a sequence (usually 0x0000). |
| 4 | Protocol Type | Always 0x00. |
| 5 | Data Size | Size of payload (number of argument bytes used, up to 80). |
| 6 | Command Class | The type of command being issued. |
| 7 | Command ID | The specific command. Bit 7: 0=Set (Host→Device), 1=Get (Device→Host). |
| 8-87 | Arguments | Up to 80 bytes of payload data. |
| 88 | CRC | XOR checksum of bytes 2 through 87. |
| 89 | Reserved | 0x00. |

## LED Zone IDs

| ID | Zone |
|---|---|
| 0x00 | All / Default |
| 0x01 | Scroll Wheel |
| 0x03 | Battery |
| 0x04 | Logo |
| 0x05 | Backlight |
| 0x07 | Macro |
| 0x08 | Game |
| 0x10 | Right Side |
| 0x11 | Left Side |
| 0x20 | Charging |
| 0x21 | Fast Charging |
| 0x22 | Fully Charged |

VarStore: 0x00 = No Store, 0x01 = Variable Store (persistent).

## Supported Commands

### 1. Device Info & Modes (Class: 0x00)
* **Get Serial**: CMD: `0x82`, DataSize: `0x16`. Response: 22-byte serial string.
* **Get Firmware Version**: CMD: `0x81`, DataSize: `0x02`. Response: Args[0]=major, Args[1]=minor.
* **Set Device Mode**: CMD: `0x04`, DataSize: `0x02`. Args: `[Mode (0x00=Normal, 0x03=Driver), Param]`.
* **Get Device Mode**: CMD: `0x84`, DataSize: `0x02`.

### 2. Polling Rate v1 (Class: 0x00)
* **Set Polling Rate**: CMD: `0x05`, DataSize: `0x01`. Args: `[0x01=1000Hz, 0x02=500Hz, 0x08=125Hz]`.
* **Get Polling Rate**: CMD: `0x85`, DataSize: `0x01`.

### 3. Polling Rate v2 / HyperPolling (Class: 0x00)
* **Set High Polling Rate**: CMD: `0x40`, DataSize: `0x02`. Args: `[0x00, Hz_Flag]`.
* **Get High Polling Rate**: CMD: `0xC0`, DataSize: `0x01`.
* Hz_Flag: `0x01=8000, 0x02=4000, 0x04=2000, 0x08=1000, 0x10=500, 0x20=250, 0x40=125`.

### 4. Standard LED Functions (Class: 0x03)
* **Set LED State**: CMD: `0x00`, DataSize: `0x03`. Args: `[VarStore, LED_ID, State (0/1)]`.
* **Get LED State**: CMD: `0x80`, DataSize: `0x03`. Args: `[VarStore, LED_ID]`.
* **Set LED RGB**: CMD: `0x01`, DataSize: `0x05`. Args: `[VarStore, LED_ID, R, G, B]`.
* **Get LED RGB**: CMD: `0x81`, DataSize: `0x05`. Args: `[VarStore, LED_ID]`.
* **Set LED Effect**: CMD: `0x02`, DataSize: `0x03`. Args: `[VarStore, LED_ID, Effect]`. Effect: 0x00=Static, 0x01=Blinking, 0x02=Breathing, 0x04=Spectrum.
* **Get LED Effect**: CMD: `0x82`, DataSize: `0x03`. Args: `[VarStore, LED_ID]`.
* **Set LED Brightness**: CMD: `0x03`, DataSize: `0x03`. Args: `[VarStore, LED_ID, Brightness (0-255)]`.
* **Get LED Brightness**: CMD: `0x83`, DataSize: `0x03`. Args: `[VarStore, LED_ID]`.
* **Set LED Blinking**: CMD: `0x04`, DataSize: `0x04`. Args: `[VarStore, LED_ID, 0x05, 0x05]`.

### 5. Standard Matrix Effects (Class: 0x03, CMD: 0x0A)
* **None**: DataSize: `0x01`. Args: `[0x00]`.
* **Wave**: DataSize: `0x02`. Args: `[0x01, Direction (1/2)]`.
* **Reactive**: DataSize: `0x05`. Args: `[0x02, Speed (1-4), R, G, B]`.
* **Breathing Single**: DataSize: `0x08`. Args: `[0x03, 0x01, R, G, B]`.
* **Breathing Dual**: DataSize: `0x08`. Args: `[0x03, 0x02, R1, G1, B1, R2, G2, B2]`.
* **Breathing Random**: DataSize: `0x08`. Args: `[0x03, 0x03]`.
* **Spectrum**: DataSize: `0x01`. Args: `[0x04]`.
* **Custom Frame**: DataSize: `0x02`. Args: `[0x05, VarStore]`.
* **Static**: DataSize: `0x04`. Args: `[0x06, R, G, B]`.
* **Starlight Single**: DataSize: `0x07`. Args: `[0x19, 0x01, Speed (1-3), R, G, B]`.
* **Starlight Dual**: DataSize: `0x0A`. Args: `[0x19, 0x02, Speed, R1, G1, B1, R2, G2, B2]`.
* **Starlight Random**: DataSize: `0x04`. Args: `[0x19, 0x03, Speed]`.

### 6. Standard Matrix Custom Frame (Class: 0x03, CMD: 0x0B)
* DataSize: `0x46`. Args: `[0xFF, Row, StartCol, StopCol, <RGB data...>]`.

### 7. Mouse Extended Matrix Effects (Class: 0x03, CMD: 0x0D)
* **None**: DataSize: `0x03`. Args: `[VarStore, LED_ID, 0x00]`.
* **Static**: DataSize: `0x06`. Args: `[VarStore, LED_ID, 0x06, R, G, B]`.
* **Spectrum**: DataSize: `0x03`. Args: `[VarStore, LED_ID, 0x04]`.
* **Reactive**: DataSize: `0x07`. Args: `[VarStore, LED_ID, 0x02, Speed (1-4), R, G, B]`.
* **Breathing Single**: DataSize: `0x0A`. Args: `[VarStore, LED_ID, 0x03, 0x01, R, G, B]`.
* **Breathing Dual**: DataSize: `0x0A`. Args: `[VarStore, LED_ID, 0x03, 0x02, R1, G1, B1, R2, G2, B2]`.
* **Breathing Random**: DataSize: `0x0A`. Args: `[VarStore, LED_ID, 0x03, 0x03]`.

### 8. Extended Matrix Effects (Class: 0x0F, CMD: 0x02)
* **None**: DataSize: `0x06`. Args: `[VarStore, LED_ID, 0x00]`.
* **Static**: DataSize: `0x09`. Args: `[VarStore, LED_ID, 0x01, 0, 0, 0x01, R, G, B]`.
* **Breathing Random**: DataSize: `0x06`. Args: `[VarStore, LED_ID, 0x02]`. (No type/color bytes.)
* **Breathing Single**: DataSize: `0x09`. Args: `[VarStore, LED_ID, 0x02, 0x01, 0, 0x01, R, G, B]`.
* **Breathing Dual**: DataSize: `0x0C`. Args: `[VarStore, LED_ID, 0x02, 0x02, 0, 0x02, R1, G1, B1, R2, G2, B2]`.
* **Spectrum**: DataSize: `0x06`. Args: `[VarStore, LED_ID, 0x03]`.
* **Wave**: DataSize: `0x06`. Args: `[VarStore, LED_ID, 0x04, Direction (0/1/2), Speed (default 0x28)]`.
* **Reactive**: DataSize: `0x09`. Args: `[VarStore, LED_ID, 0x05, 0, Speed (1-4), 0x01, R, G, B]`.
* **Starlight Random**: DataSize: `0x06`. Args: `[VarStore, LED_ID, 0x07, 0, Speed (1-3)]`. (No type/color bytes.)
* **Starlight Single**: DataSize: `0x09`. Args: `[VarStore, LED_ID, 0x07, 0, Speed, 0x01, R, G, B]`.
* **Starlight Dual**: DataSize: `0x0C`. Args: `[VarStore, LED_ID, 0x07, 0, Speed, 0x02, R1, G1, B1, R2, G2, B2]`.
* **Custom Frame**: DataSize: `0x06`. Args: `[0x00, 0x00, 0x08]`.
* **Wheel**: DataSize: `0x06`. Args: `[VarStore, LED_ID, 0x0A, Direction (1/2), Speed (default 0x28)]`.

### 9. Extended Matrix Brightness (Class: 0x0F)
* **Set Brightness**: CMD: `0x04`, DataSize: `0x03`. Args: `[VarStore, LED_ID, Brightness (0-255)]`.
* **Get Brightness**: CMD: `0x84`, DataSize: `0x03`. Args: `[VarStore, LED_ID]`.
* **Get Effect**: CMD: `0x82`, DataSize: `0x0C`. Args: `[VarStore, LED_ID]`. Response contains full effect parameters.

### 10. Extended Matrix Custom Frame (Class: 0x0F, CMD: 0x03)
* DataSize: `0x47`. Args: `[0x00, 0x00, Row, StartCol, StopCol, <RGB data...>]`.

### 11. DPI & Sensor Functions (Class: 0x04)
* **Set DPI (XY)**: CMD: `0x05`, DataSize: `0x07`. Args: `[VarStore, DPI_X_High, DPI_X_Low, DPI_Y_High, DPI_Y_Low, 0x00, 0x00]`.
* **Get DPI (XY)**: CMD: `0x85`, DataSize: `0x07`. Args: `[VarStore]`.
* **Set DPI Stages**: CMD: `0x06`, DataSize: `0x26`. Args: `[VarStore, Active_Stage, Count, <per stage: ID(1B), DPI_X(2B BE), DPI_Y(2B BE), Reserved(2B)>]`. Max 5 stages.
* **Get DPI Stages**: CMD: `0x86`, DataSize: `0x26`. Args: `[VarStore]`.

### 12. Power / Battery (Class: 0x07)
* **Set Low Battery Threshold**: CMD: `0x01`, DataSize: `0x01`. Args: `[Threshold]`. Common: 0x0C=5%, 0x26=15%, 0x3F=25%.
* **Get Low Battery Threshold**: CMD: `0x81`, DataSize: `0x01`.
* **Set Dock Brightness**: CMD: `0x02`, DataSize: `0x01`. Args: `[Brightness]`.
* **Get Dock Brightness**: CMD: `0x82`, DataSize: `0x01`.
* **Set Idle Time**: CMD: `0x03`, DataSize: `0x02`. Args: `[Seconds_High, Seconds_Low]`. Range: 60-900 seconds.
* **Get Idle Time**: CMD: `0x83`, DataSize: `0x02`.
* **Get Battery Level**: CMD: `0x80`, DataSize: `0x02`. Response: Args[1] = level (0-255, scale to 0-100%).
* **Get Charging Status**: CMD: `0x84`, DataSize: `0x02`. Response: Args[1] = 0/1.

### 13. Scroll Wheel (Class: 0x02)
* **Set Scroll Mode**: CMD: `0x14`, DataSize: `0x02`. Args: `[VarStore, Mode (0=Tactile, 1=FreeSpin)]`.
* **Get Scroll Mode**: CMD: `0x94`, DataSize: `0x02`. Args: `[VarStore]`.
* **Set Scroll Acceleration**: CMD: `0x16`, DataSize: `0x02`. Args: `[VarStore, State (0/1)]`.
* **Get Scroll Acceleration**: CMD: `0x96`, DataSize: `0x02`. Args: `[VarStore]`.
* **Set Smart Reel**: CMD: `0x17`, DataSize: `0x02`. Args: `[VarStore, State (0/1)]`.
* **Get Smart Reel**: CMD: `0x97`, DataSize: `0x02`. Args: `[VarStore]`.
