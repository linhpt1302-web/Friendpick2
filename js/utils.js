/**
 * Utility Functions - FRIENDS PICKLEBALL CLUB
 * Toast notifications, Elo rating math, ID generators, date formatters, and avatar image renderer.
 */

// Toast Notifications
function showToast(message, type = 'success', duration = 3000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-check-circle';
    if (type === 'error' || type === 'danger') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    if (type === 'info') icon = 'fa-info-circle';
    if (type === 'trophy') icon = 'fa-trophy';

    toast.innerHTML = `
        <i class="fas ${icon} toast-icon"></i>
        <div class="toast-content">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Confirmation Dialog Modal Helper
function confirmDialog(title, message, onConfirmCallback) {
    const modal = document.getElementById('confirmModal');
    if (!modal) {
        if (confirm(message)) {
            if (typeof onConfirmCallback === 'function') onConfirmCallback();
        }
        return;
    }

    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');
    const btnEl = document.getElementById('confirmBtn');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    if (btnEl) {
        const newBtn = btnEl.cloneNode(true);
        btnEl.parentNode.replaceChild(newBtn, btnEl);
        newBtn.addEventListener('click', () => {
            closeModal('confirmModal');
            if (typeof onConfirmCallback === 'function') onConfirmCallback();
        });
    }

    openModal('confirmModal');
}

// Elo Rating System Math (Single 1v1 & Doubles 2v2)
function calculateElo(ratingA, ratingB, scoreA, scoreB, kFactor = 32) {
    const rA = typeof ratingA === 'number' && !isNaN(ratingA) ? ratingA : 1000;
    const rB = typeof ratingB === 'number' && !isNaN(ratingB) ? ratingB : 1000;

    const winA = scoreA > scoreB ? 1 : 0;
    const winB = winA === 1 ? 0 : 1;

    const expectedA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
    const expectedB = 1 / (1 + Math.pow(10, (rA - rB) / 400));

    const margin = Math.abs(scoreA - scoreB);
    const marginMult = Math.min(2.0, 1.0 + Math.log(margin + 1) * 0.2);

    const changeA = Math.round(kFactor * marginMult * (winA - expectedA));
    const changeB = -changeA;

    return {
        newA: rA + changeA,
        newB: rB + changeB,
        newRating1: rA + changeA,
        newRating2: rB + changeB,
        changeA: changeA,
        changeB: changeB,
        delta1: changeA,
        delta2: changeB,
        winA: winA === 1
    };
}

function calculateDoublesElo(rating1A, rating1B, rating2A, rating2B, score1, score2, kFactor = 32) {
    const r1A = typeof rating1A === 'number' && !isNaN(rating1A) ? rating1A : 1000;
    const r1B = typeof rating1B === 'number' && !isNaN(rating1B) ? rating1B : 1000;
    const r2A = typeof rating2A === 'number' && !isNaN(rating2A) ? rating2A : 1000;
    const r2B = typeof rating2B === 'number' && !isNaN(rating2B) ? rating2B : 1000;

    const team1Avg = (r1A + r1B) / 2;
    const team2Avg = (r2A + r2B) / 2;

    const eloResult = calculateElo(team1Avg, team2Avg, score1, score2, kFactor);

    return {
        new1A: r1A + eloResult.changeA,
        new1B: r1B + eloResult.changeA,
        new2A: r2A + eloResult.changeB,
        new2B: r2B + eloResult.changeB,
        newRating1A: r1A + eloResult.changeA,
        newRating1B: r1B + eloResult.changeA,
        newRating2A: r2A + eloResult.changeB,
        newRating2B: r2B + eloResult.changeB,
        changeTeam1: eloResult.changeA,
        changeTeam2: eloResult.changeB,
        deltaTeam1: eloResult.changeA,
        deltaTeam2: eloResult.changeB,
        win1: eloResult.winA
    };
}

// ID Generator Helpers
function generateMemberId() {
    const members = getMembers();
    let max = 0;
    members.forEach(m => {
        const num = parseInt(m.id.replace('MEM', ''), 10);
        if (num > max) max = num;
    });
    return 'MEM' + String(max + 1).padStart(3, '0');
}

function generateMemberCode() {
    const members = getMembers();
    let max = 0;
    members.forEach(m => {
        const num = parseInt((m.code || '').replace('TV', ''), 10);
        if (num > max) max = num;
    });
    return 'TV' + String(max + 1).padStart(3, '0');
}

function generateTournamentId() {
    const tournaments = getTournaments();
    let max = 0;
    tournaments.forEach(t => {
        const num = parseInt(t.id.replace('TOUR', ''), 10);
        if (num > max) max = num;
    });
    return 'TOUR' + String(max + 1).padStart(3, '0');
}

function generateMatchId() {
    const matches = getMatches();
    let max = 0;
    matches.forEach(m => {
        const num = parseInt(m.id.replace('MATCH', ''), 10);
        if (num > max) max = num;
    });
    return 'MATCH' + String(max + 1).padStart(3, '0');
}

// Avatar Image Renderer (Supports uploaded photo or initials fallback)
function renderMemberAvatarHTML(member, sizeClass = 'member-avatar-sm', extraStyle = '') {
    if (!member) {
        return `<div class="${sizeClass}" style="background-color: #2563eb; ${extraStyle}">TV</div>`;
    }

    if (member.avatarUrl) {
        return `<img src="${member.avatarUrl}" alt="${member.name}" class="${sizeClass} member-avatar-img" style="object-fit: cover; border-radius: 50%; ${extraStyle}">`;
    }

    const bg = member.avatarBg || '#2563eb';
    const initials = getInitials(member.name);
    return `<div class="${sizeClass}" style="background-color: ${bg}; ${extraStyle}">${initials}</div>`;
}

// Avatar Initials & Color Generator
const AVATAR_COLORS = [
    '#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626',
    '#db2777', '#0891b2', '#ea580c', '#16a34a', '#4f46e5'
];

function getRandomAvatarColor() {
    return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function getInitials(name) {
    if (!name) return 'TV';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getLevelBadgeHTML(level) {
    if (level === 'Mới chơi') return '<span class="badge badge-success">Mới chơi</span>';
    if (level === 'Trung bình') return '<span class="badge badge-primary">Trung bình</span>';
    if (level === 'Khá') return '<span class="badge badge-warning">Khá</span>';
    return '<span class="badge badge-primary">Trung bình</span>';
}

function formatDate(dateStr) {
    if (!dateStr) return '---';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
}

function formatDateTime(dateStr) {
    if (!dateStr) return '---';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return dateStr;
    }
}

function toggleEloGuideCard() {
    const content = document.getElementById('eloGuideContent');
    if (!content) return;
    if (content.style.display === 'none') {
        content.style.display = 'block';
    } else {
        content.style.display = 'none';
    }
}

function calculateWinRate(wins = 0, matches = 0) {
    if (!matches || matches === 0) return '0%';
    return Math.round((wins / matches) * 100) + '%';
}
