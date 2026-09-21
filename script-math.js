// База данных стандартных труб (условный проход DN и фактический внутренний диаметр в мм)
const pipeSpecs = [
    { dn: 15, d: 16.0, name: "DN15" }, { dn: 20, d: 21.6, name: "DN20" },
    { dn: 25, d: 27.2, name: "DN25" }, { dn: 32, d: 35.9, name: "DN32" },
    { dn: 40, d: 41.8, name: "DN40" }, { dn: 50, d: 53.0, name: "DN50" },
    { dn: 65, d: 68.8, name: "DN65" }, { dn: 80, d: 80.8, name: "DN80" },
    { dn: 100, d: 108.0, name: "DN100" }, { dn: 125, d: 133.0, name: "DN125" },
    { dn: 150, d: 159.0, name: "DN150" }
];

function togglePipeMode() {
    const mode = document.getElementById('param-pipeMode').value;
    document.getElementById('group-standard-dn').style.display = (mode === 'standard') ? 'flex' : 'none';
    document.getElementById('group-custom-d').style.display = (mode === 'custom') ? 'flex' : 'none';
    calculateAll();
}

function calculateAll() {
    const E = parseFloat(document.getElementById('param-E').value) || 0;
    const t1 = parseFloat(document.getElementById('param-t1').value) || 0;
    const t2 = parseFloat(document.getElementById('param-t2').value) || 0;
    const c = parseFloat(document.getElementById('param-coolant').value) || 4.19;
    const pipeMode = document.getElementById('param-pipeMode').value;
    const N_parallel = parseInt(document.getElementById('param-N').value) || 1;
    const Hgeo = parseFloat(document.getElementById('param-Hgeo').value) || 0;
    const L = parseFloat(document.getElementById('param-L').value) || 0;
    const eff = parseFloat(document.getElementById('param-eff').value) || 0.65;
    
    // Считываем новый параметр — Коэффициент Местных Сопротивлений (КМС)
    const kms = parseFloat(document.getElementById('param-kms').value) || 0;

    const dt = t2 - t1;
    if(dt <= 0) {
        const conBlock = document.getElementById('conclusion');
        conBlock.className = "conclusion-box conclusion-danger";
        conBlock.innerHTML = "<b>Критическая ошибка параметров:</b> Температура на выходе ($t_2$) должна быть строго больше температуры на входе ($t_1$). Расчёт остановлен.";
        return;
    }

    const rho = 1000, g = 9.81;
    let d_mm = (pipeMode === 'standard') ? pipeSpecs.find(p => p.dn === parseInt(document.getElementById('param-dn').value)).d : parseFloat(document.getElementById('param-customD').value) || 1;
    const d_m = d_mm / 1000;

    // Расчёты расходов
    const V_total = (E / (c * rho * dt)) * 3600; 
    const V_branch = V_total / N_parallel;       
    const W = (4 * (V_branch / 3600)) / (Math.PI * Math.pow(d_m, 2));

    // Гидравлические потери по Дарси-Вейсбаха с добавлением КМС (Zeta)
    const lambda = 0.025;
    const H_friction = lambda * (L / d_m) * (Math.pow(W, 2) / (2 * g)); // Линейные потери
    const H_local = kms * (Math.pow(W, 2) / (2 * g));                  // Местные потери (КМС)
    const H_total = Hgeo + H_friction + H_local;
    const P_bar = H_total / 10;

    // Мощность насоса
    const Power_el = (rho * g * (V_total / 3600) * H_total) / (eff * 1000);

    // Вывод текстовых блоков
    document.getElementById('out-E').innerText = E; document.getElementById('out-dt').innerText = dt;
    document.getElementById('out-d').innerText = d_mm; document.getElementById('out-N').innerText = N_parallel;
    document.getElementById('out-hgeo').innerText = Hgeo; document.getElementById('out-L').innerText = L;
    document.getElementById('out-c').innerText = c; document.getElementById('out-kms').innerText = kms;

    document.getElementById('calc-V').innerText = V_total.toFixed(2);
    document.getElementById('calc-V-branch').innerText = V_branch.toFixed(2);
    document.getElementById('calc-W').innerText = W.toFixed(2);
    document.getElementById('res-H-m').innerText = H_total.toFixed(2);
    document.getElementById('res-H-bar').innerText = P_bar.toFixed(2);
    document.getElementById('res-Power').innerText = Power_el.toFixed(2);

    // Вызов функций из соседних подфайлов
    generateConclusion(W, H_total, Power_el);
    renderTable(V_total, N_parallel, pipeMode, d_mm);
    drawSvgExpense(dt, c, rho, E, V_total);
    drawSvgVelocity(V_branch, d_mm, W);
}

