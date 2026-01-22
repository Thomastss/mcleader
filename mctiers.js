// Modal Functionality
const infoModal = document.getElementById("infoModal");
const infoBtn = document.getElementById("infoBtn");
const closeBtn = document.querySelector(".close-btn");

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