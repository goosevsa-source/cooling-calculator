function drawSvgExpense(dt, c, rho, currentE, currentV) {
    const svg = document.getElementById('svgExpense');
    svg.innerHTML = '';
    const width = svg.clientWidth || 700;
    const height = 300;
    const padding = 50;

    const maxX = Math.max(2000, Math.ceil(currentE * 1.25 / 200) * 200);
    const maxY = Math.max(100, Math.ceil(currentV * 1.25 / 10) * 10);

    let pathGrid = '';
    for(let x=0; x<=maxX; x+=maxX/10) {
        let px = padding + (x / maxX) * (width - 2 * padding);
        pathGrid += `M ${px} ${padding} L ${px} ${height - padding} `;
        svg.innerHTML += `<text x="${px}" y="${height - padding + 20}" text-anchor="middle" font-size="10">${Math.round(x)}</text>`;
    }
    for(let y=0; y<=maxY; y+=maxY/5) {
        let py = height - padding - (y / maxY) * (height - 2 * padding);
        pathGrid += `M ${padding} ${py} L ${width - padding} ${py} `;
        svg.innerHTML += `<text x="${padding - 10}" y="${py + 4}" text-anchor="end" font-size="10">${Math.round(y)}</text>`;
    }
    svg.innerHTML += `<path d="${pathGrid}" stroke="#e5e5e5" stroke-width="1" stroke-dasharray="2,2"/>`;

    let pathLine = `M ${padding} ${height - padding} `;
    let pxTarget = padding + (currentE / maxX) * (width - 2 * padding);
    let pyTarget = height - padding - (currentV / maxY) * (height - 2 * padding);
    pathLine += `L ${width - padding} ${height - padding - ((maxX / (c * rho * dt)) * 3600 / maxY) * (height - 2 * padding)}`;
    
    svg.innerHTML += `<path d="${pathLine}" stroke="#003366" stroke-width="2" fill="none"/>`;
    svg.innerHTML += `<circle cx="${pxTarget}" cy="${pyTarget}" r="5" fill="#cc0000"/>`;
    svg.innerHTML += `<text x="${pxTarget - 10}" y="${pyTarget - 10}" fill="#cc0000" font-weight="bold" font-size="11">(${currentE}; ${currentV.toFixed(1)})</text>`;
    
    svg.innerHTML += `<text x="${width/2}" y="${height - 5}" text-anchor="middle" font-size="12">Энергия E, кВт·ч</text>`;
    svg.innerHTML += `<text x="${15}" y="${height/2}" text-anchor="middle" font-size="12" transform="rotate(-90 15 ${height/2})">Расход V, м³/ч</text>`;
}

function drawSvgVelocity(branchV, currentD, currentW) {
    const svg = document.getElementById('svgVelocity');
    svg.innerHTML = '';
    const width = svg.clientWidth || 700;
    const height = 300;
    const padding = 50;

    const minD = 10;
    const maxD = Math.max(160, Math.ceil(currentD * 1.3 / 10) * 10);
    const maxY = Math.max(10, Math.ceil(currentW * 1.3 / 2) * 2);

    const innerH = height - 2 * padding;

    let yGreenTop = height - padding - (1.5 / maxY) * innerH;
    let yGreenBottom = height - padding - (0.6 / maxY) * innerH;
    yGreenTop = Math.max(padding, yGreenTop);
    svg.innerHTML += `<rect x="${padding}" y="${yGreenTop}" width="${width - 2*padding}" height="${yGreenBottom - yGreenTop}" fill="#f0fdf4"/>`;
    svg.innerHTML += `<text x="${width - padding - 5}" y="${yGreenTop + 14}" text-anchor="end" fill="#16a34a" font-size="9" font-weight="bold">ОПТИМАЛЬНО (0.6 - 1.5 м/с)</text>`;

    if (maxY > 3.0) {
        let yRedTop = padding;
        let yRedBottom = height - padding - (3.0 / maxY) * innerH;
        svg.innerHTML += `<rect x="${padding}" y="${yRedTop}" width="${width - 2*padding}" height="${yRedBottom - yRedTop}" fill="#fef2f2"/>`;
        svg.innerHTML += `<text x="${width - padding - 5}" y="${yRedBottom - 6}" text-anchor="end" fill="#dc2626" font-size="9" font-weight="bold">КРИТИЧЕСКАЯ ЗОНА (> 3 м/с)</text>`;
    }

    let pathGrid = '';
    for(let x=minD; x<=maxD; x+=(maxD-minD)/10) {
        let px = padding + ((x - minD) / (maxD - minD)) * (width - 2 * padding);
        pathGrid += `M ${px} ${padding} L ${px} ${height - padding} `;
        svg.innerHTML += `<text x="${px}" y="${height - padding + 20}" text-anchor="middle" font-size="10">${Math.round(x)}</text>`;
    }
    for(let y=0; y<=maxY; y+=maxY/5) {
        let py = height - padding - (y / maxY) * (height - 2 * padding);
        pathGrid += `M ${padding} ${py} L ${width - padding} ${py} `;
        svg.innerHTML += `<text x="${padding - 10}" y="${py + 4}" text-anchor="end" font-size="10">${Math.round(y)}</text>`;
    }
    svg.innerHTML += `<path d="${pathGrid}" stroke="#e5e5e5" stroke-width="1" stroke-dasharray="2,2"/>`;

    let pathLine = '';
    for (let x = minD; x <= maxD; x += 1) {
        let testW = (4 * (branchV / 3600)) / (Math.PI * Math.pow(x / 1000, 2));
        let px = padding + ((x - minD) / (maxD - minD)) * (width - 2 * padding);
        let py = height - padding - (testW / maxY) * innerH;
        if (py >= padding && py <= height - padding) {
            if (pathLine === '') pathLine += `M ${px} ${py} `;
            else pathLine += `L ${px} ${py} `;
        }
    }
    svg.innerHTML += `<path d="${pathLine}" stroke="#319795" stroke-width="2" fill="none"/>`;

    let pxTarget = padding + ((currentD - minD) / (maxD - minD)) * (width - 2 * padding);
    let pyTarget = height - padding - (currentW / maxY) * innerH;
    if(pyTarget >= padding && pyTarget <= height - padding) {
        svg.innerHTML += `<circle cx="${pxTarget}" cy="${pyTarget}" r="5" fill="#cc0000"/>`;
        svg.innerHTML += `<text x="${pxTarget + 10}" y="${pyTarget - 5}" fill="#cc0000" font-weight="bold" font-size="11">(${currentD} мм; ${currentW.toFixed(1)} м/с)</text>`;
    }

    svg.innerHTML += `<text x="${width/2}" y="${height - 5}" text-anchor="middle" font-size="12">Внутренний диаметр d, мм</text>`;
    svg.innerHTML += `<text x="${15}" y="${height/2}" text-anchor="middle" font-size="12" transform="rotate(-90 15 ${height/2})">Скорость W, м/с</text>`;
}

window.onload = function() {
    calculateAll();
};
