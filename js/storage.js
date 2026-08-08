/**
 * Storage Manager - FRIENDS PICKLEBALL CLUB
 * Manages LocalStorage, seed data with 3 level categories (Mới chơi, Trung bình, Khá), JSON/CSV exports, and undo stack.
 */

const STORAGE_KEYS = {
    MEMBERS: 'friends_members',
    MATCHES: 'friends_matches',
    TOURNAMENTS: 'friends_tournaments',
    SEASONS: 'friends_seasons',
    SETTINGS: 'friends_settings',
    UNDO_STACK: 'friends_undo_stack'
};

const DEFAULT_SETTINGS = {
    initialRating: 1000,
    kFactor: 32,
    pointsConfig: {
        champion: 100,
        runnerUp: 70,
        third: 50,
        fourth: 40,
        quarter: 30,
        group: 10,
        mvpBonus: 20
    },
    currentSeason: 'FRIENDS SEASON 2026',
    adminPin: '1302'
};

// Seed demo data if first launch
function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.SEASONS)) {
        const defaultSeasons = [
            { id: 'SEASON_2026', name: 'FRIENDS SEASON 2026', startDate: '2026-01-01', endDate: '2026-12-31', status: 'active' }
        ];
        localStorage.setItem(STORAGE_KEYS.SEASONS, JSON.stringify(defaultSeasons));
    }

    if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
        const demoMembers = [
            {
                id: 'MEM001',
                code: 'TV001',
                name: 'Nguyễn Văn An',
                displayName: 'An Nguyễn',
                gender: 'male',
                birthYear: 1992,
                phone: '0901234567',
                email: 'an.nguyen@example.com',
                joinDate: '2025-03-15',
                level: 'Trung bình',
                dominantHand: 'right',
                notes: 'Thích đánh đôi, giao bóng xoáy khá căng',
                rating: 1250,
                ratingHistory: [{ date: '2025-03-15', rating: 1000 }, { date: '2026-05-10', rating: 1120 }, { date: '2026-07-20', rating: 1250 }],
                seasonPoints: 450,
                matches: 18,
                wins: 15,
                losses: 3,
                tournaments: 4,
                championCount: 1,
                silverCount: 1,
                bronzeCount: 1,
                status: 'active',
                avatarBg: '#2563eb'
            },
            {
                id: 'MEM002',
                code: 'TV002',
                name: 'Trần Văn Bình',
                displayName: 'Bình Trần',
                gender: 'male',
                birthYear: 1988,
                phone: '0912345678',
                email: 'binh.tran@example.com',
                joinDate: '2025-01-10',
                level: 'Khá',
                dominantHand: 'right',
                notes: 'Vận động viên dink tốt, phản xạ nhanh',
                rating: 1210,
                ratingHistory: [{ date: '2025-01-10', rating: 1000 }, { date: '2026-04-12', rating: 1150 }, { date: '2026-07-20', rating: 1210 }],
                seasonPoints: 410,
                matches: 17,
                wins: 13,
                losses: 4,
                tournaments: 4,
                championCount: 1,
                silverCount: 0,
                bronzeCount: 2,
                status: 'active',
                avatarBg: '#059669'
            },
            {
                id: 'MEM003',
                code: 'TV003',
                name: 'Lê Minh Cường',
                displayName: 'Cường Lê',
                gender: 'male',
                birthYear: 1995,
                phone: '0923456789',
                email: 'cuong.le@example.com',
                joinDate: '2025-05-20',
                level: 'Trung bình',
                dominantHand: 'left',
                notes: 'Tay trái lắt léo, cú smash uy lực',
                rating: 1180,
                ratingHistory: [{ date: '2025-05-20', rating: 1000 }, { date: '2026-06-01', rating: 1100 }, { date: '2026-07-20', rating: 1180 }],
                seasonPoints: 380,
                matches: 15,
                wins: 11,
                losses: 4,
                tournaments: 3,
                championCount: 0,
                silverCount: 2,
                bronzeCount: 0,
                status: 'active',
                avatarBg: '#d97706'
            },
            {
                id: 'MEM004',
                code: 'TV004',
                name: 'Phạm Văn Dũng',
                displayName: 'Dũng Phạm',
                gender: 'male',
                birthYear: 1990,
                phone: '0934567890',
                email: 'dung.pham@example.com',
                joinDate: '2024-11-01',
                level: 'Khá',
                dominantHand: 'right',
                notes: 'Cựu VĐV Tennis chuyển sang Pickleball, kỹ thuật toàn diện',
                rating: 1320,
                ratingHistory: [{ date: '2024-11-01', rating: 1000 }, { date: '2025-08-15', rating: 1200 }, { date: '2026-07-20', rating: 1320 }],
                seasonPoints: 520,
                matches: 20,
                wins: 18,
                losses: 2,
                tournaments: 5,
                championCount: 3,
                silverCount: 1,
                bronzeCount: 0,
                status: 'active',
                avatarBg: '#7c3aed'
            },
            {
                id: 'MEM005',
                code: 'TV005',
                name: 'Hoàng Anh Đức',
                displayName: 'Đức Hoàng',
                gender: 'male',
                birthYear: 1993,
                phone: '0945678901',
                email: 'duc.hoang@example.com',
                joinDate: '2026-01-15',
                level: 'Mới chơi',
                dominantHand: 'right',
                notes: 'Mới tập chơi được 6 tháng, tinh thần giao lưu nhiệt tình',
                rating: 1040,
                ratingHistory: [{ date: '2026-01-15', rating: 1000 }, { date: '2026-07-20', rating: 1040 }],
                seasonPoints: 120,
                matches: 11,
                wins: 5,
                losses: 6,
                tournaments: 2,
                championCount: 0,
                silverCount: 0,
                bronzeCount: 0,
                status: 'active',
                avatarBg: '#dc2626'
            },
            {
                id: 'MEM006',
                code: 'TV006',
                name: 'Nguyễn Minh Hà',
                displayName: 'Hà Nguyễn',
                gender: 'female',
                birthYear: 1996,
                phone: '0956789012',
                email: 'ha.nguyen@example.com',
                joinDate: '2025-04-10',
                level: 'Trung bình',
                dominantHand: 'right',
                notes: 'Đánh đôi nữ rất ăn ý, phòng thủ kiên cường',
                rating: 1150,
                ratingHistory: [{ date: '2025-04-10', rating: 1000 }, { date: '2026-07-20', rating: 1150 }],
                seasonPoints: 340,
                matches: 15,
                wins: 10,
                losses: 5,
                tournaments: 3,
                championCount: 0,
                silverCount: 1,
                bronzeCount: 1,
                status: 'active',
                avatarBg: '#db2777'
            },
            {
                id: 'MEM007',
                code: 'TV007',
                name: 'Trần Quốc Huy',
                displayName: 'Huy Trần',
                gender: 'male',
                birthYear: 1991,
                phone: '0967890123',
                email: 'huy.tran@example.com',
                joinDate: '2024-12-05',
                level: 'Khá',
                dominantHand: 'right',
                notes: 'Đẩy bóng sâu hiệu quả, giao bóng khó',
                rating: 1280,
                ratingHistory: [{ date: '2024-12-05', rating: 1000 }, { date: '2026-07-20', rating: 1280 }],
                seasonPoints: 480,
                matches: 19,
                wins: 16,
                losses: 3,
                tournaments: 5,
                championCount: 1,
                silverCount: 2,
                bronzeCount: 1,
                status: 'active',
                avatarBg: '#0891b2'
            },
            {
                id: 'MEM008',
                code: 'TV008',
                name: 'Lê Văn Khánh',
                displayName: 'Khánh Lê',
                gender: 'male',
                birthYear: 1997,
                phone: '0978901234',
                email: 'khanh.le@example.com',
                joinDate: '2026-03-01',
                level: 'Mới chơi',
                dominantHand: 'right',
                notes: 'Đang rèn luyện kỹ thuật kitchen line',
                rating: 980,
                ratingHistory: [{ date: '2026-03-01', rating: 1000 }, { date: '2026-07-20', rating: 980 }],
                seasonPoints: 80,
                matches: 10,
                wins: 3,
                losses: 7,
                tournaments: 2,
                championCount: 0,
                silverCount: 0,
                bronzeCount: 0,
                status: 'active',
                avatarBg: '#475569'
            },
            {
                id: 'MEM009',
                code: 'TV009',
                name: 'Phạm Minh Long',
                displayName: 'Long Phạm',
                gender: 'male',
                birthYear: 1989,
                phone: '0989012345',
                email: 'long.pham@example.com',
                joinDate: '2025-06-18',
                level: 'Trung bình',
                dominantHand: 'right',
                notes: 'Đánh bền bỉ, ít mắc lỗi tự sát',
                rating: 1120,
                ratingHistory: [{ date: '2025-06-18', rating: 1000 }, { date: '2026-07-20', rating: 1120 }],
                seasonPoints: 290,
                matches: 14,
                wins: 8,
                losses: 6,
                tournaments: 3,
                championCount: 0,
                silverCount: 0,
                bronzeCount: 1,
                status: 'active',
                avatarBg: '#ea580c'
            },
            {
                id: 'MEM010',
                code: 'TV010',
                name: 'Nguyễn Văn Nam',
                displayName: 'Nam Nguyễn',
                gender: 'male',
                birthYear: 1994,
                phone: '0990123456',
                email: 'nam.nguyen@example.com',
                joinDate: '2025-02-28',
                level: 'Khá',
                dominantHand: 'right',
                notes: 'Di chuyển nhanh nhẹn, bắt lưới sắc bén',
                rating: 1230,
                ratingHistory: [{ date: '2025-02-28', rating: 1000 }, { date: '2026-07-20', rating: 1230 }],
                seasonPoints: 420,
                matches: 19,
                wins: 14,
                losses: 5,
                tournaments: 4,
                championCount: 1,
                silverCount: 0,
                bronzeCount: 1,
                status: 'active',
                avatarBg: '#16a34a'
            }
        ];
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(demoMembers));
    }

    if (!localStorage.getItem(STORAGE_KEYS.TOURNAMENTS)) {
        const demoTournaments = [
            {
                id: 'TOUR001',
                name: 'FRIENDS PICKLEBALL OPEN 2026 - MÙA HÈ',
                date: '2026-07-20',
                location: 'Sân Pickleball Friends Club - 123 Lê Văn Lương, Q.7',
                organizer: 'Ban Quản Trị CLB',
                format: 'Vòng bảng + Knockout',
                matchType: 'singles',
                courts: 3,
                notes: 'Giải đấu lớn nhất quý 3 năm 2026',
                status: 'completed',
                players: ['MEM001', 'MEM002', 'MEM003', 'MEM004', 'MEM006', 'MEM007', 'MEM009', 'MEM010'],
                winner: 'MEM004',
                runnerUp: 'MEM007',
                thirdPlace: 'MEM001',
                createdAt: '2026-07-15'
            },
            {
                id: 'TOUR002',
                name: 'GIẢI ĐÔI NAM NỮ GIAO LƯU THÁNG 8',
                date: '2026-08-15',
                location: 'Sân Pickleball Friends Club',
                organizer: 'Hội Viên CLB',
                format: 'Vòng tròn',
                matchType: 'doubles',
                courts: 2,
                notes: 'Giải giao lưu gắn kết thành viên',
                status: 'upcoming',
                players: ['MEM001', 'MEM002', 'MEM003', 'MEM004', 'MEM005', 'MEM006'],
                createdAt: '2026-08-01'
            }
        ];
        localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(demoTournaments));
    }

    if (!localStorage.getItem(STORAGE_KEYS.MATCHES)) {
        const demoMatches = [
            {
                id: 'MATCH001',
                tournamentId: 'TOUR001',
                matchType: 'singles',
                roundName: 'Chung Kết',
                court: 'Sân 1',
                player1: 'MEM004',
                player2: 'MEM007',
                score1: 15,
                score2: 11,
                winner: 'MEM004',
                loser: 'MEM007',
                eloChange1: +16,
                eloChange2: -16,
                ratingBefore1: 1304,
                ratingAfter1: 1320,
                ratingBefore2: 1296,
                ratingAfter2: 1280,
                status: 'completed',
                playedAt: '2026-07-20 16:30'
            },
            {
                id: 'MATCH002',
                tournamentId: 'TOUR001',
                matchType: 'singles',
                roundName: 'Tranh Hạng 3',
                court: 'Sân 2',
                player1: 'MEM001',
                player2: 'MEM002',
                score1: 15,
                score2: 13,
                winner: 'MEM001',
                loser: 'MEM002',
                eloChange1: +14,
                eloChange2: -14,
                ratingBefore1: 1236,
                ratingAfter1: 1250,
                ratingBefore2: 1224,
                ratingAfter2: 1210,
                status: 'completed',
                playedAt: '2026-07-20 15:45'
            },
            {
                id: 'MATCH003',
                tournamentId: 'TOUR001',
                matchType: 'singles',
                roundName: 'Bán Kết 1',
                court: 'Sân 1',
                player1: 'MEM004',
                player2: 'MEM001',
                score1: 15,
                score2: 8,
                winner: 'MEM004',
                loser: 'MEM001',
                eloChange1: +12,
                eloChange2: -12,
                ratingBefore1: 1292,
                ratingAfter1: 1304,
                ratingBefore2: 1248,
                ratingAfter2: 1236,
                status: 'completed',
                playedAt: '2026-07-20 14:30'
            }
        ];
        localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(demoMatches));
    }
}

