// ----------------- populateTiers.js -----------------

const tierlistsIds = {
    mace: "maceTier",
    sword: "swordTier",
    axe: "axeTier",
    smp: "smpTier",
    pot: "potTier",
    nethop: "nethPot",
    vanilla: "vanillaTier",
    uhc: "uhcTier"
};

// Fetch tiers από το backend και γεμίζει τα <ul>
async function populateTiers() {
    try {
        // Δείχνει στο backend endpoint
        const res = await fetch("http://192.168.68.107:8000/tiers");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const tiersData = await res.json();

        Object.keys(tierlistsIds).forEach(modeKey => {
            const ulId = tierlistsIds[modeKey];
            const ul = document.getElementById(ulId);
            if (!ul) {
                console.warn(`⚠️ No <ul> with id '${ulId}'`);
                return;
            }

            // Καθαρίζει το UL
            ul.innerHTML = "";

            const players = tiersData[modeKey] || [];
            players.forEach(playerName => {
                const li = document.createElement("li");
                li.innerHTML = `${playerName} <span class="rank"></span>`;
                ul.appendChild(li);
            });

            console.log(`✅ Populated tier '${modeKey}' with ${players.length} players`);
        });

    } catch (err) {
        console.error("❌ Could not populate tiers:", err);
    }
}

// Όταν φορτώσει το DOM
document.addEventListener("DOMContentLoaded", () => {
    populateTiers();
});