function generateConclusion(W, H_total, Power_el) {
    const conBlock = document.getElementById('conclusion');
    const btnAuto = document.getElementById('btn-autoselect');
    
    // Сбрасываем все старые цветовые классы с кнопки
    btnAuto.classList.remove('btn-state-danger', 'btn-state-warning', 'btn-state-success');

    if (W > 3.0) {
        // Аварийное состояние — кнопка становится выпуклой розово-красной
        conBlock.className = "conclusion-box conclusion-danger";
        btnAuto.classList.add('btn-state-danger');
        btnAuto.innerText = "⚠️ Подобрать оптимальный DN";
        conBlock.innerHTML = `<b>Аварийный режим работы!</b> Выбранный диаметр трубы не подходит. Скорость потока составляет <b>${W.toFixed(2)} м/с</b> (критический порог 3 м/с). Это приведет к кавитации и гидроударам. Нажмите на мигающую красную кнопку для автоподбора.`;
        
    } else if (W > 1.5 || W < 0.6) {
        // Околооптимальное состояние — кнопка становится предупреждающей желтой
        conBlock.className = "conclusion-box conclusion-warning";
        btnAuto.classList.add('btn-state-warning');
        btnAuto.innerText = "⚡ Подобрать оптимальный DN";
        
        if (W > 1.5) {
            conBlock.innerHTML = `<b>Параметры вне оптимума (Завышенная скорость):</b> Скорость потока <b>${W.toFixed(2)} м/с</b> выше нормы (1.5 м/с). Работа будет сопровождаться шумом и потерями напора насоса (требуется <b>${H_total.toFixed(1)} м вод. ст.</b>). Кликните на желтую кнопку для оптимизации.`;
        } else {
            conBlock.innerHTML = `<b>Параметры вне оптимума (Заниженная скорость):</b> Скорость потока <b>${W.toFixed(2)} м/с</b> ниже порога самоочищения (0.6 м/с). Существует риск заиливания контура охлаждения. Кликните на желтую кнопку для сужения магистрали.`;
        }
        
    } else {
        // Идеальное состояние — кнопка становится спокойной зеленой, сообщая что все в допуске
        conBlock.className = "conclusion-box conclusion-success";
        btnAuto.classList.add('btn-state-success');
        btnAuto.innerText = "✓ DN оптимален";
        conBlock.innerHTML = `<b>Расчёт успешно завершён. Система в допуске!</b> Скорость хладагента составляет <b>${W.toFixed(2)} м/с</b> и находится в идеальном инженерном диапазоне (0.6 — 1.5 м/с). Мощность электродвигателя насоса: <b>${Power_el.toFixed(2)} кВт</b>. Корректировка не требуется.`;
    }
}

function autoSelectPipe() {
    const E = parseFloat(document.getElementById('param-E').value) || 0;
    const t1 = parseFloat(document.getElementById('param-t1').value) || 0;
    const t2 = parseFloat(document.getElementById('param-t2').value) || 0;
    const c = parseFloat(document.getElementById('param-coolant').value) || 4.19;
    const N_parallel = parseInt(document.getElementById('param-N').value) || 1;

    const dt = t2 - t1;
    if (dt <= 0) return;

    const rho = 1000;
    const V_total = (E / (c * rho * dt)) * 3600; 
    const V_branch = V_total / N_parallel;       

    let bestDn = null;

    // Перебираем трубы от меньшей к большей
    for (let i = 0; i < pipeSpecs.length; i++) {
        const pipe = pipeSpecs[i];
        const d_m = pipe.d / 1000;
        const testW = (4 * (branchV = V_branch / 3600)) / (Math.PI * Math.pow(d_m, 2));
        
        // Нам нужна ПЕРВАЯ труба, скорость в которой упала ниже верхнего предела оптимума (1.5 м/с)
        if (testW <= 1.5) {
            bestDn = pipe.dn;
            break;
        }
    }

    // Если поток огромный и даже DN150 мало, берем самый большой доступный диаметр
    if (!bestDn) {
        bestDn = pipeSpecs[pipeSpecs.length - 1].dn;
    }

    // Переключаем режим на стандартный сортамент
    document.getElementById('param-pipeMode').value = 'standard';
    togglePipeMode(); // Обновит видимость полей

    // Устанавливаем выбранное значение DN в выпадающем списке
    document.getElementById('param-dn').value = bestDn;
    
    // Запускаем полный пересчёт гидравлики и графиков
    calculateAll();
}
