window.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('videoPlayer');
  const status = document.getElementById('status');
  const slider = document.getElementById('slider');

  // default slider settings
  slider.min = -3;
  slider.max = 3;
  slider.step = 0.5;
  slider.value = 0;

  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('settingsModal');
  const inpMin = document.getElementById('settingMin');
  const inpMax = document.getElementById('settingMax');
  const inpStep = document.getElementById('settingStep');
  const inpValue = document.getElementById('settingValue');
  const inpC1 = document.getElementById('settingColor1');
  const inpC2 = document.getElementById('settingColor2');
  const inpC3 = document.getElementById('settingColor3');
  const btnSaveSettings = document.getElementById('settingsSave');
  const btnCancelSettings = document.getElementById('settingsCancel');
  const minLabel = document.querySelector('.min-label');
  const midLabel = document.querySelector('.mid-label');
  const maxLabel = document.querySelector('.max-label');

  let samples = [];
  let sampler;
  const rate = 30;
  const interval = 1000 / rate;

  function updateGradientLabels(min, mid, max) {
    const step = slider.step;
    const decimals = step.includes('.') ? step.split('.')[1].length : 0;
    minLabel.textContent = Number(min).toFixed(decimals);
    midLabel.textContent = Number(mid).toFixed(decimals);
    maxLabel.textContent = Number(max).toFixed(decimals);
  }

  function updateInstruction(layout) {
    const instr = document.getElementById('instruction');
    const arrows = layout === 'below' ? 'Left/Right' : 'Up/Down';
    instr.innerHTML =
      `Use <strong>mouse</strong> or <strong>Arrow ${arrows}</strong> keys to adjust the slider.`;
  }

  async function saveRatings() {
    const duration = video.duration;
    const binCount = Math.ceil(duration * 10);
    const bins = [];
    for (let i = 0; i < binCount; i++) {
      const start = i * 0.1;
      const vals = samples
        .filter(s => s.time >= start && s.time < start + 0.1)
        .map(s => s.value);
      const avg = vals.length
        ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3)
        : 'NA';
      bins.push({ time: start.toFixed(3), value: avg });
    }
    const path = await window.api.saveRatings(bins);
    status.textContent = path ? `Saved ratings → ${path}` : 'Save canceled.';
  }

  updateGradientLabels(slider.min, (Number(slider.min) + Number(slider.max)) / 2, slider.max);
  updateInstruction(document.body.classList.contains('layout-right') ? 'right' : 'below');

  window.api.onVideoLoaded((file) => {
    if (!file) return;
    video.src = file;
    samples = [];
    status.textContent = 'Video loaded. Press play to start sampling.';
    updateGradientLabels(slider.min, (Number(slider.min) + Number(slider.max)) / 2, slider.max);
  });

  window.api.onSettingsOpen(() => {
    inpMin.value = slider.min;
    inpMax.value = slider.max;
    inpStep.value = slider.step;
    inpValue.value = slider.value;
    inpC1.value = getComputedStyle(document.body).getPropertyValue('--color1').trim() || '#00ff00';
    inpC2.value = getComputedStyle(document.body).getPropertyValue('--color2').trim() || '#ffff00';
    inpC3.value = getComputedStyle(document.body).getPropertyValue('--color3').trim() || '#ff0000';
    overlay.style.display = 'block';
    modal.style.display = 'block';
  });

  btnSaveSettings.addEventListener('click', () => {
    slider.min  = inpMin.value;
    slider.max  = inpMax.value;
    slider.step = inpStep.value;
    slider.value = inpValue.value;
    document.body.style.setProperty('--color1', inpC1.value);
    document.body.style.setProperty('--color2', inpC2.value);
    document.body.style.setProperty('--color3', inpC3.value);
    overlay.style.display = 'none';
    modal.style.display = 'none';
    updateGradientLabels(slider.min, (Number(slider.min) + Number(slider.max)) / 2, slider.max);
  });

  btnCancelSettings.addEventListener('click', () => {
    overlay.style.display = 'none';
    modal.style.display = 'none';
  });

  window.api.onLayoutChange((layout) => {
    document.body.classList.toggle('layout-below', layout === 'below');
    document.body.classList.toggle('layout-right', layout === 'right');
    document.body.style.setProperty('--gradient-dir', layout === 'below' ? 'to right' : 'to top');
    updateGradientLabels(slider.min, (Number(slider.min) + Number(slider.max)) / 2, slider.max);
    updateInstruction(layout);
  });

  window.api.onSaveRequest(saveRatings);

  function logAdjustment() {
    samples.push({ time: video.currentTime, value: Number(slider.value) });
    window.api.sendEvent();
  }

  document.addEventListener('keydown', (e) => {
    let changed = false;
    const step = parseFloat(slider.step);
    const isVertical = document.body.classList.contains('layout-right');

    if (!isVertical) {
      if (e.code === 'ArrowRight') {
        slider.value = Math.min(+slider.value + step, +slider.max);
        changed = true;
      } else if (e.code === 'ArrowLeft') {
        slider.value = Math.max(+slider.value - step, +slider.min);
        changed = true;
      }
    } else {
      if (e.code === 'ArrowUp') {
        slider.value = Math.min(+slider.value + step, +slider.max);
        changed = true;
      } else if (e.code === 'ArrowDown') {
        slider.value = Math.max(+slider.value - step, +slider.min);
        changed = true;
      }
    }

    if (e.code.startsWith('Digit')) {
      const v = parseInt(e.code.slice(5));
      if (v >= +slider.min && v <= +slider.max) {
        slider.value = v;
        changed = true;
      }
    }

    if (changed) {
      e.preventDefault();
      logAdjustment();
    }
  });

  slider.addEventListener('input', logAdjustment);

  // only allow dragging the thumb; ignore clicks on track
  slider.addEventListener('mousedown', e => {
    const rect = slider.getBoundingClientRect();
    const percent = (+slider.value - +slider.min) / (+slider.max - +slider.min);
    if (document.body.classList.contains('layout-right')) {
      const thumbCenterY = rect.bottom - percent * rect.height;
      const thumbHeight = 20;
      if (Math.abs(e.clientY - thumbCenterY) > thumbHeight) e.preventDefault();
    } else {
      const thumbCenterX = rect.left + percent * rect.width;
      const thumbWidth = 20;
      if (Math.abs(e.clientX - thumbCenterX) > thumbWidth) e.preventDefault();
    }
  });

  video.addEventListener('play', () => {
    if (sampler) clearInterval(sampler);
    status.textContent = 'Sampling started.';
    slider.focus();
    sampler = setInterval(() => { if (!video.paused) logAdjustment(); }, interval);
  });

  video.addEventListener('pause', () => {
    if (sampler) clearInterval(sampler);
    status.textContent = 'Sampling paused.';
  });

  video.addEventListener('ended', () => {
    if (sampler) clearInterval(sampler);
    status.textContent = 'Video ended. Prompting save...';
    saveRatings();
  });
});
