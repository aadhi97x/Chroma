(function () {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const FILTER_ID = "colorblind-assistant-filter";

    const MATRICES = {
        protanopia: [
            1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0.7, 0, 1, 0, 0,
            0, 0, 0, 1, 0
        ],
        deuteranopia: [
            1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0.7, 1, 0, 0,
            0, 0, 0, 1, 0
        ],
        tritanopia: [
            1, 0, 0.7, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 0, 1, 0
        ],
        achromatopsia: [
            0.299, 0.587, 0.114, 0, 0,
            0.299, 0.587, 0.114, 0, 0,
            0.299, 0.587, 0.114, 0, 0,
            0, 0, 0, 1, 0
        ]
    };

    const IDENTITY_MATRIX = [
        1, 0, 0, 0, 0,
        0, 1, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 1, 0
    ];

    function injectFilter() {
        if (document.getElementById(FILTER_ID)) return;

        const svg = document.createElementNS(SVG_NS, "svg");
        svg.style.position = "absolute";
        svg.style.height = "0";
        svg.style.width = "0";
        svg.style.overflow = "hidden";
        svg.style.pointerEvents = "none";
        svg.setAttribute("id", FILTER_ID + "-svg");

        const defs = document.createElementNS(SVG_NS, "defs");
        const filter = document.createElementNS(SVG_NS, "filter");
        filter.setAttribute("id", FILTER_ID);

        const feColorMatrix = document.createElementNS(SVG_NS, "feColorMatrix");
        feColorMatrix.setAttribute("type", "matrix");
        feColorMatrix.setAttribute("values", IDENTITY_MATRIX.join(" "));

        filter.appendChild(feColorMatrix);
        defs.appendChild(filter);
        svg.appendChild(defs);

        (document.documentElement || document.body).appendChild(svg);
    }

    function applyFilter(type, severity) {
        const intensity = severity / 100;
        const targetMatrix = MATRICES[type] || IDENTITY_MATRIX;

        const matrix = IDENTITY_MATRIX.map((val, i) => {
            return (1 - intensity) * val + intensity * targetMatrix[i];
        });

        const svg = document.getElementById(FILTER_ID + "-svg");
        if (!svg) injectFilter();

        const filter = document.getElementById(FILTER_ID);
        if (!filter) return;

        const feColorMatrix = filter.querySelector("feColorMatrix");
        feColorMatrix.setAttribute("values", matrix.join(" "));


        const root = document.documentElement;
        const currentFilter = root.style.filter || "";
        const filterUrl = `url(#${FILTER_ID})`;

        if (!currentFilter.includes(filterUrl)) {

            root.style.filter = currentFilter ? `${currentFilter} ${filterUrl}` : filterUrl;
        }
    }

    function clearFilter() {
        const root = document.documentElement;
        const currentFilter = root.style.filter || "";
        const filterUrl = `url(#${FILTER_ID})`;

        if (currentFilter.includes(filterUrl)) {

            root.style.filter = currentFilter.replace(filterUrl, "").trim();
        }
    }

    function updateFromStorage() {
        const hostname = window.location.hostname;
        chrome.storage.local.get(['enabled', 'type', 'severity', hostname], (result) => {
            let settings = result;
            if (hostname && result[hostname]) {
                settings = result[hostname];
            }


            if (settings.enabled === false) {
                clearFilter();
            } else {
                applyFilter(
                    settings.type || 'protanopia',
                    settings.severity !== undefined ? settings.severity : 100
                );
            }
        });
    }

    injectFilter();
    updateFromStorage();

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "updateSettings") {
            if (request.settings.enabled === false) {
                clearFilter();
            } else {
                applyFilter(request.settings.type, request.settings.severity);
            }
        }
    });

})();
