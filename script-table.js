function renderTable(totalV, N, mode, activeD) {
    const tbody = document.getElementById('dn-table-body');
    tbody.innerHTML = "";
    const branchV = totalV / N;

    let displaySpecs = [...pipeSpecs];
    if (mode === 'custom' && !displaySpecs.some(p => p.d === activeD)) {
        displaySpecs.push({ dn: 0, d: activeD, name: "Пользовательская" });
    }
    displaySpecs.sort((a,b) => a.d - b.d);

    displaySpecs.forEach(pipe => {
        const d_m = pipe.d / 1000;
        const testW = (4 * (branchV / 3600)) / (Math.PI * Math.pow(d_m, 2));
        
        let statusText = "Допустимо";
        let rowStyle = "";

        // Сначала определяем базовый физический статус по скорости
        if (testW > 3.0) {
            statusText = "❌ Критическая скорость (>3 м/с)";
            rowStyle = "background-color: #fef2f2; color: #dc2626;";
        } else if (testW > 1.5) {
            statusText = "⚠️ Высокие потери (>1.5 м/с)";
            rowStyle = "background-color: #fffbeb; color: #d97706;";
        } else if (testW < 0.6) {
            statusText = "⚠️ Риск заиливания (<0.6 м/с)";
            rowStyle = "background-color: #f8fafc; color: #4a5568;";
        } else {
            statusText = "Оптимально (В допуске)";
            rowStyle = "background-color: #ffffff; color: #000000;";
        }
        
        // Корректируем стиль, если это именно тот диаметр, который выбрал пользователь
        if (pipe.d === activeD) {
            if (testW > 3.0) {
                statusText = "⭐ Выбран аварийный диаметр! (>3 м/с)";
                rowStyle = "background-color: #fee2e2; font-weight: bold; color: #dc2626; border: 2px solid #dc2626;";
            } else if (testW > 1.5 || testW < 0.6) {
                statusText = "⭐ Выбран рабочий диаметр вне оптимума";
                rowStyle = "background-color: #fef3c7; font-weight: bold; color: #d97706; border: 2px solid #d97706;";
            } else {
                statusText = "⭐ Выбран идеальный диаметр (В допуске)";
                rowStyle = "background-color: #e6fcdb; font-weight: bold; color: #16a34a; border: 2px solid #16a34a;";
            }
        }

        tbody.innerHTML += `<tr style="${rowStyle}">
            <td>${pipe.name}</td>
            <td>${pipe.d}</td>
            <td>${testW.toFixed(2)}</td>
            <td>${statusText}</td>
        </tr>`;
    });
}
