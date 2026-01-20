document.addEventListener('DOMContentLoaded', () => {

    /* ================================
       1. ΡΥΘΜΙΣΕΙΣ ΠΟΝΤΩΝ & TIERLIST IDS
    ================================= */
  
    const points = [5, 3, 2];
    const defaultPoint = 1;
  
    const tierlistsIds = [
        'maceTier',
        'swordTier',
        'axeTier',
        'smpTier',
        'potTier',
        'nethPot',
        'vanillaTier',
        'uhcTier'
    ];
  
    const avatarFolder = 'img/avatars/'; // ✅ ΜΟΝΟ ΕΔΩ, ΜΙΑ ΦΟΡΑ
  
  
    /* ================================
       2. PLAYER STYLES
    ================================= */
  
    const playerStyle = {
        "Leo":     { color: "cyan",   emoji: "🦁" },
        "Thomas":  { color: "orange", emoji: "⚔️" },
        "Nikas":   { color: "lime",   emoji: "🛡️" },
        "Aggelos": { color: "violet", emoji: "🪓" },
        "Nikos":   { color: "red",    emoji: "🔥" },
        "Stamos":  { color: "yellow", emoji: "💎" }
    };
  
  
    /* ================================
       3. ΥΠΟΛΟΓΙΣΜΟΣ ΠΟΝΤΩΝ
    ================================= */
  
    const scores = {};
  
    tierlistsIds.forEach(id => {
        const ul = document.getElementById(id);
        if (!ul) return;
  
        const items = ul.querySelectorAll('li');
  
        items.forEach((li, index) => {
            const player = li.firstChild.textContent.trim();
            if (!player) return;
  
            const point = index < points.length ? points[index] : defaultPoint;
            scores[player] = (scores[player] || 0) + point;
  
            const style = playerStyle[player];
            if (style) {
                li.style.color = style.color;
                li.dataset.emoji = style.emoji;
            }
        });
    });
  
  
    /* ================================
   4. LEADERBOARD GENERATION
   ================================ */
    const sortedPlayers = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const tbody = document.querySelector('#overallLeaderboard tbody');

    sortedPlayers.forEach(([player, score], idx) => {
        const tr = document.createElement('tr');
        if (idx === 0) tr.classList.add('top1');

        const avatarSrc = `${avatarFolder}${player.toLowerCase().replace(/\s+/g, '')}.png`;
        const color = playerStyle[player]?.color || '#f0f0f0';
        const emoji = playerStyle[player]?.emoji ? playerStyle[player].emoji + " " : "";

        // Δημιουργία του περιεχομένου του NameTd
        const nameTd = document.createElement('td');
        nameTd.className = "name";
        nameTd.style.color = color;

        // Προσθήκη Emoji, Avatar και Ονόματος
        nameTd.innerHTML = `
            <span>${emoji}</span>
            <img src="${avatarSrc}" alt="${player}" onerror="this.src='img/default.png'">
            ${player}
        `;

        // ΑΝ ΕΙΝΑΙ Ο ΠΡΩΤΟΣ, πρόσθεσε το Badge
        if (idx === 0) {
            const badge = document.createElement('span');
            badge.className = 'master-badge';
            badge.textContent = 'PVP MASTER';
            nameTd.appendChild(badge);
        }

        const scoreTd = document.createElement('td');
        scoreTd.className = "points";
        scoreTd.textContent = score;

        tr.appendChild(nameTd);
        tr.appendChild(scoreTd);
        
        // Click event για NameMC
        tr.addEventListener('click', () => {
            const playerData = allPlayersData.find(p => p.name === player);
            if (playerData?.uuid) window.open(`https://el.namemc.com/profile/${playerData.uuid}`, '_blank');
        });

        tbody.appendChild(tr);
    });
  
  
    /* ================================
       5. ICON ΣΤΑ H2
    ================================= */
  
    document.querySelectorAll('.tierlists h2').forEach(h2 => {
        const ul = h2.nextElementSibling;
        if (!ul || !ul.id) return;
  
        const img = document.createElement('img');
        img.src = `img/tier/${ul.id}.png`;
        img.width = 50;
        img.height = 50;
        img.style.borderRadius = '50%';
        img.style.marginRight = '10px';
  
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.appendChild(img);
        wrapper.appendChild(document.createTextNode(h2.textContent));
  
        h2.textContent = '';
        h2.appendChild(wrapper);
    });
  
  
    /* ================================
       6. API RANKS
    ================================= */
  
    const PROXY_URL = "https://mctiers.thomasts1801.workers.dev";
  
    const modeMap = {
        mace: "maceTier",
        sword: "swordTier",
        axe: "axeTier",
        smp: "smpTier",
        pot: 'potTier',
        nethop: "nethPot",
        endcrystal: "vanillaTier",
        uhc: "uhcTier"
    };
  
    const POS_MAP = { 0: "HT", 1: "LT" };
  
    fetch('players.json')
        .then(res => res.json())
        .then(async players => {
  
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
                            player.ranks[jsonKey] = `${posPrefix}${apiMode.tier}`;
                        } else {
                            player.ranks[jsonKey] = "None";
                        }
                    });
  
                } catch (err) {
                    console.error(`❌ API error for ${player.name}`, err);
                }
            }
  
            Object.keys(modeMap).forEach(modeKey => {
                const ulId = modeMap[modeKey];
                const ul = document.getElementById(ulId);
                if (!ul) return;
  
                ul.querySelectorAll('li').forEach(li => {
                    const name = li.childNodes[0].textContent.trim();
                    const rankSpan = li.querySelector('.rank');
                    const player = players.find(p => p.name === name);
  
                    if (player && player.ranks[ulId] && player.ranks[ulId] !== "None") {
                        rankSpan.textContent = `[Tier: ${player.ranks[ulId]}]`;
                    } else {
                        rankSpan.textContent = '';
                    }
                });
            });
  
            console.log("🔥 RANKS φορτώθηκαν επιτυχώς");
        });
  
  
   /* ================================
    7. HOVER POPUP + POINTS & RANK
    ================================ */

    const tooltip = document.createElement('div');
    tooltip.className = 'player-tooltip';
    document.body.appendChild(tooltip);

    // Για να είναι διαθέσιμα τα API ranks
    let allPlayersData = []; // Θα γεμίσει μετά το fetch

    fetch('players.json')
    .then(res => res.json())
    .then(async players => {
        allPlayersData = players;

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
                        player.ranks[jsonKey] = `${posPrefix}${apiMode.tier}`;
                    } else {
                        player.ranks[jsonKey] = "None";
                    }
                });
            } catch(err) {
                console.error(`❌ API error for ${player.name}`, err);
            }
        }
    })
    .catch(err => console.error(err));

    // Event listeners για όλα τα li
    document.querySelectorAll('.tierlists li').forEach(li => {
        li.addEventListener('mouseenter', () => {
            const playerName = li.childNodes[0].textContent.trim();
            if (!playerName) return;
        
            const avatarPath = `${avatarFolder}${playerName.toLowerCase().replace(/\s+/g, '')}.png`;
            const playerPoints = scores[playerName] || 0;
            const playerData = allPlayersData.find(p => p.name === playerName);
            
            // Παίρνουμε το UUID αν υπάρχει
            const playerUUID = playerData ? playerData.uuid : 'Unknown';
        
            let rankText = '';
            if (playerData) {
                const ulId = li.parentElement.id;
                if (playerData.ranks && playerData.ranks[ulId] && playerData.ranks[ulId] !== "None") {
                    rankText = playerData.ranks[ulId];
                }
            }
        
            tooltip.innerHTML = `
                <img src="${avatarPath}" alt="${playerName}">
                <div>
                    <span style="font-weight:700; font-size: 18px; color:${playerStyle[playerName]?.color || '#fff'};">${playerName}</span><br>
                    <span style="font-size: 11px; color: rgba(255,255,255,0.5); font-family: monospace;">${playerUUID}</span><br>
                    <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 5px 0;">
                    <span style="font-size: 14px;">Points: <strong>${playerPoints}</strong></span><br>
                    ${rankText ? `<span style="font-size: 14px;">Rank: <strong>${rankText}</strong></span>` : ''}
                    <div style="font-size: 10px; margin-top: 5px; color: #aaa; font-style: italic;">Click to view NameMC profile</div>
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
    /* ================================
    8. CLICK TO NAMEMC
    ================================ */

    // Προσθέτουμε το click event σε όλα τα li των tierlists
    document.querySelectorAll('.tierlists li').forEach(li => {
        li.style.cursor = 'pointer'; // Αλλάζει το ποντίκι σε χεράκι για να φαίνεται click-able

        li.addEventListener('click', () => {
            const playerName = li.childNodes[0].textContent.trim();
            if (!playerName) return;

            // Βρίσκουμε τον παίκτη από τα δεδομένα που φορτώσαμε (allPlayersData)
            const playerData = allPlayersData.find(p => p.name === playerName);

            if (playerData && playerData.uuid) {
                // Ανοίγει το NameMC σε νέο tab (target="_blank")
                window.open(`https://el.namemc.com/profile/${playerData.uuid}`, '_blank');
            } else {
                console.warn(`⚠️ Δεν βρέθηκε UUID για τον παίκτη: ${playerName}`);
            }
        });
    });

    // Επίσης, προσθέτουμε το ίδιο για το Leaderboard αν θέλεις
    document.querySelector('#overallLeaderboard tbody').addEventListener('click', (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;

        // Παίρνουμε το όνομα του παίκτη (υποθέτουμε ότι είναι το τελευταίο κείμενο στο πρώτο TD)
        const playerName = tr.cells[0].textContent.trim();
        const playerData = allPlayersData.find(p => p.name === playerName);

        if (playerData && playerData.uuid) {
            window.open(`https://el.namemc.com/profile/${playerData.uuid}`, '_blank');
        }
    });
  
});
  