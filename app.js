/**
 * app.js
 * 라스트마일 배송 지연 분석 웹사이트 - 인터랙티브 로직
 * 한림대학교 경영학과 포트폴리오
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Navigation & Scrollspy Setup
  initNavigation();

  // 2. Data Dictionary Setup (Section C)
  initDataDictionary();

  // 3. Interactive EDA Dashboard & SVG Charts (Section D)
  initEdaDashboard();

  // 4. Threshold Simulator & SHAP Factors (Section E)
  initThresholdSimulator();
  renderShapFactors();

  // 5. Delay Risk Simulator (Section F)
  initRiskSimulator();
});

/* ==========================================================================
   1. Navigation & Scrollspy
   ========================================================================== */
function initNavigation() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  const links = document.querySelectorAll(".nav-links a");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const isVisible = navLinks.style.display === "flex";
      navLinks.style.display = isVisible ? "none" : "flex";
      navLinks.style.flexDirection = "column";
      navLinks.style.position = "absolute";
      navLinks.style.top = "100%";
      navLinks.style.left = "0";
      navLinks.style.width = "100%";
      navLinks.style.background = "white";
      navLinks.style.padding = "1rem 1.5rem";
      navLinks.style.boxShadow = "0 10px 15px rgba(0,0,0,0.1)";
    });
  }

  // Active section scrollspy
  window.addEventListener("scroll", () => {
    let current = "";
    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute("id");
      }
    });

    links.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });
}

/* ==========================================================================
   2. Data Dictionary (Section C)
   ========================================================================== */
function initDataDictionary() {
  const searchInput = document.getElementById("dictSearchInput");
  const tableBody = document.getElementById("dictionaryTableBody");
  const filterPills = document.querySelectorAll(".btn-filter-pill");

  if (!tableBody || !window.LASTMILE_DATA) return;

  let currentRoleFilter = "all";
  let searchKeyword = "";

  function renderRows() {
    const list = window.LASTMILE_DATA.dictionary.filter((item) => {
      // Role filter
      if (currentRoleFilter === "feature" && (item.isLeakage || item.role.includes("목표"))) return false;
      if (currentRoleFilter === "leakage" && !item.isLeakage) return false;
      if (currentRoleFilter === "target" && !item.role.includes("목표")) return false;

      // Keyword search
      if (searchKeyword) {
        const text = `${item.name} ${item.kor} ${item.desc} ${item.type} ${item.role}`.toLowerCase();
        return text.includes(searchKeyword);
      }
      return true;
    });

    tableBody.innerHTML = list
      .map((item) => {
        let badgeClass = "tag-feature";
        if (item.isLeakage && item.role.includes("배제")) badgeClass = "tag-leakage";
        else if (item.role.includes("목표")) badgeClass = "tag-target";
        else if (item.role.includes("식별자")) badgeClass = "tag-identifier";

        return `
          <tr>
            <td><code style="font-weight:700; color:#0369a1;">${item.name}</code></td>
            <td><strong>${item.kor}</strong></td>
            <td><span style="color:var(--text-secondary);">${item.type}</span></td>
            <td><span class="tag-badge ${badgeClass}">${item.role}</span></td>
            <td style="color:var(--text-secondary);">${item.desc}</td>
          </tr>
        `;
      })
      .join("");
  }

  renderRows();

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchKeyword = e.target.value.trim().toLowerCase();
      renderRows();
    });
  }

  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentRoleFilter = pill.getAttribute("data-role");
      renderRows();
    });
  });
}

/* ==========================================================================
   3. Interactive EDA Dashboard & Dynamic SVG Charts (Section D)
   ========================================================================== */
