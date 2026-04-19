// Generates 100 realistic log entries across the last 24h
window.LG_MOCK = (function(){
  const now = new Date('2026-04-19T14:23:45.312');
  const SOURCES = ['ESP32-F1','ESP32-F2','ESP32-F3','ESP32-F4','CENTRAL','WEB','SUPABASE'];

  // Realistic log templates
  const INFO_TEMPLATES = [
    { src:'ESP32-F1', msg:'Lectura periòdica: humitat=%H%%, temp=%T°C, bateria=%B%%', payload:(r)=>({humidity:r.h,temp:r.t,battery:r.b,rssi:r.rssi,uptime:r.up}) },
    { src:'ESP32-F2', msg:'Lectura periòdica: humitat=%H%%, temp=%T°C, bateria=%B%%', payload:(r)=>({humidity:r.h,temp:r.t,battery:r.b,rssi:r.rssi,uptime:r.up}) },
    { src:'ESP32-F3', msg:'Lectura periòdica: humitat=%H%%, temp=%T°C, bateria=%B%%', payload:(r)=>({humidity:r.h,temp:r.t,battery:r.b,rssi:r.rssi,uptime:r.up}) },
    { src:'ESP32-F4', msg:'Lectura periòdica: humitat=%H%%, temp=%T°C, bateria=%B%%', payload:(r)=>({humidity:r.h,temp:r.t,battery:r.b,rssi:r.rssi,uptime:r.up}) },
    { src:'CENTRAL', msg:'Heartbeat: tots els nodes responen (4/4)', payload:()=>({nodes:{F1:'ok',F2:'ok',F3:'ok',F4:'ok'},latency_ms:[12,18,45,22]}) },
    { src:'CENTRAL', msg:'Reg programat iniciat a F1 (vegetatiu, llindar=55%)', payload:()=>({row:'F1',stage:'vegetatiu',threshold:55,duration_s:3600,mode:'auto'}) },
    { src:'CENTRAL', msg:'Reg completat a F1: 60min, 28L consumits', payload:()=>({row:'F1',duration_s:3600,liters:28.4,start:'13:23:45',end:'14:23:45'}) },
    { src:'SUPABASE', msg:'Batch upload: 24 lectures sincronitzades', payload:()=>({rows:24,table:'sensor_readings',duration_ms:312,status:200}) },
    { src:'WEB', msg:'Usuari "anna" ha obert el dashboard', payload:()=>({user:'anna',page:'dashboard',session_id:'sess_8K2jQ',ip:'192.168.1.42'}) },
    { src:'CENTRAL', msg:'Sincronització automàtica amb Supabase completada', payload:()=>({synced:true,rows:24,duration_ms:312}) },
    { src:'ESP32-F2', msg:'Humitat estable dins rang òptim (52%, rang 50-65%)', payload:(r)=>({humidity:r.h,range:[50,65],status:'ok'}) },
    { src:'CENTRAL', msg:'Configuració aplicada: interval lectura 30min', payload:()=>({setting:'read_interval',value:30,unit:'min',applied_to:['F1','F2','F3','F4']}) },
    { src:'WEB', msg:'Llindar F3 modificat de 55% a 50% per "joan"', payload:()=>({user:'joan',field:'threshold',row:'F3',before:55,after:50}) },
  ];
  const WARN_TEMPLATES = [
    { src:'ESP32-F4', msg:'Bateria baixa: 23% (llindar alerta: 25%)', payload:()=>({battery:23,threshold:25,estimated_days:4,last_charge:'2026-04-12T08:00:00'}) },
    { src:'ESP32-F3', msg:'Latència alta: 245ms (esperat <100ms)', payload:()=>({latency_ms:245,threshold:100,rssi:-78,retries:2}) },
    { src:'ESP32-F2', msg:'Sensor offline durant 3m 42s, reconnectat', payload:()=>({offline_duration_s:222,reason:'wifi_reconnect',reconnect_attempts:3}) },
    { src:'CENTRAL', msg:'RSSI feble a F4: -82 dBm', payload:()=>({node:'F4',rssi:-82,threshold:-75,quality:'weak'}) },
    { src:'SUPABASE', msg:'Rate limit apropant-se: 820/1000 sol·licituds/hora', payload:()=>({used:820,limit:1000,reset_in_s:2340}) },
    { src:'ESP32-F1', msg:'Temperatura elevada: 32°C (normal 18-26°C)', payload:(r)=>({temp:32,range:[18,26],status:'warning'}) },
    { src:'CENTRAL', msg:'Reg interromput: pressió d\'aigua insuficient', payload:()=>({row:'F2',reason:'low_pressure',pressure_bar:0.8,min_required:1.5}) },
  ];
  const ERR_TEMPLATES = [
    { src:'ESP32-F3', msg:'Sensor desconnectat durant 34m 12s', payload:()=>({offline_duration_s:2052,last_seen:'2026-04-19T13:49:33',reconnect_attempts:12,status:'failed'}) },
    { src:'SUPABASE', msg:'Timeout en sincronització: connexió tancada després de 30s', payload:()=>({duration_ms:30012,status:504,retries:3,queued_rows:48}) },
    { src:'CENTRAL', msg:'Vàlvula F3 no respon al senyal d\'obertura', payload:()=>({valve:'F3',command:'open',response:null,retries:3,action:'manual_check_required'}) },
    { src:'ESP32-F4', msg:'Error lectura I2C: sensor SHT31 no respon (addr 0x44)', payload:()=>({sensor:'SHT31',addr:'0x44',error_code:'I2C_NACK',retries:5}) },
    { src:'WEB', msg:'Error 500 en carregar /api/readings: timeout base de dades', payload:()=>({endpoint:'/api/readings',status:500,duration_ms:5012,error:'DB_TIMEOUT'}) },
  ];

  function fmt(t, r){
    return t.replace('%H', r.h).replace('%T', r.t).replace('%B', r.b);
  }
  function pad(n, l=2){ return String(n).padStart(l,'0'); }
  function fmtTs(d){
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(),3)}`;
  }

  function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  const logs = [];
  // Distribute 100 entries across 24h, weighted toward last few hours
  for (let i=0; i<100; i++){
    const roll = Math.random();
    let tpl, level;
    if (roll < 0.70){ tpl = pick(INFO_TEMPLATES); level = 'info'; }
    else if (roll < 0.90){ tpl = pick(WARN_TEMPLATES); level = 'warn'; }
    else { tpl = pick(ERR_TEMPLATES); level = 'err'; }

    // Bias timestamps: 60% last 6h, 30% 6-18h, 10% 18-24h ago
    const rollT = Math.random();
    let minutesAgo;
    if (rollT < 0.60) minutesAgo = rand(0, 360);
    else if (rollT < 0.90) minutesAgo = rand(360, 1080);
    else minutesAgo = rand(1080, 1440);
    const ts = new Date(now.getTime() - minutesAgo*60*1000 - rand(0,59)*1000 - rand(0,999));

    const readings = {
      h: rand(35,72), t: rand(15,32), b: rand(22,98),
      rssi: rand(-85,-55), up: rand(1200,864000)
    };
    const msg = fmt(tpl.msg, readings);
    const payload = tpl.payload(readings);

    logs.push({
      id: `log_${1000+i}`,
      ts, tsStr: fmtTs(ts),
      level,
      source: tpl.src,
      message: msg,
      payload,
    });
  }

  logs.sort((a,b)=>b.ts - a.ts);
  return logs;
})();
