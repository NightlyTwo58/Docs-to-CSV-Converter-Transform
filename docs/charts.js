const partyExplanations = {
    "SA": "(Socialist Alliance) (Academically Far-Left, Socially Left) A historical socialist/communist party that was the inspiration for the RLP. It declined in popularity because it was too idealistic, something the RLP rectified. It sees occasional resurgences when RLP policies get old.",
    "MCP": "(Moderate-Centre Party) (Academically Left, Socially Left) The big-tent left-wing/centrist party, similar to the modern democratic party. Originally founded as a newer broad centrist alternative to the LEP back when it was a socially leftist party, now it has totally supplanted the LEP in its former role and shifted leftward socially. Main advocate for rest and other indirect measures to promote academic performance in addition to the YPP and sometimes the LEP.",
    "LEP": "(Liberty-Equality Party) (Academically Left, Socially Right [Formerly Left]) Before the rise of the RLP, the LEP was the dominant party in early high school. The old LEP stood for liberal ideals, combined with liberal academic approaches. However, in the run-up to college, a series of debacles caused by its lax academic stance caused it to loose much popularity, with its former little sister the MCP taking much its former influence in the liberal sphere. Afterwards, the LEP has reinvented itself as a stalwartly socially conservative (right-wign) party promoting \"properity\", hanging on left-wing academic policies. The modern LEP enjoys electoral successes usually under conditions of demobilization after an academic semester.",
    "MU": "(Musical Union) (Nonpartisan) As the domestic musical industry faced attacks and potential decline in high school under growing academic pressure, it felt that no party was willing to represent its interests. Thus, the MU was born as a splinter faction of the AU. The Musical Union represents the Richardian interest in piano/composing at a given time. It is nonpartisan and works with any parties willing to secure music in the budget.",
    "AU": "(Academic Union) (Academically Center-Right, Socially Right) Originally a direct competitor to the RLP with almost the exact same platform (albeit taking even less of a social position), the AU was beset by internal infighting and faded in obscurity. As of late it has seen a resurgence in popularity as many realize the republic lacks an alternative to the dying RLP conservative hegenomy, with the AU becoming a more academically purist alternative to the RLP.",
    "NAP": "(Nationalist Alliance Party) (Academically Far-Right, Socially Far-Right) Similar to the SA, a historical far-right party that exists during the early unstable stages of Richardian democracy that is no longer extant. Advocated sharp nationalistic academic change, ultra-conservative social ideology (something lost to later parties) and strengthening of the executive branch to effect that.",
    "RLP": "(Reform Labour Party) (Academically Right, Socially Center-Right) The dominant party since the fall of the LEP, it has recently seen struggles for influence. The RLP was born out of popular dissatification with the policies of the SA and a desire for a more syncretist approach to economics, combining right-wing \"grit\" with left-wing optimism and planning. The resulting RLP swept to power in the Second Academic Revolution in the sophomore year of high school. The RLP holds light conservative social views, believing that academics is their primary platform. The RLP is the republic's premier academic party; other parties are often the exception to the RLP hegenomy.",
    "CDoP": "(Crown Dominion Party) (Academically Far-Right, Socially Right) Represents parental influence and support in the Richardian republic, as our constitutional structure still grants significant powers to parents as a Dominion of a broader Empire. The CDoP nominally doesn't hold \"petty\" positions on domestic politics, but typically acts academically and socially conservative. Most left-wing parties hold somewhat of a disdain for the CDoP.",
    "YPP": "(Youth Power Party) (Academically Left, Socially Left) Represents the youth and liberal academics. Nicknamed the \"happy party,\" it has a particularly energetic spirit, focusing on friendships, love, and \"responsible\" light academics as its primary platform. The YPP enjoys sustained popularity with new friends, partners, or academic booms that allow the pursuit of more relaxed academic policies. It has no problem with collaborating with the MCP, as their views and goals usually align. As of lately, the YPP has positioned itself further left as the party representing rebellion against the parents instead of autonomy advocated for by more moderate parties. This has pitted it directly against the CDoP.",
};

