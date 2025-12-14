// v3: ultra-robust (shows errors on screen + always produces at least 1 result)
(() => {
  const showError = (msg) => {
    const box = document.getElementById("errorBox");
    if (!box) return;
    box.style.display = "block";
    box.textContent = "エラー: " + msg;
  };

  try {
    const $ = (id) => document.getElementById(id);

    const cta = $("ctaLink");
    if (cta) cta.href = "https://example.com"; // ←あなたの導線URLに変更

    const btnCheck = $("btnCheck");
    const btnReset = $("btnReset");
    const btnCopy  = $("btnCopy");
    const summaryEl = $("summary");
    const resultsEl = $("results");

    if (!btnCheck || !btnReset || !btnCopy || !summaryEl || !resultsEl) {
      showError("必要な要素が見つかりません。ZIPを解凍して、同じフォルダの index.html を開いてください。");
      return;
    }

    const PROGRAMS = [
      {
        title: "医療費の負担軽減（高額療養費など）",
        tag: "全年齢",
        when: () => true,
        points: [
          "医療費が増えたときに確認対象",
          "加入している保険（国保/社保など）で手続きが異なります"
        ],
        ask: ["加入している保険は？", "最近、医療費が増えた？"],
        where: "確認先：加入している保険の窓口（協会けんぽ/健保/市区町村など）"
      },
      {
        title: "生活困窮者自立支援（相談・家計支援など）",
        tag: "家計が厳しい方向け",
        when: (s) => s.income === "low" || s.money !== "ok",
        points: [
          "生活が厳しいときに制度の振り分け・家計支援の入口になります",
          "自治体により支援内容が異なります"
        ],
        ask: ["何が一番きつい？（家賃/光熱/医療など）", "世帯状況は？"],
        where: "確認先：自治体の福祉窓口 / 自立相談支援機関"
      },
      {
        title: "住居確保給付金（家賃支援の候補）",
        tag: "家賃が厳しい場合",
        when: (s) => (s.money === "tight" || s.money === "late") && (s.work === "unemployed" || s.income === "low"),
        points: [
          "離職・休業・収入減などで家賃の支払いが難しい場合に候補",
          "自治体ごとに相談窓口が設定されています"
        ],
        ask: ["家賃の支払い状況は？", "収入が減った理由は？"],
        where: "確認先：自治体の自立相談支援機関（福祉窓口）"
      },
      {
        title: "雇用保険の基本手当（失業給付）",
        tag: "離職中・求職中",
        when: (s) => s.work === "unemployed" && s.jobSearch === true,
        points: [
          "離職中で、働く意思と求職活動がある場合に確認対象",
          "離職票・加入期間・退職理由などで条件が変わります"
        ],
        ask: ["雇用保険の加入期間は？", "離職票は？", "退職理由は？"],
        where: "確認先：ハローワーク"
      },
      {
        title: "求職者支援制度（職業訓練）",
        tag: "離職中（未加入でも）",
        when: (s) => s.work === "unemployed" && s.jobSearch === true,
        points: [
          "雇用保険を受給できない/受給が終わった方も訓練を確認できます",
          "要件や状況により支援内容が変わります"
        ],
        ask: ["収入状況は？", "通学可能な訓練は？"],
        where: "確認先：ハローワーク"
      },
      {
        title: "子育て支援（児童手当・医療費助成など）",
        tag: "子どもがいる",
        when: (s) => s.hasKids === true,
        points: [
          "子どもがいる世帯は自治体の子育て支援を確認対象",
          "所得やお子さんの年齢で区分が変わる場合があります"
        ],
        ask: ["お子さんの年齢は？", "医療費助成は利用中？"],
        where: "確認先：市区町村の子育て窓口"
      }
    ];

    const readState = () => ({
      age: Number($("age").value || 0),
      pref: $("pref").value || "",
      work: $("work").value,
      income: $("income").value,
      taxfree: $("taxfree").value,
      money: $("money").value,
      hasKids: $("hasKids").checked,
      singleParent: $("singleParent").checked,
      care: $("care").checked,
      disability: $("disability").checked,
      jobSearch: $("jobSearch").checked
    });

    const escapeHtml = (str) => String(str)
      .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");

    const render = () => {
      const s = readState();

      const picked = PROGRAMS.filter(p => {
        try { return p.when(s); } catch { return false; }
      });

      summaryEl.textContent = `候補 ${picked.length}件を表示中（未入力でも表示されます）`;

      resultsEl.innerHTML = "";
      picked.forEach(p => {
        const card = document.createElement("div");
        card.className = "resultCard";
        card.innerHTML = `
          <div class="resultTop">
            <div class="resultTitle">${escapeHtml(p.title)}</div>
            <div class="tag">${escapeHtml(p.tag)}</div>
          </div>
          <div class="points">
            <div><b>確認ポイント</b></div>
            <ul>${p.points.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
            <div class="hint"><b>聞き取り例：</b> ${escapeHtml(p.ask.join(" / "))}</div>
            <div class="hint">${escapeHtml(p.where)}</div>
          </div>
        `;
        resultsEl.appendChild(card);
      });
    };

    btnCheck.addEventListener("click", render);

    btnReset.addEventListener("click", () => {
      $("age").value = "";
      $("pref").value = "";
      $("work").value = "working";
      $("income").value = "unknown";
      $("taxfree").value = "unknown";
      $("money").value = "ok";
      ["hasKids","singleParent","care","disability","jobSearch"].forEach(id => $(id).checked = false);
      summaryEl.textContent = "リセットしました。";
      resultsEl.innerHTML = "";
    });

    btnCopy.addEventListener("click", async () => {
      const text = resultsEl.innerText || "候補はありません";
      try{
        await navigator.clipboard.writeText(text);
        btnCopy.textContent = "コピーしました";
        setTimeout(()=>btnCopy.textContent="結果をコピー", 1200);
      }catch(e){
        // コピーがブロックされても「表示」は動くので、ここは握りつぶし
        alert("コピーがブロックされました。表示は正常です。");
      }
    });

    // 初回の動作確認用：ページ読み込み時に1度描画
    render();

  } catch (e) {
    showError(e && e.message ? e.message : String(e));
  }
})();
