/* global document, localStorage, IntersectionObserver, Blob, URL, FileReader */
(() => {
 const button = document.querySelector('.language');
 const setLanguage = language => {
  document.documentElement.lang = language;
  if (button) {
   button.textContent = language === 'ko' ? 'EN' : 'KO';
   button.setAttribute('aria-label', language === 'ko' ? 'Switch language to English' : '한국어로 전환');
  }
 };
 button?.addEventListener('click', () => setLanguage(document.documentElement.lang === 'ko' ? 'en' : 'ko'));

 const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
 if (!reduce.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
   for (const entry of entries) {
    if (entry.isIntersecting) {
     entry.target.classList.add('is-seen');
     observer.unobserve(entry.target);
    }
   }
  }, { threshold: 0.08 });
  for (const section of document.querySelectorAll('.section')) observer.observe(section);
 }

 // Interactive MVP Workspace (/yesterdays-me/)
 const root = document.getElementById('ym-mvp-root');
 if (!root) return;

 const STORAGE_KEY = 'yesterdays-me.mvp.records.v3';
 const DRAFT_KEY = 'yesterdays-me.mvp.drafts.v2';
 const SEEDED_KEY = 'yesterdays-me.mvp.seeded.v2';

 const AXES = [
  { key: 'career', ko: '커리어', en: 'Career', eqKo: '커리어 균형', eqEn: 'Career Equilibrium', color: '#3B82F6' },
  { key: 'physical', ko: '신체', en: 'Body', eqKo: '신체 균형', eqEn: 'Physical Equilibrium', color: '#F97316' },
  { key: 'emotional', ko: '정서', en: 'Mind', eqKo: '정서·관계 균형', eqEn: 'Relational Equilibrium', color: '#A855F7' },
  { key: 'financial', ko: '자산', en: 'Money', eqKo: '자산 균형', eqEn: 'Financial Equilibrium', color: '#CA8A04' }
 ];

 const QUESTIONS = [
  // 1. Career (Work & Growth Equilibrium)
  {
   key: 'careerDevelopment',
   axis: 'career',
   polarity: 'positive',
   ko: '오늘 내 커리어와 역량을 키우거나 기록·계획하는 시간을 5분 이상 가졌나요?',
   en: 'Did you spend at least 5 minutes growing, logging, or planning your career and skills today?',
   shortKo: '커리어 발전 5분',
   shortEn: '5m Career Growth',
   color: '#3B82F6'
  },
  {
   key: 'workInnovation',
   axis: 'career',
   polarity: 'positive',
   ko: '오늘 직무에서 새로운 일을 배우고 해내거나 기존 업무 방식을 더 효율적으로 바꿨나요?',
   en: 'Did you learn or take on new work, or make an existing workflow more efficient today?',
   shortKo: '새 업무·효율 개선',
   shortEn: 'Workflow Innovation',
   color: '#3B82F6'
  },
  {
   key: 'workMistake',
   axis: 'career',
   polarity: 'friction',
   ko: '오늘 업무에서 실수를 하거나 동료와 협업·소통이 어긋난 일이 있었나요?',
   en: 'Did you make a work mistake or run into a collaboration or communication breakdown today?',
   shortKo: '업무 실수·소통 마찰',
   shortEn: 'Work or Sync Friction',
   color: '#EF4444'
  },
  // 2. Physical (Body & Vitality Equilibrium)
  {
   key: 'physicalActivity',
   axis: 'physical',
   polarity: 'positive',
   ko: '오늘 유산소·근력 운동이나 산책·스트레칭 같은 가벼운 신체 활동을 했나요?',
   en: 'Did you do cardio, strength training, or light movement like walking or stretching today?',
   shortKo: '운동·신체 활동',
   shortEn: 'Exercise & Movement',
   color: '#F97316'
  },
  {
   key: 'waterIntake',
   axis: 'physical',
   polarity: 'positive',
   ko: '오늘 하루 동안 물을 충분히 마셨나요?',
   en: 'Did you drink enough water throughout the day today?',
   shortKo: '충분한 수분 보충',
   shortEn: 'Enough Water',
   color: '#F97316'
  },
  {
   key: 'dietSleepStrain',
   axis: 'physical',
   polarity: 'friction',
   ko: '오늘 과식·야식·지나친 소식을 하거나 어제 너무 늦게 잠들어 몸에 무리가 갔나요?',
   en: 'Did you overeat, eat late at night, undereat, or go to sleep too late last night?',
   shortKo: '식습관·수면 무리',
   shortEn: 'Diet or Sleep Strain',
   color: '#EF4444'
  },
  // 3. Emotional (Relational & Emotional Equilibrium)
  {
   key: 'complimentedSomeone',
   axis: 'emotional',
   polarity: 'positive',
   ko: '오늘 누군가를 칭찬하거나 기분 좋게 해준 일이 있나요?',
   en: 'Did you compliment someone or do something to make someone feel good today?',
   shortKo: '칭찬과 다정함',
   shortEn: 'Compliment or Kindness',
   color: '#4CAF50'
  },
  {
   key: 'emotionalReaction',
   axis: 'emotional',
   polarity: 'friction',
   ko: '오늘 누군가에게 감정적인 반응을 보였나요?',
   en: 'Did you have an emotional reaction to someone today?',
   shortKo: '감정 반응',
   shortEn: 'Emotional Reaction',
   color: '#F97316'
  },
  {
   key: 'emotionallyHurt',
   axis: 'emotional',
   polarity: 'friction',
   ko: '오늘 누군가에게 감정적으로 상처를 받았나요?',
   en: 'Were you emotionally hurt by someone today?',
   shortKo: '마음의 상처',
   shortEn: 'Emotionally Hurt',
   color: '#A855F7'
  },
  // 4. Financial (Money & Mindful Spending Equilibrium)
  {
   key: 'assetGrowth',
   axis: 'financial',
   polarity: 'positive',
   ko: '오늘 저축·투자·수입 만들기처럼 자산을 모으고 불리는 행동을 했나요?',
   en: 'Did you take action to build or grow your assets through saving, investing, or earning today?',
   shortKo: '자산 확보·증식',
   shortEn: 'Asset Building',
   color: '#CA8A04'
  },
  {
   key: 'assetPlanning',
   axis: 'financial',
   polarity: 'positive',
   ko: '오늘 단기·장기 자산 계획을 세우고 점검하거나 계획대로 실천했나요?',
   en: 'Did you set, review, or follow through on your short- or long-term financial plan today?',
   shortKo: '자산 계획·실천',
   shortEn: 'Financial Plan Check',
   color: '#CA8A04'
  },
  {
   key: 'impulseSpending',
   axis: 'financial',
   polarity: 'friction',
   ko: '오늘 계획에 없던 충동구매나 기분 전환용 지출을 했나요?',
   en: 'Did you make an unplanned impulse purchase or spend money just to lift your mood today?',
   shortKo: '충동·기분 지출',
   shortEn: 'Impulse Spending',
   color: '#EF4444'
  }
 ];

 const dual = (ko, en, tag = 'span', cls = '') =>
  `<${tag}${cls ? ` class="${cls}"` : ''} data-lang="ko">${ko}</${tag}><${tag}${cls ? ` class="${cls}"` : ''} data-lang="en" lang="en">${en}</${tag}>`;

 const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

 const pad2 = n => String(n).padStart(2, '0');
 const toIso = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
 const parseIso = s => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
 };
 const shiftIso = (iso, deltaDays) => {
  const dt = parseIso(iso);
  dt.setDate(dt.getDate() + deltaDays);
  return toIso(dt);
 };
 const todayIso = () => toIso(new Date());

 const emptyReflections = () => {
  const out = {};
  for (const q of QUESTIONS) {
   out[q.key] = { answer: null, note: '' };
  }
  return out;
 };

 const normalizeEntry = raw => {
  if (!raw || typeof raw !== 'object') return { answer: null, note: '' };
  const answer = typeof raw.answer === 'boolean' ? raw.answer : null;
  const note = answer === true && typeof raw.note === 'string' ? raw.note.trim().slice(0, 200) : '';
  return { answer, note };
 };

 const normalizeRecord = (date, raw = {}) => {
  const refs = raw.reflections || {};
  const normalizedRefs = {};
  for (const q of QUESTIONS) {
   normalizedRefs[q.key] = normalizeEntry(refs[q.key]);
  }
  return {
   date,
   career: String(raw.career || '').trim().slice(0, 200),
   physical: String(raw.physical || '').trim().slice(0, 200),
   emotional: String(raw.emotional || '').trim().slice(0, 200),
   financial: String(raw.financial || '').trim().slice(0, 200),
   financialCategory: raw.financial ? (raw.financialCategory || 'SAVINGS') : 'SAVINGS',
   reflections: normalizedRefs,
   updatedAt: raw.updatedAt || new Date().toISOString()
  };
 };

 const hasRecordContent = rec => {
  if (!rec) return false;
  const axisFilled = AXES.some(a => (rec[a.key] || '').trim().length > 0);
  const refAnswered = QUESTIONS.some(q => rec.reflections?.[q.key]?.answer !== null && rec.reflections?.[q.key]?.answer !== undefined);
  return axisFilled || refAnswered;
 };

 const scoreAxis = (rec, axisKey) => (rec && rec[axisKey] ? rec[axisKey].trim().length : 0);
 const scoreRecord = (rec, axisFilter = 'all') => {
  if (!rec) return 0;
  if (axisFilter !== 'all') return scoreAxis(rec, axisFilter);
  return AXES.reduce((acc, a) => acc + scoreAxis(rec, a.key), 0);
 };

 const loadRecords = () => {
  try {
   const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('yesterdays-me.mvp.records.v2');
   if (!raw) return {};
   const parsed = JSON.parse(raw);
   const out = {};
   for (const [k, v] of Object.entries(parsed)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k)) {
     const norm = normalizeRecord(k, v);
     if (hasRecordContent(norm)) out[k] = norm;
    }
   }
   return out;
  } catch {
   return {};
  }
 };

 const saveRecords = map => {
  try {
   localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
   // ignore quota errors
  }
 };

 const buildSeedRecords = daysCount => {
  const t = todayIso();
  const careerSamples = [
   '디자인 시스템 토큰 정리 및 PR 배포 마무리',
   '신규 MVP 아키텍처 문서 초안 작성 및 검토',
   '코드 리뷰 3건 진행하고 핵심 테스트 보강',
   '주간 스프린트 우선순위 재조정 및 마일스톤 점검',
   '클라이언트 상태 관리 로직 리팩터링 마무리',
   '성능 병목 구간 프로파일링 및 렌더링 개선',
   '릴리스 체크리스트 자동화 스크립트 작성'
  ];
  const physicalSamples = [
   '아침 러닝 5km 가볍게 완주하고 스트레칭 15분',
   '점심 산책 30분, 하루 동안 물 2리터 마시기 실천',
   '저녁 코어 운동 25분 및 11시 반 이전 취침',
   '계단 오르기 및 가공식품 줄이기 실천',
   '하체 근력 운동 40분 후 단백질 식단 챙김',
   '목·어깨 폼롤러 스트레칭 20분으로 피로 회복'
  ];
  const emotionalSamples = [
   '급한 요청에도 호흡을 먼저 가다듬고 차분히 답변함',
   '저녁에 스마트폰을 내려놓고 20분 동안 독서하며 휴식',
   '복잡한 생각을 노트에 세 줄로 적으며 마음 정리',
   '불안한 감정이 올라올 때 창밖을 보며 5분 명상',
   '문서를 꼼꼼히 챙겨 준 동료에게 고맙다고 먼저 인사함'
  ];
  const financialSamples = [
   { text: '월급날 정기 적금 30만 원 자동이체 완료', cat: 'SAVINGS' },
   { text: '안 쓰는 구독 서비스 2건 해지해 고정 지출 절감', cat: 'EXPENSE_REDUCTION' },
   { text: '글로벌 ETF 정기 분할 매수 및 포트폴리오 점검', cat: 'INVESTMENT' },
   { text: '배달 음식 대신 집밥으로 저녁 해결해 외식비 절약', cat: 'EXPENSE_REDUCTION' },
   { text: '사이드 프로젝트 정산금 입금 확인 및 비상금 통장 이체', cat: 'INCOME' }
  ];

  const seeded = {};
  for (let i = 0; i < daysCount; i++) {
   if (i % 9 === 5) continue;
   const date = shiftIso(t, -i);
   const fin = financialSamples[i % financialSamples.length];
   seeded[date] = normalizeRecord(date, {
    career: careerSamples[i % careerSamples.length],
    physical: i % 5 === 3 ? '' : physicalSamples[i % physicalSamples.length],
    emotional: emotionalSamples[i % emotionalSamples.length],
    financial: i % 4 === 2 ? '' : fin.text,
    financialCategory: fin.cat,
    reflections: {
     careerDevelopment: { answer: i % 2 === 0 || i % 3 === 0, note: '' },
     workInnovation: { answer: i % 3 !== 1, note: '' },
     workMistake: { answer: i % 6 === 2, note: '' },
     physicalActivity: { answer: i % 2 === 0, note: '' },
     waterIntake: { answer: i % 4 !== 3, note: '' },
     dietSleepStrain: { answer: i % 5 === 2, note: '' },
     complimentedSomeone: { answer: i % 2 === 0 || i % 3 === 0, note: '' },
     emotionalReaction: { answer: i % 4 === 1, note: '' },
     emotionallyHurt: { answer: i % 6 === 2, note: '' },
     assetGrowth: { answer: i % 3 !== 2, note: '' },
     assetPlanning: { answer: i % 2 === 0, note: '' },
     impulseSpending: { answer: i % 5 === 3, note: '' }
    },
    updatedAt: new Date(Date.now() - i * 86400000).toISOString()
   });
  }
  return seeded;
 };

 let records = loadRecords();
 if (Object.keys(records).length === 0 && !localStorage.getItem(SEEDED_KEY)) {
  records = buildSeedRecords(18);
  saveRecords(records);
  try {
   localStorage.setItem(SEEDED_KEY, '1');
  } catch {
   // ignore
  }
 }

 let activeDate = todayIso();
 let activePeriod = 'week';
 let activeAxis = 'all';
 let currentDraft = normalizeRecord(activeDate, records[activeDate] || {});

 // DOM References
 const datePicker = document.getElementById('ym-date-picker');
 const btnToday = document.getElementById('ym-btn-today');
 const btnSeed = document.getElementById('ym-btn-seed');
 const btnTheme = document.getElementById('ym-btn-theme');
 const toastEl = document.getElementById('ym-toast');

 const refProgressEl = document.getElementById('ym-reflection-progress');
 const axisProgressEl = document.getElementById('ym-axis-progress');
 const categoryWrapEl = document.getElementById('ym-category-wrap');
 const categorySelectEl = document.getElementById('ym-select-category');
 const btnSave = document.getElementById('ym-btn-save');
 const btnClearDay = document.getElementById('ym-btn-clear-day');
 const yesterdayDateEl = document.getElementById('ym-yesterday-date');
 const yesterdayPeekEl = document.getElementById('ym-yesterday-peek');
 const selectedDateLabelEl = document.getElementById('ym-selected-date-label');
 const todaySnapshotEl = document.getElementById('ym-today-snapshot');

 const kpiRowEl = document.getElementById('ym-kpi-row');
 const dashboardHeroEl = document.getElementById('ym-dashboard-hero');
 const personaButtonsEl = document.getElementById('ym-persona-buttons');
 const personaDetailEl = document.getElementById('ym-persona-detail');
 const refPeriodSubEl = document.getElementById('ym-ref-period-sub');
 const refTrendBodyEl = document.getElementById('ym-ref-trend-body');
 const chartSubEl = document.getElementById('ym-chart-sub');
 const chartContainerEl = document.getElementById('ym-chart-container');

 const signalsContentEl = document.getElementById('ym-signals-content');
 const historySearchEl = document.getElementById('ym-history-search');
 const historyCountEl = document.getElementById('ym-history-count');
 const historyListEl = document.getElementById('ym-history-list');
 const btnExportCsv = document.getElementById('ym-btn-export-csv');
 const btnExportJson = document.getElementById('ym-btn-export-json');
 const inputImportJson = document.getElementById('ym-input-import-json');
 const btnResetAll = document.getElementById('ym-btn-reset-all');

 let toastTimer = null;
 const showToast = (koMsg, enMsg) => {
  if (!toastEl) return;
  toastEl.innerHTML = dual(esc(koMsg), esc(enMsg));
  toastEl.classList.add('is-visible');
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
 };

 // Sync form UI with currentDraft
 const syncFormFromDraft = () => {
  if (datePicker) datePicker.value = activeDate;

  let refAnswered = 0;
  for (const q of QUESTIONS) {
   const row = root.querySelector(`.ym-q-row[data-q-key="${q.key}"]`);
   if (!row) continue;
   const entry = currentDraft.reflections[q.key] || { answer: null, note: '' };
   if (entry.answer !== null) refAnswered++;
   const yesBtn = row.querySelector('[data-q-ans="yes"]');
   const noBtn = row.querySelector('[data-q-ans="no"]');

   yesBtn?.classList.remove('is-yes', 'is-no');
   noBtn?.classList.remove('is-yes', 'is-no');
   if (entry.answer === true) yesBtn?.classList.add('is-yes');
   if (entry.answer === false) noBtn?.classList.add('is-no');
  }
  if (refProgressEl) refProgressEl.textContent = `${refAnswered}/${QUESTIONS.length}`;

  let axisFilled = 0;
  for (const a of AXES) {
   const input = document.getElementById(`ym-input-${a.key}`);
   const counter = document.getElementById(`ym-count-${a.key}`);
   const val = currentDraft[a.key] || '';
   if (val.trim().length > 0) axisFilled++;
   if (input && input.value !== val) input.value = val;
   if (counter) counter.textContent = `${val.length}/200`;
  }
  if (axisProgressEl) axisProgressEl.textContent = `${axisFilled}/4`;

  const hasFin = (currentDraft.financial || '').trim().length > 0;
  if (categoryWrapEl) categoryWrapEl.hidden = !hasFin;
  if (categorySelectEl) categorySelectEl.value = currentDraft.financialCategory || 'SAVINGS';

  renderRecordSidebars();
 };

 const renderRecordSidebars = () => {
  const yDate = shiftIso(activeDate, -1);
  if (yesterdayDateEl) yesterdayDateEl.textContent = yDate;
  const yRec = records[yDate];
  if (yesterdayPeekEl) {
   if (!yRec || !hasRecordContent(yRec)) {
    yesterdayPeekEl.innerHTML = `<div class="ym-empty">${dual('어제 저장된 기록이 아직 없어요. 오늘 루틴 체크나 한 줄부터 가볍게 시작해 보세요.', 'No saved record for yesterday yet. Start with a routine check-in or one line today.')}</div>`;
   } else {
    const axisBlocks = AXES.map(a => {
     const text = yRec[a.key];
     const axisQs = QUESTIONS.filter(q => q.axis === a.key);
     const qChips = axisQs.map(q => {
      const ans = yRec.reflections?.[q.key]?.answer;
      if (ans === null || ans === undefined) return '';
      const cls = ans ? 'is-yes' : 'is-no';
      return `<span class="ym-pill ${cls}" style="min-height:20px;padding:1px 7px;font-size:11px;margin-right:4px">${dual(q.shortKo, q.shortEn)}: ${ans ? dual('예', 'Y') : dual('아니오', 'N')}</span>`;
     }).filter(Boolean).join('');

     if (!text && !qChips) return '';
     return `<div style="padding:10px 0;border-top:1px solid var(--mvp-line);font-size:13px">
      <div><span class="ym-dot" style="background:${a.color};display:inline-block;margin-right:6px"></span><strong>${dual(a.ko, a.en)}</strong>${text ? `: ${esc(text)}` : ''}</div>
      ${qChips ? `<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">${qChips}</div>` : ''}
     </div>`;
    }).join('');

    yesterdayPeekEl.innerHTML = `<div>${axisBlocks}</div>
     <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--mvp-line);display:flex;justify-content:flex-end">
      <button type="button" class="ym-pill" id="ym-btn-copy-yesterday-routines" style="min-height:28px;padding:4px 12px;font-size:12px">
       ${dual('어제 루틴 그대로 불러오기', "Copy yesterday's routines")}
      </button>
     </div>`;
    const copyBtn = yesterdayPeekEl.querySelector('#ym-btn-copy-yesterday-routines');
    if (copyBtn) {
     copyBtn.addEventListener('click', () => {
      for (const q of QUESTIONS) {
       const ans = yRec.reflections?.[q.key]?.answer;
       if (ans !== undefined) {
        currentDraft.reflections[q.key] = { answer: ans, note: '' };
       }
      }
      syncFormFromDraft();
      showToast('어제 루틴 응답을 오늘 초안으로 불러왔어요.', "Copied yesterday's routines into today's draft.");
     });
    }
   }
  }

  if (selectedDateLabelEl) {
   const isSaved = Boolean(records[activeDate]);
   selectedDateLabelEl.innerHTML = `${esc(activeDate)} · ${isSaved ? dual('저장됨', 'Saved') : dual('작성 중 (미저장)', 'Drafting (Unsaved)')}`;
  }

  if (todaySnapshotEl) {
   const totalChars = scoreRecord(currentDraft, 'all');
   const answeredCount = QUESTIONS.filter(q => currentDraft.reflections?.[q.key]?.answer !== null).length;
   const posYes = QUESTIONS.filter(q => q.polarity === 'positive' && currentDraft.reflections?.[q.key]?.answer === true).length;
   const fricYes = QUESTIONS.filter(q => q.polarity === 'friction' && currentDraft.reflections?.[q.key]?.answer === true).length;
   const filledAxes = AXES.filter(a => (currentDraft[a.key] || '').trim().length > 0).length;

   todaySnapshotEl.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
     <div style="padding:12px;border:1px solid var(--mvp-line);background:var(--mvp-surface)">
      <div class="micro">${dual('12개 루틴 점검', '12 Routines')}</div>
      <div style="font-size:22px;font-family:var(--serif);margin-top:4px">${answeredCount}/12 <span class="micro">(${dual(`긍정 ${posYes} · 마찰 ${fricYes}`, `+${posYes} / -${fricYes}`)})</span></div>
     </div>
     <div style="padding:12px;border:1px solid var(--mvp-line);background:var(--mvp-surface)">
      <div class="micro">${dual('작성한 축', 'Filled Axes')}</div>
      <div style="font-size:22px;font-family:var(--serif);margin-top:4px">${filledAxes}/4</div>
     </div>
     <div style="padding:12px;border:1px solid var(--mvp-line);background:var(--mvp-surface)">
      <div class="micro">${dual('4축 글자 점수', '4-Axis Char Score')}</div>
      <div style="font-size:22px;font-family:var(--serif);margin-top:4px">${totalChars}<span class="micro">/800</span></div>
     </div>
    </div>
    <div>
     ${AXES.map(a => {
      const len = (currentDraft[a.key] || '').trim().length;
      const axisQs = QUESTIONS.filter(q => q.axis === a.key);
      const axisAns = axisQs.filter(q => currentDraft.reflections?.[q.key]?.answer !== null).length;
      const pct = Math.min(100, Math.round((len / 200) * 100));
      return `<div class="ym-bar-row">
       <div class="ym-bar-meta"><span>${dual(a.ko, a.en)} <span class="micro">(${dual(`루틴 ${axisAns}/3`, `Routines ${axisAns}/3`)})</span></span><span class="ym-counter">${len}/200</span></div>
       <div class="ym-bar-track"><div class="ym-bar-fill" style="width:${pct}%;background:${a.color}"></div></div>
      </div>`;
     }).join('')}
    </div>
   `;
  }
 };

 const loadDateIntoEditor = isoDate => {
  activeDate = isoDate;
  if (records[isoDate]) {
   currentDraft = normalizeRecord(isoDate, records[isoDate]);
  } else {
   currentDraft = normalizeRecord(isoDate, {});
  }
  syncFormFromDraft();
 };

 // Question Yes/No handlers
 for (const q of QUESTIONS) {
  const row = root.querySelector(`.ym-q-row[data-q-key="${q.key}"]`);
  if (!row) continue;
  const yesBtn = row.querySelector('[data-q-ans="yes"]');
  const noBtn = row.querySelector('[data-q-ans="no"]');

  yesBtn?.addEventListener('click', () => {
   const prev = currentDraft.reflections[q.key].answer;
   currentDraft.reflections[q.key].answer = prev === true ? null : true;
   syncFormFromDraft();
  });

  noBtn?.addEventListener('click', () => {
   const prev = currentDraft.reflections[q.key].answer;
   currentDraft.reflections[q.key].answer = prev === false ? null : false;
   syncFormFromDraft();
  });
 }

 // Axis input handlers
 for (const a of AXES) {
  const input = document.getElementById(`ym-input-${a.key}`);
  input?.addEventListener('input', e => {
   currentDraft[a.key] = e.target.value.slice(0, 200);
   syncFormFromDraft();
  });
 }

 categorySelectEl?.addEventListener('change', e => {
  currentDraft.financialCategory = e.target.value;
 });

 datePicker?.addEventListener('change', e => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) {
   loadDateIntoEditor(e.target.value);
   renderAllPanels();
  }
 });

 btnToday?.addEventListener('click', () => {
  loadDateIntoEditor(todayIso());
  renderAllPanels();
  showToast('오늘 날짜로 이동했어요.', 'Jumped to today.');
 });

 btnSeed?.addEventListener('click', () => {
  const seeded = buildSeedRecords(45);
  records = { ...seeded, ...records };
  saveRecords(records);
  loadDateIntoEditor(activeDate);
  renderAllPanels();
  showToast('최근 45일 샘플 기록을 채웠어요. 대시보드와 나의 변화 탭을 확인해 보세요!', 'Loaded 45 days of sample records. Explore Dashboard & Change Signals!');
 });

 btnTheme?.addEventListener('click', () => {
  const isDark = root.getAttribute('data-mvp-theme') === 'dark';
  const next = isDark ? 'paper' : 'dark';
  root.setAttribute('data-mvp-theme', next);
  btnTheme.setAttribute('aria-pressed', String(!isDark));
  btnTheme.innerHTML = !isDark
   ? dual('라이트 모드 (#F6F4EE)', 'Paper Surface (#F6F4EE)')
   : dual('다크 모드 (#1A1A1A)', 'Dark Surface (#1A1A1A)');
 });

 btnSave?.addEventListener('click', () => {
  const norm = normalizeRecord(activeDate, currentDraft);
  if (!hasRecordContent(norm)) {
   showToast('루틴 문항이나 한 줄 기록 중 하나라도 입력해 주세요.', 'Please answer at least one routine question or one axis line before saving.');
   return;
  }
  records[activeDate] = norm;
  saveRecords(records);
  try {
   localStorage.setItem(DRAFT_KEY, JSON.stringify(norm));
  } catch {
   // ignore
  }
  renderAllPanels();
  showToast(`${activeDate} 기록을 저장했어요.`, `Saved record for ${activeDate}.`);
 });

 btnClearDay?.addEventListener('click', () => {
  currentDraft = normalizeRecord(activeDate, { reflections: emptyReflections() });
  syncFormFromDraft();
  showToast('현재 입력 칸을 비웠어요.', 'Cleared current form inputs.');
 });

 // Tab switching
 const tabBtns = root.querySelectorAll('.ym-tab');
 const setTab = tabName => {
  for (const b of tabBtns) {
   const isMatch = b.getAttribute('data-ym-tab') === tabName;
   b.setAttribute('aria-selected', String(isMatch));
  }
  for (const p of root.querySelectorAll('.ym-panel')) {
   p.classList.toggle('is-active', p.id === `ym-panel-${tabName}`);
  }
  renderAllPanels();
 };
 for (const b of tabBtns) {
  b.addEventListener('click', () => setTab(b.getAttribute('data-ym-tab')));
 }

 // Dashboard Period & Axis Controls
 for (const b of root.querySelectorAll('[data-ym-period]')) {
  b.addEventListener('click', () => {
   activePeriod = b.getAttribute('data-ym-period');
   for (const peer of root.querySelectorAll('[data-ym-period]')) {
    peer.setAttribute('aria-pressed', String(peer === b));
   }
   renderDashboard();
  });
 }

 for (const b of root.querySelectorAll('[data-ym-axis]')) {
  b.addEventListener('click', () => {
   activeAxis = b.getAttribute('data-ym-axis');
   for (const peer of root.querySelectorAll('[data-ym-axis]')) {
    peer.setAttribute('aria-pressed', String(peer === b));
   }
   renderDashboard();
  });
 }

 const getPeriodDaysCount = period => {
  if (period === 'yesterday') return 2;
  if (period === 'week') return 7;
  if (period === 'month') return 30;
  return 365;
 };

 const computeStreaks = refDate => {
  const sortedDates = Object.keys(records).filter(d => hasRecordContent(records[d])).sort();
  if (sortedDates.length === 0) return { current: 0, longest: 0 };

  let current = 0;
  let cursor = records[refDate] ? refDate : shiftIso(refDate, -1);
  while (records[cursor] && hasRecordContent(records[cursor])) {
   current++;
   cursor = shiftIso(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let prev = null;
  for (const d of sortedDates) {
   if (prev && shiftIso(prev, 1) === d) {
    run++;
   } else {
    run = 1;
   }
   if (run > longest) longest = run;
   prev = d;
  }
  return { current, longest };
 };

 const PERSONAS_10 = [
  {
   id: 'p01_recovery',
   code: 'P01',
   labelKo: 'P01 김지훈 · 번아웃 회복',
   labelEn: 'P01 Jihun · Recovery',
   roleKo: '스타트업 백엔드 개발자 (31세) · 초반 야근·수면 무리 → 후반 아침 산책·커리어 루틴 정착',
   roleEn: 'Backend Engineer (31) · Early burnout & sleep strain → Late morning walks & 5m career logs',
   painKo: '기존 불편함(65일 체험): 수면 무리를 줄이고 운동 루틴을 늘렸는데 글자 수만 보여 성장을 한눈에 알기 어려웠음.',
   painEn: '65d Pain Point: Cut sleep strain and built exercise habits, but char-only charts hid real improvement.',
   fixKo: '시각화 해결: 최상단 한 줄 헤드라인("이전보다 긍정 루틴이 +45%p 늘며 뚜렷하게 나아지고 있어요")과 전후 비교 바로 즉시 체감.'
  },
  {
   id: 'p02_returner',
   code: 'P02',
   labelKo: 'P02 이서연 · 공백 후 복귀',
   labelEn: 'P02 Seoyeon · Returner',
   roleKo: '프리랜서 디자이너 (28세) · 외주 마감 주간 5일 공백 후 어제·오늘 다시 복귀',
   roleEn: 'Freelance Designer (28) · Paused 5 days for client deadline, resumed yesterday & today',
   painKo: '기존 불편함(65일 체험): 며칠 쉬고 돌아올 때마다 깨진 연속 기록과 빈 차트만 보여 머쓱하고 죄책감이 들었음.',
   painEn: '65d Pain Point: Returning after deadline breaks showed broken streaks instead of welcoming the return.',
   fixKo: '시각화 해결: "5일 동안 멈춰 있던 기록을 깨고 다시 리듬을 되찾았어요" 헤드라인과 14일 리듬 스트립으로 복귀 탄력성 강조.'
  },
  {
   id: 'p03_routine_only',
   code: 'P03',
   labelKo: 'P03 박민석 · 15초 루틴 전용',
   labelEn: 'P03 Minseok · Routine-Only',
   roleKo: '대기업 마케터·워킹대디 (36세) · 텍스트 없이 매일 밤 12개 예/아니오 루틴만 15초 체크인',
   roleEn: 'Marketer & Dad (36) · 15-sec nightly Yes/No routine check-ins without typing text',
   painKo: '기존 불편함(65일 체험): 65일 중 56일이나 12개 루틴을 체크했는데 텍스트가 0자라 차트가 텅 빈 것처럼 나왔음.',
   painEn: '65d Pain Point: Checked 12 routines on 56 of 65 days, yet char-score charts rendered 0.',
   fixKo: '시각화 해결: 루틴 응답만으로도 활력 점수, 초록빛 14일 리듬 스트립, "흔들림 없이 리듬을 유지하고 있어요" 헤드라인이 작동함.'
  },
  {
   id: 'p04_plateau',
   code: 'P04',
   labelKo: 'P04 최유진 · 장기 정체',
   labelEn: 'P04 Yujin · Plateau',
   roleKo: '취업 준비생 (25세) · 65일간 주 3~4회 기계적 기록, 긍정 실천율 50% 안팎 정체',
   roleEn: 'Job Seeker (25) · Mechanical logging 3–4d/wk for 65 days with flat ~50% positive rate',
   painKo: '기존 불편함(65일 체험): 두 달 넘게 습관적으로 적고는 있지만 나아지고 있는지 정체된 건지 알 수 없었음.',
   painEn: '65d Pain Point: Logged mechanically for 2+ months without knowing it was a plateau.',
   fixKo: '시각화 해결: "최근 기록과 루틴이 비슷하게 머물러 있어요 · 작은 새 시도 하나를 더해볼까요?" 헤드라인과 정체 게이지 표시.'
  },
  {
   id: 'p05_strained',
   code: 'P05',
   labelKo: 'P05 정현우 · 마찰 경보',
   labelEn: 'P05 Hyunwoo · Strained',
   roleKo: '자영업 카페 운영 (42세) · 최근 3주간 매출·응대 스트레스로 감정·수면·충동지출 마찰 급증',
   roleEn: 'Cafe Owner (42) · Recent 3-week spike in emotional, sleep, and impulse-spending strain',
   painKo: '기존 불편함(65일 체험): 기록은 매일 해서 달성률은 높게 뜨지만 정작 삶에 마찰과 무리가 쌓인 걸 경고해주지 못했음.',
   painEn: '65d Pain Point: High logging completion hid the dangerous spike in daily friction signals.',
   fixKo: '시각화 해결: 주황/코랄빛 경보 헤드라인("최근 마찰·무리 신호가 늘었어요 · 속도를 조금 늦춰도 괜찮아요")과 마찰 스트립 표시.'
  },
  {
   id: 'p06_shift_nurse',
   code: 'P06',
   labelKo: 'P06 한소희 · 교대근무 회복',
   labelEn: 'P06 Sohee · Shift Nurse',
   roleKo: '대학병원 3교대 간호사 (33세) · 나이트 근무 수면·수분 불균형을 후반 30일 루틴으로 극복',
   roleEn: '3-Shift Nurse (33) · Overcame night-shift hydration/sleep strain in the second half',
   painKo: '기존 불편함(65일 체험): 축별 편차가 큰데 어느 축에서 긍정 루틴이 살아나고 마찰이 줄었는지 비교가 어려웠음.',
   painEn: '65d Pain Point: Hard to see which specific axis recovered from shift-work strain.',
   fixKo: '시각화 해결: 축별 긍정 대 마찰 양방향 대비 막대와 전진 헤드라인으로 신체 축 회복을 직관적으로 확인.'
  },
  {
   id: 'p07_finance_fix',
   code: 'P07',
   labelKo: 'P07 강태윤 · 충동지출 교정',
   labelEn: 'P07 Taeyoon · Finance Fix',
   roleKo: '사회초년생 영업직 (29세) · 초반 야식·쇼핑 충동지출 → 후반 자산 계획 점검 및 절약 정착',
   roleEn: 'Sales Rep (29) · Curbed early stress spending into steady asset planning in late 35d',
   painKo: '기존 불편함(65일 체험): 전반 30일과 후반 35일의 실천율 변화를 직관적인 막대로 나란히 비교해주는 곳이 없었음.',
   painEn: '65d Pain Point: Lacked a direct visual bar comparing first 30d vs last 35d.',
   fixKo: '시각화 해결: 이전 구간 vs 최근 구간 긍정 실천율 비교 바와 자산 축 균형 막대로 성취감 제공.'
  },
  {
   id: 'p08_teacher_empathy',
   code: 'P08',
   labelKo: 'P08 윤미경 · 감정노동 회복',
   labelEn: 'P08 Mikyung · Teacher',
   roleKo: '중학교 교사 (51세) · 매일 칭찬·다정한 인사와 산책으로 감정 소모를 다독이며 80%+ 긍정 유지',
   roleEn: 'Middle School Teacher (51) · Balances emotional labor with daily kindness & walks (>80% pos)',
   painKo: '기존 불편함(65일 체험): 엔트로피·기울기·대리 지표 같은 통계 용어가 차갑고 어렵게 느껴졌음.',
   painEn: '65d Pain Point: Technical terms like entropy and slope felt cold and hard to read.',
   fixKo: '시각화 해결: 통계 수치보다 따뜻한 한 줄 진단 문구와 14일 컬러 리듬 스트립을 가장 먼저 배치.'
  },
  {
   id: 'p09_paused',
   code: 'P09',
   labelKo: 'P09 송다은 · 9일 멈춤',
   labelEn: 'P09 Daeun · Paused 9d',
   roleKo: '대학생·인턴 병행 (23세) · 50일간 기록 후 기말·실습으로 최근 9일 연속 기록 멈춤 상태',
   roleEn: 'Student & Intern (23) · Logged 50 days, now paused for the last 9 days during exams',
   painKo: '기존 불편함(65일 체험): 9일 만에 열었을 때 며칠째 멈춰 있는지 알려주지 않고 빈 화면이나 옛날 숫자만 보여 막막했음.',
   painEn: '65d Pain Point: Opening after 9 days away showed blank weekly state instead of acknowledging the pause.',
   fixKo: '시각화 해결: "최근 9일째 기록이 멈춰 있어요 · 빈 날은 두고 오늘부터 다시 이어가요" 헤드라인과 멈춤 스트립 즉시 표시.'
  },
  {
   id: 'p10_balanced_pm',
   code: 'P10',
   labelKo: 'P10 조민재 · 4축 균형 마스터',
   labelEn: 'P10 Minjae · 4-Axis Master',
   roleKo: '프로덕트 매니저 (39세) · 65일 중 59일 네 축 루틴과 한 줄 요약을 고르게 발전시키는 헤비유저',
   roleEn: 'Product Manager (39) · Logged 59 of 65 days across all 4 axes with rising positive equilibrium',
   painKo: '기존 불편함(65일 체험): 기간과 축을 바꿀 때마다 3초 안에 핵심 결론을 브리핑해주는 상단 요약 카드가 없었음.',
   painEn: '65d Pain Point: Needed a 3-second executive summary card that adapts to every period & axis filter.',
   fixKo: '시각화 해결: 기간·축 필터에 즉각 연동되는 헤드라인 브리핑, 5단계 스펙트럼 게이지, 14일 리듬 스트립 제공.'
  }
 ];

 const buildPersona65dRecords = personaId => {
  const t = todayIso();
  const out = {};
  const totalDays = 65;
  for (let daysAgo = totalDays - 1; daysAgo >= 0; daysAgo--) {
   const d = shiftIso(t, -daysAgo);
   const isLate = daysAgo < 32;

   if (personaId === 'p01_recovery') {
    if (!isLate && daysAgo % 3 === 1) continue;
    if (isLate && daysAgo % 7 === 4) continue;
    out[d] = normalizeRecord(d, {
     career: isLate ? '아키텍처 리팩터링 및 PR 코드 리뷰 마무리' : '야근 중 긴급 핫픽스 배포',
     physical: isLate ? '아침 산책 30분 및 물 2리터 마시기' : '',
     emotional: daysAgo % 2 === 0 ? '동료에게 먼저 감사 인사 건네기' : '',
     financial: isLate && daysAgo % 2 === 0 ? '정기 적금 및 지출 계획 점검' : '',
     financialCategory: 'SAVINGS',
     reflections: {
      careerDevelopment: { answer: isLate ? true : daysAgo % 3 === 0, note: '' },
      workInnovation: { answer: isLate ? daysAgo % 4 !== 0 : false, note: '' },
      workMistake: { answer: isLate ? false : daysAgo % 2 === 0, note: '' },
      physicalActivity: { answer: isLate, note: '' },
      waterIntake: { answer: isLate ? true : daysAgo % 3 === 0, note: '' },
      dietSleepStrain: { answer: isLate ? daysAgo % 9 === 0 : true, note: '' },
      complimentedSomeone: { answer: isLate ? true : daysAgo % 2 === 0, note: '' },
      emotionalReaction: { answer: isLate ? false : daysAgo % 2 === 1, note: '' },
      emotionallyHurt: { answer: false, note: '' },
      assetGrowth: { answer: isLate ? daysAgo % 2 === 0 : false, note: '' },
      assetPlanning: { answer: isLate, note: '' },
      impulseSpending: { answer: isLate ? false : daysAgo % 2 === 0, note: '' }
     }
    });
   } else if (personaId === 'p02_returner') {
    if ((daysAgo >= 2 && daysAgo <= 6) || (daysAgo >= 18 && daysAgo <= 22) || (daysAgo >= 36 && daysAgo <= 40) || (daysAgo >= 52 && daysAgo <= 55)) continue;
    out[d] = normalizeRecord(d, {
     career: '클라이언트 브랜드 시안 피드백 반영 및 아카이빙',
     physical: '작업 전후 스트레칭 20분 및 수분 보충',
     emotional: '마감 뒤 산책하며 마음 가다듬기',
     financial: '외주 정산 내역 점검 및 저축 이체',
     financialCategory: 'INCOME',
     reflections: {
      careerDevelopment: { answer: true, note: '' },
      workInnovation: { answer: daysAgo % 2 === 0, note: '' },
      workMistake: { answer: false, note: '' },
      physicalActivity: { answer: daysAgo % 2 === 0, note: '' },
      waterIntake: { answer: true, note: '' },
      dietSleepStrain: { answer: daysAgo % 5 === 0, note: '' },
      complimentedSomeone: { answer: true, note: '' },
      emotionalReaction: { answer: false, note: '' },
      emotionallyHurt: { answer: false, note: '' },
      assetGrowth: { answer: daysAgo % 3 === 0, note: '' },
      assetPlanning: { answer: true, note: '' },
      impulseSpending: { answer: false, note: '' }
     }
    });
   } else if (personaId === 'p03_routine_only') {
    if (daysAgo % 8 === 5) continue;
    out[d] = normalizeRecord(d, {
     career: '', physical: '', emotional: '', financial: '',
     reflections: {
      careerDevelopment: { answer: daysAgo % 4 !== 1, note: '' },
      workInnovation: { answer: daysAgo % 3 !== 2, note: '' },
      workMistake: { answer: daysAgo % 7 === 0, note: '' },
      physicalActivity: { answer: daysAgo % 3 !== 1, note: '' },
      waterIntake: { answer: true, note: '' },
      dietSleepStrain: { answer: daysAgo % 6 === 0, note: '' },
      complimentedSomeone: { answer: true, note: '' },
      emotionalReaction: { answer: daysAgo % 8 === 0, note: '' },
      emotionallyHurt: { answer: false, note: '' },
      assetGrowth: { answer: daysAgo % 2 === 0, note: '' },
      assetPlanning: { answer: daysAgo % 3 !== 0, note: '' },
      impulseSpending: { answer: daysAgo % 7 === 2, note: '' }
     }
    });
   } else if (personaId === 'p04_plateau') {
    if (daysAgo % 2 === 1) continue;
    out[d] = normalizeRecord(d, {
     career: '채용 공고 확인 및 이력서 문장 점검',
     physical: daysAgo % 4 === 0 ? '동네 가벼운 산책 20분' : '',
     emotional: '', financial: '',
     reflections: {
      careerDevelopment: { answer: true, note: '' },
      workInnovation: { answer: false, note: '' },
      workMistake: { answer: false, note: '' },
      physicalActivity: { answer: daysAgo % 4 === 0, note: '' },
      waterIntake: { answer: daysAgo % 4 === 0, note: '' },
      dietSleepStrain: { answer: daysAgo % 4 === 2, note: '' },
      complimentedSomeone: { answer: daysAgo % 4 === 0, note: '' },
      emotionalReaction: { answer: false, note: '' },
      emotionallyHurt: { answer: false, note: '' },
      assetGrowth: { answer: false, note: '' },
      assetPlanning: { answer: daysAgo % 4 === 0, note: '' },
      impulseSpending: { answer: false, note: '' }
     }
    });
   } else if (personaId === 'p05_strained') {
    if (daysAgo % 7 === 6) continue;
    out[d] = normalizeRecord(d, {
     career: '매장 재고 점검 및 원가 정산 마감',
     physical: isLate ? '' : '오전 스트레칭 15분',
     emotional: '바쁜 시간대 고객 응대 후 호흡 가다듬기',
     financial: '매장 일일 정산 및 지출 점검',
     financialCategory: 'EXPENSE_REDUCTION',
     reflections: {
      careerDevelopment: { answer: !isLate, note: '' },
      workInnovation: { answer: false, note: '' },
      workMistake: { answer: isLate, note: '' },
      physicalActivity: { answer: !isLate, note: '' },
      waterIntake: { answer: !isLate, note: '' },
      dietSleepStrain: { answer: isLate, note: '' },
      complimentedSomeone: { answer: daysAgo % 3 === 0, note: '' },
      emotionalReaction: { answer: isLate, note: '' },
      emotionallyHurt: { answer: isLate && daysAgo % 2 === 0, note: '' },
      assetGrowth: { answer: false, note: '' },
      assetPlanning: { answer: !isLate, note: '' },
      impulseSpending: { answer: isLate, note: '' }
     }
    });
   } else if (personaId === 'p06_shift_nurse') {
    if (daysAgo % 6 === 4) continue;
    out[d] = normalizeRecord(d, {
     career: '병동 인계 체크리스트 개선 및 후배 프리셉터 코칭',
     physical: isLate ? '교대근무 전후 폼롤러 스트레칭 20분 및 수분 섭취' : '',
     emotional: '동료 간호사에게 따뜻한 격려 인사 건네기',
     financial: '교대근무 수당 저축 계좌 자동 분리',
     financialCategory: 'SAVINGS',
     reflections: {
      careerDevelopment: { answer: true, note: '' },
      workInnovation: { answer: isLate, note: '' },
      workMistake: { answer: false, note: '' },
      physicalActivity: { answer: isLate, note: '' },
      waterIntake: { answer: isLate, note: '' },
      dietSleepStrain: { answer: !isLate, note: '' },
      complimentedSomeone: { answer: true, note: '' },
      emotionalReaction: { answer: false, note: '' },
      emotionallyHurt: { answer: !isLate && daysAgo % 3 === 0, note: '' },
      assetGrowth: { answer: isLate, note: '' },
      assetPlanning: { answer: true, note: '' },
      impulseSpending: { answer: false, note: '' }
     }
    });
   } else if (personaId === 'p07_finance_fix') {
    if (daysAgo % 5 === 3) continue;
    out[d] = normalizeRecord(d, {
     career: '신규 고객사 제안서 업데이트 및 미팅 복기',
     physical: '퇴근길 두 정거장 먼저 내려 걷기 25분',
     emotional: '거절 피드백에도 평정심 유지하며 다음 미팅 준비',
     financial: isLate ? '배달 대신 집밥 실천하고 소액 적금 납입' : '주간 지출 내역 점검',
     financialCategory: 'EXPENSE_REDUCTION',
     reflections: {
      careerDevelopment: { answer: isLate ? true : daysAgo % 2 === 0, note: '' },
      workInnovation: { answer: isLate, note: '' },
      workMistake: { answer: false, note: '' },
      physicalActivity: { answer: daysAgo % 2 === 0, note: '' },
      waterIntake: { answer: true, note: '' },
      dietSleepStrain: { answer: !isLate && daysAgo % 2 === 0, note: '' },
      complimentedSomeone: { answer: true, note: '' },
      emotionalReaction: { answer: false, note: '' },
      emotionallyHurt: { answer: false, note: '' },
      assetGrowth: { answer: isLate, note: '' },
      assetPlanning: { answer: isLate, note: '' },
      impulseSpending: { answer: !isLate, note: '' }
     }
    });
   } else if (personaId === 'p08_teacher_empathy') {
    if (daysAgo % 6 === 5) continue;
    out[d] = normalizeRecord(d, {
     career: '수업 활동지 개선 및 학생 상담 기록 정리',
     physical: '방과 후 운동장 산책 30분 및 따뜻한 물 마시기',
     emotional: '조용히 애쓴 학생을 찾아 구체적으로 칭찬해 주기',
     financial: '연금저축 및 월간 교육비 예산 점검',
     financialCategory: 'SAVINGS',
     reflections: {
      careerDevelopment: { answer: true, note: '' },
      workInnovation: { answer: daysAgo % 2 === 0, note: '' },
      workMistake: { answer: false, note: '' },
      physicalActivity: { answer: daysAgo % 2 === 0, note: '' },
      waterIntake: { answer: true, note: '' },
      dietSleepStrain: { answer: false, note: '' },
      complimentedSomeone: { answer: true, note: '' },
      emotionalReaction: { answer: false, note: '' },
      emotionallyHurt: { answer: daysAgo % 7 === 0, note: '' },
      assetGrowth: { answer: daysAgo % 2 === 0, note: '' },
      assetPlanning: { answer: true, note: '' },
      impulseSpending: { answer: false, note: '' }
     }
    });
   } else if (personaId === 'p09_paused') {
    if (daysAgo < 9) continue;
    if (daysAgo % 5 === 4) continue;
    out[d] = normalizeRecord(d, {
     career: '인턴십 과제 자료 조사 및 전공 강의 복습',
     physical: '캠퍼스 도보 이동 및 물 충분히 마시기',
     emotional: '팀원에게 먼저 고맙다고 메시지 보내기',
     financial: '용돈 기입장 정리',
     financialCategory: 'OTHER',
     reflections: {
      careerDevelopment: { answer: true, note: '' },
      workInnovation: { answer: daysAgo % 2 === 0, note: '' },
      workMistake: { answer: false, note: '' },
      physicalActivity: { answer: true, note: '' },
      waterIntake: { answer: true, note: '' },
      dietSleepStrain: { answer: false, note: '' },
      complimentedSomeone: { answer: true, note: '' },
      emotionalReaction: { answer: false, note: '' },
      emotionallyHurt: { answer: false, note: '' },
      assetGrowth: { answer: false, note: '' },
      assetPlanning: { answer: true, note: '' },
      impulseSpending: { answer: false, note: '' }
     }
    });
   } else {
    if (daysAgo % 11 === 7) continue;
    out[d] = normalizeRecord(d, {
     career: '분기 제품 로드맵 지표 점검 및 실험 가설 문서화',
     physical: '아침 러닝 5km 및 수분 2리터 섭취 완료',
     emotional: '회의에서 동료의 아이디어를 구체적으로 칭찬함',
     financial: '글로벌 ETF 정기 매수 및 월간 자산 배분 점검',
     financialCategory: 'INVESTMENT',
     reflections: {
      careerDevelopment: { answer: true, note: '' },
      workInnovation: { answer: isLate ? true : daysAgo % 2 === 0, note: '' },
      workMistake: { answer: false, note: '' },
      physicalActivity: { answer: isLate ? true : daysAgo % 2 === 0, note: '' },
      waterIntake: { answer: true, note: '' },
      dietSleepStrain: { answer: false, note: '' },
      complimentedSomeone: { answer: true, note: '' },
      emotionalReaction: { answer: false, note: '' },
      emotionallyHurt: { answer: false, note: '' },
      assetGrowth: { answer: isLate ? true : daysAgo % 2 === 0, note: '' },
      assetPlanning: { answer: true, note: '' },
      impulseSpending: { answer: false, note: '' }
     }
    });
   }
  }
  return out;
 };

 let activePersonaId = null;

 const renderPersonaSimulatorBar = () => {
  if (!personaButtonsEl) return;
  personaButtonsEl.innerHTML = PERSONAS_10.map(p => {
   const isSelected = activePersonaId === p.id;
   return `<button type="button" class="ym-pill ${isSelected ? 'is-yes' : ''}" data-persona-id="${p.id}" style="font-size:11.5px;min-height:28px;padding:3px 10px">${dual(p.labelKo, p.labelEn)}</button>`;
  }).join('');

  for (const btn of personaButtonsEl.querySelectorAll('[data-persona-id]')) {
   btn.addEventListener('click', () => {
    const pid = btn.getAttribute('data-persona-id');
    const found = PERSONAS_10.find(x => x.id === pid);
    if (!found) return;
    activePersonaId = pid;
    records = buildPersona65dRecords(pid);
    saveRecords(records);
    loadDateIntoEditor(todayIso());
    renderPersonaSimulatorBar();
    renderAllPanels();
    if (personaDetailEl) {
     personaDetailEl.hidden = false;
     personaDetailEl.innerHTML = `
      <div style="padding:10px 12px;border:1px solid var(--mvp-line);background:var(--mvp-card)">
       <div><strong style="color:var(--mvp-ink)">${dual(found.roleKo, found.roleEn)}</strong></div>
       <div style="margin-top:4px">${dual(found.painKo, found.painEn)}</div>
       <div style="margin-top:3px;color:var(--mvp-accent)">${dual(found.fixKo, found.fixKo)}</div>
      </div>
     `;
    }
    showToast(`${found.labelKo} (65일 기록) 데이터를 불러왔어요.`, `Loaded 65-day dataset for ${found.labelEn}.`);
   });
  }
 };

 const isRecordActiveForAxis = (rec, axisFilter) => {
  if (!rec) return false;
  if (axisFilter === 'all') return hasRecordContent(rec);
  const hasTxt = scoreAxis(rec, axisFilter) > 0;
  const hasRef = QUESTIONS.some(q => q.axis === axisFilter && rec.reflections?.[q.key]?.answer !== null && rec.reflections?.[q.key]?.answer !== undefined);
  return hasTxt || hasRef;
 };

 const computeHeroVerdict = (windowDays, axisFilter) => {
  const scopeQuestions = axisFilter === 'all' ? QUESTIONS : QUESTIONS.filter(q => q.axis === axisFilter);
  const dates = [];
  for (let i = windowDays - 1; i >= 0; i--) {
   dates.push(shiftIso(activeDate, -i));
  }

  const allActiveDates = Object.keys(records)
   .filter(d => d <= activeDate && isRecordActiveForAxis(records[d], axisFilter))
   .sort();

  const daysSinceLast = allActiveDates.length > 0
   ? Math.round((parseIso(activeDate) - parseIso(allActiveDates[allActiveDates.length - 1])) / 86400000)
   : null;

  let returnGap = null;
  if (allActiveDates.length >= 2 && daysSinceLast !== null && daysSinceLast <= 1) {
   const lastDt = parseIso(allActiveDates[allActiveDates.length - 1]);
   const prevDt = parseIso(allActiveDates[allActiveDates.length - 2]);
   const g = Math.round((lastDt - prevDt) / 86400000) - 1;
   if (g >= 3) returnGap = g;
  }

  const mid = Math.max(1, Math.floor(dates.length / 2));
  const earlyDates = dates.slice(0, mid);
  const lateDates = dates.slice(mid);

  const countActive = list => list.filter(d => isRecordActiveForAxis(records[d], axisFilter)).length;
  const activeDays = countActive(dates);
  const earlyActRate = earlyDates.length ? countActive(earlyDates) / earlyDates.length : 0;
  const lateActRate = lateDates.length ? countActive(lateDates) / lateDates.length : 0;
  const actDeltaPp = Math.round((lateActRate - earlyActRate) * 100);

  const calcRates = list => {
   let pYes = 0; let pAns = 0; let fYes = 0; let fAns = 0;
   for (const d of list) {
    const r = records[d];
    if (!r) continue;
    for (const q of scopeQuestions) {
     const ans = r.reflections?.[q.key]?.answer;
     if (ans === true) {
      if (q.polarity === 'positive') { pYes++; pAns++; } else { fYes++; fAns++; }
     } else if (ans === false) {
      if (q.polarity === 'positive') pAns++; else fAns++;
     }
    }
   }
   return {
    posRate: pAns > 0 ? pYes / pAns : 0,
    fricRate: fAns > 0 ? fYes / fAns : 0,
    pAns,
    fAns
   };
  };

  const earlyR = calcRates(earlyDates);
  const lateR = calcRates(lateDates);
  const fullR = calcRates(dates);

  const earlyPosRate = earlyR.posRate;
  const latePosRate = lateR.pAns > 0 ? lateR.posRate : fullR.posRate;
  const posDeltaPp = earlyR.pAns > 0 && lateR.pAns > 0 ? Math.round((latePosRate - earlyPosRate) * 100) : 0;
  const recentFricRate = lateR.fAns > 0 ? lateR.fricRate : fullR.fricRate;

  let status = 'steady';
  let stageIndex = 3;
  if (allActiveDates.length === 0 || (activeDays <= 2 && allActiveDates.length <= 2)) {
   status = 'starting';
   stageIndex = 2;
  } else if (daysSinceLast !== null && daysSinceLast >= 3) {
   status = 'paused';
   stageIndex = 0;
  } else if (returnGap !== null && returnGap >= 3) {
   status = 'returning';
   stageIndex = 3;
  } else if (lateR.fAns >= 3 && recentFricRate >= 0.48 && recentFricRate > latePosRate * 0.75) {
   status = 'strained';
   stageIndex = 1;
  } else if (posDeltaPp >= 8 || (actDeltaPp >= 15 && latePosRate >= 0.6) || (latePosRate >= 0.78 && lateActRate >= 0.65 && posDeltaPp >= 0)) {
   status = 'improving';
   stageIndex = 4;
  } else if (Math.abs(posDeltaPp) <= 5 && Math.abs(actDeltaPp) <= 10 && (latePosRate < 0.62 || lateActRate < 0.55)) {
   status = 'plateau';
   stageIndex = 2;
  }

  const rawMomentum = lateActRate * 45 + latePosRate * 45 + Math.max(0, 1 - recentFricRate) * 10 + (status === 'improving' ? 8 : status === 'paused' ? -25 : 0);
  const momentumScore = allActiveDates.length === 0 ? 0 : Math.max(8, Math.min(100, Math.round(rawMomentum)));

  const strip14 = [];
  for (let i = 13; i >= 0; i--) {
   const d = shiftIso(activeDate, -i);
   const r = records[d];
   if (!r || !isRecordActiveForAxis(r, axisFilter)) {
    strip14.push({ date: d, state: 'empty', pYes: 0, fYes: 0, sc: 0 });
    continue;
   }
   let pYes = 0; let fYes = 0;
   for (const q of scopeQuestions) {
    if (r.reflections?.[q.key]?.answer === true) {
     if (q.polarity === 'positive') pYes++; else fYes++;
    }
   }
   const sc = scoreRecord(r, axisFilter);
   let st = 'textOnly';
   if (pYes > 0 && fYes === 0) st = 'positive';
   else if (pYes > 0 && fYes > 0) st = pYes >= fYes ? 'positive' : 'mixed';
   else if (fYes > 0) st = 'friction';
   strip14.push({ date: d, state: st, pYes, fYes, sc });
  }

  return {
   status,
   stageIndex,
   momentumScore,
   windowDays,
   activeDays,
   daysSinceLast,
   returnGap,
   earlyPosPct: Math.round(earlyPosRate * 100),
   latePosPct: Math.round(latePosRate * 100),
   posDeltaPp,
   earlyActPct: Math.round(earlyActRate * 100),
   lateActPct: Math.round(lateActRate * 100),
   actDeltaPp,
   fricPct: Math.round(recentFricRate * 100),
   strip14
  };
 };

 const renderHeroVerdictHtml = v => {
  const statusMap = {
   improving: {
    color: '#4CAF50',
    badgeKo: '뚜렷한 전진 · IMPROVING',
    badgeEn: 'IMPROVING · FORWARD MOMENTUM',
    headKo: `이전보다 긍정 루틴이 ${Math.max(1, Math.abs(v.posDeltaPp || v.actDeltaPp))}%p 늘며 전보다 뚜렷하게 나아지고 있어요`,
    headEn: `Positive routines grew by +${Math.max(1, Math.abs(v.posDeltaPp || v.actDeltaPp))}%p, clearly improving over before`,
    subKo: `최근 ${v.windowDays}일 중 ${v.activeDays}일 기록 · 후반 긍정 루틴 실천율 ${v.latePosPct}%로 리듬이 한결 탄탄해졌어요.`,
    subEn: `Logged ${v.activeDays} of ${v.windowDays} days · recent positive routine rate reached ${v.latePosPct}%.`
   },
   returning: {
    color: '#4CAF50',
    badgeKo: '공백 후 복귀 · BACK IN RHYTHM',
    badgeEn: 'BACK IN RHYTHM · RESUMED',
    headKo: `${v.returnGap}일 동안 멈춰 있던 기록을 깨고 다시 리듬을 되찾았어요`,
    headEn: `You broke a ${v.returnGap}-day pause and found your rhythm again`,
    subKo: '쉬었다가 돌아오는 힘이 진짜 꾸준함이에요. 오늘 남긴 루틴부터 다시 이어가요.',
    subEn: 'Coming back after a break is real consistency. Keep going from today.'
   },
   steady: {
    color: '#3B82F6',
    badgeKo: '꾸준한 유지 · STEADY RHYTHM',
    badgeEn: 'STEADY RHYTHM · CONSISTENT',
    headKo: `긍정 루틴 실천율 ${v.latePosPct}%로 흔들림 없이 리듬을 유지하고 있어요`,
    headEn: `Holding a steady rhythm with ${v.latePosPct}% positive routines`,
    subKo: `최근 ${v.windowDays}일 중 ${v.activeDays}일을 기록하며 일상 루틴을 안정적으로 이어가고 있어요.`,
    subEn: `Logged ${v.activeDays} of ${v.windowDays} days with balanced daily routines.`
   },
   plateau: {
    color: '#F59E0B',
    badgeKo: '정체·숨고르기 · PLATEAU',
    badgeEn: 'PLATEAU · HOLDING FLAT',
    headKo: '최근 기록과 루틴이 비슷하게 머물러 있어요 · 작은 새 시도 하나를 더해볼까요?',
    headEn: 'Your rhythm has stayed flat lately · try adding one small new step',
    subKo: `최근 ${v.windowDays}일 중 ${v.activeDays}일 기록하며 긍정 루틴 ${v.latePosPct}% 수준에 머물러 있어요.`,
    subEn: `Logged ${v.activeDays} of ${v.windowDays} days while holding ${v.latePosPct}% positive routines.`
   },
   strained: {
    color: '#EF4444',
    badgeKo: '마찰·무리 주의 · FRICTION ALERT',
    badgeEn: 'FRICTION ALERT · HIGH STRAIN',
    headKo: `최근 마찰·무리 신호가 ${v.fricPct}%로 늘었어요 · 속도를 조금 늦춰도 괜찮아요`,
    headEn: `Friction signals rose to ${v.fricPct}% lately · it is okay to slow your pace`,
    subKo: '업무·수면·감정·지출 마찰이 자주 켜졌어요. 무리한 목표보다 몸과 마음 회복을 먼저 챙겨보세요.',
    subEn: 'Work, sleep, emotional, or spending strain showed up often. Put recovery first.'
   },
   paused: {
    color: '#9CA3AF',
    badgeKo: '기록 멈춤 · PAUSED',
    badgeEn: 'PAUSED · WAITING FOR YOU',
    headKo: `최근 ${v.daysSinceLast}일째 기록이 멈춰 있어요 · 빈 날은 두고 오늘부터 다시 이어가요`,
    headEn: `Paused for the last ${v.daysSinceLast} days · leave the gap and pick up from today`,
    subKo: `최근 ${v.windowDays}일 중 ${v.activeDays}일 기록했어요. 밀린 날을 채우지 않아도 오늘 루틴 하나면 충분해요.`,
    subEn: `Logged ${v.activeDays} of the last ${v.windowDays} days. No need to backfill missed days.`
   },
   starting: {
    color: '#4CAF50',
    badgeKo: '첫걸음 시작 · JUST STARTING',
    badgeEn: 'JUST STARTING · FIRST STEP',
    headKo: '첫 기록의 자리를 열었어요 · 오늘 루틴 하나부터 가볍게 쌓아봐요',
    headEn: 'You opened your first space · start light with one routine today',
    subKo: '기록이 3일 이상 쌓이면 이전과 지금의 변화를 한눈에 비교해 드려요.',
    subEn: 'Log 3 or more days to unlock before-and-after trajectory comparisons.'
   }
  };

  const st = statusMap[v.status] || statusMap.steady;
  const stages = [
   { ko: '01 멈춤', en: '01 Paused' },
   { ko: '02 마찰 주의', en: '02 Strained' },
   { ko: '03 정체', en: '03 Plateau' },
   { ko: '04 유지·복귀', en: '04 Steady' },
   { ko: '05 전진', en: '05 Improving' }
  ];

  const stageGaugeHtml = stages.map((s, idx) => {
   const active = idx === v.stageIndex;
   return `<div style="flex:1;text-align:center">
    <div style="height:8px;border-radius:999px;background:${active ? st.color : 'var(--mvp-line)'};transition:all .2s"></div>
    <div style="margin-top:5px;font-size:11px;font-weight:${active ? '700' : '400'};color:${active ? st.color : 'var(--mvp-muted)'}">${dual(s.ko, s.en)}</div>
   </div>`;
  }).join('');

  const posDeltaSign = v.posDeltaPp > 0 ? `+${v.posDeltaPp}%p` : `${v.posDeltaPp}%p`;
  const actDeltaSign = v.actDeltaPp > 0 ? `+${v.actDeltaPp}%p` : `${v.actDeltaPp}%p`;

  const cellColor = {
   positive: '#4CAF50',
   mixed: '#F59E0B',
   friction: '#EF4444',
   textOnly: '#3B82F6',
   empty: 'var(--mvp-line)'
  };

  const stripCellsHtml = v.strip14.map(c => {
   const col = cellColor[c.state] || 'var(--mvp-line)';
   const tip = `${c.date}: +${c.pYes} / -${c.fYes} (${c.sc}c)`;
   return `<button type="button" data-jump-date="${c.date}" title="${esc(tip)}" aria-label="${esc(tip)}" style="flex:1;height:22px;border:none;border-radius:3px;background:${col};cursor:pointer;padding:0"></button>`;
  }).join('');

  return `
   <div class="ym-card" style="border:2px solid ${st.color};margin-bottom:0">
    <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px">
     <span class="ym-pill" style="border-color:${st.color};color:${st.color};font-weight:700;font-size:11.5px;min-height:26px">${dual(st.badgeKo, st.badgeEn)}</span>
     <span class="ym-counter" style="font-size:13px">${dual(`현재 리듬 활력도 ${v.momentumScore}점 / 100`, `Rhythm Vitality ${v.momentumScore} / 100`)}</span>
    </div>

    <h3 style="font-family:var(--serif);font-size:clamp(20px,2.3vw,27px);line-height:1.35;margin:0;color:var(--mvp-ink)">${dual(st.headKo, st.headEn)}</h3>
    <p style="margin:6px 0 0;font-size:13.5px;color:var(--mvp-muted)">${dual(st.subKo, st.subEn)}</p>

    <div style="display:flex;gap:6px;margin-top:16px;padding-top:14px;border-top:1px solid var(--mvp-line)">
     ${stageGaugeHtml}
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:16px;padding-top:14px;border-top:1px solid var(--mvp-line)">
     <div>
      <div class="ym-bar-meta">
       <span><strong>${dual('긍정 루틴 실천율 (이전 → 최근)', 'Positive Routine Rate (Before → Now)')}</strong></span>
       <span class="ym-counter" style="color:${st.color}">${dual(`이전 ${v.earlyPosPct}% → 최근 ${v.latePosPct}% (${posDeltaSign})`, `Before ${v.earlyPosPct}% → Now ${v.latePosPct}% (${posDeltaSign})`)}</span>
      </div>
      <div style="display:grid;grid-template-columns:48px 1fr;gap:8px;align-items:center;margin-top:6px">
       <span class="micro">${dual('최근', 'Now')}</span>
       <div class="ym-bar-track"><div class="ym-bar-fill" style="width:${Math.max(4, v.latePosPct)}%;background:#4CAF50"></div></div>
      </div>
      <div style="display:grid;grid-template-columns:48px 1fr;gap:8px;align-items:center;margin-top:4px">
       <span class="micro">${dual('이전', 'Before')}</span>
       <div class="ym-bar-track"><div class="ym-bar-fill" style="width:${Math.max(4, v.earlyPosPct)}%;background:var(--mvp-muted);opacity:0.45"></div></div>
      </div>
     </div>

     <div>
      <div class="ym-bar-meta">
       <span><strong>${dual('기록 참여 밀도 (이전 → 최근)', 'Recording Density (Before → Now)')}</strong></span>
       <span class="ym-counter">${dual(`이전 ${v.earlyActPct}% → 최근 ${v.lateActPct}% (${actDeltaSign})`, `Before ${v.earlyActPct}% → Now ${v.lateActPct}% (${actDeltaSign})`)}</span>
      </div>
      <div style="display:grid;grid-template-columns:48px 1fr;gap:8px;align-items:center;margin-top:6px">
       <span class="micro">${dual('최근', 'Now')}</span>
       <div class="ym-bar-track"><div class="ym-bar-fill" style="width:${Math.max(4, v.lateActPct)}%;background:#3B82F6"></div></div>
      </div>
      <div style="display:grid;grid-template-columns:48px 1fr;gap:8px;align-items:center;margin-top:4px">
       <span class="micro">${dual('이전', 'Before')}</span>
       <div class="ym-bar-track"><div class="ym-bar-fill" style="width:${Math.max(4, v.earlyActPct)}%;background:var(--mvp-muted);opacity:0.45"></div></div>
      </div>
     </div>
    </div>

    <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--mvp-line)">
     <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
      <span class="micro">${dual('최근 14일 일별 리듬 흐름 (오래된 날 → 오늘 · 칸을 눌러 해당 날짜 열기)', 'LAST 14 DAYS DAILY RHYTHM STRIP (OLDEST → TODAY · CLICK TO OPEN DAY)')}</span>
      <span style="display:inline-flex;flex-wrap:wrap;gap:10px;font-size:11px;color:var(--mvp-muted)">
       <span><span class="ym-dot" style="background:#4CAF50;display:inline-block;margin-right:4px"></span>${dual('긍정 우세', 'Positive')}</span>
       <span><span class="ym-dot" style="background:#EF4444;display:inline-block;margin-right:4px"></span>${dual('마찰 우세', 'Friction')}</span>
       <span><span class="ym-dot" style="background:#3B82F6;display:inline-block;margin-right:4px"></span>${dual('한 줄 기록', 'Text Only')}</span>
       <span><span class="ym-dot" style="background:var(--mvp-line);display:inline-block;margin-right:4px"></span>${dual('멈춤', 'Paused')}</span>
      </span>
     </div>
     <div style="display:flex;gap:4px">${stripCellsHtml}</div>
    </div>

    <div style="margin-top:14px;padding:12px 14px;border:1px solid var(--mvp-line);border-left:3px solid ${v.status === 'strained' ? '#EC4899' : v.status === 'steady' || v.status === 'starting' ? '#10B981' : '#3B82F6'};background:var(--mvp-surface)">
     <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px;margin-bottom:4px">
      <span class="micro" style="font-weight:700;color:${v.status === 'strained' ? '#EC4899' : v.status === 'steady' || v.status === 'starting' ? '#10B981' : '#3B82F6'}">
       ${v.status === 'strained'
        ? dual('DUKKHA · 고(苦) · 마찰의 수용', 'DUKKHA · Friction · Gentle Acceptance')
        : v.status === 'steady' || v.status === 'starting'
         ? dual('ANATTA · 무아(無我) · 비집착과 자유', 'ANATTA · Non-Attachment · Open Self')
         : dual('ANICCA · 무상(無常) · 흐르는 변화', 'ANICCA · Impermanence · Flowing Change')}
      </span>
      <span class="micro">${dual('정서안정 · 삼법인(三法印) 명언', 'Emotional Grounding · Tilakkhana')}</span>
     </div>
     <div style="font-size:13px;line-height:1.6;color:var(--mvp-ink)">
      ${v.status === 'strained'
       ? dual('마음이 흔들리고 계획이 어긋나는 날이 있는 건 삶이 고장 나서가 아니라 살아 움직이고 있기 때문이에요.', 'Days when your mind wavers or plans slip do not mean life is broken. They simply mean you are alive and moving.')
       : v.status === 'steady' || v.status === 'starting'
        ? dual('어제의 실수나 빈칸이 곧 나 자신은 아니에요. 지나간 기록이라는 옷을 가볍게 내려놓을 때 오늘의 나는 언제든 새로워져요.', "Yesterday's mistake or blank space is not who you are. When you set down the weight of past records, today's self is free to begin anew.")
        : dual('어제의 무거움도 오늘의 막막함도 영원히 머물지 않아요. 모든 순간은 흐르고 있기에 오늘의 작은 한 줄이 새로운 물길을 내요.', "Neither yesterday's weight nor today's fog stays forever. Because every moment flows, one small line today opens a new current.")}
     </div>
    </div>
   </div>
  `;
 };

 const renderDashboard = () => {
  if (!kpiRowEl) return;
  const daysCount = getPeriodDaysCount(activePeriod);
  const startIso = shiftIso(activeDate, -(daysCount - 1));
  const datesInRange = [];
  for (let i = daysCount - 1; i >= 0; i--) {
   datesInRange.push(shiftIso(activeDate, -i));
  }

  if (dashboardHeroEl) {
   const heroWindow = daysCount === 2 ? 14 : daysCount;
   dashboardHeroEl.innerHTML = renderHeroVerdictHtml(computeHeroVerdict(heroWindow, activeAxis));
   for (const jumpEl of dashboardHeroEl.querySelectorAll('[data-jump-date]')) {
    jumpEl.addEventListener('click', () => {
     const targetDate = jumpEl.getAttribute('data-jump-date');
     if (targetDate) {
      loadDateIntoEditor(targetDate);
      setTab('record');
      showToast(`${targetDate} 기록을 불러왔어요.`, `Loaded ${targetDate} in Record editor.`);
     }
    });
   }
  }

  const recsInRange = datesInRange.map(d => records[d]).filter(r => r && hasRecordContent(r));
  const recordedDays = recsInRange.length;
  const completionPct = Math.round((recordedDays / daysCount) * 100);
  const streaks = computeStreaks(activeDate);

  const totalScore = datesInRange.reduce((acc, d) => acc + scoreRecord(records[d], activeAxis), 0);
  const avgScore = Math.round((totalScore / daysCount) * 10) / 10;

  const axisTotals = AXES.map(a => ({
   ...a,
   score: datesInRange.reduce((acc, d) => acc + scoreAxis(records[d], a.key), 0),
   days: datesInRange.filter(d => scoreAxis(records[d], a.key) > 0).length
  })).sort((a, b) => b.score - a.score);

  const topAxis = axisTotals[0];
  const weakAxis = axisTotals[axisTotals.length - 1];

  kpiRowEl.innerHTML = `
   <div class="ym-kpi">
    <div class="ym-kpi-label">${dual('기간 기록 일수 · 달성률', 'RECORDED DAYS · RATE')}</div>
    <div class="ym-kpi-val">${recordedDays}<span style="font-size:18px;color:var(--mvp-muted)"> / ${daysCount}d</span></div>
    <div class="ym-kpi-delta">${dual(`기간 완료율 ${completionPct}%`, `${completionPct}% period completion`)}</div>
   </div>
   <div class="ym-kpi">
    <div class="ym-kpi-label">${dual('현재 연속 · 최장 연속', 'CURRENT · LONGEST STREAK')}</div>
    <div class="ym-kpi-val">${streaks.current}<span style="font-size:18px;color:var(--mvp-muted)">d</span></div>
    <div class="ym-kpi-delta">${dual(`최장 연속 ${streaks.longest}일 기록`, `Longest streak: ${streaks.longest} days`)}</div>
   </div>
   <div class="ym-kpi">
    <div class="ym-kpi-label">${dual('기간 총점 · 일평균 글자 수', 'PERIOD SCORE · DAILY AVG')}</div>
    <div class="ym-kpi-val">${totalScore.toLocaleString()}</div>
    <div class="ym-kpi-delta">${dual(`하루 평균 ${avgScore}자 기록`, `Daily average: ${avgScore} chars/day`)}</div>
   </div>
   <div class="ym-kpi">
    <div class="ym-kpi-label">${dual('가장 활발한 축 · 보완할 축', 'STRONGEST · FOCUS AXIS')}</div>
    <div class="ym-kpi-val" style="font-size:24px">${topAxis.score > 0 ? dual(topAxis.ko, topAxis.en) : '-'}</div>
    <div class="ym-kpi-delta">${topAxis.score > 0 ? dual(`보완 추천: ${weakAxis.ko} (${weakAxis.days}일)`, `Needs focus: ${weakAxis.en} (${weakAxis.days}d)`) : dual('기록을 시작해 보세요', 'Add records to compare')}</div>
   </div>
  `;

  if (refPeriodSubEl) {
   refPeriodSubEl.innerHTML = `${esc(startIso)} → ${esc(activeDate)} (${daysCount}d)`;
  }

  // Render 4-Axis Daily Routine Equilibrium Trend (filtered by activeAxis)
  if (refTrendBodyEl) {
   const visibleAxes = activeAxis === 'all' ? AXES : AXES.filter(a => a.key === activeAxis);
   const visibleQuestions = activeAxis === 'all'
    ? QUESTIONS
    : QUESTIONS.filter(q => q.axis === activeAxis);

   // Compute early vs late half positive rate delta & co-occurrence with written lines
   const midIdx = Math.max(1, Math.floor(datesInRange.length / 2));
   const earlyDates = datesInRange.slice(0, midIdx);
   const lateDates = datesInRange.slice(midIdx);

   const calcPosRate = dateList => {
    let pYes = 0;
    let pAns = 0;
    for (const d of dateList) {
     const r = records[d];
     if (!r) continue;
     for (const q of visibleQuestions) {
      if (q.polarity !== 'positive') continue;
      const ans = r.reflections?.[q.key]?.answer;
      if (ans === true) { pYes++; pAns++; }
      else if (ans === false) { pAns++; }
     }
    }
    return pAns > 0 ? pYes / pAns : 0;
   };

   const deltaPp = Math.round((calcPosRate(lateDates) - calcPosRate(earlyDates)) * 100);
   const deltaSign = deltaPp > 0 ? `+${deltaPp}%p` : `${deltaPp}%p`;

   let routineAndTextDays = 0;
   let posDayScoreSum = 0;
   let posDayCount = 0;
   for (const d of datesInRange) {
    const r = records[d];
    if (!r) continue;
    const sc = scoreRecord(r, activeAxis);
    const hasRef = visibleQuestions.some(q => r.reflections?.[q.key]?.answer !== null && r.reflections?.[q.key]?.answer !== undefined);
    if (sc > 0 && hasRef) routineAndTextDays++;
    const hasPosYes = visibleQuestions.some(q => q.polarity === 'positive' && r.reflections?.[q.key]?.answer === true);
    if (hasPosYes) {
     posDayScoreSum += sc;
     posDayCount++;
    }
   }
   const avgPosDayScore = posDayCount > 0 ? Math.round(posDayScoreSum / posDayCount) : 0;

   const axisSummaryHtml = visibleAxes.map(a => {
    const aQs = QUESTIONS.filter(q => q.axis === a.key);
    let pYes = 0; let pAns = 0; let fYes = 0; let fAns = 0;
    for (const d of datesInRange) {
     const r = records[d];
     if (!r) continue;
     for (const q of aQs) {
      const ans = r.reflections?.[q.key]?.answer;
      if (ans === true) {
       if (q.polarity === 'positive') { pYes++; pAns++; } else { fYes++; fAns++; }
      } else if (ans === false) {
       if (q.polarity === 'positive') pAns++; else fAns++;
      }
     }
    }
    const pRate = pAns > 0 ? Math.round((pYes / pAns) * 100) : 0;
    const fRate = fAns > 0 ? Math.round((fYes / fAns) * 100) : 0;
    return `<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:3px 0">
     <span><span class="ym-dot" style="background:${a.color};display:inline-block;margin-right:6px"></span><strong>${dual(a.ko, a.en)}</strong></span>
     <span class="ym-counter">${dual(`긍정 ${pYes}회(${pRate}%) · 마찰 ${fYes}회(${fRate}%)`, `Pos ${pYes}(${pRate}%) · Fric ${fYes}(${fRate}%)`)}</span>
    </div>`;
   }).join('');

   const summaryBoxHtml = `
    <div style="padding:12px;margin-bottom:10px;border:1px solid var(--mvp-line);background:var(--mvp-surface)">
     ${axisSummaryHtml}
     <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--mvp-line);display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;font-size:11px;color:var(--mvp-muted)">
      <span>${dual(`긍정 루틴 추세(후반-전반): ${deltaSign}`, `Positive routine trend (late vs early): ${deltaSign}`)}</span>
      <span>${dual(`루틴+한 줄 동반 ${routineAndTextDays}일 · 긍정 실천일 평균 ${avgPosDayScore}자`, `Routine + line ${routineAndTextDays}d · Pos days avg ${avgPosDayScore} chars`)}</span>
     </div>
    </div>
   `;

   const rowsHtml = visibleQuestions.map(q => {
    let yesCount = 0;
    let noCount = 0;
    for (const d of datesInRange) {
     const entry = records[d]?.reflections?.[q.key];
     if (!entry) continue;
     if (entry.answer === true) yesCount++;
     else if (entry.answer === false) noCount++;
    }
    const answered = yesCount + noCount;
    const yesPct = answered > 0 ? Math.round((yesCount / answered) * 100) : 0;
    const kindBadge = q.polarity === 'positive'
     ? `<span class="micro" style="color:var(--mvp-accent);margin-right:6px">[${dual('긍정', 'POS')}]</span>`
     : `<span class="micro" style="color:#EF4444;margin-right:6px">[${dual('마찰', 'FRIC')}]</span>`;

    return `
     <div style="padding:10px 0;border-bottom:1px solid var(--mvp-line)">
      <div class="ym-bar-meta">
       <span><span class="ym-dot" style="background:${q.color};display:inline-block;margin-right:6px"></span>${kindBadge}<strong>${dual(q.shortKo, q.shortEn)}</strong></span>
       <span class="ym-counter">${dual(`예 ${yesCount}일 / 응답 ${answered}일 (${yesPct}%)`, `Yes ${yesCount}d / ${answered}d (${yesPct}%)`)}</span>
      </div>
      <div class="ym-bar-track" style="margin-top:6px">
       <div class="ym-bar-fill" style="width:${yesPct}%;background:${q.color}"></div>
      </div>
     </div>
    `;
   }).join('');

   refTrendBodyEl.innerHTML = summaryBoxHtml + rowsHtml;
  }

  if (chartSubEl) {
   const axisLabel = activeAxis === 'all'
    ? dual('전체 4축 합산', 'All 4 Axes Combined')
    : (() => {
       const found = AXES.find(a => a.key === activeAxis);
       return found ? dual(found.ko, found.en) : '';
      })();
   chartSubEl.innerHTML = `${esc(startIso)} → ${esc(activeDate)} · ${axisLabel}`;
  }

  if (!chartContainerEl) return;

  if (activePeriod === 'yesterday') {
   const yIso = shiftIso(activeDate, -1);
   const tRec = records[activeDate];
   const yRec = records[yIso];

   const barsHtml = AXES.map(a => {
    const tVal = scoreAxis(tRec, a.key);
    const yVal = scoreAxis(yRec, a.key);
    const tPct = Math.min(100, Math.round((tVal / 200) * 100));
    const yPct = Math.min(100, Math.round((yVal / 200) * 100));
    const diff = tVal - yVal;
    const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
    return `
     <div style="margin-bottom:16px">
      <div class="ym-bar-meta">
       <span><span class="ym-dot" style="background:${a.color};display:inline-block;margin-right:6px"></span><strong>${dual(a.ko, a.en)}</strong></span>
       <span class="ym-counter">${dual(`어제 ${yVal}자 → 오늘 ${tVal}자 (${diffStr})`, `Yesterday ${yVal} → Today ${tVal} (${diffStr})`)}</span>
      </div>
      <div style="display:grid;grid-template-columns:56px 1fr;gap:8px;align-items:center;margin-top:6px">
       <span class="micro">${dual('오늘', 'Today')}</span>
       <div class="ym-bar-track"><div class="ym-bar-fill" style="width:${tPct}%;background:${a.color}"></div></div>
      </div>
      <div style="display:grid;grid-template-columns:56px 1fr;gap:8px;align-items:center;margin-top:4px">
       <span class="micro">${dual('어제', 'Yest.')}</span>
       <div class="ym-bar-track"><div class="ym-bar-fill" style="width:${yPct}%;background:var(--mvp-muted);opacity:0.45"></div></div>
      </div>
     </div>
    `;
   }).join('');

   chartContainerEl.innerHTML = `<div style="padding-top:6px">${barsHtml}</div>`;
  } else if (activePeriod === 'week') {
   const thisWeekScores = [];
   const prevWeekScores = [];
   const labels = [];
   for (let i = 6; i >= 0; i--) {
    const d1 = shiftIso(activeDate, -i);
    const d0 = shiftIso(activeDate, -(i + 7));
    labels.push(d1.slice(5));
    thisWeekScores.push(scoreRecord(records[d1], activeAxis));
    prevWeekScores.push(scoreRecord(records[d0], activeAxis));
   }
   const maxVal = Math.max(100, ...thisWeekScores, ...prevWeekScores);
   const w = 520;
   const h = 210;
   const padL = 36;
   const padR = 20;
   const padT = 20;
   const padB = 34;
   const plotW = w - padL - padR;
   const plotH = h - padT - padB;

   const pt = (idx, val) => {
    const x = padL + (idx / 6) * plotW;
    const y = padT + plotH - (val / maxVal) * plotH;
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
   };

   const thisPoly = thisWeekScores.map((v, i) => pt(i, v).join(',')).join(' ');
   const prevPoly = prevWeekScores.map((v, i) => pt(i, v).join(',')).join(' ');

   const dotsSvg = thisWeekScores.map((v, i) => {
    const [x, y] = pt(i, v);
    return `<circle cx="${x}" cy="${y}" r="4.5" fill="var(--mvp-accent)" stroke="var(--mvp-card)" stroke-width="1.5"><title>${labels[i]}: ${v}</title></circle>`;
   }).join('');

   const xLabelsSvg = labels.map((lb, i) => {
    const [x] = pt(i, 0);
    return `<text x="${x}" y="${h - 10}" text-anchor="middle" font-size="11" fill="var(--mvp-muted)" font-family="monospace">${lb}</text>`;
   }).join('');

   // Collect recent sentences from this week for Weekly Sentence Reflection
   const weekSentences = [];
   const axesToScan = activeAxis === 'all' ? AXES : AXES.filter(a => a.key === activeAxis);
   for (let i = 0; i < 7; i++) {
    const d = shiftIso(activeDate, -i);
    const r = records[d];
    if (!r) continue;
    for (const a of axesToScan) {
     const txt = (r[a.key] || '').trim();
     if (txt) weekSentences.push({ date: d, axis: a, text: txt });
    }
   }
   const topSentences = weekSentences.slice(0, 3);
   const weeklySentenceHtml = topSentences.length > 0
    ? `<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--mvp-line)">
       <div class="micro" style="margin-bottom:4px">${dual('이번 주 다시 읽을 한 줄 · 다음 주에도 이어가고 싶은 행동은 무엇인가요?', 'A LINE FROM THIS WEEK TO REVISIT · WHICH ACTION DO YOU WANT TO KEEP GOING NEXT WEEK?')}</div>
       ${topSentences.map(item => `<div style="padding:7px 10px;margin-top:6px;border:1px solid var(--mvp-line);background:var(--mvp-surface);font-size:12.5px">
        <span class="ym-dot" style="background:${item.axis.color};display:inline-block;margin-right:6px"></span><strong>${dual(item.axis.ko, item.axis.en)}</strong> <span class="ym-counter">(${esc(item.date.slice(5))})</span> · ${esc(item.text)}
       </div>`).join('')}
      </div>`
    : '';

   chartContainerEl.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;overflow:visible" role="img" aria-label="7-day trend chart">
     <line x1="${padL}" y1="${padT}" x2="${w - padR}" y2="${padT}" stroke="var(--mvp-line)" stroke-dasharray="3 3"/>
     <line x1="${padL}" y1="${padT + plotH / 2}" x2="${w - padR}" y2="${padT + plotH / 2}" stroke="var(--mvp-line)" stroke-dasharray="3 3"/>
     <line x1="${padL}" y1="${padT + plotH}" x2="${w - padR}" y2="${padT + plotH}" stroke="var(--mvp-line)"/>
     <text x="${padL - 6}" y="${padT + 4}" text-anchor="end" font-size="10" fill="var(--mvp-muted)">${maxVal}</text>
     <text x="${padL - 6}" y="${padT + plotH}" text-anchor="end" font-size="10" fill="var(--mvp-muted)">0</text>
     <polyline fill="none" stroke="var(--mvp-muted)" stroke-width="1.75" stroke-dasharray="4 4" opacity="0.55" points="${prevPoly}"/>
     <polyline fill="none" stroke="var(--mvp-accent)" stroke-width="2.5" points="${thisPoly}"/>
     ${dotsSvg}
     ${xLabelsSvg}
    </svg>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:12px;color:var(--mvp-muted)">
     <span><span style="display:inline-block;width:12px;height:2.5px;background:var(--mvp-accent);vertical-align:middle;margin-right:6px"></span>${dual('최근 7일', 'Current 7 Days')}</span>
     <span><span style="display:inline-block;width:12px;height:2px;background:var(--mvp-muted);vertical-align:middle;margin-right:6px"></span>${dual('직전 7일 (점선)', 'Previous 7 Days (Dashed)')}</span>
    </div>
    ${weeklySentenceHtml}
   `;
  } else if (activePeriod === 'month') {
   const scores30 = datesInRange.map(d => ({ date: d, score: scoreRecord(records[d], activeAxis) }));
   const max30 = Math.max(100, ...scores30.map(s => s.score));
   const w = 540;
   const h = 210;
   const padL = 32;
   const padR = 12;
   const padT = 16;
   const padB = 30;
   const plotW = w - padL - padR;
   const plotH = h - padT - padB;
   const barW = Math.max(6, Math.floor(plotW / 30) - 4);

   const barsSvg = scores30.map((item, idx) => {
    const x = padL + (idx / 30) * plotW + 2;
    const bh = item.score > 0 ? Math.max(4, Math.round((item.score / max30) * plotH)) : 2;
    const y = padT + plotH - bh;
    const fill = item.score > 0 ? 'var(--mvp-accent)' : 'var(--mvp-line)';
    return `<rect x="${x.toFixed(1)}" y="${y}" width="${barW}" height="${bh}" fill="${fill}" rx="1.5" data-jump-date="${item.date}" style="cursor:pointer"><title>${item.date}: ${item.score}</title></rect>`;
   }).join('');

   chartContainerEl.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto" role="img" aria-label="30-day bar chart">
     <line x1="${padL}" y1="${padT}" x2="${w - padR}" y2="${padT}" stroke="var(--mvp-line)" stroke-dasharray="3 3"/>
     <line x1="${padL}" y1="${padT + plotH}" x2="${w - padR}" y2="${padT + plotH}" stroke="var(--mvp-line)"/>
     <text x="${padL - 6}" y="${padT + 4}" text-anchor="end" font-size="10" fill="var(--mvp-muted)">${max30}</text>
     <text x="${padL - 6}" y="${padT + plotH}" text-anchor="end" font-size="10" fill="var(--mvp-muted)">0</text>
     ${barsSvg}
     <text x="${padL}" y="${h - 8}" font-size="10" fill="var(--mvp-muted)" font-family="monospace">${datesInRange[0].slice(5)}</text>
     <text x="${w - padR}" y="${h - 8}" text-anchor="end" font-size="10" fill="var(--mvp-muted)" font-family="monospace">${activeDate.slice(5)}</text>
    </svg>
    <p style="font-size:12px;color:var(--mvp-muted);margin-top:8px">${dual('막대를 누르면 그날 기록 편집 화면으로 바로 이동해요.', 'Click any bar to jump directly to that day in the Record editor.')}</p>
   `;
  } else {
   const heatDays = 182;
   const cells = [];
   for (let i = heatDays - 1; i >= 0; i--) {
    const d = shiftIso(activeDate, -i);
    const sc = scoreRecord(records[d], activeAxis);
    let lv = 0;
    if (sc > 0 && sc < 120) lv = 1;
    else if (sc >= 120 && sc < 260) lv = 2;
    else if (sc >= 260 && sc < 420) lv = 3;
    else if (sc >= 420) lv = 4;
    cells.push(`<button type="button" class="ym-heat-cell" data-lv="${lv}" data-jump-date="${d}" title="${d}: ${sc}" aria-label="${d} score ${sc}" style="cursor:pointer;padding:0"></button>`);
   }
   chartContainerEl.innerHTML = `
    <div>
     <div class="micro" style="margin-bottom:10px">${dual('연간 픽셀 히트맵 (최근 26주 · 칸을 눌러 해당 날짜 열기)', 'YEAR IN PIXELS HEATMAP (LAST 26 WEEKS · CLICK CELL TO OPEN DATE)')}</div>
     <div class="ym-heatmap">${cells.join('')}</div>
     <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-size:12px;color:var(--mvp-muted)">
      <span>${esc(shiftIso(activeDate, -(heatDays - 1)))}</span>
      <span style="display:inline-flex;align-items:center;gap:4px">
       <span>Less</span>
       <span class="ym-heat-cell" data-lv="0" style="width:10px;height:10px;display:inline-block"></span>
       <span class="ym-heat-cell" data-lv="1" style="width:10px;height:10px;display:inline-block"></span>
       <span class="ym-heat-cell" data-lv="2" style="width:10px;height:10px;display:inline-block"></span>
       <span class="ym-heat-cell" data-lv="3" style="width:10px;height:10px;display:inline-block"></span>
       <span class="ym-heat-cell" data-lv="4" style="width:10px;height:10px;display:inline-block"></span>
       <span>More</span>
      </span>
      <span>${esc(activeDate)}</span>
     </div>
    </div>
   `;
  }

  for (const jumpEl of chartContainerEl.querySelectorAll('[data-jump-date]')) {
   jumpEl.addEventListener('click', () => {
    const targetDate = jumpEl.getAttribute('data-jump-date');
    if (targetDate) {
     loadDateIntoEditor(targetDate);
     setTab('record');
     showToast(`${targetDate} 기록을 불러왔어요.`, `Loaded ${targetDate} in Record editor.`);
    }
   });
  }
 };

 // Signals (RSI Proxy + 4-Axis Equilibrium Matrix) Renderer
 const renderSignals = () => {
  if (!signalsContentEl) return;
  const allDates = Object.keys(records).filter(d => hasRecordContent(records[d])).sort();
  const totalDays = allDates.length;

  const gaps = [];
  for (let i = 1; i < allDates.length; i++) {
   const d0 = parseIso(allDates[i - 1]);
   const d1 = parseIso(allDates[i]);
   const diffDays = Math.round((d1 - d0) / 86400000);
   if (diffDays > 1) gaps.push(diffDays - 1);
  }
  const avgReturnDays = gaps.length > 0
   ? Math.round((gaps.reduce((a, b) => a + b, 0) / gaps.length) * 10) / 10
   : (totalDays > 1 ? 0 : null);

  let active14 = 0;
  const uniquePhrases = new Set();
  let totalPhrases = 0;
  for (let i = 0; i < 14; i++) {
   const d = shiftIso(activeDate, -i);
   const r = records[d];
   if (r && hasRecordContent(r)) {
    active14++;
    for (const a of AXES) {
     const txt = (r[a.key] || '').trim();
     if (txt) {
      totalPhrases++;
      uniquePhrases.add(txt.toLowerCase());
     }
    }
   }
  }
  const retentionPct = Math.round((active14 / 14) * 100);
  const noveltyPct = totalPhrases > 0 ? Math.round((uniquePhrases.size / totalPhrases) * 100) : 0;

  const axisCounts30 = AXES.map(a => {
   let cnt = 0;
   for (let i = 0; i < 30; i++) {
    const d = shiftIso(activeDate, -i);
    if (scoreAxis(records[d], a.key) > 0) cnt++;
   }
   return cnt;
  });
  const sumAxisCounts = axisCounts30.reduce((a, b) => a + b, 0);
  let balancePct = 0;
  if (sumAxisCounts > 0) {
   let entropy = 0;
   for (const c of axisCounts30) {
    if (c > 0) {
     const p = c / sumAxisCounts;
     entropy -= p * Math.log2(p);
    }
   }
   balancePct = Math.round((entropy / 2) * 100);
  }

  let thisWeekTotal = 0;
  let lastWeekTotal = 0;
  for (let i = 0; i < 7; i++) {
   thisWeekTotal += scoreRecord(records[shiftIso(activeDate, -i)], 'all');
   lastWeekTotal += scoreRecord(records[shiftIso(activeDate, -(i + 7))], 'all');
  }
  const accelDelta = thisWeekTotal - lastWeekTotal;
  const accelSign = accelDelta >= 0 ? `+${accelDelta}` : `${accelDelta}`;

  // Compute 4-Axis Equilibrium cards & rule-based observations
  const observations = [];
  const eqCardsHtml = AXES.map((a, idx) => {
   const axisQs = QUESTIONS.filter(q => q.axis === a.key);
   let posYesTotal = 0;
   let posAnsTotal = 0;
   let fricYesTotal = 0;
   let fricAnsTotal = 0;

   const rows = axisQs.map(q => {
    let yesDays = 0;
    let ansDays = 0;
    for (const d of allDates) {
     const ans = records[d]?.reflections?.[q.key]?.answer;
     if (ans === true) {
      yesDays++;
      ansDays++;
      if (q.polarity === 'positive') { posYesTotal++; posAnsTotal++; }
      else { fricYesTotal++; fricAnsTotal++; }
     } else if (ans === false) {
      ansDays++;
      if (q.polarity === 'positive') posAnsTotal++;
      else fricAnsTotal++;
     }
    }
    const pct = ansDays ? Math.min(100, Math.round((yesDays / ansDays) * 100)) : 0;
    const tag = q.polarity === 'positive'
     ? `<span class="micro" style="color:var(--mvp-accent);margin-right:4px">[${dual('긍정', 'POS')}]</span>`
     : `<span class="micro" style="color:#EF4444;margin-right:4px">[${dual('마찰', 'FRIC')}]</span>`;
    return `
     <div class="ym-bar-row">
      <div class="ym-bar-meta"><span>${tag}${dual(q.shortKo, q.shortEn)}</span><span class="ym-counter">${yesDays}/${ansDays}d (${pct}%)</span></div>
      <div class="ym-bar-track"><div class="ym-bar-fill" style="width:${pct}%;background:${q.color}"></div></div>
     </div>
    `;
   }).join('');

   const posRate = posAnsTotal > 0 ? Math.round((posYesTotal / posAnsTotal) * 100) : 0;
   const fricRate = fricAnsTotal > 0 ? Math.round((fricYesTotal / fricAnsTotal) * 100) : 0;

   if (posAnsTotal >= 6 && posRate >= 65) {
    observations.push({
     axis: a,
     ko: `${a.ko} 축에서 긍정 루틴을 ${posYesTotal}회(${posRate}%) 꾸준히 실천했어요.`,
     en: `Practiced positive routines in ${a.en} ${posYesTotal} times (${posRate}%).`,
     qKo: '이 루틴이 하루의 다른 축에는 어떤 영향을 주었나요?',
     qEn: 'How did this routine shape the other parts of your day?'
    });
   }
   if (fricAnsTotal >= 5 && fricRate >= 30) {
    observations.push({
     axis: a,
     ko: `${a.ko} 축에서 마찰·무리 신호가 ${fricYesTotal}회(${fricRate}%) 기록됐어요.`,
     en: `Noted friction or strain in ${a.en} ${fricYesTotal} times (${fricRate}%).`,
     qKo: '이 마찰을 줄이려고 내일 바꿀 수 있는 작은 행동은 무엇인가요?',
     qEn: 'What is one small step tomorrow that could ease this friction?'
    });
   }

   return `
    <div class="ym-card">
     <div class="ym-card-header">
      <div>
       <span class="eyebrow">0${idx + 1} / ${a.eqEn.toUpperCase()}</span>
       <h3 class="ym-card-title"><span class="ym-dot" style="background:${a.color};display:inline-block;margin-right:8px"></span>${dual(a.eqKo, a.eqEn)}</h3>
       <p class="ym-card-sub">${dual(`긍정 실천 ${posYesTotal}회(${posRate}%) · 마찰 신호 ${fricYesTotal}회(${fricRate}%)`, `Positive ${posYesTotal} (${posRate}%) · Friction ${fricYesTotal} (${fricRate}%)`)}</p>
      </div>
      <span class="ym-counter">${dual(`30일 한 줄 ${axisCounts30[idx]}일`, `30d text: ${axisCounts30[idx]}d`)}</span>
     </div>
     <div style="margin-bottom:12px;padding:8px 10px;border:1px solid var(--mvp-line);background:var(--mvp-surface)">
      <div style="display:grid;grid-template-columns:56px 1fr 42px;gap:8px;align-items:center">
       <span class="micro" style="color:var(--mvp-accent)">${dual('긍정', 'Pos')}</span>
       <div class="ym-bar-track"><div class="ym-bar-fill" style="width:${Math.max(4, posRate)}%;background:${a.color}"></div></div>
       <span class="ym-counter" style="text-align:right">${posRate}%</span>
      </div>
      <div style="display:grid;grid-template-columns:56px 1fr 42px;gap:8px;align-items:center;margin-top:6px">
       <span class="micro" style="color:#EF4444">${dual('마찰', 'Fric')}</span>
       <div class="ym-bar-track"><div class="ym-bar-fill" style="width:${Math.max(4, fricRate)}%;background:#EF4444"></div></div>
       <span class="ym-counter" style="text-align:right">${fricRate}%</span>
      </div>
     </div>
     ${rows}
    </div>
   `;
  }).join('');

  const obsCardHtml = observations.length > 0
   ? `<div class="ym-card" style="margin-top:20px">
      <div class="ym-card-header">
       <div>
        <span class="eyebrow">RULE-BASED OBSERVATIONS &amp; QUESTIONS</span>
        <h3 class="ym-card-title">${dual('규칙 기반 관찰과 되돌아볼 질문', 'Rule-Based Observations & Reflective Questions')}</h3>
        <p class="ym-card-sub">${dual('쌓인 루틴과 기록에서 읽은 관찰이에요. 질문에 답하면 그 문장이 다음 기록이 돼요.', 'Patterns read from your routines and records. Your answer becomes the next record.')}</p>
       </div>
      </div>
      ${observations.map(o => `<div style="padding:10px 0;border-top:1px solid var(--mvp-line)">
       <div style="font-size:13.5px"><span class="ym-dot" style="background:${o.axis.color};display:inline-block;margin-right:6px"></span><strong>${dual(o.ko, o.en)}</strong></div>
       <div style="margin-top:4px;font-size:12.5px;color:var(--mvp-accent)">${dual(`질문 · ${o.qKo}`, `Question · ${o.qEn}`)}</div>
      </div>`).join('')}
     </div>`
   : '';

  const signalsHeroHtml = renderHeroVerdictHtml(computeHeroVerdict(30, 'all'));

  signalsContentEl.innerHTML = `
   ${signalsHeroHtml}
   <div class="ym-card" style="margin-bottom:20px">
    <div class="ym-card-header">
     <div>
      <span class="eyebrow">03 / PERSONAL CHANGE SIGNALS (RSI PROXY)</span>
      <h3 class="ym-card-title">${dual('기록 습관과 네 축의 일일 루틴 균형 신호', 'Structural Change Signals & 4-Axis Equilibrium')}</h3>
      <p class="ym-card-sub">${dual('단순한 연속 기록 강박 대신, 쉬었다가도 다시 돌아오는 복귀 탄력성과 네 축의 실천·마찰 균형을 함께 살펴봐요.', 'Measures return resilience after breaks and the balance between positive routines and friction across all four axes.')}</p>
     </div>
     <span class="ym-counter">${dual(`누적 기록 ${totalDays}일`, `${totalDays} Total Days`)}</span>
    </div>

    <div class="ym-kpi-grid" style="margin-bottom:0">
     <div class="ym-kpi">
      <div class="ym-kpi-label">${dual('01 · 평균 복귀 탄력성', '01 · RETURN RESILIENCE')}</div>
      <div class="ym-kpi-val">${avgReturnDays === null ? '-' : `${avgReturnDays}d`}</div>
      <div class="ym-kpi-delta">${avgReturnDays === 0 ? dual('공백 없이 꾸준히 이어가는 중', 'Zero gap days between records') : dual(`공백 뒤 평균 ${avgReturnDays ?? '-'}일 만에 복귀`, `Avg ${avgReturnDays ?? '-'} days to return after a pause`)}</div>
     </div>
     <div class="ym-kpi">
      <div class="ym-kpi-label">${dual('02 · 최근 14일 유지율 · 참신성', '02 · 14D RETENTION · NOVELTY')}</div>
      <div class="ym-kpi-val">${retentionPct}%</div>
      <div class="ym-kpi-delta">${dual(`문장 다양성(Novelty) ${noveltyPct}%`, `Sentence novelty rate: ${noveltyPct}%`)}</div>
     </div>
     <div class="ym-kpi">
      <div class="ym-kpi-label">${dual('03 · 4축 균형 지수 (30일)', '03 · 4-AXIS BALANCE INDEX')}</div>
      <div class="ym-kpi-val">${balancePct}<span style="font-size:18px;color:var(--mvp-muted)">/100</span></div>
      <div class="ym-kpi-delta">${dual('커리어·신체·정서·자산 분포 엔트로피', 'Shannon balance across all 4 axes')}</div>
     </div>
     <div class="ym-kpi">
      <div class="ym-kpi-label">${dual('04 · 주간 기록 가속도', '04 · WEEKLY ACCELERATION')}</div>
      <div class="ym-kpi-val">${accelSign}</div>
      <div class="ym-kpi-delta">${dual(`이번 주 ${thisWeekTotal}자 vs 지난주 ${lastWeekTotal}자`, `This week ${thisWeekTotal} vs last week ${lastWeekTotal} chars`)}</div>
     </div>
    </div>
   </div>

   <div class="ym-grid-2">
    ${eqCardsHtml}
   </div>
   ${obsCardHtml}
  `;

  for (const jumpEl of signalsContentEl.querySelectorAll('[data-jump-date]')) {
   jumpEl.addEventListener('click', () => {
    const targetDate = jumpEl.getAttribute('data-jump-date');
    if (targetDate) {
     loadDateIntoEditor(targetDate);
     setTab('record');
     showToast(`${targetDate} 기록을 불러왔어요.`, `Loaded ${targetDate} in Record editor.`);
    }
   });
  }
 };

 // History & Export / Backup Renderer
 const renderHistory = () => {
  if (!historyListEl) return;
  const query = (historySearchEl?.value || '').trim().toLowerCase();
  const sortedDates = Object.keys(records)
   .filter(d => hasRecordContent(records[d]))
   .sort()
   .reverse();

  const filtered = sortedDates.filter(d => {
   if (!query) return true;
   const r = records[d];
   const notesHay = QUESTIONS.map(q => r.reflections?.[q.key]?.note || '').join(' ');
   const hay = [
    r.date,
    r.career,
    r.physical,
    r.emotional,
    r.financial,
    notesHay
   ].join(' ').toLowerCase();
   return hay.includes(query);
  });

  if (historyCountEl) historyCountEl.textContent = `${filtered.length}`;

  if (filtered.length === 0) {
   historyListEl.innerHTML = `<div class="ym-empty">${dual('조건에 맞는 기록이 없어요.', 'No records match your search query.')}</div>`;
   return;
  }

  historyListEl.innerHTML = filtered.slice(0, 60).map(d => {
   const r = records[d];
   const sc = scoreRecord(r, 'all');
   const qPills = QUESTIONS.map(q => {
    const ans = r.reflections?.[q.key]?.answer;
    if (ans === null || ans === undefined) return '';
    return `<span class="ym-pill ${ans ? 'is-yes' : 'is-no'}" style="min-height:22px;padding:1px 8px;font-size:11px">${dual(q.shortKo, q.shortEn)}: ${ans ? dual('예', 'Y') : dual('아니오', 'N')}</span>`;
   }).filter(Boolean).join(' ');

   const lines = AXES.map(a => {
    if (!r[a.key]) return '';
    return `<div style="font-size:13px;margin-top:4px"><span class="ym-dot" style="background:${a.color};display:inline-block;margin-right:6px"></span><strong>${dual(a.ko, a.en)}:</strong> ${esc(r[a.key])}</div>`;
   }).join('');

   return `
    <div class="ym-history-item" data-open-date="${esc(d)}">
     <div class="ym-history-head">
      <strong>${esc(d)}</strong>
      <div style="display:flex;align-items:center;gap:8px">
       <span class="ym-counter">${sc} chars</span>
       <button type="button" class="ym-btn" data-delete-date="${esc(d)}" style="min-height:26px;padding:2px 8px;font-size:11px">${dual('삭제', 'Delete')}</button>
      </div>
     </div>
     ${qPills ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">${qPills}</div>` : ''}
     ${lines}
    </div>
   `;
  }).join('');

  for (const item of historyListEl.querySelectorAll('[data-open-date]')) {
   item.addEventListener('click', e => {
    const delBtn = e.target.closest('[data-delete-date]');
    if (delBtn) {
     e.stopPropagation();
     const delDate = delBtn.getAttribute('data-delete-date');
     if (delDate && records[delDate]) {
      delete records[delDate];
      saveRecords(records);
      if (delDate === activeDate) loadDateIntoEditor(activeDate);
      renderAllPanels();
      showToast(`${delDate} 기록을 삭제했어요.`, `Deleted record for ${delDate}.`);
     }
     return;
    }
    const openDate = item.getAttribute('data-open-date');
    if (openDate) {
     loadDateIntoEditor(openDate);
     setTab('record');
     showToast(`${openDate} 기록을 편집 화면으로 불러왔어요.`, `Opened ${openDate} for editing.`);
    }
   });
  }
 };

 historySearchEl?.addEventListener('input', () => renderHistory());

 const triggerDownload = (filename, content, mime) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
 };

 const csvCell = v => {
  let s = String(v ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
 };

 btnExportCsv?.addEventListener('click', () => {
  const header = [
   'date',
   'career',
   'physical',
   'emotional',
   'financial',
   'financialCategory',
   ...QUESTIONS.flatMap(q => [q.key, `${q.key}Note`]),
   'updatedAt'
  ];
  const dates = Object.keys(records).filter(d => hasRecordContent(records[d])).sort();
  const rows = [header.join(',')];
  for (const d of dates) {
   const r = records[d];
   const rf = r.reflections || emptyReflections();
   const bStr = v => (v === true ? 'true' : v === false ? 'false' : '');
   rows.push([
    csvCell(r.date),
    csvCell(r.career),
    csvCell(r.physical),
    csvCell(r.emotional),
    csvCell(r.financial),
    csvCell(r.financial ? r.financialCategory : ''),
    ...QUESTIONS.flatMap(q => [
     csvCell(bStr(rf[q.key]?.answer)),
     csvCell(rf[q.key]?.note || '')
    ]),
    csvCell(r.updatedAt)
   ].join(','));
  }
  triggerDownload(`yesterdays-me-${todayIso()}.csv`, `\uFEFF${rows.join('\r\n')}\r\n`, 'text/csv;charset=utf-8');
  showToast('CSV 파일을 내보냈어요.', 'Exported CSV file.');
 });

 btnExportJson?.addEventListener('click', () => {
  const payload = {
   schemaVersion: 2,
   exportedAt: new Date().toISOString(),
   records
  };
  triggerDownload(`yesterdays-me-backup-${todayIso()}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
  showToast('JSON 무손실 백업 파일을 내보냈어요.', 'Exported lossless JSON backup.');
 });

 inputImportJson?.addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
   try {
    const parsed = JSON.parse(String(reader.result || '{}'));
    const incoming = parsed.records && typeof parsed.records === 'object' ? parsed.records : parsed;
    let mergedCount = 0;
    for (const [k, v] of Object.entries(incoming)) {
     if (/^\d{4}-\d{2}-\d{2}$/.test(k)) {
      const norm = normalizeRecord(k, v);
      if (hasRecordContent(norm)) {
       records[k] = norm;
       mergedCount++;
      }
     }
    }
    saveRecords(records);
    loadDateIntoEditor(activeDate);
    renderAllPanels();
    showToast(`백업 파일에서 ${mergedCount}일의 기록을 병합했어요.`, `Merged ${mergedCount} days of records from backup.`);
   } catch {
    showToast('올바른 JSON 백업 파일이 아니에요.', 'Invalid JSON backup file.');
   }
   inputImportJson.value = '';
  };
  reader.readAsText(file);
 });

 btnResetAll?.addEventListener('click', () => {
  activePersonaId = null;
  records = {};
  saveRecords(records);
  try {
   localStorage.removeItem(DRAFT_KEY);
  } catch {
   // ignore
  }
  loadDateIntoEditor(activeDate);
  renderAllPanels();
  showToast('브라우저의 모든 로컬 기록을 비웠어요.', 'Cleared all local browser records.');
 });

 const renderAllPanels = () => {
  renderPersonaSimulatorBar();
  renderRecordSidebars();
  renderDashboard();
  renderSignals();
  renderHistory();
 };

 loadDateIntoEditor(activeDate);
 renderAllPanels();
})();
