/**
 * गुण मिलान जनरेटर - Document generation & UI logic
 * Static, no backend. Download uses Canvas API: letterhead image + text (no white box).
 * Run via a local server so letterhead loads correctly.
 */

(function () {
  'use strict';

  // --- Config ---
  // Use letterhead.png or letterhead.jpg - ensure the file exists next to index.html
  const LETTERHEAD_URL = 'letterhead.png';
  const DD_MM_YYYY = true; // Date in document as DD-MM-YY

  // --- DOM refs (set when DOM is ready) ---
  var form, btnGenerate, btnReset;

  var TEMPLATE_W = 1700;
  var TEMPLATE_H = 2500;

  function getEl(id) {
    return document.getElementById(id);
  }

  /**
   * Format date input value to DD-MM-YYYY (Hindi style)
   * @param {string} dateStr - ISO date from input[type=date]
   * @returns {string}
   */
  function formatDateHindi(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return DD_MM_YYYY ? `${day}-${month}-${year}` : dateStr;
  }

  function isGeneralMode() {
    const docType = getEl('doc-type');
    return docType && docType.value === 'general';
  }

  /**
   * Get form data by reading each field (works reliably with file:// and local server)
   */
  function getFormData() {
    const data = {};
    const names = [
      'doc_type', 'prati', 'kramank', 'dinank', 'general_message',
      'var_name', 'var_dob', 'var_time', 'var_place', 'var_rashi', 'var_nakshatra', 'var_lagna_navamshesh', 'var_mangal',
      'kanya_name', 'kanya_dob', 'kanya_time', 'kanya_place', 'kanya_rashi', 'kanya_nakshatra', 'kanya_lagna_navamshesh', 'kanya_mangal',
      'kul_gun', 'vivaran', 'nishkarsh'
    ];
    names.forEach(function (name) {
      const input = form.querySelector('[name="' + name + '"]');
      data[name] = input ? (input.value || '').trim() : '';
    });
    data.dinank_formatted = formatDateHindi(getEl('dinank') && getEl('dinank').value);
    data.is_general = data.doc_type === 'general';
    return data;
  }

  /**
   * Required field IDs for validation
   */
  const requiredIds = [
    'var-name', 'var-dob', 'var-time', 'var-place', 'var-rashi', 'var-nakshatra', 'var-lagna-navamshesh', 'var-mangal',
    'kanya-name', 'kanya-dob', 'kanya-time', 'kanya-place', 'kanya-rashi', 'kanya-nakshatra', 'kanya-lagna-navamshesh', 'kanya-mangal',
    'kul-gun', 'vivaran', 'nishkarsh'
  ];

  /** Required field IDs for General mode */
  const requiredIdsGeneral = ['prati', 'kramank', 'dinank', 'general-message'];

  /**
   * Validate required fields. Returns first missing label or null.
   */
  function validateForm() {
    const ids = isGeneralMode() ? requiredIdsGeneral : requiredIds;
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      const val = (el.value || '').trim();
      if (!val) {
        const label = document.querySelector(`label[for="${id}"]`);
        return label ? label.textContent : id;
      }
    }
    return null;
  }

  /**
   * Generate and download: validate, then draw on canvas and trigger download.
   */
  function onGenerate(e) {
    e.preventDefault();
    generateAndDownload(getFormData());
  }

  /**
   * Wrap a single line of text to fit within maxWidth; returns array of lines.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} text
   * @param {number} maxWidth
   * @returns {string[]}
   */
  function wrapText(ctx, text, maxWidth) {
    if (!text) return [];
    var lines = [];
    var remaining = text;
    while (remaining.length > 0) {
      if (ctx.measureText(remaining).width <= maxWidth) {
        lines.push(remaining);
        break;
      }
      var low = 0;
      var high = remaining.length;
      while (high - low > 1) {
        var mid = (low + high) >> 1;
        if (ctx.measureText(remaining.slice(0, mid)).width <= maxWidth) low = mid;
        else high = mid;
      }
      var breakAt = low;
      var lastSpace = remaining.slice(0, low + 1).lastIndexOf(' ');
      if (lastSpace > 0) breakAt = lastSpace;
      lines.push(remaining.slice(0, breakAt).trim());
      remaining = remaining.slice(breakAt).trim();
    }
    return lines;
  }

  /**
   * Draw letterhead + text on canvas and trigger PNG download.
   */
  function generateAndDownload(data) {
    if (btnGenerate) {
      btnGenerate.disabled = true;
      btnGenerate.textContent = 'बन रहा है...';
    }

    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      try {
        var canvas = document.createElement('canvas');
        canvas.width = TEMPLATE_W;
        canvas.height = TEMPLATE_H;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, TEMPLATE_W, TEMPLATE_H);

        var FONT = '"Noto Sans Devanagari"';
        var contentStart = 760;
        var padLeft = 70;
        var padRight = 120;
        var centerX = 850;
        var colW = 450;
        var leftColX = 310;
        var gapBetweenCols = 110;
        var kanyaColX = 1010;
        var varColX = leftColX + 140;
        var lineHSm = 50;
        var y = contentStart + 24 + 20 + 16;

        // 1. ||श्री गणेशाय नमः|| – same font as gun milan (Noto Sans Devanagari 60px), regular weight only
        ctx.textAlign = 'center';
        ctx.fillStyle = '#9d0208';
        ctx.font = '60px ' + FONT;
        if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0';
        ctx.fillText('||श्री गणेशाय नमः||', centerX, y + 8);
        if (ctx.letterSpacing !== undefined) ctx.letterSpacing = 'normal';
        y += 85;

        // 2. Prati (left), Kramank (right) – same level
        ctx.fillStyle = '#1a1a1a';
        ctx.textAlign = 'left';
        ctx.font = '44px ' + FONT;
        ctx.fillText('प्रति - ' + (data.prati || ''), padLeft + 32, y + 32);
        ctx.textAlign = 'right';
        ctx.fillText('क्रमांक: ' + (data.kramank || ''), TEMPLATE_W - padRight, y + 8);
        y += 50;
        ctx.fillText('दिनांक: ' + (data.dinank_formatted || data.dinank || ''), TEMPLATE_W - padRight, y + 8);
        y += 70;

        if (!data.is_general) {
          ctx.textAlign = 'center';
          ctx.fillStyle = '#9d0208';
          ctx.font = 'bold 60px ' + FONT;
          ctx.fillText('॥ गुण मिलान ॥', centerX, y);
          y += 85;

          var labelColX = leftColX;

          ctx.textAlign = 'left';
          ctx.fillStyle = '#1a1a1a';
          ctx.font = 'bold 50px ' + FONT;
          ctx.fillText('वर', varColX, y);
          ctx.fillText('कन्या', kanyaColX, y);
          y += 58;

          var labels = ['नाम -', 'जन्म -', 'राशि -', 'नक्षत्र -', 'ल / न -', 'मंगल -'];
          var leftVals = [
            (data.var_name || ''),
            (data.var_dob || '') + '/' + (data.var_time || ''),
            (data.var_place || ''),
            (data.var_rashi || ''),
            (data.var_nakshatra || ''),
            (data.var_lagna_navamshesh || ''),
            (data.var_mangal || '')
          ];
          var rightVals = [
            (data.kanya_name || ''),
            (data.kanya_dob || '') + '/' + (data.kanya_time || ''),
            (data.kanya_place || ''),
            (data.kanya_rashi || ''),
            (data.kanya_nakshatra || ''),
            (data.kanya_lagna_navamshesh || ''),
            (data.kanya_mangal || '')
          ];
          ctx.font = 'bold 46px ' + FONT;
          ctx.fillText(labels[0], labelColX, y);
          ctx.font = '46px ' + FONT;
          ctx.fillText(leftVals[0], varColX, y);
          ctx.fillText(rightVals[0], kanyaColX, y);
          ctx.font = 'bold 46px ' + FONT;
          y += lineHSm;
          ctx.fillText(labels[1], labelColX, y);
          ctx.font = '46px ' + FONT;
          ctx.fillText(leftVals[1], varColX, y);
          ctx.fillText(rightVals[1], kanyaColX, y);
          y += lineHSm;
          ctx.fillText(leftVals[2], varColX, y);
          ctx.fillText(rightVals[2], kanyaColX, y);
          y += lineHSm;
          for (var i = 3; i < 7; i++) {
            ctx.font = 'bold 46px ' + FONT;
            ctx.fillText(labels[i - 1], labelColX, y);
            ctx.font = '46px ' + FONT;
            ctx.fillText(leftVals[i], varColX, y);
            ctx.fillText(rightVals[i], kanyaColX, y);
            y += lineHSm;
          }
          y += 56;

          ctx.textAlign = 'center';
          ctx.font = 'bold 48px ' + FONT;
          var gunLabel = 'गुण - ';
          var gunVal = data.kul_gun || '';
          var gunFull = gunLabel + gunVal;
          var gunFullW = ctx.measureText(gunFull).width;
          var gunBoxPad = 28;
          var gunBoxW = gunFullW + gunBoxPad * 2;
          var gunBoxH = 60;
          ctx.strokeStyle = '#1a1a1a';
          ctx.lineWidth = 2;
          ctx.strokeRect(centerX - gunBoxW / 2, y - gunBoxH + 14, gunBoxW, gunBoxH);
          ctx.fillText(gunFull, centerX, y);
          y += 88;

          ctx.textAlign = 'left';
          ctx.font = '44px ' + FONT;
          var vivaranRaw = (data.vivaran || '').split(/\r?\n/);
          var vivaranX = labelColX + 40;
          var vivaranMaxWidth = TEMPLATE_W - vivaranX - padRight - 40;
          for (var j = 0; j < vivaranRaw.length; j++) {
            var vivaranWrapped = vivaranRaw[j].length === 0 ? [''] : wrapText(ctx, vivaranRaw[j], vivaranMaxWidth);
            for (var v = 0; v < vivaranWrapped.length; v++) {
              ctx.fillText(vivaranWrapped[v], vivaranX, y);
              y += 54;
            }
          }
          y += 56;

          ctx.font = '48px ' + FONT;
          var nishLabel = 'निष्कर्ष:- ';
          var nishVal = data.nishkarsh || '';
          ctx.font = 'bold 48px ' + FONT;
          var nishValW = ctx.measureText(nishVal).width;
          var nishBoxPad = 28;
          var nishBoxW = nishValW + nishBoxPad * 2;
          var nishBoxH = 60;
          var nishBoxX = centerX - nishBoxW / 2;
          ctx.strokeRect(nishBoxX, y - 40, nishBoxW, nishBoxH);
          ctx.textAlign = 'right';
          ctx.font = '48px ' + FONT;
          ctx.fillText(nishLabel, nishBoxX - 10, y + 8);
          ctx.textAlign = 'center';
          ctx.font = 'bold 48px ' + FONT;
          ctx.fillText(nishVal, centerX, y + 8);
          y += 68;
        } else {
          // General: message as paragraph with top spacing; wrap long lines to fit width
          y += 48;
          ctx.textAlign = 'left';
          ctx.fillStyle = '#1a1a1a';
          ctx.font = '44px ' + FONT;
          var msgMaxWidth = TEMPLATE_W - (padLeft + 32) - padRight - 40;
          var msgX = padLeft + 32;
          var rawLines = (data.general_message || '').split(/\r?\n/);
          var msgLines = [];
          for (var r = 0; r < rawLines.length; r++) {
            if (rawLines[r].length === 0) {
              msgLines.push('');
            } else {
              var wrapped = wrapText(ctx, rawLines[r], msgMaxWidth);
              for (var w = 0; w < wrapped.length; w++) msgLines.push(wrapped[w]);
            }
          }
          for (var k = 0; k < msgLines.length; k++) {
            ctx.fillText(msgLines[k], msgX, y);
            y += 54;
          }
        }

        var link = document.createElement('a');
        link.download = (data.is_general ? 'general-' : 'gun-milan-') + Date.now() + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error(err);
        alert('चित्र बनाते समय त्रुटि। पृष्ठ रीफ़्रेश करके दोबारा कोशिश करें।');
      }
    };
    img.onerror = function () {
      alert('लेटरहेड चित्र लोड नहीं हो पाया। सर्वर चल रहा है और letterhead.png उसी फ़ोल्डर में है यह जाँचें।');
    };
    function restoreButton() {
      if (btnGenerate) {
        btnGenerate.disabled = false;
        btnGenerate.textContent = 'जनरेट करें';
      }
    }
    var origOnload = img.onload;
    img.onload = function () {
      try {
        origOnload.call(this);
      } finally {
        restoreButton();
      }
    };
    var origOnerror = img.onerror;
    img.onerror = function () {
      try {
        origOnerror.call(this);
      } finally {
        restoreButton();
      }
    };
    img.src = LETTERHEAD_URL;
  }

  function onReset() {
    form.reset();
  }

  function onResetVar() {
    var column = form.querySelector('.var-column');
    if (column) {
      column.querySelectorAll('input').forEach(function (input) { input.value = ''; });
    }
  }

  function onResetKanya() {
    var column = form.querySelector('.kanya-column');
    if (column) {
      column.querySelectorAll('input').forEach(function (input) { input.value = ''; });
    }
  }

  function updateFormMode() {
    if (!form) return;
    form.classList.remove('mode-gun-milan', 'mode-general');
    form.classList.add(isGeneralMode() ? 'mode-general' : 'mode-gun-milan');
  }

  function init() {
    form = getEl('gun-milan-form');
    btnGenerate = getEl('btn-generate');
    btnReset = getEl('btn-reset');

    if (!form) return;

    updateFormMode();
    var docTypeEl = getEl('doc-type');
    if (docTypeEl) docTypeEl.addEventListener('change', updateFormMode);

    form.addEventListener('submit', onGenerate);
    if (btnReset) btnReset.addEventListener('click', onReset);
    var btnResetVar = getEl('btn-reset-var');
    var btnResetKanya = getEl('btn-reset-kanya');
    if (btnResetVar) btnResetVar.addEventListener('click', onResetVar);
    if (btnResetKanya) btnResetKanya.addEventListener('click', onResetKanya);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