// Data Retrieval Helpers
function recalculateAllMemberStats(membersArray) {
    const members = membersArray || JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || '[]');
    const matches = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || '[]');
    const tournaments = JSON.parse(localStorage.getItem(STORAGE_KEYS.TOURNAMENTS) || '[]');
    const settings = getSettings();
    const ptsConfig = settings.pointsConfig || { champion: 100, runnerUp: 70, third: 50, group: 10, matchWin: 5, matchLoss: 3 };

    const completedMatches = matches.filter(m => m.status === 'completed');
    const completedTournaments = tournaments.filter(t => t.status === 'completed');

    members.forEach(m => {
        const myMatches = completedMatches.filter(match => 
            match.player1 === m.id || 
            match.player2 === m.id || 
            match.player1B === m.id || 
            match.player2B === m.id
        );

        let wins = 0;
        let losses = 0;

        myMatches.forEach(match => {
            const isTeam1 = match.player1 === m.id || match.player1B === m.id;
            const team1Wins = match.score1 > match.score2;

            if ((isTeam1 && team1Wins) || (!isTeam1 && !team1Wins)) {
                wins++;
            } else {
                losses++;
            }
        });

        m.matches = myMatches.length;
        m.wins = wins;
        m.losses = losses;

        // Calculate Season Points: Match Wins (+5) - Match Losses (-3) + Completed Tournament Bonuses
        const winBonus = ptsConfig.matchWin !== undefined ? ptsConfig.matchWin : 5;
        const lossPenalty = ptsConfig.matchLoss !== undefined ? ptsConfig.matchLoss : 3;

        let seasonPts = (wins * winBonus) - (losses * lossPenalty);

        completedTournaments.forEach(tour => {
            if ((tour.players || []).includes(m.id)) {
                seasonPts += (ptsConfig.group || 10);
            }
            if (tour.winner) {
                const winnersList = tour.winner.split(',').map(s => s.trim());
                if (winnersList.includes(m.id)) {
                    seasonPts += (ptsConfig.champion || 100);
                }
            }
        });

        m.seasonPoints = seasonPts;
    });

    return members;
}

