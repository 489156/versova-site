/* global document, IntersectionObserver */
(() => {
 const button=document.querySelector('.language');
 const setLanguage=language=>{
  document.documentElement.lang=language;
  if(button){button.textContent=language==='ko'?'EN':'KO';button.setAttribute('aria-label',language==='ko'?'Switch language to English':'한국어로 전환');}
 };
 button?.addEventListener('click',()=>setLanguage(document.documentElement.lang==='ko'?'en':'ko'));
 // Content stays visible without JavaScript. Motion never delays access to information.
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 if(!reduce.matches && 'IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-seen');observer.unobserve(entry.target)}}},{threshold:0.08});
  for(const section of document.querySelectorAll('.section'))observer.observe(section);
 }
})();
