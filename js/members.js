/**
 * Members Module - FRIENDS PICKLEBALL CLUB
 * Handles member CRUD, automatic image downscaling & compression to 50x50px (HTML5 Canvas), custom photo avatar upload on the left of member names, search/filtering, and detailed profile analytics modal.
 */

let memberRatingChart = null;
let currentAvatarDataUrl = ''; // Stores compressed base64 image data (50x50px JPEG)

/**
 * Automatically crop & resize uploaded image to 50x50px JPEG
 * Keeps memory ultra-light (~3-8KB) and fits row height perfectly on the left of member name.
 */
function compressAndResizeImage(file, targetWidth = 50, targetHeight = 50, quality = 0.80) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;

                // Center crop square math
                const srcWidth = img.width;
                const srcHeight = img.height;
                const minDim = Math.min(srcWidth, srcHeight);
                const srcX = (srcWidth - minDim) / 2;
                const srcY = (srcHeight - minDim) / 2;

                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Draw centered square into 50x50 canvas
                ctx.drawImage(img, srcX, srcY, minDim, minDim, 0, 0, targetWidth, targetHeight);

                // Convert canvas to lightweight compressed JPEG Data URL
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = function() {
                reject(new Error('Khong the doc file anh'));
            };
            img.src = e.target.result;
        };
        reader.onerror = function() {
            reject(new Error('Loi doc file'));
        };
        reader.readAsDataURL(file);
    });
}