function getMembers() {
    let members = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || '[]');
    let modified = false;

    members.forEach(m => {
        if (typeof m.rating !== 'number' || isNaN(m.rating)) {
            m.rating = 1000;
            modified = true;
        }
        if (typeof m.seasonPoints !== 'number' || isNaN(m.seasonPoints)) {
            m.seasonPoints = 0;
            modified = true;
        }
    });

    // Automatically synchronize matches, wins, and losses count with actual matches in history
    members = recalculateAllMemberStats(members);

    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    return members;
}

function saveMembers(members) {
    const updated = recalculateAllMemberStats(members);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));
}

function getMemberById(id) {
    const members = getMembers();
    return members.find(m => m.id === id);
}

function getTournaments() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TOURNAMENTS) || '[]');
}

function saveTournaments(tournaments) {
    localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(tournaments));
}

function getTournamentById(id) {
    const tournaments = getTournaments();
    return tournaments.find(t => t.id === id);
}

function getMatches() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || '[]');
}

function saveMatches(matches) {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    recalculateAllMemberStats();
}

function getSettings() {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const settings = saved ? JSON.parse(saved) : { ...DEFAULT_SETTINGS };
    if (!settings.adminPin || settings.adminPin === '1234') {
        settings.adminPin = '1302';
        saveSettings(settings);
    }
    return settings;
}

