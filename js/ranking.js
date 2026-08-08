/**
 * Ranking Module - FRIENDS PICKLEBALL CLUB
 * Club Rankings, Top 3 Award Podium (Bục nhận giải), Column Sorting, Filters, TV Screen Mode, and Recent Elo Delta tracking (+/- Elo per match/tour).
 */

let currentSortKey = 'rating';
let currentSortOrder = 'desc';

function renderRankings() {
    renderTop3Podium();
    renderRankingsTable();
}

/**
 * Calculates net Elo rating change (+/- Elo) from the player's most recent completed match
 */
function getMemberRecentEloDelta(memberId) {
    const matches = getMatches().filter(m => m.status === 'completed');
    const myMatches = matches.filter(m => 
        m.player1 === memberId || 
        m.player2 === memberId || 
        m.player1B === memberId || 
        m.player2B === memberId
    );

    if (myMatches.length === 0) return 0;

    const lastMatch = myMatches[myMatches.length - 1];
    const isTeam1 = lastMatch.player1 === memberId || lastMatch.player1B === memberId;

    if (isTeam1) {
        if (lastMatch.ratingDelta1 !== undefined && lastMatch.ratingDelta1 !== null) {
            return lastMatch.ratingDelta1;
        }
        if (lastMatch.ratingAfter1 && lastMatch.ratingBefore1) {
            return lastMatch.ratingAfter1 - lastMatch.ratingBefore1;
        }
    } else {
        if (lastMatch.ratingDelta2 !== undefined && lastMatch.ratingDelta2 !== null) {
            return lastMatch.ratingDelta2;
        }
        if (lastMatch.ratingAfter2 && lastMatch.ratingBefore2) {
            return lastMatch.ratingAfter2 - lastMatch.ratingBefore2;
        }
    }

    return 0;
}

function formatEloDeltaHTML(delta) {
    if (delta > 0) {
        return `<span class="badge badge-success text-white fw-bold" style="font-size: 0.95rem;"><i class="fas fa-arrow-up"></i> +${delta} Elo</span>`;
    } else if (delta < 0) {
        return `<span class="badge badge-danger text-white fw-bold" style="font-size: 0.95rem;"><i class="fas fa-arrow-down"></i> ${delta} Elo</span>`;
    }
    return `<span class="badge badge-dark text-muted" style="font-size: 0.9rem;">+0 Elo</span>`;
}

/**
 * 3D Award Ceremony Podium Showcase
 */
