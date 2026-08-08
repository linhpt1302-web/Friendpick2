/**
 * Main Application Logic - FRIENDS PICKLEBALL CLUB
 * Home page (Trang chủ), Navigation routing, Settings form, Undo stack UI, Modal handlers with photo avatar support.
 */

let dashChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupNavigation();

    updateDashboard();
    renderMembersTable();
    renderRankings();
    renderTournamentsList();
    renderMatchesHistoryTable();
    loadSettingsForm();

    document.getElementById('memberForm')?.addEventListener('submit', saveMemberForm);
    document.getElementById('matchScoreForm')?.addEventListener('submit', saveMatchScoreForm);
    document.getElementById('tournamentForm')?.addEventListener('submit', saveTournamentForm);
    document.getElementById('settingsForm')?.addEventListener('submit', saveSettingsForm);

    updateUndoButtonUI();
    updateUserRoleUI();
}

// USER ROLE & LOGIN AUTH SYSTEM
function getCurrentUserRole() {
    return localStorage.getItem('currentUserRole') || null;
}

function openLoginOverlay() {
    const overlay = document.getElementById('loginOverlayScreen');
    if (overlay) overlay.style.display = 'flex';
}

function closeLoginOverlay() {
    const overlay = document.getElementById('loginOverlayScreen');
    if (overlay) overlay.style.display = 'none';
}

function handleAdminLogin(e) {
    if (e) e.preventDefault();
    const pinInput = document.getElementById('adminPinInput')?.value.trim();
    const settings = getSettings();
    const validPin = settings.adminPin || '1302';

    if (pinInput === validPin) {
        localStorage.setItem('currentUserRole', 'admin');
        closeLoginOverlay();
        updateUserRoleUI();
        showToast('👑 Đăng nhập Admin (Ban Tổ Chức) thành công! Bạn có đầy đủ quyền sử dụng hệ thống.', 'success');
    } else {
        showToast('Mã PIN Admin không chính xác! Vui lòng thử lại.', 'error');
    }
}

function handleGuestLogin() {
    localStorage.setItem('currentUserRole', 'guest');
    closeLoginOverlay();
    updateUserRoleUI();
    showToast('👁️ Bạn đang truy cập với quyền Khách (Chỉ xem).', 'info');
}

function logoutUser() {
    localStorage.removeItem('currentUserRole');
    openLoginOverlay();
    updateUserRoleUI();
    showToast('🚪 Đã đăng xuất khỏi tài khoản.', 'info');
}

function checkAdminPermission() {
    const role = getCurrentUserRole();
    if (role !== 'admin') {
        showToast('🔒 Tính năng này dành riêng cho Admin (Ban Tổ Chức). Vui lòng đăng nhập Admin để thực hiện!', 'warning');
        openLoginOverlay();
        return false;
    }
    return true;
}

function updateUserRoleUI() {
    const role = getCurrentUserRole();
    const roleContainer = document.getElementById('userRoleBadgeContainer');

    if (!role) {
        openLoginOverlay();
        return;
    } else {
        closeLoginOverlay();
    }

    if (role === 'guest') {
        document.body.classList.add('role-guest');
        document.body.classList.remove('role-admin');

        if (roleContainer) {
            roleContainer.innerHTML = `
                <span class="badge badge-secondary fs-6 py-2 px-3"><i class="fas fa-eye"></i> Quyền Khách (Chỉ xem)</span>
                <button class="btn btn-outline-warning btn-sm" onclick="openLoginOverlay()" title="Đăng nhập tài khoản Admin">
                    <i class="fas fa-key"></i> Đăng nhập Admin
                </button>
            `;
        }
    } else {
        document.body.classList.remove('role-guest');
        document.body.classList.add('role-admin');

        if (roleContainer) {
            roleContainer.innerHTML = `
                <span class="badge badge-warning text-dark fs-6 py-2 px-3" style="background-color: var(--accent-gold);"><i class="fas fa-user-shield"></i> Admin (Ban Tổ Chức)</span>
                <button class="btn btn-outline-danger btn-sm" onclick="logoutUser()" title="Đăng xuất">
                    <i class="fas fa-sign-out-alt"></i> Đăng xuất
                </button>
            `;
        }
    }
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-tab]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            switchTab(tabId);

            const sidebar = document.getElementById('sidebar');
            const backdrop = document.getElementById('sidebarBackdrop');
            if (sidebar && sidebar.classList.contains('mobile-show')) {
                sidebar.classList.remove('mobile-show');
            }
            if (backdrop && backdrop.classList.contains('show')) {
                backdrop.classList.remove('show');
            }
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-tab') === tabId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    document.querySelectorAll('.bottom-nav-item').forEach(link => {
        if (link.getAttribute('data-tab') === tabId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    document.querySelectorAll('.view-section').forEach(sec => {
        sec.style.display = 'none';
    });

    const targetView = document.getElementById(tabId);
    if (targetView) {
        targetView.style.display = 'block';
    }

    if (tabId === 'dashboardView') updateDashboard();
    if (tabId === 'membersView') renderMembersTable();
    if (tabId === 'rankingsView') renderRankings();
    if (tabId === 'tournamentsView') renderTournamentsList();
    if (tabId === 'matchHistoryView') {
        populateMatchHistoryTourFilter();
        renderMatchesHistoryTable();
    }
    if (tabId === 'statisticsView') renderClubStatistics();
    if (tabId === 'settingsView') loadSettingsForm();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.toggle('mobile-show');
    if (backdrop) backdrop.classList.toggle('show');
}

