/**
 * Matches Module - FRIENDS PICKLEBALL CLUB
 * Manages match score entries & Knockout matchup selection (Tứ kết, Bán kết, Chung kết) for Singles (1v1) & Doubles (2v2),
 * enforces 15-point rule for non-final matches & 21-point rule for Final match,
 * automatic Elo rating calculations, win/loss stats updates, and score UNDO.
 */

let currentScoringMatch = null;

/**
 * Score Stepper (+ / -) helper for mobile touch entry
 */
function stepScore(pNum, amount) {
    const inputId = pNum === 1 ? 'scoreP1Input' : 'scoreP2Input';
    const inputEl = document.getElementById(inputId);
    if (!inputEl) return;

    let currentVal = parseInt(inputEl.value, 10);
    if (isNaN(currentVal)) currentVal = 0;

    currentVal = Math.max(0, currentVal + amount);
    inputEl.value = currentVal;
}

function openScoreModal(matchId) {
    if (typeof checkAdminPermission === 'function' && !checkAdminPermission()) return;
    const matches = getMatches();
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    currentScoringMatch = match;

    document.getElementById('matchScoreId').value = match.id;
    document.getElementById('matchTournamentId').value = match.tournamentId || '';

    const roundNameLower = (match.roundName || '').toLowerCase();
    const isFinal = roundNameLower.includes('chung kết') && !roundNameLower.includes('tứ kết') && !roundNameLower.includes('bán kết');

    const ruleBadgeText = isFinal 
        ? '🏆 TRẬN CHUNG KẾT: Đội nào chạm 21 điểm trước sẽ thắng!' 
        : '⚡ THỂ THỨC (BẢNG / TỨ KẾT / BÁN KẾT): Đội nào chạm 15 điểm trước sẽ thắng!';

    const titleEl = document.getElementById('matchModalRoundTitle');
    if (titleEl) {
        titleEl.innerHTML = `
            <div class="fw-bold fs-5 text-white mb-1">${match.roundName || 'Trận đấu'} • ${match.court || 'Sân 1'}</div>
            <div class="badge ${isFinal ? 'badge-warning' : 'badge-primary'} p-2 mt-1">${ruleBadgeText}</div>
        `;
    }

    const isDoubles = match.matchType === 'doubles' || !!match.player1B;

    const singlesContainer = document.getElementById('matchScoreSinglesContainer');
    const doublesContainer = document.getElementById('matchScoreDoublesContainer');

    const members = getMembers().filter(m => m.status === 'active');
    const tour = match.tournamentId ? getTournamentById(match.tournamentId) : null;

    if (isDoubles) {
        if (singlesContainer) singlesContainer.style.display = 'none';
        if (doublesContainer) doublesContainer.style.display = 'flex';

        // 1. Populate Doubles Team Selectors (from tour.doublesTeams)
        populateDoublesTeamsDropdowns(tour, match);

        // 2. Populate Individual Member Selectors (P1A, P1B, P2A, P2B)
        populateDoublesMemberSelects(match);
    } else {
        if (doublesContainer) doublesContainer.style.display = 'none';
        if (singlesContainer) singlesContainer.style.display = 'flex';

        // Populate Singles Matchup Selector Dropdowns
        populateSinglesMatchupSelects(tour, match, members);
    }

    const defaultWinningScore = isFinal ? 21 : 15;
    document.getElementById('scoreP1Input').value = match.score1 !== undefined && match.score1 !== null ? match.score1 : defaultWinningScore;
    document.getElementById('scoreP2Input').value = match.score2 !== undefined && match.score2 !== null ? match.score2 : (defaultWinningScore - 3);

    openModal('matchScoreModal');
}

