document.addEventListener('DOMContentLoaded', () => {
    const PROXY_URL = "https://mctiers.thomasts1801.workers.dev";
    
    const modeMap = {
        mace: "maceTier", 
        sword: "swordTier", 
        axe: "axeTier",
        smp: "smpTier", 
        pot: 'potTier', 
        nethop: "nethPot",
        vanilla: "vanillaTier", 
        uhc: "uhcTier"
    };

    const tierlistsIds = Object.values(modeMap);
    const POS_MAP = { 0: "HT", 1: "LT" };
    const pointsConfig = [1000, 750, 500]; 
    const defaultPoint = 100; 

    const scores = {};

    // Tab System
    window.showTier = function(tierId) {
        document.querySelectorAll('.tier-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tier-content').forEach(content => content.classList.remove('active'));
        const selectedBtn = document.querySelector(`button[onclick="showTier('${tierId}')"]`);
        if (selectedBtn) selectedBtn.classList.add('active');
        const selectedContent = document.getElementById(tierId);
        if (selectedContent) selectedContent.classList.add('active');
    };

    fetch('players.json')
        .then(res => res.json())
        .then(async players => {
            
            // 1. API Fetching για τα Ranks
            for (const player of players) {
                if (!player.uuid) continue;
                try {
                    const res = await fetch(`${PROXY_URL}?uuid=${player.uuid}`);
                    const apiData = await res.json();
                    player.mctiersRanks = {};

                    Object.keys(modeMap).forEach(modeKey => {
                        const apiMode = apiData[modeKey];
                        const htmlListId = modeMap[modeKey];
                        if (apiMode && apiMode.tier !== null && apiMode.pos !== null) {
                            const posPrefix = POS_MAP[apiMode.pos] || "";
                            player.mctiersRanks[htmlListId] = {
                                text: `${posPrefix}${apiMode.tier}`,
                                icon: `img/tier/${htmlListId}.png` 
                            };
                        }
                    });
                } catch (err) {
                    console.error(`❌ API Error for ${player.name}:`, err);
                }
            }

            // 2. Επεξεργασία των LI (Structure: #Rank | Emoji | Name | Rank | Pts)
            tierlistsIds.forEach(id => {
                const ul = document.getElementById(id);
                if (!ul) return;
                
                ul.querySelectorAll('li').forEach((li, index) => {
                    const playerName = li.textContent.trim();
                    const pData = players.find(p => p.name === playerName);
                    
                    if (pData) {
                        li.style.color = pData.color || "#fff";
                        const emoji = pData.emoji || '';
                        const point = index < pointsConfig.length ? pointsConfig[index] : defaultPoint;
                        
                        // Πρόσθεση πόντων στο συνολικό σκορ
                        scores[playerName] = (scores[playerName] || 0) + point;

                        // Υπολογισμός Rank Text και Χρώματος
                        const rankNum = index + 1;
                        let rankText = "";
                        let rankColor = "#a0a0a0"; // Default Gray για 4+

                        if (rankNum === 1) {
                            rankText = "1st";
                            rankColor = "#FFD700"; // Gold
                        } else if (rankNum === 2) {
                            rankText = "2nd";
                            rankColor = "#C0C0C0"; // Silver
                        } else if (rankNum === 3) {
                            rankText = "3rd";
                            rankColor = "#CD7F32"; // Bronze
                        } else {
                            rankText = `${rankNum}th`;
                        }

                        // Δημιουργία HTML δομής li
                        // Μέσα στο loop των tierlists, άλλαξε το li.innerHTML σε αυτό:
                        li.innerHTML = `
                        <span class="position-rank" style="--rank-color: ${rankColor}; color: ${rankColor};">
                            ${rankText}
                        </span>
                        <span class="player-emoji">${emoji}</span>
                        <span class="player-name-text">${playerName}</span>
                        <span class="rank"></span>
                        <span class="pts">${point} PTS</span>
                        `;

                        // Τοποθέτηση του API Rank αν υπάρχει
                        const rankSpan = li.querySelector('.rank');
                        if (pData.mctiersRanks && pData.mctiersRanks[id]) {
                            const rankInfo = pData.mctiersRanks[id];
                            rankSpan.innerHTML = `
                                <img src="${rankInfo.icon}" style="width:16px; height:16px; margin-right:5px; vertical-align:middle;">
                                <span>${rankInfo.text}</span>
                            `;
                            rankSpan.style.color = rankInfo.text.includes('HT') ? '#ff4d4d' : '#4da6ff';
                        }
                    }
                });
            });
            // 3. Leaderboard Generation
            // B) GENERATE MAIN LEADERBOARD TABLE
            const sortedPlayers = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const tbody = document.querySelector('#overallLeaderboard tbody');
        tbody.innerHTML = "";

        sortedPlayers.forEach(([playerName, score], idx) => {
            const pData = players.find(p => p.name === playerName);
            const tr = document.createElement('tr');
            tr.className = 'leaderboard-row';
            if (idx === 0) tr.classList.add('top1');

            // Δημιουργία των mode icons
            let ranksHtml = '';
            tierlistsIds.forEach(id => {
                const ul = document.getElementById(id);
                const listItems = Array.from(ul.querySelectorAll('li'));
                // Αναζήτηση του παίκτη μέσα στα νέα spans
                const playerPos = listItems.findIndex(li => li.querySelector('.player-name-text')?.innerText === playerName);

                if (playerPos !== -1) {
                    ranksHtml += `
                        <div class="mode-rank-box">
                            <img src="img/tier/${id}.png" alt="${id}">
                            <span data-rank="#${playerPos + 1}">#${playerPos + 1}</span>
                        </div>
                    `;
                } else {
                    ranksHtml += `
                        <div class="mode-rank-box empty">
                            <img src="img/tier/${id}.png" alt="${id}">
                            <span>-</span>
                        </div>
                    `;
                }
            });

            const color = pData?.color || '#f0f0f0';
            const emoji = pData?.emoji || '';
            const avatarSrc = pData?.uuid 
                ? `https://visage.surgeplay.com/bust/60/${pData.uuid}` 
                : 'img/default.png';

            tr.innerHTML = `
                <td class="player-info-cell">
                    <div class="rank-number">${idx + 1}</div>
                    <img src="${avatarSrc}" class="player-avatar" alt="${playerName}" onerror="this.src='img/default.png'">
                    <div class="player-meta">
                        <span class="player-name" style="color: ${color}">
                            <span class="player-emoji">${emoji}</span> ${playerName}
                        </span>
                        <div class="player-stats-sub">
                            <span class="pts-text" style="color: ${color}">${score} pts</span>
                            ${idx === 0 ? '<span class="master-badge">MASTER</span>' : idx < 3 ?'<span class="expert-badge">EXPERT</span>' : idx < 5 ?'<span class="pro-badge">PRO</span>' :'<span class="noob-badge">NOOB</span>'}
                        </div>
                    </div>
                </td>
                <td class="player-ranks-cell">
                    <div class="ranks-container">
                        ${ranksHtml}
                    </div>
                </td>
            `;

            // Αφαιρέθηκε το event listener για το NameMC
            tbody.appendChild(tr);
        });
    });
});