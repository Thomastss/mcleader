document.addEventListener('DOMContentLoaded', () => {
    const points = [5,3,2]; 
    const defaultPoint = 1; 

    const tierlists = document.querySelectorAll('.tierlist');
    const scores = {};

    const allowedUsersDiscordIds = ['673171235273703426', 'DISCORD_ID_2'];
    let currentUserId = null;

    const loginBtn = document.getElementById('loginBtn');
    const searchInput = document.getElementById('searchPlayer');
    const leaderboardTable = document.getElementById('overallLeaderboard');
    const tierlistsContainer = document.querySelector('.tierlists-container');

    // Discord OAuth login
    loginBtn.addEventListener('click', () => {
        const clientId = '1447659829396246720';
        const redirectUri = encodeURIComponent('https://thomastss.github.io/mcleader/');
        const scope = 'identify';
        const responseType = 'token';
        window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;
    });

    // Έλεγχος token στο URL
    const hash = window.location.hash;
    if(hash) {
        const token = hash.split('&')[0].split('=')[1];
        fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(user => {
            currentUserId = user.id;
            loginBtn.style.display = 'none';
            searchInput.style.display = 'block';
            leaderboardTable.style.display = 'table';
            tierlistsContainer.style.display = 'flex';
            updateLeaderboard();
        });
    }

    // Drag & Drop
    let draggedItem = null;

    tierlists.forEach(list => {
        list.addEventListener('dragstart', e => {
            if(!allowedUsersDiscordIds.includes(currentUserId)){
                e.preventDefault();
                return;
            }
            draggedItem = e.target;
            e.target.classList.add('dragging');
        });

        list.addEventListener('dragend', e => {
            e.target.classList.remove('dragging');
            updateLeaderboard();
        });

        list.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(list, e.clientY);
            if(afterElement == null) {
                list.appendChild(draggedItem);
            } else {
                list.insertBefore(draggedItem, afterElement);
            }
        });
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height/2;
            if(offset < 0 && offset > closest.offset) return {offset: offset, element: child};
            return closest;
        }, {offset: Number.NEGATIVE_INFINITY}).element;
    }

    // Leaderboard calculation
    function updateLeaderboard() {
        Object.keys(scores).forEach(k => delete scores[k]);

        tierlists.forEach(list => {
            const items = list.querySelectorAll('li');
            items.forEach((li,index) => {
                const player = li.textContent.trim();
                let point = index < points.length ? points[index] : defaultPoint;
                scores[player] = (scores[player] || 0) + point;
            });
        });

        const tbody = document.querySelector('#overallLeaderboard tbody');
        tbody.innerHTML = '';
        const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]);
        sorted.forEach(([player,score], idx) => {
            const tr = document.createElement('tr');
            if(idx===0) tr.classList.add('top1');
            tr.innerHTML = `<td>${player}</td><td>${score}</td>`;
            tbody.appendChild(tr);
        });
    }

    // Search
    searchInput.addEventListener('input', () => {
        const filter = searchInput.value.toLowerCase();
        const rows = document.querySelectorAll('#overallLeaderboard tbody tr');
        rows.forEach(row => {
            const player = row.children[0].textContent.toLowerCase();
            row.style.display = player.includes(filter) ? '' : 'none';
        });
    });
});