function populateSinglesMatchupSelects(tour, match, members) {
    const p1Select = document.getElementById('singlesP1Select');
    const p2Select = document.getElementById('singlesP2Select');
    if (!p1Select || !p2Select) return;

    let optionsHtml = `<option value="">-- Chọn VĐV --</option>`;

    // If tournament has specific selected players, prioritize them
    const tourPlayerIds = tour?.players || [];
    const pool = tourPlayerIds.length > 0 
        ? tourPlayerIds.map(id => getMemberById(id)).filter(Boolean)
        : members;

    pool.forEach(m => {
        optionsHtml += `<option value="${m.id}">${m.name} (${m.rating} Elo)</option>`;
    });

    // If match has a custom placeholder name (e.g. "Nhất Bảng A"), add it as placeholder option
    if (match.player1Name && !pool.some(m => m.id === match.player1)) {
        optionsHtml += `<option value="${match.player1 || match.player1Name}" selected>${match.player1Name}</option>`;
    }
    if (match.player2Name && !pool.some(m => m.id === match.player2)) {
        optionsHtml += `<option value="${match.player2 || match.player2Name}" selected>${match.player2Name}</option>`;
    }

    p1Select.innerHTML = optionsHtml;
    p2Select.innerHTML = optionsHtml;

    if (match.player1) p1Select.value = match.player1;
    if (match.player2) p2Select.value = match.player2;

    updateMatchPlayerRatingDisplay('singles', 1);
    updateMatchPlayerRatingDisplay('singles', 2);
}

function updateMatchPlayerRatingDisplay(type, pNum) {
    if (type === 'singles') {
        const selectId = pNum === 1 ? 'singlesP1Select' : 'singlesP2Select';
        const ratingId = pNum === 1 ? 'scoreP1Rating' : 'scoreP2Rating';

        const val = document.getElementById(selectId)?.value;
        const m = getMemberById(val);
        const el = document.getElementById(ratingId);
        if (el) {
            el.textContent = m ? `Rating: ${m.rating} Elo` : 'Chưa xếp hạng';
        }
    }
}

function populateDoublesTeamsDropdowns(tour, match) {
    const t1Select = document.getElementById('doublesTeam1Select');
    const t2Select = document.getElementById('doublesTeam2Select');
    if (!t1Select || !t2Select) return;

    const teams = tour?.doublesTeams || [];
    let optionsHtml = `<option value="">-- Chọn Cặp đấu đôi --</option>`;

    teams.forEach((t, idx) => {
        const p1 = getMemberById(t.p1);
        const p2 = getMemberById(t.p2);
        const avgElo = (p1 && p2) ? Math.round((p1.rating + p2.rating) / 2) : 1000;
        optionsHtml += `<option value="${t.id}" data-p1="${t.p1}" data-p2="${t.p2}">Cặp #${idx + 1}: ${p1 ? p1.name : 'A'} + ${p2 ? p2.name : 'B'} (${avgElo} Elo)</option>`;
    });

    // Custom placeholder option for Knockout placeholders (e.g. "Thắng Tứ kết 1")
    if (match.player1Name && !teams.some(t => t.id === match.team1Id)) {
        optionsHtml += `<option value="placeholder_1" selected>${match.player1Name}</option>`;
    }
    if (match.player2Name && !teams.some(t => t.id === match.team2Id)) {
        optionsHtml += `<option value="placeholder_2" selected>${match.player2Name}</option>`;
    }

    t1Select.innerHTML = optionsHtml;
    t2Select.innerHTML = optionsHtml;

    if (match.team1Id) t1Select.value = match.team1Id;
    if (match.team2Id) t2Select.value = match.team2Id;
}

function handleDoublesTeamSelectChange(teamNum) {
    const selectId = teamNum === 1 ? 'doublesTeam1Select' : 'doublesTeam2Select';
    const selectEl = document.getElementById(selectId);
    if (!selectEl) return;

    const tourId = document.getElementById('matchTournamentId').value;
    const tour = getTournamentById(tourId);
    if (!tour) return;

    const teamId = selectEl.value;
    const team = (tour.doublesTeams || []).find(t => t.id === teamId);

    if (team) {
        if (teamNum === 1) {
            document.getElementById('doublesP1ASelect').value = team.p1;
            document.getElementById('doublesP1BSelect').value = team.p2;
        } else {
            document.getElementById('doublesP2ASelect').value = team.p1;
            document.getElementById('doublesP2BSelect').value = team.p2;
        }
    }
}