function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

function getSeasons() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SEASONS) || '[]');
}

function saveSeasons(seasons) {
    localStorage.setItem(STORAGE_KEYS.SEASONS, JSON.stringify(seasons));
}

// Undo Stack Logic
function pushUndoSnapshot(description) {
    const stack = JSON.parse(localStorage.getItem(STORAGE_KEYS.UNDO_STACK) || '[]');
    stack.push({
        id: 'UNDO_' + Date.now(),
        timestamp: new Date().toISOString(),
        description: description,
        members: getMembers(),
        matches: getMatches(),
        tournaments: getTournaments()
    });
    if (stack.length > 20) stack.shift();
    localStorage.setItem(STORAGE_KEYS.UNDO_STACK, JSON.stringify(stack));
}

function popUndoSnapshot() {
    const stack = JSON.parse(localStorage.getItem(STORAGE_KEYS.UNDO_STACK) || '[]');
    if (stack.length === 0) return null;
    const lastSnapshot = stack.pop();
    localStorage.setItem(STORAGE_KEYS.UNDO_STACK, JSON.stringify(stack));

    saveMembers(lastSnapshot.members);
    saveMatches(lastSnapshot.matches);
    saveTournaments(lastSnapshot.tournaments);
    return lastSnapshot;
}

function getUndoStackLength() {
    const stack = JSON.parse(localStorage.getItem(STORAGE_KEYS.UNDO_STACK) || '[]');
    return stack.length;
}

