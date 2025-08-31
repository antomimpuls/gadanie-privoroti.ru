// analytics.js - совместимая версия
(function(){
    const KEY='tap_analytics_data';
    const get=()=>JSON.parse(localStorage.getItem(KEY)||'{"totalViews":0,"dailyViews":{},"whatsappClicks":0,"linkClicks":0}');
    const save=d=>{localStorage.setItem(KEY,JSON.stringify(d));update()};

    function update(){
        const d=get(),t=new Date().toDateString(),td=d.dailyViews[t]||0,c=(d.whatsappClicks/d.totalViews*100).toFixed(1)||'0';
        const badge=document.getElementById('analytics-badge');
        if(location.search.includes('admin=true')||localStorage.getItem('tap_admin')==='true'){
            if(!badge){const b=document.createElement('div');b.id='analytics-badge';b.style='position:fixed;top:10px;right:10px;background:#252526;border:1px solid #3e3e42;padding:8px;font-size:11px;border-radius:2px';document.body.appendChild(b)}
            badge.innerHTML=`👀${d.totalViews} 📅${td} 📱${d.whatsappClicks} 💰${c}%`;
        }
    }

    // Трекинг
    function track(){
        const d=get(),t=new Date().toDateString();
        d.totalViews++;d.dailyViews[t]=(d.dailyViews[t]||0)+1;save(d);
        document.addEventListener('click',e=>{
            const target=e.target.closest('a');
            if(!target)return;
            if(target.href.includes('whatsapp')||target.href.includes('wa.me')){d.whatsappClicks++;save(d)}
            else{d.linkClicks++;save(d)}
        },true);
    }
    
    track();update();
    if(location.search.includes('admin=true'))setInterval(update,1000);
})();