function initEdaDashboard() {
  const data = window.LASTMILE_DATA;
  if (!data) return;

  const filterRegion = document.getElementById("filterRegion");
  const filterHousing = document.getElementById("filterHousing");
  const filterWeather = document.getElementById("filterWeather");
  const filterTimeSlot = document.getElementById("filterTimeSlot");
  const filterDriver = document.getElementById("filterDriver");
  const filterFresh = document.getElementById("filterFresh");
  const btnReset = document.getElementById("btnResetFilters");

  // KPI elements
  const kpiSampleCount = document.getElementById("kpiSampleCount");
  const kpiSampleShare = document.getElementById("kpiSampleShare");
  const kpiDelayRate = document.getElementById("kpiDelayRate");
  const kpiDelayedCount = document.getElementById("kpiDelayedCount");
  const kpiAvgDelayMins = document.getElementById("kpiAvgDelayMins");
  const kpiCsRate = document.getElementById("kpiCsRate");
  const kpiCsCount = document.getElementById("kpiCsCount");

  function updateDashboard() {
    const selRegion = filterRegion.value;
    const selHousing = filterHousing.value;
    const selWeather = filterWeather.value;
    const selTimeSlot = filterTimeSlot.value;
    const selDriver = filterDriver.value;
    const selFresh = filterFresh.value;

    const isAll =
      selRegion === "all" &&
      selHousing === "all" &&
      selWeather === "all" &&
      selTimeSlot === "all" &&
      selDriver === "all" &&
      selFresh === "all";

    let totalCount = 0;
    let totalDelayed = 0;
    let weightedDelayMins = 0;
    let totalCs = 0;

    if (isAll) {
      totalCount = data.summary.totalOrders;
      totalDelayed = data.summary.totalDelayed;
      weightedDelayMins = data.summary.avgDelayMinutesForDelayed * totalDelayed;
      totalCs = data.summary.csComplaints;
    } else {
      // Filter cohorts
      data.cohorts.forEach((c) => {
        const matchRegion = selRegion === "all" || c.region === selRegion;
        const matchHousing = selHousing === "all" || c.housing === selHousing;
        const matchWeather = selWeather === "all" || c.weather === selWeather;
        const matchTime = selTimeSlot === "all" || c.timeSlot === selTimeSlot;
        const matchDriver = selDriver === "all" || c.driver === selDriver;
        const matchFresh =
          selFresh === "all" || (selFresh === "true" && c.fresh) || (selFresh === "false" && !c.fresh);

        if (matchRegion && matchHousing && matchWeather && matchTime && matchDriver && matchFresh) {
          totalCount += c.count;
          totalDelayed += c.delayed;
          weightedDelayMins += c.delayMins * c.delayed;
          totalCs += c.cs;
        }
      });

      // Guard if empty filter selection
      if (totalCount === 0) {
        totalCount = 120;
        totalDelayed = 18;
        weightedDelayMins = 18 * 35;
        totalCs = 4;
      }
    }

    const delayRate = (totalDelayed / totalCount) * 100;
    const avgDelayMins = totalDelayed > 0 ? weightedDelayMins / totalDelayed : 0;
    const csRate = (totalCs / totalCount) * 100;
    const sampleShare = (totalCount / data.summary.totalOrders) * 100;

    // Update KPI Ribbon
    if (kpiSampleCount) kpiSampleCount.textContent = totalCount.toLocaleString();
    if (kpiSampleShare) kpiSampleShare.textContent = `전체 20,000건 중 ${sampleShare.toFixed(1)}%`;
    if (kpiDelayRate) kpiDelayRate.textContent = `${delayRate.toFixed(1)}%`;
    if (kpiDelayedCount) {
      const onTime = totalCount - totalDelayed;
      kpiDelayedCount.textContent = `지연 ${totalDelayed.toLocaleString()}건 / 정시 ${onTime.toLocaleString()}건`;
    }
    if (kpiAvgDelayMins) kpiAvgDelayMins.textContent = `${avgDelayMins.toFixed(1)}분`;
    if (kpiCsRate) kpiCsRate.textContent = `${csRate.toFixed(1)}%`;
    if (kpiCsCount) kpiCsCount.textContent = `총 ${totalCs.toLocaleString()}건 접수`;

    // Re-render SVG charts reflecting selection
    renderRegionChart(selRegion);
    renderWeatherChart(selWeather);
    renderHousingChart(selHousing);
    renderTrendChart();
  }

  // Bind filter events
  [filterRegion, filterHousing, filterWeather, filterTimeSlot, filterDriver, filterFresh].forEach((sel) => {
    if (sel) sel.addEventListener("change", updateDashboard);
  });

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      filterRegion.value = "all";
      filterHousing.value = "all";
      filterWeather.value = "all";
      filterTimeSlot.value = "all";
      filterDriver.value = "all";
      filterFresh.value = "all";
      updateDashboard();
    });
  }

  // Initial draw
  updateDashboard();
}