function updateDashboard() {
    const members = getMembers();
    const tournaments = getTournaments();
    const matches = getMatches();

    const activeMembers = members.filter(m => m.status === 'active');
    const sortedMembers = [...activeMembers].sort((a, b) => b.rating - a.rating);

    const dashTotalMembersEl = document.getElementById('dashTotalMembers');
    if (dashTotalMembersEl) dashTotalMembersEl.textContent = members.length;

    const dashActiveMembersEl = document.getElementById('dashActiveMembers');
    if (dashActiveMembersEl) dashActiveMembersEl.textContent = `${activeMembers.length} đang hoạt động`;

    const dashTotalTournamentsEl = document.getElementById('dashTotalTournaments');
    if (dashTotalTournamentsEl) dashTotalTournamentsEl.textContent = tournaments.length;

    const ongoingTours = tournaments.filter(t => t.status === 'ongoing').length;
    const dashTournamentsStatusEl = document.getElementById('dashTournamentsStatus');
    if (dashTournamentsStatusEl) dashTournamentsStatusEl.textContent = `${ongoingTours} giải đang diễn ra`;

    // Home Page Top 5 Standings Table
    const top5Body = document.getElementById('dashTop5Body');
    if (top5Body) {
        if (sortedMembers.length === 0) {
            top5Body.innerHTML = `<tr><td colspan="6" class="text-center py-3">Chưa có dữ liệu</td></tr>`;
        } else {
            let html = '';
            sortedMembers.slice(0, 5).forEach((m, idx) => {
                let rankBadge = `#${idx + 1}`;
                if (idx === 0) rankBadge = '🥇 #1';
                if (idx === 1) rankBadge = '🥈 #2';
                if (idx === 2) rankBadge = '🥉 #3';

                const winRateNum = m.matches ? Math.round((m.wins / m.matches) * 100) : 0;

                html += `
                    <tr>
                        <td><strong>${rankBadge}</strong></td>
                        <td>
                            <div class="member-name-cell">
                                ${renderMemberAvatarHTML(m, 'member-avatar-sm')}
                                <div>
                                    <strong>${m.name}</strong>
                                    <small class="text-muted d-block">${getLevelBadgeHTML(m.level)}</small>
                                </div>
                            </div>
                        </td>
                        <td><strong class="text-success fs-5">${m.rating}</strong></td>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <div class="progress-bar-wrap">
                                    <div class="progress-bar-fill" style="width: ${winRateNum}%"></div>
                                </div>
                                <small class="fw-bold">${winRateNum}%</small>
                            </div>
                        </td>
                        <td><strong class="text-warning fs-5">${m.seasonPoints || 0}</strong></td>
                        <td>
                            <button class="btn btn-outline-info btn-icon btn-sm" title="Xem hồ sơ VĐV" onclick="viewMemberProfile('${m.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            top5Body.innerHTML = html;
        }
    }

    // Recent Match Feed
    const recentMatchesBody = document.getElementById('dashRecentMatchesFeed');
    if (recentMatchesBody) {
        const completedMatches = matches.filter(m => m.status === 'completed').reverse().slice(0, 4);
        if (completedMatches.length === 0) {
            recentMatchesBody.innerHTML = `<div class="text-center py-3 text-muted">Chưa có trận đấu nào.</div>`;
        } else {
            let html = '';
            completedMatches.forEach(m => {
                const isDoubles = m.matchType === 'doubles' || !!m.player1B;
                let p1Name = '';
                let p2Name = '';

                if (isDoubles) {
                    const p1A = getMemberById(m.player1);
                    const p1B = getMemberById(m.player1B);
                    const p2A = getMemberById(m.player2);
                    const p2B = getMemberById(m.player2B);
                    p1Name = `${p1A ? p1A.name : 'VĐV 1A'} + ${p1B ? p1B.name : 'VĐV 1B'}`;
                    p2Name = `${p2A ? p2A.name : 'VĐV 2A'} + ${p2B ? p2B.name : 'VĐV 2B'}`;
                } else {
                    const p1 = getMemberById(m.player1);
                    const p2 = getMemberById(m.player2);
                    p1Name = p1 ? p1.name : (m.player1Name || 'VĐV 1');
                    p2Name = p2 ? p2.name : (m.player2Name || 'VĐV 2');
                }

                const isP1Win = m.winner === m.player1 || m.winner === 'TEAM_1' || m.score1 > m.score2;

                html += `
                    <div class="activity-feed-item">
                        <div>
                            <span class="badge badge-primary me-2">${m.roundName || 'Trận đấu'} ${isDoubles ? '(2v2)' : '(1v1)'}</span>
                            <span class="${isP1Win ? 'fw-bold text-success' : ''}">${p1Name}</span>
                            <span class="badge badge-dark mx-1">${m.score1} - ${m.score2}</span>
                            <span class="${!isP1Win ? 'fw-bold text-success' : ''}">${p2Name}</span>
                        </div>
                        <small class="text-muted">${formatDateTime(m.playedAt)}</small>
                    </div>
                `;
            });
            recentMatchesBody.innerHTML = html;
        }
    }

    renderDashboardRatingChart(sortedMembers.slice(0, 6));

    const recentTour = tournaments[tournaments.length - 1];
    const recentTourContainer = document.getElementById('dashRecentTourBanner');
    if (recentTourContainer && recentTour) {
        let statusBadge = '<span class="badge badge-warning">Sắp diễn ra</span>';
        if (recentTour.status === 'completed') statusBadge = '<span class="badge badge-success">Đã kết thúc</span>';
        if (recentTour.status === 'ongoing') statusBadge = '<span class="badge badge-primary">Đang thi đấu</span>';

        const winner = getMemberById(recentTour.winner);

        recentTourContainer.innerHTML = `
            <div class="card bg-gradient-primary p-3 rounded shadow-sm">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge badge-dark">${recentTour.format} • ${recentTour.matchType === 'doubles' ? 'Đấu đôi (2v2)' : 'Đấu đơn (1v1)'}</span>
                    ${statusBadge}
                </div>
                <h4 class="mb-1 text-white">${recentTour.name}</h4>
                <p class="small mb-2 text-muted"><i class="fas fa-calendar"></i> ${formatDate(recentTour.date)} | 📍 ${recentTour.location}</p>
                ${recentTour.status === 'completed' && winner ? `
                    <div class="p-2 rounded small bg-dark text-warning border border-warning">🏆 Vô địch: <strong>${winner.name}</strong></div>
                ` : ''}
                <button class="btn btn-primary btn-sm mt-3 w-100 fw-bold" onclick="viewTournamentDetails('${recentTour.id}')">
                    XEM LỊCH & BẢNG ĐẤU <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
    }
}

function renderDashboardRatingChart(topMembers) {
    const ctx = document.getElementById('dashRatingChartCtx')?.getContext('2d');
    if (!ctx) return;

    if (dashChartInstance) dashChartInstance.destroy();

    const labels = topMembers.map(m => m.name);
    const eloData = topMembers.map(m => m.rating);
    const ptsData = topMembers.map(m => m.seasonPoints || 0);

    dashChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Rating Elo',
                    data: eloData,
                    backgroundColor: '#22c55e',
                    borderRadius: 6
                },
                {
                    label: 'Điểm Mùa giải',
                    data: ptsData,
                    backgroundColor: '#f59e0b',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: '#94a3b8' } }
            },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function populateMatchHistoryTourFilter() {
    const filterSelect = document.getElementById('matchHistoryTourFilter');
    if (!filterSelect) return;

    const tournaments = getTournaments();
    let html = '<option value="all">Tất cả giải đấu</option>';
    tournaments.forEach(t => {
        html += `<option value="${t.id}">${t.name}</option>`;
    });
    filterSelect.innerHTML = html;
}

function loadSettingsForm() {
    const settings = getSettings();
    document.getElementById('settingInitRatingInput').value = settings.initialRating || 1000;
    document.getElementById('settingKFactorInput').value = settings.kFactor || 32;

    const pts = settings.pointsConfig || {};
    document.getElementById('settingPtsChampion').value = pts.champion || 100;
    document.getElementById('settingPtsRunnerUp').value = pts.runnerUp || 70;
    document.getElementById('settingPtsThird').value = pts.third || 50;
    document.getElementById('settingPtsFourth').value = pts.fourth || 40;
    document.getElementById('settingPtsQuarter').value = pts.quarter || 30;
    document.getElementById('settingPtsGroup').value = pts.group || 10;

    const winInput = document.getElementById('settingPtsMatchWin');
    if (winInput) winInput.value = pts.matchWin !== undefined ? pts.matchWin : 5;

    const lossInput = document.getElementById('settingPtsMatchLoss');
    if (lossInput) lossInput.value = pts.matchLoss !== undefined ? pts.matchLoss : 3;

    document.getElementById('settingAdminPin').value = settings.adminPin || '1302';
}

function saveSettingsForm(e) {
    e.preventDefault();

    pushUndoSnapshot('Thay đổi cấu hình hệ thống');

    const settings = {
        initialRating: parseInt(document.getElementById('settingInitRatingInput').value, 10) || 1000,
        kFactor: parseInt(document.getElementById('settingKFactorInput').value, 10) || 32,
        pointsConfig: {
            champion: parseInt(document.getElementById('settingPtsChampion').value, 10) || 100,
            runnerUp: parseInt(document.getElementById('settingPtsRunnerUp').value, 10) || 70,
            third: parseInt(document.getElementById('settingPtsThird').value, 10) || 50,
            fourth: parseInt(document.getElementById('settingPtsFourth').value, 10) || 40,
            quarter: parseInt(document.getElementById('settingPtsQuarter').value, 10) || 30,
            group: parseInt(document.getElementById('settingPtsGroup').value, 10) || 10,
            matchWin: parseInt(document.getElementById('settingPtsMatchWin')?.value, 10) || 5,
            matchLoss: parseInt(document.getElementById('settingPtsMatchLoss')?.value, 10) || 3
        },
        adminPin: document.getElementById('settingAdminPin').value || '1302'
    };

    saveSettings(settings);
    showToast('Đã lưu cấu hình Cài đặt thành công!', 'success');
}

function triggerGlobalUndo() {
    if (getUndoStackLength() === 0) {
        showToast('Không có thao tác nào để hoàn tác!', 'info');
        return;
    }

    confirmDialog(
        '↩️ HOÀN TÁC THAO TÁC VỪA THỰC HIỆN',
        'Bạn có chắc chắn muốn hoàn tác lại thao tác vừa thực hiện gần nhất không?',
        () => {
            const popped = popUndoSnapshot();
            if (popped) {
                showToast(`↩️ Đã hoàn tác: ${popped.description}`, 'success');
                updateDashboard();
                renderMembersTable();
                renderRankings();
                renderTournamentsList();
                renderMatchesHistoryTable();
                updateUndoButtonUI();
            }
        }
    );
}

function updateUndoButtonUI() {
    const len = getUndoStackLength();
    const undoBtn = document.getElementById('globalUndoBtn');
    if (undoBtn) {
        if (len > 0) {
            undoBtn.classList.remove('disabled');
            undoBtn.title = `Hoàn tác (${len} bước khả dụng)`;
        } else {
            undoBtn.classList.add('disabled');
            undoBtn.title = 'Chưa có thao tác để hoàn tác';
        }
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
}

function handleImportFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const jsonContent = event.target.result;
        const res = importDataJSON(jsonContent);
        if (res.success) {
            showToast('✅ Nhập dữ liệu sao lưu thành công!', 'success');
            updateDashboard();
            renderMembersTable();
            renderRankings();
            renderTournamentsList();
            renderMatchesHistoryTable();
            closeModal('importModal');
        } else {
            showToast(`❌ Lỗi nhập file: ${res.error}`, 'error');
        }
    };
    reader.readAsText(file);
}

function handleResetAllData() {
    confirmDialog(
        '⚠️ XÁC NHẬN KHÔI PHỤC DỮ LIỆU DEMO BAN ĐẦU',
        'Hành động này sẽ xóa toàn bộ dữ liệu hiện tại và nạp lại 10 thành viên demo ban đầu. Bạn có chắc chắn không?',
        () => {
            resetDemoData();
            showToast('Đã khôi phục dữ liệu demo ban đầu thành công!', 'info');
            updateDashboard();
            renderMembersTable();
            renderRankings();
            renderTournamentsList();
            renderMatchesHistoryTable();
        }
    );
}
