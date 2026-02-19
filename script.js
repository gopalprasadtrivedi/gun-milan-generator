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
  var form, previewSection, previewWrapper, previewScaled, documentPreview, btnGenerate, btnDownload, btnReset, btnPrint;

  var TEMPLATE_W = 1700;
  var TEMPLATE_H = 2500;

  function getEl(id) {
    return document.getElementById(id);
  }

  /** Scale preview so entire 1700x2500 fits in viewport without scrolling */
  function fitPreviewInViewport() {
    if (!previewWrapper || !previewScaled || !documentPreview) return;
    var w = previewWrapper.clientWidth - 32;
    var h = Math.min(previewWrapper.clientHeight - 32, Math.floor(window.innerHeight * 0.85) - 32);
    if (w < 100 || h < 100) return;
    var scale = Math.min(w / TEMPLATE_W, h / TEMPLATE_H, 1);
    previewScaled.style.width = (TEMPLATE_W * scale) + 'px';
    previewScaled.style.height = (TEMPLATE_H * scale) + 'px';
    documentPreview.style.transform = 'scale(' + scale + ')';
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

  /**
   * Get form data by reading each field (works reliably with file:// and local server)
   */
  function getFormData() {
    const data = {};
    const names = [
      'kramank', 'dinank',
      'var_name', 'var_dob', 'var_time', 'var_place', 'var_rashi', 'var_nakshatra', 'var_mangal',
      'kanya_name', 'kanya_dob', 'kanya_time', 'kanya_place', 'kanya_rashi', 'kanya_nakshatra', 'kanya_mangal',
      'kul_gun', 'vivaran', 'nishkarsh'
    ];
    names.forEach(function (name) {
      const input = form.querySelector('[name="' + name + '"]');
      data[name] = input ? (input.value || '').trim() : '';
    });
    data.dinank_formatted = formatDateHindi(getEl('dinank') && getEl('dinank').value);
    return data;
  }

  /**
   * Required field IDs for validation
   */
  const requiredIds = [
    'var-name', 'var-dob', 'var-time', 'var-place', 'var-rashi', 'var-nakshatra', 'var-mangal',
    'kanya-name', 'kanya-dob', 'kanya-time', 'kanya-place', 'kanya-rashi', 'kanya-nakshatra', 'kanya-mangal',
    'kul-gun', 'vivaran', 'nishkarsh'
  ];

  /**
   * Validate required fields. Returns first missing label or null.
   */
  function validateForm() {
    for (const id of requiredIds) {
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
   * Build the generated document HTML and set letterhead background
   */
  function buildPreview(data) {
    const dinankDisplay = data.dinank_formatted || data.dinank || '';

    const inner = document.createElement('div');
    inner.className = 'doc-inner';

    // Top right: क्रमांक, दिनांक
    const topRight = document.createElement('div');
    topRight.className = 'doc-top-right';
    topRight.innerHTML = `क्रमांक: ${escapeHtml(data.kramank || '')}<br>दिनांक: ${escapeHtml(dinankDisplay)}`;
    inner.appendChild(topRight);

    // Center heading
    const heading = document.createElement('p');
    heading.className = 'doc-heading';
    heading.textContent = '॥ गुण मिलान ॥';
    inner.appendChild(heading);

    // वर और कन्या: labels once on left; जन्म = two lines (date/time, then place)
    const varkanya = document.createElement('div');
    varkanya.className = 'doc-varkanya';
    const varJnamLine1 = (data.var_dob || '') + '/' + (data.var_time || '');
    const varJnamLine2 = data.var_place || '';
    const kanyaJnamLine1 = (data.kanya_dob || '') + '/' + (data.kanya_time || '');
    const kanyaJnamLine2 = data.kanya_place || '';
    varkanya.innerHTML = `
      <div class="doc-varkanya-head">
        <span class="doc-label-col"></span>
        <span class="doc-var-col">वर</span>
        <span class="doc-kanya-col">कन्या</span>
      </div>
      <div class="doc-varkanya-row"><strong class="doc-label-col">नाम -</strong><span class="doc-var-col">${escapeHtml(data.var_name || '')}</span><span class="doc-kanya-col">${escapeHtml(data.kanya_name || '')}</span></div>
      <div class="doc-varkanya-row doc-janm-row">
        <strong class="doc-label-col">जन्म -</strong>
        <span class="doc-var-col"><span class="doc-janm-line1">${escapeHtml(varJnamLine1)}</span><span class="doc-janm-line2">${escapeHtml(varJnamLine2)}</span></span>
        <span class="doc-kanya-col"><span class="doc-janm-line1">${escapeHtml(kanyaJnamLine1)}</span><span class="doc-janm-line2">${escapeHtml(kanyaJnamLine2)}</span></span>
      </div>
      <div class="doc-varkanya-row"><strong class="doc-label-col">राशि -</strong><span class="doc-var-col">${escapeHtml(data.var_rashi || '')}</span><span class="doc-kanya-col">${escapeHtml(data.kanya_rashi || '')}</span></div>
      <div class="doc-varkanya-row"><strong class="doc-label-col">नक्षत्र -</strong><span class="doc-var-col">${escapeHtml(data.var_nakshatra || '')}</span><span class="doc-kanya-col">${escapeHtml(data.kanya_nakshatra || '')}</span></div>
      <div class="doc-varkanya-row"><strong class="doc-label-col">मंगल -</strong><span class="doc-var-col">${escapeHtml(data.var_mangal || '')}</span><span class="doc-kanya-col">${escapeHtml(data.kanya_mangal || '')}</span></div>
    `;
    inner.appendChild(varkanya);

    // कुल गुण (bold value, box fits text)
    const kulGun = document.createElement('div');
    kulGun.className = 'doc-kul-gun';
    kulGun.innerHTML = `गुण - <span class="value">${escapeHtml(data.kul_gun || '')}</span>`;
    inner.appendChild(kulGun);

    // विवरण
    const vivaran = document.createElement('div');
    vivaran.className = 'doc-vivaran';
    vivaran.textContent = data.vivaran || '';
    inner.appendChild(vivaran);

    // निष्कर्ष (bold value in box that fits)
    const nishkarsh = document.createElement('div');
    nishkarsh.className = 'doc-nishkarsh';
    nishkarsh.innerHTML = `निष्कर्ष:- <span class="value">${escapeHtml(data.nishkarsh || '')}</span>`;
    inner.appendChild(nishkarsh);

    documentPreview.innerHTML = '';
    documentPreview.appendChild(inner);

    documentPreview.style.backgroundImage = `url(${LETTERHEAD_URL})`;
    documentPreview.style.backgroundColor = 'transparent';
    inner.style.background = 'transparent';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Generate document: validate, build preview, show section, enable print
   */
  function onGenerate(e) {
    e.preventDefault();

    const missing = validateForm();
    if (missing) {
      alert('कृपया यह फ़ील्ड भरें: ' + missing);
      return;
    }

    const data = getFormData();
    buildPreview(data);
    previewSection.hidden = false;
    documentPreview.style.transform = '';
    fitPreviewInViewport();
    previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    btnPrint.disabled = false;
  }

  /**
   * Download: draw letterhead image then burn text on it via Canvas API (same as preview).
   */
  function onDownload() {
    var data = getFormData();
    btnDownload.disabled = true;
    btnDownload.textContent = 'बन रहा है...';

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
        var padLeft = 100;
        var padRight = 120;
        var centerX = 850;
        var blockW = 1000;
        var gap = 100;
        var colW = (blockW - gap) / 2;
        var leftColX = padLeft + (TEMPLATE_W - padLeft - padRight - blockW) / 2;
        var rightColX = leftColX + colW + gap;
        var lineHSm = 50;
        var y = contentStart + 24;

        ctx.fillStyle = '#1a1a1a';
        ctx.textAlign = 'right';
        ctx.font = '44px ' + FONT;
        ctx.fillText('क्रमांक: ' + (data.kramank || ''), TEMPLATE_W - padRight, y);
        y += 50;
        ctx.fillText('दिनांक: ' + (data.dinank_formatted || data.dinank || ''), TEMPLATE_W - padRight, y);
        y += 70;

        ctx.textAlign = 'center';
        ctx.fillStyle = '#9d0208';
        ctx.font = 'bold 60px ' + FONT;
        ctx.fillText('॥ गुण मिलान ॥', centerX, y);
        y += 85;

        var labelColX = leftColX;
        var varColX = leftColX + 140;
        var gapBetweenCols = 80;
        var kanyaColX = varColX + colW + gapBetweenCols;

        ctx.textAlign = 'left';
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 50px ' + FONT;
        ctx.fillText('वर', varColX, y);
        ctx.fillText('कन्या', kanyaColX, y);
        y += 58;

        var labels = ['नाम -', 'जन्म -', 'राशि -', 'नक्षत्र -', 'मंगल -'];
        var leftVals = [
          (data.var_name || ''),
          (data.var_dob || '') + '/' + (data.var_time || ''),
          (data.var_place || ''),
          (data.var_rashi || ''),
          (data.var_nakshatra || ''),
          (data.var_mangal || '')
        ];
        var rightVals = [
          (data.kanya_name || ''),
          (data.kanya_dob || '') + '/' + (data.kanya_time || ''),
          (data.kanya_place || ''),
          (data.kanya_rashi || ''),
          (data.kanya_nakshatra || ''),
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
        for (var i = 3; i < 6; i++) {
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
        var vivaranLines = (data.vivaran || '').split(/\r?\n/);
        var vivaranX = labelColX + 40;
        for (var j = 0; j < vivaranLines.length; j++) {
          ctx.fillText(vivaranLines[j], vivaranX, y);
          y += 54;
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

        var link = document.createElement('a');
        link.download = 'gun-milan-' + Date.now() + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error(err);
        alert('चित्र बनाते समय त्रुटि। पृष्ठ रीफ़्रेश करके दोबारा कोशिश करें।');
      }
      btnDownload.disabled = false;
      btnDownload.textContent = 'डाउनलोड करें';
    };
    img.onerror = function () {
      alert('लेटरहेड चित्र लोड नहीं हो पाया। सर्वर चल रहा है और letterhead.png उसी फ़ोल्डर में है यह जाँचें।');
      btnDownload.disabled = false;
      btnDownload.textContent = 'डाउनलोड करें';
    };
    img.src = LETTERHEAD_URL;
  }

  /**
   * Print the preview (hides form/buttons via CSS)
   */
  function onPrint() {
    window.print();
  }

  /**
   * Reset form and hide preview
   */
  function onReset() {
    form.reset();
    previewSection.hidden = true;
    documentPreview.innerHTML = '';
    documentPreview.style.backgroundImage = '';
    btnPrint.disabled = true;
  }

  function init() {
    form = getEl('gun-milan-form');
    previewSection = getEl('preview-section');
    previewWrapper = getEl('preview-wrapper');
    previewScaled = getEl('preview-scaled');
    documentPreview = getEl('document-preview');
    btnGenerate = getEl('btn-generate');
    btnDownload = getEl('btn-download');
    btnReset = getEl('btn-reset');
    btnPrint = getEl('btn-print');

    if (!form || !documentPreview) return;

    form.addEventListener('submit', onGenerate);
    if (btnDownload) btnDownload.addEventListener('click', onDownload);
    if (btnPrint) btnPrint.addEventListener('click', onPrint);
    if (btnReset) btnReset.addEventListener('click', onReset);
    window.addEventListener('resize', function () {
      if (previewSection && !previewSection.hidden) fitPreviewInViewport();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
