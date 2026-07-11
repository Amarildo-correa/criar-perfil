(() => {
    const LIMIT = 15,
        KEY = "perfil.rascunho",
        LAST = 2,
        MIN_LEN = { 0: 8, 1: 6, 2: 6 };
    const $ = (id) => document.getElementById(id);
    const app = $("app"),
        track = $("track"),
        clip = $("clip"),
        user = $("user"),
        role = $("role"),
        bio = $("bio"),
        bioPanel = $("bioPanel"),
        mirror = $("mirror"),
        overEl = $("over"),
        underEl = $("under"),
        back = $("back"),
        next = $("next"),
        hideKb = $("hideKb"),
        landing = $("landing"),
        startBtn = $("startBtn"),
        erase = $("erase"),
        stepNow = $("stepNow"),
        nextIcon = $("nextIcon");

    const inputs = [user, role, bio];
    let step = 0;

    const mem = {};
    const store = {
        get(k) {
            try {
                return localStorage.getItem(k);
            } catch (e) {
                return mem[k] ?? null;
            }
        },
        set(k, v) {
            try {
                localStorage.setItem(k, v);
            } catch (e) {
                mem[k] = v;
            }
        },
    };
    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

    const isOver = () => bio.value.length > LIMIT;

    /* monta o mirror cruzando dois cortes independentes no texto:
       o limite (excedente vira <mark>) e a seleção nativa da textarea
       (o navegador não permite duas cores de ::selection num mesmo
       campo, então a seleção "visível" é pintada aqui, span a span) */
    function buildMirror(v, over) {
        const hasSel = document.activeElement === bio && bio.selectionStart !== bio.selectionEnd;
        const selStart = hasSel ? bio.selectionStart : 0,
            selEnd = hasSel ? bio.selectionEnd : 0;

        const cuts = new Set([0, v.length]);
        if (over) cuts.add(LIMIT);
        if (hasSel) {
            cuts.add(selStart);
            cuts.add(selEnd);
        }
        const points = [...cuts].filter((p) => p >= 0 && p <= v.length).sort((a, b) => a - b);

        let html = "";
        for (let i = 0; i < points.length - 1; i++) {
            const a = points[i],
                b = points[i + 1];
            if (a === b) continue;
            const text = esc(v.slice(a, b));
            const isExcess = over && a >= LIMIT;
            const isSelected = hasSel && a >= selStart && b <= selEnd;
            if (isSelected) html += '<span class="' + (isExcess ? "sel-danger" : "sel-normal") + '">' + text + "</span>";
            else if (isExcess) html += "<mark>" + text + "</mark>";
            else html += text;
        }
        return html;
    }

    /* ---------- gota decorativa sob o caret (modo placeholder) ----------
       Android desenha uma alça de inserção sob o caret em qualquer campo
       tocado, mesmo vazio — sem serventia ali, já que não há texto pra
       reposicionar. O caret nativo é mantido (cor, espessura e piscar
       continuam 100% do navegador); só desenhamos nossa própria gota,
       encostada exatamente na ponta de baixo de onde o caret nasceria.
       Assim que o primeiro caractere é digitado, a gota some. */
    const DROP = 14;

    function teardropPath(cx, topY, size) {
        const r = size / 2,
            bottomY = topY + size * 1.15;
        return "M" + cx + " " + topY + " C " + (cx - r * 1.3) + " " + (topY + r * 0.9) + " " + (cx - r) + " " + bottomY + " " + cx + " " + bottomY + " C " + (cx + r) + " " + bottomY + " " + (cx + r * 1.3) + " " + (topY + r * 0.9) + " " + cx + " " + topY + " Z";
    }

    /* mede, com um probe invisível do mesmo font/padding do campo, onde o
       primeiro caractere (e portanto o caret em repouso) nasceria — usa o
       próprio motor de layout do navegador em vez de calcular métricas de
       fonte manualmente, então acompanha qualquer campo sem ajuste fino */
    function measureCaretRect(el) {
        const panel = el.parentElement;
        const cs = getComputedStyle(el);
        const probe = document.createElement("span");
        probe.textContent = String.fromCharCode(8203);
        probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre;" + "font:" + cs.font + ";line-height:" + cs.lineHeight + ";" + "left:" + cs.paddingLeft + ";top:" + cs.paddingTop + ";";
        panel.appendChild(probe);
        const pRect = panel.getBoundingClientRect(),
            cRect = probe.getBoundingClientRect();
        probe.remove();
        return { left: cRect.left - pRect.left, top: cRect.top - pRect.top, height: cRect.height };
    }

    function updateFakeCaret(el) {
        const fc = el.closest(".panel").querySelector(".fake-caret"),
            show = document.activeElement === el && el.value.length === 0;
        if (!show) {
            fc.classList.remove("show");
            return;
        }
        const r = measureCaretRect(el),
            w = DROP + 4,
            svg = fc.querySelector("svg"),
            drop = fc.querySelector(".drop"),
            cx = w / 2,
            /* r.height é a caixa da linha inteira (line-height), mas o caret
               real só ocupa a caixa da fonte — a "meia-entrelinha" sobrando
               embaixo deixaria um vão entre o caret de verdade e a gota */
            fontPx = parseFloat(getComputedStyle(el).fontSize),
            halfLeading = Math.max(0, (r.height - fontPx) / 2);
        fc.style.left = r.left - cx + "px";
        fc.style.top = r.top + r.height - halfLeading + "px";
        svg.setAttribute("width", w);
        svg.setAttribute("height", DROP * 1.15);
        svg.setAttribute("viewBox", "0 0 " + w + " " + DROP * 1.15);
        drop.setAttribute("d", teardropPath(cx, 0, DROP));
        fc.classList.add("show");
    }

    /* simulação de nome indisponível; troque por checagem no servidor */
    const TAKEN = ["amarildo"];
    const nameTaken = () => TAKEN.includes(user.value.trim().toLowerCase());
    /* bio é opcional: vazia passa direto, mas se o usuário começar a
       escrever precisa atingir o mínimo (mesma régua de user/role) além
       de nunca ultrapassar o LIMIT. user/role exigem MIN_LEN sempre,
       além de não-vazio/nome livre */
    const validStep = (i) => (i === 2 ? !isOver() && (bio.value.trim().length === 0 || bio.value.trim().length >= MIN_LEN[2]) : i === 0 ? user.value.trim().length >= MIN_LEN[0] && !nameTaken() : role.value.trim().length >= MIN_LEN[1]);

    function render() {
        const over = isOver(),
            v = bio.value;

        mirror.innerHTML = buildMirror(v, over) + (over ? "" : "\n");
        overEl.textContent = over ? "-" + (v.length - LIMIT) : "";

        /* caret acompanha a cor do texto onde ele está: focus no trecho
           normal, danger a partir do caractere que já é excedente */
        bio.style.caretColor = over && bio.selectionEnd > LIMIT ? "var(--danger)" : "var(--focus)";

        app.classList.toggle("over", step === 2 && over);
        bioPanel.classList.toggle("over", over);

        /* nome em uso: pinta painel e rodapé com a cor de erro */
        const taken = nameTaken();
        app.classList.toggle("err", step === 0 && taken);
        user.closest(".panel").classList.toggle("err", taken);

        /* contador mínimo (inverso do over-count): só aparece depois do
           primeiro caractere e some assim que o mínimo é atingido — o
           next (via .ok) toma o lugar dele no mesmo quadrado */
        const min = MIN_LEN[step];
        const len = min !== undefined ? inputs[step].value.trim().length : 0;
        const missing = min !== undefined && len > 0 ? min - len : 0;
        app.classList.toggle("under", missing > 0);
        underEl.textContent = missing > 0 ? "+" + missing : "";

        /* prosseguir só aparece com o input da etapa atual ok */
        app.classList.toggle("ok", validStep(step));

        /* seta vira "check" na última etapa */
        nextIcon.innerHTML = step === LAST ? '<path d="M4 12l6 6L20 7"/>' : '<path d="M4 12h14"/><path d="M13 6l6 6-6 6"/>';
        next.setAttribute("aria-label", step === LAST ? "Enviar" : "Prosseguir");

        stepNow.textContent = step + 1;
        app.classList.toggle("first", step === 0);
    }

    function go(i, focusInput = true) {
        /* apara sequências invisíveis no fim do campo que está sendo deixado:
       o valor fica limpo e o caret nunca nasce num espaço vazio */
        const leaving = inputs[step];
        if (leaving && /\s+$/.test(leaving.value)) {
            leaving.value = leaving.value.replace(/\s+$/, "");
        }
        step = Math.max(0, Math.min(LAST, i));
        track.style.transform = "translateX(-" + step * 100 + "%)";
        render();
        /* foco síncrono, ainda dentro do gesto do usuário:
       o teclado nativo permanece aberto, sem ocultar/renderizar */
        if (focusInput) {
            const el = inputs[step];
            const toEnd = () => {
                /* ignora espaços, quebras e outros invisíveis no fim:
           o caret para no último caractere real digitado */
                const end = el.value.replace(/\s+$/, "").length;
                el.setSelectionRange(end, end);
                el.scrollTop = el.scrollHeight;
            };
            el.focus({ preventScroll: true });
            toEnd();
            /* Chrome/Safari reposicionam o caret DEPOIS do foco (às vezes no início,
         principalmente com texto pré-carregado). Reafirma no frame seguinte,
         vencendo o posicionamento padrão em qualquer sentido de troca */
            requestAnimationFrame(toEnd);
            setTimeout(toEnd, 0);
        }
    }

    /* ---------- eventos de input ---------- */
    inputs.forEach((el) => {
        el.addEventListener("input", () => {
            /* campos de etapa 1 e 2 quebram visualmente, mas não aceitam \n */
            if (el !== bio && el.value.includes("\n")) {
                el.value = el.value.replace(/\n/g, "");
            }
            render();
            updateFakeCaret(el);
            /* o auto-scroll do navegador para no caret e esconde o padding
         inferior; se o caret está no fim, rola até revelar o respiro */
            if (el.selectionEnd === el.value.length) {
                el.scrollTop = el.scrollHeight;
            }
        });
        el.addEventListener("focus", () => {
            el.closest(".panel").classList.add("focus");
            /* caret no final do texto real, ignorando espaços finais */
            const end = el.value.replace(/\s+$/, "").length;
            if (end) el.setSelectionRange(end, end);
            updateFakeCaret(el);
        });
        el.addEventListener("blur", () => {
            el.closest(".panel").classList.remove("focus");
            updateFakeCaret(el);
        });
    });
    bio.addEventListener("scroll", () => {
        mirror.scrollTop = bio.scrollTop;
    });
    /* re-desenha o mirror quando a seleção muda sem disparar "input"
       (arrastar o mouse, Shift+setas, Ctrl+A) e ao perder o foco,
       para o overlay de seleção acompanhar exatamente a seleção real */
    document.addEventListener("selectionchange", () => {
        if (document.activeElement === bio) render();
    });
    bio.addEventListener("blur", render);

    /* fallback: se algum navegador ainda rolar o clip ao focar, zera na hora */
    clip.addEventListener("scroll", () => {
        clip.scrollLeft = 0;
        clip.scrollTop = 0;
    });
    [user, role].forEach((el, i) => {
        el.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (validStep(i)) go(i + 1);
            }
        });
    });

    /* ---------- landing: o toque no CTA é o gesto real do usuário que
       permite o focus()/teclado funcionar em mobile — um focus() disparado
       sozinho no carregamento da página é ignorado por iOS Safari/Android */
    startBtn.addEventListener("click", () => {
        app.classList.add("started");
        go(step, true);
    });

    /* ---------- navegação ---------- */
    [back, next].forEach((b) => b.addEventListener("mousedown", (e) => e.preventDefault()));
    back.addEventListener("click", () => go(step - 1));
    next.addEventListener("click", () => {
        if (!validStep(step)) return;
        if (step === LAST) {
            alert("Perfil enviado:\n" + user.value + " — " + role.value);
            return;
        }
        go(step + 1);
    });
    $("exit").addEventListener("click", () => {
        if (confirm("Sair do formulário? Alterações não salvas serão perdidas.")) {
            user.value = role.value = bio.value = "";
            go(0, false);
        }
    });

    /* ---------- fechar teclado: tira o foco do campo da etapa atual.
       sem preventDefault no mousedown (ao contrário dos outros botões
       da barra) — aqui o objetivo é justamente perder o foco. no iOS
       Safari um <button> tocado nem sempre rouba o foco sozinho, por
       isso o blur() explícito no campo ativo */
    hideKb.addEventListener("click", () => inputs[step].blur());

    /* ---------- borracha: só o excedente ---------- */
    erase.addEventListener("mousedown", (e) => e.preventDefault());
    erase.addEventListener("click", () => {
        if (!isOver()) return;
        bio.value = bio.value.slice(0, LIMIT);
        render();
        bio.focus();
        bio.setSelectionRange(LIMIT, LIMIT);
    });

    /* ---------- Touch API: deslizar para trocar de etapa ---------- */
    let x0 = null,
        y0 = null,
        t0 = 0;
    clip.addEventListener(
        "touchstart",
        (e) => {
            const t = e.touches[0];
            x0 = t.clientX;
            y0 = t.clientY;
            t0 = Date.now();
        },
        { passive: true },
    );

    clip.addEventListener(
        "touchend",
        (e) => {
            if (x0 === null) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - x0,
                dy = t.clientY - y0,
                dt = Date.now() - t0;
            x0 = y0 = null;
            /* gesto horizontal intencional: distância mínima, mais largura que altura, rápido */
            if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || dt > 600) return;
            if (dx < 0 && step < LAST && validStep(step)) go(step + 1); /* esquerda → próxima */
            else if (dx > 0 && step > 0) go(step - 1); /* direita → anterior */
        },
        { passive: true },
    );

    /* ---------- botão de fechar teclado: só em Android/iOS reais.
       iPadOS se identifica como "MacIntel" no userAgent — o que o
       distingue de um Mac de verdade é ter tela touch (maxTouchPoints) */
    const isMobileOS = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    app.classList.toggle("mobile-os", isMobileOS);

    /* ---------- teclado nativo: Chrome e Safari ---------- */
    const vv = window.visualViewport;
    if (vv) {
        const fit = () => {
            const kb = Math.max(0, innerHeight - vv.height - vv.offsetTop);
            app.style.setProperty("--kb", kb + "px");
            /* teclado considerado aberto acima de 100px pra ignorar
               pequenas oscilações de barra de endereço/toolbar */
            app.classList.toggle("kb-open", kb > 100);
            scrollTo(0, 0);
        };
        vv.addEventListener("resize", fit);
        vv.addEventListener("scroll", fit);
        fit();
    }

    /* reposiciona o caret decorativo se a rotação do aparelho ou o
       redimensionamento mudar o font-size (clamp com vw) ou o padding */
    addEventListener("resize", () => {
        const el = document.activeElement;
        if (inputs.includes(el)) updateFakeCaret(el);
    });

    /* ---------- restaura rascunho ---------- */
    try {
        const d = JSON.parse(store.get(KEY) || "{}");
        user.value = d.user || "";
        role.value = d.role || "";
        bio.value = d.bio || "";
        step = Math.max(0, Math.min(LAST, d.step || 0));
    } catch (e) {}
    track.style.transition = "none";
    go(step, false);
    requestAnimationFrame(() => {
        track.style.transition = "";
    });
})();
