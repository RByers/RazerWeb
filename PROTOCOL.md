# OpenRazer HID Protocol Details

This document describes the byte-by-byte details of the OpenRazer communication protocol, extracted from the OpenRazer Linux kernel driver.

## Base Report Structure

Each USB HID report consists of 90 bytes:

| Byte Index | Field | Description |
|---|---|---|
| 0 | Status | 0x00 for New Command. (0x01 = Busy, 0x02 = Successful, 0x03 = Failure, 0x04 = Timeout, 0x05 = Not Supported) |
| 1 | Transaction ID | Used to match requests and responses. |
| 2-3 | Remaining Packets | Big Endian. Number of remaining packets in a sequence (usually 0x0000). |
| 4 | Protocol Type | Always 0x00. |
| 5 | Data Size | Size of payload (number of argument bytes used, up to 80). |
| 6 | Command Class | The type of command being issued (e.g., 0x03 for Standard LED, 0x0F for Extended LED). |
| 7 | Command ID | The specific command. Direction 0 is Host->Device (Set, e.g. 0x00), Direction 1 is Device->Host (Get, e.g. 0x80). |
| 8-87 | Arguments | Up to 80 bytes of payload data. |
| 88 | CRC | XOR checksum of bytes 2 through 87. |
| 89 | Reserved | 0x00. |

## Supported Commands

### 1. Device Info & Modes
* **Get Serial**: Class: `0x00`, CMD: `0x82`, DataSize: `0x16`. (Returns 22 bytes).
* **Get Firmware Version**: Class: `0x00`, CMD: `0x81`, DataSize: `0x02`. (Returns 2 bytes).
* **Set Device Mode**: Class: `0x00`, CMD: `0x04`, DataSize: `0x02`. Args[0] = Mode (0x00=Normal, 0x03=Driver), Args[1] = 0x00.
* **Get Device Mode**: Class: `0x00`, CMD: `0x84`, DataSize: `0x02`.

### 2. Standard LED Functions (Class: 0x03)
* **Set LED State**: CMD: `0x00`, DataSize: `0x03`. Args: `[VarStore, LED_ID, State (0/1)]`.
* **Get LED State**: CMD: `0x80`, DataSize: `0x03`. Args: `[VarStore, LED_ID]`.
* **Set LED RGB**: CMD: `0x01`, DataSize: `0x05`. Args: `[VarStore, LED_ID, R, G, B]`.
* **Get LED RGB**: CMD: `0x81`, DataSize: `0x05`. Args: `[VarStore, LED_ID]`.
* **Set LED Effect**: CMD: `0x02`, DataSize: `0x03`. Args: `[VarStore, LED_ID, Effect]`.
* **Set LED Brightness**: CMD: `0x03`, DataSize: `0x03`. Args: `[VarStore, LED_ID, Brightness]`.
* **Get LED Brightness**: CMD: `0x83`, DataSize: `0x03`. Args: `[VarStore, LED_ID]`.

### 3. Standard Matrix Effects (Class: 0x03, CMD: 0x0A)
* **None**: DataSize: `0x01`. Args: `[0x00]`.
* **Wave**: DataSize: `0x02`. Args: `[0x01, Direction (1/2)]`.
* **Reactive**: DataSize: `0x05`. Args: `[0x02, Speed (1-4), R, G, B]`.
* **Spectrum**: DataSize: `0x01`. Args: `[0x04]`.
* **Static**: DataSize: `0x04`. Args: `[0x06, R, G, B]`.
* **Starlight**: DataSize: `0x01/0x07/0x0A`. Args: `[0x19, Type (1=Single, 2=Dual, 3=Random), Speed (1-3), R1, G1, B1, R2, G2, B2]`.
* **Breathing**: DataSize: `0x08`. Args: `[0x03, Type (1=Single, 2=Dual, 3=Random), R1, G1, B1, R2, G2, B2]`.

### 4. Extended Matrix Effects (Class: 0x0F, CMD: 0x02)
* **None**: DataSize: `0x06`. Args: `[VarStore, LED_ID, 0x00]`.
* **Static**: DataSize: `0x09`. Args: `[VarStore, LED_ID, 0x01, 0, 0, 0x01, R, G, B]`.
* **Wave**: DataSize: `0x06`. Args: `[VarStore, LED_ID, 0x04, Direction (0/1/2), 0x28 (Speed)]`.
* **Starlight**: DataSize: `0x06/0x09/0x0C`. Args: `[VarStore, LED_ID, 0x07, 0, Speed, Type, R1, G1, B1, R2, G2, B2]`.
* **Spectrum**: DataSize: `0x06`. Args: `[VarStore, LED_ID, 0x03]`.
* **Wheel**: DataSize: `0x06`. Args: `[VarStore, LED_ID, 0x0A, Direction (1/2), 0x28]`.
* **Reactive**: DataSize: `0x09`. Args: `[VarStore, LED_ID, 0x05, 0, Speed, 0x01, R, G, B]`.
* **Breathing**: DataSize: `0x06/0x09/0x0C`. Args: `[VarStore, LED_ID, 0x02, Type, 0, Type, R1, G1, B1, R2, G2, B2]`.

### 5. DPI & Sensor Functions (Class: 0x04)
* **Set DPI (XY)**: CMD: `0x05`, DataSize: `0x07`. Args: `[VarStore, DPI_X_High, DPI_X_Low, DPI_Y_High, DPI_Y_Low, 0x00, 0x00]`.
* **Get DPI (XY)**: CMD: `0x85`, DataSize: `0x07`. Args: `[VarStore]`.
* **Set DPI Stages**: CMD: `0x06`, DataSize: `0x26` (38). Args: `[VarStore, Active_Stage, Count, <Stage1..n: ID, DPI_X_H, DPI_X_L, DPI_Y_H, DPI_Y_L, 0, 0>]`.
* **Get DPI Stages**: CMD: `0x86`, DataSize: `0x26`. Args: `[VarStore]`.

### 6. Polling Rate (Class: 0x00)
* **Set Polling Rate**: CMD: `0x05`, DataSize: `0x01`. Args: `[0x01 (1000Hz), 0x02 (500Hz), 0x08 (125Hz)]`.
* **Get Polling Rate**: CMD: `0x85`, DataSize: `0x01`.
* **Set Polling Rate 2 (High Hz)**: CMD: `0x40`, DataSize: `0x02`. Args: `[Arg (0/1), Hz_Flag (0x01=8000, 0x02=4000, 0x04=2000, 0x08=1000, 0x10=500, 0x40=125)]`.

### 7. Miscellaneous
* **Set Scroll Mode (Tactile/FreeSpin)**: Class: `0x02`, CMD: `0x14`, DataSize: `0x02`. Args: `[VarStore, Mode (0/1)]`.
* **Set Scroll Acceleration**: Class: `0x02`, CMD: `0x16`, DataSize: `0x02`. Args: `[VarStore, State (0/1)]`.
* **Set Smart Reel**: Class: `0x02`, CMD: `0x17`, DataSize: `0x02`. Args: `[VarStore, State (0/1)]`.
* **Set Idle Time**: Class: `0x07`, CMD: `0x03`, DataSize: `0x02`. Args: `[Idle_Time_High, Idle_Time_Low]` (seconds).
* **Get Battery Level**: Class: `0x07`, CMD: `0x80`, DataSize: `0x02`.
* **Get Charging Status**: Class: `0x07`, CMD: `0x84`, DataSize: `0x02`.
* **Set Low Battery Threshold**: Class: `0x07`, CMD: `0x01`, DataSize: `0x01`. Args: `[Threshold]`.