// Reset Demo Data
function resetDemoData() {
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.MATCHES);
    localStorage.removeItem(STORAGE_KEYS.TOURNAMENTS);
    localStorage.removeItem(STORAGE_KEYS.SEASONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.UNDO_STACK);
    initStorage();
}

// Export / Import logic
function exportDataJSON() {
    const data = {
        app: 'FRIENDS_PICKLEBALL_CLUB',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        members: getMembers(),
        tournaments: getTournaments(),
        matches: getMatches(),
        seasons: getSeasons(),
        settings: getSettings()
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Friends_Pickleball_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportMembersCSV() {
    const members = getMembers();
    let csv = '\uFEFFMã TV,Họ Tên,Tên Hiển Thị,Giới Tính,Năm Sinh,Số Điện Thoại,Trình Độ,Rating,Điểm Mùa,Số Trận,Thắng,Thua,Số Giải,Trạng Thái\n';
    members.forEach(m => {
        csv += `"${m.code}","${m.name}","${m.displayName || ''}","${m.gender === 'male' ? 'Nam' : 'Nữ'}",${m.birthYear || ''},"${m.phone || ''}","${m.level}",${m.rating},${m.seasonPoints},${m.matches},${m.wins},${m.losses},${m.tournaments},"${m.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Danh_Sach_Thanh_Vien_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function importDataJSON(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        if (data.members) saveMembers(data.members);
        if (data.tournaments) saveTournaments(data.tournaments);
        if (data.matches) saveMatches(data.matches);
        if (data.seasons) saveSeasons(data.seasons);
        if (data.settings) saveSettings(data.settings);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// Initialize on load
initStorage();
