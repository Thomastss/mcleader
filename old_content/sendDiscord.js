const webhookURL = "https://discord.com/api/webhooks/1449055430608289934/v980zDiaKcdrG_RjBCk4Y_C0xNmxGRmjSLK-N0xcO3Zzt6yL3TLXREZP5OC-s6hdAyVK";

document.getElementById("pvpForm").addEventListener("submit", async function(e){
    e.preventDefault();

    const dateTimeInput = document.getElementById("dateTime").value;
    const dateObj = new Date(dateTimeInput);

    // Format DAY/MONTH/YEAR TIME AM/PM
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // 0-based months
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 => 12

    const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;

    const winner = document.getElementById("winner").value;
    const player1 = document.getElementById("player1").value;
    const player2 = document.getElementById("player2").value;
    const kit = document.getElementById("kit").value;
    const score = document.getElementById("score").value;
    const bestOf = document.getElementById("bestOf").value;
    const promotion = document.getElementById("promotion").value;
    const promotion_name = document.getElementById("promotionName").value;

    const payload = {
        content: `# ${formattedDateTime} 
**Winner:** <@${winner}>
<@${player1}> vs <@${player2}>
**Kit** = **${kit}** , \`Score: ${score}\` [best of${bestOf}]
# **${promotion_name} ${promotion}**`
    };

    try {
        const res = await fetch(webhookURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if(res.ok){
            document.getElementById("status").innerText = "Sent successfully!";
            document.getElementById("pvpForm").reset();
        } else {
            document.getElementById("status").innerText = "Failed to send!";
        }
    } catch(err) {
        console.error(err);
        document.getElementById("status").innerText = "Error occurred!";
    }
});
