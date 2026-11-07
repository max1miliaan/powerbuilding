import { chromium } from '@playwright/test';
import packedChromium from '@sparticuz/chromium';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
const server=createServer(async(req,res)=>{try{const path=resolve(process.cwd(),'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));if(!path.startsWith(process.cwd()+'/'))throw Error('Invalid path');const body=await readFile(path);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(path)]||'text/plain');res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(8000,'127.0.0.1',resolve));
let browser;
try {
  browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||await packedChromium.executablePath(),args:packedChromium.args.filter(a=>!['--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(a)),headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(()=>{
    const legacy='fortis-v1:guest:'+encodeURIComponent('1:A:A-main:0');
    if(!localStorage.getItem(legacy))localStorage.setItem(legacy,JSON.stringify({value:{weight:205,reps:5,rir:2,done:true},revision:0,dirty:true,changeId:'synthetic-legacy',conflict:null}));
    for(const [id,value] of [['1:D:D-jump:0',{bestCm:180,reps:2,done:true}],['1:D:D-sled:0',{weight:90,distance:15,effort:6,done:true}]]){const idKey='fortis-v1:guest:'+encodeURIComponent(id);if(!localStorage.getItem(idKey))localStorage.setItem(idKey,JSON.stringify({value,revision:0,dirty:true,changeId:'synthetic-legacy',conflict:null}));}
    if(!localStorage.getItem('fortis-view-v1'))localStorage.setItem('fortis-view-v1',JSON.stringify({week:3,code:'D'}));
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000/');await page.waitForSelector('.exercise');
  assert.match(await page.locator('#workout h2').innerText(),/Push A/);
  assert.equal(await page.locator('#days button').count(),5);
  assert.equal(await page.locator('.exercise').count(),4);
  const main=page.locator('[data-ex="push-a-main"]');
  assert.match(await main.innerText(),/Choose load × 4–6/);
  assert.equal(await main.locator('[data-field=weight]').first().inputValue(),'');
  await main.getByRole('button',{name:'Use target'}).first().click();
  assert.match(await page.locator('#toast').innerText(),/Choose a working load/);
  assert.equal(await main.locator('[data-field=weight]').first().inputValue(),'');
  await main.locator('.adjust summary').click();
  await main.locator('[data-adjust=load]').fill('185');await main.locator('[data-adjust=load]').press('Tab');
  assert.match(await main.innerText(),/185 lb × 4–6/);
  await main.getByRole('button',{name:'Use target'}).first().click();
  assert.equal(await main.locator('[data-field=weight]').first().inputValue(),'185');
  assert.equal(await main.locator('[data-field=reps]').first().inputValue(),'4');
  await main.locator('[data-field=reps]').first().fill('5');await main.locator('[data-done]').first().click();
  assert.match(await page.locator('#set-count').innerText(),/^1 \/ 11/);
  await page.reload();await page.waitForSelector('.exercise');
  assert.equal(await main.locator('[data-done]').first().getAttribute('aria-pressed'),'true');
  assert.equal(await main.locator('[data-field=reps]').first().inputValue(),'5');
  assert.match(await main.innerText(),/185 lb × 4–6/,'actual reps must not change targets');
  await page.locator('#history-button').click();
  assert.equal(await page.locator('[data-history="1:push-a"]').count(),1);
  await page.locator('[data-legacy="1:A"]').click();
  assert.match(await page.locator('#panel-body').innerText(),/205 lb · 5 reps/);
  assert.equal(await page.locator('#panel-body input').count(),0,'legacy is read-only');
  await page.locator('#back-history').click();await page.locator('[data-legacy="1:D"]').click();
  assert.match(await page.locator('#panel-body').innerText(),/Best 180 cm/);assert.match(await page.locator('#panel-body').innerText(),/Effort 6\/10/);
  await page.locator('#close-panel').click();
  const legacy=await page.evaluate(()=>localStorage.getItem('fortis-v1:guest:'+encodeURIComponent('1:A:A-main:0')));
  assert.equal(JSON.parse(legacy).value.weight,205);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('fortis-view-v1')).code),'D');
  // Negative pull-up load means assistance, not a negative machine/bodyweight entry.
  await page.getByRole('button',{name:'Tue: Pull A',exact:true}).click();
  const pullup=page.locator('[data-ex="pull-a-pullup"]');
  await pullup.locator('.adjust summary').click();await pullup.locator('[data-adjust=load]').fill('-30');await pullup.locator('[data-adjust=load]').press('Tab');
  assert.match(await pullup.innerText(),/30 lb assistance × 5–8/);
  await pullup.getByRole('button',{name:'Use target'}).first().click();
  assert.equal(await pullup.locator('[data-field=weight]').first().inputValue(),'-30');
  await page.getByRole('button',{name:'Thu: Legs A',exact:true}).click();
  assert.equal(await page.locator('[data-ex="legs-a-legcurl"] [data-field=left]').count(),3);
  assert.equal(await page.locator('[data-ex="legs-a-legcurl"] [data-field=right]').count(),3);
  await page.getByRole('button',{name:'Sat: Pull B',exact:true}).click();
  await page.locator('#finish-button').click();await page.locator('#finish-skipped').click();await page.locator('#finish-button').click();
  assert.equal(await page.locator('#week').inputValue(),'2');
  assert.match(await page.locator('#workout h2').innerText(),/Legs B/,'next session crosses Monday without resetting');
  await page.locator('#week').selectOption('4');
  assert.equal(await page.locator('#days button').count(),5);
  await page.locator('#days button').first().click();
  assert.match(await page.locator('#workout h2').innerText(),/Push B/);
  assert.equal(await page.locator('[data-ex="push-b-main"] .set-row').count(),2);
  assert.equal(await page.locator('[data-ex="push-b-lateral"] .set-row').count(),1);
  assert.match(await page.locator('.warmup').innerText(),/One easy round/);
  assert.match(await page.locator('.set-target').first().innerText(),/4\+ RIR/);
  await page.locator('#account-button').click();
  assert.equal(await page.locator('#auth-form').count(),0);
  const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();
  const download=await downloadPromise,backup=JSON.parse(await readFile(await download.path(),'utf8'));
  assert(backup.records['1:A:A-main:0']);assert(backup.records['ppl-v1:1:push-a:push-a-main:0']);
  await page.locator('#close-panel').click();await page.locator('#rest-button').click();await page.getByRole('button',{name:'90 sec',exact:true}).click();
  await page.waitForTimeout(1100);assert.match(await page.locator('#rest-button').innerText(),/1:[23]\d rest/);
  await page.locator('#close-panel').click();
  await mkdir('/workspace/scratch/ppl-preview',{recursive:true});
  for(const width of [320,390,1280]){
    await page.setViewportSize({width,height:900});
    for(const week of ['1','2','4']){
      await page.locator('#week').selectOption(week);
      for(let i=0;i<5;i++){
        await page.locator('#days button').nth(i).click();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`no overflow ${width}px week ${week} slot ${i}`);
      }
    }
    await page.locator('#week').selectOption('1');await page.locator('#days button').first().click();
    await page.screenshot({path:`/workspace/scratch/ppl-preview/${width}.png`,fullPage:true});
  }
  // All 60 session routes render without stale-code failures, including weeks missing the selected variant.
  for(let w=1;w<=12;w++){
    await page.locator('#week').selectOption(String(w));
    for(let i=0;i<5;i++){await page.locator('#days button').nth(i).click();assert(await page.locator('.exercise').count()>=4);}
  }
  assert.deepEqual(errors,[],'no browser errors');
  console.log('Browser checks passed: all 60 sessions, 320/390/1280px layouts, calibration, actual/target separation, persistence, assistance, unilateral inputs, rolling navigation, lighter weeks, legacy history, export and timer.');
} finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}
