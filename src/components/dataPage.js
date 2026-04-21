import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import Chart from 'chart.js/auto';

function DataPage({ title, csvFile, descriptions}) {
  const [csvData, setCsvData] = useState([]);
  const [sliderDate, setSliderDate] = useState(null);
  const [minDate, setMinDate] = useState(null);
  const [maxDate, setMaxDate] = useState(null);
  const pieRef = React.createRef();
  const lineRef = React.createRef();
  let pieChart = null;
  let lineChart = null;

  // Fetch CSV
  useEffect(() => {
    Papa.parse(csvFile, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const rows = results.data
          .map(row => {
            const date = new Date(row.Date);
            if (isNaN(date.getTime())) return null;
            return { ...row, date };
          })
          .filter(Boolean)
          .sort((a, b) => a.date - b.date);

        setCsvData(rows);

        if (rows.length > 0) {
          setMinDate(rows[0].date);
          setMaxDate(rows[rows.length - 1].date);
          setSliderDate(rows[rows.length - 1].date); // default to latest
        }
      }
    });
  }, [csvFile]);

  // Update charts when data or slider changes
  useEffect(() => {
    if (!csvData.length || !sliderDate) return;

    const filteredData = csvData.filter(row => row.date <= sliderDate);

    // Pie chart (last row at sliderDate)
    if (pieRef.current) {
      const lastRow = filteredData[filteredData.length - 1];
      const labels = Object.keys(lastRow).filter(k => k !== 'Date');
      const values = labels.map(k => lastRow[k]);

      if (pieChart) pieChart.destroy();

      pieChart = new Chart(pieRef.current, {
        type: 'pie',
        data: { labels, datasets: [{ data: values, backgroundColor: labels.map(() => '#' + Math.floor(Math.random()*16777215).toString(16)) }] },
      });
    }

    // Line chart
    if (lineRef.current) {
      const labels = filteredData.map(r => r.date.toLocaleDateString());
      const datasets = Object.keys(filteredData[0])
        .filter(k => k !== 'Date')
        .map(k => ({
          label: k,
          data: filteredData.map(r => r[k]),
          borderColor: '#' + Math.floor(Math.random()*16777215).toString(16),
          fill: false
        }));

      if (lineChart) lineChart.destroy();

      lineChart = new Chart(lineRef.current, {
        type: 'line',
        data: { labels, datasets },
        options: { responsive: true }
      });
    }

  }, [csvData, sliderDate]);

  return (
    <div className="dataPage">
      <h1>{title}</h1>

      <div className="sliderSection">
        <label htmlFor="dateSlider">Select Date:</label>
        <input
          type="range"
          id="dateSlider"
          min={minDate ? minDate.getTime() : 0}
          max={maxDate ? maxDate.getTime() : 0}
          value={sliderDate ? sliderDate.getTime() : 0}
          step={86400000}
          onChange={e => setSliderDate(new Date(parseInt(e.target.value)))}
        />
        <span>{sliderDate ? sliderDate.toLocaleDateString() : ''}</span>
      </div>

      <div className="pieSection">
        <h2>Pie Chart</h2>
        <canvas ref={pieRef}></canvas>
      </div>

      <div className="lineSection">
        <h2>Line Graph</h2>
        <canvas ref={lineRef}></canvas>
        <div className="explanations">
          {descriptions && descriptions.map((desc, idx) => <p key={idx}>{desc}</p>)}
        </div>
      </div>

      <div className="csvSection">
        <h2>CSV Output</h2>
        <table>
          <thead>
            <tr>
              {csvData[0] && Object.keys(csvData[0]).map(key => <th key={key}>{key}</th>)}
            </tr>
          </thead>
          <tbody>
            {csvData.map((row, idx) => (
              <tr key={idx}>
                {Object.values(row).map((val, i) => <td key={i}>{val.toString()}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={() => goToPage('Selection Screen')}>Back</button>
    </div>
  );
}

export default DataPage;