function fetchElectoralData() {
    fetch(`output.csv?_=${new Date().getTime()}`)
        .then(response => response.text())
        .then(data => {
            const rawCsvRows = data.trim().split("\n").map(row => row.split(",").filter(cell => cell.trim() !== ""));
            const headers = rawCsvRows[0].map(header => header.trim());

            allElectoralDataRows = rawCsvRows.slice(1).map(row => {
                const date = new Date(row[0]);
                if (isNaN(date.getTime())) {
                    console.warn(`Invalid date encountered in output.csv: ${row[0]}. Skipping row.`);
                    return null;
                }
                const partyValues = row.slice(1, headers.length - 1).map(parseFloat);
                const coalitionString = row[headers.length - 1];
                return { date, partyValues, coalitionString, rawCsvRow: row };
            }).filter(Boolean);

            if (allElectoralDataRows.length === 0) {
                console.error("No valid electoral data rows with parsable dates.");
                document.getElementById('dateRangeControls').style.display = 'none';
                document.getElementById('pieRangeControls').style.display = 'none';
                return;
            }

            allElectoralDataRows.sort((a, b) => a.date.getTime() - b.date.getTime());
            electoralMinDateMs = allElectoralDataRows[0].date.getTime();
            electoralMaxDateMs = allElectoralDataRows[allElectoralDataRows.length - 1].date.getTime();

            // Set up dual-handle line chart date range slider
            const startDateSlider = document.getElementById('startDateSlider');
            const endDateSlider = document.getElementById('endDateSlider');
            const displayStartDate = document.getElementById('displayStartDate');
            const displayEndDate = document.getElementById('displayEndDate');

            if (startDateSlider && endDateSlider) {
                [startDateSlider, endDateSlider].forEach(slider => {
                    slider.min = electoralMinDateMs;
                    slider.max = electoralMaxDateMs;
                    slider.step = 86400000;
                });
                startDateSlider.value = electoralMinDateMs;
                endDateSlider.value = electoralMaxDateMs;

                displayStartDate.textContent = new Date(electoralMinDateMs).toLocaleDateString();
                displayEndDate.textContent = new Date(electoralMaxDateMs).toLocaleDateString();

                startDateSlider.oninput = updateElectoralChartRange;
                endDateSlider.oninput = updateElectoralChartRange;
                updateDualRangeFill();
            }

            // Set up pie chart date slider
            const pieDateSlider = document.getElementById('pieDateSlider');
            const pieStartDate = document.getElementById('pieStartDate');

            if (pieDateSlider) {
                pieDateSlider.min = electoralMinDateMs;
                pieDateSlider.max = electoralMaxDateMs;
                pieDateSlider.value = electoralMaxDateMs;
                pieDateSlider.step = 86400000;
                pieStartDate.textContent = new Date(electoralMaxDateMs).toLocaleDateString();
                pieDateSlider.oninput = updatePieChartDate;
            }

            document.getElementById('dateRangeControls').style.display = 'block';
            document.getElementById('pieRangeControls').style.display = 'block';

            // Populate CSV table
            const table = document.getElementById("csvTable");
            table.innerHTML = '';
            const thead = table.createTHead();
            const headerRow = thead.insertRow();
            headers.forEach(headerText => {
                const th = document.createElement("th");
                th.textContent = headerText;
                headerRow.appendChild(th);
            });
            const tbody = table.createTBody();
            rawCsvRows.slice(1).forEach(rowData => {
                const row = tbody.insertRow();
                rowData.forEach(cellText => {
                    const td = row.insertCell();
                    td.textContent = cellText;
                });
            });

            updatePieChartDate();
            updateElectoralChartRange();

            // Populate party explanations
            const explanationContainer = document.getElementById("lineExplanations");
            explanationContainer.innerHTML = '';
            headers.slice(1, headers.length - 1).forEach(label => {
                const p = document.createElement("p");
                p.innerHTML = `<strong>${label}:</strong> ${partyExplanations[label] || "No description available."}`;
                explanationContainer.appendChild(p);
            });
        })
        .catch(error => console.error("Error fetching electoral data:", error));
}

