const partyExplanations = {
    SA: '(Socialist Alliance) (Academically Far-Left, Socially Left) A historical socialist/communist party that inspired the RLP. It declined after proving too idealistic, but still resurges when RLP policies get old.',
    MCP: '(Moderate-Centre Party) (Academically Left, Socially Left) The broad left/centrist party and the main advocate for rest and indirect measures to promote academic performance.',
    LEP: '(Liberty-Equality Party) (Academically Left, Socially Right) Formerly dominant and socially liberal, the modern LEP is socially conservative while retaining left-wing academic policy instincts.',
    MU: '(Musical Union) (Nonpartisan) Represents domestic piano/composing interests and works with any party willing to protect music in the budget.',
    AU: '(Academic Union) (Academically Center-Right, Socially Right) A purist academic alternative to the RLP that has resurged as the conservative field widened.',
    NAP: '(Nationalist Alliance Party) (Academically Far-Right, Socially Far-Right) A historical far-right party from early unstable stages of Richardian democracy.',
    RLP: '(Reform Labour Party) (Academically Right, Socially Center-Right) The long-dominant academic party, built around grit, optimism, planning, and light conservative social views.',
    CDoP: '(Crown Dominion Party) (Academically Far-Right, Socially Right) Represents parental influence and support in the Richardian republic, typically acting as an academically and socially conservative force.',
    YPP: '(Youth Power Party) (Academically Left, Socially Left) The energetic youth and liberal-academic party, focused on friendships, love, and responsible light academics.'
};

const dateFormatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

async function fetchElectoralData() {
    setStatus('Loading data');

    try {
        const response = await fetch(`output.csv?_=${Date.now()}`);
        if (!response.ok) throw new Error(`output.csv returned ${response.status}`);

        const csvText = await response.text();
        const parsed = Papa.parse(csvText.trim(), {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });

        if (parsed.errors.length) {
            console.warn('CSV parse warnings:', parsed.errors);
        }

        const headers = parsed.meta.fields || [];
        const parties = headers.filter(header => header !== 'Date' && header !== 'Coalitions');
        const rows = parsed.data
            .map((record, index) => normalizeElectionRow(record, parties, index))
            .filter(Boolean)
            .sort((a, b) => a.date - b.date);

        if (!rows.length) throw new Error('No valid dated rows found in output.csv');

        chartState.headers = headers;
        chartState.parties = parties;
        chartState.rows = rows;

        setupControls(rows);
        renderMetrics(rows, parties);
        renderPartyNotes(parties);
        renderTable(rows, headers, parties);
        updatePieChart();
        updateLineChart();
        renderWinnerChart(rows);
        renderLatestBarChart(rows, parties);
        setStatus(`${rows.length} records loaded`);
    } catch (error) {
        console.error(error);
        setStatus('Unable to load data');
        const grid = document.getElementById('metricGrid');
        if (grid) grid.innerHTML = '<div class="empty-state">Unable to load output.csv. Use a local web server so fetch can read the CSV file.</div>';
    }
}

function normalizeElectionRow(record, parties, index) {
    const date = parseCsvDate(record.Date);
    if (!date) {
        console.warn(`Skipping row ${index + 2}: invalid date`, record.Date);
        return null;
    }

    const values = Object.fromEntries(parties.map(party => [party, Number(record[party]) || 0]));
    const total = parties.reduce((sum, party) => sum + values[party], 0);
    const ranked = [...parties].sort((a, b) => values[b] - values[a]);
    const winner = ranked[0];
    const runnerUp = ranked[1];

    return {
        date,
        dateMs: date.getTime(),
        dateLabel: dateFormatter.format(date),
        values,
        total,
        winner,
        runnerUp,
        lead: values[winner] - (values[runnerUp] || 0),
        activeParties: parties.filter(party => values[party] > 0),
        coalition: String(record.Coalitions || '').trim()
    };
}

function parseCsvDate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value !== 'string') return null;

    const parts = value.trim().split('/').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

    const [month, day, year] = parts;
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function setupControls(rows) {
    const lastIndex = rows.length - 1;
    const controls = ['startDateSlider', 'endDateSlider', 'pieDateSlider'].map(id => document.getElementById(id));

    controls.forEach(control => {
        control.min = 0;
        control.max = lastIndex;
        control.step = 1;
    });

    document.getElementById('startDateSlider').value = 0;
    document.getElementById('endDateSlider').value = lastIndex;
    document.getElementById('pieDateSlider').value = lastIndex;

    document.getElementById('startDateSlider').addEventListener('input', updateLineChart);
    document.getElementById('endDateSlider').addEventListener('input', updateLineChart);
    document.getElementById('pieDateSlider').addEventListener('input', updatePieChart);
}

