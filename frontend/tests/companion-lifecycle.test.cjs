const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync('src/hooks/useCompanionSession.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};
function harness({deferApi=false,deferMic=false}={}) {
 const apiWait=deferred(),micWait=deferred(),rooms=[],elements=[],effects=[];
 let calls=0,stops=0,publications=0;
 const mic={stop(){stops++},mute:async()=>{},unmute:async()=>{}};
 class Room {
  constructor(){this.handlers={};this.localParticipant={identity:'user',publishTrack:async()=>{publications++}};rooms.push(this)}
  on(e,f){this.handlers[e]=f}
  async connect(){}
  async disconnect(){this.disconnected=true}
  removeAllListeners(){this.handlers={}}
 }
 const exports={};
 vm.runInNewContext(source,{exports,require(name){
  if(name==='react')return {useState:initial=>[initial,()=>{}],useRef:current=>({current}),useCallback:f=>f,useEffect:f=>effects.push(f())};
  if(name==='livekit-client')return {Room,RoomEvent:{TrackSubscribed:'sub',TrackUnsubscribed:'unsub',DataReceived:'data',ActiveSpeakersChanged:'speakers',Disconnected:'end'},createLocalAudioTrack:()=>deferMic?micWait.promise:Promise.resolve(mic)};
  return {api:{createCompanionSession:()=>{calls++;return deferApi?apiWait.promise:Promise.resolve({})}}};
 },document:{body:{appendChild(el){elements.push(el)}}},TextDecoder});
 const hook=exports.useCompanionSession('demo');
 const track={kind:'audio',attach(){return {pause(){this.paused=true},remove(){this.removed=true}}},detach(){}};
 return {hook,rooms,elements,effects,track,apiWait,micWait,mic,get calls(){return calls},get stops(){return stops},get publications(){return publications}};
}
test('simultaneous starts open one room; repeated track events attach one player',async()=>{
 const h=harness();await Promise.all([h.hook.start(),h.hook.start()]);
 assert.equal(h.calls,1);assert.equal(h.rooms.length,1);assert.equal(h.publications,1);
 h.rooms[0].handlers.sub(h.track);h.rooms[0].handlers.sub(h.track);assert.equal(h.elements.length,1);
 await h.hook.disconnect();assert.equal(h.stops,1);assert.ok(h.elements[0].paused&&h.elements[0].removed);assert.ok(h.rooms[0].disconnected);
 await h.hook.start();assert.equal(h.calls,2);
});
test('close while session request is pending prevents a late orphan room',async()=>{
 const h=harness({deferApi:true});const pending=h.hook.start();await h.hook.disconnect();h.apiWait.resolve({});await pending;assert.equal(h.rooms.length,0);
});
test('unmount during microphone permission stops the late track without publishing',async()=>{
 const h=harness({deferMic:true});const pending=h.hook.start();await new Promise(r=>setImmediate(r));
 h.effects.forEach(f=>f());h.micWait.resolve(h.mic);await pending;
 assert.equal(h.stops,1);assert.equal(h.publications,0);assert.ok(h.rooms[0].disconnected);
});
test('remote disconnect cleans audio and allows a new call',async()=>{
 const h=harness();await h.hook.start();h.rooms[0].handlers.sub(h.track);h.rooms[0].handlers.end();
 assert.ok(h.elements[0].removed);assert.equal(h.stops,1);await h.hook.start();assert.equal(h.calls,2);
});
