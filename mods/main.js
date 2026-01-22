document.addEventListener('DOMContentLoaded', () => {
    const modsGrid = document.getElementById('modsGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');

    fetch('mods.json')
        .then(response => response.json())
        .then(async (mods) => {
            for (const mod of mods) {
                try {
                    const res = await fetch(`https://api.modrinth.com/v2/project/${mod.id}`);
                    const data = await res.json();
                    
                    const teamRes = await fetch(`https://api.modrinth.com/v2/project/${mod.id}/members`);
                    const teamData = await teamRes.json();
                    const authorName = teamData[0]?.user.username || "Unknown";

                    const card = document.createElement('div');
                    // Προσθέτουμε τον τύπο (mod/resourcepack) ως class για το φιλτράρισμα
                    card.className = `mod-card ${data.project_type}`;
                    
                    // Επιλογή χρώματος badge ανάλογα με τον τύπο
                    const typeLabel = data.project_type === 'mod' ? 'MOD' : 'PACK';

                    card.innerHTML = `
                        <div class="card-header">
                            <img src="${data.icon_url || '../img/default-mod.png'}" alt="${data.title}">
                            <span class="type-badge ${data.project_type}">${typeLabel}</span>
                        </div>
                        <div class="card-content">
                            <h3 class="mod-title">${data.title}</h3>
                            <p class="mod-author">by <span>${authorName}</span></p>
                            <p class="mod-desc">${data.description}</p>
                            <a href="https://modrinth.com/mod/${data.slug}" target="_blank" class="download-link">Download</a>
                        </div>
                    `;
                    modsGrid.appendChild(card);
                } catch (err) { console.error(err); }
            }
        });

    // Λειτουργία Φιλτραρίσματος
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            const allCards = document.querySelectorAll('.mod-card');
            
            allCards.forEach(card => {
                if (filter === 'all' || card.classList.contains(filter)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});