function renderMetrics(rows, parties) {
    const latest = rows[rows.length - 1];
    const first = rows[0];
    const coalitionDays = rows.filter(row => row.coalition).length;
    const winnerCounts = countBy(rows.map(row => row.winner));
    const dominantParty = Object.entries(winnerCounts).sort((a, b) => b[1] - a[1])[0];
    const mostVolatile = parties
        .map(party => ({ party, movement: totalMovement(rows, party) }))
        .sort((a, b) => b.movement - a.movement)[0];

    const metrics = [
        { label: 'Latest winner', value: latest.winner, note: `${latest.values[latest.winner]} support on ${latest.dateLabel}` },
        { label: 'Lead margin', value: latest.lead, note: `${latest.winner} over ${latest.runnerUp}` },
        { label: 'Campaign span', value: rows.length, note: `${first.dateLabel} to ${latest.dateLabel}` },
        { label: 'Coalition days', value: coalitionDays, note: `${Math.round((coalitionDays / rows.length) * 100)}% of records` },
        { label: 'Most movement', value: mostVolatile.party, note: `${mostVolatile.movement} total point change` }
    ];

    document.getElementById('metricGrid').innerHTML = metrics.map(metric => `
        <article class="metric">
            <div class="metric-label">${escapeHtml(metric.label)}</div>
            <div class="metric-value">${escapeHtml(String(metric.value))}</div>
            <div class="metric-note">${escapeHtml(metric.note)}</div>
        </article>
    `).join('');
}

function updatePieChart() {
    const rows = chartState.rows;
    if (!rows.length) return;

    const slider = document.getElementById('pieDateSlider');
    const row = rows[Number(slider.value) || 0];
    document.getElementById('pieDateReadout').textContent = row.dateLabel;
    document.getElementById('pieTitle').textContent = `${row.dateLabel} Election Snapshot`;
    document.getElementById('coalitionInfo').textContent = row.coalition ? `Coalition: ${row.coalition}` : 'No active coalition on this date.';

    const labels = chartState.parties;
    const data = labels.map(party => row.values[party]);
    const coalitionParties = new Set(row.coalition.split('-').map(party => party.trim()).filter(Boolean));

    chartState.charts.pie = upsertChart(chartState.charts.pie, 'pieChart', {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: labels.map(getPartyColor),
                borderColor: labels.map(party => coalitionParties.has(party) ? '#111827' : '#ffffff'),
                borderWidth: labels.map(party => coalitionParties.has(party) ? 4 : 2),
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '52%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: { callbacks: { label: context => `${context.label}: ${context.parsed}` } }
            }
        }
    });
}

function updateLineChart() {
    const rows = chartState.rows;
    if (!rows.length) return;

    const startSlider = document.getElementById('startDateSlider');
    const endSlider = document.getElementById('endDateSlider');
    let startIndex = Number(startSlider.value) || 0;
    let endIndex = Number(endSlider.value) || 0;

    if (startIndex > endIndex) {
        if (document.activeElement === startSlider) endIndex = startIndex;
        else startIndex = endIndex;
        startSlider.value = startIndex;
        endSlider.value = endIndex;
    }

    const filteredRows = rows.slice(startIndex, endIndex + 1);
    document.getElementById('displayStartDate').textContent = rows[startIndex].dateLabel;
    document.getElementById('displayEndDate').textContent = rows[endIndex].dateLabel;

    const datasets = chartState.parties.map(party => ({
        label: party,
        data: filteredRows.map(row => ({ x: row.date, y: row.values[party] })),
        borderColor: getPartyColor(party),
        backgroundColor: transparentize(getPartyColor(party), 0.14),
        borderWidth: 2,
        pointRadius: filteredRows.length > 90 ? 0 : 2,
        pointHoverRadius: 5,
        tension: 0.25
    }));

    chartState.charts.line = upsertChart(chartState.charts.line, 'lineChart', {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true } },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: {
                    type: 'time',
                    time: { unit: chooseTimeUnit(filteredRows), tooltipFormat: 'PP' },
                    min: filteredRows[0].dateMs,
                    max: filteredRows[filteredRows.length - 1].dateMs,
                    grid: { color: '#edf2f7' },
                    title: { display: true, text: 'Date' }
                },
                y: {
                    beginAtZero: true,
                    suggestedMax: 100,
                    grid: { color: '#edf2f7' },
                    title: { display: true, text: 'Support' }
                }
            }
        }
    });
}

