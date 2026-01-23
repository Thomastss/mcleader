document.addEventListener('DOMContentLoaded', async () => {
    const modsGrid = document.getElementById('modsGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');

    const CACHE_KEY = 'modsCache_v1';
    const CACHE_TIME = 1000 * 60 * 30; // 30 min

    // Try load from cache
    try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
        if (cached && Date.now() - cached.time < CACHE_TIME) {
            modsGrid.innerHTML = cached.html;
            initFiltering();
            return;
        }
    } catch (e) {
        console.warn("Cache invalid, will reload:", e);
    }

    modsGrid.classList.add('loading');

    try {
        const modsRes = await fetch('data.json');
        const mods = await modsRes.json();

        const requests = mods.map(mod =>
            Promise.allSettled([
                fetch(`https://api.modrinth.com/v2/project/${mod.id}`).then(r => r.json()),
                fetch(`https://api.modrinth.com/v2/project/${mod.id}/members`).then(r => r.json())
            ])
        );

        const results = await Promise.all(requests);
        const fragment = document.createDocumentFragment();

        results.forEach((res, index) => {
            let data, team;

            if (res[0].status === 'fulfilled') data = res[0].value;
            else data = { title: mods[index].id, description: "Failed to load", project_type: "mod", icon_url: "../img/default-mod.png", slug: mods[index].id };

            if (res[1].status === 'fulfilled') team = res[1].value;
            else team = [];

            const authorName = team[0]?.user?.username || 'Unknown';
            const typeLabel = data.project_type === 'mod' ? 'MOD' : 'PACK';

            const card = document.createElement('div');
            card.className = `mod-card ${data.project_type}`;

            card.innerHTML = `
                <div class="card-header">
                    <img loading="lazy" src="${data.icon_url || '../img/default-mod.png'}" alt="${data.title}">
                    <span class="type-badge ${data.project_type}">${typeLabel}</span>
                </div>
                <div class="card-content">
                    <h3 class="mod-title">${data.title}</h3>
                    <p class="mod-author">by <span>${authorName}</span></p>
                    <p class="mod-desc">${data.description}</p>
                    <a href="https://modrinth.com/mod/${data.slug}" target="_blank" class="download-link">Download</a>
                </div>
            `;
            fragment.appendChild(card);
        });

        modsGrid.innerHTML = '';
        modsGrid.appendChild(fragment);
        modsGrid.classList.remove('loading');

        // Save cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), html: modsGrid.innerHTML }));

        initFiltering();
    } catch (err) {
        console.error("Failed to load mods:", err);
        modsGrid.innerHTML = '<p style="color:#aaa">Failed to load mods.</p>';
    }

    function initFiltering() {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.dataset.filter;
                document.querySelectorAll('.mod-card').forEach(card => {
                    card.style.display =
                        filter === 'all' || card.classList.contains(filter)
                            ? 'block'
                            : 'none';
                });
            });
        });
    }
});