function populateDoublesMemberSelects(match) {
    const members = getMembers().filter(m => m.status === 'active');
    let optionsHtml = '';
    members.forEach(m => {
        optionsHtml += `<option value="${m.id}">${m.name} (${m.rating} Elo)</option>`;
    });

    const p1ASelect = document.getElementById('doublesP1ASelect');
    const p1BSelect = document.getElementById('doublesP1BSelect');
    const p2ASelect = document.getElementById('doublesP2ASelect');
    const p2BSelect = document.getElementById('doublesP2BSelect');

    if (p1ASelect) {
        p1ASelect.innerHTML = optionsHtml;
        if (match.player1) p1ASelect.value = match.player1;
    }
    if (p1BSelect) {
        p1BSelect.innerHTML = optionsHtml;
        if (match.player1B) p1BSelect.value = match.player1B;
    }
    if (p2ASelect) {
        p2ASelect.innerHTML = optionsHtml;
        if (match.player2) p2ASelect.value = match.player2;
    }
    if (p2BSelect) {
        p2BSelect.innerHTML = optionsHtml;
        if (match.player2B) p2BSelect.value = match.player2B;
    }
}

function saveMatchScoreForm(e) {
    e.preventDefault();

    const matchId = document.getElementById('matchScoreId').value;
    const score1 = parseInt(document.getElementById('scoreP1Input').value, 10);
    const score2 = parseInt(document.getElementById('scoreP2Input').value, 10);

    if (isNaN(score1) || isNaN(score2)) {
        showToast('Vui lòng nhập tỉ số điểm hợp lệ!', 'warning');
        return;
    }

    if (score1 === score2) {
        showToast('Trận đấu Pickleball không có tỉ số hòa! Vui lòng kiểm tra lại.', 'warning');
        return;
    }

    let matches = getMatches();
    const matchIndex = matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    let match = matches[matchIndex];
    const roundNameLower = (match.roundName || '').toLowerCase();
    const isFinal = roundNameLower.includes('chung kết') && !roundNameLower.includes('tứ kết') && !roundNameLower.includes('bán kết');
    const requiredWinningScore = isFinal ? 21 : 15;

    const maxScore = Math.max(score1, score2);
    if (maxScore < requiredWinningScore) {
        showToast(isFinal ? 'Trận Chung kết cần thi đấu đến 21 điểm mới kết thúc!' : 'Các trận vòng ngoài thi đấu chạm 15 điểm mới thắng!', 'warning');
        return;
    }

    pushUndoSnapshot(`Cập nhật tỉ số trận ${matchId} (${score1} - ${score2})`);

    let members = getMembers();
    const settings = getSettings();

    const isDoubles = match.matchType === 'doubles' || document.getElementById('matchScoreDoublesContainer')?.style.display !== 'none';

    // If match was previously completed, reverse stats first
    if (match.status === 'completed') {
        revertMatchStats(match, members);
    }

    const p1Wins = score1 > score2;

    if (isDoubles) {
        // --- 2 VS 2 DOUBLES MATCH SCORE & PAIR SELECTION ---
        const p1AId = document.getElementById('doublesP1ASelect')?.value;
        const p1BId = document.getElementById('doublesP1BSelect')?.value;
        const p2AId = document.getElementById('doublesP2ASelect')?.value;
        const p2BId = document.getElementById('doublesP2BSelect')?.value;

        if (!p1AId || !p1BId || !p2AId || !p2BId) {
            showToast('Vui lòng chọn đầy đủ 4 VĐV cho trận đấu đôi!', 'warning');
            return;
        }

        if (new Set([p1AId, p1BId, p2AId, p2BId]).size < 4) {
            showToast('Không thể chọn trùng một VĐV trong trận đấu đôi!', 'warning');
            return;
        }

        const p1A = members.find(m => m.id === p1AId);
        const p1B = members.find(m => m.id === p1BId);
        const p2A = members.find(m => m.id === p2AId);
        const p2B = members.find(m => m.id === p2BId);

        match.player1 = p1AId;
        match.player1B = p1BId;
        match.player2 = p2AId;
        match.player2B = p2BId;
        match.matchType = 'doubles';

        // Calculate Doubles Elo
        const doublesElo = calculateDoublesElo(p1A.rating, p1B.rating, p2A.rating, p2B.rating, score1, score2, settings.kFactor || 32);

        match.ratingBefore1 = p1A.rating;
        match.ratingBefore1B = p1B.rating;
        match.ratingBefore2 = p2A.rating;
        match.ratingBefore2B = p2B.rating;

        p1A.rating = doublesElo.newRating1A;
        p1B.rating = doublesElo.newRating1B;
        p2A.rating = doublesElo.newRating2A;
        p2B.rating = doublesElo.newRating2B;

        match.ratingAfter1 = p1A.rating;
        match.ratingAfter1B = p1B.rating;
        match.ratingAfter2 = p2A.rating;
        match.ratingAfter2B = p2B.rating;

        match.ratingDelta1 = doublesElo.deltaTeam1;
        match.ratingDelta2 = doublesElo.deltaTeam2;

        [p1A, p1B].forEach(p => {
            p.matches = (p.matches || 0) + 1;
            if (p1Wins) p.wins = (p.wins || 0) + 1;
            else p.losses = (p.losses || 0) + 1;
        });

        [p2A, p2B].forEach(p => {
            p.matches = (p.matches || 0) + 1;
            if (!p1Wins) p.wins = (p.wins || 0) + 1;
            else p.losses = (p.losses || 0) + 1;
        });

        match.winner = p1Wins ? `${p1A.name} & ${p1B.name}` : `${p2A.name} & ${p2B.name}`;
        match.player1Name = `${p1A.name} + ${p1B.name}`;
        match.player2Name = `${p2A.name} + ${p2B.name}`;

    } else {
        // --- 1 VS 1 SINGLES MATCH SCORE & PLAYER SELECTION ---
        const p1Id = document.getElementById('singlesP1Select')?.value;
        const p2Id = document.getElementById('singlesP2Select')?.value;

        if (!p1Id || !p2Id) {
            showToast('Vui lòng chọn 2 VĐV cho trận đấu đơn!', 'warning');
            return;
        }

        if (p1Id === p2Id) {
            showToast('VĐV 1 và VĐV 2 không thể trùng nhau!', 'warning');
            return;
        }

        const p1 = members.find(m => m.id === p1Id);
        const p2 = members.find(m => m.id === p2Id);

        match.player1 = p1Id;
        match.player2 = p2Id;

        if (p1 && p2) {
            match.ratingBefore1 = p1.rating;
            match.ratingBefore2 = p2.rating;

            const eloResult = calculateElo(p1.rating, p2.rating, score1, score2, settings.kFactor || 32);

            p1.rating = eloResult.newRating1;
            p2.rating = eloResult.newRating2;

            match.ratingAfter1 = p1.rating;
            match.ratingAfter2 = p2.rating;
            match.ratingDelta1 = eloResult.delta1;
            match.ratingDelta2 = eloResult.delta2;

            p1.matches = (p1.matches || 0) + 1;
            p2.matches = (p2.matches || 0) + 1;

            if (p1Wins) {
                p1.wins = (p1.wins || 0) + 1;
                p2.losses = (p2.losses || 0) + 1;
                match.winner = p1.id;
            } else {
                p2.wins = (p2.wins || 0) + 1;
                p1.losses = (p1.losses || 0) + 1;
                match.winner = p2.id;
            }

            match.player1Name = p1.name;
            match.player2Name = p2.name;
        } else {
            match.player1Name = document.getElementById('singlesP1Select')?.options[document.getElementById('singlesP1Select').selectedIndex]?.text || p1Id;
            match.player2Name = document.getElementById('singlesP2Select')?.options[document.getElementById('singlesP2Select').selectedIndex]?.text || p2Id;
        }
    }

    match.score1 = score1;
    match.score2 = score2;
    match.status = 'completed';
    match.completedAt = new Date().toISOString();

    saveMatches(matches);
    saveMembers(members);

    closeModal('matchScoreModal');

    renderTournamentsList();
    if (match.tournamentId) viewTournamentDetails(match.tournamentId);
    renderMatchesHistoryTable();
    renderMembersTable();
    renderRankingsTable();
    if (typeof updateDashboard === 'function') updateDashboard();

    showToast(`✅ Đã chọn cặp đấu, lưu tỉ số (${score1} - ${score2}) & cập nhật Elo!`, 'success');
}

