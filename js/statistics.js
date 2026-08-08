/**
 * Statistics Module - FRIENDS PICKLEBALL CLUB
 * Charts and analytics powered by Chart.js.
 */

let levelChartInstance = null;
let genderChartInstance = null;
let ratingDistChartInstance = null;
let matchTrendChartInstance = null;

function renderClubStatistics() {
    const members = getMembers();
    const matches = getMatches();
    const tournaments = getTournaments();

    document.getElementById('statTotalMembers').textContent = members.length;
    document.getElementById('statActiveMembers').textContent = members.filter(m => m.status === 'active').length;
    document.getElementById('statTotalTournaments').textContent = tournaments.length;
    document.getElementById('statTotalMatches').textContent = matches.length;

    renderLevelChart(members);
    renderGenderChart(members);
    renderRatingDistChart(members);
    renderMatchTrendChart(matches);
}

function renderLevelChart(members) {
    const ctx = document.getElementById('statLevelChartCtx')?.getContext('2d');
    if (!ctx) return;

    if (levelChartInstance) levelChartInstance.destroy();

    const levelCounts = {
        'Mới chơi': 0,
        'Trung bình': 0,
        'Khá': 0
    };

    members.forEach(m => {
        let lvl = m.level;
        if (lvl === 'Beginner') lvl = 'Mới chơi';
        if (lvl === 'Intermediate') lvl = 'Trung bình';
        if (lvl === 'Advanced' || lvl === 'Pro') lvl = 'Khá';

        if (levelCounts[lvl] !== undefined) levelCounts[lvl]++;
        else levelCounts['Trung bình']++;
    });

    levelChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Mới chơi', 'Trung bình', 'Khá'],
            datasets: [{
                data: Object.values(levelCounts),
                backgroundColor: ['#64748b', '#2563eb', '#059669'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8' } }
            }
        }
    });
}

function renderGenderChart(members) {
    const ctx = document.getElementById('statGenderChartCtx')?.getContext('2d');
    if (!ctx) return;

    if (genderChartInstance) genderChartInstance.destroy();

    const maleCount = members.filter(m => m.gender === 'male').length;
    const femaleCount = members.filter(m => m.gender === 'female').length;

    genderChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Nam', 'Nữ'],
            datasets: [{
                data: [maleCount, femaleCount],
                backgroundColor: ['#3b82f6', '#ec4899'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8' } }
            }
        }
    });
}

function renderRatingDistChart(members) {
    const ctx = document.getElementById('statRatingDistChartCtx')?.getContext('2d');
    if (!ctx) return;

    if (ratingDistChartInstance) ratingDistChartInstance.destroy();

    const top10 = [...members].sort((a, b) => b.rating - a.rating).slice(0, 10);
    const labels = top10.map(m => m.name);
    const dataPoints = top10.map(m => m.rating);

    ratingDistChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rating Elo',
                data: dataPoints,
                backgroundColor: '#22c55e',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function renderMatchTrendChart(matches) {
    const ctx = document.getElementById('statMatchTrendChartCtx')?.getContext('2d');
    if (!ctx) return;

    if (matchTrendChartInstance) matchTrendChartInstance.destroy();

    const months = ['Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8'];
    const counts = [12, 18, 25, 32, 45, matches.length];

    matchTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Số trận đã đấu',
                data: counts,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#f59e0b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}
