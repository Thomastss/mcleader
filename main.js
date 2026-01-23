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
                        li.style.cursor = "pointer"; // Κάνουμε το ποντίκι να φαίνεται clickable
                        
                        const emoji = pData.emoji || '';
                        const point = index < pointsConfig.length ? pointsConfig[index] : defaultPoint;
                        
                        // Πρόσθεση πόντων στο συνολικό σκορ
                        scores[playerName] = (scores[playerName] || 0) + point;
            
                        // Υπολογισμός Rank Text και Χρώματος
                        const rankNum = index + 1;
                        let rankText = "";
                        let rankColor = "#a0a0a0"; 
            
                        if (rankNum === 1) {
                            rankText = "1st";
                            rankColor = "#FFD700"; 
                        } else if (rankNum === 2) {
                            rankText = "2nd";
                            rankColor = "#C0C0C0"; 
                        } else if (rankNum === 3) {
                            rankText = "3rd";
                            rankColor = "#CD7F32"; 
                        } else {
                            rankText = `${rankNum}th`;
                        }
            
                        li.innerHTML = `
                            <span class="position-rank" style="--rank-color: ${rankColor}; color: ${rankColor};">
                                ${rankText}
                            </span>
                            <span class="player-emoji">${emoji}</span>
                            <span class="player-name-text">${playerName}</span>
                            <span class="rank"></span>
                            <span class="pts">${point} PTS</span>
                        `;
            
                        const rankSpan = li.querySelector('.rank');
                        if (pData.mctiersRanks && pData.mctiersRanks[id]) {
                            const rankInfo = pData.mctiersRanks[id];
                            rankSpan.innerHTML = `
                                <img src="${rankInfo.icon}" style="width:16px; height:16px; margin-right:5px; vertical-align:middle;">
                                <span>${rankInfo.text}</span>
                            `;
                            rankSpan.style.color = rankInfo.text.includes('HT') ? '#ff4d4d' : '#4da6ff';
                        }
            
                        // --- ΠΡΟΣΘΗΚΗ CLICK EVENT ---
                        li.addEventListener('click', () => {
                            // Χρησιμοποιούμε το score που έχει μαζέψει μέχρι στιγμής ο παίκτης
                            const currentScore = scores[playerName] || 0;
                            openPlayerModal(pData, currentScore);
                        });
                        // ----------------------------
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

            tr.addEventListener('click', () => {
                openPlayerModal(pData, score);
            });

            tbody.appendChild(tr);
            const loader = document.getElementById('loader');
            if (loader) {
                loader.classList.add('fade-out');
            }
        });
    });

    window.openPlayerModal = function(pData, score) {
        const modal = document.getElementById('infoModal');
        const modalBody = modal.querySelector('.modal-body');
        const modalHeader = modal.querySelector('.modal-header h2');
    
        // 1. Κατασκευή του Ranks Grid (Local vs API)
        let ranksGridHtml = '';
        
        // Χρησιμοποιούμε το modeMap που όρισες στην αρχή του script σου
        const modes = {
            'maceTier': 'Mace',
            'swordTier': 'Sword',
            'axeTier': 'Axe',
            'smpTier': 'SMP',
            'potTier': 'Pot',
            'nethPot': 'NethPot',
            'vanillaTier': 'Vanilla',
            'uhcTier': 'UHC'
        };
    
        Object.keys(modes).forEach(id => {
            const ul = document.getElementById(id);
            if (!ul) return;
            
            const listItems = Array.from(ul.querySelectorAll('li'));
            const playerPos = listItems.findIndex(li => li.querySelector('.player-name-text')?.innerText === pData.name);
            const apiTierInfo = pData.mctiersRanks ? pData.mctiersRanks[id] : null;
    
            if (playerPos !== -1) {
                const rankNum = playerPos + 1;
                const isHT = apiTierInfo?.text.includes('HT');
    
                ranksGridHtml += `
                    <div class="modal-mode-card" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px; border: 1px solid var(--border); text-align: center;">
                        <img src="img/tier/${id}.png" style="width: 24px; margin-bottom: 5px;">
                        <div style="font-size: 10px; color: #888; text-transform: uppercase;">Local Rank</div>
                        <div style="font-size: 18px; font-weight: 900; color: var(--accent);">#${rankNum}</div>
                        
                        <div style="margin: 8px 0; border-top: 1px solid rgba(255,255,255,0.1);"></div>
                        
                        <div style="font-size: 10px; color: #888; text-transform: uppercase;">MCTiers</div>
                        <div style="color: ${isHT ? '#ff4d4d' : '#00d4ff'}; font-weight: 800; font-size: 14px;">
                            ${apiTierInfo ? apiTierInfo.text : 'N/A'}
                        </div>
                    </div>
                `;
            }
        });
    
        // 2. Update Header
        modalHeader.innerHTML = `🛡️ Player Profile`;
    
        // 3. Generate HTML
        modalBody.innerHTML = `
            <div class="player-modal-content" style="display: flex; gap: 30px; align-items: flex-start; flex-wrap: wrap; padding: 10px;">
                
                <div class="modal-left" style="flex: 0 0 200px; text-align: center;">
                    <img src="https://visage.surgeplay.com/full/350/${pData.uuid}" alt="${pData.name}" 
                         style="width: 100%; filter: drop-shadow(0 15px 25px rgba(0,0,0,0.6)); margin-bottom: 20px;">
                    
                    <a href="https://namemc.com/profile/${pData.uuid}" target="_blank" 
                       style="display: flex; align-items: center; justify-content: center; gap: 8px; background: #121212; color: white; text-decoration: none; padding: 10px; border-radius: 8px; border: 1px solid #333; font-weight: 700; transition: 0.2s;"
                       onmouseover="this.style.background='#222'" onmouseout="this.style.background='#121212'">
                       <img src="https://namemc.com/favicon.ico" style="width: 16px;"> View NameMC
                    </a>
                </div>
                
                <div class="modal-right" style="flex: 1; min-width: 300px;">
                    <h3 style="color: ${pData.color || '#fff'}; font-size: 36px; margin-bottom: 5px; font-weight: 900;">
                        ${pData.emoji || ''} ${pData.name}
                    </h3>
                    
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 6px; width: fit-content;">
                        <span style="font-family: monospace; font-size: 12px; color: #aaa;">${pData.uuid}</span>
                        <button onclick="navigator.clipboard.writeText('${pData.uuid}')" style="background:none; border:none; color:var(--accent); cursor:pointer; font-size:12px;" title="Copy UUID">📋</button>
                    </div>
    
                    <div style="background: var(--panel-dark); padding: 15px; border-radius: 12px; border: 1px solid var(--accent); margin-bottom: 25px;">
                        <span style="color: #888; text-transform: uppercase; font-size: 11px; font-weight: 700;">Total Leaderboard Points</span>
                        <div style="font-size: 32px; font-weight: 900; color: var(--accent);">${score.toLocaleString()} <span style="font-size: 16px;">PTS</span></div>
                    </div>
                    
                    <h4 style="color: #666; text-transform: uppercase; font-size: 12px; letter-spacing: 1.5px; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                        Mode Breakdown
                    </h4>
                    
                    <div class="modal-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px;">
                        ${ranksGridHtml || '<p style="opacity:0.5;">No active rankings found for this player.</p>'}
                    </div>
                </div>
            </div>
        `;
    
        modal.style.display = "block";
    };
    
    // Κλείσιμο του modal όταν πατάει ο χρήστης το X ή έξω από αυτό
    window.onclick = function(event) {
        const modal = document.getElementById('infoModal');
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    function showTier(tierId, btn) {
        // Remove active from all buttons
        document.querySelectorAll('.tier-btn').forEach(b => {
            b.classList.remove('active');
        });

        // Hide all tier lists
        document.querySelectorAll('.tier-content').forEach(list => {
            list.classList.remove('active');
        });

        // Show selected tier
        const selectedList = document.getElementById(tierId);
        if (selectedList) {
            selectedList.classList.add('active');
        }

        // Activate clicked button
        btn.classList.add('active');
    }


    // Modal Functionality
    const infoModal = document.getElementById("infoModal");
    const infoBtn = document.getElementById("infoBtn");
    const closeBtn = infoModal.querySelector(".close-btn");

    // Άνοιγμα Popup
    infoBtn.onclick = () => {
        infoModal.style.display = "block";
    }

    // Κλείσιμο με το 'X'
    closeBtn.onclick = () => {
        infoModal.style.display = "none";
    }

    // Κλείσιμο αν πατήσεις οπουδήποτε έξω από το popup
    window.onclick = (event) => {
        if (event.target == infoModal) {
            infoModal.style.display = "none";
        }
    }
});