function renderWinnerChart(rows) {
    const labels = chartState.parties;
    const datasets = labels.map(party => ({
        label: party,
        data: rows.map(row => ({ x: row.date, y: row.winner === party ? row.values[party] : null })),
        backgroundColor: getPartyColor(party),
        borderColor: getPartyColor(party),
        pointRadius: 3,
        showLine: false
    }));

    chartState.charts.winners = upsertChart(chartState.charts.winners, 'winnerChart', {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true } },
                tooltip: { callbacks: { label: context => `${context.dataset.label}: ${context.parsed.y}` } }
            },
            scales: {
                x: { type: 'time', time: { unit: 'month', tooltipFormat: 'PP' }, grid: { color: '#edf2f7' } },
                y: { beginAtZero: true, suggestedMax: 100, title: { display: true, text: 'Winning support' }, grid: { color: '#edf2f7' } }
            }
        }
    });
}

function renderLatestBarChart(rows, parties) {
    const latest = rows[rows.length - 1];
    const active = parties
        .map(party => ({ party, value: latest.values[party] }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);

    chartState.charts.latestBar = upsertChart(chartState.charts.latestBar, 'latestBarChart', {
        type: 'bar',
        data: {
            labels: active.map(item => item.party),
            datasets: [{
                label: latest.dateLabel,
                data: active.map(item => item.value),
                backgroundColor: active.map(item => getPartyColor(item.party)),
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, suggestedMax: 100, grid: { color: '#edf2f7' } },
                y: { grid: { display: false } }
            }
        }
    });
}

function renderPartyNotes(parties) {
    document.getElementById('partyNotes').innerHTML = parties.map(party => `
        <article class="party-card">
            <div class="party-line"><span class="swatch" style="background:${getPartyColor(party)}"></span>${escapeHtml(party)}</div>
            <p class="party-desc">${escapeHtml(partyExplanations[party] || 'No description available.')}</p>
        </article>
    `).join('');
}

function renderTable(rows, headers, parties) {
    const search = document.getElementById('tableSearch');
    const summary = document.getElementById('tableSummary');
    summary.textContent = `${rows.length} rows, ${parties.length} parties, ${rows.filter(row => row.coalition).length} coalition records`;

    const draw = () => {
        const query = search.value.trim().toLowerCase();
        const filtered = rows.filter(row => {
            const text = [row.dateLabel, row.coalition, ...parties.map(party => `${party} ${row.values[party]}`)].join(' ').toLowerCase();
            return text.includes(query);
        });

        document.getElementById('csvTable').innerHTML = `
            <thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
            <tbody>${filtered.map(row => `
                <tr>
                    <td>${escapeHtml(row.dateLabel)}</td>
                    ${parties.map(party => `<td>${row.values[party]}</td>`).join('')}
                    <td>${escapeHtml(row.coalition)}</td>
                </tr>
            `).join('')}</tbody>
        `;
    };

    search.addEventListener('input', draw);
    draw();
}

function upsertChart(existingChart, canvasId, config) {
    if (existingChart) {
        existingChart.config.type = config.type;
        existingChart.data = config.data;
        existingChart.options = config.options;
        existingChart.update();
        return existingChart;
    }

    return new Chart(document.getElementById(canvasId), config);
}

function getPartyColor(party) {
    const index = chartState.parties.indexOf(party);
    return customColors[index % customColors.length];
}

function transparentize(hex, alpha) {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function chooseTimeUnit(rows) {
    if (rows.length > 240) return 'month';
    if (rows.length > 80) return 'week';
    return 'day';
}

function countBy(values) {
    return values.reduce((counts, value) => {
        counts[value] = (counts[value] || 0) + 1;
        return counts;
    }, {});
}

function totalMovement(rows, party) {
    return rows.slice(1).reduce((sum, row, index) => {
        const previous = rows[index];
        return sum + Math.abs(row.values[party] - previous.values[party]);
    }, 0);
}

function setStatus(message) {
    const status = document.getElementById('dataStatus');
    if (status) status.textContent = message;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[char]));
}
