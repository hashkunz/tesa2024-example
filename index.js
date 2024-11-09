google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(loadTable);

async function loadTable() {
    try {
        const response = await fetch('http://localhost:3000/slist');
        const data = await response.json();
        populateTable(data);
        drawChart(data);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function populateTable(data) {
    let tableBody = document.querySelector("#dataTable tbody");
    tableBody.innerHTML = data.map((entry, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${entry.temperature}</td>
            <td>${entry.humidity}</td>
            <td>${entry.timestamp}</td>
        </tr>
    `).join('');
}

function drawChart(data) {
    const chartData = [["Timestamp", "Temperature"]];
    data.forEach(entry => chartData.push([new Date(entry.timestamp), entry.temperature]));
    const dataTable = google.visualization.arrayToDataTable(chartData);
    const options = {
        title: "Temperature Over Time",
        hAxis: { title: 'Timestamp' },
        vAxis: { title: 'Temperature' },
        legend: { position: 'bottom' }
    };
    const chart = new google.visualization.LineChart(document.getElementById("chartContainer"));
    chart.draw(dataTable, options);
}