function updatePieChartDate() {
    const pieDateSlider = document.getElementById('pieDateSlider');
    const displayDate = document.getElementById('pieStartDate');
    const coalitionInfoDiv = document.getElementById('coalitionInfo');

    if (!pieDateSlider || !displayDate || allElectoralDataRows.length === 0) {
        console.warn("Pie chart elements or data not available for update.");
        return;
    }

    const selectedDateMs = parseInt(pieDateSlider.value);
    displayDate.textContent = new Date(selectedDateMs).toLocaleDateString();

    const selectedRow = allElectoralDataRows.find(row => row.date.getTime() === selectedDateMs);

    if (!selectedRow) {
        console.warn("No data found for the selected pie chart date.");
        if (electoralPieChart) { electoralPieChart.destroy(); electoralPieChart = null; }
        coalitionInfoDiv.textContent = "";
        coalitionInfoDiv.style.display = 'none';
        return;
    }

    const tableHeadersElement = document.getElementById("csvTable").querySelector('thead');
    const pieLabels = Array.from(tableHeadersElement.querySelectorAll('th')).map(th => th.textContent).slice(1, -1);
    const pieData = selectedRow.partyValues;
    const coalitionString = selectedRow.coalitionString;

    const borderColors = new Array(pieLabels.length).fill('rgba(0, 0, 0, 0)');
    const borderWidths = new Array(pieLabels.length).fill(0);

    let coalitionParties = [];
    if (coalitionString && coalitionString.trim() !== '') {
        coalitionParties = coalitionString.split('-').map(p => p.trim());
        coalitionInfoDiv.textContent = `Coalition: ${coalitionString}`;
        coalitionInfoDiv.style.display = 'block';
    } else {
        coalitionInfoDiv.textContent = "No active coalition for this date.";
        coalitionInfoDiv.style.display = 'block';
    }

    coalitionParties.forEach(party => {
        const index = pieLabels.indexOf(party);
        if (index !== -1) {
            borderColors[index] = 'orange';
            borderWidths[index] = 3;
        }
    });

    document.getElementById("pieTitle").textContent = `${new Date(selectedDateMs).toLocaleDateString()}'s Election Results`;

    if (electoralPieChart) { electoralPieChart.destroy(); }
    electoralPieChart = new Chart(document.getElementById("pieChart").getContext("2d"), {
        type: "pie",
        data: {
            labels: pieLabels,
            datasets: [{
                data: pieData,
                backgroundColor: customColors.slice(0, pieLabels.length),
                borderColor: borderColors,
                borderWidth: borderWidths
            }]
        },
        options: { responsive: true }
    });
}

function updateDualRangeFill() {
    const startSlider = document.getElementById('startDateSlider');
    const endSlider = document.getElementById('endDateSlider');
    const fill = document.getElementById('dualRangeFill');
    if (!startSlider || !endSlider || !fill) return;

    const min = parseFloat(startSlider.min);
    const max = parseFloat(startSlider.max);
    const left = ((parseFloat(startSlider.value) - min) / (max - min)) * 100;
    const right = ((parseFloat(endSlider.value) - min) / (max - min)) * 100;
    fill.style.left = left + '%';
    fill.style.width = (right - left) + '%';
}

function updateElectoralChartRange() {
    const startDateSlider = document.getElementById('startDateSlider');
    const endDateSlider = document.getElementById('endDateSlider');
    const displayStartDate = document.getElementById('displayStartDate');
    const displayEndDate = document.getElementById('displayEndDate');
    const lineCtx = document.getElementById("lineChart").getContext("2d");

    if (!startDateSlider || !endDateSlider || allElectoralDataRows.length === 0) return;

    let selectedMinDateMs = parseInt(startDateSlider.value);
    let selectedMaxDateMs = parseInt(endDateSlider.value);

    // Prevent handles crossing
    if (selectedMinDateMs > selectedMaxDateMs) {
        if (document.activeElement === startDateSlider) {
            startDateSlider.value = selectedMaxDateMs;
            selectedMinDateMs = selectedMaxDateMs;
        } else {
            endDateSlider.value = selectedMinDateMs;
            selectedMaxDateMs = selectedMinDateMs;
        }
    }

    displayStartDate.textContent = new Date(selectedMinDateMs).toLocaleDateString();
    displayEndDate.textContent = new Date(selectedMaxDateMs).toLocaleDateString();
    updateDualRangeFill();

    const filteredRows = allElectoralDataRows.filter(row => {
        const t = row.date.getTime();
        return t >= selectedMinDateMs && t <= selectedMaxDateMs;
    });

    const tableHeaders = document.getElementById("csvTable").querySelector('thead');
    const labels = Array.from(tableHeaders.querySelectorAll('th')).map(th => th.textContent).slice(1, -1);

    if (filteredRows.length === 0) {
        if (electoralLineChart) { electoralLineChart.data.datasets = []; electoralLineChart.update(); }
        return;
    }

    const newDatasets = labels.map((label, index) => {
        const color = customColors[index % customColors.length];
        return {
            label,
            data: filteredRows.map(row => ({ x: row.date, y: row.partyValues[index] })),
            borderColor: color,
            backgroundColor: color + '33',
            fill: 'origin',
            tension: 0.3,
            borderWidth: 2
        };
    });

    if (electoralLineChart) { electoralLineChart.destroy(); }
    electoralLineChart = new Chart(lineCtx, {
        type: "line",
        data: { datasets: newDatasets },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: { tooltip: { mode: 'index', intersect: false } },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        parser: 'MM/dd/yyyy',
                        tooltipFormat: 'MMM dd,PPPP',
                        unit: 'day',
                        displayFormats: { day: 'MMM d', month: 'MMM yyyy' }
                    },
                    title: { display: true, text: 'Date' },
                    min: selectedMinDateMs,
                    max: selectedMaxDateMs
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Votes' }
                }
            }
        }
    });
}