function renderMembersTable() {
    const tableBody = document.getElementById('membersTableBody');
    if (!tableBody) return;

    const searchTerm = (document.getElementById('memberSearchInput')?.value || '').toLowerCase().trim();
    const levelFilter = document.getElementById('memberLevelFilter')?.value || 'all';
    const genderFilter = document.getElementById('memberGenderFilter')?.value || 'all';
    const statusFilter = document.getElementById('memberStatusFilter')?.value || 'all';

    let members = getMembers();

    const sortedByRating = [...members].sort((a, b) => b.rating - a.rating);
    const rankMap = new Map();
    sortedByRating.forEach((m, idx) => rankMap.set(m.id, idx + 1));

    let filtered = members.filter(m => {
        const matchSearch = (m.name || '').toLowerCase().includes(searchTerm) ||
                            (m.code || '').toLowerCase().includes(searchTerm) ||
                            (m.phone || '').includes(searchTerm);

        const matchLevel = levelFilter === 'all' || m.level === levelFilter;
        const matchGender = genderFilter === 'all' || m.gender === genderFilter;
        const matchStatus = statusFilter === 'all' || m.status === statusFilter;

        return matchSearch && matchLevel && matchGender && matchStatus;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4 text-muted">
                    <i class="fas fa-search fa-2x mb-2"></i><br>
                    Không tìm thấy thành viên phù hợp với bộ lọc.
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    let mobileHtml = '';

    filtered.forEach((m, idx) => {
        const rank = rankMap.get(m.id);
        const genderLabel = m.gender === 'male' ? 'Nam' : 'Nữ';
        const statusBadge = m.status === 'active' 
            ? '<span class="badge badge-success">Hoạt động</span>' 
            : '<span class="badge badge-secondary">Tạm ngưng</span>';

        let rankBadge = `#${rank}`;
        if (rank === 1) rankBadge = '🥇 #1';
        if (rank === 2) rankBadge = '🥈 #2';
        if (rank === 3) rankBadge = '🥉 #3';

        html += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${m.code || m.id}</strong></td>
                <td>
                    <div class="member-name-cell">
                        ${renderMemberAvatarHTML(m, 'member-avatar-sm')}
                        <div>
                            <div class="member-full-name">${m.name}</div>
                            <small class="text-muted">${m.displayName ? `(${m.displayName})` : ''}</small>
                        </div>
                    </div>
                </td>
                <td>${genderLabel}</td>
                <td>${m.birthYear || '---'}</td>
                <td>${getLevelBadgeHTML(m.level)}</td>
                <td><strong class="text-primary">${m.rating}</strong></td>
                <td><span class="rank-highlight">${rankBadge}</span></td>
                <td>${statusBadge}</td>
                <td>
                    <div class="btn-group-sm d-flex align-items-center gap-1">
                        <button class="btn btn-outline-info btn-icon" title="Xem chi tiết" onclick="viewMemberProfile('${m.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning btn-sm py-1 px-2 admin-only" title="Sửa điểm Elo" onclick="openEditEloModal('${m.id}')">
                            <i class="fas fa-bolt"></i> Elo
                        </button>
                        <button class="btn btn-outline-primary btn-icon admin-only" title="Sửa thông tin" onclick="openEditMemberModal('${m.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-icon admin-only" title="Xóa thành viên" onclick="handleDeleteMember('${m.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;

        mobileHtml += `
            <div class="member-card-mobile card mb-3">
                <div class="card-body p-3">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="d-flex align-items-center gap-2">
                            ${renderMemberAvatarHTML(m, 'member-avatar-md')}
                            <div>
                                <div class="fw-bold text-white fs-6">${m.name}</div>
                                <div class="text-muted extra-small">${m.code || m.id} • ${genderLabel} • ${m.phone || 'SĐT: N/A'}</div>
                            </div>
                        </div>
                        <div>${statusBadge}</div>
                    </div>
                    <div class="member-card-stats-grid p-2 bg-dark rounded mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="text-muted small">Trình độ:</span>
                            <span>${getLevelBadgeHTML(m.level)}</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="text-muted small">Rating Elo:</span>
                            <span class="text-primary fw-bold fs-6">${m.rating} Elo</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="text-muted small">Thành tích:</span>
                            <span class="small">${m.matches || 0} trận (${m.wins || 0}W - ${m.losses || 0}L)</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-muted small">BXH CLB:</span>
                            <span class="rank-highlight font-bold">${rankBadge}</span>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-outline-info btn-sm flex-fill py-2" onclick="viewMemberProfile('${m.id}')">
                            <i class="fas fa-eye"></i> Xem
                        </button>
                        <button class="btn btn-outline-warning btn-sm flex-fill py-2 admin-only" onclick="openEditEloModal('${m.id}')">
                            <i class="fas fa-bolt"></i> Elo
                        </button>
                        <button class="btn btn-outline-primary btn-sm flex-fill py-2 admin-only" onclick="openEditMemberModal('${m.id}')">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn btn-outline-danger btn-sm flex-fill py-2 admin-only" onclick="handleDeleteMember('${m.id}')">
                            <i class="fas fa-trash-alt"></i> Xóa
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    tableBody.innerHTML = html;

    const mobileContainer = document.getElementById('mobileMembersCardList');
    if (mobileContainer) {
        mobileContainer.innerHTML = mobileHtml;
    }
}

/**
 * Direct Elo Edit Quick Modal Dialog for BTC / Admin
 */
function openEditEloModal(memberId) {
    if (typeof checkAdminPermission === 'function' && !checkAdminPermission()) return;
    const member = getMemberById(memberId);
    if (!member) return;

    const currentElo = member.rating || 1000;
    const inputVal = prompt(`⚡ CHỈNH SỬA ĐIỂM ELO VẬN ĐỘNG VIÊN: ${member.name}\n\nRating Elo hiện tại: ${currentElo}\nNhập điểm Rating Elo mới cho VĐV:`, currentElo);

    if (inputVal === null) return;

    const newElo = parseInt(inputVal, 10);
    if (isNaN(newElo) || newElo < 100 || newElo > 3000) {
        showToast('Vui lòng nhập điểm Elo hợp lệ (từ 100 đến 3000)!', 'warning');
        return;
    }

    pushUndoSnapshot(`Sửa điểm Elo VĐV ${member.name} từ ${currentElo} thành ${newElo}`);

    let members = getMembers();
    const idx = members.findIndex(m => m.id === memberId);
    if (idx !== -1) {
        members[idx].rating = newElo;
        if (!members[idx].ratingHistory) members[idx].ratingHistory = [];
        members[idx].ratingHistory.push({
            date: new Date().toISOString().slice(0, 10),
            rating: newElo,
            note: 'Ban Tổ Chức sửa Elo thủ công'
        });
        saveMembers(members);
    }

    renderMembersTable();
    if (typeof renderRankings === 'function') renderRankings();
    if (typeof updateDashboard === 'function') updateDashboard();

    showToast(`⚡ Đã cập nhật điểm Elo cho VĐV ${member.name}: ${newElo} Elo!`, 'success');
}

// Avatar File Selection & Auto Resizing Listener (Target: 50x50px)
async function handleAvatarFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        showToast('Đang tự động thu nhỏ ảnh về kích thước 50x50px...', 'info', 1500);
        // Automatically crop & downscale to 50x50px lightweight JPEG
        const compressedDataUrl = await compressAndResizeImage(file, 50, 50, 0.80);
        currentAvatarDataUrl = compressedDataUrl;
        updateAvatarPreviewDisplay();
        showToast('✅ Đã thu nhỏ ảnh đại diện chuẩn 50x50px thành công!', 'success');
    } catch (err) {
        showToast('Lỗi khi thu nhỏ ảnh đại diện: ' + err.message, 'error');
    }
}

function removeAvatarPhoto() {
    currentAvatarDataUrl = '';
    const fileInput = document.getElementById('memberAvatarFileInput');
    if (fileInput) fileInput.value = '';
    updateAvatarPreviewDisplay();
}

function updateAvatarPreviewDisplay() {
    const previewContainer = document.getElementById('avatarPreviewContainer');
    if (!previewContainer) return;

    const name = document.getElementById('memberNameInput')?.value || 'VĐV';
    const bg = document.getElementById('avatarBgInput')?.value || '#2563eb';

    if (currentAvatarDataUrl) {
        previewContainer.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <img src="${currentAvatarDataUrl}" alt="Avatar Preview" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);">
                <div>
                    <span class="badge badge-success mb-1"><i class="fas fa-check"></i> Đã thu nhỏ 50x50px</span>
                    <small class="d-block text-muted">Ảnh hiển thị bên trái tên VĐV siêu nhẹ và mượt mà</small>
                    <div class="mt-1"><button type="button" class="btn btn-outline-danger btn-sm py-0 px-2" onclick="removeAvatarPhoto()">Xóa ảnh</button></div>
                </div>
            </div>
        `;
    } else {
        previewContainer.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <div class="member-avatar-sm" style="width: 42px; height: 42px; font-size: 1rem; background-color: ${bg};">${getInitials(name)}</div>
                <div class="text-muted small">Chưa chọn ảnh (Hệ thống sẽ hiển thị avatar chữ cái mặc định)</div>
            </div>
        `;
    }
}

// Modal Handlers
function openAddMemberModal() {
    if (typeof checkAdminPermission === 'function' && !checkAdminPermission()) return;

    document.getElementById('memberForm').reset();
    document.getElementById('memberFormId').value = '';
    document.getElementById('memberModalTitle').textContent = 'THÊM THÀNH VIÊN MỚI';
    
    currentAvatarDataUrl = '';
    const fileInput = document.getElementById('memberAvatarFileInput');
    if (fileInput) fileInput.value = '';

    const newCode = generateMemberCode();
    document.getElementById('memberCodeInput').value = newCode;
    
    const settings = getSettings();
    const initEloInput = document.getElementById('memberInitialRatingInput');
    if (initEloInput) initEloInput.value = settings.initialRating || 1000;

    document.getElementById('memberRatingInput').value = settings.initialRating || 1000;
    document.getElementById('avatarBgInput').value = getRandomAvatarColor();

    updateAvatarPreviewDisplay();
    openModal('memberModal');
}

function openEditMemberModal(id) {
    if (typeof checkAdminPermission === 'function' && !checkAdminPermission()) return;
    const member = getMemberById(id);
    if (!member) return;

    document.getElementById('memberModalTitle').textContent = 'CHỈNH SỬA THÀNH VIÊN';
    document.getElementById('memberFormId').value = member.id;
    document.getElementById('memberCodeInput').value = member.code || member.id;
    document.getElementById('memberNameInput').value = member.name || '';
    document.getElementById('memberDisplayNameInput').value = member.displayName || '';
    document.getElementById('memberGenderInput').value = member.gender || 'male';
    document.getElementById('memberBirthYearInput').value = member.birthYear || '';
    document.getElementById('memberPhoneInput').value = member.phone || '';
    document.getElementById('memberEmailInput').value = member.email || '';
    document.getElementById('memberJoinDateInput').value = member.joinDate || new Date().toISOString().slice(0, 10);
    document.getElementById('memberLevelInput').value = member.level || 'Trung bình';
    document.getElementById('memberDominantHandInput').value = member.dominantHand || 'right';
    document.getElementById('memberNotesInput').value = member.notes || '';
    document.getElementById('memberStatusInput').value = member.status || 'active';

    const initEloInput = document.getElementById('memberInitialRatingInput');
    if (initEloInput) initEloInput.value = member.initialRating || member.rating || 1000;

    document.getElementById('memberRatingInput').value = member.rating || 1000;
    document.getElementById('avatarBgInput').value = member.avatarBg || '#2563eb';

    currentAvatarDataUrl = member.avatarUrl || '';
    const fileInput = document.getElementById('memberAvatarFileInput');
    if (fileInput) fileInput.value = '';

    updateAvatarPreviewDisplay();
    openModal('memberModal');
}

function saveMemberForm(e) {
    e.preventDefault();

    const id = document.getElementById('memberFormId').value;
    const isEdit = !!id;

    const name = document.getElementById('memberNameInput').value.trim();
    if (!name) {
        showToast('Vui lòng nhập họ và tên thành viên!', 'warning');
        return;
    }

    pushUndoSnapshot(isEdit ? `Sửa thành viên ${name}` : `Thêm thành viên mới ${name}`);

    let members = getMembers();
    const settings = getSettings();

    const initialRatingVal = parseInt(document.getElementById('memberInitialRatingInput')?.value, 10) || settings.initialRating || 1000;

    const memberData = {
        id: id || generateMemberId(),
        code: document.getElementById('memberCodeInput').value.trim() || generateMemberCode(),
        name: name,
        displayName: document.getElementById('memberDisplayNameInput').value.trim(),
        gender: document.getElementById('memberGenderInput').value,
        birthYear: parseInt(document.getElementById('memberBirthYearInput').value, 10) || null,
        phone: document.getElementById('memberPhoneInput').value.trim(),
        email: document.getElementById('memberEmailInput').value.trim(),
        joinDate: document.getElementById('memberJoinDateInput').value || new Date().toISOString().slice(0, 10),
        level: document.getElementById('memberLevelInput').value,
        dominantHand: document.getElementById('memberDominantHandInput').value,
        notes: document.getElementById('memberNotesInput').value.trim(),
        status: document.getElementById('memberStatusInput').value,
        avatarBg: document.getElementById('avatarBgInput').value || getRandomAvatarColor(),
        avatarUrl: currentAvatarDataUrl,
        initialRating: initialRatingVal
    };

    if (isEdit) {
        const index = members.findIndex(m => m.id === id);
        if (index !== -1) {
            memberData.rating = parseInt(document.getElementById('memberRatingInput').value, 10) || members[index].rating;
            memberData.ratingHistory = members[index].ratingHistory || [{ date: memberData.joinDate, rating: memberData.rating }];
            memberData.seasonPoints = members[index].seasonPoints || 0;
            memberData.matches = members[index].matches || 0;
            memberData.wins = members[index].wins || 0;
            memberData.losses = members[index].losses || 0;
            memberData.tournaments = members[index].tournaments || 0;
            memberData.championCount = members[index].championCount || 0;
            memberData.silverCount = members[index].silverCount || 0;
            memberData.bronzeCount = members[index].bronzeCount || 0;

            members[index] = memberData;
            showToast(`Cập nhật thông tin VĐV ${name} thành công!`, 'success');
        }
    } else {
        const currentRatingInput = parseInt(document.getElementById('memberRatingInput').value, 10);
        const initRating = !isNaN(currentRatingInput) ? currentRatingInput : initialRatingVal;

        memberData.rating = initRating;
        memberData.ratingHistory = [{ date: memberData.joinDate, rating: initRating, note: 'Khởi tạo Elo ban đầu' }];
        memberData.seasonPoints = 0;
        memberData.matches = 0;
        memberData.wins = 0;
        memberData.losses = 0;
        memberData.tournaments = 0;
        memberData.championCount = 0;
        memberData.silverCount = 0;
        memberData.bronzeCount = 0;

        members.push(memberData);
        showToast(`Thêm VĐV mới ${name} thành công (Elo ban đầu: ${initRating})!`, 'success');
    }

    saveMembers(members);
    closeModal('memberModal');
    renderMembersTable();
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof renderRankings === 'function') renderRankings();
}

function handleDeleteMember(id) {
    const member = getMemberById(id);
    if (!member) return;

    const matches = getMatches().filter(m => m.player1 === id || m.player2 === id || m.player1B === id || m.player2B === id);

    if (matches.length > 0) {
        confirmDialog(
            'KHÔNG THỂ XÓA CỨNG THÀNH VIÊN',
            `Thành viên ${member.name} đã tham gia ${matches.length} trận thi đấu trong hệ thống. Bạn có muốn chuyển trạng thái thành "Tạm ngưng" không?`,
            () => {
                pushUndoSnapshot(`Chuyển trạng thái VĐV ${member.name} sang Tạm ngưng`);
                let members = getMembers();
                const m = members.find(item => item.id === id);
                if (m) m.status = 'inactive';
                saveMembers(members);
                renderMembersTable();
                showToast(`Đã chuyển trạng thái ${member.name} sang Tạm ngưng hoạt động`, 'info');
            }
        );
        return;
    }

    confirmDialog(
        'XÁC NHẬN XÓA THÀNH VIÊN',
        `Bạn có chắc chắn muốn xóa vĩnh viễn thành viên "${member.name}" (${member.code}) khỏi hệ thống?`,
        () => {
            pushUndoSnapshot(`Xóa thành viên ${member.name}`);
            let members = getMembers().filter(m => m.id !== id);
            saveMembers(members);
            renderMembersTable();
            if (typeof updateDashboard === 'function') updateDashboard();
            if (typeof renderRankings === 'function') renderRankings();
            showToast(`Đã xóa thành viên ${member.name}!`, 'success');
        }
    );
}

// Detailed Member Profile View Modal
function viewMemberProfile(id) {
    const member = getMemberById(id);
    if (!member) return;

    const members = getMembers().sort((a, b) => b.rating - a.rating);
    const rank = members.findIndex(m => m.id === id) + 1;

    const profileAvatarWrap = document.getElementById('profileAvatarContainer');
    if (profileAvatarWrap) {
        profileAvatarWrap.innerHTML = renderMemberAvatarHTML(member, 'member-avatar-lg', 'width: 72px; height: 72px; font-size: 1.8rem;');
    }

    document.getElementById('profileName').textContent = member.name;
    document.getElementById('profileCode').textContent = `${member.code || member.id} • Tham gia: ${formatDate(member.joinDate)}`;
    document.getElementById('profileLevel').innerHTML = getLevelBadgeHTML(member.level);
    
    document.getElementById('profileRating').innerHTML = `
        ${member.rating} <small>pts</small>
        <button class="btn btn-outline-warning btn-sm ms-2 py-0 px-2" style="font-size: 0.75rem;" onclick="closeModal('profileModal'); openEditEloModal('${member.id}');" title="Chỉnh sửa Elo VĐV">
            <i class="fas fa-edit"></i> Sửa Elo
        </button>
    `;
    document.getElementById('profileRank').textContent = `#${rank}`;
    document.getElementById('profileSeasonPoints').textContent = member.seasonPoints || 0;

    // Stat boxes
    document.getElementById('profileMatches').textContent = member.matches || 0;
    document.getElementById('profileWins').textContent = member.wins || 0;
    document.getElementById('profileLosses').textContent = member.losses || 0;
    document.getElementById('profileWinRate').textContent = calculateWinRate(member.wins, member.matches);

    // Medals
    document.getElementById('profileGoldCount').textContent = member.championCount || 0;
    document.getElementById('profileSilverCount').textContent = member.silverCount || 0;
    document.getElementById('profileBronzeCount').textContent = member.bronzeCount || 0;

    // Personal details
    document.getElementById('profileGender').textContent = member.gender === 'male' ? 'Nam' : 'Nữ';
    document.getElementById('profileBirthYear').textContent = member.birthYear || 'N/A';
    document.getElementById('profileHand').textContent = member.dominantHand === 'left' ? 'Tay trái' : 'Tay phải';
    document.getElementById('profilePhone').textContent = member.phone || 'Chưa cập nhật';
    document.getElementById('profileEmail').textContent = member.email || 'Chưa cập nhật';
    document.getElementById('profileNotes').textContent = member.notes || 'Không có';

    // Member Match History Table
    const memberMatches = getMatches().filter(m => m.player1 === id || m.player2 === id || m.player1B === id || m.player2B === id);
    const historyBody = document.getElementById('profileMatchHistoryBody');
    if (historyBody) {
        if (memberMatches.length === 0) {
            historyBody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">VĐV chưa tham gia trận đấu nào.</td></tr>`;
        } else {
            let html = '';
            const tournaments = getTournaments();
            memberMatches.reverse().forEach(match => {
                const tour = tournaments.find(t => t.id === match.tournamentId);
                const tourName = tour ? tour.name : 'Giải đấu';
                
                const isP1 = match.player1 === id || match.player1B === id;
                const myScore = isP1 ? match.score1 : match.score2;
                const oppScore = isP1 ? match.score2 : match.score1;
                const isWin = (isP1 && (match.winner === match.player1 || match.winner === 'TEAM_1' || match.score1 > match.score2)) ||
                              (!isP1 && (match.winner === match.player2 || match.winner === 'TEAM_2' || match.score2 > match.score1));

                const resultBadge = isWin 
                    ? '<span class="badge badge-success">THẮNG</span>' 
                    : '<span class="badge badge-danger">THUA</span>';

                const ratingBefore = isP1 ? match.ratingBefore1 : match.ratingBefore2;
                const ratingAfter = isP1 ? match.ratingAfter1 : match.ratingAfter2;
                const eloDiff = (ratingAfter && ratingBefore) ? (ratingAfter - ratingBefore) : 0;
                const eloDiffStr = eloDiff > 0 ? `+${eloDiff}` : `${eloDiff}`;

                html += `
                    <tr>
                        <td>${tourName}</td>
                        <td>${formatDateTime(match.playedAt)}</td>
                        <td><small>${match.matchType === 'doubles' ? 'Đấu đôi (2v2)' : 'Đấu đơn'}</small></td>
                        <td>${resultBadge} <span class="ms-1">(${myScore} - ${oppScore})</span></td>
                        <td>${ratingBefore || '---'}</td>
                        <td><strong class="${eloDiff >= 0 ? 'text-success' : 'text-danger'}">${ratingAfter || '---'} (${eloDiffStr})</strong></td>
                    </tr>
                `;
            });
            historyBody.innerHTML = html;
        }
    }

    renderMemberRatingChart(member);
    openModal('profileModal');
}

function renderMemberRatingChart(member) {
    const ctx = document.getElementById('memberRatingChartCtx')?.getContext('2d');
    if (!ctx) return;

    if (memberRatingChart) {
        memberRatingChart.destroy();
    }

    const history = member.ratingHistory || [{ date: member.joinDate || 'Tham gia', rating: member.rating }];
    const labels = history.map(h => formatDate(h.date));
    const dataPoints = history.map(h => h.rating);

    memberRatingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Diễn biến Rating Elo',
                data: dataPoints,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#22c55e',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` Rating: ${context.parsed.y} điểm`;
                        }
                    }
                }
            },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}
