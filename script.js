document.addEventListener("DOMContentLoaded", () => {
    /* configuration */
    const { expansion, startNumber, endNumber } = window.DBZ_CONFIG;

    const TOTAL_CARDS = endNumber - startNumber + 1;

    const baseUrl = `https://res.cloudinary.com/dbzcardcollection/image/upload/${expansion}`;
    const STORAGE_KEY = `dbz_cards_${expansion}`;

    /* local storage */
    function loadCards() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    }

    function saveCards(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    const savedCards = loadCards();

    /* generate images */
    const images = [];

    for (let i = startNumber; i <= endNumber; i++) {
        images.push(`${baseUrl}/${i}.jpg`);
    }

    /* create grid */
    const grid = document.getElementById("grid");
    const template = document.getElementById("item-template");

    images.forEach((url, index) => {
        const clone = template.content.cloneNode(true);
        const item = clone.querySelector(".item");
        const img = clone.querySelector(".card img");
        const cardNumber = clone.querySelector(".card-number");
        const realNumber = startNumber + index;

        img.src = url;
        cardNumber.textContent = realNumber;

        setupCounter(item, realNumber);
        grid.appendChild(clone);
    });

    /* counter */
    function setupCounter(item, cardId) {
        const img = item.querySelector('.card img');
        const cardNumber = item.querySelector('.card-number');
        const counter = item.querySelector('.counter');
        const minus = item.querySelector('.minus');
        const plus = item.querySelector('.plus');
        const countEl = item.querySelector('.count');

        const cardData = savedCards[cardId] || { hasCard: false, repeats: 0 };
        let hasCard = cardData.hasCard;
        let repeats = cardData.repeats;

        function persist() {
            savedCards[cardId] = { hasCard, repeats };
            saveCards(savedCards);
            updateSummaryUI();
            updateMarkAllButton();
        }

        function updateUI() {
            countEl.textContent = hasCard ? repeats : "-";
            img.classList.toggle('disabled', !hasCard);
            counter.classList.toggle('disabled', !hasCard);
            cardNumber.classList.toggle('active', hasCard);
            minus.classList.toggle('disabled', repeats === 0);
        }

        img.addEventListener('click', () => {
            const realData = savedCards[cardId] || { hasCard: false, repeats: 0 };
            hasCard = realData.hasCard;
            repeats = realData.repeats;

            hasCard = !hasCard;
            if (!hasCard) repeats = 0;

            persist();
            updateUI();
        });

        plus.addEventListener('click', () => {
            const realData = savedCards[cardId] || { hasCard: false, repeats: 0 };
            hasCard = realData.hasCard;
            repeats = realData.repeats;

            if (hasCard) {
                repeats++;
                persist();
                updateUI();
            }
        });

        minus.addEventListener('click', () => {
            const realData = savedCards[cardId] || { hasCard: false, repeats: 0 };
            hasCard = realData.hasCard;
            repeats = realData.repeats;

            if (hasCard && repeats > 0) {
                repeats--;
                persist();
                updateUI();
            }
        });

        updateUI();
    }

    /* summary */
    function getSummary() {
        const data = loadCards();
        let obtenidas = 0;
        let faltantes = 0;
        let repetidas = 0;

        for (let i = startNumber; i <= endNumber; i++) {
            const card = data[i];
            if (card?.hasCard) {
                obtenidas++;
                repetidas += card.repeats;
            } else {
                faltantes++;
            }
        }

        return { obtenidas, faltantes, repetidas };
    }

    function updateSummaryUI() {
        const summary = getSummary();
        document.getElementById("total").textContent = TOTAL_CARDS;
        document.getElementById("obtained").textContent = summary.obtenidas;
        document.getElementById("missing").textContent = summary.faltantes;
        document.getElementById("repeated").textContent = summary.repetidas;
    }

    /* filters */
    document.querySelectorAll(".summary-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            filterCards(btn.dataset.filter);
        });
    });

    function filterCards(type) {
        searchInput.value = "";
        const data = loadCards();
        const items = document.querySelectorAll(".item");

        items.forEach((item, index) => {
            const cardId = startNumber + index;
            const card = data[cardId];

            let show = false;

            switch (type) {
                case "all":
                    show = true;
                    break;
                case "obtained":
                    show = card?.hasCard;
                    break;
                case "missing":
                    show = !card?.hasCard;
                    break;
                case "repeated":
                    show = card?.hasCard && card.repeats > 0;
                    break;
            }

            item.style.display = show ? "" : "none";
        });
    }

    /* mark all cards */
    function markAllCards() {
        for (let i = startNumber; i <= endNumber; i++) {
            savedCards[i] = {
                hasCard: true,
                repeats: 0
            };
        }

        saveCards(savedCards);

        document.querySelectorAll(".item").forEach(item => {
            const img = item.querySelector('.card img');
            const cardNumber = item.querySelector('.card-number');
            const counter = item.querySelector('.counter');
            const countEl = item.querySelector('.count');
            const minus = item.querySelector('.minus');

            img.classList.remove('disabled');
            counter.classList.remove('disabled');
            cardNumber.classList.add('active');
            countEl.textContent = 0;
            minus.classList.add('disabled');
        });

        updateSummaryUI();
        updateMarkAllButton();
    }

    document.getElementById("markAllBtn").addEventListener("click", () => {
        if (areAllCardsMarked()) {
            if (confirm("¿Desmarcar todas las cartas?")) {
                unmarkAllCards();
            }
        } else {
            if (confirm("¿Marcar todas las cartas como obtenidas?")) {
                markAllCards();
            }
        }
    });

    /* unmark all cards */
    function areAllCardsMarked() {
        const data = loadCards();

        for (let i = startNumber; i <= endNumber; i++) {
            if (!data[i]?.hasCard) {
                return false;
            }
        }
        return true;
    }

    function updateMarkAllButton() {
        const btn = document.getElementById("markAllBtn");

        if (areAllCardsMarked()) {
            btn.classList.add("active");
            btn.setAttribute("aria-label", "Desmarcar todas");
        } else {
            btn.classList.remove("active");
            btn.setAttribute("aria-label", "Marcar todas");
        }
    }

    function unmarkAllCards() {
        for (let i = startNumber; i <= endNumber; i++) {
            savedCards[i] = {
                hasCard: false,
                repeats: 0
            };
        }

        saveCards(savedCards);

        document.querySelectorAll(".item").forEach(item => {
            const img = item.querySelector('.card img');
            const cardNumber = item.querySelector('.card-number');
            const counter = item.querySelector('.counter');
            const countEl = item.querySelector('.count');

            img.classList.add('disabled');
            counter.classList.add('disabled');
            cardNumber.classList.remove('active');
            countEl.textContent = "-";
        });

        updateSummaryUI();
        updateMarkAllButton();
    }

    /* copy cards */
    const copyBtn = document.querySelector(".copy_button");
    const copyModal = document.getElementById("copyModal");
    const preview = document.getElementById("copyPreview");
    const confirmCopy = document.getElementById("confirmCopy");
    const copyCountEl = document.getElementById("copyCount");

    let currentCopyText = "";

    copyBtn.addEventListener("click", () => {
        copyModal.style.display = "flex";

        const defaultType = "missing";
        currentCopyText = generateCopyText(defaultType);
        preview.value = currentCopyText || "No hay cartas para copiar";

        updateCopyCount(defaultType);
    });

    copyModal.addEventListener("click", e => {
        if (e.target === copyModal) copyModal.style.display = "none";
    });

    copyModal.querySelector(".close").addEventListener("click", () => {
        copyModal.style.display = "none";
    });

    copyModal.querySelectorAll("button[data-type]").forEach(btn => {
        btn.addEventListener("click", () => {
            const type = btn.dataset.type;
            currentCopyText = generateCopyText(type);
            preview.value = currentCopyText || "No hay cartas para copiar";

            updateCopyCount(type);
        });
    });

    confirmCopy.addEventListener("click", () => {
        if (!currentCopyText) return;
        navigator.clipboard.writeText(currentCopyText);
        alert("Cartas copiadas al portapapeles");
        copyModal.style.display = "none";
    });

    function generateCopyText(type) {
        const data = loadCards();
        const result = [];

        for (let i = startNumber; i <= endNumber; i++) {
            const card = data[i];

            if (type === "obtained" && card?.hasCard) {
                result.push(i);
            }

            if (type === "missing" && !card?.hasCard) {
                result.push(i);
            }

            if (type === "repeated" && card?.hasCard && card.repeats > 0) {
                if (card.repeats === 1) {
                    result.push(`${i}`);
                } else {
                    result.push(`${i}(x${card.repeats})`);
                }
            }
        }

        return result.join(", ");
    }

    function updateCopyCount(type) {
        const data = loadCards();
        let count = 0;

        for (let i = startNumber; i <= endNumber; i++) {
            const card = data[i];
            if (type === "obtained" && card?.hasCard) count++;
            if (type === "missing" && !card?.hasCard) count++;
            if (type === "repeated" && card?.hasCard && card.repeats > 0) {
                count += card.repeats;
            }
        }

        if (type === "obtained") copyCountEl.textContent = `Obtenidas: ${count}`;
        if (type === "missing") copyCountEl.textContent = `Faltantes: ${count}`;
        if (type === "repeated") copyCountEl.textContent = `Repetidas: ${count}`;
    }

    /* init */
    updateSummaryUI();
    updateMarkAllButton();

    /* search bar */
    const toggleBtn = document.getElementById("searchToggle");
    const searchBar = document.getElementById("searchBar");

    toggleBtn.addEventListener("click", () => {
        searchBar.style.display =
            searchBar.style.display === "block" ? "none" : "block";

        if (searchBar.style.display === "block") {
            searchBar.querySelector("input").focus();
        }
    });

    const searchInput = searchBar.querySelector("input");

    searchInput.addEventListener("input", () => {
        const query = searchInput.value
            .split(",")
            .map(n => n.trim())
            .filter(n => n !== "");

        filterCardsBySearch(query);
    });

    function filterCardsBySearch(numbers) {
        const cards = document.querySelectorAll(".item");

        cards.forEach(card => {
            const cardNumber = card.querySelector(".card-number").textContent.trim();

            if (numbers.length === 0 || numbers.includes(cardNumber)) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }
        });
    }

    /* export json */
    document.getElementById("exportBtn").addEventListener("click", () => {
        const data = loadCards();
        const json = JSON.stringify(data, null, 2);

        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "dbz_collection.json";
        a.click();

        URL.revokeObjectURL(url);
    });

    /* import json */
    const importInput = document.getElementById("importInput");

    document.getElementById("importBtn").addEventListener("click", () => {
        importInput.click();
    });

    importInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                saveCards(data);
                location.reload();
            } catch {
                alert("Archivo JSON inválido");
            }
        };
        reader.readAsText(file);
    });
});