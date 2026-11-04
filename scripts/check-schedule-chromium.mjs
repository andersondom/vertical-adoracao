import assert from "node:assert/strict";
import { chromium } from "playwright";

const base=process.env.BROWSER_BASE_URL||"http://127.0.0.1:8787";
const browser=await chromium.launch({headless:true});
try {
  const context=await browser.newContext();
  await context.addCookies([{name:"louvor_session",value:"chromium-admin-fixture-session",url:base,httpOnly:true,sameSite:"Lax"}]);
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto(base+"/");
  await page.locator("#app:not(.hidden)").waitFor({timeout:15000});
  assert.equal(await page.locator("#roleTag").innerText(),"Administrador");
  await page.locator("#scheduleMonth").fill("2027-01");
  await page.locator("#scheduleMonth").dispatchEvent("change");
  await page.waitForFunction(()=>document.querySelector("#scheduleMonth").value==="2027-01" && document.querySelector("#scheduleView").textContent.includes("Visão geral da confirmação"));
  assert.ok(await page.locator("#scheduleView").getByText("Copiar pendências").count());
  assert.ok(await page.locator("#scheduleView").getByText("Copiar escala confirmada").count());
  assert.ok(await page.locator("#scheduleView").getByText("Imprimir equipes / salvar em PDF").count());
  const publication=await page.evaluate(()=>{
    const original=window.confirm;
    window.confirm=()=>false;
    try{
      const saved=DATA;
      DATA={...saved,events:[{id:777,event_date:"2027-01-10",day_code:"D"}],requirements:[{event_id:777,role_id:1,slots:2}],teamAssignments:[]};
      const result=schedulePublicationWarning();
      DATA=saved;
      return result;
    } finally {window.confirm=original;}
  });
  assert.equal(publication,false,"incomplete schedule must permit canceling publication");
  const unconfigured=await page.evaluate(()=>{
    const saved=DATA;
    const original=window.confirm;
    let warning="";
    window.confirm=message=>{warning=message;return false;};
    try {
      DATA={...saved,events:[{id:778,event_date:"2027-01-17",day_code:"D"}],requirements:[],teamAssignments:[]};
      return {allowed:schedulePublicationWarning(),warning};
    } finally {DATA=saved;window.confirm=original;}
  });
  assert.equal(unconfigured.allowed,false,"unconfigured event must allow cancellation");
  assert.match(unconfigured.warning,/formação não configurada/);

  assert.deepEqual(errors,[],"browser must not report uncaught errors");
  console.log("Chromium admin UI: authenticated month, readiness, share actions and publication cancellation verified.");
} finally {
  await browser.close();
}
