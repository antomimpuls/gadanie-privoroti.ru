// analytics.js - ultra-light version
const key='tap_analytics_data';
const get=()=>JSON.parse(localStorage.getItem(key)||'{"totalViews":0,"dailyViews":{},"whatsappClicks":0,"linkClicks":0}');
const save=d=>{localStorage.setItem(key,JSON.stringify(d));updateBadge()};

function updateBadge(){
  const d=get(),t=new Date().toDateString(),td=d.dailyViews[t]||0,c=(d.whatsappClicks/d.totalViews*100).toFixed(1);
  if(location.search.includes('admin=true')){
    let b=document.getElementById('analytics-badge');
    if(!b){b=document.createElement('div');b.id='analytics-badge';b.style='position:fixed;top:10px;right:10px;background:#111;color:#0f0;padding:8px;font:11px monospace;z-index:9999';document.body.appendChild(b)}
    b.innerHTML=`👀${d.totalViews} 📅${td} 📱${d.whatsappClicks} 💰${c}%`;
  }
}

// Инициализация
(()=>{
  const d=get(),t=new Date().toDateString();
  d.totalViews++;d.dailyViews[t]=(d.dailyViews[t]||0)+1;save(d);
  
  document.addEventListener('click',e=>{
    const a=e.target.closest('a');
    if(!a)return;
    const data=get();
    if(a.href.includes('whatsapp')||a.href.includes('wa.me')){data.whatsappClicks++}
    else{data.linkClicks++}
    save(data);
  });
  
  updateBadge();
  if(location.search.includes('admin=true'))setInterval(updateBadge,1000);
})();
