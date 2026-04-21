document.addEventListener('DOMContentLoaded', () => {
    const selectionScreen = document.getElementById('selectionScreen');
    const mainHeader = document.getElementById('mainHeader');
    const body = document.body;
    const leftContainer = document.getElementById('leftContainer');

    const dateRangeControls = document.createElement('div');
    dateRangeControls.id = 'dateRangeControls';
    dateRangeControls.innerHTML = `
        <div class="range-labels">
            <span id="displayStartDate"></span>
            <span id="displayEndDate"></span>
        </div>
        <div class="dual-range-wrapper">
            <div class="dual-range-track"></div>
            <div class="dual-range-fill" id="dualRangeFill"></div>
            <input type="range" id="startDateSlider">
            <input type="range" id="endDateSlider">
        </div>
    `;

    const pieRangeControls = document.createElement('div');
    pieRangeControls.id = 'pieRangeControls';
    pieRangeControls.innerHTML = `
        <label for="pieDateSlider">Select Date:</label>
        <input type="range" id="pieDateSlider">
        <span id="pieStartDate"></span><br>
    `;

    const leftContainerHTML = `
        <h2 id="pieTitle">Pie Chart</h2>
        <div id="coalitionInfo"></div>
        <canvas id="pieChart"></canvas>
        <h2>Line Graph of All Data</h2>
        <p id="scaling_warn">Note data is not time-scaled.</p>
        <canvas id="lineChart"></canvas>
        <p id="explanationIntro">Much like in real life, descriptions of left and right wing aren't perfect dichotomies. In Richardian politics, there is a dual scale of left and right. The first is socially left or right. This very much like in real life, with left reflecting more liberal thought, and right reflecting more conservative beliefs. The other scale is the academic left or right. This describes the party's approach to academics, the dominant concern in Richardian politics. Academically left-leaning parties tend to prefer a holistic approach, increasing rest, friendships, and extracurricular in the hope that they will indirectly improve academic performance (think "cutting taxes" or "social spending" as a real-life analogue). Academically right-leaning parties believe that the only solution to academic problems is simply confronting them with more hard work (think "hard-on-crime" as a real-life analogue). Much like in real life, many parties don't lean the same direction on both spectrums.</p>
        <div id="lineExplanations"></div>
        <h1>CSV Output Table</h1>
        <table id="csvTable"></table>
    `;

    function showSelectionScreen() {
        selectionScreen.style.display = 'flex';
        mainHeader.style.display = 'none';
        body.classList.remove('show-electoral');

        leftContainer.innerHTML = '';
        if (dateRangeControls.parentNode) dateRangeControls.parentNode.removeChild(dateRangeControls);
        if (pieRangeControls.parentNode) pieRangeControls.parentNode.removeChild(pieRangeControls);

        if (electoralPieChart) { electoralPieChart.destroy(); electoralPieChart = null; }
        if (electoralLineChart) { electoralLineChart.destroy(); electoralLineChart = null; }
    }

    function showElectoralView() {
        selectionScreen.style.display = 'none';
        body.classList.add('show-electoral');
        mainHeader.style.display = 'flex';

        leftContainer.innerHTML = leftContainerHTML;

        const pieChartCanvas = leftContainer.querySelector('#pieChart');
        const lineChartCanvas = leftContainer.querySelector('#lineChart');
        if (pieChartCanvas) pieChartCanvas.parentNode.insertBefore(pieRangeControls, pieChartCanvas);
        if (lineChartCanvas) lineChartCanvas.parentNode.insertBefore(dateRangeControls, lineChartCanvas);

        fetchElectoralData();
    }

    document.getElementById('viewElectoral').addEventListener('click', showElectoralView);
    document.getElementById('backToSelection').addEventListener('click', showSelectionScreen);
});