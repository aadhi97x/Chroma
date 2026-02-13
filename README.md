![Chroma Icon](icon.png)

# Chroma: Colorblind Assistant

A Chrome extension intended for colorblind individuals who need assistance in perceiving webpage visits. This plugin utilizes color correction matrices (daltonization) to change the color of web pages.

## Installation

1. Download and extract the zip file from releases.
2. Turn on Developer Mode in your web browser extension menu.
3. Click on "Load unpacked" and select the extracted folder.
4. The extension should now be installed.

## Features

- **Multiple Modes**: Supports Protanopia, Deuteranopia, Tritanopia and Achromatopsia.
- **Adjustable Intensity**: Control the level of color correction intensity from 0% to 100%.
- **Site-Specific Settings**: Save custom settings for particular sites or use a global default setting.
- **Fast Performance**: Makes use of hardware-accelerated SVG filters for smooth browsing.
- **Privacy Focused**: Works completely locally. No data is sent outside your device to any remote server.

## Usage

1.  Click the Chroma icon in your browser toolbar.
2.  **Toggle**: Turn the extension on or off.
3.  **Vision Type**: Select your type of color blindness from the dropdown.
4.  **Intensity**: Use the slider to adjust the strength of the correction.
5.  **Save**:
    *   **Save for [domain]**: only applies the custom settings to the current site.
    *   Otherwise, settings are applied globally.
6.  **Reset**: Return to default values (Global) or override any site-specific settings.

## Development

### Project Structure

*   `manifest.json`: Extension configuration.
*   `popup.html` / `popup.css` / `popup.js`: The extension UI logic.
*   `content.js`: The script injected into web pages to apply the SVG filters.
*   `icon.png`: Extension icon.

### Local Storage

The extension uses `chrome.storage.local` to persist user preferences.