function renderTop3Podium() {
    const podiumContainer = document.getElementById('topPodiumContainer');
    if (!podiumContainer) return;

    let members = getMembers().filter(m => m.status === 'active');
    members.sort((a, b) => b.rating - a.rating);

    const top1 = members[0];
    const top2 = members[1];
    const top3 = members[2];

    if (!top1) {
        podiumContainer.innerHTML = '<div class="col-12 text-center text-muted py-4">Chưa có dữ liệu vận động viên.</div>';
        return;
    }

    const formatDeltaStr = (id) => {
        const delta = getMemberRecentEloDelta(id);
        if (delta > 0) return `<strong class="text-success">+${delta} Elo</strong>`;
        if (delta < 0) return `<strong class="text-danger">${delta} Elo</strong>`;
        return `<strong class="text-muted">+0 Elo</strong>`;
    };

    podiumContainer.innerHTML = `
        <div class="podium-stage-container">
            <!-- HẠNG 2 (Á QUÂN) - BÊN TRÁI -->
            ${top2 ? `
                <div class="podium-step-wrapper silver">
                    <div class="podium-player-card">
                        <div class="podium-avatar-frame">
                            ${renderMemberAvatarHTML(top2, 'podium-avatar-img')}
                        </div>
                        <h4 class="podium-player-name">${top2.name}</h4>
                        <div class="podium-player-elo text-info">${top2.rating} <small>Elo</small></div>
                        <div class="podium-player-sub">Trận gần nhất: ${formatDeltaStr(top2.id)}</div>
                        <div class="podium-player-sub">Win Rate: <strong>${calculateWinRate(top2.wins, top2.matches)}</strong></div>
                    </div>
                    <div class="podium-block silver">
                        <div class="podium-medal">🥈</div>
                        <div class="podium-number">2</div>
                        <div class="podium-rank-label">HẠNG 2</div>
                    </div>
                </div>
            ` : ''}

            <!-- HẠNG 1 (VÔ ĐỊCH) - Ở GIỮA (CAO NHẤT) -->
            <div class="podium-step-wrapper gold">
                <div class="podium-player-card">
                    <div class="podium-avatar-frame">
                        <div class="podium-crown-icon">👑</div>
                        ${renderMemberAvatarHTML(top1, 'podium-avatar-img')}
                    </div>
                    <h3 class="podium-player-name text-warning">${top1.name}</h3>
                    <div class="podium-player-elo text-warning">${top1.rating} <small>Elo</small></div>
                    <div class="podium-player-sub">Trận gần nhất: ${formatDeltaStr(top1.id)}</div>
                    <div class="podium-player-sub">Win Rate: <strong>${calculateWinRate(top1.wins, top1.matches)}</strong></div>
                </div>
                <div class="podium-block gold">
                    <div class="podium-medal">🥇</div>
                    <div class="podium-number">1</div>
                    <div class="podium-rank-label">HẠNG 1</div>
                </div>
            </div>

            <!-- HẠNG 3 (HẠNG BA) - BÊN PHẢI -->
            ${top3 ? `
                <div class="podium-step-wrapper bronze">
                    <div class="podium-player-card">
                        <div class="podium-avatar-frame">
                            ${renderMemberAvatarHTML(top3, 'podium-avatar-img')}
                        </div>
                        <h4 class="podium-player-name">${top3.name}</h4>
                        <div class="podium-player-elo" style="color: #cd7f32;">${top3.rating} <small>Elo</small></div>
                        <div class="podium-player-sub">Trận gần nhất: ${formatDeltaStr(top3.id)}</div>
                        <div class="podium-player-sub">Win Rate: <strong>${calculateWinRate(top3.wins, top3.matches)}</strong></div>
                    </div>
                    <div class="podium-block bronze">
                        <div class="podium-medal">🥉</div>
                        <div class="podium-number">3</div>
                        <div class="podium-rank-label">HẠNG 3</div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function renderRankingsTable() {
    const tableBody = document.getElementById('rankingsTableBody');
    if (!tableBody) return;

    const genderFilter = document.getElementById('rankingGenderFilter')?.value || 'all';
    const levelFilter = document.getElementById('rankingLevelFilter')?.value || 'all';
    const searchTerm = (document.getElementById('rankingSearchInput')?.value || '').toLowerCase().trim();

    let members = getMembers();

    let filtered = members.filter(m => {
        const matchSearch = (m.name || '').toLowerCase().includes(searchTerm) || (m.code || '').toLowerCase().includes(searchTerm);
        const matchGender = genderFilter === 'all' || m.gender === genderFilter;
        const matchLevel = levelFilter === 'all' || m.level === levelFilter;
        return matchSearch && matchGender && matchLevel;
    });

    filtered.sort((a, b) => {
        let valA = a[currentSortKey];
        let valB = b[currentSortKey];

        if (currentSortKey === 'winRate') {
            valA = a.matches ? (a.wins / a.matches) : 0;
            valB = b.matches ? (b.wins / b.matches) : 0;
        }

        if (currentSortKey === 'recentEloDelta') {
            valA = getMemberRecentEloDelta(a.id);
            valB = getMemberRecentEloDelta(b.id);
        }

        if (valA === undefined || valA === null) valA = 0;
        if (valB === undefined || valB === null) valB = 0;

        if (currentSortOrder === 'desc') return valB - valA;
        return valA - valB;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-muted">Không có dữ liệu phù hợp.</td></tr>`;
        return;
    }

    let html = '';
    let mobileHtml = '';

    filtered.forEach((m, idx) => {
        let rankBadge = `${idx + 1}`;
        let rowClass = '';
        if (idx === 0) { rankBadge = '🥇 1'; rowClass = 'table-gold'; }
        if (idx === 1) { rankBadge = '🥈 2'; rowClass = 'table-silver'; }
        if (idx === 2) { rankBadge = '🥉 3'; rowClass = 'table-bronze'; }

        const winRate = calculateWinRate(m.wins, m.matches);
        const recentEloDelta = getMemberRecentEloDelta(m.id);
        const eloDeltaBadge = formatEloDeltaHTML(recentEloDelta);

        html += `
            <tr class="${rowClass}">
                <td class="text-center fw-bold">${rankBadge}</td>
                <td>
                    <div class="member-name-cell">
                        ${renderMemberAvatarHTML(m, 'member-avatar-sm')}
                        <div>
                            <strong>${m.name}</strong>
                            <small class="text-muted d-block">${m.code || ''}</small>
                        </div>
                    </div>
                </td>
                <td>${getLevelBadgeHTML(m.level)}</td>
                <td><strong class="text-success fs-5">${m.rating}</strong></td>
                <td>${eloDeltaBadge}</td>
                <td>${m.tournaments || 0}</td>
                <td>${m.matches || 0}</td>
                <td><span class="text-success">${m.wins || 0}</span></td>
                <td><span class="text-danger">${m.losses || 0}</span></td>
                <td><strong>${winRate}%</strong></td>
            </tr>
        `;

        mobileHtml += `
            <div class="ranking-card-mobile card mb-2 ${rowClass}" onclick="viewMemberProfile('${m.id}')" style="cursor: pointer;">
                <div class="card-body p-2 px-3 d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-2">
                        <div class="ranking-rank-num font-bold text-center" style="width: 32px; font-size: 1.1rem;">${rankBadge}</div>
                        ${renderMemberAvatarHTML(m, 'member-avatar-md')}
                        <div>
                            <div class="fw-bold text-white fs-6 mb-1">${m.name}</div>
                            <div class="d-flex align-items-center gap-1">
                                ${getLevelBadgeHTML(m.level)}
                                <span class="text-muted extra-small ms-1">${winRate}% WR</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="text-primary font-bold fs-5">${m.rating} <small class="extra-small text-muted">Elo</small></div>
                        <div class="mt-1">${eloDeltaBadge}</div>
                    </div>
                </div>
            </div>
        `;
    });

    tableBody.innerHTML = html;

    const mobileContainer = document.getElementById('mobileRankingsCardList');
    if (mobileContainer) {
        mobileContainer.innerHTML = mobileHtml;
    }
}

function setRankingSort(key) {
    if (currentSortKey === key) {
        currentSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';
    } else {
        currentSortKey = key;
        currentSortOrder = 'desc';
    }

    document.querySelectorAll('.sort-header').forEach(el => el.classList.remove('active', 'asc', 'desc'));
    const targetEl = document.getElementById(`sort_${key}`);
    if (targetEl) {
        targetEl.classList.add('active', currentSortOrder);
    }

    renderRankingsTable();
}

// TV Broadcast Mode Handler
function toggleTVMode() {
    const tvOverlay = document.getElementById('tvModeOverlay');
    if (!tvOverlay) return;

    if (tvOverlay.classList.contains('active')) {
        tvOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    } else {
        renderTVModeContent();
        tvOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function renderTVModeContent() {
    const container = document.getElementById('tvStandingsList');
    if (!container) return;

    const members = getMembers().filter(m => m.status === 'active');
    members.sort((a, b) => b.rating - a.rating);

    let html = '';
    members.slice(0, 10).forEach((m, idx) => {
        let badge = `#${idx + 1}`;
        if (idx === 0) badge = '🥇 1';
        if (idx === 1) badge = '🥈 2';
        if (idx === 2) badge = '🥉 3';

        const delta = getMemberRecentEloDelta(m.id);
        const deltaStr = delta > 0 ? `+${delta} Elo` : (delta < 0 ? `${delta} Elo` : `+0 Elo`);

        html += `
            <div class="tv-standing-item ${idx < 3 ? `top-${idx + 1}` : ''}">
                <div class="tv-rank">${badge}</div>
                ${renderMemberAvatarHTML(m, 'tv-avatar')}
                <div class="tv-name">${m.name}</div>
                <div class="tv-level">${getLevelBadgeHTML(m.level)}</div>
                <div class="tv-rating">${m.rating} <small>Elo</small></div>
                <div class="tv-pts">${deltaStr} <small>Trận gần nhất</small></div>
            </div>
        `;
    });

    container.innerHTML = html;
}
