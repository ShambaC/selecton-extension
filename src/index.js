function init() {

  let userSettingsKeys = Object.keys(configs);

  /// Load user settings
  chrome.storage.local.get(
    userSettingsKeys, function (loadedConfigs) {
      configs.changeTextSelectionColor = loadedConfigs.changeTextSelectionColor ?? false;
      configs.textSelectionBackground = loadedConfigs.textSelectionBackground || '#338FFF';
      configs.textSelectionColor = loadedConfigs.textSelectionColor || '#ffffff';
      configs.textSelectionBackgroundOpacity = loadedConfigs.textSelectionBackgroundOpacity || 1.0;
      configs.shouldOverrideWebsiteSelectionColor = loadedConfigs.shouldOverrideWebsiteSelectionColor ?? false;

      configs.enabled = loadedConfigs.enabled ?? true;

      /// Check for domain to be in black list
      configs.excludedDomains = loadedConfigs.excludedDomains || '';

      var domainIsBlacklisted = false;
      if (configs.excludedDomains !== null && configs.excludedDomains !== undefined && configs.excludedDomains !== '')
        configs.excludedDomains.split(',').forEach(function (domain) {
          if (window.location.href.includes(domain.trim())) {
            domainIsBlacklisted = true;
          }
        });

      document.body.style.setProperty('--selection-button-padding', '6px 12px');

      if (configs.enabled && domainIsBlacklisted == false) {
        configs.debugMode = loadedConfigs.debugMode ?? false;

        if (configs.debugMode) {
          console.log('Loaded Selecton settings from memory:');
          console.log(loadedConfigs);
        }

        if (configs.changeTextSelectionColor)
          setTextSelectionColor();

        if (loadedConfigs.preferredMetricsSystem == null || loadedConfigs.preferredMetricsSystem == undefined) {
          setDefaultLocales();
        }

        /// Assign loaded values to a config file
        Object.keys(loadedConfigs).forEach(function (loadedKey) {
          if (loadedKey !== null && loadedKey !== undefined)
            configs[loadedKey] = loadedConfigs[loadedKey];
        });

        /// Get translated button labels
        copyLabel = chrome.i18n.getMessage("copyLabel");
        searchLabel = chrome.i18n.getMessage("searchLabel");
        translateLabel = chrome.i18n.getMessage("translateLabel");
        openLinkLabel = chrome.i18n.getMessage("openLinkLabel");
        showOnMapLabel = chrome.i18n.getMessage("showOnMap");
        cutLabel = chrome.i18n.getMessage("cutLabel");
        pasteLabel = chrome.i18n.getMessage("pasteLabel");

        /// Set dynamic color for foreground (text and icons)
        document.body.style.setProperty('--selection-button-foreground', configs.useCustomStyle == false ? '#ffffff' : getTextColorForBackground(configs.tooltipBackground.toLowerCase()));
        document.body.style.setProperty('--selection-button-background-hover', configs.useCustomStyle == false || isDarkBackground ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.5)');
        secondaryColor = configs.useCustomStyle == false || isDarkBackground ? 'lightBlue' : 'dodgerBlue';

        /// If initial launch, update currency rates
        if (configs.convertCurrencies) {
          if (ratesLastFetchedDate == null || ratesLastFetchedDate == undefined || ratesLastFetchedDate == '')
            fetchCurrencyRates();
          else loadCurrencyRatesFromMemory();
        }

        if (loadTooltipOnPageLoad)
          setUpNewTooltip();

        try {
          setPageListeners();
        } catch (e) {
          if (configs.debugMode)
            console.log('Error while setting Selecton listeners: ' + e);
        }
      }
    });
}

function setTextSelectionColor() {
  let importance = configs.shouldOverrideWebsiteSelectionColor ? '!important' : '';

  // CSS rules
  var selectionBackgroundRgb = hexToRgb(configs.textSelectionBackground);

  let rule = `::selection {background-color: rgba(${selectionBackgroundRgb.red}, ${selectionBackgroundRgb.green}, ${selectionBackgroundRgb.blue}, ${configs.textSelectionBackgroundOpacity}) ${importance}; color: ${configs.textSelectionColor} ${importance}; }`;
  rule += `::-moz-selection {background-color: rgba(${selectionBackgroundRgb.red}, ${selectionBackgroundRgb.green}, ${selectionBackgroundRgb.blue}, ${configs.textSelectionBackgroundOpacity}) ${importance}; color: ${configs.textSelectionColor} ${importance};}`;

  let css = document.createElement('style');
  css.type = 'text/css';
  css.appendChild(document.createTextNode(rule)); // Support for the rest
  document.getElementsByTagName("head")[0].appendChild(css);
}


function setPageListeners() {

  /// Hide tooltip on scroll
  document.addEventListener("scroll", function (e) {
    if (configs.hideOnScroll)
      hideTooltip();
  });

  /// Hide tooltip when any key is pressed
  if (configs.hideOnKeypress)
    document.addEventListener("keydown", function () {
      hideTooltip();
      hideDragHandles();
    });

  document.addEventListener("mousedown", function (e) {
    if (isDraggingTooltip) return;
    evt = e || window.event;
    if ("buttons" in evt) {
      if (evt.buttons == 1) {
        selection = null;
        hideTooltip();
        hideDragHandles();
      }
    }
  });

  document.addEventListener("mouseup", async function (e) {
    if (window.getSelection) {
      selection = window.getSelection();
    } else if (document.selection) {
      selection = document.selection.createRange();
    }

    if (selection !== null && selection !== undefined && selection.toString().trim() !== '') {

      if (configs.snapSelectionToWord) {
        if (configs.disableWordSnappingOnCtrlKey && e.ctrlKey == true) {
          if (configs.debugMode)
            console.log('Word snapping was rejected due to pressed CTRL key');
        } else {
          snapSelectionByWords(selection);
        }
      }

      createTooltip(e);
    }
  });

  /// Experimental selectionchange listener
  // document.addEventListener('selectionchange', function (e) {
  //   if (isDraggingTooltip) return;
  //   var sel = document.getSelection().toString();

  //   console.log('selection:');
  //   console.log(sel);

  //   if (sel == null || sel == undefined || sel.trim() == '') {
  //     // document.removeEventListener('mouseup');
  //     selection = null;
  //     hideTooltip();
  //     hideDragHandles();
  //   } else {
  //   }
  // });
}

init();
