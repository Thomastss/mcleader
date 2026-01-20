document.addEventListener('DOMContentLoaded', () => {

    /* ============================================================
       1. SCORE SETTINGS & TIERLIST CONFIGURATION
       ============================================================ */
    const points = [5, 3, 2]; // Points for 1st, 2nd, and 3rd place
    const defaultPoint = 1;   // Points for everyone else
    
    // IDs matching the <ul> elements in your HTML
    const tierlistsIds = [
        'maceTier', 'swordTier', 'axeTier', 'smpTier',
        'potTier', 'nethPot', 'vanillaTier', 'uhcTier'
    ];

    /* ============================================================
       2. API & PROXY SETTINGS
       ============================================================ */
    const PROXY_URL = "https://mctiers.thomasts1801.workers.dev";
    
    // Maps API keys to your local HTML IDs
    const modeMap = {
        mace: "maceTier", sword: "swordTier", axe: "axeTier",
        smp: "smpTier", pot: 'potTier', nethop: "nethPot",
        endcrystal: "vanillaTier", uhc: "uhcTier"
    };
    const POS_MAP = { 0: "HT", 1: "LT" };

    const scores = {};
    
    // Create Tooltip element globally
    const tooltip = document.createElement('div');
    tooltip.className = 'player-tooltip';
    document.body.appendChild(tooltip);

    /* ============================================================
       3. CALCULATE SCORES BASED ON LIST POSITION
       ============================================================ */
    tierlistsIds.forEach(id => {
        const ul = document.getElementById(id);
        if (!ul) return;
        
        const items = ul.querySelectorAll('li');
        items.forEach((li, index) => {
            const player = li.firstChild.textContent.trim();
            if (!player) return;
            
            // Assign points: top 3 get specific points, others get default
            const point = index < points.length ? points[index] : defaultPoint;
            scores[player] = (scores[player] || 0) + point;
        });
    });

    /* ============================================================
       4. FETCH PLAYER DATA & GENERATE UI
       ============================================================ */
    fetch('players.json')
        .then(res => res.json())
        .then(async players => {
            
            // A) FETCH RANKS FROM API & ASSIGN MODE ICONS
            for (const player of players) {
                if (!player.uuid) continue;
                try {
                    const res = await fetch(`${PROXY_URL}?uuid=${player.uuid}`);
                    const apiData = await res.json();
                    player.ranks = {};
                    
                    Object.keys(modeMap).forEach(modeKey => {
                        const apiMode = apiData[modeKey];
                        const jsonKey = modeMap[modeKey];
                        
                        if (apiMode && apiMode.tier !== null && apiMode.pos !== null) {
                            const posPrefix = POS_MAP[apiMode.pos] || "";
                            player.ranks[jsonKey] = {
                                text: `${posPrefix}${apiMode.tier}`,
                                icon: `img/tier/${jsonKey}.png` // Icon path based on Mode ID
                            };
                        } else {
                            player.ranks[jsonKey] = "None";
                        }
                    });
                } catch (err) {
                    console.error(`❌ API error for ${player.name}`, err);
                }
            }

            // B) APPLY STYLES & RANKS TO TIERLIST ITEMS (LI)
            tierlistsIds.forEach(id => {
                const ul = document.getElementById(id);
                if (!ul) return;
                
                ul.querySelectorAll('li').forEach(li => {
                    const playerName = li.firstChild.textContent.trim();
                    const pData = players.find(p => p.name === playerName);
                    const rankSpan = li.querySelector('.rank');
                    
                    if (pData) {
                        // Apply color and emoji from JSON
                        li.style.color = pData.color || "#fff";
                        li.dataset.emoji = pData.emoji || "";

                        // Update Rank Badge with Icon and Text
                        const rankInfo = pData.ranks?.[id];
                        if (rankInfo && rankInfo !== "None") {
                            rankSpan.innerHTML = `
                                <img src="${rankInfo.icon}" style="width:16px; height:16px; margin-right:5px; vertical-align:middle;">
                                <span>${rankInfo.text}</span>
                            `;
                            // Toggle CSS classes for color (HT = Red, LT = Blue)
                            rankSpan.classList.add(rankInfo.text.includes('HT') ? 'rank-ht' : 'rank-lt');
                        } else if (rankSpan) {
                            rankSpan.innerHTML = '';
                        }
                    }
                });
            });

            // C) GENERATE MAIN LEADERBOARD TABLE
            const sortedPlayers = Object.entries(scores).sort((a, b) => b[1] - a[1]);
            const tbody = document.querySelector('#overallLeaderboard tbody');
            tbody.innerHTML = "";

            sortedPlayers.forEach(([playerName, score], idx) => {
                const pData = players.find(p => p.name === playerName);
                const tr = document.createElement('tr');
                if (idx === 0) tr.classList.add('top1');

                const color = pData?.color || '#f0f0f0';
                const emoji = pData?.emoji ? pData.emoji + " " : "";
                
                // Get 3D Bust from Visage API or use default image
                const avatarSrc = pData?.uuid 
                    ? `https://visage.surgeplay.com/bust/50/${pData.uuid}` 
                    : 'img/default.png';

                tr.innerHTML = `
                    <td class="name" style="color: ${color}">
                        <span>${emoji}</span>
                        <img src="${avatarSrc}" alt="${playerName}" onerror="this.src='img/default.png'">
                        ${playerName}
                        ${idx === 0 ? '<span class="master-badge">PVP MASTER</span>' : ''}
                    </td>
                    <td class="points">${score}</td>
                `;

                // Link row to NameMC profile
                tr.addEventListener('click', () => {
                    if (pData?.uuid) window.open(`https://el.namemc.com/profile/${pData.uuid}`, '_blank');
                });
                tbody.appendChild(tr);
            });

            // D) HOVER POPUP (TOOLTIP) LOGIC
            document.querySelectorAll('.tierlists li').forEach(li => {
                li.addEventListener('mouseenter', () => {
                    const playerName = li.childNodes[0].textContent.trim();
                    const pData = players.find(p => p.name === playerName);
                    const playerPoints = scores[playerName] || 0;
                    const ulId = li.parentElement.id;
                    const rankInfo = pData?.ranks?.[ulId];

                    const avatarPath = pData?.uuid 
                        ? `https://visage.surgeplay.com/bust/100/${pData.uuid}` 
                        : 'img/default.png';

                    tooltip.innerHTML = `
                        <img src="${avatarPath}" alt="${playerName}">
                        <div>
                            <span style="font-weight:700; font-size: 18px; color:${pData?.color || '#fff'};">${playerName}</span><br>
                            <span style="font-size: 11px; color: rgba(255,255,255,0.5); font-family: monospace;">${pData?.uuid || 'N/A'}</span><br>
                            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 5px 0;">
                            <span style="font-size: 14px;">Points: <strong>${playerPoints}</strong></span><br>
                            ${rankInfo && rankInfo !== "None" ? `<span style="font-size: 14px;">Rank: <strong>${rankInfo.text}</strong></span>` : ''}
                        </div>
                    `;
                    tooltip.style.opacity = '1';
                    tooltip.style.transform = 'scale(1)';
                });

                li.addEventListener('mousemove', e => {
                    tooltip.style.left = e.pageX + 15 + 'px';
                    tooltip.style.top = e.pageY + 15 + 'px';
                });

                li.addEventListener('mouseleave', () => {
                    tooltip.style.opacity = '0';
                    tooltip.style.transform = 'scale(0.9)';
                });
            });
        });

    /* ============================================================
       5. ADD CATEGORY ICONS TO H2 HEADINGS
       ============================================================ */
    document.querySelectorAll('.tierlists h2').forEach(h2 => {
        const ul = h2.nextElementSibling;
        if (!ul || !ul.id) return;
        
        const img = document.createElement('img');
        img.src = `img/tier/${ul.id}.png`;
        img.width = 40; 
        img.height = 40;
        img.style.marginRight = '12px';
        
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        
        wrapper.appendChild(img);
        wrapper.appendChild(document.createTextNode(h2.textContent));
        
        h2.textContent = ''; // Clear original text
        h2.appendChild(wrapper);
    });
});