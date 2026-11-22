import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getFirestore,collection,onSnapshot,query,where} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
const cfg={apiKey:'AIzaSyBE6tRuluvkrClC3GfR1rV9HbZCYshY5RU',authDomain:'power-radio-ccac6.firebaseapp.com',projectId:'power-radio-ccac6',appId:'1:152541059221:web:eaf366af3ba47a20ac639c'};
const app=getApps().find(x=>x.name==='power-radio-tv')||initializeApp(cfg,'power-radio-tv');
const db=getFirestore(app),stage=document.getElementById('prTvStage'),status=document.getElementById('prTvStatus');
let ads=[],idx=0,timer=null;
const safeUrl=u=>{try{const v=new URL(u);return v.protocol==='https:'?v.href:null}catch{return null}};
function show(){clearTimeout(timer);stage.replaceChildren();if(!ads.length){const msg=document.createElement('div');msg.className='pr-tv-empty';msg.textContent='📺 POWER RADIO TV · Hier erscheinen bald Werbung, Vereine und Events.';stage.append(msg);status.textContent='Derzeit keine Werbespots aktiv';return}
idx%=ads.length;const a=ads[idx],slide=document.createElement('div');slide.className='pr-tv-slide';
const url=safeUrl(a.imageUrl);if(url){const img=document.createElement('img');img.src=url;img.alt=a.title||'Werbemotiv';img.loading='lazy';slide.append(img)}
const overlay=document.createElement('div');overlay.className='pr-tv-overlay';const title=document.createElement('strong');title.textContent=a.title||'POWER RADIO TV';overlay.append(title);if(a.description){const p=document.createElement('p');p.textContent=a.description;overlay.append(p)}slide.append(overlay);stage.append(slide);
status.textContent=(idx+1)+' / '+ads.length+' · '+(a.category||'Werbung');timer=setTimeout(()=>{idx=(idx+1)%ads.length;show()},Math.max(5,Math.min(60,Number(a.seconds)||10))*1000)}
onSnapshot(query(collection(db,'tvAds'),where('active','==',true)),snap=>{const now=Date.now();ads=snap.docs.map(d=>({id:d.id,...d.data()})).filter(a=>safeUrl(a.imageUrl)&&(!a.startDate||a.startDate<=new Date(now).toISOString().slice(0,10))&&(!a.endDate||a.endDate>=new Date(now).toISOString().slice(0,10))).sort((a,b)=>(a.order||0)-(b.order||0));idx=0;show()},()=>{ads=[];show();status.textContent='TV-Werbung derzeit nicht abrufbar'});