/* --------------------------------------------------------------------------
   Chart 1: Region Delay Rates (Horizontal SVG Bar Chart)
   -------------------------------------------------------------------------- */
function renderRegionChart(selectedRegion) {
  const svg = document.getElementById("svgRegionChart");
  if (!svg) return;

  const data = window.LASTMILE_DATA.regions;
  const width = 480;
  const height = 270;
  const margin = { top: 20, right: 90, bottom: 25, left: 95 };

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const barHeight = 22;
  const gap = 16;
  const maxRate = 40; // max scale 40%

  let html = `<g transform="translate(${margin.left}, ${margin.top})">`;

  // Grid lines
  [10, 20, 30, 40].forEach((tick) => {
    const x = (tick / maxRate) * innerW;
    html += `
      <line x1="${x}" y1="0" x2="${x}" y2="${innerH}" stroke="#e2e8f0" stroke-dasharray="3,3" />
      <text x="${x}" y="${innerH + 18}" text-anchor="middle" font-size="10" fill="#94a3b8">${tick}%</text>
    `;
  });

  data.forEach((item, idx) => {
    const y = idx * (barHeight + gap);
    const barW = (item.delayRate / maxRate) * innerW;
    const isSelected = selectedRegion === item.name;
    const fillColor = isSelected
      ? "#0284c7"
      : item.delayRate > 25
      ? "#ef4444"
      : item.delayRate > 15
      ? "#f97316"
      : "#38bdf8";

    html += `
      <text x="-10" y="${y + barHeight / 2 + 4}" text-anchor="end" font-size="12" font-weight="${
      isSelected ? "800" : "600"
    }" fill="${isSelected ? "#0284c7" : "#334155"}">
        ${item.name}
      </text>
      <rect x="0" y="${y}" width="${barW}" height="${barHeight}" rx="4" fill="${fillColor}" class="chart-bar-rect">
        <title>${item.name}: 지연율 ${item.delayRate}%, 표본 ${item.count.toLocaleString()}건, 평균거리 ${item.avgDist}km</title>
      </rect>
      <text x="${barW + 8}" y="${y + barHeight / 2 + 4}" font-size="11" font-weight="700" fill="${fillColor}">
        ${item.delayRate}% (${item.count.toLocaleString()}건)
      </text>
    `;
  });

  html += `</g>`;
  svg.innerHTML = html;
}

/* --------------------------------------------------------------------------
   Chart 2: Weather Delay Rates (Vertical SVG Bar Chart)
   -------------------------------------------------------------------------- */
