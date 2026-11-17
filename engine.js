/* Moteur de calcul d'Atelier Zéphyr. Tout est en entiers pour éviter les erreurs d'arrondi. */
const BASE={dem:[80,250,500],fix:[450000,800000,1300000],cv:[3100,3100,3100],app:[0,400000,0],t0:500000,
  P:[{v:5400,k:[115,115,115]},{v:6000,k:[100,100,100]},{v:6600,k:[85,85,85]}],
  C:[{v:50000,k:80},{v:100000,k:100},{v:200000,k:125}],
  R:[{v:0,b:0},{v:100000,b:10},{v:200000,b:20}]};
const EVTS=[
  {t:"Retard de certification",d:"L'homologation du drone prend trois mois de plus que prévu. La demande de base de l'année 1 passe de 80 à 72 drones.",f:p=>{p.dem[0]=72;}},
  {t:"Hausse des composants",d:"Le fournisseur de composants relève ses tarifs. Le coût variable de l'année 2 passe de 3 100 € à 3 300 € par drone.",f:p=>{p.cv[1]=3300;}},
  {t:"Arrivée d'un concurrent",d:"Un concurrent lance un drone comparable. En année 3, le prix haut est moins bien accepté : son coefficient passe de 0,85 à 0,75.",f:p=>{p.P[2].k[2]=75;}}];
function params(ev){const p=JSON.parse(JSON.stringify(BASE));if(ev)EVTS.forEach(e=>e.f(p));return p;}
function simul(decs,p){
  p=p||BASE;let t=p.t0,bonus=0;const out=[];
  for(let y=0;y<3;y++){const d=decs[y];if(!d)break;
    const P=p.P[d.p],C=p.C[d.c],R=p.R[d.r],cv=p.cv[y];
    const v=Math.floor((p.dem[y]*P.k[y]*C.k*(100+bonus)+500000)/1000000);
    const ca=v*P.v,cvt=v*cv,mcv=ca-cvt,ch=p.fix[y]+C.v+R.v,res=mcv-ch,deb=t;
    t=t+p.app[y]+res;
    out.push({v,prix:P.v,ca,cvt,mcv,fix:p.fix[y],com:C.v,rd:R.v,ch,res,deb,app:p.app[y],fin:t,bonus,
      seuil:Math.ceil(ch/(P.v-cv)),tmcv:Math.round(mcv*1000/ca)/10,auto:t>0?Math.round(t*120/ch)/10:0});
    bonus+=R.b;}
  return out;}

/* Projet DSCG : budget et écarts de l'exercice 3. */
const DS={bud:{Z1:{q:400,p:6000},Z2:{q:200,p:9000}},reel:{Z1:{q:450,p:5700},Z2:{q:150,p:9300}},
  std:{Z1:{kg:3,kit:2000,h:10},Z2:{kg:5,kit:3200,h:16}},pkg:80,taux:35,fixAt:216000,varAt:20,strB:1750000,strR:1810000,
  r:{kg:2250,pkg:86,kit:{Z1:2080,Z2:3150},h:7150,taux:36,ci:371000}};
function dscg(){const M=["Z1","Z2"],b=DS.bud,r=DS.reel,s=DS.std,o={};
  o.an=M.reduce((a,m)=>a+b[m].q*s[m].h,0);o.uo=(DS.fixAt+DS.varAt*o.an)/o.an;
  o.cs={};o.ms={};M.forEach(m=>{o.cs[m]=s[m].kg*DS.pkg+s[m].kit+s[m].h*DS.taux+s[m].h*o.uo;o.ms[m]=b[m].p-o.cs[m];});
  o.caB=M.reduce((a,m)=>a+b[m].q*b[m].p,0);o.cpB=M.reduce((a,m)=>a+b[m].q*o.cs[m],0);o.resB=o.caB-o.cpB-DS.strB;
  o.caR=M.reduce((a,m)=>a+r[m].q*r[m].p,0);
  o.fibR=DS.r.kg*DS.r.pkg;o.kitR=M.reduce((a,m)=>a+r[m].q*DS.r.kit[m],0);o.modR=DS.r.h*DS.r.taux;
  o.cpR=o.fibR+o.kitR+o.modR+DS.r.ci;o.resR=o.caR-o.cpR-DS.strR;o.eRes=o.resR-o.resB;o.eCA=o.caR-o.caB;
  o.mB=M.reduce((a,m)=>a+b[m].q*o.ms[m],0);o.mR=M.reduce((a,m)=>a+r[m].q*(r[m].p-o.cs[m]),0);o.eM=o.mR-o.mB;
  o.ePrix=M.reduce((a,m)=>a+(r[m].p-b[m].p)*r[m].q,0);
  const qB=b.Z1.q+b.Z2.q,qR=r.Z1.q+r.Z2.q;o.eVol=Math.round((qR-qB)*o.mB/qB);
  o.eComp=M.reduce((a,m)=>a+r[m].q*o.ms[m],0)-Math.round(qR*o.mB/qB);
  o.kgS=M.reduce((a,m)=>a+r[m].q*s[m].kg,0);o.eFib=o.fibR-o.kgS*DS.pkg;o.eFibQ=(DS.r.kg-o.kgS)*DS.pkg;o.eFibP=(DS.r.pkg-DS.pkg)*DS.r.kg;
  o.eKit=o.kitR-M.reduce((a,m)=>a+r[m].q*s[m].kit,0);
  o.hS=M.reduce((a,m)=>a+r[m].q*s[m].h,0);o.eMod=o.modR-o.hS*DS.taux;o.eModT=(DS.r.h-o.hS)*DS.taux;o.eModX=(DS.r.taux-DS.taux)*DS.r.h;
  o.bf=DS.fixAt+DS.varAt*DS.r.h;o.eCI=DS.r.ci-o.hS*o.uo;o.eCIb=DS.r.ci-o.bf;o.eCIa=o.bf-DS.r.h*o.uo;o.eCIr=(DS.r.h-o.hS)*o.uo;
  o.eStr=DS.strR-DS.strB;o.eCout=o.eFib+o.eKit+o.eMod+o.eCI;
  return o;}
if(typeof module!=="undefined")module.exports={BASE,EVTS,params,simul,dscg,DS};
