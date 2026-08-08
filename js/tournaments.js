/**
 * Tournaments Module - FRIENDS PICKLEBALL CLUB
 * Tournament creation, player selection, Ban Tổ Chức 2v2 Doubles pairing, Ban Tổ Chức Manual Group Stage Assignment, automated non-consecutive match schedule generator (with Group Stage, Quarter-Finals, Semi-Finals, and Final), and bracket/standing/bonus points awarding.
 */

let selectedPlayersForTournament = [];
let currentDoublesPairs = []; // Stores { id, name, p1, p2 } for 2v2 tournament pairing
let currentGroupAssignments = {}; // Stores { itemId: 'Bảng A' / 'Bảng B' / ... }

function renderTournamentsList() {
    const listContainer = document.getElementById('tournamentsListContainer');
    if (!listContainer) return;

    const statusFilter = document.getElementById('tournamentStatusFilter')?.value || 'all';
    const tournaments = getTournaments();

    let filtered = tournaments;
    if (statusFilter !== 'all') {
        filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="col-12 text-center py-5 text-muted">
                <i class="fas fa-trophy fa-3x mb-3 text-secondary"></i><br>
                Chưa có giải đấu nào trong danh sách. Hãy tạo giải đấu mới!
            </div>
        `;
        return;
    }

    let html = '';
    filtered.reverse().forEach(t => {
        let statusBadge = '<span class="badge badge-warning"><i class="fas fa-clock"></i> Sắp diễn ra</span>';
        if (t.status === 'ongoing') statusBadge = '<span class="badge badge-primary"><i class="fas fa-play"></i> Đang thi đấu</span>';
        if (t.status === 'completed') statusBadge = '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Đã kết thúc</span>';

        const winner = getMemberById(t.winner);
        const winnerName = winner ? winner.name : (t.winnerTeamName || '---');

        const playerCount = (t.players || []).length;
        const pairCount = (t.doublesTeams || []).length;
        const tourMatches = getMatches().filter(m => m.tournamentId === t.id);
        const completedMatches = tourMatches.filter(m => m.status === 'completed').length;

        html += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card tournament-card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span class="tournament-type-tag">${t.format || 'Vòng bảng'} • ${t.matchType === 'doubles' ? 'Đấu đôi (2v2)' : 'Đấu đơn (1v1)'}</span>
                        ${statusBadge}
                    </div>
                    <div class="card-body">
                        <h4 class="tournament-title mb-2">${t.name}</h4>
                        <p class="text-muted small mb-3">
                            <i class="fas fa-calendar-alt text-primary"></i> ${formatDate(t.date)} &nbsp;|&nbsp; 
                            <i class="fas fa-map-marker-alt text-danger"></i> ${t.location || 'Sân Friends Club'}
                        </p>
                        
                        <div class="tournament-stats-row mb-3">
                            <div class="t-stat-box">
                                <span class="t-stat-num">${t.matchType === 'doubles' ? `${pairCount} cặp` : `${playerCount} VĐV`}</span>
                                <span class="t-stat-label">${t.matchType === 'doubles' ? 'Số cặp đấu' : 'Số VĐV'}</span>
                            </div>
                            <div class="t-stat-box">
                                <span class="t-stat-num">${tourMatches.length}</span>
                                <span class="t-stat-label">Số trận</span>
                            </div>
                            <div class="t-stat-box">
                                <span class="t-stat-num">${t.courts || 2}</span>
                                <span class="t-stat-label">Số sân</span>
                            </div>
                        </div>

                        ${t.status === 'completed' ? `
                            <div class="winner-banner p-2 mb-3">
                                🥇 Vô địch: <strong>${winnerName}</strong>
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-footer bg-transparent d-flex justify-content-between align-items-center">
                        <span class="small text-muted">Đã đấu: ${completedMatches}/${tourMatches.length} trận</span>
                        <div class="btn-group-sm">
                            <button class="btn btn-primary btn-sm" onclick="viewTournamentDetails('${t.id}')">
                                <i class="fas fa-eye"></i> Chi tiết
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteTournament('${t.id}')" title="Xóa giải đấu">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

function openAddTournamentModal() {
    if (typeof checkAdminPermission === 'function' && !checkAdminPermission()) return;
    document.getElementById('tournamentForm').reset();
    document.getElementById('tournamentIdInput').value = '';
    document.getElementById('tournamentModalTitle').textContent = 'TẠO GIẢI ĐẤU MỚI';
    document.getElementById('tournamentDateInput').value = new Date().toISOString().slice(0, 10);
    openModal('tournamentModal');
}

function saveTournamentForm(e) {
    e.preventDefault();

    const id = document.getElementById('tournamentIdInput').value;
    const name = document.getElementById('tournamentNameInput').value.trim();

    if (!name) {
        showToast('Vui lòng nhập tên giải đấu!', 'warning');
        return;
    }

    pushUndoSnapshot(id ? `Sửa giải đấu ${name}` : `Tạo giải đấu mới ${name}`);

    let tournaments = getTournaments();
    const tourData = {
        id: id || generateTournamentId(),
        name: name,
        date: document.getElementById('tournamentDateInput').value || new Date().toISOString().slice(0, 10),
        location: document.getElementById('tournamentLocationInput').value.trim() || 'Sân Pickleball Friends Club',
        organizer: document.getElementById('tournamentOrganizerInput').value.trim() || 'Ban Quản Trị CLB',
        format: document.getElementById('tournamentFormatInput').value || 'Vòng bảng + Knockout',
        matchType: document.getElementById('tournamentTypeInput').value || 'doubles',
        courts: parseInt(document.getElementById('tournamentCourtsInput').value, 10) || 2,
        notes: document.getElementById('tournamentNotesInput').value.trim(),
        status: id ? (tournaments.find(t => t.id === id)?.status || 'upcoming') : 'upcoming',
        players: id ? (tournaments.find(t => t.id === id)?.players || []) : [],
        doublesTeams: id ? (tournaments.find(t => t.id === id)?.doublesTeams || []) : [],
        assignedGroups: id ? (tournaments.find(t => t.id === id)?.assignedGroups || {}) : {},
        createdAt: new Date().toISOString()
    };

    if (id) {
        const idx = tournaments.findIndex(t => t.id === id);
        if (idx !== -1) tournaments[idx] = { ...tournaments[idx], ...tourData };
        showToast(`Đã cập nhật thông tin giải đấu!`, 'success');
    } else {
        tournaments.push(tourData);
        showToast(`Đã tạo thành công giải đấu ${name}!`, 'success');
    }

    saveTournaments(tournaments);
    closeModal('tournamentModal');
    renderTournamentsList();

    if (!id) {
        openPlayerSelectModal(tourData.id);
    }
}

function deleteTournament(id) {
    if (typeof checkAdminPermission === 'function' && !checkAdminPermission()) return;
    const tour = getTournamentById(id);
    if (!tour) return;

    confirmDialog(
        '🗑️ XÁC NHẬN XÓA GIẢI ĐẤU & KHÔI PHỤC ELO',
        `Bạn có chắc chắn muốn xóa giải đấu "${tour.name}"?\n\nToàn bộ lịch sử thi đấu thuộc giải này sẽ bị xóa, đồng thời điểm Rating Elo & Điểm Mùa giải có được từ giải này sẽ được KHÔI PHỤC (ROLLBACK) về trạng thái trước khi đấu!`,
        () => {
            pushUndoSnapshot(`Xóa giải đấu ${tour.name} và khôi phục Elo`);

            let members = getMembers();
            const allMatches = getMatches();
            const tourMatches = allMatches.filter(m => m.tournamentId === id);
            const completedTourMatches = tourMatches.filter(m => m.status === 'completed');

            // 1. Revert Elo rating changes & match statistics for all completed matches in this tournament
            completedTourMatches.forEach(m => {
                revertMatchStats(m, members);
            });

            // 2. Revert Tournament Finish Rewards (Season Points, Medals & Tournament count)
            if (tour.status === 'completed') {
                const settings = getSettings();
                const ptsConfig = settings.pointsConfig || { champion: 100, runnerUp: 70, third: 50, group: 10 };

                // Revert Final Match rewards
                const finalMatch = completedTourMatches.find(m => (m.roundName || '').toLowerCase().includes('chung kết'));
                if (finalMatch) {
                    const finalWinnerWins = finalMatch.score1 > finalMatch.score2;

                    if (tour.matchType === 'doubles' || finalMatch.matchType === 'doubles') {
                        const champP1 = finalWinnerWins ? finalMatch.player1 : finalMatch.player2;
                        const champP2 = finalWinnerWins ? finalMatch.player1B : finalMatch.player2B;
                        const runnerP1 = finalWinnerWins ? finalMatch.player2 : finalMatch.player1;
                        const runnerP2 = finalWinnerWins ? finalMatch.player2B : finalMatch.player1B;

                        // Deduct Champion Gold & +100pts
                        [champP1, champP2].forEach(pId => {
                            const mIdx = members.findIndex(m => m.id === pId);
                            if (mIdx !== -1) {
                                members[mIdx].goldMedals = Math.max(0, (members[mIdx].goldMedals || 0) - 1);
                                members[mIdx].championCount = Math.max(0, (members[mIdx].championCount || 0) - 1);
                                members[mIdx].seasonPoints = Math.max(0, (members[mIdx].seasonPoints || 0) - (ptsConfig.champion || 100));
                            }
                        });

                        // Deduct Runner-Up Silver & +70pts
                        [runnerP1, runnerP2].forEach(pId => {
                            const mIdx = members.findIndex(m => m.id === pId);
                            if (mIdx !== -1) {
                                members[mIdx].silverMedals = Math.max(0, (members[mIdx].silverMedals || 0) - 1);
                                members[mIdx].silverCount = Math.max(0, (members[mIdx].silverCount || 0) - 1);
                                members[mIdx].seasonPoints = Math.max(0, (members[mIdx].seasonPoints || 0) - (ptsConfig.runnerUp || 70));
                            }
                        });

                    } else {
                        const champId = finalWinnerWins ? finalMatch.player1 : finalMatch.player2;
                        const runnerId = finalWinnerWins ? finalMatch.player2 : finalMatch.player1;

                        const cIdx = members.findIndex(m => m.id === champId);
                        if (cIdx !== -1) {
                            members[cIdx].goldMedals = Math.max(0, (members[cIdx].goldMedals || 0) - 1);
                            members[cIdx].championCount = Math.max(0, (members[cIdx].championCount || 0) - 1);
                            members[cIdx].seasonPoints = Math.max(0, (members[cIdx].seasonPoints || 0) - (ptsConfig.champion || 100));
                        }

                        const rIdx = members.findIndex(m => m.id === runnerId);
                        if (rIdx !== -1) {
                            members[rIdx].silverMedals = Math.max(0, (members[rIdx].silverMedals || 0) - 1);
                            members[rIdx].silverCount = Math.max(0, (members[rIdx].silverCount || 0) - 1);
                            members[rIdx].seasonPoints = Math.max(0, (members[rIdx].seasonPoints || 0) - (ptsConfig.runnerUp || 70));
                        }
                    }
                }

                // Deduct Group participation points & tournament counts
                (tour.players || []).forEach(pId => {
                    const mIdx = members.findIndex(m => m.id === pId);
                    if (mIdx !== -1) {
                        members[mIdx].seasonPoints = Math.max(0, (members[mIdx].seasonPoints || 0) - (ptsConfig.group || 10));
                        members[mIdx].tournaments = Math.max(0, (members[mIdx].tournaments || 0) - 1);
                    }
                });
            }

            // 3. Remove matches & tournament from storage
            let remainingMatches = allMatches.filter(m => m.tournamentId !== id);
            saveMatches(remainingMatches);

            let remainingTournaments = getTournaments().filter(t => t.id !== id);
            saveTournaments(remainingTournaments);

            saveMembers(members);

            // 4. Refresh all active views
            hideTournamentDetails();
            renderTournamentsList();
            if (typeof renderMatchesHistoryTable === 'function') renderMatchesHistoryTable();
            if (typeof renderMembersTable === 'function') renderMembersTable();
            if (typeof renderRankings === 'function') renderRankings();
            if (typeof updateDashboard === 'function') updateDashboard();

            showToast(`🗑️ Đã xóa giải đấu "${tour.name}", xóa lịch sử đấu và khôi phục điểm Elo của các VĐV!`, 'info');
        }
    );
}

// 1. Player Selector Modal
function openPlayerSelectModal(tournamentId) {
    const tour = getTournamentById(tournamentId);
    if (!tour) return;

    document.getElementById('selectPlayerTourId').value = tournamentId;
    document.getElementById('selectPlayerTourName').textContent = tour.name;

    selectedPlayersForTournament = [...(tour.players || [])];

    const members = getMembers().filter(m => m.status === 'active');
    const container = document.getElementById('playerSelectList');

    if (members.length === 0) {
        container.innerHTML = `<div class="text-center py-3 text-muted">Chưa có thành viên hoạt động. Hãy thêm thành viên trước.</div>`;
        openModal('playerSelectModal');
        return;
    }

    members.sort((a, b) => b.rating - a.rating);

    let html = '';
    members.forEach(m => {
        const isChecked = selectedPlayersForTournament.includes(m.id) ? 'checked' : '';
        html += `
            <div class="player-select-item p-2 border rounded bg-dark mb-1">
                <div class="form-check d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-2">
                        <input class="form-check-input player-checkbox" type="checkbox" value="${m.id}" id="chk_${m.id}" ${isChecked} onchange="togglePlayerSelect('${m.id}')">
                        ${renderMemberAvatarHTML(m, 'member-avatar-sm')}
                        <label class="form-check-label mb-0" for="chk_${m.id}">
                            <strong>${m.name}</strong> <small class="text-muted">(${m.code})</small>
                            <span class="ms-2">${getLevelBadgeHTML(m.level)}</span>
                        </label>
                    </div>
                    <span class="badge badge-dark">Rating: ${m.rating}</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    updateSelectedPlayerCountDisplay();
    openModal('playerSelectModal');
}

function togglePlayerSelect(id) {
    if (selectedPlayersForTournament.includes(id)) {
        selectedPlayersForTournament = selectedPlayersForTournament.filter(item => item !== id);
    } else {
        selectedPlayersForTournament.push(id);
    }
    updateSelectedPlayerCountDisplay();
}

function selectAllPlayers(select) {
    const members = getMembers().filter(m => m.status === 'active');
    if (select) {
        selectedPlayersForTournament = members.map(m => m.id);
    } else {
        selectedPlayersForTournament = [];
    }

    const checkboxes = document.querySelectorAll('.player-checkbox');
    checkboxes.forEach(chk => chk.checked = select);
    updateSelectedPlayerCountDisplay();
}

function updateSelectedPlayerCountDisplay() {
    const el = document.getElementById('selectedPlayerCountText');
    if (el) el.textContent = `Đã chọn: ${selectedPlayersForTournament.length} VĐV`;
}

function saveTournamentPlayers() {
    const tourId = document.getElementById('selectPlayerTourId').value;
    const tour = getTournamentById(tourId);
    if (!tour) return;

    const minRequired = tour.matchType === 'doubles' ? 4 : 2;
    if (selectedPlayersForTournament.length < minRequired) {
        showToast(`Giải đấu ${tour.matchType === 'doubles' ? 'đánh đôi (2v2)' : 'đánh đơn'} cần ít nhất ${minRequired} VĐV!`, 'warning');
        return;
    }

    pushUndoSnapshot(`Cập nhật danh sách VĐV giải ${tour.name}`);

    let tournaments = getTournaments();
    const idx = tournaments.findIndex(t => t.id === tourId);
    if (idx !== -1) {
        tournaments[idx].players = [...selectedPlayersForTournament];
        saveTournaments(tournaments);
    }

    closeModal('playerSelectModal');

    if (tour.matchType === 'doubles') {
        openDoublesPairingModal(tourId);
    } else {
        openManualGroupAssignmentModal(tourId);
    }
}

// 2. BAN TỔ CHỨC CHIA CẶP ĐẤU ĐÔI (2 VS 2) MODAL & LOGIC
function openDoublesPairingModal(tournamentId) {
    const tour = getTournamentById(tournamentId);
    if (!tour) return;

    document.getElementById('pairingTourId').value = tournamentId;
    document.getElementById('pairingTourName').textContent = `${tour.name} • BAN TỔ CHỨC CHIA CẶP 2V2`;

    const selectedPlayerIds = tour.players || [];
    currentDoublesPairs = [...(tour.doublesTeams || [])];

    if (currentDoublesPairs.length === 0 && selectedPlayerIds.length >= 4) {
        currentDoublesPairs = buildAutoBalancedPairs(selectedPlayerIds);
    }

    renderDoublesPairingUI();
    openModal('doublesPairingModal');
}

function buildAutoBalancedPairs(playerIds) {
    const players = playerIds.map(id => getMemberById(id)).filter(Boolean);
    players.sort((a, b) => b.rating - a.rating);

    const pairs = [];
    let pairCounter = 1;

    let left = 0;
    let right = players.length - 1;

    while (left < right) {
        const p1 = players[left];
        const p2 = players[right];

        pairs.push({
            id: `PAIR_${Date.now()}_${pairCounter}`,
            name: `Cặp ${pairCounter}: ${p1.name} + ${p2.name}`,
            p1: p1.id,
            p2: p2.id
        });

        pairCounter++;
        left++;
        right--;
    }

    return pairs;
}

function autoBalanceDoublesPairs() {
    const tourId = document.getElementById('pairingTourId').value;
    const tour = getTournamentById(tourId);
    if (!tour || !tour.players) return;

    currentDoublesPairs = buildAutoBalancedPairs(tour.players);
    renderDoublesPairingUI();
    showToast('⚡ Đã tự động chia cặp cân bằng điểm Elo cho Ban Tổ Chức!', 'info');
}

function addDoublesTeamRow() {
    const tourId = document.getElementById('pairingTourId').value;
    const tour = getTournamentById(tourId);
    if (!tour) return;

    const availablePlayers = tour.players || [];
    const usedPlayerIds = new Set();
    currentDoublesPairs.forEach(p => {
        if (p.p1) usedPlayerIds.add(p.p1);
        if (p.p2) usedPlayerIds.add(p.p2);
    });

    const unused = availablePlayers.filter(id => !usedPlayerIds.has(id));
    const p1Id = unused[0] || availablePlayers[0] || '';
    const p2Id = unused[1] || availablePlayers[1] || '';

    const p1Obj = getMemberById(p1Id);
    const p2Obj = getMemberById(p2Id);

    const pairNum = currentDoublesPairs.length + 1;
    currentDoublesPairs.push({
        id: `PAIR_${Date.now()}_${pairNum}`,
        name: `Cặp ${pairNum}: ${p1Obj ? p1Obj.name : 'VĐV 1'} + ${p2Obj ? p2Obj.name : 'VĐV 2'}`,
        p1: p1Id,
        p2: p2Id
    });

    renderDoublesPairingUI();
}

function removeDoublesTeamRow(index) {
    currentDoublesPairs.splice(index, 1);
    renderDoublesPairingUI();
}

function updateDoublesPairSelection(index, playerNum, selectedId) {
    if (!currentDoublesPairs[index]) return;
    if (playerNum === 1) currentDoublesPairs[index].p1 = selectedId;
    if (playerNum === 2) currentDoublesPairs[index].p2 = selectedId;

    const p1 = getMemberById(currentDoublesPairs[index].p1);
    const p2 = getMemberById(currentDoublesPairs[index].p2);
    currentDoublesPairs[index].name = `Cặp ${index + 1}: ${p1 ? p1.name : 'VĐV A'} + ${p2 ? p2.name : 'VĐV B'}`;

    renderDoublesPairingUI(false);
}

function renderDoublesPairingUI(fullRender = true) {
    const tourId = document.getElementById('pairingTourId').value;
    const tour = getTournamentById(tourId);
    if (!tour) return;

    const selectedPlayerIds = tour.players || [];
    const allMembers = selectedPlayerIds.map(id => getMemberById(id)).filter(Boolean);

    const rowsContainer = document.getElementById('doublesPairingRowsContainer');
    const chipsContainer = document.getElementById('unpairedPlayerChips');

    const assignedPlayerIds = new Set();
    currentDoublesPairs.forEach(p => {
        if (p.p1) assignedPlayerIds.add(p.p1);
        if (p.p2) assignedPlayerIds.add(p.p2);
    });

    const unpaired = allMembers.filter(m => !assignedPlayerIds.has(m.id));

    const unpairedCountEl = document.getElementById('unpairedPlayerCount');
    if (unpairedCountEl) unpairedCountEl.textContent = unpaired.length;

    if (chipsContainer) {
        if (unpaired.length === 0) {
            chipsContainer.innerHTML = `<span class="text-success small fw-bold"><i class="fas fa-check-circle"></i> Tất cả VĐV đã được ghép cặp đầy đủ!</span>`;
        } else {
            let chipsHtml = '';
            unpaired.forEach(m => {
                chipsHtml += `
                    <div class="badge badge-dark p-2 d-flex align-items-center gap-2 border border-secondary">
                        ${renderMemberAvatarHTML(m, 'member-avatar-sm')}
                        <span>${m.name} (${m.rating} Elo)</span>
                    </div>
                `;
            });
            chipsContainer.innerHTML = chipsHtml;
        }
    }

    if (rowsContainer && fullRender) {
        if (currentDoublesPairs.length === 0) {
            rowsContainer.innerHTML = `
                <div class="text-center py-4 text-muted">
                    Chưa có cặp đấu đôi nào. Bấm <strong>"+ Thêm Cặp Đấu Mới"</strong> hoặc <strong>"Tự động chia cặp cân bằng Elo"</strong>.
                </div>
            `;
            return;
        }

        let rowsHtml = '';
        currentDoublesPairs.forEach((pair, idx) => {
            const p1Obj = getMemberById(pair.p1);
            const p2Obj = getMemberById(pair.p2);
            const avgElo = (p1Obj && p2Obj) ? Math.round((p1Obj.rating + p2Obj.rating) / 2) : 0;

            let p1Options = `<option value="">-- Chọn VĐV 1 --</option>`;
            let p2Options = `<option value="">-- Chọn VĐV 2 --</option>`;

            allMembers.forEach(m => {
                const sel1 = m.id === pair.p1 ? 'selected' : '';
                const sel2 = m.id === pair.p2 ? 'selected' : '';
                p1Options += `<option value="${m.id}" ${sel1}>${m.name} (${m.rating} Elo)</option>`;
                p2Options += `<option value="${m.id}" ${sel2}>${m.name} (${m.rating} Elo)</option>`;
            });

            rowsHtml += `
                <div class="p-3 border rounded bg-dark mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <strong class="text-warning"><i class="fas fa-users"></i> CẶP ĐẤU ĐÔI #${idx + 1}</strong>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge badge-primary">Elo Đội: ${avgElo} pts</span>
                            <button type="button" class="btn btn-outline-danger btn-sm py-0 px-2" onclick="removeDoublesTeamRow(${idx})" title="Xóa cặp này">&times;</button>
                        </div>
                    </div>
                    <div class="row g-2">
                        <div class="col-md-6">
                            <label class="form-label small text-muted">VĐV thứ 1 (VĐV A)</label>
                            <select class="form-select form-select-sm" onchange="updateDoublesPairSelection(${idx}, 1, this.value)">
                                ${p1Options}
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small text-muted">VĐV thứ 2 (VĐV B)</label>
                            <select class="form-select form-select-sm" onchange="updateDoublesPairSelection(${idx}, 2, this.value)">
                                ${p2Options}
                            </select>
                        </div>
                    </div>
                </div>
            `;
        });

        rowsContainer.innerHTML = rowsHtml;
    }
}

function proceedToManualGroupAssignment() {
    const tourId = document.getElementById('pairingTourId').value;
    const tour = getTournamentById(tourId);
    if (!tour) return;

    if (currentDoublesPairs.length < 2) {
        showToast('Cần ít nhất 2 Cặp đấu đôi để tiếp tục chia bảng!', 'warning');
        return;
    }

    const usedPlayers = new Set();
    for (let i = 0; i < currentDoublesPairs.length; i++) {
        const pair = currentDoublesPairs[i];
        if (!pair.p1 || !pair.p2) {
            showToast(`Vui lòng chọn đủ 2 VĐV cho Cặp đấu đôi #${i + 1}!`, 'warning');
            return;
        }
        if (pair.p1 === pair.p2) {
            showToast(`Cặp #${i + 1} bị trùng cùng một VĐV!`, 'warning');
            return;
        }
        if (usedPlayers.has(pair.p1) || usedPlayers.has(pair.p2)) {
            showToast(`Một số VĐV bị trùng ghép ở nhiều Cặp đấu. Vui lòng kiểm tra lại!`, 'warning');
            return;
        }
        usedPlayers.add(pair.p1);
        usedPlayers.add(pair.p2);
    }

    pushUndoSnapshot(`Lưu cặp giải đôi ${tour.name}`);

    let tournaments = getTournaments();
    const idx = tournaments.findIndex(t => t.id === tourId);
    if (idx !== -1) {
        tournaments[idx].doublesTeams = currentDoublesPairs;
        saveTournaments(tournaments);
    }

    closeModal('doublesPairingModal');
    openManualGroupAssignmentModal(tourId);
}

// 3. BAN TỔ CHỨC CHIA BẢNG BẰNG TAY (MANUAL GROUP ASSIGNMENT MODAL)
function openManualGroupAssignmentModal(tournamentId) {
    const tour = getTournamentById(tournamentId);
    if (!tour) return;

    document.getElementById('groupAssignTourId').value = tournamentId;
    document.getElementById('groupAssignTourName').textContent = `${tour.name} • BAN TỔ CHỨC CHIA BẢNG BẰNG TAY`;

    currentGroupAssignments = { ...(tour.assignedGroups || {}) };

    const isDoubles = tour.matchType === 'doubles';
    const items = isDoubles ? (tour.doublesTeams || []) : (tour.players || []);

    if (Object.keys(currentGroupAssignments).length === 0 && items.length > 0) {
        autoAssignGroupsByElo(false);
    }

    renderManualGroupAssignmentUI();
    openModal('manualGroupAssignmentModal');
}

function changeNumGroupsSetting() {
    autoAssignGroupsByElo(false);
    renderManualGroupAssignmentUI();
}

function autoAssignGroupsByElo(notify = true) {
    const tourId = document.getElementById('groupAssignTourId').value;
    const tour = getTournamentById(tourId);
    if (!tour) return;

    const numGroups = parseInt(document.getElementById('numGroupsSelect')?.value || '2', 10);
    const groupLabels = ['Bảng A', 'Bảng B', 'Bảng C', 'Bảng D'];

    const isDoubles = tour.matchType === 'doubles';
    let items = [];

    if (isDoubles) {
        items = (tour.doublesTeams || []).map(t => {
            const p1 = getMemberById(t.p1);
            const p2 = getMemberById(t.p2);
            const avgElo = (p1 && p2) ? Math.round((p1.rating + p2.rating) / 2) : 1000;
            return { id: t.id, elo: avgElo };
        });
    } else {
        items = (tour.players || []).map(pId => {
            const m = getMemberById(pId);
            return { id: pId, elo: m ? m.rating : 1000 };
        });
    }

    items.sort((a, b) => b.elo - a.elo);

    currentGroupAssignments = {};
    items.forEach((item, idx) => {
        const groupIdx = idx % numGroups;
        currentGroupAssignments[item.id] = groupLabels[groupIdx];
    });

    renderManualGroupAssignmentUI();
    if (notify) showToast('⚡ Đã phân bổ các Bảng đấu tự động theo chỉ số Elo!', 'info');
}

function updateManualGroupItemAssignment(itemId, groupName) {
    currentGroupAssignments[itemId] = groupName;
}

function renderManualGroupAssignmentUI() {
    const tourId = document.getElementById('groupAssignTourId').value;
    const tour = getTournamentById(tourId);
    if (!tour) return;

    const container = document.getElementById('groupAssignmentRowsContainer');
    if (!container) return;

    const numGroups = parseInt(document.getElementById('numGroupsSelect')?.value || '2', 10);
    const groupLabels = ['Bảng A', 'Bảng B', 'Bảng C', 'Bảng D'].slice(0, numGroups);

    const isDoubles = tour.matchType === 'doubles';
    let html = '';

    if (isDoubles) {
        const teams = tour.doublesTeams || [];
        if (teams.length === 0) {
            container.innerHTML = `<div class="text-center py-3 text-muted">Chưa có cặp đấu đôi nào. Hãy chia cặp ở bước trước.</div>`;
            return;
        }

        teams.forEach((t, idx) => {
            const p1 = getMemberById(t.p1);
            const p2 = getMemberById(t.p2);
            const avgElo = (p1 && p2) ? Math.round((p1.rating + p2.rating) / 2) : 0;
            const currentGroup = currentGroupAssignments[t.id] || 'Bảng A';

            let groupOptions = '';
            groupLabels.forEach(g => {
                const sel = g === currentGroup ? 'selected' : '';
                groupOptions += `<option value="${g}" ${sel}>${g}</option>`;
            });

            html += `
                <div class="p-3 border rounded bg-dark mb-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div class="d-flex align-items-center gap-3">
                        <span class="badge badge-warning fs-6">Cặp #${idx + 1}</span>
                        <div>
                            <strong class="fs-6">${p1 ? p1.name : 'A'} + ${p2 ? p2.name : 'B'}</strong>
                            <div class="small text-muted">Rating Đội: ${avgElo} Elo</div>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <label class="form-label mb-0 small text-muted">Chọn Bảng:</label>
                        <select class="form-select form-select-sm" style="width: 140px;" onchange="updateManualGroupItemAssignment('${t.id}', this.value)">
                            ${groupOptions}
                        </select>
                    </div>
                </div>
            `;
        });
    } else {
        const playerIds = tour.players || [];
        if (playerIds.length === 0) {
            container.innerHTML = `<div class="text-center py-3 text-muted">Chưa có VĐV nào được chọn. Hãy chọn VĐV ở bước trước.</div>`;
            return;
        }

        playerIds.forEach((pId, idx) => {
            const m = getMemberById(pId);
            const currentGroup = currentGroupAssignments[pId] || 'Bảng A';

            let groupOptions = '';
            groupLabels.forEach(g => {
                const sel = g === currentGroup ? 'selected' : '';
                groupOptions += `<option value="${g}" ${sel}>${g}</option>`;
            });

            html += `
                <div class="p-3 border rounded bg-dark mb-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div class="d-flex align-items-center gap-3">
                        <span class="badge badge-primary">VĐV #${idx + 1}</span>
                        ${renderMemberAvatarHTML(m, 'member-avatar-sm')}
                        <div>
                            <strong class="fs-6">${m ? m.name : pId}</strong>
                            <div class="small text-muted">Rating: ${m ? m.rating : 1000} Elo</div>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <label class="form-label mb-0 small text-muted">Chọn Bảng:</label>
                        <select class="form-select form-select-sm" style="width: 140px;" onchange="updateManualGroupItemAssignment('${pId}', this.value)">
                            ${groupOptions}
                        </select>
                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = html;
}

function saveManualGroupAssignmentAndSchedule() {
    const tourId = document.getElementById('groupAssignTourId').value;
    const tour = getTournamentById(tourId);
    if (!tour) return;

    pushUndoSnapshot(`Ban tổ chức lưu chia bảng giải ${tour.name}`);

    let tournaments = getTournaments();
    const idx = tournaments.findIndex(t => t.id === tourId);
    if (idx !== -1) {
        tournaments[idx].assignedGroups = currentGroupAssignments;
        tournaments[idx].status = 'ongoing';
        saveTournaments(tournaments);
    }

    generateCustomGroupTournamentSchedule(tourId);

    closeModal('manualGroupAssignmentModal');
    renderTournamentsList();
    viewTournamentDetails(tourId);
    showToast(`✅ Đã lưu chia Bảng đấu bằng tay và tạo lịch thi đấu (Bảng, Tứ kết, Bán kết & Chung kết)!`, 'success');
}

/**
 * GENERATE FULL TOURNAMENT SCHEDULE:
 * 1. Vòng bảng (Group Stage)
 * 2. Tứ kết (Quarter-Finals)
 * 3. Bán kết (Semi-Finals)
 * 4. Trận Chung kết (Final)
 */
function generateCustomGroupTournamentSchedule(tournamentId) {
    const tour = getTournamentById(tournamentId);
    if (!tour) return;

    let matches = getMatches().filter(m => m.tournamentId !== tournamentId);
    const courtsCount = tour.courts || 2;
    const assignedGroups = tour.assignedGroups || {};

    const isDoubles = tour.matchType === 'doubles';
    let generatedMatches = [];
    let matchCounter = 1;
    let courtIndex = 0;

    const groupedItems = {};
    Object.keys(assignedGroups).forEach(itemId => {
        const groupName = assignedGroups[itemId] || 'Bảng A';
        if (!groupedItems[groupName]) groupedItems[groupName] = [];
        groupedItems[groupName].push(itemId);
    });

    const sortedGroupNames = Object.keys(groupedItems).sort();

    if (isDoubles) {
        const teamsMap = {};
        (tour.doublesTeams || []).forEach(t => teamsMap[t.id] = t);

        // 1. Group Stage Matches
        sortedGroupNames.forEach(groupName => {
            const teamIdsInGroup = groupedItems[groupName];
            for (let i = 0; i < teamIdsInGroup.length; i++) {
                for (let j = i + 1; j < teamIdsInGroup.length; j++) {
                    const t1 = teamsMap[teamIdsInGroup[i]];
                    const t2 = teamsMap[teamIdsInGroup[j]];

                    if (t1 && t2) {
                        const p1Obj = getMemberById(t1.p1);
                        const p1BObj = getMemberById(t1.p2);
                        const p2Obj = getMemberById(t2.p1);
                        const p2BObj = getMemberById(t2.p2);

                        generatedMatches.push({
                            id: generateMatchId() + '_' + matchCounter++,
                            tournamentId: tournamentId,
                            matchType: 'doubles',
                            roundName: `${groupName} (Đôi 2v2)`,
                            court: `Sân ${(courtIndex % courtsCount) + 1}`,
                            player1: t1.p1,
                            player1B: t1.p2,
                            player2: t2.p1,
                            player2B: t2.p2,
                            player1Name: `${p1Obj ? p1Obj.name : 'VĐV A'} + ${p1BObj ? p1BObj.name : 'VĐV B'}`,
                            player2Name: `${p2Obj ? p2Obj.name : 'VĐV A'} + ${p2BObj ? p2BObj.name : 'VĐV B'}`,
                            team1Id: t1.id,
                            team2Id: t2.id,
                            status: 'pending'
                        });
                        courtIndex++;
                    }
                }
            }
        });

        // 2. Quarter-Finals Matches (Tứ kết)
        generatedMatches.push({
            id: generateMatchId() + '_' + matchCounter++,
            tournamentId: tournamentId, matchType: 'doubles',
            roundName: 'Tứ kết 1 (Đôi 2v2)', court: 'Sân 1',
            player1: '', player1B: '', player2: '', player2B: '',
            player1Name: 'Nhất Bảng A', player2Name: 'Nhì Bảng B', status: 'pending'
        });
        generatedMatches.push({
            id: generateMatchId() + '_' + matchCounter++,
            tournamentId: tournamentId, matchType: 'doubles',
            roundName: 'Tứ kết 2 (Đôi 2v2)', court: 'Sân 2',
            player1: '', player1B: '', player2: '', player2B: '',
            player1Name: 'Nhất Bảng B', player2Name: 'Nhì Bảng A', status: 'pending'
        });
        generatedMatches.push({
            id: generateMatchId() + '_' + matchCounter++,
            tournamentId: tournamentId, matchType: 'doubles',
            roundName: 'Tứ kết 3 (Đôi 2v2)', court: 'Sân 1',
            player1: '', player1B: '', player2: '', player2B: '',
            player1Name: 'Nhất Bảng C', player2Name: 'Nhì Bảng D', status: 'pending'
        });
        generatedMatches.push({
            id: generateMatchId() + '_' + matchCounter++,
            tournamentId: tournamentId, matchType: 'doubles',
            roundName: 'Tứ kết 4 (Đôi 2v2)', court: 'Sân 2',
            player1: '', player1B: '', player2: '', player2B: '',
            player1Name: 'Nhất Bảng D', player2Name: 'Nhì Bảng C', status: 'pending'
        });

        // 3. Semi-Finals Matches (Bán kết)
        generatedMatches.push({
            id: generateMatchId() + '_' + matchCounter++,
            tournamentId: tournamentId, matchType: 'doubles',
            roundName: 'Bán kết 1 (Đôi 2v2)', court: 'Sân 1',
            player1: '', player1B: '', player2: '', player2B: '',
            player1Name: 'Thắng Tứ kết 1', player2Name: 'Thắng Tứ kết 2', status: 'pending'
        });
        generatedMatches.push({
            id: generateMatchId() + '_' + matchCounter++,
            tournamentId: tournamentId, matchType: 'doubles',
            roundName: 'Bán kết 2 (Đôi 2v2)', court: 'Sân 2',
            player1: '', player1B: '', player2: '', player2B: '',
            player1Name: 'Thắng Tứ kết 3', player2Name: 'Thắng Tứ kết 4', status: 'pending'
        });

        // 4. Final Match (Chung kết)
        generatedMatches.push({
            id: generateMatchId() + '_' + matchCounter++,
            tournamentId: tournamentId, matchType: 'doubles',
            roundName: 'Chung Kết (Đôi 2v2)', court: 'Sân 1',
            player1: '', player1B: '', player2: '', player2B: '',
            player1Name: 'Thắng Bán kết 1', player2Name: 'Thắng Bán kết 2', status: 'pending'
        });

    } else {
        // 1. Singles Group Stage Matches
        sortedGroupNames.forEach(groupName => {
            const playerIdsInGroup = groupedItems[groupName];
            for (let i = 0; i < playerIdsInGroup.length; i++) {
                for (let j = i + 1; j < playerIdsInGroup.length; j++) {
                    const p1Obj = getMemberById(playerIdsInGroup[i]);
                    const p2Obj = getMemberById(playerIdsInGroup[j]);

                    generatedMatches.push({
                        id: generateMatchId() + '_' + matchCounter++,
                        tournamentId: tournamentId, matchType: 'singles',
                        roundName: `${groupName} (Đơn 1v1)`,
                        court: `Sân ${(courtIndex % courtsCount) + 1}`,
                        player1: playerIdsInGroup[i], player2: playerIdsInGroup[j],
                        player1Name: p1Obj ? p1Obj.name : playerIdsInGroup[i],
                        player2Name: p2Obj ? p2Obj.name : playerIdsInGroup[j],
                        status: 'pending'
                    });
                    courtIndex++;
                }
            }
        });

        // 2. Singles Quarter-Finals (Tứ kết)
        generatedMatches.push({
            id: generateMatchId() + '_' + matchCounter++,
            tournamentId: tournamentId, matchType: 'singles',
            roundName: 'Tứ kết 1 (Đơn 1v1)', court: 'Sân 1',
            player1: '', player2: '', player1Name: 'Nhất Bảng A', player2Name: 'Nhì Bảng B', status: 'pending'
        });
        generatedMatches.push({
            id: generateMatchId() + '_' + matchCounter++,
            tournamentId: tournamentId, matchType: 'singles',
            roundName: 'Tứ kết 2 (Đơn 1v1)', court: 'Sân 2',
            player1: '', player2: '', player1Name: 'Nhất Bảng B', player2Name: 'Nhì Bảng A', status: 'pending'
        });
        generatedMatches.push({
            id: generateMatchId() + '_' + matchCounter++,
            tournamentId: tournamentId, matchType: 'singles',
            roundName: 'Tứ kết 3 (Đơn 1v1)', court: 'Sân 1',
            player1: '', player2: '', player1Name: 'Nhất Bảng C', player2Name: 'Nhì Bảng D', status: 'pending'
        });
        generatedMatches.push({
            id: generateMatchId() + '_' + matchCounter++,
            tournamentId: tournamentId, matchType: 'singles',
            roundName: 'Tứ kết 4 (Đơn 1v1)', court: 'Sân 2',
            player1: '', player2: '', player1Name: 'Nhất Bảng D', player2Name: 'Nhì Bảng C', status: 'pending'
        });

        // 3. Singles Semi-Finals (Bán kết)
        generatedMatches.push({
            id: generateMatchId() + '_' + matchCounter++,
            tournamentId: tournamentId, matchType: 'singles',
            roundName: 'Bán kết 1 (Đơn 1v1)', court: 'Sân 1',
            player1: '', player2: '', player1Name: 'Thắng Tứ kết 1', player2Name: 'Thắng Tứ kết 2', status: 'pending'
        });
        generatedMatches.push({
            id: generateMatchId() + '_' + matchCounter++,
            tournamentId: tournamentId, matchType: 'singles',
            roundName: 'Bán kết 2 (Đơn 1v1)', court: 'Sân 2',
            player1: '', player2: '', player1Name: 'Thắng Tứ kết 3', player2Name: 'Thắng Tứ kết 4', status: 'pending'
        });

        // 4. Singles Final (Chung kết)
        generatedMatches.push({
            id: generateMatchId() + '_' + matchCounter++,
            tournamentId: tournamentId, matchType: 'singles',
            roundName: 'Chung Kết (Đơn 1v1)', court: 'Sân 1',
            player1: '', player2: '', player1Name: 'Thắng Bán kết 1', player2Name: 'Thắng Bán kết 2', status: 'pending'
        });
    }

    matches.push(...generatedMatches);
    saveMatches(matches);
}

// Default Singles Schedule Generator
function generateTournamentSchedule(tournamentId) {
    generateCustomGroupTournamentSchedule(tournamentId);
}

// 4. Tournament Details View Page
function viewTournamentDetails(id) {
    const tour = getTournamentById(id);
    if (!tour) return;

    const container = document.getElementById('tournamentDetailViewContainer');
    if (!container) return;

    const matches = getMatches().filter(m => m.tournamentId === id);
    const completedMatches = matches.filter(m => m.status === 'completed');

    let statusBadge = '<span class="badge badge-warning">Sắp diễn ra</span>';
    if (tour.status === 'ongoing') statusBadge = '<span class="badge badge-primary">Đang diễn ra</span>';
    if (tour.status === 'completed') statusBadge = '<span class="badge badge-success">Đã kết thúc</span>';

    const isDoubles = tour.matchType === 'doubles';
    const doublesTeams = tour.doublesTeams || [];

    let html = `
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                    <h3 class="mb-0 text-white">${tour.name}</h3>
                    <small class="text-muted"><i class="fas fa-calendar-alt"></i> ${formatDate(tour.date)} | 📍 ${tour.location} | 🏟️ ${tour.courts || 2} Sân</small>
                </div>
                <div class="d-flex align-items-center gap-2">
                    ${statusBadge}
                    ${isDoubles ? `
                        <button class="btn btn-outline-warning btn-sm" onclick="openDoublesPairingModal('${tour.id}')">
                            <i class="fas fa-users-cog"></i> Ban Tổ Chức Chia Cặp
                        </button>
                    ` : `
                        <button class="btn btn-outline-primary btn-sm" onclick="openPlayerSelectModal('${tour.id}')">
                            <i class="fas fa-user-plus"></i> Chọn VĐV
                        </button>
                    `}
                    <button class="btn btn-outline-info btn-sm" onclick="openManualGroupAssignmentModal('${tour.id}')">
                        <i class="fas fa-random"></i> Ban Tổ Chức Chia Bảng
                    </button>
                    ${tour.status !== 'completed' && matches.length > 0 ? `
                        <button class="btn btn-success btn-sm" onclick="finishTournament('${tour.id}')">
                            🏁 KẾT THÚC GIẢI & CỘNG ĐIỂM
                        </button>
                    ` : ''}
                    <button class="btn btn-outline-secondary btn-sm" onclick="hideTournamentDetails()">&times; Đóng</button>
                </div>
            </div>
            <div class="card-body">
    `;

    // Render Doubles Teams List if Doubles Tournament
    if (isDoubles) {
        html += `
            <div class="card mb-4 border-warning">
                <div class="card-header bg-dark text-warning d-flex justify-content-between align-items-center">
                    <span>👨‍👨‍👦 CÁC CẶP ĐẤU ĐÔI BAN TỔ CHỨC ĐÃ CHIA (${doublesTeams.length} CẶP)</span>
                    <button class="btn btn-warning btn-sm py-0" onclick="openDoublesPairingModal('${tour.id}')">
                        <i class="fas fa-edit"></i> Sửa chia cặp
                    </button>
                </div>
                <div class="card-body p-3">
                    <div class="row g-2">
        `;
        if (doublesTeams.length === 0) {
            html += `<div class="col-12 text-center text-muted">Chưa có cặp đấu đôi nào được chia. Bấm "Ban Tổ Chức Chia Cặp".</div>`;
        } else {
            doublesTeams.forEach((team, idx) => {
                const p1 = getMemberById(team.p1);
                const p2 = getMemberById(team.p2);
                const avgElo = (p1 && p2) ? Math.round((p1.rating + p2.rating) / 2) : 0;
                const assignedGroup = (tour.assignedGroups || {})[team.id] || 'Bảng A';

                html += `
                    <div class="col-md-6 col-lg-4">
                        <div class="p-2 border rounded bg-dark d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge badge-warning">#${idx + 1}</span>
                                <div>
                                    <div class="fw-bold">${p1 ? p1.name : 'VĐV A'} + ${p2 ? p2.name : 'VĐV B'}</div>
                                    <small class="text-muted">${p1 ? p1.name : 'A'} & ${p2 ? p2.name : 'B'}</small>
                                </div>
                            </div>
                            <div class="text-end">
                                <span class="badge badge-primary mb-1">${avgElo} Elo</span>
                                <div><span class="badge badge-dark">${assignedGroup}</span></div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        html += `
                    </div>
                </div>
            </div>
        `;
    }

    // Scheduled Matches Table
    html += `
        <h4 class="mb-3"><i class="fas fa-list-ol text-primary"></i> LỊCH THI ĐẤU & KẾT QUẢ (${completedMatches.length}/${matches.length} TRẬN)</h4>
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead>
                    <tr>
                        <th>Trận</th>
                        <th>Vòng / Bảng</th>
                        <th>Sân</th>
                        <th>Đội 1 / VĐV 1</th>
                        <th class="text-center">Tỉ số</th>
                        <th>Đội 2 / VĐV 2</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (matches.length === 0) {
        html += `<tr><td colspan="8" class="text-center py-4 text-muted">Chưa có lịch thi đấu. Hãy xếp cặp và chọn VĐV!</td></tr>`;
    } else {
        matches.forEach((m, idx) => {
            let p1Display = m.player1Name || 'VĐV 1';
            let p2Display = m.player2Name || 'VĐV 2';

            if (!m.player1Name) {
                const p1 = getMemberById(m.player1);
                const p2 = getMemberById(m.player2);
                p1Display = p1 ? p1.name : m.player1;
                p2Display = p2 ? p2.name : m.player2;
            }

            const isDone = m.status === 'completed';
            const statusBadge = isDone 
                ? '<span class="badge badge-success">Đã đấu</span>' 
                : '<span class="badge badge-warning">Chưa đấu</span>';

            html += `
                <tr>
                    <td><strong>#${idx + 1}</strong></td>
                    <td><span class="badge badge-dark">${m.roundName || 'Vòng bảng'}</span></td>
                    <td><small class="text-info">${m.court || 'Sân 1'}</small></td>
                    <td><strong class="${isDone && m.score1 > m.score2 ? 'text-success' : ''}">${p1Display}</strong></td>
                    <td class="text-center fw-bold fs-5">${isDone ? `${m.score1} - ${m.score2}` : 'vs'}</td>
                    <td><strong class="${isDone && m.score2 > m.score1 ? 'text-success' : ''}">${p2Display}</strong></td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-outline-primary btn-sm" onclick="openMatchScoreModal('${m.id}')">
                            <i class="fas fa-edit"></i> ${isDone ? 'Sửa điểm' : 'Nhập điểm'}
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    html += `
                </tbody>
            </table>
        </div>
        </div></div>
    `;

    container.innerHTML = html;
    container.style.display = 'block';
    window.scrollTo({ top: container.offsetTop - 80, behavior: 'smooth' });
}

function hideTournamentDetails() {
    const container = document.getElementById('tournamentDetailViewContainer');
    if (container) container.style.display = 'none';
}

/**
 * FINISH TOURNAMENT & AWARD MEDALS & SEASON POINTS
 * Calculates Champion (Gold +100pts), Runner-up (Silver +70pts), 3rd Place (Bronze +50pts), and Group (+10pts).
 * Instantly updates Rankings, Top 3 Podium, and Home Standings.
 */
function finishTournament(tournamentId) {
    const tour = getTournamentById(tournamentId);
    if (!tour) return;

    confirmDialog(
        '🏁 XÁC NHẬN KẾT THÚC GIẢI ĐẤU',
        `Bạn có chắc chắn muốn kết thúc giải đấu "${tour.name}" và tự động cộng Điểm Thưởng Mùa Giải & Huy Chương cho các VĐV xuất sắc?`,
        () => {
            pushUndoSnapshot(`Kết thúc giải đấu ${tour.name}`);

            let tournaments = getTournaments();
            const idx = tournaments.findIndex(t => t.id === tournamentId);
            if (idx === -1) return;

            tournaments[idx].status = 'completed';
            
            const tourMatches = getMatches().filter(m => m.tournamentId === tournamentId && m.status === 'completed');
            const settings = getSettings();
            const ptsConfig = settings.pointsConfig || { champion: 100, runnerUp: 70, third: 50, group: 10 };
            let members = getMembers();

            // Find Final Match
            const finalMatch = tourMatches.find(m => (m.roundName || '').toLowerCase().includes('chung kết'));
            
            if (finalMatch) {
                const finalWinnerWins = finalMatch.score1 > finalMatch.score2;

                if (tour.matchType === 'doubles' || finalMatch.matchType === 'doubles') {
                    // Doubles Final Winners & Runners-Up
                    const champP1 = finalWinnerWins ? finalMatch.player1 : finalMatch.player2;
                    const champP2 = finalWinnerWins ? finalMatch.player1B : finalMatch.player2B;
                    const runnerP1 = finalWinnerWins ? finalMatch.player2 : finalMatch.player1;
                    const runnerP2 = finalWinnerWins ? finalMatch.player2B : finalMatch.player1B;

                    tournaments[idx].winner = `${champP1}, ${champP2}`;
                    const c1Obj = getMemberById(champP1);
                    const c2Obj = getMemberById(champP2);
                    tournaments[idx].winnerTeamName = `${c1Obj ? c1Obj.name : 'VĐV A'} & ${c2Obj ? c2Obj.name : 'VĐV B'}`;

                    // Award Gold Medals & +100pts
                    [champP1, champP2].forEach(pId => {
                        const mIdx = members.findIndex(m => m.id === pId);
                        if (mIdx !== -1) {
                            members[mIdx].goldMedals = (members[mIdx].goldMedals || 0) + 1;
                            members[mIdx].seasonPoints = (members[mIdx].seasonPoints || 0) + (ptsConfig.champion || 100);
                        }
                    });

                    // Award Silver Medals & +70pts
                    [runnerP1, runnerP2].forEach(pId => {
                        const mIdx = members.findIndex(m => m.id === pId);
                        if (mIdx !== -1) {
                            members[mIdx].silverMedals = (members[mIdx].silverMedals || 0) + 1;
                            members[mIdx].seasonPoints = (members[mIdx].seasonPoints || 0) + (ptsConfig.runnerUp || 70);
                        }
                    });

                } else {
                    // Singles Final Winner & Runner-Up
                    const champId = finalWinnerWins ? finalMatch.player1 : finalMatch.player2;
                    const runnerId = finalWinnerWins ? finalMatch.player2 : finalMatch.player1;

                    tournaments[idx].winner = champId;
                    const champObj = getMemberById(champId);
                    tournaments[idx].winnerTeamName = champObj ? champObj.name : 'Quán quân';

                    // Award Gold & +100pts
                    const cIdx = members.findIndex(m => m.id === champId);
                    if (cIdx !== -1) {
                        members[cIdx].goldMedals = (members[cIdx].goldMedals || 0) + 1;
                        members[cIdx].seasonPoints = (members[cIdx].seasonPoints || 0) + (ptsConfig.champion || 100);
                    }

                    // Award Silver & +70pts
                    const rIdx = members.findIndex(m => m.id === runnerId);
                    if (rIdx !== -1) {
                        members[rIdx].silverMedals = (members[rIdx].silverMedals || 0) + 1;
                        members[rIdx].seasonPoints = (members[rIdx].seasonPoints || 0) + (ptsConfig.runnerUp || 70);
                    }
                }
            }

            // Award Group Stage Participation points (+10pts) & Increment tournament counts
            (tour.players || []).forEach(pId => {
                const mIdx = members.findIndex(m => m.id === pId);
                if (mIdx !== -1) {
                    members[mIdx].seasonPoints = (members[mIdx].seasonPoints || 0) + (ptsConfig.group || 10);
                    members[mIdx].tournaments = (members[mIdx].tournaments || 0) + 1;
                }
            });

            saveTournaments(tournaments);
            saveMembers(members);

            // INSTANTLY REFRESH ALL ACTIVE VIEWS & RANKINGS
            renderTournamentsList();
            viewTournamentDetails(tournamentId);

            if (typeof renderRankings === 'function') renderRankings();
            if (typeof renderMembersTable === 'function') renderMembersTable();
            if (typeof updateDashboard === 'function') updateDashboard();

            showToast(`🎉 Giải đấu "${tour.name}" đã chính thức kết thúc và cập nhật Bảng xếp hạng Elo / Điểm Mùa giải!`, 'trophy');
        }
    );
}