/**
 * Reverts stats and rating changes if editing a completed match
 */
function revertMatchStats(match, members) {
    if (!match || match.status !== 'completed') return;

    const isDoubles = match.matchType === 'doubles' || !!match.player1B;

    if (isDoubles) {
        const p1A = members.find(m => m.id === match.player1);
        const p1B = members.find(m => m.id === match.player1B);
        const p2A = members.find(m => m.id === match.player2);
        const p2B = members.find(m => m.id === match.player2B);

        const delta1 = match.ratingDelta1 || 0;
        const delta2 = match.ratingDelta2 || 0;

        if (p1A) {
            p1A.rating = Math.max(100, p1A.rating - delta1);
            p1A.matches = Math.max(0, (p1A.matches || 0) - 1);
            if (match.score1 > match.score2) p1A.wins = Math.max(0, (p1A.wins || 0) - 1);
            else p1A.losses = Math.max(0, (p1A.losses || 0) - 1);
        }
        if (p1B) {
            p1B.rating = Math.max(100, p1B.rating - delta1);
            p1B.matches = Math.max(0, (p1B.matches || 0) - 1);
            if (match.score1 > match.score2) p1B.wins = Math.max(0, (p1B.wins || 0) - 1);
            else p1B.losses = Math.max(0, (p1B.losses || 0) - 1);
        }
        if (p2A) {
            p2A.rating = Math.max(100, p2A.rating - delta2);
            p2A.matches = Math.max(0, (p2A.matches || 0) - 1);
            if (match.score2 > match.score1) p2A.wins = Math.max(0, (p2A.wins || 0) - 1);
            else p2A.losses = Math.max(0, (p2A.losses || 0) - 1);
        }
        if (p2B) {
            p2B.rating = Math.max(100, p2B.rating - delta2);
            p2B.matches = Math.max(0, (p2B.matches || 0) - 1);
            if (match.score2 > match.score1) p2B.wins = Math.max(0, (p2B.wins || 0) - 1);
            else p2B.losses = Math.max(0, (p2B.losses || 0) - 1);
        }

    } else {
        const p1 = members.find(m => m.id === match.player1);
        const p2 = members.find(m => m.id === match.player2);

        const delta1 = match.ratingDelta1 || 0;
        const delta2 = match.ratingDelta2 || 0;

        if (p1) {
            p1.rating = Math.max(100, p1.rating - delta1);
            p1.matches = Math.max(0, (p1.matches || 0) - 1);
            if (match.score1 > match.score2) p1.wins = Math.max(0, (p1.wins || 0) - 1);
            else p1.losses = Math.max(0, (p1.losses || 0) - 1);
        }
        if (p2) {
            p2.rating = Math.max(100, p2.rating - delta2);
            p2.matches = Math.max(0, (p2.matches || 0) - 1);
            if (match.score2 > match.score1) p2.wins = Math.max(0, (p2.wins || 0) - 1);
            else p2.losses = Math.max(0, (p2.losses || 0) - 1);
        }
    }
}

