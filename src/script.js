(() => {
    const LIMIT = 600,
        KEY = "perfil.rascunho",
        LAST = 2;
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
        back = $("back"),
        next = $("next"),
        save = $("save"),
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
    /* simulação de nome indisponível; troque por checagem no servidor */
    const TAKEN = ["amarildo"];
    const nameTaken = () => TAKEN.includes(user.value.trim().toLowerCase());
    const validStep = (i) => (i === 2 ? bio.value.trim().length > 0 && !isOver() : i === 0 ? user.value.trim().length > 0 && !nameTaken() : inputs[i].value.trim().length > 0);

    function render() {
        const over = isOver(),
            v = bio.value;

        mirror.innerHTML = over ? esc(v.slice(0, LIMIT)) + "<mark>" + esc(v.slice(LIMIT)) + "</mark>" : esc(v) + "\n";
        overEl.textContent = over ? "-" + (v.length - LIMIT) : "";

        app.classList.toggle("over", step === 2 && over);
        bioPanel.classList.toggle("over", over);

        /* nome em uso: pinta painel e rodapé com a cor de erro */
        const taken = nameTaken();
        app.classList.toggle("err", step === 0 && taken);
        user.closest(".panel").classList.toggle("err", taken);

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
        });
        el.addEventListener("blur", () => el.closest(".panel").classList.remove("focus"));
    });
    bio.addEventListener("scroll", () => {
        mirror.scrollTop = bio.scrollTop;
    });

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

    /* ---------- salvar: somente no disquete ---------- */
    function persist() {
        store.set(KEY, JSON.stringify({ user: user.value, role: role.value, bio: bio.value, step, at: Date.now() }));
    }
    save.addEventListener("mousedown", (e) => e.preventDefault());
    save.addEventListener("click", () => {
        persist();
        save.classList.add("saved");
        setTimeout(() => save.classList.remove("saved"), 900);
    });

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

    /* ---------- teclado nativo: Chrome e Safari ---------- */
    const vv = window.visualViewport;
    if (vv) {
        const fit = () => {
            app.style.setProperty("--kb", Math.max(0, innerHeight - vv.height - vv.offsetTop) + "px");
            scrollTo(0, 0);
        };
        vv.addEventListener("resize", fit);
        vv.addEventListener("scroll", fit);
        fit();
    }

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
