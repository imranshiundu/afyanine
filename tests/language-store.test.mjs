import test from "node:test";
import assert from "node:assert/strict";
import { LANGUAGE_KEY, hasLanguagePreference, languageSnapshot, languageServerSnapshot, setLanguage, subscribeLanguage } from "../src/components/afyanine/language-store.ts";
test("language changes notify views, survive reload and track another tab", async () => {
  const values = new Map(), win = new EventTarget();
  win.localStorage = {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  globalThis.window=win;
  globalThis.document={documentElement:{lang:"en"}};
  let updates=0; const off=subscribeLanguage(()=>updates++);
  assert.equal(hasLanguagePreference(),false);
  setLanguage("SW");
  assert.equal(languageSnapshot(),"SW"); assert.equal(document.documentElement.lang,"sw"); assert.equal(updates,1);
  const fresh=await import("../src/components/afyanine/language-store.ts?reload");
  assert.equal(fresh.languageSnapshot(),"SW");
  assert.equal(fresh.hasLanguagePreference(),true);
  values.set(LANGUAGE_KEY,"EN");
  window.dispatchEvent(Object.assign(new Event("storage"),{key:LANGUAGE_KEY,newValue:"EN"}));
  assert.equal(languageSnapshot(),"EN"); assert.equal(updates,2);
  assert.equal(languageServerSnapshot(),"EN");
  off(); delete globalThis.window; delete globalThis.document;
});
test("blocked device storage retains a usable session preference",()=>{
  const win=new EventTarget();
  win.localStorage={getItem(){throw Error("blocked")},setItem(){throw Error("blocked")}};
  globalThis.window=win;
  setLanguage("SW"); assert.equal(languageSnapshot(),"SW");
  setLanguage("EN"); delete globalThis.window;
});
