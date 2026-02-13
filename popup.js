document.addEventListener('DOMContentLoaded', () => {
  const toggleExtension = document.getElementById('toggle-extension');
  const typeSelect = document.getElementById('type-select');
  const severitySlider = document.getElementById('severity-slider');
  const severityValue = document.getElementById('severity-value');
  const statusMessage = document.getElementById('status-message');
  const saveSiteBtn = document.getElementById('save-site-btn');

  // State management
  const state = {
    hostname: '',
    isSiteSpecific: false,
    settings: {
      enabled: true,
      type: 'protanopia',
      severity: 100
    }
  };

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url) {
      try {
        const url = new URL(tabs[0].url);
        state.hostname = url.hostname;
      } catch (e) {
        saveSiteBtn.style.display = 'none';
      }
    }
    loadSettings();
  });

  function updateUI() {
    toggleExtension.checked = state.settings.enabled !== false;
    typeSelect.value = state.settings.type || 'protanopia';
    severitySlider.value = state.settings.severity !== undefined ? state.settings.severity : 100;
    updateSeverityText(severitySlider.value);

    if (state.hostname) {
      saveSiteBtn.style.display = 'block';
      if (state.isSiteSpecific) {
        saveSiteBtn.textContent = `Update for ${state.hostname}`;
        saveSiteBtn.style.background = 'var(--primary-hover)';
      } else {
        saveSiteBtn.textContent = `Save for ${state.hostname}`;
        saveSiteBtn.style.background = '';
      }
    } else {
      saveSiteBtn.style.display = 'none';
    }
  }

  function loadSettings() {
    chrome.storage.local.get(['enabled', 'type', 'severity', state.hostname], (result) => {

      if (state.hostname && result[state.hostname]) {
        state.isSiteSpecific = true;
        state.settings = { ...result[state.hostname] };
      } else {

        state.isSiteSpecific = false;
        state.settings = {
          enabled: result.enabled,
          type: result.type,
          severity: result.severity
        };
      }
      updateUI();
    });
  }

  // Debounce helper
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  const debouncedSaveToStorage = debounce((settings, isSite, hostname) => {
    if (isSite && hostname) {
      const data = {};
      data[hostname] = settings;
      chrome.storage.local.set(data);
    } else {
      chrome.storage.local.set(settings);
    }
  }, 500);

  function getSettingsFromUI() {
    return {
      enabled: toggleExtension.checked,
      type: typeSelect.value,
      severity: parseInt(severitySlider.value, 10)
    };
  }

  // Handler for UI changes
  function handleSettingChange(source) {
    const newSettings = getSettingsFromUI();
    state.settings = newSettings; // Update local state


    notifyContentScript(newSettings);

    if (source === 'slider') {
      debouncedSaveToStorage(newSettings, state.isSiteSpecific, state.hostname);
    } else {
      if (state.isSiteSpecific && state.hostname) {
        const data = {};
        data[state.hostname] = newSettings;
        chrome.storage.local.set(data);
      } else {
        chrome.storage.local.set(newSettings);
      }
    }
  }

  // Event Listeners
  toggleExtension.addEventListener('change', () => handleSettingChange('toggle'));
  typeSelect.addEventListener('change', () => handleSettingChange('select'));

  severitySlider.addEventListener('input', () => {
    updateSeverityText(severitySlider.value);
    handleSettingChange('slider');
  });

  saveSiteBtn.addEventListener('click', () => {

    state.isSiteSpecific = true;
    const currentSettings = getSettingsFromUI();
    state.settings = currentSettings;

    const data = {};
    data[state.hostname] = currentSettings;

    chrome.storage.local.set(data, () => {
      updateUI(); // Refreshes button text/style
      showStatus(`Saved for ${state.hostname}`);
      notifyContentScript(currentSettings);
    });
  });

  const resetBtn = document.getElementById('reset-btn');
  resetBtn.addEventListener('click', () => {
    if (state.isSiteSpecific && state.hostname) {
      chrome.storage.local.remove(state.hostname, () => {
        loadSettings();
        showStatus(`Reset ${state.hostname}`);
      });
    } else {

      const defaults = {
        enabled: true,
        type: 'protanopia',
        severity: 100
      };
      chrome.storage.local.set(defaults, () => {

        state.settings = defaults;
        updateUI();
        notifyContentScript(defaults);
        showStatus('Global reset');
      });
    }
  });

  function updateSeverityText(value) {
    severityValue.textContent = `${value}%`;
  }

  function notifyContentScript(settings) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.warn("Chroma: Error querying tabs", chrome.runtime.lastError);
        return;
      }

      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateSettings",
          settings: settings
        }, (response) => {
          if (chrome.runtime.lastError) {
          }
        });
      }
    });
  }

  function showStatus(msg) {
    statusMessage.textContent = msg;
    setTimeout(() => {
      statusMessage.textContent = '';
    }, 2000);
  }
});