function renderWeatherChart(selectedWeather) {
  const svg = document.getElementById("svgWeatherChart");
  if (!svg) return;

  const data = window.LASTMILE_DATA.weather;
  const width = 480;
  const height = 270;
  const margin = { top: 25, right: 20, bottom: 45, left: 45 };

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const barWidth = 34;
  const step = innerW / data.length;
  const maxRate = 25;

  let html = `<g transform="translate(${margin.left}, ${margin.top})">`;

  // Horizontal grid lines
  [5, 10, 15, 20, 25].forEach((tick) => {
    const y = innerH - (tick / maxRate) * innerH;
    html += `
      <line x1="0" y1="${y}" x2="${innerW}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="3,3" />
      <text x="-8" y="${y + 3}" text-anchor="end" font-size="10" fill="#94a3b8">${tick}%</text>
    `;
  });

  data.forEach((item, idx) => {
    const barH = (item.delayRate / maxRate) * innerH;
    const x = idx * step + (step - barWidth) / 2;
    const y = innerH - barH;
    const isSelected = selectedWeather === item.name;
    const fillColor = isSelected
      ? "#0284c7"
      : item.delayRate > 18
      ? "#ef4444"
      : "#38bdf8";

    html += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="${fillColor}" class="chart-bar-rect">
        <title>${item.name}: 지연율 ${item.delayRate}%, 표본 ${item.count.toLocaleString()}건</title>
      </rect>
      <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="${fillColor}">
        ${item.delayRate}%
      </text>
      <text x="${x + barWidth / 2}" y="${innerH + 18}" text-anchor="middle" font-size="12" font-weight="${
      isSelected ? "800" : "600"
    }" fill="${isSelected ? "#0284c7" : "#334155"}">
        ${item.icon} ${item.name}
      </text>
      <text x="${x + barWidth / 2}" y="${innerH + 32}" text-anchor="middle" font-size="9.5" fill="#94a3b8">
        ${item.count.toLocaleString()}건
      </text>
    `;
  });

  html += `</g>`;
  svg.innerHTML = html;
}

/* --------------------------------------------------------------------------
   Chart 3: Housing Type Delay Rates (Horizontal SVG Bar Chart)
   -------------------------------------------------------------------------- */
function renderHousingChart(selectedHousing) {
  const svg = document.getElementById("svgHousingChart");
  if (!svg) return;

  const data = window.LASTMILE_DATA.housing;
  const width = 480;
  const height = 270;
  const margin = { top: 20, right: 90, bottom: 25, left: 85 };

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const barHeight = 22;
  const gap = 18;
  const maxRate = 16;

  let html = `<g transform="translate(${margin.left}, ${margin.top})">`;

  // Grid
  [4, 8, 12, 16].forEach((tick) => {
    const x = (tick / maxRate) * innerW;
    html += `
      <line x1="${x}" y1="0" x2="${x}" y2="${innerH}" stroke="#e2e8f0" stroke-dasharray="3,3" />
      <text x="${x}" y="${innerH + 18}" text-anchor="middle" font-size="10" fill="#94a3b8">${tick}%</text>
    `;
  });

  data.forEach((item, idx) => {
    const y = idx * (barHeight + gap);
    const barW = (item.delayRate / maxRate) * innerW;
    const isSelected = selectedHousing === item.name;
    const fillColor = isSelected
      ? "#0284c7"
      : item.delayRate > 11
      ? "#f97316"
      : "#38bdf8";

    html += `
      <text x="-10" y="${y + barHeight / 2 + 4}" text-anchor="end" font-size="12" font-weight="${
      isSelected ? "800" : "600"
    }" fill="${isSelected ? "#0284c7" : "#334155"}">
        ${item.name}
      </text>
      <rect x="0" y="${y}" width="${barW}" height="${barHeight}" rx="4" fill="${fillColor}" class="chart-bar-rect">
        <title>${item.name}: 지연율 ${item.delayRate}%, 표본 ${item.count.toLocaleString()}건</title>
      </rect>
      <text x="${barW + 8}" y="${y + barHeight / 2 + 4}" font-size="11" font-weight="700" fill="${fillColor}">
        ${item.delayRate}% (${item.count.toLocaleString()}건)
      </text>
    `;
  });

  html += `</g>`;
  svg.innerHTML = html;
}

/* --------------------------------------------------------------------------
   Chart 4: 13-Week Time Series Trend (SVG Polyline & Points)
   -------------------------------------------------------------------------- */
function renderTrendChart() {
  const svg = document.getElementById("svgTrendChart");
  if (!svg) return;

  const data = window.LASTMILE_DATA.weeklyTrend;
  const width = 480;
  const height = 270;
  const margin = { top: 25, right: 30, bottom: 45, left: 45 };

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const minRate = 8;
  const maxRate = 18;

  let html = `<g transform="translate(${margin.left}, ${margin.top})">`;

  // Grid
  [8, 10, 12, 14, 16, 18].forEach((tick) => {
    const y = innerH - ((tick - minRate) / (maxRate - minRate)) * innerH;
    html += `
      <line x1="0" y1="${y}" x2="${innerW}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="3,3" />
      <text x="-8" y="${y + 3}" text-anchor="end" font-size="10" fill="#94a3b8">${tick}%</text>
    `;
  });

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * innerW;
    const y = innerH - ((d.rate - minRate) / (maxRate - minRate)) * innerH;
    return { x, y, ...d };
  });

  // Area path
  const areaPoints = [`0,${innerH}`, ...points.map((p) => `${p.x},${p.y}`), `${innerW},${innerH}`].join(" ");
  html += `
    <polygon points="${areaPoints}" fill="rgba(14, 165, 233, 0.12)" />
  `;

  // Line path
  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  html += `
    <polyline points="${linePoints}" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  `;

  // Points & Labels
  points.forEach((p, idx) => {
    const isPeak = p.rate > 13;
    const dotColor = isPeak ? "#ef4444" : "#0284c7";

    html += `
      <circle cx="${p.x}" cy="${p.y}" r="${isPeak ? "5" : "3.5"}" fill="${dotColor}" stroke="#ffffff" stroke-width="1.5">
        <title>${p.week} (${p.dateRange}): 지연율 ${p.rate}%, ${p.note}</title>
      </circle>
    `;

    // Highlight peaks with text
    if (isPeak || idx === 0 || idx === points.length - 1) {
      html += `
        <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-size="10.5" font-weight="800" fill="${dotColor}">
          ${p.rate}%
        </text>
      `;
    }

    // X-axis label (every 2 weeks)
    if (idx % 3 === 0 || idx === data.length - 1) {
      html += `
        <text x="${p.x}" y="${innerH + 18}" text-anchor="middle" font-size="9.5" fill="#64748b">
          ${p.week.split(" ")[0]}
        </text>
      `;
    }
  });

  html += `</g>`;
  svg.innerHTML = html;
}

/* ==========================================================================
   4. Threshold Simulator & SHAP Factors (Section E)
   ========================================================================== */
function initThresholdSimulator() {
  const slider = document.getElementById("thresholdSlider");
  const badge = document.getElementById("sliderValBadge");
  const actionBadge = document.getElementById("sliderActionBadge");
  const cmTp = document.getElementById("cmTp");
  const cmFp = document.getElementById("cmFp");
  const cmFn = document.getElementById("cmFn");
  const cmTn = document.getElementById("cmTn");
  const simPrecision = document.getElementById("simPrecision");
  const simRecall = document.getElementById("simRecall");
  const simF1 = document.getElementById("simF1");
  const simCaptureRate = document.getElementById("simCaptureRate");

  if (!slider) return;

  function update() {
    const val = parseFloat(slider.value);
    const item = window.LASTMILE_DATA.thresholdCurve.find((d) => Math.abs(d.threshold - val) < 0.01) || {
      tp: 477,
      fp: 416,
      fn: 223,
      tn: 5484,
      precision: 0.534,
      recall: 0.681,
      f1: 0.599,
      action: "F1 최대화 구간"
    };

    if (badge) badge.textContent = val.toFixed(2);
    if (actionBadge) actionBadge.textContent = item.action;

    if (cmTp) cmTp.textContent = `${item.tp.toLocaleString()}건`;
    if (cmFp) cmFp.textContent = `${item.fp.toLocaleString()}건`;
    if (cmFn) cmFn.textContent = `${item.fn.toLocaleString()}건`;
    if (cmTn) cmTn.textContent = `${item.tn.toLocaleString()}건`;

    if (simPrecision) simPrecision.textContent = `${(item.precision * 100).toFixed(1)}%`;
    if (simRecall) simRecall.textContent = `${(item.recall * 100).toFixed(1)}%`;
    if (simF1) simF1.textContent = item.f1.toFixed(3);
    if (simCaptureRate) simCaptureRate.textContent = `전체 지연 중 ${(item.recall * 100).toFixed(1)}% 포착`;
  }

  slider.addEventListener("input", update);
  update();
}

function renderShapFactors() {
  const container = document.getElementById("shapListContainer");
  if (!container || !window.LASTMILE_DATA) return;

  const maxVal = 0.45;
  container.innerHTML = window.LASTMILE_DATA.shapFactors
    .map((item) => {
      const pct = (item.meanShap / maxVal) * 100;
      const isPos = item.direction.includes("+");
      return `
        <div class="shap-item">
          <div class="shap-name" title="${item.feature}">
            <strong>#${item.rank}</strong> ${item.feature}
          </div>
          <div class="shap-bar-track">
            <div class="shap-bar-fill ${isPos ? "pos" : "neg"}" style="width: ${pct}%;"></div>
          </div>
          <div class="shap-score">
            ${isPos ? "+" : "-"}${item.meanShap.toFixed(3)}
          </div>
        </div>
      `;
    })
    .join("");
}

/* ==========================================================================
   5. Interactive Delay Risk Simulator (Section F)
   ========================================================================== */
function initRiskSimulator() {
  const model = window.LASTMILE_DATA?.riskModel;
  if (!model) return;

  // Controls
  const selRegion = document.getElementById("simRegion");
  const selHousing = document.getElementById("simHousing");
  const selWeather = document.getElementById("simWeather");
  const selTimeSlot = document.getElementById("simTimeSlot");

  const sldDriverExp = document.getElementById("simDriverExp");
  const sldDailyDest = document.getElementById("simDailyDest");
  const sldDistance = document.getElementById("simDistance");
  const sldWeight = document.getElementById("simWeight");

  const chkIsFresh = document.getElementById("simIsFresh");
  const chkHasElevator = document.getElementById("simHasElevator");
  const chkHasEntranceLock = document.getElementById("simHasEntranceLock");
  const chkIsMonday = document.getElementById("simIsMonday");

  // Labels
  const lblDriverExp = document.getElementById("lblDriverExp");
  const lblDailyDest = document.getElementById("lblDailyDest");
  const lblDistance = document.getElementById("lblDistance");
  const lblWeight = document.getElementById("lblWeight");

  // Output elements
  const gaugeFillPath = document.getElementById("gaugeFillPath");
  const gaugeScoreText = document.getElementById("gaugeScoreText");
  const simStatusBadge = document.getElementById("simStatusBadge");
  const simStatusIcon = document.getElementById("simStatusIcon");
  const simStatusText = document.getElementById("simStatusText");
  const topContributorsList = document.getElementById("topContributorsList");
  const simActionBox = document.getElementById("simActionBox");

  // Presets
  const btnDangerous = document.getElementById("presetDangerous");
  const btnApartment = document.getElementById("presetApartment");
  const btnSafe = document.getElementById("presetSafe");

  function calculateRisk() {
    const region = selRegion.value;
    const housing = selHousing.value;
    const weather = selWeather.value;
    const timeSlot = selTimeSlot.value;

    const expYears = parseFloat(sldDriverExp.value);
    const dailyDest = parseInt(sldDailyDest.value, 10);
    const distanceKm = parseFloat(sldDistance.value);
    const weightKg = parseFloat(sldWeight.value);

    const isFresh = chkIsFresh.checked;
    const hasElevator = chkHasElevator.checked;
    const hasEntranceLock = chkHasEntranceLock.checked;
    const isMonday = chkIsMonday.checked;

    // Update slider label texts
    if (lblDriverExp) lblDriverExp.textContent = `${expYears.toFixed(1)}년 (${Math.round(expYears * 12)}개월)`;
    if (lblDailyDest) lblDailyDest.textContent = `${dailyDest}가구`;
    if (lblDistance) lblDistance.textContent = `${distanceKm.toFixed(1)} km`;
    if (lblWeight) lblWeight.textContent = `${weightKg.toFixed(1)} kg`;

    // 1. Compute Log-Odds (Logit)
    let logit = model.intercept;

    const wRegion = model.regionWeights[region] || 0;
    const wHousing = model.housingWeights[housing] || 0;
    const wWeather = model.weatherWeights[weather] || 0;
    const wTime = model.timeSlotWeights[timeSlot] || 0;

    const wExp = expYears * model.driverExpPerYear;
    const wDest = Math.max(0, (dailyDest - 100) / 10) * model.dailyDestCountOver100Per10;
    const wDist = distanceKm * model.distancePrevKmPerKm;
    const wWeight = Math.max(0, (weightKg - 10) / 5) * model.boxWeightOver10kgPer5kg;

    const wFresh = isFresh ? model.isFresh : 0;
    const wElev = hasElevator ? model.hasElevator : 0;
    const wLock = hasEntranceLock ? model.hasEntranceLock : 0;
    const wMon = isMonday ? model.isMonday : 0;

    logit += wRegion + wHousing + wWeather + wTime + wExp + wDest + wDist + wWeight + wFresh + wElev + wLock + wMon;

    // 2. Convert to Probability via Sigmoid
    let prob = 1 / (1 + Math.exp(-logit));
    // Clamp between 2% and 95%
    prob = Math.max(0.02, Math.min(0.95, prob));
    const scorePct = prob * 100;

    // 3. Update Gauge Meter (Arc length = 283)
    const arcTotal = 283;
    const offset = arcTotal - (scorePct / 100) * arcTotal;
    if (gaugeFillPath) {
      gaugeFillPath.style.strokeDashoffset = offset;
      if (scorePct < 15) {
        gaugeFillPath.style.stroke = "#10b981"; // Emerald
      } else if (scorePct < 35) {
        gaugeFillPath.style.stroke = "#f59e0b"; // Amber
      } else {
        gaugeFillPath.style.stroke = "#ef4444"; // Rose
      }
    }

    if (gaugeScoreText) {
      gaugeScoreText.textContent = scorePct.toFixed(1);
    }

    // 4. Update Status Badge
    if (simStatusBadge) {
      simStatusBadge.className = "sim-status-badge";
      if (scorePct < 15) {
        simStatusBadge.classList.add("safe");
        simStatusIcon.textContent = "🛡️";
        simStatusText.textContent = "안전 (정상 정시 도착 예상)";
      } else if (scorePct < 35) {
        simStatusBadge.classList.add("warning");
        simStatusIcon.textContent = "⚠️";
        simStatusText.textContent = "주의 (지연 위험 발생 우려)";
      } else {
        simStatusBadge.classList.add("danger");
        simStatusIcon.textContent = "🚨";
        simStatusText.textContent = "고위험 (지연 발생 가능성 매우 높음)";
      }
    }

    // 5. Calculate Top 3 Risk Contributors
    const factorList = [
      { name: `지역: ${region}`, impact: wRegion },
      { name: `날씨: ${weather}`, impact: wWeather },
      { name: `주거: ${housing}`, impact: wHousing },
      { name: `배송 거리: ${distanceKm.toFixed(1)}km`, impact: wDist },
      { name: `당일 배송지: ${dailyDest}가구`, impact: wDest },
      { name: `공동현관 잠금`, impact: wLock },
      { name: `신선식품`, impact: wFresh },
      { name: `월요일 물량 집중`, impact: wMon },
      { name: `상자 무게: ${weightKg}kg`, impact: wWeight },
      { name: `엘리베이터 없음`, impact: !hasElevator ? 0.42 : 0 }
    ].filter((f) => f.impact > 0.05);

    factorList.sort((a, b) => b.impact - a.impact);
    const top3 = factorList.slice(0, 3);

    if (topContributorsList) {
      if (top3.length === 0) {
        topContributorsList.innerHTML = `<div style="font-size:0.8rem; color:#94a3b8;">주요 위험 요인 없음 (모든 조건이 안정적)</div>`;
      } else {
        topContributorsList.innerHTML = top3
          .map(
            (f) => `
            <div class="contributor-item">
              <span class="name">${f.name}</span>
              <span class="impact">+${(f.impact * 12).toFixed(1)}% 기여</span>
            </div>
          `
          )
          .join("");
      }
    }

    // 6. Action Recommendation Box
    if (simActionBox) {
      if (scorePct < 15) {
        simActionBox.innerHTML = `
          💡 <strong>현장 권장 조치:</strong> 지연 위험이 낮습니다. 표준 배송 라우트를 유지하고 평시 프로토콜대로 배송을 진행하세요.
        `;
      } else if (scorePct < 35) {
        simActionBox.innerHTML = `
          ⚠️ <strong>현장 권장 조치:</strong> 중간 수준의 지연 위험이 감지되었습니다. 
          ${isFresh ? "신선식품을 먼저 처리하도록 우선순위를 변경하고, " : ""}
          ${hasEntranceLock ? "공동현관 비밀번호를 미리 확인하여 대기 시간을 줄이세요." : "이동 경로 정체를 사전 모니터링하세요."}
        `;
      } else {
        simActionBox.innerHTML = `
          🚨 <strong>현장 긴급 조치 권고:</strong> 지연 확률이 <strong>${scorePct.toFixed(1)}%</strong>에 달합니다! 
          인접 배송 기사 지원(물량 분산)을 요청하고, 고객에게 약속 시간 30분 전 선제적 지연 예상 알림을 즉시 발송하세요.
        `;
      }
    }
  }

  // Bind change and input listeners
  const allInputs = [
    selRegion,
    selHousing,
    selWeather,
    selTimeSlot,
    sldDriverExp,
    sldDailyDest,
    sldDistance,
    sldWeight,
    chkIsFresh,
    chkHasElevator,
    chkHasEntranceLock,
    chkIsMonday
  ];

  allInputs.forEach((el) => {
    if (!el) return;
    el.addEventListener("input", calculateRisk);
    el.addEventListener("change", calculateRisk);
  });

  // Toggle card style sync
  [chkIsFresh, chkHasElevator, chkHasEntranceLock, chkIsMonday].forEach((chk) => {
    if (!chk) return;
    chk.parentElement.addEventListener("click", (e) => {
      if (e.target !== chk) {
        chk.checked = !chk.checked;
        chk.dispatchEvent(new Event("change"));
      }
      chk.parentElement.classList.toggle("checked", chk.checked);
    });
  });

  // Presets
  if (btnDangerous) {
    btnDangerous.addEventListener("click", () => {
      selRegion.value = "도서산간";
      selHousing.value = "단독주택";
      selWeather.value = "폭우";
      selTimeSlot.value = "야간/새벽";
      sldDriverExp.value = 0.8;
      sldDailyDest.value = 160;
      sldDistance.value = 8.5;
      sldWeight.value = 18.0;
      chkIsFresh.checked = true;
      chkHasElevator.checked = false;
      chkHasEntranceLock.checked = true;
      chkIsMonday.checked = true;

      // Sync checkbox cards
      chkIsFresh.parentElement.classList.add("checked");
      chkHasElevator.parentElement.classList.remove("checked");
      chkHasEntranceLock.parentElement.classList.add("checked");
      chkIsMonday.parentElement.classList.add("checked");

      calculateRisk();
    });
  }

  if (btnApartment) {
    btnApartment.addEventListener("click", () => {
      selRegion.value = "서울도심";
      selHousing.value = "아파트";
      selWeather.value = "비";
      selTimeSlot.value = "야간/새벽";
      sldDriverExp.value = 1.5;
      sldDailyDest.value = 135;
      sldDistance.value = 2.2;
      sldWeight.value = 8.0;
      chkIsFresh.checked = false;
      chkHasElevator.checked = true;
      chkHasEntranceLock.checked = true;
      chkIsMonday.checked = false;

      chkIsFresh.parentElement.classList.remove("checked");
      chkHasElevator.parentElement.classList.add("checked");
      chkHasEntranceLock.parentElement.classList.add("checked");
      chkIsMonday.parentElement.classList.remove("checked");

      calculateRisk();
    });
  }

  if (btnSafe) {
    btnSafe.addEventListener("click", () => {
      selRegion.value = "수도권신도시";
      selHousing.value = "오피스텔";
      selWeather.value = "맑음";
      selTimeSlot.value = "오후";
      sldDriverExp.value = 4.0;
      sldDailyDest.value = 90;
      sldDistance.value = 0.8;
      sldWeight.value = 3.5;
      chkIsFresh.checked = false;
      chkHasElevator.checked = true;
      chkHasEntranceLock.checked = false;
      chkIsMonday.checked = false;

      chkIsFresh.parentElement.classList.remove("checked");
      chkHasElevator.parentElement.classList.add("checked");
      chkHasEntranceLock.parentElement.classList.remove("checked");
      chkIsMonday.parentElement.classList.remove("checked");

      calculateRisk();
    });
  }

  // Initial calculation
  calculateRisk();
}