function openMatchScoreModal(matchId) {
    openScoreModal(matchId);
}

function renderMatchesHistoryTable() {
    const body = document.getElementById('matchesHistoryBody');
    if (!body) return;

    const tourFilter = document.getElementById('matchHistoryTourFilter')?.value || 'all';
    let matches = getMatches();

    if (tourFilter !== 'all') {
        matches = matches.filter(m => m.tournamentId === tourFilter);
    }

    const select = document.getElementById('matchHistoryTourFilter');
    if (select && select.options.length <= 1) {
        const tours = getTournaments();
        tours.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            select.appendChild(opt);
        });
    }

    let html = '';
    let mobileHtml = '';

    matches.reverse().forEach((m, idx) => {
        const tour = getTournamentById(m.tournamentId);
        const tourName = tour ? tour.name : 'Giao hữu CLB';

        let p1Name = m.player1Name;
        let p2Name = m.player2Name;

        if (!p1Name) {
            const p1 = getMemberById(m.player1);
            p1Name = p1 ? p1.name : (m.player1 || 'VĐV 1');
        }
        if (!p2Name) {
            const p2 = getMemberById(m.player2);
            p2Name = p2 ? p2.name : (m.player2 || 'VĐV 2');
        }

        const isDone = m.status === 'completed';
        const isDoubles = m.matchType === 'doubles';

        html += `
            <tr>
                <td>#${idx + 1}</td>
                <td><small class="text-white fw-bold">${tourName}</small></td>
                <td><span class="badge ${isDoubles ? 'badge-warning' : 'badge-primary'}">${isDoubles ? 'Đôi 2v2' : 'Đơn 1v1'}</span></td>
                <td><span class="${isDone && m.score1 > m.score2 ? 'text-success fw-bold' : ''}">${p1Name}</span></td>
                <td class="text-center fw-bold fs-5">${isDone ? `${m.score1} - ${m.score2}` : 'VS'}</td>
                <td><span class="${isDone && m.score2 > m.score1 ? 'text-success fw-bold' : ''}">${p2Name}</span></td>
                <td><small class="text-muted">${m.completedAt ? formatDate(m.completedAt) : 'Chưa đấu'}</small></td>
                <td>
                    <div class="btn-group-sm d-flex align-items-center gap-1">
                        <button class="btn btn-outline-primary btn-sm" onclick="openScoreModal('${m.id}')">
                            <i class="fas fa-edit"></i> ${isDone ? 'Sửa điểm' : 'Nhập điểm'}
                        </button>
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });

    body.innerHTML = html;
}

// FRIENDLY MATCHES HANDLER
function openAddFriendlyMatchModal() {
    if (typeof checkAdminPermission === 'function' && !checkAdminPermission()) return;
    const form = document.getElementById('friendlyMatchForm');
    if (form) form.reset();

    const members = getMembers().filter(m => m.status === 'active');
    if (members.length < 2) {
        showToast('Cần ít nhất 2 VĐV đang hoạt động để tạo trận giao hữu!', 'warning');
        return;
    }

    let optionsHtml = '';
    members.forEach(m => {
        optionsHtml += `<option value="${m.id}">${m.name} (${m.rating} Elo)</option>`;
    });

    const p1Select = document.getElementById('friendlyP1Select');
    const p2Select = document.getElementById('friendlyP2Select');
    const p1ASelect = document.getElementById('friendlyP1ASelect');
    const p1BSelect = document.getElementById('friendlyP1BSelect');
    const p2ASelect = document.getElementById('friendlyP2ASelect');
    const p2BSelect = document.getElementById('friendlyP2BSelect');

    if (p1Select) p1Select.innerHTML = optionsHtml;
    if (p2Select) p2Select.innerHTML = optionsHtml;
    if (p1ASelect) p1ASelect.innerHTML = optionsHtml;
    if (p1BSelect) p1BSelect.innerHTML = optionsHtml;
    if (p2ASelect) p2ASelect.innerHTML = optionsHtml;
    if (p2BSelect) p2BSelect.innerHTML = optionsHtml;

    if (p1Select && members[0]) p1Select.value = members[0].id;
    if (p2Select && members[1]) p2Select.value = members[1].id;

    if (p1ASelect && members[0]) p1ASelect.value = members[0].id;
    if (p1BSelect && members[1]) p1BSelect.value = members[1].id;
    if (p2ASelect && members[2]) p2ASelect.value = members[2].id;
    if (p2BSelect && members[3]) p2BSelect.value = members[3] ? members[3].id : members[0].id;

    toggleFriendlyMatchTypeUI();
    updateFriendlyRatingPreview();
    openModal('friendlyMatchModal');
}

function toggleFriendlyMatchTypeUI() {
    const type = document.getElementById('friendlyMatchTypeSelect')?.value || 'singles';
    const singlesContainer = document.getElementById('friendlySinglesContainer');
    const doublesContainer = document.getElementById('friendlyDoublesContainer');

    if (type === 'doubles') {
        if (singlesContainer) singlesContainer.style.display = 'none';
        if (doublesContainer) doublesContainer.style.display = 'flex';
    } else {
        if (doublesContainer) doublesContainer.style.display = 'none';
        if (singlesContainer) singlesContainer.style.display = 'flex';
    }
}

function updateFriendlyRatingPreview() {
    const p1Id = document.getElementById('friendlyP1Select')?.value;
    const p2Id = document.getElementById('friendlyP2Select')?.value;

    const p1 = getMemberById(p1Id);
    const p2 = getMemberById(p2Id);

    const elo1 = document.getElementById('friendlyP1Elo');
    const elo2 = document.getElementById('friendlyP2Elo');

    if (elo1) elo1.textContent = p1 ? `Rating: ${p1.rating} Elo` : 'Chưa xếp hạng';
    if (elo2) elo2.textContent = p2 ? `Rating: ${p2.rating} Elo` : 'Chưa xếp hạng';
}

function saveFriendlyMatchForm(e) {
    e.preventDefault();

    const matchType = document.getElementById('friendlyMatchTypeSelect')?.value || 'singles';
    const score1 = parseInt(document.getElementById('friendlyScore1Input')?.value, 10);
    const score2 = parseInt(document.getElementById('friendlyScore2Input')?.value, 10);
    const courtName = document.getElementById('friendlyCourtInput')?.value.trim() || 'Sân Giao hữu Friends Club';

    if (isNaN(score1) || isNaN(score2)) {
        showToast('Vui lòng nhập tỉ số điểm hợp lệ!', 'warning');
        return;
    }

    if (score1 === score2) {
        showToast('Trận đấu Pickleball không có tỉ số hòa! Vui lòng chọn bên chiến thắng.', 'warning');
        return;
    }

    pushUndoSnapshot(`Thêm trận giao hữu ${matchType === 'doubles' ? 'Đôi 2v2' : 'Đơn 1v1'} (${score1} - ${score2})`);

    let members = getMembers();
    const settings = getSettings();
    const isWin1 = score1 > score2;

    const newMatch = {
        id: generateMatchId(),
        tournamentId: 'FRIENDLY',
        matchType: matchType,
        roundName: 'Giao hữu CLB',
        court: courtName,
        score1: score1,
        score2: score2,
        status: 'completed',
        completedAt: new Date().toISOString(),
        playedAt: new Date().toISOString()
    };

    if (matchType === 'doubles') {
        const p1AId = document.getElementById('friendlyP1ASelect')?.value;
        const p1BId = document.getElementById('friendlyP1BSelect')?.value;
        const p2AId = document.getElementById('friendlyP2ASelect')?.value;
        const p2BId = document.getElementById('friendlyP2BSelect')?.value;

        if (!p1AId || !p1BId || !p2AId || !p2BId) {
            showToast('Vui lòng chọn đầy đủ 4 VĐV cho trận đấu đôi giao hữu!', 'warning');
            return;
        }

        if (new Set([p1AId, p1BId, p2AId, p2BId]).size < 4) {
            showToast('Không thể chọn trùng một VĐV trong trận đấu đôi giao hữu!', 'warning');
            return;
        }

        const p1A = members.find(m => m.id === p1AId);
        const p1B = members.find(m => m.id === p1BId);
        const p2A = members.find(m => m.id === p2AId);
        const p2B = members.find(m => m.id === p2BId);

        newMatch.player1 = p1AId;
        newMatch.player1B = p1BId;
        newMatch.player2 = p2AId;
        newMatch.player2B = p2BId;
        newMatch.player1Name = `${p1A.name} + ${p1B.name}`;
        newMatch.player2Name = `${p2A.name} + ${p2B.name}`;

        const doublesElo = calculateDoublesElo(p1A.rating, p1B.rating, p2A.rating, p2B.rating, score1, score2, settings.kFactor || 32);

        newMatch.ratingBefore1 = p1A.rating;
        newMatch.ratingBefore1B = p1B.rating;
        newMatch.ratingBefore2 = p2A.rating;
        newMatch.ratingBefore2B = p2B.rating;

        p1A.rating = doublesElo.new1A;
        p1B.rating = doublesElo.new1B;
        p2A.rating = doublesElo.new2A;
        p2B.rating = doublesElo.new2B;

        newMatch.ratingAfter1 = p1A.rating;
        newMatch.ratingAfter1B = p1B.rating;
        newMatch.ratingAfter2 = p2A.rating;
        newMatch.ratingAfter2B = p2B.rating;

        newMatch.ratingDelta1 = doublesElo.changeTeam1;
        newMatch.ratingDelta2 = doublesElo.changeTeam2;

        newMatch.winner = isWin1 ? `${p1A.name} & ${p1B.name}` : `${p2A.name} & ${p2B.name}`;

    } else {
        const p1Id = document.getElementById('friendlyP1Select')?.value;
        const p2Id = document.getElementById('friendlyP2Select')?.value;

        if (!p1Id || !p2Id) {
            showToast('Vui lòng chọn 2 VĐV cho trận đấu đơn giao hữu!', 'warning');
            return;
        }

        if (p1Id === p2Id) {
            showToast('VĐV 1 và VĐV 2 không thể trùng nhau!', 'warning');
            return;
        }

        const p1 = members.find(m => m.id === p1Id);
        const p2 = members.find(m => m.id === p2Id);

        newMatch.player1 = p1Id;
        newMatch.player2 = p2Id;
        newMatch.player1Name = p1 ? p1.name : p1Id;
        newMatch.player2Name = p2 ? p2.name : p2Id;

        newMatch.ratingBefore1 = p1.rating;
        newMatch.ratingBefore2 = p2.rating;

        const eloResult = calculateElo(p1.rating, p2.rating, score1, score2, settings.kFactor || 32);

        p1.rating = eloResult.newA;
        p2.rating = eloResult.newB;

        newMatch.ratingAfter1 = p1.rating;
        newMatch.ratingAfter2 = p2.rating;
        newMatch.ratingDelta1 = eloResult.changeA;
        newMatch.ratingDelta2 = eloResult.changeB;

        newMatch.winner = isWin1 ? p1.id : p2.id;
    }

    let matches = getMatches();
    matches.push(newMatch);

    saveMatches(matches);
    saveMembers(members);

    closeModal('friendlyMatchModal');

    renderMatchesHistoryTable();
    renderMembersTable();
    if (typeof renderRankings === 'function') renderRankings();
    if (typeof updateDashboard === 'function') updateDashboard();

    showToast(`🤝 Đã lưu trận giao hữu (${score1} - ${score2}) & cập nhật Elo thành công!`, 'success');
}

function deleteFriendlyMatch(matchId) {
    const matches = getMatches();
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    confirmDialog(
        '🗑️ XÓA TRẬN GIAO HỮU',
        `Bạn có chắc chắn muốn xóa trận giao hữu này? Điểm Elo đã tính từ trận này sẽ được KHÔI PHỤC lại!`,
        () => {
            pushUndoSnapshot(`Xóa trận giao hữu ${matchId}`);
            let members = getMembers();

            if (match.status === 'completed') {
                revertMatchStats(match, members);
            }

            const remaining = matches.filter(m => m.id !== matchId);
            saveMatches(remaining);
            saveMembers(members);

            renderMatchesHistoryTable();
            renderMembersTable();
            if (typeof renderRankings === 'function') renderRankings();
            if (typeof updateDashboard === 'function') updateDashboard();

            showToast('🗑️ Đã xóa trận giao hữu và khôi phục điểm Elo!', 'info');
        }
    );
}

// Global score forms submit listener
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('matchScoreForm');
    if (form) form.addEventListener('submit', saveMatchScoreForm);

    const friendlyForm = document.getElementById('friendlyMatchForm');
    if (friendlyForm) friendlyForm.addEventListener('submit', saveFriendlyMatchForm);
});
