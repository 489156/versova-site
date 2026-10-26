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

    yesterdayPeekEl.innerHTML = `<div>${axisBlocks}</div>`;
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

 const renderDashboard = () => {
  if (!kpiRowEl) return;
  const daysCount = getPeriodDaysCount(activePeriod);
  const startIso = shiftIso(activeDate, -(daysCount - 1));
  const datesInRange = [];
  for (let i = daysCount - 1; i >= 0; i--) {
   datesInRange.push(shiftIso(activeDate, -i));
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
   const visibleQuestions = activeAxis === 'all'
    ? QUESTIONS
    : QUESTIONS.filter(q => q.axis === activeAxis);

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

   refTrendBodyEl.innerHTML = rowsHtml;
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

  // Compute 4-Axis Equilibrium cards
  const eqCardsHtml = AXES.map((a, idx) => {
   const axisQs = QUESTIONS.filter(q => q.axis === a.key);
   const rows = axisQs.map(q => {
    let yesDays = 0;
    for (const d of allDates) {
     if (records[d]?.reflections?.[q.key]?.answer === true) yesDays++;
    }
    const pct = totalDays ? Math.min(100, Math.round((yesDays / totalDays) * 100)) : 0;
    const tag = q.polarity === 'positive'
     ? `<span class="micro" style="color:var(--mvp-accent);margin-right:4px">[${dual('긍정', 'POS')}]</span>`
     : `<span class="micro" style="color:#EF4444;margin-right:4px">[${dual('마찰', 'FRIC')}]</span>`;
    return `
     <div class="ym-bar-row">
      <div class="ym-bar-meta"><span>${tag}${dual(q.shortKo, q.shortEn)}</span><span class="ym-counter">${yesDays}d (${pct}%)</span></div>
      <div class="ym-bar-track"><div class="ym-bar-fill" style="width:${pct}%;background:${q.color}"></div></div>
     </div>
    `;
   }).join('');

   return `
    <div class="ym-card">
     <div class="ym-card-header">
      <div>
       <span class="eyebrow">0${idx + 1} / ${a.eqEn.toUpperCase()}</span>
       <h3 class="ym-card-title"><span class="ym-dot" style="background:${a.color};display:inline-block;margin-right:8px"></span>${dual(a.eqKo, a.eqEn)}</h3>
      </div>
      <span class="ym-counter">${dual(`30일 한 줄 ${axisCounts30[idx]}일`, `30d text: ${axisCounts30[idx]}d`)}</span>
     </div>
     ${rows}
    </div>
   `;
  }).join('');

  signalsContentEl.innerHTML = `
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
  `;
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
  renderRecordSidebars();
  renderDashboard();
  renderSignals();
  renderHistory();
 };

 loadDateIntoEditor(activeDate);
 renderAllPanels();
})();
