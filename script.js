document.addEventListener("DOMContentLoaded", () => {
    /* configuration */
    const { expansion, startNumber, endNumber, ranges, specials } = window.DBZ_CONFIG;

    const cardsList = [];

    const baseUrl = `https://res.cloudinary.com/dbzcardcollection/image/upload/${expansion}`;
    const STORAGE_KEY = `dbz_cards_${expansion}`;

    /* build cards list */
    if (ranges && expansion === "expansion4") {
        ranges.forEach(r => {
            for (let i = r.from; i <= r.to; i++) {
                cardsList.push({
                    id: String(i),
                    label: String(i),
                    url: `${baseUrl}/${i}.jpg`
                });
            }
        });

        if (specials) {
            for (let i = specials.from; i <= specials.to; i++) {
                const id = `${specials.prefix}${i}`;
                cardsList.push({
                    id,
                    label: id,
                    url: `${baseUrl}/${id}.jpg`
                });
            }
        }
    } else {
        for (let i = startNumber; i <= endNumber; i++) {
            cardsList.push({
                id: String(i),
                label: String(i),
                url: `${baseUrl}/${i}.jpg`
            });
        }
    }

    const TOTAL_CARDS = cardsList.length;

    /* local storage */
    function loadCards() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    }

    function saveCards(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    const savedCards = loadCards();

    /* create grid */
    const grid = document.getElementById("grid");
    const template = document.getElementById("item-template");

    function addSection(title) {
        const section = document.createElement("div");
        section.className = "section-title";
        section.textContent = title;
        grid.appendChild(section);
    }

let currentSection = "";

    cardsList.forEach(card => {

        let sectionName = "";

        if (card.id.startsWith("F")) {
            sectionName = "Cartas fantasma o especiales";
        } else {
            const n = parseInt(card.id, 10);

            if (n >= 402 && n <= 407) sectionName = "Cartas ocultas";
            else if (n >= 408 && n <= 543) sectionName = "Expansión 4";
        }

        if (sectionName && sectionName !== currentSection) {
            addSection(sectionName);
            currentSection = sectionName;
        }

        const clone = template.content.cloneNode(true);
        const item = clone.querySelector(".item");
        const img = clone.querySelector(".card img");
        const cardNumber = clone.querySelector(".card-number");

        img.src = card.url;
        img.alt = card.label;
        cardNumber.textContent = card.label;

        setupCounter(item, card.id);
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
            hasCard = !hasCard;
            if (!hasCard) repeats = 0;
            persist();
            updateUI();
        });

        plus.addEventListener('click', () => {
            if (hasCard) {
                repeats++;
                persist();
                updateUI();
            }
        });

        minus.addEventListener('click', () => {
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

        cardsList.forEach(card => {
            const c = data[card.id];
            if (c?.hasCard) {
                obtenidas++;
                repetidas += c.repeats;
            } else {
                faltantes++;
            }
        });

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
            const cardId = cardsList[index].id;
            const card = data[cardId];

            let show = false;

            switch (type) {
                case "all": show = true; break;
                case "obtained": show = card?.hasCard; break;
                case "missing": show = !card?.hasCard; break;
                case "repeated": show = card?.hasCard && card.repeats > 0; break;
            }

            item.style.display = show ? "" : "none";
        });
    }

    /* mark all cards */
    function markAllCards() {
        cardsList.forEach(card => {
            savedCards[card.id] = {
                hasCard: true,
                repeats: 0
            };
        });

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

        return cardsList.every(card => data[card.id]?.hasCard);
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
        cardsList.forEach(card => {
            savedCards[card.id] = {
                hasCard: false,
                repeats: 0
            };
        });

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

        cardsList.forEach(card => {
            const c = data[card.id];

            if (type === "obtained" && c?.hasCard) {
                result.push(card.label);
            }

            if (type === "missing" && !c?.hasCard) {
                result.push(card.label);
            }

            if (type === "repeated" && c?.hasCard && c.repeats > 0) {
                result.push(
                    c.repeats === 1
                        ? `${card.label}`
                        : `${card.label}(x${c.repeats})`
                );
            }
        });

        return result.join(", ");
    }

    function updateCopyCount(type) {
        const data = loadCards();
        let count = 0;

        cardsList.forEach(card => {
            const c = data[card.id];

            if (type === "obtained" && c?.hasCard) count++;
            if (type === "missing" && !c?.hasCard) count++;
            if (type === "repeated" && c?.hasCard && c.repeats > 0) {
                count += c.repeats;
            }
        });

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
    const searchInput = searchBar.querySelector("input");

    toggleBtn.addEventListener("click", () => {
        searchBar.style.display =
            searchBar.style.display === "block" ? "none" : "block";
        if (searchBar.style.display === "block") searchInput.focus();
    });

    searchInput.addEventListener("input", () => {
        const query = searchInput.value
            .split(",")
            .map(n => n.trim());
        filterCardsBySearch(query);
    });

    function filterCardsBySearch(values) {
        document.querySelectorAll(".item").forEach((item, index) => {
            const label = cardsList[index].label.toString();
            item.style.display =
                values.length === 0 || values.includes(label) ? "" : "none";
        });
    };

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