import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://127.0.0.1:4173/founder-dashboard/';
const owner='75677100-97b7-4578-92c5-cf131997b580';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || undefined});
try {
 for(const width of [1440,390]) {
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});
  let rows=[{id:'f034c9ee-1b60-4684-a48f-92c4b357782f',slug:'art-era',message:'This is a browser test fixture, not a reader comment.\n<img src=x onerror=alert(1)>',approved:false,review_status:'pending',review_version:0,created_at:'2026-09-11T19:00:00Z',reviewed_at:null}];
  let writes=0, failWrite=false, failRead=false;
  await context.addInitScript(({owner})=>{const exp=Math.floor(Date.now()/1000)+3600;const t=btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:owner,exp,role:'authenticated'}))+'.test-signature';localStorage.setItem('founder-dashboard-session',JSON.stringify({access_token:t,refresh_token:'test-only',expires_at:exp,expires_in:3600,token_type:'bearer',user:{id:owner,email:'fixture@example.invalid',aud:'authenticated'}}));},{owner});
  await context.route('https://zkyhhoxcrjkhywblzehr.supabase.co/**',async route=>{
    const req=route.request(), u=new URL(req.url()); const headers={'content-type':'application/json','access-control-allow-origin':'*','access-control-expose-headers':'content-range'};
    if(u.pathname.includes('/auth/')) return route.fulfill({status:200,headers,body:JSON.stringify({id:owner,email:'fixture@example.invalid',aud:'authenticated'})});
    if(u.pathname.endsWith('/innerg_read_feedback')) {
      if(req.method()==='PATCH') {writes++; if(failWrite)return route.fulfill({status:503,headers,body:JSON.stringify({message:'test failure'})}); const b=req.postDataJSON();let row=rows.find(r=>u.searchParams.get('id')==='eq.'+r.id&&u.searchParams.get('review_version')==='eq.'+r.review_version);if(row)Object.assign(row,{review_status:b.review_status,approved:b.review_status==='approved',review_version:row.review_version+1,reviewed_at:new Date().toISOString()});return route.fulfill({status:200,headers,body:JSON.stringify(row||null)});}
      if(failRead)return route.fulfill({status:503,headers,body:'{"message":"offline"}'});
      const filtered=rows.filter(r=>'eq.'+r.review_status===u.searchParams.get('review_status'));
      headers['content-range']='0-'+Math.max(0,filtered.length-1)+'/'+filtered.length;
      return route.fulfill({status:200,headers,body:req.method()==='HEAD'?'':JSON.stringify(filtered)});
    }
    return route.fulfill({status:200,headers,body: req.headers()['accept']?.includes('object')?'null':'[]'});
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'#comments',{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'give each voice a place.'}).waitFor();
  await page.locator('.comment-card').waitFor();
  await page.getByRole('button',{name:/^pending/}).click();
  assert.equal(await page.locator('.comment-card').count(),1);
  assert.equal(await page.locator('.comment-card img').count(),0);
  await page.getByRole('button',{name:'approve',exact:true}).click();
  assert.equal(writes,0);
  await page.getByRole('button',{name:'cancel',exact:true}).click(); assert.equal(writes,0);
  await page.getByRole('button',{name:'approve',exact:true}).click();
  await page.getByRole('button',{name:'confirm approval'}).click();
  await page.getByRole('status').filter({hasText:'approved.'}).waitFor(); assert.equal(writes,1);
  await page.getByRole('button',{name:/^approved/}).click();
  await page.getByRole('button',{name:'deny / hide from site'}).click();
  await page.getByRole('button',{name:'confirm denial'}).click();
  await page.getByRole('status').filter({hasText:'denied.'}).waitFor(); assert.equal(writes,2);assert.equal(rows[0].approved,false);
  await page.getByRole('button',{name:/^denied/}).click();
  await page.getByRole('button',{name:'approve',exact:true}).click(); failWrite=true;
  await page.getByRole('button',{name:'confirm approval'}).click();
  await page.getByRole('alert').filter({hasText:'not confirmed'}).waitFor();
  assert.equal(rows[0].approved,false);
  failWrite=false; await page.getByRole('button',{name:'try again'}).click();
  await page.locator('.comment-card').waitFor();
  await page.getByRole('button',{name:'approve',exact:true}).focus();await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'confirm approval'}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:`/tmp/comments-qa-${width}.png`,fullPage:true});
  failRead=true;await page.getByRole('button',{name:'cancel',exact:true}).click();await page.getByRole('button',{name:'refresh inbox'}).click();
  await page.getByRole('alert').filter({hasText:'could not load'}).waitFor();assert.equal(await page.locator('.comment-card').count(),0);
  console.log(JSON.stringify({width,fixtureOnly:true,approve:'pass',deny:'pass',failure:'pass',keyboard:'pass',overflow:false,writes}));
  await context.close();
 }
 const context=await browser.newContext();const p=await context.newPage();await p.goto(base+'#comments',{waitUntil:'domcontentloaded'});await p.getByRole('heading',{name:'Open your dashboard'}).waitFor();assert.equal(await p.locator('.comment-card').count(),0);console.log('signed-out gate: pass');await context.close();
} finally {await browser.close();}

