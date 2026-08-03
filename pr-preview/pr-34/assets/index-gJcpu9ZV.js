(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();const jl=Object.freeze({x:0,y:0,z:0}),eu=Object.freeze({x:1,y:1,z:1}),Ds=Object.freeze({x:0,y:0,z:0,w:1}),tu=Object.freeze({translation:jl,rotation:Ds,scale:eu}),ko=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);function st(n,e,t){return{x:n,y:e,z:t}}function Ga(n,e,t,i){return{x:n,y:e,z:t,w:i}}function cs(n={}){return{translation:n.translation??jl,rotation:n.rotation??Ds,scale:n.scale??eu}}function oi(n){const e=n.x*n.x+n.y*n.y+n.z*n.z+n.w*n.w;if(e===0)return Ds;const t=1/Math.sqrt(e);return{x:n.x*t,y:n.y*t,z:n.z*t,w:n.w*t}}function Nd(n,e){const t=2*(n.y*e.z-n.z*e.y),i=2*(n.z*e.x-n.x*e.z),r=2*(n.x*e.y-n.y*e.x);return{x:e.x+n.w*t+(n.y*r-n.z*i),y:e.y+n.w*i+(n.z*t-n.x*r),z:e.z+n.w*r+(n.x*i-n.y*t)}}function Pn(n){const{x:e,y:t,z:i,w:r}=n.rotation,{x:s,y:a,z:o}=n.scale,c=e+e,l=t+t,h=i+i,p=e*c,u=e*l,m=e*h,g=t*l,v=t*h,f=i*h,d=r*c,E=r*l,A=r*h;return[(1-(g+f))*s,(u+A)*s,(m-E)*s,0,(u-A)*a,(1-(p+f))*a,(v+d)*a,0,(m+E)*o,(v-d)*o,(1-(p+g))*o,0,n.translation.x,n.translation.y,n.translation.z,1]}function Kn(n,e){const t=new Array(16).fill(0);for(let i=0;i<4;i+=1)for(let r=0;r<4;r+=1){let s=0;for(let a=0;a<4;a+=1)s+=(n[a*4+r]??0)*(e[i*4+a]??0);t[i*4+r]=s}return t}const vc=["box","cylinder","sphere","cone","torus","wedge"],ka=["union","subtract","intersect"];function fr(n){return n.kind!=="primitive"}function gn(n){return fr(n)?n.children:[]}function Ui(n,e){return{...n,children:e}}function Mr(){const n=globalThis.crypto;if(typeof n?.randomUUID=="function")return n.randomUUID();const e=new Uint8Array(16);if(typeof n?.getRandomValues=="function")n.getRandomValues(e);else for(let i=0;i<e.length;i+=1)e[i]=Math.floor(Math.random()*256);e[6]=(e[6]??0)&15|64,e[8]=(e[8]??0)&63|128;const t=Array.from(e,i=>i.toString(16).padStart(2,"0")).join("");return`${t.slice(0,8)}-${t.slice(8,12)}-${t.slice(12,16)}-${t.slice(16,20)}-${t.slice(20)}`}function Ud(n){return{id:n.id??Mr(),kind:"primitive",name:n.name??n.primitive,primitive:n.primitive,params:{...n.params??{}}}}function Fd(n={}){return{id:n.id??Mr(),kind:"transform",name:n.name??"Transform",transform:n.transform??tu,children:[...n.children??[]]}}function Od(n){return{id:n.id??Mr(),kind:"boolean",name:n.name??n.op,op:n.op,children:[...n.children??[]]}}function nu(n={}){return{id:n.id??Mr(),kind:"group",name:n.name??"Group",children:[...n.children??[]]}}const Mn=Object.freeze({length:Object.freeze({perCanonical:1e3,suffix:"mm",decimals:1}),angle:Object.freeze({perCanonical:180/Math.PI,suffix:"°",decimals:1}),count:Object.freeze({perCanonical:1,suffix:"",decimals:0})}),Bd=Object.freeze({draft:.5,standard:1,fine:2}),zd="standard",Lt=.06,Gd=1e-4,iu=2,ru=.001;function Ht(n,e,t,i){return{key:n,label:e,unit:"length",default:t,min:Gd,max:iu,step:ru,description:i}}function Zi(n,e,t,i,r){return{key:n,label:e,unit:"count",default:t,min:i,max:256,step:1,tessellation:!0,description:r}}const su=[{kind:"box",label:"Box",description:"Rectangular block. The base of most hard-surface parts.",parameters:[Ht("width","Width",Lt,"Extent along X."),Ht("height","Height",Lt,"Extent along Y."),Ht("depth","Depth",Lt,"Extent along Z.")],relations:[],icon:{viewBox:"0 0 24 24",paths:["M4 8l8-4 8 4v8l-8 4-8-4z","M4 8l8 4 8-4","M12 12v8"]}},{kind:"cylinder",label:"Cylinder",description:"Round bar or, subtracted, a through-hole.",parameters:[Ht("radius","Radius",Lt/2,"Radius in the XZ plane."),Ht("height","Height",Lt,"Extent along Y."),Zi("radialSegments","Sides",32,3,"Sides around the axis.")],relations:[],icon:{viewBox:"0 0 24 24",paths:["M6 7a6 3 0 1 0 12 0a6 3 0 1 0 -12 0","M6 7v10","M18 7v10","M6 17a6 3 0 0 0 12 0"]}},{kind:"sphere",label:"Sphere",description:"Ball. Subtracted, a spherical pocket or a rounded end.",parameters:[Ht("radius","Radius",Lt/2,"Radius in every direction."),Zi("segments","Segments",32,4,"Divisions around and over the pole.")],relations:[],icon:{viewBox:"0 0 24 24",paths:["M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0 -16","M12 4a5 8 0 1 0 0 16a5 8 0 1 0 0 -16"]}},{kind:"cone",label:"Cone",description:"Truncated cone. A top radius of zero gives a true point.",parameters:[Ht("baseRadius","Base radius",Lt/2,"Radius at −Y."),{key:"topRadius",label:"Top radius",unit:"length",default:0,min:0,max:iu,step:ru,description:"Radius at +Y. Zero for a point."},Ht("height","Height",Lt,"Extent along Y."),Zi("radialSegments","Sides",32,3,"Sides around the axis.")],relations:[{keys:["baseRadius","topRadius"],message:"A cone needs a non-zero radius at one end.",holds:n=>(n.baseRadius??0)>0||(n.topRadius??0)>0,repair:n=>{n.baseRadius=Lt/2}}],icon:{viewBox:"0 0 24 24",paths:["M12 4l6 13","M12 4l-6 13","M6 17a6 3 0 0 0 12 0a6 3 0 0 0 -12 0"]}},{kind:"torus",label:"Torus",description:"Ring. Subtracted, an O-ring groove or a relief channel.",parameters:[Ht("majorRadius","Ring radius",Lt*.7,"Centre to tube centre."),Ht("minorRadius","Tube radius",Lt*.2,"Radius of the tube."),Zi("majorSegments","Ring segments",48,3,"Divisions around the ring."),Zi("minorSegments","Tube segments",16,3,"Divisions around the tube.")],relations:[{keys:["minorRadius","majorRadius"],message:"Tube radius must be smaller than ring radius, or the tube passes through itself.",holds:n=>(n.minorRadius??0)<(n.majorRadius??0),repair:n=>{n.minorRadius=(n.majorRadius??Lt*.7)*.45}}],icon:{viewBox:"0 0 24 24",paths:["M12 6a9 6 0 1 0 0 12a9 6 0 1 0 0 -12","M12 10a4 2 0 1 0 0 4a4 2 0 1 0 0 -4"]}},{kind:"wedge",label:"Wedge",description:"Right triangular prism. Chamfers and gussets before #13 has fillets.",parameters:[Ht("width","Width",Lt,"Extent along X."),Ht("height","Height",Lt,"Extent along Y, tapering to zero at +X."),Ht("depth","Depth",Lt,"Extent along Z.")],relations:[],icon:{viewBox:"0 0 24 24",paths:["M4 18h12l4-4V6l-4 4H4z","M4 18l4-4h12","M8 14V6l8 4"]}}],kd=Object.freeze(Object.fromEntries(su.map(n=>[n.kind,n])));function Vd(){return su}function Yi(n){return kd[n]}function Hd(n,e){const t=Yi(n),i=[],r=new Set;for(const a of t.parameters){r.add(a.key);const o=e[a.key];if(o===void 0){i.push({key:a.key,message:`Missing ${a.label.toLowerCase()}.`});continue}if(!Number.isFinite(o)){i.push({key:a.key,message:`${a.label} must be a finite number.`});continue}if(o<a.min||o>a.max){i.push({key:a.key,message:`${a.label} must be between ${Xa(a,a.min)} and ${Xa(a,a.max)}.`});continue}a.unit==="count"&&!Number.isInteger(o)&&i.push({key:a.key,message:`${a.label} must be a whole number.`})}for(const a of Object.keys(e))r.has(a)||i.push({key:a,message:`${t.label} has no parameter "${a}".`});const s=new Set(i.map(a=>a.key));for(const a of t.relations)a.keys.some(o=>s.has(o))||a.holds(e)||i.push({key:a.keys[0],message:a.message});return i}function Va(n,e={}){const t=Yi(n),i={};for(const r of t.parameters)i[r.key]=Mc(r,e[r.key]);for(const r of t.relations)if(!r.holds(i)){r.repair(i);for(const s of r.keys){const a=t.parameters.find(o=>o.key===s);a&&(i[s]=Mc(a,i[s]))}}return Object.freeze(i)}function Mc(n,e){if(e===void 0||!Number.isFinite(e))return n.default;const t=Math.min(n.max,Math.max(n.min,e));return n.unit==="count"?Math.min(n.max,Math.max(n.min,Math.round(t))):au(t)}function au(n){return n===0?0:n}function Wd(n,e,t){const i=Bd[t],r=Va(n,e),s={...r};for(const a of Yi(n).parameters)a.tessellation&&(s[a.key]=Math.round((r[a.key]??a.default)*i));return Va(n,s)}function Ha(n,e){const t=Object.keys(e).sort().map(i=>`${i}=${au(e[i]??Number.NaN)}`);return`${n}(${t.join(",")})`}function rr(n,e){return e*Mn[n.unit].perCanonical}function Wa(n,e){return e/Mn[n.unit].perCanonical}function Xd(n,e){return Xa(n,e)}function Xa(n,e){const t=Mn[n.unit];return`${rr(n,e).toFixed(t.decimals)}${t.suffix}`}function Yd(n,e={}){const t=e.quality??zd,i=Wd(n,e.params??{},t);return Ud({primitive:n,name:e.name??Yi(n).label,params:i})}class Oe extends Error{constructor(e){super(e),this.name="DocumentError"}}class $d{#e=new Map;#t=new Map;#n;constructor(e){Sc(e);const t=e.nodes.find(i=>i.id===e.rootId);if(t&&!fr(t))throw new Oe("The document root must be a container node");for(const i of e.nodes)this.#e.set(i.id,i);this.#n=e.rootId,this.#t.set(e.rootId,null),this.#i(e.rootId)}get rootId(){return this.#n}get size(){return this.#e.size}has(e){return this.#e.has(e)}get(e){return this.#e.get(e)}expect(e){const t=this.#e.get(e);if(!t)throw new Oe(`No such node: ${e}`);return t}expectContainer(e){const t=this.expect(e);if(!fr(t))throw new Oe(`Node ${e} is a ${t.kind} and cannot hold children`);return t}parentOf(e){if(!this.#e.has(e))throw new Oe(`No such node: ${e}`);return this.#t.get(e)??null}childrenOf(e){return gn(this.expect(e))}ancestorsOf(e){const t=[];let i=this.parentOf(e);for(;i!==null;)t.push(i),i=this.parentOf(i);return t}descendantsOf(e){const t=[],i=r=>{for(const s of this.childrenOf(r))t.push(s),i(s)};return i(e),t}order(e=this.#n){return[e,...this.descendantsOf(e)]}indexOf(e){const t=this.parentOf(e);return t===null?-1:this.childrenOf(t).indexOf(e)}bundle(e){return{rootId:e,nodes:this.order(e).map(t=>this.expect(t))}}replace(e){const t=this.expect(e.id);if(t.kind!==e.kind)throw new Oe(`Cannot change node ${e.id} from ${t.kind} to ${e.kind} in place`);const i=gn(t),r=gn(e);if(i.length!==r.length||i.some((s,a)=>s!==r[a]))throw new Oe(`replace() may not change the children of ${e.id}`);this.#e.set(e.id,e)}insertBundle(e,t,i){const r=this.expectContainer(t);for(const o of e.nodes)if(this.#e.has(o.id))throw new Oe(`Node ${o.id} is already in the document`);Sc(e);for(const o of e.nodes)this.#e.set(o.id,o);const s=Ws(i,0,r.children.length),a=[...r.children];a.splice(s,0,e.rootId),this.#e.set(t,Ui(r,a)),this.#t.set(e.rootId,t),this.#i(e.rootId)}removeSubtree(e){if(e===this.#n)throw new Oe("The document root cannot be removed");const t=this.parentOf(e);if(t===null)throw new Oe(`Node ${e} has no parent to detach from`);const i=this.bundle(e),r=this.expectContainer(t);this.#e.set(t,Ui(r,r.children.filter(s=>s!==e)));for(const s of i.nodes)this.#e.delete(s.id),this.#t.delete(s.id);return i}moveChild(e,t,i){if(e===this.#n)throw new Oe("The document root cannot be moved");const r=this.parentOf(e);if(r===null)throw new Oe(`Node ${e} has no parent`);const s=this.indexOf(e);if(t===e||this.ancestorsOf(t).includes(e))throw new Oe(`Cannot move ${e} into its own subtree`);const a=this.expectContainer(t);if(r===t){const h=[...a.children];return h.splice(s,1),h.splice(Ws(i,0,h.length),0,e),this.#e.set(t,Ui(a,h)),{parentId:r,index:s}}const o=this.expectContainer(r);this.#e.set(r,Ui(o,o.children.filter(h=>h!==e)));const c=this.expectContainer(t),l=[...c.children];return l.splice(Ws(i,0,l.length),0,e),this.#e.set(t,Ui(c,l)),this.#t.set(e,t),{parentId:r,index:s}}#i(e){for(const t of this.childrenOf(e)){if(this.#t.has(t))throw new Oe(`Node ${t} appears more than once in the tree`);this.#t.set(t,e),this.#i(t)}}}function Ws(n,e,t){return Math.min(Math.max(Math.trunc(n),e),t)}function Sc(n){const e=new Map(n.nodes.map(r=>[r.id,r]));if(e.size!==n.nodes.length)throw new Oe("Bundle contains duplicate node ids");if(!e.has(n.rootId))throw new Oe(`Bundle root ${n.rootId} is not present in the bundle`);const t=new Set,i=r=>{const s=e.get(r);if(!s)throw new Oe(`Bundle references a node it does not contain: ${r}`);if(t.has(r))throw new Oe(`Node ${r} appears more than once in the bundle`);t.add(r);for(const a of gn(s))i(a)};if(i(n.rootId),t.size!==n.nodes.length){const r=n.nodes.filter(s=>!t.has(s.id)).map(s=>s.id);throw new Oe(`Bundle contains nodes unreachable from its root: ${r.join(", ")}`)}}class Jn{mergeScope=null;captured(e,t){if(e===void 0)throw new Oe(`${this.kind}.invert() called before apply(); there is no ${t} to restore`);return e}}class Vo extends Jn{constructor(e,t,i){super(),this.bundle=e,this.parentId=t,this.index=i,this.label="Insert node"}bundle;parentId;index;kind="insert-node";label;apply(e){return e.insertBundle(this.bundle,this.parentId,this.index),[this.parentId,this.bundle.rootId]}invert(){return new ou(this.bundle.rootId)}}class ou extends Jn{constructor(e){super(),this.nodeId=e}nodeId;kind="remove-node";label="Delete node";#e;#t;#n;apply(e){const t=e.parentOf(this.nodeId);if(t===null)throw new Oe("The document root cannot be removed");return this.#t=t,this.#n=e.indexOf(this.nodeId),this.#e=e.removeSubtree(this.nodeId),[t]}invert(){return new Vo(this.captured(this.#e,"removed subtree"),this.captured(this.#t,"parent"),this.captured(this.#n,"index"))}get removed(){return this.#e}}class Ns extends Jn{constructor(e,t,i){super(),this.nodeId=e,this.parentId=t,this.index=i}nodeId;parentId;index;kind="move-node";label="Move node";#e;#t;apply(e){const t=e.moveChild(this.nodeId,this.parentId,this.index);return this.#e=t.parentId,this.#t=t.index,t.parentId===this.parentId?[this.parentId]:[t.parentId,this.parentId]}invert(){return new Ns(this.nodeId,this.captured(this.#e,"previous parent"),this.captured(this.#t,"previous index"))}}class Ho extends Jn{constructor(e,t){super(),this.nodeId=e,this.transform=t,this.mergeScope=`${e}#transform`}nodeId;transform;kind="set-transform";label="Transform";mergeScope;#e;apply(e){const t=e.expect(this.nodeId);if(t.kind!=="transform")throw new Oe(`Node ${this.nodeId} is a ${t.kind}, not a transform`);return this.#e=t.transform,e.replace({...t,transform:this.transform}),[this.nodeId]}invert(){return new Ho(this.nodeId,this.captured(this.#e,"transform"))}}class qd extends Jn{constructor(e,t){super(),this.nodeId=e,this.params=t,this.mergeScope=`${e}#params:${Object.keys(t).sort().join(",")}`}nodeId;params;kind="set-parameters";label="Edit parameters";mergeScope;#e;apply(e){const t=e.expect(this.nodeId);if(t.kind!=="primitive")throw new Oe(`Node ${this.nodeId} is a ${t.kind}, not a primitive`);return this.#e=t.params,e.replace({...t,params:{...t.params,...this.params}}),[this.nodeId]}invert(){return new Wo(this.nodeId,this.captured(this.#e,"parameters"))}}class Wo extends Jn{constructor(e,t){super(),this.nodeId=e,this.params=t}nodeId;params;kind="replace-parameters";label="Edit parameters";#e;apply(e){const t=e.expect(this.nodeId);if(t.kind!=="primitive")throw new Oe(`Node ${this.nodeId} is a ${t.kind}, not a primitive`);return this.#e=t.params,e.replace({...t,params:{...this.params}}),[this.nodeId]}invert(){return new Wo(this.nodeId,this.captured(this.#e,"parameters"))}}class Xo extends Jn{constructor(e,t){super(),this.nodeId=e,this.name=t,this.mergeScope=`${e}#name`}nodeId;name;kind="rename-node";label="Rename";mergeScope;#e;apply(e){const t=e.expect(this.nodeId);this.#e=t.name;const i={...t,name:this.name};return e.replace(i),[this.nodeId]}invert(){return new Xo(this.nodeId,this.captured(this.#e,"name"))}}class pr extends Jn{constructor(e,t="Edit"){super(),this.commands=e,this.label=t}commands;kind="composite";label;#e;apply(e){const t=new Set,i=[];try{for(const r of this.commands){for(const s of r.apply(e))t.add(s);i.push(r)}}catch(r){for(const s of[...i].reverse())s.invert().apply(e);throw r}return this.#e=i,[...t]}invert(){const e=this.captured(this.#e,"applied commands");return new pr([...e].reverse().map(t=>t.invert()),this.label)}}function Kd(n,e,t){if(e.kind!=="boolean")throw new Oe("makeBooleanCommand needs a boolean node");if(e.children.length>0)throw new Oe("The boolean node must start empty; its children come from targetIds");const[i,...r]=t;if(i===void 0||r.length===0)throw new Oe("A boolean needs at least two operands");const s=n.parentOf(i);if(s===null)throw new Oe("Cannot apply a boolean to the document root");const a=n.indexOf(i),o={rootId:e.id,nodes:[e]},c=[new Vo(o,s,a)];return t.forEach((l,h)=>{c.push(new Ns(l,e.id,h))}),new pr(c,`Apply ${e.op}`)}class Zd{constructor(e=500){this.limit=e}limit;#e=[];#t=[];#n=0;get canUndo(){return this.#e.length>0}get canRedo(){return this.#t.length>0}get depth(){return this.#e.length}get redoDepth(){return this.#t.length}get labels(){return this.#e.map(e=>e.label)}record(e){this.#t=[];const t=this.#e[this.#e.length-1];return e.mergeKey!==null&&t&&t.mergeKey===e.mergeKey?(this.#e[this.#e.length-1]={command:e.command,inverse:t.inverse,mergeKey:t.mergeKey,label:t.label},!0):(this.#e.push(e),this.#e.length>this.limit&&(this.#e.shift(),this.#n+=1),!1)}popUndo(){return this.#e.pop()}pushRedo(e){this.#t.push(e)}popRedo(){return this.#t.pop()}pushUndo(e){this.#e.push(e)}mark(){return{depth:this.#i,redo:[...this.#t]}}get#i(){return this.#e.length+this.#n}rewindTo(e){const t=[];for(;this.#i>e.depth&&this.#e.length>0;){const i=this.#e.pop();i&&t.push(i)}return this.#t=[...e.redo],t}clear(){this.#e=[],this.#t=[],this.#n=0}}class ki{#e;#t;#n=new Set;#i=new Set;#r=[];#s=null;#a=0;constructor(e,t){this.#e=e,this.#t=new Zd(t)}static create(e={}){const t=e.root??nu({name:"Document"});return ki.fromBundle({rootId:t.id,nodes:[t]},e.historyLimit===void 0?{}:{historyLimit:e.historyLimit})}static fromBundle(e,t={}){return new ki(new $d(e),t.historyLimit??500)}get rootId(){return this.#e.rootId}get size(){return this.#e.size}has(e){return this.#e.has(e)}get(e){return this.#e.get(e)}expect(e){return this.#e.expect(e)}childrenOf(e){return this.#e.childrenOf(e)}parentOf(e){return this.#e.parentOf(e)}ancestorsOf(e){return this.#e.ancestorsOf(e)}descendantsOf(e){return this.#e.descendantsOf(e)}indexOf(e){return this.#e.indexOf(e)}order(e){return e===void 0?this.#e.order():this.#e.order(e)}bundle(e=this.rootId){return this.#e.bundle(e)}worldMatrix(e){const t=[e,...this.#e.ancestorsOf(e)].reverse();let i=ko;for(const r of t){const s=this.#e.expect(r);s.kind==="transform"&&(i=Kn(i,Pn(s.transform)))}return i}dispatch(e){if(this.#s)throw new Oe(`Cannot dispatch ${e.kind} directly: gesture ${this.#s.id} is open. Dispatch through the gesture, or commit/cancel it first.`);return this.#o(e,null,"command")}beginGesture(e="gesture"){if(this.#s)throw new Oe(`Gesture ${this.#s.id} is already open; commit or cancel it first`);this.#a+=1;const t=new Jd(this,`${e}-${this.#a}`,this.#t.mark());return this.#s=t,t}get activeGestureId(){return this.#s?.id??null}get canUndo(){return this.#t.canUndo}get canRedo(){return this.#t.canRedo}get undoDepth(){return this.#t.depth}get redoDepth(){return this.#t.redoDepth}get undoLabels(){return this.#t.labels}undo(){this.#c("undo");const e=this.#t.popUndo();if(!e)return null;const t=e.inverse.apply(this.#e);return this.#t.pushRedo({command:e.command,inverse:e.inverse,mergeKey:e.mergeKey,label:e.label}),this.#l(t,e.label,"undo",null,null)}redo(){this.#c("redo");const e=this.#t.popRedo();if(!e)return null;const t=e.command.apply(this.#e);return this.#t.pushUndo({command:e.command,inverse:e.command.invert(),mergeKey:e.mergeKey,label:e.label}),this.#l(t,e.label,"redo",null,null)}clearHistory(){this.#c("clearHistory"),this.#t.clear()}get selection(){return this.#r}setSelection(e){const t=[...new Set(e)].filter(r=>this.#e.has(r));if(!(t.length===this.#r.length&&t.every((r,s)=>r===this.#r[s]))){this.#r=t;for(const r of this.#i)r(this.#r)}}clearSelection(){this.setSelection([])}isSelected(e){return this.#r.includes(e)}subscribe(e){return this.#n.add(e),()=>this.#n.delete(e)}subscribeSelection(e){return this.#i.add(e),()=>this.#i.delete(e)}applyWithinGesture(e,t){if(this.#s!==e)throw new Oe(`Gesture ${e.id} is no longer open`);return this.#o(t,e,"command")}commitGesture(e){if(this.#s!==e)throw new Oe(`Gesture ${e.id} is not open`);this.#s=null,this.#l([...e.touched],e.label,"gesture-commit",e.id,"commit")}cancelGesture(e){if(this.#s!==e)throw new Oe(`Gesture ${e.id} is not open`);this.#s=null;const t=new Set;for(const i of this.#t.rewindTo(e.mark))for(const r of i.inverse.apply(this.#e))t.add(r);for(const i of e.touched)t.add(i);this.#l([...t],e.label,"gesture-cancel",e.id,"cancel")}#o(e,t,i){const r=e.apply(this.#e),s=e.invert(),a=t&&e.mergeScope!==null?`${t.id}|${e.mergeScope}`:null,o={command:e,inverse:s,mergeKey:a,label:e.label};if(this.#t.record(o),t){for(const c of r)t.touched.add(c);t.label=e.label}return this.#u(),this.#l(r,e.label,i,t?.id??null,t?"update":null)}#u(){this.#r.every(e=>this.#e.has(e))||this.setSelection(this.#r.filter(e=>this.#e.has(e)))}#c(e){if(this.#s)throw new Oe(`Cannot ${e} while gesture ${this.#s.id} is open`)}#l(e,t,i,r,s){const a={source:i,label:t,changed:e,invalidated:this.#d(e),gestureId:r,gesturePhase:s};for(const o of this.#n)o(a);return a}#d(e){const t=new Map;for(const i of e){if(!this.#e.has(i))continue;const r=[i,...this.#e.ancestorsOf(i)];let s=r.length-1;for(const a of r){const o=t.get(a);(o===void 0||s>o)&&t.set(a,s),s-=1}}return[...t.entries()].sort((i,r)=>r[1]-i[1]).map(([i])=>i)}}class Jd{constructor(e,t,i){this.document=e,this.id=t,this.mark=i}document;id;mark;touched=new Set;label="Edit";#e=!0;get active(){return this.#e}dispatch(e){return this.#t("dispatch through"),this.document.applyWithinGesture(this,e)}commit(){this.#t("commit"),this.#e=!1,this.document.commitGesture(this)}cancel(){this.#t("cancel"),this.#e=!1,this.document.cancelGesture(this)}#t(e){if(!this.#e)throw new Oe(`Cannot ${e} gesture ${this.id}: already closed`)}}function cu(n,e,t=Number.MAX_SAFE_INTEGER){return new Vo(n,e,t)}function lu(n){return new ou(n)}function Qd(n,e,t){return new Ns(n,e,t)}function uu(n,e){return new Ho(n,e)}function du(n,e){return new qd(n,e)}function hu(n,e){return new Xo(n,e)}function fu(n,e){return e===void 0?new pr(n):new pr(n,e)}function jd(n,e,t={}){const i={id:t.id??Mr(),kind:"transform",name:t.name??n.name,transform:e,children:[n.id]};return{rootId:i.id,nodes:[i,n]}}const Yo=1;class At extends Oe{constructor(e){super(e),this.name="DocumentFormatError"}}function pu(n){return{version:Yo,root:n.rootId,nodes:n.order().map(e=>n.expect(e))}}function mu(n){const e=nh(n);try{return ki.fromBundle(ih(e))}catch(t){throw t instanceof Oe?new At(t.message):t}}function eh(n){let e;try{e=JSON.parse(n)}catch(t){throw new At(`Not valid JSON: ${t instanceof Error?t.message:String(t)}`)}return mu(e)}const th=new Map;function nh(n,e=th,t=Yo){const i=rh(n);if(i.version>t)throw new At(`Document is version ${i.version}, which is newer than this build understands (${t}). Update Carve to open it.`);let r=i;for(;r.version<t;){const s=e.get(r.version);if(!s)throw new At(`No migration from document version ${r.version} to ${r.version+1}`);const a=s(r);if(a.version<=r.version)throw new At(`Migration from version ${r.version} did not advance the version`);r=a}return r}function ih(n){return{rootId:n.root,nodes:n.nodes}}function rh(n){const e=$i(n,"document"),t=e.version;if(typeof t!="number"||!Number.isInteger(t)||t<1)throw new At(`Document version must be a positive integer, got ${jt(t)}`);const i=e.root;if(typeof i!="string"||i.length===0)throw new At(`Document root must be a node id, got ${jt(i)}`);const r=e.nodes;if(!Array.isArray(r))throw new At(`Document nodes must be an array, got ${jt(r)}`);const s=r,a=t===Yo?s.map((o,c)=>sh(o,c)):s;return{version:t,root:i,nodes:a}}function sh(n,e){const t=`nodes[${e}]`,i=$i(n,t),r=gu(i.id,`${t}.id`),s=i.name;if(typeof s!="string")throw new At(`${t}.name must be a string, got ${jt(s)}`);switch(i.kind){case"primitive":return{id:r,name:s,kind:"primitive",primitive:ah(i.primitive,`${t}.primitive`),params:ch(i.params,`${t}.params`)};case"transform":return{id:r,name:s,kind:"transform",transform:lh(i.transform,`${t}.transform`),children:Xs(i.children,t)};case"boolean":return{id:r,name:s,kind:"boolean",op:oh(i.op,`${t}.op`),children:Xs(i.children,t)};case"group":return{id:r,name:s,kind:"group",children:Xs(i.children,t)};default:throw new At(`${t}.kind is not a node kind: ${jt(i.kind)}`)}}function $i(n,e){if(typeof n!="object"||n===null||Array.isArray(n))throw new At(`${e} must be an object, got ${jt(n)}`);return n}function gu(n,e){if(typeof n!="string"||n.length===0)throw new At(`${e} must be a non-empty string, got ${jt(n)}`);return n}function Xs(n,e){if(!Array.isArray(n))throw new At(`${e}.children must be an array, got ${jt(n)}`);return n.map((t,i)=>gu(t,`${e}.children[${i}]`))}function ah(n,e){if(!_u(vc,n))throw new At(`${e} must be one of ${vc.join(", ")}, got ${jt(n)}`);return n}function oh(n,e){if(!_u(ka,n))throw new At(`${e} must be one of ${ka.join(", ")}, got ${jt(n)}`);return n}function ch(n,e){const t=$i(n,e),i={};for(const[r,s]of Object.entries(t)){if(typeof s!="number"||!Number.isFinite(s))throw new At(`${e}.${r} must be a finite number, got ${jt(s)}`);i[r]=s}return i}function lh(n,e){const t=$i(n,e);return{translation:Ec(t.translation,`${e}.translation`),rotation:uh(t.rotation,`${e}.rotation`),scale:Ec(t.scale,`${e}.scale`)}}function Ec(n,e){const t=$i(n,e);return{x:ci(t.x,`${e}.x`),y:ci(t.y,`${e}.y`),z:ci(t.z,`${e}.z`)}}function uh(n,e){const t=$i(n,e);return{x:ci(t.x,`${e}.x`),y:ci(t.y,`${e}.y`),z:ci(t.z,`${e}.z`),w:ci(t.w,`${e}.w`)}}function ci(n,e){if(typeof n!="number"||!Number.isFinite(n))throw new At(`${e} must be a finite number, got ${jt(n)}`);return n}function _u(n,e){return typeof e=="string"&&n.includes(e)}function jt(n){switch(typeof n){case"string":return JSON.stringify(n);case"number":case"bigint":case"boolean":case"undefined":return String(n);case"symbol":return n.toString();case"function":return"a function";default:return n===null?"null":Array.isArray(n)?"an array":"an object"}}const dh="core",Ys=Object.freeze({translation:Object.freeze({x:0,y:0,z:0}),rotation:Object.freeze({x:0,y:0,z:0,w:1}),scale:Object.freeze({x:1,y:1,z:1})});function hh(n){return{kind:"hover",nodeId:n}}function fh(n,e=!1){return{kind:"select",nodeId:n,additive:e}}function xu(n,e,t){return t===void 0?{kind:"transform-begin",nodeId:n,mode:e}:{kind:"transform-begin",nodeId:n,mode:e,pivot:t}}function Ya(n){return{kind:"transform-update",delta:n}}function vu(){return{kind:"transform-commit"}}function ph(n="user"){return{kind:"transform-cancel",reason:n}}function $s(n){return{kind:"action",action:n}}function sr(n={}){return{translation:n.translation??Ys.translation,rotation:n.rotation??Ys.rotation,scale:n.scale??Ys.scale}}function Mu(n,e){return{x:n.x+e.x,y:n.y+e.y,z:n.z+e.z}}function Gt(n,e){return{x:n.x-e.x,y:n.y-e.y,z:n.z-e.z}}function an(n,e){return{x:n.x*e,y:n.y*e,z:n.z*e}}function zt(n,e){return n.x*e.x+n.y*e.y+n.z*e.z}function Fi(n,e){return{x:n.y*e.z-n.z*e.y,y:n.z*e.x-n.x*e.z,z:n.x*e.y-n.y*e.x}}function _n(n){return Math.sqrt(zt(n,n))}function gs(n,e){return _n(Gt(n,e))}function On(n){const e=_n(n);return e===0?st(0,0,-1):an(n,1/e)}function hi(n,e){const t=s=>n[s]??0,i=t(3)*e.x+t(7)*e.y+t(11)*e.z+t(15),r=i===0?1:1/i;return{x:(t(0)*e.x+t(4)*e.y+t(8)*e.z+t(12))*r,y:(t(1)*e.x+t(5)*e.y+t(9)*e.z+t(13))*r,z:(t(2)*e.x+t(6)*e.y+t(10)*e.z+t(14))*r}}function Su(n,e){const t=i=>n[i]??0;return{x:t(0)*e.x+t(4)*e.y+t(8)*e.z,y:t(1)*e.x+t(5)*e.y+t(9)*e.z,z:t(2)*e.x+t(6)*e.y+t(10)*e.z}}function Us(n){const e=S=>n[S]??0,t=e(5)*e(10)*e(15)-e(5)*e(11)*e(14)-e(9)*e(6)*e(15)+e(9)*e(7)*e(14)+e(13)*e(6)*e(11)-e(13)*e(7)*e(10),i=-e(4)*e(10)*e(15)+e(4)*e(11)*e(14)+e(8)*e(6)*e(15)-e(8)*e(7)*e(14)-e(12)*e(6)*e(11)+e(12)*e(7)*e(10),r=e(4)*e(9)*e(15)-e(4)*e(11)*e(13)-e(8)*e(5)*e(15)+e(8)*e(7)*e(13)+e(12)*e(5)*e(11)-e(12)*e(7)*e(9),s=-e(4)*e(9)*e(14)+e(4)*e(10)*e(13)+e(8)*e(5)*e(14)-e(8)*e(6)*e(13)-e(12)*e(5)*e(10)+e(12)*e(6)*e(9),a=e(0)*t+e(1)*i+e(2)*r+e(3)*s;if(a===0||!Number.isFinite(a))return null;const o=-e(1)*e(10)*e(15)+e(1)*e(11)*e(14)+e(9)*e(2)*e(15)-e(9)*e(3)*e(14)-e(13)*e(2)*e(11)+e(13)*e(3)*e(10),c=e(0)*e(10)*e(15)-e(0)*e(11)*e(14)-e(8)*e(2)*e(15)+e(8)*e(3)*e(14)+e(12)*e(2)*e(11)-e(12)*e(3)*e(10),l=-e(0)*e(9)*e(15)+e(0)*e(11)*e(13)+e(8)*e(1)*e(15)-e(8)*e(3)*e(13)-e(12)*e(1)*e(11)+e(12)*e(3)*e(9),h=e(0)*e(9)*e(14)-e(0)*e(10)*e(13)-e(8)*e(1)*e(14)+e(8)*e(2)*e(13)+e(12)*e(1)*e(10)-e(12)*e(2)*e(9),p=e(1)*e(6)*e(15)-e(1)*e(7)*e(14)-e(5)*e(2)*e(15)+e(5)*e(3)*e(14)+e(13)*e(2)*e(7)-e(13)*e(3)*e(6),u=-e(0)*e(6)*e(15)+e(0)*e(7)*e(14)+e(4)*e(2)*e(15)-e(4)*e(3)*e(14)-e(12)*e(2)*e(7)+e(12)*e(3)*e(6),m=e(0)*e(5)*e(15)-e(0)*e(7)*e(13)-e(4)*e(1)*e(15)+e(4)*e(3)*e(13)+e(12)*e(1)*e(7)-e(12)*e(3)*e(5),g=-e(0)*e(5)*e(14)+e(0)*e(6)*e(13)+e(4)*e(1)*e(14)-e(4)*e(2)*e(13)-e(12)*e(1)*e(6)+e(12)*e(2)*e(5),v=-e(1)*e(6)*e(11)+e(1)*e(7)*e(10)+e(5)*e(2)*e(11)-e(5)*e(3)*e(10)-e(9)*e(2)*e(7)+e(9)*e(3)*e(6),f=e(0)*e(6)*e(11)-e(0)*e(7)*e(10)-e(4)*e(2)*e(11)+e(4)*e(3)*e(10)+e(8)*e(2)*e(7)-e(8)*e(3)*e(6),d=-e(0)*e(5)*e(11)+e(0)*e(7)*e(9)+e(4)*e(1)*e(11)-e(4)*e(3)*e(9)-e(8)*e(1)*e(7)+e(8)*e(3)*e(5),E=e(0)*e(5)*e(10)-e(0)*e(6)*e(9)-e(4)*e(1)*e(10)+e(4)*e(2)*e(9)+e(8)*e(1)*e(6)-e(8)*e(2)*e(5),A=1/a;return[t*A,o*A,p*A,v*A,i*A,c*A,u*A,f*A,r*A,l*A,m*A,d*A,s*A,h*A,g*A,E*A]}function mh(n){const e=u=>n[u]??0,t=u=>st(e(u*4),e(u*4+1),e(u*4+2)),i=t(0),r=t(1),s=t(2),o=zt(i,Fi(r,s))<0?-1:1,c=_n(i)*o,l=_n(r),h=_n(s),p=c===0||l===0||h===0?Ds:gh(an(i,1/c),an(r,1/l),an(s,1/h));return{translation:st(e(12),e(13),e(14)),rotation:p,scale:st(c,l,h)}}function gh(n,e,t){const i=n.x+e.y+t.z;if(i>0){const s=Math.sqrt(i+1)*2;return oi({x:(e.z-t.y)/s,y:(t.x-n.z)/s,z:(n.y-e.x)/s,w:.25*s})}if(n.x>e.y&&n.x>t.z){const s=Math.sqrt(1+n.x-e.y-t.z)*2;return oi({x:.25*s,y:(e.x+n.y)/s,z:(t.x+n.z)/s,w:(e.z-t.y)/s})}if(e.y>t.z){const s=Math.sqrt(1+e.y-n.x-t.z)*2;return oi({x:(e.x+n.y)/s,y:.25*s,z:(t.y+e.z)/s,w:(t.x-n.z)/s})}const r=Math.sqrt(1+t.z-n.x-e.y)*2;return oi({x:(t.x+n.z)/r,y:(t.y+e.z)/r,z:.25*r,w:(n.y-e.x)/r})}function lr(n){return[1,0,0,0,0,1,0,0,0,0,1,0,n.x,n.y,n.z,1]}function _h(n,e){return{origin:n,direction:On(e)}}function _s(n,e){return Mu(n.origin,an(n.direction,e))}function Eu(n,e){return{origin:hi(n,e.origin),direction:On(Su(n,e.direction))}}function yu(n,e,t,i,r){const s=i===0?0:e/i*2-1,a=r===0?0:1-t/r*2,o=Math.tan(n.fovDegrees*Math.PI/360),c=st(s*o*n.aspect,a*o,-1);return{origin:n.position,direction:On(Nd(n.orientation,c))}}function bu(n,e){let t=0,i=Number.POSITIVE_INFINITY;const r=[n.origin.x,n.origin.y,n.origin.z],s=[n.direction.x,n.direction.y,n.direction.z];for(let a=0;a<3;a+=1){const o=r[a]??0,c=s[a]??0,l=e.min[a]??0,h=e.max[a]??0;if(c===0){if(o<l||o>h)return null;continue}const p=1/c,u=(l-o)*p,m=(h-o)*p;if(t=Math.max(t,Math.min(u,m)),i=Math.min(i,Math.max(u,m)),t>i)return null}return t}function xs(n,e,t){const i=zt(t,n.direction);if(Math.abs(i)<1e-9)return null;const r=zt(Gt(e,n.origin),t)/i;return r<0?null:r}function xh(n,e,t,i){const s=Gt(t,e),a=Gt(i,e),o=Fi(n.direction,a),c=zt(s,o);if(Math.abs(c)<1e-12)return null;const l=1/c,h=Gt(n.origin,e),p=zt(h,o)*l;if(p<0||p>1)return null;const u=Fi(h,s),m=zt(n.direction,u)*l;if(m<0||p+m>1)return null;const g=zt(a,u)*l;if(g<0)return null;const v=On(Fi(s,a));return{distance:g,normal:zt(v,n.direction)>0?an(v,-1):v}}function Tu(n,e){let t=Number.POSITIVE_INFINITY,i=Number.POSITIVE_INFINITY,r=Number.POSITIVE_INFINITY,s=Number.NEGATIVE_INFINITY,a=Number.NEGATIVE_INFINITY,o=Number.NEGATIVE_INFINITY;for(let c=0;c<8;c+=1){const l=hi(n,st((c&1?e.max[0]:e.min[0])??0,(c&2?e.max[1]:e.min[1])??0,(c&4?e.max[2]:e.min[2])??0));t=Math.min(t,l.x),i=Math.min(i,l.y),r=Math.min(r,l.z),s=Math.max(s,l.x),a=Math.max(a,l.y),o=Math.max(o,l.z)}return{min:[t,i,r],max:[s,a,o]}}class vh{#e=new Map;get size(){return this.#e.size}register(e){this.#e.set(e.nodeId,e)}unregister(e){return this.#e.delete(e)}clear(){this.#e.clear()}has(e){return this.#e.has(e)}get(e){return this.#e.get(e)}targets(){return[...this.#e.values()]}pickAll(e){const t=[];for(const i of this.#e.values()){const r=Mh(e,i);r&&t.push(r)}return t.sort((i,r)=>i.distance!==r.distance?i.distance-r.distance:Number(r.exact)-Number(i.exact))}pick(e,t={}){const i=this.pickAll(e),r=i[0];if(!r)return null;const s=t.tree;if(!s)return{...r,resolvedId:r.nodeId};const a=t.drillIn?this.#n(r.nodeId,i,s):this.#t(r.nodeId,s);return{...r,resolvedId:a}}#t(e,t){if(!t.has(e))return e;let i=e;for(const r of t.ancestorsOf(e))this.#e.has(r)&&(i=r);return i}#n(e,t,i){if(!i.has(e))return e;let r=e,s=i.ancestorsOf(e).length;for(const a of t){if(a.nodeId===e||!i.has(a.nodeId))continue;const o=i.ancestorsOf(a.nodeId);o.includes(e)&&o.length>s&&(r=a.nodeId,s=o.length)}return r}}function Mh(n,e){const t=Us(e.worldMatrix);if(!t)return null;const i=Eu(t,n),r=bu(i,e.bounds);if(r===null)return null;if(!e.geometry){const o=Au(i,r),c=hi(e.worldMatrix,o);return{nodeId:e.nodeId,distance:gs(c,n.origin),point:c,normal:null,exact:!1}}const s=Eh(i,e.geometry);if(!s)return null;const a=hi(e.worldMatrix,s.point);return{nodeId:e.nodeId,distance:gs(a,n.origin),point:a,normal:Sh(e.worldMatrix,s.normal),exact:!0}}function Au(n,e){return{x:n.origin.x+n.direction.x*e,y:n.origin.y+n.direction.y*e,z:n.origin.z+n.direction.z*e}}function Sh(n,e){const t=o=>n[o]??0,i=t(0)*e.x+t(4)*e.y+t(8)*e.z,r=t(1)*e.x+t(5)*e.y+t(9)*e.z,s=t(2)*e.x+t(6)*e.y+t(10)*e.z,a=Math.sqrt(i*i+r*r+s*s);return a===0?e:{x:i/a,y:r/a,z:s/a}}function Eh(n,e){const t=e.stride??3,i=e.positionOffset??0,{positions:r,indices:s}=e;let a=Number.POSITIVE_INFINITY,o=null;for(let c=0;c+2<s.length;c+=3){const l=qs(r,s[c]??0,t,i),h=qs(r,s[c+1]??0,t,i),p=qs(r,s[c+2]??0,t,i),u=xh(n,l,h,p);!u||u.distance>=a||(a=u.distance,o={point:Au(n,u.distance),normal:u.normal})}return o}function qs(n,e,t,i){const r=e*t+i;return{x:n[r]??0,y:n[r+1]??0,z:n[r+2]??0}}const $a=Object.freeze({grid:.001,rotationDegrees:15,featureRadius:.02}),yc=Object.freeze({grid:0,rotationDegrees:0,featureRadius:0});function Ks(n,e){return e<=0||!Number.isFinite(e)?n:Math.round(n/e)*e}function wu(n,e){return e<=0||!Number.isFinite(e)?n:st(Ks(n.x,e),Ks(n.y,e),Ks(n.z,e))}function bc(n,e){if(e<=0||!Number.isFinite(e))return n;const t=oi(n),i=Math.min(1,Math.max(-1,t.w)),r=Math.acos(i),s=Math.sin(r);if(s<1e-8)return{x:0,y:0,z:0,w:1};const a=e*Math.PI/180,c=Math.round(r*2/a)*a/2,l=Math.sin(c)/s;return oi({x:t.x*l,y:t.y*l,z:t.z*l,w:Math.cos(c)})}function yh(n,e,t){const i=[[e.min[0],(e.min[0]+e.max[0])/2,e.max[0]],[e.min[1],(e.min[1]+e.max[1])/2,e.max[1]],[e.min[2],(e.min[2]+e.max[2])/2,e.max[2]]],r=[];for(let s=0;s<3;s+=1)for(let a=0;a<3;a+=1)for(let o=0;o<3;o+=1){const c=+(s===1)+ +(a===1)+ +(o===1);if(c===3)continue;const l=c===0?"corner":c===1?"edge-midpoint":"face-center";r.push({nodeId:n,kind:l,point:hi(t,st(i[0]?.[s]??0,i[1]?.[a]??0,i[2]?.[o]??0))})}return r}class bh{#e=new Map;get size(){let e=0;for(const t of this.#e.values())e+=t.length;return e}set(e,t){this.#e.set(e,t)}setFromBounds(e,t,i){this.set(e,yh(e,t,i))}remove(e){return this.#e.delete(e)}clear(){this.#e.clear()}features(){return[...this.#e.values()].flat()}nearest(e,t,i){if(t<=0||!Number.isFinite(t))return null;let r=null,s=t;for(const[a,o]of this.#e)if(!i?.has(a))for(const c of o){const l=gs(e,c.point);l>s||(r=c,s=l)}return r}}function Th(n,e,t,i){const r=t?.nearest(n,e.featureRadius,i)??null;if(r)return{point:r.point,feature:r,snapped:!0};const s=wu(n,e.grid),a=e.grid>0&&Number.isFinite(e.grid);return{point:s,feature:null,snapped:a}}class Ah{#e;#t=new Set;#n=new Set;#i;#r;#s;#a=null;#o=null;constructor(e){this.#e=e.document,this.#i=e.snap??$a,this.#r=e.snapField??null,this.#s=e.spawnParentId??null}get document(){return this.#e}get hovered(){return this.#a}get transforming(){return this.#o===null?null:{nodeId:this.#o.nodeId,mode:this.#o.mode}}get snapSettings(){return this.#i}setSnapSettings(e){this.#i=e}setSnapField(e){this.#r=e}subscribe(e){return this.#t.add(e),()=>this.#t.delete(e)}subscribeHover(e){return this.#n.add(e),()=>this.#n.delete(e)}handle(e){let t;try{t=this.#u(e)}catch(i){if(!(i instanceof Oe))throw i;t={status:"rejected",intent:e,reason:"document-error",message:i.message}}for(const i of this.#t)i(t);return t}handleAll(e){const t=[];for(const i of e)t.push(this.handle(i));return t}abort(e="interrupted"){return this.#o?(this.handle({kind:"transform-cancel",reason:e}),!0):!1}#u(e){switch(e.kind){case"hover":return this.#c(e.nodeId,e);case"select":return this.#l(e.nodeId,e.additive,e);case"transform-begin":return this.#d(e.nodeId,e.mode,e.pivot,e);case"transform-update":return this.#h(e.delta,e);case"transform-commit":return this.#p(!0,e);case"transform-cancel":return this.#p(!1,e);case"action":return this.#f(e.action,e)}}#c(e,t){const i=e!==null&&this.#e.has(e)?e:null;if(i===this.#a)return{status:"ignored",intent:t};this.#a=i;for(const r of this.#n)r(i);return i===null?{status:"applied",intent:t}:{status:"applied",intent:t,nodeId:i}}#l(e,t,i){if(e===null)return this.#e.clearSelection(),{status:"applied",intent:i};if(!this.#e.has(e))return{status:"rejected",intent:i,reason:"unknown-node",nodeId:e};if(!t)return this.#e.setSelection([e]),{status:"applied",intent:i,nodeId:e};const r=this.#e.selection,s=r.includes(e)?r.filter(a=>a!==e):[...r,e];return this.#e.setSelection(s),{status:"applied",intent:i,nodeId:e}}#d(e,t,i,r){if(this.#o)return{status:"rejected",intent:r,reason:"already-transforming",nodeId:e};if(!this.#e.has(e))return{status:"rejected",intent:r,reason:"unknown-node",nodeId:e};if(this.#e.activeGestureId!==null)return{status:"rejected",intent:r,reason:"gesture-open",nodeId:e};const s=this.#g(e);if(s===null)return{status:"rejected",intent:r,reason:"no-transform-target",nodeId:e};const a=this.#e.worldMatrix(s),o=this.#e.parentOf(s),c=o===null?ko:this.#e.worldMatrix(o),l=Us(c);if(!l)return{status:"rejected",intent:r,reason:"degenerate-transform",nodeId:s};const h=hi(a,st(0,0,0));return this.#o={nodeId:s,mode:t,gesture:this.#e.beginGesture(t),pivot:i??h,startWorld:a,parentInverse:l,startOrigin:h,ownFeatures:new Set([s,...this.#e.descendantsOf(s)])},{status:"applied",intent:r,nodeId:s}}#h(e,t){const i=this.#o;if(!i)return{status:"ignored",intent:t,reason:"not-transforming"};const{matrix:r,snappedTo:s}=this.#_(i,e),a=Kn(r,i.startWorld),o=Kn(i.parentInverse,a);return i.gesture.dispatch(uu(i.nodeId,mh(o))),s?{status:"applied",intent:t,nodeId:i.nodeId,snappedTo:s}:{status:"applied",intent:t,nodeId:i.nodeId}}#p(e,t){const i=this.#o;return i?(this.#o=null,e?i.gesture.commit():i.gesture.cancel(),{status:"applied",intent:t,nodeId:i.nodeId}):{status:"ignored",intent:t,reason:"not-transforming"}}#f(e,t){if(this.#o!==null||this.#e.activeGestureId!==null)return{status:"rejected",intent:t,reason:"gesture-open"};switch(e.name){case"undo":return this.#e.undo()===null?{status:"rejected",intent:t,reason:"nothing-to-undo"}:{status:"applied",intent:t};case"redo":return this.#e.redo()===null?{status:"rejected",intent:t,reason:"nothing-to-redo"}:{status:"applied",intent:t};case"spawn-primitive":{const i=Yd(e.primitive,e.quality===void 0?{}:{quality:e.quality}),r=jd(i,e.transform??tu),s=e.parentId??this.#s??this.#e.rootId;return this.#e.has(s)?(this.#e.dispatch(cu(r,s)),this.#e.setSelection([r.rootId]),{status:"applied",intent:t,nodeId:r.rootId}):{status:"rejected",intent:t,reason:"unknown-node",nodeId:s}}case"apply-boolean":{const i=e.targets??this.#e.selection;if(i.length<2)return{status:"rejected",intent:t,reason:"needs-two-operands"};const r=i.find(a=>!this.#e.has(a));if(r!==void 0)return{status:"rejected",intent:t,reason:"unknown-node",nodeId:r};const s=Od({op:e.op});return this.#e.dispatch(Kd(this.#e,s,[...i])),this.#e.setSelection([s.id]),{status:"applied",intent:t,nodeId:s.id}}case"delete":{const i=e.targets??this.#e.selection;if(i.length===0)return{status:"rejected",intent:t,reason:"nothing-selected"};if(i.includes(this.#e.rootId))return{status:"rejected",intent:t,reason:"cannot-delete-root"};const r=i.find(a=>!this.#e.has(a));if(r!==void 0)return{status:"rejected",intent:t,reason:"unknown-node",nodeId:r};const s=[...new Set(i)].filter(a=>!this.#e.ancestorsOf(a).some(o=>i.includes(o)));return this.#e.dispatch(fu(s.map(a=>lu(a)),s.length===1?"Delete":`Delete ${s.length} nodes`)),{status:"applied",intent:t}}}}#g(e){if(this.#e.get(e)?.kind==="transform")return e;for(const i of this.#e.ancestorsOf(e))if(this.#e.get(i)?.kind==="transform")return i;return null}#_(e,t){switch(e.mode){case"translate":{const i=this.#m(e,t);return i.feature?{matrix:lr(i.offset),snappedTo:i.feature}:{matrix:lr(i.offset)}}case"rotate":{const i=bc(t.rotation,this.#i.rotationDegrees);return{matrix:Zs(Pn(cs({rotation:i})),e.pivot)}}case"scale":return{matrix:Zs(Pn(cs({scale:t.scale})),e.pivot)};case"grab":{const i=this.#m(e,t),r=bc(t.rotation,this.#i.rotationDegrees),s=Zs(Pn(cs({rotation:r,scale:t.scale})),e.pivot),a=Kn(lr(i.offset),s);return i.feature?{matrix:a,snappedTo:i.feature}:{matrix:a}}}}#m(e,t){const i=st(e.startOrigin.x+t.translation.x,e.startOrigin.y+t.translation.y,e.startOrigin.z+t.translation.z),r=Th(i,this.#i,this.#r??void 0,e.ownFeatures);return{offset:Gt(r.point,e.startOrigin),feature:r.feature}}}function Zs(n,e){return Kn(Kn(lr(e),n),lr(an(e,-1)))}const wh=4;function Rh(n){const e=n.dragThresholdPx??wh;let t=null,i=null;function r(){if(n.viewport)return n.viewport();const d=t?.getBoundingClientRect();return{width:d?.width??0,height:d?.height??0}}function s(d){const E=t?.getBoundingClientRect();return{x:d.clientX-(E?.left??0),y:d.clientY-(E?.top??0)}}function a(d){const{x:E,y:A}=s(d),{width:S,height:w}=r();return yu(n.camera(),E,A,S,w)}function o(d){return d.altKey===!0}function c(d){return d.shiftKey===!0||d.ctrlKey===!0||d.metaKey===!0}function l(d,E){const A=E.hit;if(!A)return;const S=n.camera(),b=n.dragPlaneNormal?.()??null??On(Gt(S.position,A.point)),R=A.point,x=n.mode?.()??"translate",y={nodeId:A.resolvedId,planePoint:R,planeNormal:b,anchor:R};i={...E,drag:y},n.emit(xu(A.resolvedId,x,A.point)),h(y,d)}function h(d,E){const A=a(E),S=xs(A,d.planePoint,d.planeNormal);if(S===null)return;const w=_s(A,S);n.emit(Ya(sr({translation:Gt(w,d.anchor)})))}const p=d=>{if(!i){const S=n.pick(a(d),{drillIn:o(d)});n.emit(hh(S?.resolvedId??null));return}if(i.drag){h(i.drag,d);return}const E=d.clientX-i.screenX,A=d.clientY-i.screenY;Math.hypot(E,A)<e||l(d,i)},u=d=>{if((d.button??0)!==0||i)return;const E=n.pick(a(d),{drillIn:o(d)});i={pointerId:d.pointerId,screenX:d.clientX,screenY:d.clientY,hit:E,additive:c(d),drag:null},d.pointerId!==void 0&&t?.setPointerCapture?.(d.pointerId)},m=d=>{const E=i;if(E){if(i=null,E.pointerId!==void 0&&t?.releasePointerCapture?.(E.pointerId),E.drag){h(E.drag,d),n.emit(vu());return}n.emit(fh(E.hit?.resolvedId??null,E.additive))}},g=(d="interrupted")=>{const E=i;i=null,E?.pointerId!==void 0&&t?.releasePointerCapture?.(E.pointerId),E?.drag&&n.emit(ph(d))},v=()=>g("interrupted"),f=()=>{t&&(t.removeEventListener("pointermove",p),t.removeEventListener("pointerdown",u),t.removeEventListener("pointerup",m),t.removeEventListener("pointercancel",v),t=null)};return{attach(d){f(),t=d,d.addEventListener("pointermove",p),d.addEventListener("pointerdown",u),d.addEventListener("pointerup",m),d.addEventListener("pointercancel",v)},detach:f,pointerMove:p,pointerDown:u,pointerUp:m,pointerCancel:g,get dragging(){return i?.drag!=null}}}const Ch="input",Ph="application/vnd.carve+json",Ru="untitled";function Ih(n,e={}){const t=e.indent??2;return`${JSON.stringify(pu(n),null,t)}
`}function Lh(n){return eh(n)}function Cu(n){const e=n.replace(/[\u0000-\u001f\u007f]/g," ").replace(/[/\\:*?"<>|]/g,"-").replace(/\s+/g," ").trim().replace(/^\.+/,"").trim().slice(0,64).trim();return e.length>0?e:Ru}const Dh=Mn.length.perCanonical,Nh=1,mr=6,Tc="main",Uh="preview";function Fh(n){return`${Uh}:${n}`}class Oh{#e;#t=new Map;#n=new Set;#i=new Map;#r=1;#s=!1;constructor(e){this.#e=e,this.#e.onmessage=t=>{this.#a(t.data)}}request(e,t={}){if(this.#s)return Promise.reject(new Error("This kernel client has been terminated"));const i=this.#r++,r=t.channel??Tc;return new Promise((s,a)=>{this.#t.set(i,{type:"evaluate",channel:r,rootId:e.rootId,settle:s,fail:a}),this.#e.postMessage({type:"evaluate",id:i,channel:r,bundle:e,...t.creaseAngle===void 0?{}:{creaseAngle:t.creaseAngle}})})}requestPreview(e,t={}){if(this.#s)return Promise.reject(new Error("This kernel client has been terminated"));const i=this.#r++,r=t.channel??Fh(e.kind);return new Promise((s,a)=>{this.#t.set(i,{type:"preview",channel:r,settle:s,fail:a}),this.#e.postMessage({type:"preview",id:i,channel:r,...e})})}cancel(e=Tc){this.#s||this.#e.postMessage({type:"cancel",channel:e})}reset(){this.#s||this.#e.postMessage({type:"reset"})}subscribe(e){return this.#n.add(e),()=>this.#n.delete(e)}terminate(){if(!this.#s){this.#s=!0;for(const e of this.#t.values())e.settle(null);this.#t.clear(),this.#n.clear(),this.#e.onmessage=null,this.#e.terminate()}}#a(e){const t=this.#t.get(e.id);if(this.#t.delete(e.id),e.type==="error"){t?.fail(new Error(e.message));return}if(e.type==="superseded"){t?.settle(null);return}const i=this.#i.get(e.channel)??0;if(e.id<=i){t?.settle(null);return}if(this.#i.set(e.channel,e.id),e.type==="preview-result"){t?.type==="preview"?t.settle(e.preview):t?.settle(null);return}const r={channel:e.channel,requestId:e.id,rootId:t?.type==="evaluate"?t.rootId:"",mesh:e.mesh,warnings:e.warnings,stats:e.stats};t?.type==="evaluate"?t.settle(r):t?.settle(null);for(const s of this.#n)s(r)}}const Bh="kernel",wr=80,zh=50,Gh="Carve — https://github.com/kruddage/carve";function kh(n,e={}){const t=e.scale??Dh,i=Math.floor(n.indices.length/3),r=new ArrayBuffer(wr+4+i*zh),s=new DataView(r);Hh(new Uint8Array(r,0,wr),e.header??Gh),s.setUint32(wr,i,!0);let a=wr+4;for(let o=0;o<i;o+=1){const c=Js(n,n.indices[o*3]??0,t),l=Js(n,n.indices[o*3+1]??0,t),h=Js(n,n.indices[o*3+2]??0,t);a=Rr(s,a,Vh(c,l,h)),a=Rr(s,a,c),a=Rr(s,a,l),a=Rr(s,a,h),s.setUint16(a,0,!0),a+=2}return r}function Js(n,e,t){const i=e*mr+n.positionOffset;return[(n.vertices[i]??0)*t,(n.vertices[i+1]??0)*t,(n.vertices[i+2]??0)*t]}function Vh(n,e,t){const i=[e[0]-n[0],e[1]-n[1],e[2]-n[2]],r=[t[0]-n[0],t[1]-n[1],t[2]-n[2]],s=[i[1]*r[2]-i[2]*r[1],i[2]*r[0]-i[0]*r[2],i[0]*r[1]-i[1]*r[0]],a=Math.hypot(s[0],s[1],s[2]);return a===0?[0,0,0]:[s[0]/a,s[1]/a,s[2]/a]}function Rr(n,e,t){return n.setFloat32(e,t[0],!0),n.setFloat32(e+4,t[1],!0),n.setFloat32(e+8,t[2],!0),e+12}function Hh(n,e){const t=e.replace(/[^ -~]/g,""),i=/^\s*solid/i.test(t)?`Carve ${t}`:t;for(let r=0;r<n.length;r+=1)n[r]=r<i.length?i.charCodeAt(r)&127:0}const Wh=1179937895,Xh=2,Cr=12,Qs=8,Yh=1313821514,$h=5130562,Ac=5126,qh=5125,Kh=34962,Zh=34963,Jh=4,wc="Carve";function Qh(n,e={}){const t=e.scale??Nh,i=e.name??wc,r=Math.floor(n.vertices.length/mr),s=t===1?n.vertices:ef(n,t),a=s.byteLength,o=n.indices.byteLength;if(a%4!==0)throw new Error(`Vertex block is not 4-byte aligned: ${a}`);const c=tf(s,n.positionOffset),l={asset:{version:"2.0",generator:e.generator??wc},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,name:i}],meshes:[{name:i,primitives:[{attributes:{POSITION:0,NORMAL:1},indices:2,mode:Jh}]}],accessors:[{bufferView:0,byteOffset:n.positionOffset*Float32Array.BYTES_PER_ELEMENT,componentType:Ac,count:r,type:"VEC3",min:c.min,max:c.max},{bufferView:0,byteOffset:n.normalOffset*Float32Array.BYTES_PER_ELEMENT,componentType:Ac,count:r,type:"VEC3"},{bufferView:1,componentType:qh,count:n.indices.length,type:"SCALAR"}],bufferViews:[{buffer:0,byteOffset:0,byteLength:a,byteStride:mr*Float32Array.BYTES_PER_ELEMENT,target:Kh},{buffer:0,byteOffset:a,byteLength:o,target:Zh}],buffers:[{byteLength:a+o}]};return jh(new TextEncoder().encode(JSON.stringify(l)),s,n.indices)}function jh(n,e,t){const i=Rc(n.byteLength),r=Rc(e.byteLength+t.byteLength),s=Cr+Qs*2+i+r,a=new ArrayBuffer(s),o=new DataView(a),c=new Uint8Array(a);o.setUint32(0,Wh,!0),o.setUint32(4,Xh,!0),o.setUint32(8,s,!0),o.setUint32(Cr,i,!0),o.setUint32(Cr+4,Yh,!0);const l=Cr+Qs;c.set(n,l),c.fill(32,l+n.byteLength,l+i);const h=l+i;o.setUint32(h,r,!0),o.setUint32(h+4,$h,!0);const p=h+Qs;return c.set(new Uint8Array(e.buffer,e.byteOffset,e.byteLength),p),c.set(new Uint8Array(t.buffer,t.byteOffset,t.byteLength),p+e.byteLength),a}function Rc(n){return n+3&-4}function ef(n,e){const t=n.vertices.slice();for(let i=0;i<t.length;i+=mr)for(let r=0;r<3;r+=1){const s=i+n.positionOffset+r;t[s]=(t[s]??0)*e}return t}function tf(n,e){const t=[1/0,1/0,1/0],i=[-1/0,-1/0,-1/0];for(let r=0;r<n.length;r+=mr)for(let s=0;s<3;s+=1){const a=n[r+e+s]??0;t[s]=Math.min(t[s]??1/0,a),i[s]=Math.max(i[s]??-1/0,a)}return Number.isFinite(t[0])?{min:t,max:i}:{min:[0,0,0],max:[0,0,0]}}const nf="export",Cc="export:",rf=Object.freeze({stl:"model/stl",glb:"model/gltf-binary"}),sf=Object.freeze({stl:".stl",glb:".glb"});class qa extends Error{constructor(e){super(e),this.name="ExportError"}}async function af(n,e,t){const i=df(e,t.roots),r=lf(e,i),s=await n.request(r,{channel:nf,...t.creaseAngle===void 0?{}:{creaseAngle:t.creaseAngle}});if(!s)throw new qa("The export was superseded by a newer one before it finished. Nothing was written.");return of(s.mesh,{format:t.format,name:t.name??pf(e,i),warnings:s.warnings,...t.stl?{stl:t.stl}:{},...t.glb?{glb:t.glb}:{}})}function of(n,e){const t=Cu(e.name),i=e.format==="stl"?kh(n,e.stl??{}):Qh(n,{name:t,...e.glb??{}});return{fileName:`${t}${sf[e.format]}`,mimeType:rf[e.format],bytes:i,warnings:e.warnings??[],triangles:Math.floor(n.indices.length/3)}}function cf(n,e){const t=Cu(e??n.expect(n.rootId).name),i=Ih(n);return{fileName:`${t}.carve`,mimeType:Ph,bytes:new TextEncoder().encode(i).buffer,warnings:[],triangles:0}}function lf(n,e){const t=e.length>0?e:[n.rootId];for(const a of t)if(!n.has(a))throw new qa(`Cannot export ${a}: no such node`);const i=ff(n),r=t.map(a=>hf(n,a,i));if(r.length===1){const a=r[0];if(!a)throw new qa("Nothing to export");return a}const s=nu({id:i(),name:"Export"});return{rootId:s.id,nodes:[{...s,children:r.map(a=>a.rootId)},...r.flatMap(a=>a.nodes)]}}function uf(n,e){const t=new Set(e);return e.filter(i=>!n.ancestorsOf(i).some(r=>t.has(r)))}function df(n,e){return!e||e.length===0?[n.rootId]:uf(n,e)}function hf(n,e,t){const i=n.bundle(e);let r=i.rootId;const s=[];for(const a of[...n.ancestorsOf(e)].reverse()){const o=n.expect(a);if(o.kind!=="transform")continue;const c=Fd({id:t(),name:o.name,transform:o.transform,children:[r]});s.push(c),r=c.id}return{rootId:r,nodes:[...s.reverse(),...i.nodes]}}function ff(n){let e=0;return()=>{let t=`${Cc}${e+=1}`;for(;n.has(t);)t=`${Cc}${e+=1}`;return t}}function pf(n,e){const t=e.length===1?e[0]:void 0;if(t!==void 0&&t!==n.rootId){const i=n.get(t);if(i&&i.kind==="transform"){const r=gn(i),s=r.length===1?n.get(r[0]??""):void 0;if(s)return s.name}if(i)return i.name}return n.expect(n.rootId).name}function Pu(n){return{id:n.id,name:n.name,savedAt:n.savedAt,nodeCount:n.nodeCount}}function Iu(n,e){return n.savedAt!==e.savedAt?e.savedAt-n.savedAt:n.id<e.id?-1:n.id>e.id?1:0}class Pc{#e=new Map;put(e){return this.#e.set(e.id,Ic(e)),Promise.resolve()}get(e){const t=this.#e.get(e);return Promise.resolve(t?Ic(t):null)}list(){return Promise.resolve([...this.#e.values()].map(Pu).sort(Iu))}delete(e){return this.#e.delete(e),Promise.resolve()}async prune(e){const t=(await this.list()).slice(Math.max(0,e)).map(i=>i.id);for(const i of t)this.#e.delete(i);return t}close(){this.#e.clear()}}function Ic(n){return structuredClone(n)}const mf="carve",gf=1,qt="documents",Lu="savedAt";async function _f(n={}){const e=n.factory??globalThis.indexedDB;if(!e)return{store:new Pc,persistent:!1,reason:"This browser exposes no IndexedDB. Autosave will not survive a reload."};try{const t=await vf(e,n.databaseName??mf);return{store:new xf(t),persistent:!0}}catch(t){return{store:new Pc,persistent:!1,reason:`Could not open the autosave database (${Mf(t)}). Autosave will not survive a reload.`}}}class xf{#e;constructor(e){this.#e=e}async put(e){const t=this.#e.transaction(qt,"readwrite"),i=js(t);t.objectStore(qt).put(e),await i}async get(e){const t=this.#e.transaction(qt,"readonly");return await Lc(t.objectStore(qt).get(e))??null}async list(){const e=this.#e.transaction(qt,"readonly");return(await Lc(e.objectStore(qt).index(Lu).getAll())).map(Pu).sort(Iu)}async delete(e){const t=this.#e.transaction(qt,"readwrite"),i=js(t);t.objectStore(qt).delete(e),await i}async prune(e){const i=(await this.list()).slice(Math.max(0,e)).map(o=>o.id);if(i.length===0)return i;const r=this.#e.transaction(qt,"readwrite"),s=js(r),a=r.objectStore(qt);for(const o of i)a.delete(o);return await s,i}close(){this.#e.close()}}function vf(n,e){return new Promise((t,i)=>{const r=n.open(e,gf);r.onupgradeneeded=()=>{const s=r.result;s.objectStoreNames.contains(qt)||s.createObjectStore(qt,{keyPath:"id"}).createIndex(Lu,"savedAt")},r.onsuccess=()=>{const s=r.result;s.onversionchange=()=>s.close(),t(s)},r.onerror=()=>i(vs(r,"open the database")),r.onblocked=()=>i(new Error("The autosave database is blocked by another tab holding an old version"))})}function Lc(n){return new Promise((e,t)=>{n.onsuccess=()=>e(n.result),n.onerror=()=>t(vs(n,"read from the database"))})}function js(n){return new Promise((e,t)=>{n.oncomplete=()=>e(),n.onerror=()=>t(vs(n,"write to the database")),n.onabort=()=>t(vs(n,"write to the database"))})}function vs(n,e){const t=n.error?`: ${n.error.name} ${n.error.message}`:"";return new Error(`Could not ${e}${t}`)}function Mf(n){return n instanceof Error?n.message:String(n)}const Sf=2e3,Ef=15e3,yf=10;function bf(n=Date.now){const e=n().toString(36).padStart(9,"0"),t=Math.floor(Math.random()*16777215).toString(16).padStart(6,"0");return`doc-${e}-${t}`}function Tf(n){return mu(n.document)}async function Af(n,e=()=>{}){for(const t of await n.list()){const i=await n.get(t.id);if(i)try{return{record:i,document:Tf(i)}}catch(r){e(r,t.id)}}return null}class $o{#e;#t;#n;#i;#r;#s;#a;#o;#u;#c=null;#l=null;#d=null;#h=null;#p=null;#f=!1;constructor(e,t,i){this.#e=e,this.#t=t,this.#n={debounceMs:i.debounceMs??Sf,maxDelayMs:i.maxDelayMs??Ef,maxRecent:i.maxRecent??yf,now:i.now??Date.now},this.#i=i.id??bf(this.#n.now),this.#r=i.name,this.#s=i.setTimer??((r,s)=>setTimeout(r,s)),this.#a=i.clearTimer??(r=>clearTimeout(r)),this.#o=i.onError??(r=>{console.warn("Autosave failed; the document is still only in memory.",r)}),this.#u=i.onSave}static attach(e,t,i={}){const r=new $o(e,t,i);return r.#c=e.subscribe(s=>{if(s.gesturePhase==="update"){r.#g();return}r.#g(),r.#_()}),r}get id(){return this.#i}get lastSavedAt(){return this.#p}get dirty(){return this.#d!==null}async flush(){this.#x(),this.#h&&await this.#h,!(!this.dirty||this.#f)&&await this.#m()}stop(){this.#f=!0,this.#x(),this.#c?.(),this.#c=null}#g(){this.#d??=this.#n.now()}#_(){if(this.#f)return;const e=this.#d??this.#n.now(),t=this.#n.now()-e,i=Math.max(0,Math.min(this.#n.debounceMs,this.#n.maxDelayMs-t));this.#x(),this.#l=this.#s(()=>{this.#l=null,this.#m()},i)}async#m(){if(this.#h){this.#_();return}if(!this.dirty||this.#f)return;const e=this.#n.now(),t=pu(this.#e),i={id:this.#i,name:this.#r??this.#e.expect(this.#e.rootId).name,savedAt:e,nodeCount:t.nodes.length,document:t};this.#d=null;const r=(async()=>{try{await this.#t.put(i),await this.#t.prune(this.#n.maxRecent),this.#p=e,this.#u?.(i)}catch(s){this.#d??=e,this.#o(s)}})();this.#h=r;try{await r}finally{this.#h=null}}#x(){this.#l!==null&&(this.#a(this.#l),this.#l=null)}}function wf(){return{document:globalThis.document,url:URL,blob:Blob}}function Dc(n,e=wf()){const t=new e.blob([n.bytes],{type:n.mimeType}),i=e.url.createObjectURL(t),r=e.document.createElement("a");r.href=i,r.download=n.fileName,e.document.body.appendChild(r),r.click(),r.remove(),setTimeout(()=>e.url.revokeObjectURL(i),0)}async function Du(n){return Lh(await n.text())}const Rf=".carve,application/vnd.carve+json";function Cf(n,e){let t=0;const i=c=>{e.onDragStateChange?.(c)},r=c=>{c.preventDefault(),t+=1,t===1&&i(!0)},s=c=>{c.preventDefault(),c.dataTransfer&&(c.dataTransfer.dropEffect="copy")},a=c=>{c.preventDefault(),t=Math.max(0,t-1),t===0&&i(!1)},o=c=>{c.preventDefault(),t=0,i(!1);const l=c.dataTransfer?.files.item(0)??null;if(!l){e.onError?.(new Error("That drop contained no file"),null);return}Du(l).then(h=>e.onDocument(h,l),h=>e.onError?.(h,l))};return n.addEventListener("dragenter",r),n.addEventListener("dragover",s),n.addEventListener("dragleave",a),n.addEventListener("drop",o),()=>{n.removeEventListener("dragenter",r),n.removeEventListener("dragover",s),n.removeEventListener("dragleave",a),n.removeEventListener("drop",o)}}function Pf(n,e=globalThis.document){const t=()=>{n()},i=()=>{(e.visibilityState===void 0||e.visibilityState==="hidden")&&n()};return e.addEventListener("pagehide",t),e.addEventListener("visibilitychange",i),()=>{e.removeEventListener("pagehide",t),e.removeEventListener("visibilitychange",i)}}const If="io";function Lf(n){return new Worker(""+new URL("worker-YW2OHQcz.js",import.meta.url).href,{type:"module",name:n?.name})}function Df(){return new Oh(new Lf)}const qo="185",Nf=0,Nc=1,Uf=2,ls=1,Ff=2,ar=3,Zn=0,Ut=1,Rn=2,In=0,Oi=1,Uc=2,Fc=3,Oc=4,Of=5,si=100,Bf=101,zf=102,Gf=103,kf=104,Vf=200,Hf=201,Wf=202,Xf=203,Ka=204,Za=205,Yf=206,$f=207,qf=208,Kf=209,Zf=210,Jf=211,Qf=212,jf=213,ep=214,Ja=0,Qa=1,ja=2,Vi=3,eo=4,to=5,no=6,io=7,Nu=0,tp=1,np=2,xn=0,Uu=1,Fu=2,Ou=3,Bu=4,zu=5,Gu=6,ku=7,Vu=300,fi=301,Hi=302,ea=303,ta=304,Fs=306,ro=1e3,Cn=1001,so=1002,Tt=1003,ip=1004,Pr=1005,Pt=1006,na=1007,li=1008,Jt=1009,Hu=1010,Wu=1011,gr=1012,Ko=1013,Sn=1014,pn=1015,Un=1016,Zo=1017,Jo=1018,_r=1020,Xu=35902,Yu=35899,$u=1021,qu=1022,sn=1023,Fn=1026,ui=1027,Ku=1028,Qo=1029,pi=1030,jo=1031,ec=1033,us=33776,ds=33777,hs=33778,fs=33779,ao=35840,oo=35841,co=35842,lo=35843,uo=36196,ho=37492,fo=37496,po=37488,mo=37489,Ms=37490,go=37491,_o=37808,xo=37809,vo=37810,Mo=37811,So=37812,Eo=37813,yo=37814,bo=37815,To=37816,Ao=37817,wo=37818,Ro=37819,Co=37820,Po=37821,Io=36492,Lo=36494,Do=36495,No=36283,Uo=36284,Ss=36285,Fo=36286,rp=3200,Bc=0,sp=1,$n="",Kt="srgb",Es="srgb-linear",ys="linear",Ze="srgb",vi=7680,zc=519,ap=512,op=513,cp=514,tc=515,lp=516,up=517,nc=518,dp=519,Oo=35044,Gc="300 es",mn=2e3,bs=2001;function hp(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Ts(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function fp(){const n=Ts("canvas");return n.style.display="block",n}const kc={};function As(...n){const e="THREE."+n.shift();console.log(e,...n)}function Zu(n){const e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function Ce(...n){n=Zu(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function We(...n){n=Zu(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function Bi(...n){const e=n.join(" ");e in kc||(kc[e]=!0,Ce(...n))}function pp(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}const mp={[Ja]:Qa,[ja]:no,[eo]:io,[Vi]:to,[Qa]:Ja,[no]:ja,[io]:eo,[to]:Vi};class gi{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){const i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){const i=this._listeners;if(i===void 0)return;const r=i[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const i=t[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const Rt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Vc=1234567;const zi=Math.PI/180,xr=180/Math.PI;function Ln(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Rt[n&255]+Rt[n>>8&255]+Rt[n>>16&255]+Rt[n>>24&255]+"-"+Rt[e&255]+Rt[e>>8&255]+"-"+Rt[e>>16&15|64]+Rt[e>>24&255]+"-"+Rt[t&63|128]+Rt[t>>8&255]+"-"+Rt[t>>16&255]+Rt[t>>24&255]+Rt[i&255]+Rt[i>>8&255]+Rt[i>>16&255]+Rt[i>>24&255]).toLowerCase()}function ze(n,e,t){return Math.max(e,Math.min(t,n))}function ic(n,e){return(n%e+e)%e}function gp(n,e,t,i,r){return i+(n-e)*(r-i)/(t-e)}function _p(n,e,t){return n!==e?(t-n)/(e-n):0}function ur(n,e,t){return(1-t)*n+t*e}function xp(n,e,t,i){return ur(n,e,1-Math.exp(-t*i))}function vp(n,e=1){return e-Math.abs(ic(n,e*2)-e)}function Mp(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function Sp(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function Ep(n,e){return n+Math.floor(Math.random()*(e-n+1))}function yp(n,e){return n+Math.random()*(e-n)}function bp(n){return n*(.5-Math.random())}function Tp(n){n!==void 0&&(Vc=n);let e=Vc+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Ap(n){return n*zi}function wp(n){return n*xr}function Rp(n){return(n&n-1)===0&&n!==0}function Cp(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function Pp(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function Ip(n,e,t,i,r){const s=Math.cos,a=Math.sin,o=s(t/2),c=a(t/2),l=s((e+i)/2),h=a((e+i)/2),p=s((e-i)/2),u=a((e-i)/2),m=s((i-e)/2),g=a((i-e)/2);switch(r){case"XYX":n.set(o*h,c*p,c*u,o*l);break;case"YZY":n.set(c*u,o*h,c*p,o*l);break;case"ZXZ":n.set(c*p,c*u,o*h,o*l);break;case"XZX":n.set(o*h,c*g,c*m,o*l);break;case"YXY":n.set(c*m,o*h,c*g,o*l);break;case"ZYZ":n.set(c*g,c*m,o*h,o*l);break;default:Ce("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function rn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Je(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const Ir={DEG2RAD:zi,RAD2DEG:xr,generateUUID:Ln,clamp:ze,euclideanModulo:ic,mapLinear:gp,inverseLerp:_p,lerp:ur,damp:xp,pingpong:vp,smoothstep:Mp,smootherstep:Sp,randInt:Ep,randFloat:yp,randFloatSpread:bp,seededRandom:Tp,degToRad:Ap,radToDeg:wp,isPowerOfTwo:Rp,ceilPowerOfTwo:Cp,floorPowerOfTwo:Pp,setQuaternionFromProperEuler:Ip,normalize:Je,denormalize:rn};class Ye{static{Ye.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=ze(this.x,e.x,t.x),this.y=ze(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=ze(this.x,e,t),this.y=ze(this.y,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(ze(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(ze(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*r+e.x,this.y=s*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class qi{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,a,o){let c=i[r+0],l=i[r+1],h=i[r+2],p=i[r+3],u=s[a+0],m=s[a+1],g=s[a+2],v=s[a+3];if(p!==v||c!==u||l!==m||h!==g){let f=c*u+l*m+h*g+p*v;f<0&&(u=-u,m=-m,g=-g,v=-v,f=-f);let d=1-o;if(f<.9995){const E=Math.acos(f),A=Math.sin(E);d=Math.sin(d*E)/A,o=Math.sin(o*E)/A,c=c*d+u*o,l=l*d+m*o,h=h*d+g*o,p=p*d+v*o}else{c=c*d+u*o,l=l*d+m*o,h=h*d+g*o,p=p*d+v*o;const E=1/Math.sqrt(c*c+l*l+h*h+p*p);c*=E,l*=E,h*=E,p*=E}}e[t]=c,e[t+1]=l,e[t+2]=h,e[t+3]=p}static multiplyQuaternionsFlat(e,t,i,r,s,a){const o=i[r],c=i[r+1],l=i[r+2],h=i[r+3],p=s[a],u=s[a+1],m=s[a+2],g=s[a+3];return e[t]=o*g+h*p+c*m-l*u,e[t+1]=c*g+h*u+l*p-o*m,e[t+2]=l*g+h*m+o*u-c*p,e[t+3]=h*g-o*p-c*u-l*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,c=Math.sin,l=o(i/2),h=o(r/2),p=o(s/2),u=c(i/2),m=c(r/2),g=c(s/2);switch(a){case"XYZ":this._x=u*h*p+l*m*g,this._y=l*m*p-u*h*g,this._z=l*h*g+u*m*p,this._w=l*h*p-u*m*g;break;case"YXZ":this._x=u*h*p+l*m*g,this._y=l*m*p-u*h*g,this._z=l*h*g-u*m*p,this._w=l*h*p+u*m*g;break;case"ZXY":this._x=u*h*p-l*m*g,this._y=l*m*p+u*h*g,this._z=l*h*g+u*m*p,this._w=l*h*p-u*m*g;break;case"ZYX":this._x=u*h*p-l*m*g,this._y=l*m*p+u*h*g,this._z=l*h*g-u*m*p,this._w=l*h*p+u*m*g;break;case"YZX":this._x=u*h*p+l*m*g,this._y=l*m*p+u*h*g,this._z=l*h*g-u*m*p,this._w=l*h*p-u*m*g;break;case"XZY":this._x=u*h*p-l*m*g,this._y=l*m*p-u*h*g,this._z=l*h*g+u*m*p,this._w=l*h*p+u*m*g;break;default:Ce("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],r=t[4],s=t[8],a=t[1],o=t[5],c=t[9],l=t[2],h=t[6],p=t[10],u=i+o+p;if(u>0){const m=.5/Math.sqrt(u+1);this._w=.25/m,this._x=(h-c)*m,this._y=(s-l)*m,this._z=(a-r)*m}else if(i>o&&i>p){const m=2*Math.sqrt(1+i-o-p);this._w=(h-c)/m,this._x=.25*m,this._y=(r+a)/m,this._z=(s+l)/m}else if(o>p){const m=2*Math.sqrt(1+o-i-p);this._w=(s-l)/m,this._x=(r+a)/m,this._y=.25*m,this._z=(c+h)/m}else{const m=2*Math.sqrt(1+p-i-o);this._w=(a-r)/m,this._x=(s+l)/m,this._y=(c+h)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ze(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,r=e._y,s=e._z,a=e._w,o=t._x,c=t._y,l=t._z,h=t._w;return this._x=i*h+a*o+r*l-s*c,this._y=r*h+a*c+s*o-i*l,this._z=s*h+a*l+i*c-r*o,this._w=a*h-i*o-r*c-s*l,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,o=this.dot(e);o<0&&(i=-i,r=-r,s=-s,a=-a,o=-o);let c=1-t;if(o<.9995){const l=Math.acos(o),h=Math.sin(l);c=Math.sin(c*l)/h,t=Math.sin(t*l)/h,this._x=this._x*c+i*t,this._y=this._y*c+r*t,this._z=this._z*c+s*t,this._w=this._w*c+a*t,this._onChangeCallback()}else this._x=this._x*c+i*t,this._y=this._y*c+r*t,this._z=this._z*c+s*t,this._w=this._w*c+a*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class U{static{U.prototype.isVector3=!0}constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Hc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Hc.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*a,this}applyQuaternion(e){const t=this.x,i=this.y,r=this.z,s=e.x,a=e.y,o=e.z,c=e.w,l=2*(a*r-o*i),h=2*(o*t-s*r),p=2*(s*i-a*t);return this.x=t+c*l+a*p-o*h,this.y=i+c*h+o*l-s*p,this.z=r+c*p+s*h-a*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=ze(this.x,e.x,t.x),this.y=ze(this.y,e.y,t.y),this.z=ze(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=ze(this.x,e,t),this.y=ze(this.y,e,t),this.z=ze(this.z,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(ze(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,r=e.y,s=e.z,a=t.x,o=t.y,c=t.z;return this.x=r*c-s*o,this.y=s*a-i*c,this.z=i*o-r*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return ia.copy(this).projectOnVector(e),this.sub(ia)}reflect(e){return this.sub(ia.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(ze(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const ia=new U,Hc=new qi;class Ie{static{Ie.prototype.isMatrix3=!0}constructor(e,t,i,r,s,a,o,c,l){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,c,l)}set(e,t,i,r,s,a,o,c,l){const h=this.elements;return h[0]=e,h[1]=r,h[2]=o,h[3]=t,h[4]=s,h[5]=c,h[6]=i,h[7]=a,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[3],c=i[6],l=i[1],h=i[4],p=i[7],u=i[2],m=i[5],g=i[8],v=r[0],f=r[3],d=r[6],E=r[1],A=r[4],S=r[7],w=r[2],b=r[5],R=r[8];return s[0]=a*v+o*E+c*w,s[3]=a*f+o*A+c*b,s[6]=a*d+o*S+c*R,s[1]=l*v+h*E+p*w,s[4]=l*f+h*A+p*b,s[7]=l*d+h*S+p*R,s[2]=u*v+m*E+g*w,s[5]=u*f+m*A+g*b,s[8]=u*d+m*S+g*R,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],c=e[6],l=e[7],h=e[8];return t*a*h-t*o*l-i*s*h+i*o*c+r*s*l-r*a*c}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],c=e[6],l=e[7],h=e[8],p=h*a-o*l,u=o*c-h*s,m=l*s-a*c,g=t*p+i*u+r*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/g;return e[0]=p*v,e[1]=(r*l-h*i)*v,e[2]=(o*i-r*a)*v,e[3]=u*v,e[4]=(h*t-r*c)*v,e[5]=(r*s-o*t)*v,e[6]=m*v,e[7]=(i*c-l*t)*v,e[8]=(a*t-i*s)*v,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,a,o){const c=Math.cos(s),l=Math.sin(s);return this.set(i*c,i*l,-i*(c*a+l*o)+a+e,-r*l,r*c,-r*(-l*a+c*o)+o+t,0,0,1),this}scale(e,t){return Bi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(ra.makeScale(e,t)),this}rotate(e){return Bi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(ra.makeRotation(-e)),this}translate(e,t){return Bi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(ra.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const ra=new Ie,Wc=new Ie().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Xc=new Ie().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Lp(){const n={enabled:!0,workingColorSpace:Es,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===Ze&&(r.r=Dn(r.r),r.g=Dn(r.g),r.b=Dn(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===Ze&&(r.r=Gi(r.r),r.g=Gi(r.g),r.b=Gi(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===$n?ys:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Bi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Bi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[Es]:{primaries:e,whitePoint:i,transfer:ys,toXYZ:Wc,fromXYZ:Xc,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Kt},outputColorSpaceConfig:{drawingBufferColorSpace:Kt}},[Kt]:{primaries:e,whitePoint:i,transfer:Ze,toXYZ:Wc,fromXYZ:Xc,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Kt}}}),n}const ke=Lp();function Dn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Gi(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let Mi;class Dp{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Mi===void 0&&(Mi=Ts("canvas")),Mi.width=e.width,Mi.height=e.height;const r=Mi.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Mi}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Ts("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Dn(s[a]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Dn(t[i]/255)*255):t[i]=Dn(t[i]);return{data:t,width:e.width,height:e.height}}else return Ce("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Np=0;class rc{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Np++}),this.uuid=Ln(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(sa(r[a].image)):s.push(sa(r[a]))}else s=sa(r);i.url=s}return t||(e.images[this.uuid]=i),i}}function sa(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Dp.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Ce("Texture: Unable to serialize Texture."),{})}let Up=0;const aa=new U;class Ft extends gi{constructor(e=Ft.DEFAULT_IMAGE,t=Ft.DEFAULT_MAPPING,i=Cn,r=Cn,s=Pt,a=li,o=sn,c=Jt,l=Ft.DEFAULT_ANISOTROPY,h=$n){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Up++}),this.uuid=Ln(),this.name="",this.source=new rc(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new Ye(0,0),this.repeat=new Ye(1,1),this.center=new Ye(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ie,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(aa).x}get height(){return this.source.getSize(aa).y}get depth(){return this.source.getSize(aa).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const i=e[t];if(i===void 0){Ce(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ce(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Vu)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case ro:e.x=e.x-Math.floor(e.x);break;case Cn:e.x=e.x<0?0:1;break;case so:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case ro:e.y=e.y-Math.floor(e.y);break;case Cn:e.y=e.y<0?0:1;break;case so:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Ft.DEFAULT_IMAGE=null;Ft.DEFAULT_MAPPING=Vu;Ft.DEFAULT_ANISOTROPY=1;class lt{static{lt.prototype.isVector4=!0}constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*i+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*i+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*i+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s;const c=e.elements,l=c[0],h=c[4],p=c[8],u=c[1],m=c[5],g=c[9],v=c[2],f=c[6],d=c[10];if(Math.abs(h-u)<.01&&Math.abs(p-v)<.01&&Math.abs(g-f)<.01){if(Math.abs(h+u)<.1&&Math.abs(p+v)<.1&&Math.abs(g+f)<.1&&Math.abs(l+m+d-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const A=(l+1)/2,S=(m+1)/2,w=(d+1)/2,b=(h+u)/4,R=(p+v)/4,x=(g+f)/4;return A>S&&A>w?A<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(A),r=b/i,s=R/i):S>w?S<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(S),i=b/r,s=x/r):w<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(w),i=R/s,r=x/s),this.set(i,r,s,t),this}let E=Math.sqrt((f-g)*(f-g)+(p-v)*(p-v)+(u-h)*(u-h));return Math.abs(E)<.001&&(E=1),this.x=(f-g)/E,this.y=(p-v)/E,this.z=(u-h)/E,this.w=Math.acos((l+m+d-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=ze(this.x,e.x,t.x),this.y=ze(this.y,e.y,t.y),this.z=ze(this.z,e.z,t.z),this.w=ze(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=ze(this.x,e,t),this.y=ze(this.y,e,t),this.z=ze(this.z,e,t),this.w=ze(this.w,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(ze(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Fp extends gi{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Pt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new lt(0,0,e,t),this.scissorTest=!1,this.viewport=new lt(0,0,e,t),this.textures=[];const r={width:e,height:t,depth:i.depth},s=new Ft(r),a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:Pt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new rc(r)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class vn extends Fp{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class Ju extends Ft{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Tt,this.minFilter=Tt,this.wrapR=Cn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Op extends Ft{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Tt,this.minFilter=Tt,this.wrapR=Cn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Qe{static{Qe.prototype.isMatrix4=!0}constructor(e,t,i,r,s,a,o,c,l,h,p,u,m,g,v,f){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,c,l,h,p,u,m,g,v,f)}set(e,t,i,r,s,a,o,c,l,h,p,u,m,g,v,f){const d=this.elements;return d[0]=e,d[4]=t,d[8]=i,d[12]=r,d[1]=s,d[5]=a,d[9]=o,d[13]=c,d[2]=l,d[6]=h,d[10]=p,d[14]=u,d[3]=m,d[7]=g,d[11]=v,d[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Qe().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,i=e.elements,r=1/Si.setFromMatrixColumn(e,0).length(),s=1/Si.setFromMatrixColumn(e,1).length(),a=1/Si.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,r=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),c=Math.cos(r),l=Math.sin(r),h=Math.cos(s),p=Math.sin(s);if(e.order==="XYZ"){const u=a*h,m=a*p,g=o*h,v=o*p;t[0]=c*h,t[4]=-c*p,t[8]=l,t[1]=m+g*l,t[5]=u-v*l,t[9]=-o*c,t[2]=v-u*l,t[6]=g+m*l,t[10]=a*c}else if(e.order==="YXZ"){const u=c*h,m=c*p,g=l*h,v=l*p;t[0]=u+v*o,t[4]=g*o-m,t[8]=a*l,t[1]=a*p,t[5]=a*h,t[9]=-o,t[2]=m*o-g,t[6]=v+u*o,t[10]=a*c}else if(e.order==="ZXY"){const u=c*h,m=c*p,g=l*h,v=l*p;t[0]=u-v*o,t[4]=-a*p,t[8]=g+m*o,t[1]=m+g*o,t[5]=a*h,t[9]=v-u*o,t[2]=-a*l,t[6]=o,t[10]=a*c}else if(e.order==="ZYX"){const u=a*h,m=a*p,g=o*h,v=o*p;t[0]=c*h,t[4]=g*l-m,t[8]=u*l+v,t[1]=c*p,t[5]=v*l+u,t[9]=m*l-g,t[2]=-l,t[6]=o*c,t[10]=a*c}else if(e.order==="YZX"){const u=a*c,m=a*l,g=o*c,v=o*l;t[0]=c*h,t[4]=v-u*p,t[8]=g*p+m,t[1]=p,t[5]=a*h,t[9]=-o*h,t[2]=-l*h,t[6]=m*p+g,t[10]=u-v*p}else if(e.order==="XZY"){const u=a*c,m=a*l,g=o*c,v=o*l;t[0]=c*h,t[4]=-p,t[8]=l*h,t[1]=u*p+v,t[5]=a*h,t[9]=m*p-g,t[2]=g*p-m,t[6]=o*h,t[10]=v*p+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Bp,e,zp)}lookAt(e,t,i){const r=this.elements;return Wt.subVectors(e,t),Wt.lengthSq()===0&&(Wt.z=1),Wt.normalize(),kn.crossVectors(i,Wt),kn.lengthSq()===0&&(Math.abs(i.z)===1?Wt.x+=1e-4:Wt.z+=1e-4,Wt.normalize(),kn.crossVectors(i,Wt)),kn.normalize(),Lr.crossVectors(Wt,kn),r[0]=kn.x,r[4]=Lr.x,r[8]=Wt.x,r[1]=kn.y,r[5]=Lr.y,r[9]=Wt.y,r[2]=kn.z,r[6]=Lr.z,r[10]=Wt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[4],c=i[8],l=i[12],h=i[1],p=i[5],u=i[9],m=i[13],g=i[2],v=i[6],f=i[10],d=i[14],E=i[3],A=i[7],S=i[11],w=i[15],b=r[0],R=r[4],x=r[8],y=r[12],I=r[1],C=r[5],F=r[9],$=r[13],q=r[2],z=r[6],Y=r[10],X=r[14],P=r[3],Z=r[7],ne=r[11],ie=r[15];return s[0]=a*b+o*I+c*q+l*P,s[4]=a*R+o*C+c*z+l*Z,s[8]=a*x+o*F+c*Y+l*ne,s[12]=a*y+o*$+c*X+l*ie,s[1]=h*b+p*I+u*q+m*P,s[5]=h*R+p*C+u*z+m*Z,s[9]=h*x+p*F+u*Y+m*ne,s[13]=h*y+p*$+u*X+m*ie,s[2]=g*b+v*I+f*q+d*P,s[6]=g*R+v*C+f*z+d*Z,s[10]=g*x+v*F+f*Y+d*ne,s[14]=g*y+v*$+f*X+d*ie,s[3]=E*b+A*I+S*q+w*P,s[7]=E*R+A*C+S*z+w*Z,s[11]=E*x+A*F+S*Y+w*ne,s[15]=E*y+A*$+S*X+w*ie,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],a=e[1],o=e[5],c=e[9],l=e[13],h=e[2],p=e[6],u=e[10],m=e[14],g=e[3],v=e[7],f=e[11],d=e[15],E=c*m-l*u,A=o*m-l*p,S=o*u-c*p,w=a*m-l*h,b=a*u-c*h,R=a*p-o*h;return t*(v*E-f*A+d*S)-i*(g*E-f*w+d*b)+r*(g*A-v*w+d*R)-s*(g*S-v*b+f*R)}determinantAffine(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[1],a=e[5],o=e[9],c=e[2],l=e[6],h=e[10];return t*(a*h-o*l)-i*(s*h-o*c)+r*(s*l-a*c)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],c=e[6],l=e[7],h=e[8],p=e[9],u=e[10],m=e[11],g=e[12],v=e[13],f=e[14],d=e[15],E=t*o-i*a,A=t*c-r*a,S=t*l-s*a,w=i*c-r*o,b=i*l-s*o,R=r*l-s*c,x=h*v-p*g,y=h*f-u*g,I=h*d-m*g,C=p*f-u*v,F=p*d-m*v,$=u*d-m*f,q=E*$-A*F+S*C+w*I-b*y+R*x;if(q===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const z=1/q;return e[0]=(o*$-c*F+l*C)*z,e[1]=(r*F-i*$-s*C)*z,e[2]=(v*R-f*b+d*w)*z,e[3]=(u*b-p*R-m*w)*z,e[4]=(c*I-a*$-l*y)*z,e[5]=(t*$-r*I+s*y)*z,e[6]=(f*S-g*R-d*A)*z,e[7]=(h*R-u*S+m*A)*z,e[8]=(a*F-o*I+l*x)*z,e[9]=(i*I-t*F-s*x)*z,e[10]=(g*b-v*S+d*E)*z,e[11]=(p*S-h*b-m*E)*z,e[12]=(o*y-a*C-c*x)*z,e[13]=(t*C-i*y+r*x)*z,e[14]=(v*A-g*w-f*E)*z,e[15]=(h*w-p*A+u*E)*z,this}scale(e){const t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),r=Math.sin(t),s=1-i,a=e.x,o=e.y,c=e.z,l=s*a,h=s*o;return this.set(l*a+i,l*o-r*c,l*c+r*o,0,l*o+r*c,h*o+i,h*c-r*a,0,l*c-r*o,h*c+r*a,s*c*c+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,a){return this.set(1,i,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){const r=this.elements,s=t._x,a=t._y,o=t._z,c=t._w,l=s+s,h=a+a,p=o+o,u=s*l,m=s*h,g=s*p,v=a*h,f=a*p,d=o*p,E=c*l,A=c*h,S=c*p,w=i.x,b=i.y,R=i.z;return r[0]=(1-(v+d))*w,r[1]=(m+S)*w,r[2]=(g-A)*w,r[3]=0,r[4]=(m-S)*b,r[5]=(1-(u+d))*b,r[6]=(f+E)*b,r[7]=0,r[8]=(g+A)*R,r[9]=(f-E)*R,r[10]=(1-(u+v))*R,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){const r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];const s=this.determinantAffine();if(s===0)return i.set(1,1,1),t.identity(),this;let a=Si.set(r[0],r[1],r[2]).length();const o=Si.set(r[4],r[5],r[6]).length(),c=Si.set(r[8],r[9],r[10]).length();s<0&&(a=-a),en.copy(this);const l=1/a,h=1/o,p=1/c;return en.elements[0]*=l,en.elements[1]*=l,en.elements[2]*=l,en.elements[4]*=h,en.elements[5]*=h,en.elements[6]*=h,en.elements[8]*=p,en.elements[9]*=p,en.elements[10]*=p,t.setFromRotationMatrix(en),i.x=a,i.y=o,i.z=c,this}makePerspective(e,t,i,r,s,a,o=mn,c=!1){const l=this.elements,h=2*s/(t-e),p=2*s/(i-r),u=(t+e)/(t-e),m=(i+r)/(i-r);let g,v;if(c)g=s/(a-s),v=a*s/(a-s);else if(o===mn)g=-(a+s)/(a-s),v=-2*a*s/(a-s);else if(o===bs)g=-a/(a-s),v=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=p,l[9]=m,l[13]=0,l[2]=0,l[6]=0,l[10]=g,l[14]=v,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,r,s,a,o=mn,c=!1){const l=this.elements,h=2/(t-e),p=2/(i-r),u=-(t+e)/(t-e),m=-(i+r)/(i-r);let g,v;if(c)g=1/(a-s),v=a/(a-s);else if(o===mn)g=-2/(a-s),v=-(a+s)/(a-s);else if(o===bs)g=-1/(a-s),v=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=0,l[12]=u,l[1]=0,l[5]=p,l[9]=0,l[13]=m,l[2]=0,l[6]=0,l[10]=g,l[14]=v,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const Si=new U,en=new Qe,Bp=new U(0,0,0),zp=new U(1,1,1),kn=new U,Lr=new U,Wt=new U,Yc=new Qe,$c=new qi;class mi{constructor(e=0,t=0,i=0,r=mi.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],c=r[1],l=r[5],h=r[9],p=r[2],u=r[6],m=r[10];switch(t){case"XYZ":this._y=Math.asin(ze(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,m),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(u,l),this._z=0);break;case"YXZ":this._x=Math.asin(-ze(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-p,s),this._z=0);break;case"ZXY":this._x=Math.asin(ze(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-p,m),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-ze(p,-1,1)),Math.abs(p)<.9999999?(this._x=Math.atan2(u,m),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(ze(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-p,s)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-ze(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,l),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-h,m),this._y=0);break;default:Ce("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Yc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Yc,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return $c.setFromEuler(this),this.setFromQuaternion($c,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}mi.DEFAULT_ORDER="XYZ";class Qu{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Gp=0;const qc=new U,Ei=new qi,yn=new Qe,Dr=new U,Ji=new U,kp=new U,Vp=new qi,Kc=new U(1,0,0),Zc=new U(0,1,0),Jc=new U(0,0,1),Qc={type:"added"},Hp={type:"removed"},yi={type:"childadded",child:null},oa={type:"childremoved",child:null};class kt extends gi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Gp++}),this.uuid=Ln(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=kt.DEFAULT_UP.clone();const e=new U,t=new mi,i=new qi,r=new U(1,1,1);function s(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new Qe},normalMatrix:{value:new Ie}}),this.matrix=new Qe,this.matrixWorld=new Qe,this.matrixAutoUpdate=kt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=kt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Qu,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ei.setFromAxisAngle(e,t),this.quaternion.multiply(Ei),this}rotateOnWorldAxis(e,t){return Ei.setFromAxisAngle(e,t),this.quaternion.premultiply(Ei),this}rotateX(e){return this.rotateOnAxis(Kc,e)}rotateY(e){return this.rotateOnAxis(Zc,e)}rotateZ(e){return this.rotateOnAxis(Jc,e)}translateOnAxis(e,t){return qc.copy(e).applyQuaternion(this.quaternion),this.position.add(qc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Kc,e)}translateY(e){return this.translateOnAxis(Zc,e)}translateZ(e){return this.translateOnAxis(Jc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(yn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Dr.copy(e):Dr.set(e,t,i);const r=this.parent;this.updateWorldMatrix(!0,!1),Ji.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?yn.lookAt(Ji,Dr,this.up):yn.lookAt(Dr,Ji,this.up),this.quaternion.setFromRotationMatrix(yn),r&&(yn.extractRotation(r.matrixWorld),Ei.setFromRotationMatrix(yn),this.quaternion.premultiply(Ei.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(We("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Qc),yi.child=e,this.dispatchEvent(yi),yi.child=null):We("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Hp),oa.child=e,this.dispatchEvent(oa),oa.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),yn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),yn.multiply(e.parent.matrixWorld)),e.applyMatrix4(yn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Qc),yi.child=e,this.dispatchEvent(yi),yi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){const a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ji,e,kp),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ji,Vp,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*i-s[8]*r,s[13]+=i-s[1]*t-s[5]*i-s[9]*r,s[14]+=r-s[2]*t-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){const r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].updateWorldMatrix(!1,!0,i)}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),this.static!==!1&&(r.static=this.static),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){const p=c[l];s(e.shapes,p)}else s(e.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(s(e.materials,this.material[c]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];r.animations.push(s(e.animations,c))}}if(t){const o=a(e.geometries),c=a(e.materials),l=a(e.textures),h=a(e.images),p=a(e.shapes),u=a(e.skeletons),m=a(e.animations),g=a(e.nodes);o.length>0&&(i.geometries=o),c.length>0&&(i.materials=c),l.length>0&&(i.textures=l),h.length>0&&(i.images=h),p.length>0&&(i.shapes=p),u.length>0&&(i.skeletons=u),m.length>0&&(i.animations=m),g.length>0&&(i.nodes=g)}return i.object=r,i;function a(o){const c=[];for(const l in o){const h=o[l];delete h.metadata,c.push(h)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}}kt.DEFAULT_UP=new U(0,1,0);kt.DEFAULT_MATRIX_AUTO_UPDATE=!0;kt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class di extends kt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Wp={type:"move"};class ca{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new di,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new di,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new U,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new U),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new di,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new U,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new U,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,a=null;const o=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){a=!0;for(const v of e.hand.values()){const f=t.getJointPose(v,i),d=this._getHandJoint(l,v);f!==null&&(d.matrix.fromArray(f.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=f.radius),d.visible=f!==null}const h=l.joints["index-finger-tip"],p=l.joints["thumb-tip"],u=h.position.distanceTo(p.position),m=.02,g=.005;l.inputState.pinching&&u>m+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&u<=m-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,s.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=!1,s.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Wp)))}return o!==null&&(o.visible=r!==null),c!==null&&(c.visible=s!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new di;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}const ju={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Vn={h:0,s:0,l:0},Nr={h:0,s:0,l:0};function la(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class Xe{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Kt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ke.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=ke.workingColorSpace){return this.r=e,this.g=t,this.b=i,ke.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=ke.workingColorSpace){if(e=ic(e,1),t=ze(t,0,1),i=ze(i,0,1),t===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+t):i+t-i*t,a=2*i-s;this.r=la(a,s,e+1/3),this.g=la(a,s,e),this.b=la(a,s,e-1/3)}return ke.colorSpaceToWorking(this,r),this}setStyle(e,t=Kt){function i(s){s!==void 0&&parseFloat(s)<1&&Ce("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:Ce("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);Ce("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Kt){const i=ju[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Ce("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Dn(e.r),this.g=Dn(e.g),this.b=Dn(e.b),this}copyLinearToSRGB(e){return this.r=Gi(e.r),this.g=Gi(e.g),this.b=Gi(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Kt){return ke.workingToColorSpace(Ct.copy(this),e),Math.round(ze(Ct.r*255,0,255))*65536+Math.round(ze(Ct.g*255,0,255))*256+Math.round(ze(Ct.b*255,0,255))}getHexString(e=Kt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ke.workingColorSpace){ke.workingToColorSpace(Ct.copy(this),t);const i=Ct.r,r=Ct.g,s=Ct.b,a=Math.max(i,r,s),o=Math.min(i,r,s);let c,l;const h=(o+a)/2;if(o===a)c=0,l=0;else{const p=a-o;switch(l=h<=.5?p/(a+o):p/(2-a-o),a){case i:c=(r-s)/p+(r<s?6:0);break;case r:c=(s-i)/p+2;break;case s:c=(i-r)/p+4;break}c/=6}return e.h=c,e.s=l,e.l=h,e}getRGB(e,t=ke.workingColorSpace){return ke.workingToColorSpace(Ct.copy(this),t),e.r=Ct.r,e.g=Ct.g,e.b=Ct.b,e}getStyle(e=Kt){ke.workingToColorSpace(Ct.copy(this),e);const t=Ct.r,i=Ct.g,r=Ct.b;return e!==Kt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(Vn),this.setHSL(Vn.h+e,Vn.s+t,Vn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Vn),e.getHSL(Nr);const i=ur(Vn.h,Nr.h,t),r=ur(Vn.s,Nr.s,t),s=ur(Vn.l,Nr.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ct=new Xe;Xe.NAMES=ju;class Xp extends kt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new mi,this.environmentIntensity=1,this.environmentRotation=new mi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}const tn=new U,bn=new U,ua=new U,Tn=new U,bi=new U,Ti=new U,jc=new U,da=new U,ha=new U,fa=new U,pa=new lt,ma=new lt,ga=new lt;class Qt{constructor(e=new U,t=new U,i=new U){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),tn.subVectors(e,t),r.cross(tn);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){tn.subVectors(r,t),bn.subVectors(i,t),ua.subVectors(e,t);const a=tn.dot(tn),o=tn.dot(bn),c=tn.dot(ua),l=bn.dot(bn),h=bn.dot(ua),p=a*l-o*o;if(p===0)return s.set(0,0,0),null;const u=1/p,m=(l*c-o*h)*u,g=(a*h-o*c)*u;return s.set(1-m-g,g,m)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,Tn)===null?!1:Tn.x>=0&&Tn.y>=0&&Tn.x+Tn.y<=1}static getInterpolation(e,t,i,r,s,a,o,c){return this.getBarycoord(e,t,i,r,Tn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,Tn.x),c.addScaledVector(a,Tn.y),c.addScaledVector(o,Tn.z),c)}static getInterpolatedAttribute(e,t,i,r,s,a){return pa.setScalar(0),ma.setScalar(0),ga.setScalar(0),pa.fromBufferAttribute(e,t),ma.fromBufferAttribute(e,i),ga.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(pa,s.x),a.addScaledVector(ma,s.y),a.addScaledVector(ga,s.z),a}static isFrontFacing(e,t,i,r){return tn.subVectors(i,t),bn.subVectors(e,t),tn.cross(bn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return tn.subVectors(this.c,this.b),bn.subVectors(this.a,this.b),tn.cross(bn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Qt.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Qt.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return Qt.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return Qt.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Qt.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,r=this.b,s=this.c;let a,o;bi.subVectors(r,i),Ti.subVectors(s,i),da.subVectors(e,i);const c=bi.dot(da),l=Ti.dot(da);if(c<=0&&l<=0)return t.copy(i);ha.subVectors(e,r);const h=bi.dot(ha),p=Ti.dot(ha);if(h>=0&&p<=h)return t.copy(r);const u=c*p-h*l;if(u<=0&&c>=0&&h<=0)return a=c/(c-h),t.copy(i).addScaledVector(bi,a);fa.subVectors(e,s);const m=bi.dot(fa),g=Ti.dot(fa);if(g>=0&&m<=g)return t.copy(s);const v=m*l-c*g;if(v<=0&&l>=0&&g<=0)return o=l/(l-g),t.copy(i).addScaledVector(Ti,o);const f=h*g-m*p;if(f<=0&&p-h>=0&&m-g>=0)return jc.subVectors(s,r),o=(p-h)/(p-h+(m-g)),t.copy(r).addScaledVector(jc,o);const d=1/(f+v+u);return a=v*d,o=u*d,t.copy(i).addScaledVector(bi,a).addScaledVector(Ti,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class Sr{constructor(e=new U(1/0,1/0,1/0),t=new U(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(nn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(nn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=nn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,nn):nn.fromBufferAttribute(s,a),nn.applyMatrix4(e.matrixWorld),this.expandByPoint(nn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Ur.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Ur.copy(i.boundingBox)),Ur.applyMatrix4(e.matrixWorld),this.union(Ur)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,nn),nn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Qi),Fr.subVectors(this.max,Qi),Ai.subVectors(e.a,Qi),wi.subVectors(e.b,Qi),Ri.subVectors(e.c,Qi),Hn.subVectors(wi,Ai),Wn.subVectors(Ri,wi),jn.subVectors(Ai,Ri);let t=[0,-Hn.z,Hn.y,0,-Wn.z,Wn.y,0,-jn.z,jn.y,Hn.z,0,-Hn.x,Wn.z,0,-Wn.x,jn.z,0,-jn.x,-Hn.y,Hn.x,0,-Wn.y,Wn.x,0,-jn.y,jn.x,0];return!_a(t,Ai,wi,Ri,Fr)||(t=[1,0,0,0,1,0,0,0,1],!_a(t,Ai,wi,Ri,Fr))?!1:(Or.crossVectors(Hn,Wn),t=[Or.x,Or.y,Or.z],_a(t,Ai,wi,Ri,Fr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,nn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(nn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(An[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),An[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),An[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),An[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),An[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),An[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),An[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),An[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(An),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const An=[new U,new U,new U,new U,new U,new U,new U,new U],nn=new U,Ur=new Sr,Ai=new U,wi=new U,Ri=new U,Hn=new U,Wn=new U,jn=new U,Qi=new U,Fr=new U,Or=new U,ei=new U;function _a(n,e,t,i,r){for(let s=0,a=n.length-3;s<=a;s+=3){ei.fromArray(n,s);const o=r.x*Math.abs(ei.x)+r.y*Math.abs(ei.y)+r.z*Math.abs(ei.z),c=e.dot(ei),l=t.dot(ei),h=i.dot(ei);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>o)return!1}return!0}const mt=new U,Br=new Ye;let Yp=0;class Ot extends gi{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Yp++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Oo,this.updateRanges=[],this.gpuType=pn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Br.fromBufferAttribute(this,t),Br.applyMatrix3(e),this.setXY(t,Br.x,Br.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)mt.fromBufferAttribute(this,t),mt.applyMatrix3(e),this.setXYZ(t,mt.x,mt.y,mt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)mt.fromBufferAttribute(this,t),mt.applyMatrix4(e),this.setXYZ(t,mt.x,mt.y,mt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)mt.fromBufferAttribute(this,t),mt.applyNormalMatrix(e),this.setXYZ(t,mt.x,mt.y,mt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)mt.fromBufferAttribute(this,t),mt.transformDirection(e),this.setXYZ(t,mt.x,mt.y,mt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=rn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Je(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=rn(t,this.array)),t}setX(e,t){return this.normalized&&(t=Je(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=rn(t,this.array)),t}setY(e,t){return this.normalized&&(t=Je(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=rn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Je(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=rn(t,this.array)),t}setW(e,t){return this.normalized&&(t=Je(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=Je(t,this.array),i=Je(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=Je(t,this.array),i=Je(i,this.array),r=Je(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=Je(t,this.array),i=Je(i,this.array),r=Je(r,this.array),s=Je(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Oo&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}}class ed extends Ot{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class td extends Ot{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class St extends Ot{constructor(e,t,i){super(new Float32Array(e),t,i)}}const $p=new Sr,ji=new U,xa=new U;class Os{constructor(e=new U,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):$p.setFromPoints(e).getCenter(i);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ji.subVectors(e,this.center);const t=ji.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(ji,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(xa.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ji.copy(e.center).add(xa)),this.expandByPoint(ji.copy(e.center).sub(xa))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let qp=0;const $t=new Qe,va=new kt,Ci=new U,Xt=new Sr,er=new Sr,Mt=new U;class It extends gi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:qp++}),this.uuid=Ln(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(hp(e)?td:ed)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new Ie().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return $t.makeRotationFromQuaternion(e),this.applyMatrix4($t),this}rotateX(e){return $t.makeRotationX(e),this.applyMatrix4($t),this}rotateY(e){return $t.makeRotationY(e),this.applyMatrix4($t),this}rotateZ(e){return $t.makeRotationZ(e),this.applyMatrix4($t),this}translate(e,t,i){return $t.makeTranslation(e,t,i),this.applyMatrix4($t),this}scale(e,t,i){return $t.makeScale(e,t,i),this.applyMatrix4($t),this}lookAt(e){return va.lookAt(e),va.updateMatrix(),this.applyMatrix4(va.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ci).negate(),this.translate(Ci.x,Ci.y,Ci.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const i=[];for(let r=0,s=e.length;r<s;r++){const a=e[r];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new St(i,3))}else{const i=Math.min(e.length,t.count);for(let r=0;r<i;r++){const s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&Ce("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Sr);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){We("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new U(-1/0,-1/0,-1/0),new U(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){const s=t[i];Xt.setFromBufferAttribute(s),this.morphTargetsRelative?(Mt.addVectors(this.boundingBox.min,Xt.min),this.boundingBox.expandByPoint(Mt),Mt.addVectors(this.boundingBox.max,Xt.max),this.boundingBox.expandByPoint(Mt)):(this.boundingBox.expandByPoint(Xt.min),this.boundingBox.expandByPoint(Xt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&We('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Os);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){We("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new U,1/0);return}if(e){const i=this.boundingSphere.center;if(Xt.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){const o=t[s];er.setFromBufferAttribute(o),this.morphTargetsRelative?(Mt.addVectors(Xt.min,er.min),Xt.expandByPoint(Mt),Mt.addVectors(Xt.max,er.max),Xt.expandByPoint(Mt)):(Xt.expandByPoint(er.min),Xt.expandByPoint(er.max))}Xt.getCenter(i);let r=0;for(let s=0,a=e.count;s<a;s++)Mt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(Mt));if(t)for(let s=0,a=t.length;s<a;s++){const o=t[s],c=this.morphTargetsRelative;for(let l=0,h=o.count;l<h;l++)Mt.fromBufferAttribute(o,l),c&&(Ci.fromBufferAttribute(e,l),Mt.add(Ci)),r=Math.max(r,i.distanceToSquared(Mt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&We('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){We("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.position,r=t.normal,s=t.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==i.count)&&(a=new Ot(new Float32Array(4*i.count),4),this.setAttribute("tangent",a));const o=[],c=[];for(let x=0;x<i.count;x++)o[x]=new U,c[x]=new U;const l=new U,h=new U,p=new U,u=new Ye,m=new Ye,g=new Ye,v=new U,f=new U;function d(x,y,I){l.fromBufferAttribute(i,x),h.fromBufferAttribute(i,y),p.fromBufferAttribute(i,I),u.fromBufferAttribute(s,x),m.fromBufferAttribute(s,y),g.fromBufferAttribute(s,I),h.sub(l),p.sub(l),m.sub(u),g.sub(u);const C=1/(m.x*g.y-g.x*m.y);isFinite(C)&&(v.copy(h).multiplyScalar(g.y).addScaledVector(p,-m.y).multiplyScalar(C),f.copy(p).multiplyScalar(m.x).addScaledVector(h,-g.x).multiplyScalar(C),o[x].add(v),o[y].add(v),o[I].add(v),c[x].add(f),c[y].add(f),c[I].add(f))}let E=this.groups;E.length===0&&(E=[{start:0,count:e.count}]);for(let x=0,y=E.length;x<y;++x){const I=E[x],C=I.start,F=I.count;for(let $=C,q=C+F;$<q;$+=3)d(e.getX($+0),e.getX($+1),e.getX($+2))}const A=new U,S=new U,w=new U,b=new U;function R(x){w.fromBufferAttribute(r,x),b.copy(w);const y=o[x];A.copy(y),A.sub(w.multiplyScalar(w.dot(y))).normalize(),S.crossVectors(b,y);const C=S.dot(c[x])<0?-1:1;a.setXYZW(x,A.x,A.y,A.z,C)}for(let x=0,y=E.length;x<y;++x){const I=E[x],C=I.start,F=I.count;for(let $=C,q=C+F;$<q;$+=3)R(e.getX($+0)),R(e.getX($+1)),R(e.getX($+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new Ot(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let u=0,m=i.count;u<m;u++)i.setXYZ(u,0,0,0);const r=new U,s=new U,a=new U,o=new U,c=new U,l=new U,h=new U,p=new U;if(e)for(let u=0,m=e.count;u<m;u+=3){const g=e.getX(u+0),v=e.getX(u+1),f=e.getX(u+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,v),a.fromBufferAttribute(t,f),h.subVectors(a,s),p.subVectors(r,s),h.cross(p),o.fromBufferAttribute(i,g),c.fromBufferAttribute(i,v),l.fromBufferAttribute(i,f),o.add(h),c.add(h),l.add(h),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(v,c.x,c.y,c.z),i.setXYZ(f,l.x,l.y,l.z)}else for(let u=0,m=t.count;u<m;u+=3)r.fromBufferAttribute(t,u+0),s.fromBufferAttribute(t,u+1),a.fromBufferAttribute(t,u+2),h.subVectors(a,s),p.subVectors(r,s),h.cross(p),i.setXYZ(u+0,h.x,h.y,h.z),i.setXYZ(u+1,h.x,h.y,h.z),i.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Mt.fromBufferAttribute(e,t),Mt.normalize(),e.setXYZ(t,Mt.x,Mt.y,Mt.z)}toNonIndexed(){function e(o,c){const l=o.array,h=o.itemSize,p=o.normalized,u=new l.constructor(c.length*h);let m=0,g=0;for(let v=0,f=c.length;v<f;v++){o.isInterleavedBufferAttribute?m=c[v]*o.data.stride+o.offset:m=c[v]*h;for(let d=0;d<h;d++)u[g++]=l[m++]}return new Ot(u,h,p)}if(this.index===null)return Ce("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new It,i=this.index.array,r=this.attributes;for(const o in r){const c=r[o],l=e(c,i);t.setAttribute(o,l)}const s=this.morphAttributes;for(const o in s){const c=[],l=s[o];for(let h=0,p=l.length;h<p;h++){const u=l[h],m=e(u,i);c.push(m)}t.morphAttributes[o]=c}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,c=a.length;o<c;o++){const l=a[o];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const c in i){const l=i[c];e.data.attributes[c]=l.toJSON(e.data)}const r={};let s=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],h=[];for(let p=0,u=l.length;p<u;p++){const m=l[p];h.push(m.toJSON(e.data))}h.length>0&&(r[c]=h,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone());const r=e.attributes;for(const l in r){const h=r[l];this.setAttribute(l,h.clone(t))}const s=e.morphAttributes;for(const l in s){const h=[],p=s[l];for(let u=0,m=p.length;u<m;u++)h.push(p[u].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let l=0,h=a.length;l<h;l++){const p=a[l];this.addGroup(p.start,p.count,p.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Kp{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Oo,this.updateRanges=[],this.version=0,this.uuid=Ln()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let r=0,s=this.stride;r<s;r++)this.array[e+r]=t.array[i+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Ln()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Ln()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const Dt=new U;class ws{constructor(e,t,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)Dt.fromBufferAttribute(this,t),Dt.applyMatrix4(e),this.setXYZ(t,Dt.x,Dt.y,Dt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Dt.fromBufferAttribute(this,t),Dt.applyNormalMatrix(e),this.setXYZ(t,Dt.x,Dt.y,Dt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Dt.fromBufferAttribute(this,t),Dt.transformDirection(e),this.setXYZ(t,Dt.x,Dt.y,Dt.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=rn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Je(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=Je(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=Je(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=Je(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=Je(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=rn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=rn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=rn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=rn(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=Je(t,this.array),i=Je(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=Je(t,this.array),i=Je(i,this.array),r=Je(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=Je(t,this.array),i=Je(i,this.array),r=Je(r,this.array),s=Je(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this.data.array[e+3]=s,this}clone(e){if(e===void 0){As("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let i=0;i<this.count;i++){const r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return new Ot(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new ws(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){As("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let i=0;i<this.count;i++){const r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}let Zp=0;class Er extends gi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Zp++}),this.uuid=Ln(),this.name="",this.type="Material",this.blending=Oi,this.side=Zn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ka,this.blendDst=Za,this.blendEquation=si,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Xe(0,0,0),this.blendAlpha=0,this.depthFunc=Vi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=zc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=vi,this.stencilZFail=vi,this.stencilZPass=vi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){Ce(`Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ce(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Oi&&(i.blending=this.blending),this.side!==Zn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Ka&&(i.blendSrc=this.blendSrc),this.blendDst!==Za&&(i.blendDst=this.blendDst),this.blendEquation!==si&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Vi&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==zc&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==vi&&(i.stencilFail=this.stencilFail),this.stencilZFail!==vi&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==vi&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.allowOverride===!1&&(i.allowOverride=!1),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const a=[];for(const o in s){const c=s[o];delete c.metadata,a.push(c)}return a}if(t){const s=r(e.textures),a=r(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Xe().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new Ye().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Ye().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const wn=new U,Ma=new U,zr=new U,Xn=new U,Sa=new U,Gr=new U,Ea=new U;class nd{constructor(e=new U,t=new U(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,wn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=wn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(wn.copy(this.origin).addScaledVector(this.direction,t),wn.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Ma.copy(e).add(t).multiplyScalar(.5),zr.copy(t).sub(e).normalize(),Xn.copy(this.origin).sub(Ma);const s=e.distanceTo(t)*.5,a=-this.direction.dot(zr),o=Xn.dot(this.direction),c=-Xn.dot(zr),l=Xn.lengthSq(),h=Math.abs(1-a*a);let p,u,m,g;if(h>0)if(p=a*c-o,u=a*o-c,g=s*h,p>=0)if(u>=-g)if(u<=g){const v=1/h;p*=v,u*=v,m=p*(p+a*u+2*o)+u*(a*p+u+2*c)+l}else u=s,p=Math.max(0,-(a*u+o)),m=-p*p+u*(u+2*c)+l;else u=-s,p=Math.max(0,-(a*u+o)),m=-p*p+u*(u+2*c)+l;else u<=-g?(p=Math.max(0,-(-a*s+o)),u=p>0?-s:Math.min(Math.max(-s,-c),s),m=-p*p+u*(u+2*c)+l):u<=g?(p=0,u=Math.min(Math.max(-s,-c),s),m=u*(u+2*c)+l):(p=Math.max(0,-(a*s+o)),u=p>0?s:Math.min(Math.max(-s,-c),s),m=-p*p+u*(u+2*c)+l);else u=a>0?-s:s,p=Math.max(0,-(a*u+o)),m=-p*p+u*(u+2*c)+l;return i&&i.copy(this.origin).addScaledVector(this.direction,p),r&&r.copy(Ma).addScaledVector(zr,u),m}intersectSphere(e,t){wn.subVectors(e.center,this.origin);const i=wn.dot(this.direction),r=wn.dot(wn)-i*i,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=i-a,c=i+a;return c<0?null:o<0?this.at(c,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,a,o,c;const l=1/this.direction.x,h=1/this.direction.y,p=1/this.direction.z,u=this.origin;return l>=0?(i=(e.min.x-u.x)*l,r=(e.max.x-u.x)*l):(i=(e.max.x-u.x)*l,r=(e.min.x-u.x)*l),h>=0?(s=(e.min.y-u.y)*h,a=(e.max.y-u.y)*h):(s=(e.max.y-u.y)*h,a=(e.min.y-u.y)*h),i>a||s>r||((s>i||isNaN(i))&&(i=s),(a<r||isNaN(r))&&(r=a),p>=0?(o=(e.min.z-u.z)*p,c=(e.max.z-u.z)*p):(o=(e.max.z-u.z)*p,c=(e.min.z-u.z)*p),i>c||o>r)||((o>i||i!==i)&&(i=o),(c<r||r!==r)&&(r=c),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,wn)!==null}intersectTriangle(e,t,i,r,s){Sa.subVectors(t,e),Gr.subVectors(i,e),Ea.crossVectors(Sa,Gr);let a=this.direction.dot(Ea),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Xn.subVectors(this.origin,e);const c=o*this.direction.dot(Gr.crossVectors(Xn,Gr));if(c<0)return null;const l=o*this.direction.dot(Sa.cross(Xn));if(l<0||c+l>a)return null;const h=-o*Xn.dot(Ea);return h<0?null:this.at(h/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Bs extends Er{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Xe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new mi,this.combine=Nu,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const el=new Qe,ti=new nd,kr=new Os,tl=new U,Vr=new U,Hr=new U,Wr=new U,ya=new U,Xr=new U,nl=new U,Yr=new U;class bt extends kt{constructor(e=new It,t=new Bs){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){Xr.set(0,0,0);for(let c=0,l=s.length;c<l;c++){const h=o[c],p=s[c];h!==0&&(ya.fromBufferAttribute(p,e),a?Xr.addScaledVector(ya,h):Xr.addScaledVector(ya.sub(t),h))}t.add(Xr)}return t}raycast(e,t){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),kr.copy(i.boundingSphere),kr.applyMatrix4(s),ti.copy(e.ray).recast(e.near),!(kr.containsPoint(ti.origin)===!1&&(ti.intersectSphere(kr,tl)===null||ti.origin.distanceToSquared(tl)>(e.far-e.near)**2))&&(el.copy(s).invert(),ti.copy(e.ray).applyMatrix4(el),!(i.boundingBox!==null&&ti.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,ti)))}_computeIntersections(e,t,i){let r;const s=this.geometry,a=this.material,o=s.index,c=s.attributes.position,l=s.attributes.uv,h=s.attributes.uv1,p=s.attributes.normal,u=s.groups,m=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,v=u.length;g<v;g++){const f=u[g],d=a[f.materialIndex],E=Math.max(f.start,m.start),A=Math.min(o.count,Math.min(f.start+f.count,m.start+m.count));for(let S=E,w=A;S<w;S+=3){const b=o.getX(S),R=o.getX(S+1),x=o.getX(S+2);r=$r(this,d,e,i,l,h,p,b,R,x),r&&(r.faceIndex=Math.floor(S/3),r.face.materialIndex=f.materialIndex,t.push(r))}}else{const g=Math.max(0,m.start),v=Math.min(o.count,m.start+m.count);for(let f=g,d=v;f<d;f+=3){const E=o.getX(f),A=o.getX(f+1),S=o.getX(f+2);r=$r(this,a,e,i,l,h,p,E,A,S),r&&(r.faceIndex=Math.floor(f/3),t.push(r))}}else if(c!==void 0)if(Array.isArray(a))for(let g=0,v=u.length;g<v;g++){const f=u[g],d=a[f.materialIndex],E=Math.max(f.start,m.start),A=Math.min(c.count,Math.min(f.start+f.count,m.start+m.count));for(let S=E,w=A;S<w;S+=3){const b=S,R=S+1,x=S+2;r=$r(this,d,e,i,l,h,p,b,R,x),r&&(r.faceIndex=Math.floor(S/3),r.face.materialIndex=f.materialIndex,t.push(r))}}else{const g=Math.max(0,m.start),v=Math.min(c.count,m.start+m.count);for(let f=g,d=v;f<d;f+=3){const E=f,A=f+1,S=f+2;r=$r(this,a,e,i,l,h,p,E,A,S),r&&(r.faceIndex=Math.floor(f/3),t.push(r))}}}}function Jp(n,e,t,i,r,s,a,o){let c;if(e.side===Ut?c=i.intersectTriangle(a,s,r,!0,o):c=i.intersectTriangle(r,s,a,e.side===Zn,o),c===null)return null;Yr.copy(o),Yr.applyMatrix4(n.matrixWorld);const l=t.ray.origin.distanceTo(Yr);return l<t.near||l>t.far?null:{distance:l,point:Yr.clone(),object:n}}function $r(n,e,t,i,r,s,a,o,c,l){n.getVertexPosition(o,Vr),n.getVertexPosition(c,Hr),n.getVertexPosition(l,Wr);const h=Jp(n,e,t,i,Vr,Hr,Wr,nl);if(h){const p=new U;Qt.getBarycoord(nl,Vr,Hr,Wr,p),r&&(h.uv=Qt.getInterpolatedAttribute(r,o,c,l,p,new Ye)),s&&(h.uv1=Qt.getInterpolatedAttribute(s,o,c,l,p,new Ye)),a&&(h.normal=Qt.getInterpolatedAttribute(a,o,c,l,p,new U),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));const u={a:o,b:c,c:l,normal:new U,materialIndex:0};Qt.getNormal(Vr,Hr,Wr,u.normal),h.face=u,h.barycoord=p}return h}class Qp extends Ft{constructor(e=null,t=1,i=1,r,s,a,o,c,l=Tt,h=Tt,p,u){super(null,a,o,c,l,h,r,s,p,u),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const ba=new U,jp=new U,em=new Ie;class ii{constructor(e=new U(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const r=ba.subVectors(i,t).cross(jp.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){const r=e.delta(ba),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/s;return i===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||em.getNormalMatrix(e),r=this.coplanarPoint(ba).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const ni=new Os,tm=new Ye(.5,.5),qr=new U;class id{constructor(e=new ii,t=new ii,i=new ii,r=new ii,s=new ii,a=new ii){this.planes=[e,t,i,r,s,a]}set(e,t,i,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=mn,i=!1){const r=this.planes,s=e.elements,a=s[0],o=s[1],c=s[2],l=s[3],h=s[4],p=s[5],u=s[6],m=s[7],g=s[8],v=s[9],f=s[10],d=s[11],E=s[12],A=s[13],S=s[14],w=s[15];if(r[0].setComponents(l-a,m-h,d-g,w-E).normalize(),r[1].setComponents(l+a,m+h,d+g,w+E).normalize(),r[2].setComponents(l+o,m+p,d+v,w+A).normalize(),r[3].setComponents(l-o,m-p,d-v,w-A).normalize(),i)r[4].setComponents(c,u,f,S).normalize(),r[5].setComponents(l-c,m-u,d-f,w-S).normalize();else if(r[4].setComponents(l-c,m-u,d-f,w-S).normalize(),t===mn)r[5].setComponents(l+c,m+u,d+f,w+S).normalize();else if(t===bs)r[5].setComponents(c,u,f,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ni.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),ni.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ni)}intersectsSprite(e){ni.center.set(0,0,0);const t=tm.distanceTo(e.center);return ni.radius=.7071067811865476+t,ni.applyMatrix4(e.matrixWorld),this.intersectsSphere(ni)}intersectsSphere(e){const t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const r=t[i];if(qr.x=r.normal.x>0?e.max.x:e.min.x,qr.y=r.normal.y>0?e.max.y:e.min.y,qr.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(qr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class vr extends Er{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Xe(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Rs=new U,Cs=new U,il=new Qe,tr=new nd,Kr=new Os,Ta=new U,rl=new U;class nm extends kt{constructor(e=new It,t=new vr){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[0];for(let r=1,s=t.count;r<s;r++)Rs.fromBufferAttribute(t,r-1),Cs.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=Rs.distanceTo(Cs);e.setAttribute("lineDistance",new St(i,1))}else Ce("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const i=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Kr.copy(i.boundingSphere),Kr.applyMatrix4(r),Kr.radius+=s,e.ray.intersectsSphere(Kr)===!1)return;il.copy(r).invert(),tr.copy(e.ray).applyMatrix4(il);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=this.isLineSegments?2:1,h=i.index,u=i.attributes.position;if(h!==null){const m=Math.max(0,a.start),g=Math.min(h.count,a.start+a.count);for(let v=m,f=g-1;v<f;v+=l){const d=h.getX(v),E=h.getX(v+1),A=Zr(this,e,tr,c,d,E,v);A&&t.push(A)}if(this.isLineLoop){const v=h.getX(g-1),f=h.getX(m),d=Zr(this,e,tr,c,v,f,g-1);d&&t.push(d)}}else{const m=Math.max(0,a.start),g=Math.min(u.count,a.start+a.count);for(let v=m,f=g-1;v<f;v+=l){const d=Zr(this,e,tr,c,v,v+1,v);d&&t.push(d)}if(this.isLineLoop){const v=Zr(this,e,tr,c,g-1,m,g-1);v&&t.push(v)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function Zr(n,e,t,i,r,s,a){const o=n.geometry.attributes.position;if(Rs.fromBufferAttribute(o,r),Cs.fromBufferAttribute(o,s),t.distanceSqToSegment(Rs,Cs,Ta,rl)>i)return;Ta.applyMatrix4(n.matrixWorld);const l=e.ray.origin.distanceTo(Ta);if(!(l<e.near||l>e.far))return{distance:l,point:rl.clone().applyMatrix4(n.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:n}}const sl=new U,al=new U;class sc extends nm{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[];for(let r=0,s=t.count;r<s;r+=2)sl.fromBufferAttribute(t,r),al.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+sl.distanceTo(al);e.setAttribute("lineDistance",new St(i,1))}else Ce("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class rd extends Ft{constructor(e=[],t=fi,i,r,s,a,o,c,l,h){super(e,t,i,r,s,a,o,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Wi extends Ft{constructor(e,t,i=Sn,r,s,a,o=Tt,c=Tt,l,h=Fn,p=1){if(h!==Fn&&h!==ui)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const u={width:e,height:t,depth:p};super(u,r,s,a,o,c,h,i,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new rc(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class im extends Wi{constructor(e,t=Sn,i=fi,r,s,a=Tt,o=Tt,c,l=Fn){const h={width:e,height:e,depth:1},p=[h,h,h,h,h,h];super(e,e,t,i,r,s,a,o,c,l),this.image=p,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class sd extends Ft{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Nn extends It{constructor(e=1,t=1,i=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const c=[],l=[],h=[],p=[];let u=0,m=0;g("z","y","x",-1,-1,i,t,e,a,s,0),g("z","y","x",1,-1,i,t,-e,a,s,1),g("x","z","y",1,1,e,i,t,r,a,2),g("x","z","y",1,-1,e,i,-t,r,a,3),g("x","y","z",1,-1,e,t,i,r,s,4),g("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(c),this.setAttribute("position",new St(l,3)),this.setAttribute("normal",new St(h,3)),this.setAttribute("uv",new St(p,2));function g(v,f,d,E,A,S,w,b,R,x,y){const I=S/R,C=w/x,F=S/2,$=w/2,q=b/2,z=R+1,Y=x+1;let X=0,P=0;const Z=new U;for(let ne=0;ne<Y;ne++){const ie=ne*C-$;for(let ue=0;ue<z;ue++){const Fe=ue*I-F;Z[v]=Fe*E,Z[f]=ie*A,Z[d]=q,l.push(Z.x,Z.y,Z.z),Z[v]=0,Z[f]=0,Z[d]=b>0?1:-1,h.push(Z.x,Z.y,Z.z),p.push(ue/R),p.push(1-ne/x),X+=1}}for(let ne=0;ne<x;ne++)for(let ie=0;ie<R;ie++){const ue=u+ie+z*ne,Fe=u+ie+z*(ne+1),qe=u+(ie+1)+z*(ne+1),Ge=u+(ie+1)+z*ne;c.push(ue,Fe,Ge),c.push(Fe,qe,Ge),P+=6}o.addGroup(m,P,y),m+=P,u+=X}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Nn(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class ac extends It{constructor(e=1,t=1,i=1,r=32,s=1,a=!1,o=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:c};const l=this;r=Math.floor(r),s=Math.floor(s);const h=[],p=[],u=[],m=[];let g=0;const v=[],f=i/2;let d=0;E(),a===!1&&(e>0&&A(!0),t>0&&A(!1)),this.setIndex(h),this.setAttribute("position",new St(p,3)),this.setAttribute("normal",new St(u,3)),this.setAttribute("uv",new St(m,2));function E(){const S=new U,w=new U;let b=0;const R=(t-e)/i;for(let x=0;x<=s;x++){const y=[],I=x/s,C=I*(t-e)+e;for(let F=0;F<=r;F++){const $=F/r,q=$*c+o,z=Math.sin(q),Y=Math.cos(q);w.x=C*z,w.y=-I*i+f,w.z=C*Y,p.push(w.x,w.y,w.z),S.set(z,R,Y).normalize(),u.push(S.x,S.y,S.z),m.push($,1-I),y.push(g++)}v.push(y)}for(let x=0;x<r;x++)for(let y=0;y<s;y++){const I=v[y][x],C=v[y+1][x],F=v[y+1][x+1],$=v[y][x+1];(e>0||y!==0)&&(h.push(I,C,$),b+=3),(t>0||y!==s-1)&&(h.push(C,F,$),b+=3)}l.addGroup(d,b,0),d+=b}function A(S){const w=g,b=new Ye,R=new U;let x=0;const y=S===!0?e:t,I=S===!0?1:-1;for(let F=1;F<=r;F++)p.push(0,f*I,0),u.push(0,I,0),m.push(.5,.5),g++;const C=g;for(let F=0;F<=r;F++){const q=F/r*c+o,z=Math.cos(q),Y=Math.sin(q);R.x=y*Y,R.y=f*I,R.z=y*z,p.push(R.x,R.y,R.z),u.push(0,I,0),b.x=z*.5+.5,b.y=Y*.5*I+.5,m.push(b.x,b.y),g++}for(let F=0;F<r;F++){const $=w+F,q=C+F;S===!0?h.push(q,q+1,$):h.push(q+1,q,$),x+=3}l.addGroup(d,x,S===!0?1:2),d+=x}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ac(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class oc extends ac{constructor(e=1,t=1,i=32,r=1,s=!1,a=0,o=Math.PI*2){super(0,e,t,i,r,s,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:s,thetaStart:a,thetaLength:o}}static fromJSON(e){return new oc(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}const Jr=new U,Qr=new U,Aa=new U,jr=new Qt;class rm extends It{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){const r=Math.pow(10,4),s=Math.cos(zi*t),a=e.getIndex(),o=e.getAttribute("position"),c=a?a.count:o.count,l=[0,0,0],h=["a","b","c"],p=new Array(3),u={},m=[];for(let g=0;g<c;g+=3){a?(l[0]=a.getX(g),l[1]=a.getX(g+1),l[2]=a.getX(g+2)):(l[0]=g,l[1]=g+1,l[2]=g+2);const{a:v,b:f,c:d}=jr;if(v.fromBufferAttribute(o,l[0]),f.fromBufferAttribute(o,l[1]),d.fromBufferAttribute(o,l[2]),jr.getNormal(Aa),p[0]=`${Math.round(v.x*r)},${Math.round(v.y*r)},${Math.round(v.z*r)}`,p[1]=`${Math.round(f.x*r)},${Math.round(f.y*r)},${Math.round(f.z*r)}`,p[2]=`${Math.round(d.x*r)},${Math.round(d.y*r)},${Math.round(d.z*r)}`,!(p[0]===p[1]||p[1]===p[2]||p[2]===p[0]))for(let E=0;E<3;E++){const A=(E+1)%3,S=p[E],w=p[A],b=jr[h[E]],R=jr[h[A]],x=`${S}_${w}`,y=`${w}_${S}`;y in u&&u[y]?(Aa.dot(u[y].normal)<=s&&(m.push(b.x,b.y,b.z),m.push(R.x,R.y,R.z)),u[y]=null):x in u||(u[x]={index0:l[E],index1:l[A],normal:Aa.clone()})}}for(const g in u)if(u[g]){const{index0:v,index1:f}=u[g];Jr.fromBufferAttribute(o,v),Qr.fromBufferAttribute(o,f),m.push(Jr.x,Jr.y,Jr.z),m.push(Qr.x,Qr.y,Qr.z)}this.setAttribute("position",new St(m,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}}class yr extends It{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};const s=e/2,a=t/2,o=Math.floor(i),c=Math.floor(r),l=o+1,h=c+1,p=e/o,u=t/c,m=[],g=[],v=[],f=[];for(let d=0;d<h;d++){const E=d*u-a;for(let A=0;A<l;A++){const S=A*p-s;g.push(S,-E,0),v.push(0,0,1),f.push(A/o),f.push(1-d/c)}}for(let d=0;d<c;d++)for(let E=0;E<o;E++){const A=E+l*d,S=E+l*(d+1),w=E+1+l*(d+1),b=E+1+l*d;m.push(A,S,b),m.push(S,w,b)}this.setIndex(m),this.setAttribute("position",new St(g,3)),this.setAttribute("normal",new St(v,3)),this.setAttribute("uv",new St(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new yr(e.width,e.height,e.widthSegments,e.heightSegments)}}class cc extends It{constructor(e=1,t=.4,i=12,r=48,s=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:r,arc:s,thetaStart:a,thetaLength:o},i=Math.floor(i),r=Math.floor(r);const c=[],l=[],h=[],p=[],u=new U,m=new U,g=new U;for(let v=0;v<=i;v++){const f=a+v/i*o;for(let d=0;d<=r;d++){const E=d/r*s;m.x=(e+t*Math.cos(f))*Math.cos(E),m.y=(e+t*Math.cos(f))*Math.sin(E),m.z=t*Math.sin(f),l.push(m.x,m.y,m.z),u.x=e*Math.cos(E),u.y=e*Math.sin(E),g.subVectors(m,u).normalize(),h.push(g.x,g.y,g.z),p.push(d/r),p.push(v/i)}}for(let v=1;v<=i;v++)for(let f=1;f<=r;f++){const d=(r+1)*v+f-1,E=(r+1)*(v-1)+f-1,A=(r+1)*(v-1)+f,S=(r+1)*v+f;c.push(d,E,S),c.push(E,A,S)}this.setIndex(c),this.setAttribute("position",new St(l,3)),this.setAttribute("normal",new St(h,3)),this.setAttribute("uv",new St(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new cc(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}}function Xi(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const r=n[t][i];if(ol(r))r.isRenderTargetTexture?(Ce("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(ol(r[0])){const s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();e[t][i]=s}else e[t][i]=r.slice();else e[t][i]=r}}return e}function Nt(n){const e={};for(let t=0;t<n.length;t++){const i=Xi(n[t]);for(const r in i)e[r]=i[r]}return e}function ol(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function sm(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function ad(n){const e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:ke.workingColorSpace}const am={clone:Xi,merge:Nt};var om=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,cm=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class on extends Er{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=om,this.fragmentShader=cm,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Xi(e.uniforms),this.uniformsGroups=sm(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(const i in e.uniforms){const r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=t[r.value]||null;break;case"c":this.uniforms[i].value=new Xe().setHex(r.value);break;case"v2":this.uniforms[i].value=new Ye().fromArray(r.value);break;case"v3":this.uniforms[i].value=new U().fromArray(r.value);break;case"v4":this.uniforms[i].value=new lt().fromArray(r.value);break;case"m3":this.uniforms[i].value=new Ie().fromArray(r.value);break;case"m4":this.uniforms[i].value=new Qe().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class lm extends on{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class um extends Er{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=rp,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class dm extends Er{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const es=new U,ts=new qi,dn=new U;class od extends kt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Qe,this.projectionMatrix=new Qe,this.projectionMatrixInverse=new Qe,this.coordinateSystem=mn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(es,ts,dn),dn.x===1&&dn.y===1&&dn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(es,ts,dn.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(es,ts,dn),dn.x===1&&dn.y===1&&dn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(es,ts,dn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Yn=new U,cl=new Ye,ll=new Ye;class Zt extends od{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=xr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(zi*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return xr*2*Math.atan(Math.tan(zi*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Yn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Yn.x,Yn.y).multiplyScalar(-e/Yn.z),Yn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Yn.x,Yn.y).multiplyScalar(-e/Yn.z)}getViewSize(e,t){return this.getViewBounds(e,cl,ll),t.subVectors(ll,cl)}setViewOffset(e,t,i,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(zi*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const c=a.fullWidth,l=a.fullHeight;s+=a.offsetX*r/c,t-=a.offsetY*i/l,r*=a.width/c,i*=a.height/l}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class cd extends od{constructor(e=-1,t=1,i=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-e,a=i+e,o=r+t,c=r-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=l*this.view.offsetX,a=s+l*this.view.width,o-=h*this.view.offsetY,c=o-h*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const Pi=-90,Ii=1;class hm extends kt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Zt(Pi,Ii,e,t);r.layers=this.layers,this.add(r);const s=new Zt(Pi,Ii,e,t);s.layers=this.layers,this.add(s);const a=new Zt(Pi,Ii,e,t);a.layers=this.layers,this.add(a);const o=new Zt(Pi,Ii,e,t);o.layers=this.layers,this.add(o);const c=new Zt(Pi,Ii,e,t);c.layers=this.layers,this.add(c);const l=new Zt(Pi,Ii,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,r,s,a,o,c]=t;for(const l of t)this.remove(l);if(e===mn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===bs)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,c,l,h]=this.children,p=e.getRenderTarget(),u=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const v=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let f=!1;e.isWebGLRenderer===!0?f=e.state.buffers.depth.getReversed():f=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,1,r),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,2,r),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,3,r),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),e.setRenderTarget(i,4,r),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),i.texture.generateMipmaps=v,e.setRenderTarget(i,5,r),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(p,u,m),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}}class fm extends Zt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class ld{static{ld.prototype.isMatrix2=!0}constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){const s=this.elements;return s[0]=e,s[2]=t,s[1]=i,s[3]=r,this}}function ul(n,e,t,i){const r=pm(i);switch(t){case $u:return n*e;case Ku:return n*e/r.components*r.byteLength;case Qo:return n*e/r.components*r.byteLength;case pi:return n*e*2/r.components*r.byteLength;case jo:return n*e*2/r.components*r.byteLength;case qu:return n*e*3/r.components*r.byteLength;case sn:return n*e*4/r.components*r.byteLength;case ec:return n*e*4/r.components*r.byteLength;case us:case ds:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case hs:case fs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case oo:case lo:return Math.max(n,16)*Math.max(e,8)/4;case ao:case co:return Math.max(n,8)*Math.max(e,8)/2;case uo:case ho:case po:case mo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case fo:case Ms:case go:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case _o:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case xo:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case vo:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Mo:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case So:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case Eo:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case yo:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case bo:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case To:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Ao:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case wo:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Ro:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Co:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case Po:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Io:case Lo:case Do:return Math.ceil(n/4)*Math.ceil(e/4)*16;case No:case Uo:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Ss:case Fo:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function pm(n){switch(n){case Jt:case Hu:return{byteLength:1,components:1};case gr:case Wu:case Un:return{byteLength:2,components:1};case Zo:case Jo:return{byteLength:2,components:4};case Sn:case Ko:case pn:return{byteLength:4,components:1};case Xu:case Yu:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:qo}}));typeof window<"u"&&(window.__THREE__?Ce("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=qo);function ud(){let n=null,e=!1,t=null,i=null;function r(s,a){t(s,a),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function mm(n){const e=new WeakMap;function t(o,c){const l=o.array,h=o.usage,p=l.byteLength,u=n.createBuffer();n.bindBuffer(c,u),n.bufferData(c,l,h),o.onUploadCallback();let m;if(l instanceof Float32Array)m=n.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)m=n.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?m=n.HALF_FLOAT:m=n.UNSIGNED_SHORT;else if(l instanceof Int16Array)m=n.SHORT;else if(l instanceof Uint32Array)m=n.UNSIGNED_INT;else if(l instanceof Int32Array)m=n.INT;else if(l instanceof Int8Array)m=n.BYTE;else if(l instanceof Uint8Array)m=n.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)m=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:u,type:m,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:p}}function i(o,c,l){const h=c.array,p=c.updateRanges;if(n.bindBuffer(l,o),p.length===0)n.bufferSubData(l,0,h);else{p.sort((m,g)=>m.start-g.start);let u=0;for(let m=1;m<p.length;m++){const g=p[u],v=p[m];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++u,p[u]=v)}p.length=u+1;for(let m=0,g=p.length;m<g;m++){const v=p[m];n.bufferSubData(l,v.start*h.BYTES_PER_ELEMENT,h,v.start,v.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const c=e.get(o);c&&(n.deleteBuffer(c.buffer),e.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const l=e.get(o);if(l===void 0)e.set(o,t(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,o,c),l.version=o.version}}return{get:r,remove:s,update:a}}var gm=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,_m=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,xm=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,vm=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Mm=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Sm=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Em=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,ym=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,bm=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Tm=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Am=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,wm=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Rm=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Cm=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Pm=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Im=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Lm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Dm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Nm=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Um=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Fm=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Om=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Bm=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,zm=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Gm=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,km=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Vm=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Hm=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Wm=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Xm=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Ym="gl_FragColor = linearToOutputTexel( gl_FragColor );",$m=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,qm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Km=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Zm=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Jm=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Qm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,jm=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,eg=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,tg=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,ng=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,ig=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,rg=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,sg=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,ag=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,og=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,cg=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,lg=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,ug=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,dg=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,hg=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,fg=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,pg=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,mg=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,gg=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,_g=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,xg=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,vg=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Mg=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Sg=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Eg=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,yg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,bg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Tg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Ag=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,wg=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Rg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Cg=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Pg=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ig=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Lg=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Dg=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ng=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Ug=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Fg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Og=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Bg=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,zg=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Gg=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,kg=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Vg=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Hg=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Wg=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Xg=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Yg=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,$g=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,qg=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Kg=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Zg=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Jg=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Qg=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,jg=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,e_=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,t_=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,n_=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,i_=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,r_=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,s_=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,a_=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,o_=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,c_=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,l_=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,u_=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,d_=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,h_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,f_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,p_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,m_=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const g_=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,__=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,x_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,v_=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,M_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,S_=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,E_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,y_=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,b_=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,T_=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,A_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,w_=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,R_=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,C_=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,P_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,I_=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,L_=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,D_=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,N_=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,U_=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,F_=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,O_=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,B_=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,z_=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,G_=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,k_=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,V_=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,H_=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,W_=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,X_=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Y_=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,$_=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,q_=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,K_=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ne={alphahash_fragment:gm,alphahash_pars_fragment:_m,alphamap_fragment:xm,alphamap_pars_fragment:vm,alphatest_fragment:Mm,alphatest_pars_fragment:Sm,aomap_fragment:Em,aomap_pars_fragment:ym,batching_pars_vertex:bm,batching_vertex:Tm,begin_vertex:Am,beginnormal_vertex:wm,bsdfs:Rm,iridescence_fragment:Cm,bumpmap_pars_fragment:Pm,clipping_planes_fragment:Im,clipping_planes_pars_fragment:Lm,clipping_planes_pars_vertex:Dm,clipping_planes_vertex:Nm,color_fragment:Um,color_pars_fragment:Fm,color_pars_vertex:Om,color_vertex:Bm,common:zm,cube_uv_reflection_fragment:Gm,defaultnormal_vertex:km,displacementmap_pars_vertex:Vm,displacementmap_vertex:Hm,emissivemap_fragment:Wm,emissivemap_pars_fragment:Xm,colorspace_fragment:Ym,colorspace_pars_fragment:$m,envmap_fragment:qm,envmap_common_pars_fragment:Km,envmap_pars_fragment:Zm,envmap_pars_vertex:Jm,envmap_physical_pars_fragment:cg,envmap_vertex:Qm,fog_vertex:jm,fog_pars_vertex:eg,fog_fragment:tg,fog_pars_fragment:ng,gradientmap_pars_fragment:ig,lightmap_pars_fragment:rg,lights_lambert_fragment:sg,lights_lambert_pars_fragment:ag,lights_pars_begin:og,lights_toon_fragment:lg,lights_toon_pars_fragment:ug,lights_phong_fragment:dg,lights_phong_pars_fragment:hg,lights_physical_fragment:fg,lights_physical_pars_fragment:pg,lights_fragment_begin:mg,lights_fragment_maps:gg,lights_fragment_end:_g,lightprobes_pars_fragment:xg,logdepthbuf_fragment:vg,logdepthbuf_pars_fragment:Mg,logdepthbuf_pars_vertex:Sg,logdepthbuf_vertex:Eg,map_fragment:yg,map_pars_fragment:bg,map_particle_fragment:Tg,map_particle_pars_fragment:Ag,metalnessmap_fragment:wg,metalnessmap_pars_fragment:Rg,morphinstance_vertex:Cg,morphcolor_vertex:Pg,morphnormal_vertex:Ig,morphtarget_pars_vertex:Lg,morphtarget_vertex:Dg,normal_fragment_begin:Ng,normal_fragment_maps:Ug,normal_pars_fragment:Fg,normal_pars_vertex:Og,normal_vertex:Bg,normalmap_pars_fragment:zg,clearcoat_normal_fragment_begin:Gg,clearcoat_normal_fragment_maps:kg,clearcoat_pars_fragment:Vg,iridescence_pars_fragment:Hg,opaque_fragment:Wg,packing:Xg,premultiplied_alpha_fragment:Yg,project_vertex:$g,dithering_fragment:qg,dithering_pars_fragment:Kg,roughnessmap_fragment:Zg,roughnessmap_pars_fragment:Jg,shadowmap_pars_fragment:Qg,shadowmap_pars_vertex:jg,shadowmap_vertex:e_,shadowmask_pars_fragment:t_,skinbase_vertex:n_,skinning_pars_vertex:i_,skinning_vertex:r_,skinnormal_vertex:s_,specularmap_fragment:a_,specularmap_pars_fragment:o_,tonemapping_fragment:c_,tonemapping_pars_fragment:l_,transmission_fragment:u_,transmission_pars_fragment:d_,uv_pars_fragment:h_,uv_pars_vertex:f_,uv_vertex:p_,worldpos_vertex:m_,background_vert:g_,background_frag:__,backgroundCube_vert:x_,backgroundCube_frag:v_,cube_vert:M_,cube_frag:S_,depth_vert:E_,depth_frag:y_,distance_vert:b_,distance_frag:T_,equirect_vert:A_,equirect_frag:w_,linedashed_vert:R_,linedashed_frag:C_,meshbasic_vert:P_,meshbasic_frag:I_,meshlambert_vert:L_,meshlambert_frag:D_,meshmatcap_vert:N_,meshmatcap_frag:U_,meshnormal_vert:F_,meshnormal_frag:O_,meshphong_vert:B_,meshphong_frag:z_,meshphysical_vert:G_,meshphysical_frag:k_,meshtoon_vert:V_,meshtoon_frag:H_,points_vert:W_,points_frag:X_,shadow_vert:Y_,shadow_frag:$_,sprite_vert:q_,sprite_frag:K_},he={common:{diffuse:{value:new Xe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ie},alphaMap:{value:null},alphaMapTransform:{value:new Ie},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ie}},envmap:{envMap:{value:null},envMapRotation:{value:new Ie},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ie}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ie}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ie},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ie},normalScale:{value:new Ye(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ie},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ie}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ie}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ie}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Xe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new U},probesMax:{value:new U},probesResolution:{value:new U}},points:{diffuse:{value:new Xe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ie},alphaTest:{value:0},uvTransform:{value:new Ie}},sprite:{diffuse:{value:new Xe(16777215)},opacity:{value:1},center:{value:new Ye(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ie},alphaMap:{value:null},alphaMapTransform:{value:new Ie},alphaTest:{value:0}}},fn={basic:{uniforms:Nt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.fog]),vertexShader:Ne.meshbasic_vert,fragmentShader:Ne.meshbasic_frag},lambert:{uniforms:Nt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.fog,he.lights,{emissive:{value:new Xe(0)},envMapIntensity:{value:1}}]),vertexShader:Ne.meshlambert_vert,fragmentShader:Ne.meshlambert_frag},phong:{uniforms:Nt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.fog,he.lights,{emissive:{value:new Xe(0)},specular:{value:new Xe(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ne.meshphong_vert,fragmentShader:Ne.meshphong_frag},standard:{uniforms:Nt([he.common,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.roughnessmap,he.metalnessmap,he.fog,he.lights,{emissive:{value:new Xe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ne.meshphysical_vert,fragmentShader:Ne.meshphysical_frag},toon:{uniforms:Nt([he.common,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.gradientmap,he.fog,he.lights,{emissive:{value:new Xe(0)}}]),vertexShader:Ne.meshtoon_vert,fragmentShader:Ne.meshtoon_frag},matcap:{uniforms:Nt([he.common,he.bumpmap,he.normalmap,he.displacementmap,he.fog,{matcap:{value:null}}]),vertexShader:Ne.meshmatcap_vert,fragmentShader:Ne.meshmatcap_frag},points:{uniforms:Nt([he.points,he.fog]),vertexShader:Ne.points_vert,fragmentShader:Ne.points_frag},dashed:{uniforms:Nt([he.common,he.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ne.linedashed_vert,fragmentShader:Ne.linedashed_frag},depth:{uniforms:Nt([he.common,he.displacementmap]),vertexShader:Ne.depth_vert,fragmentShader:Ne.depth_frag},normal:{uniforms:Nt([he.common,he.bumpmap,he.normalmap,he.displacementmap,{opacity:{value:1}}]),vertexShader:Ne.meshnormal_vert,fragmentShader:Ne.meshnormal_frag},sprite:{uniforms:Nt([he.sprite,he.fog]),vertexShader:Ne.sprite_vert,fragmentShader:Ne.sprite_frag},background:{uniforms:{uvTransform:{value:new Ie},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ne.background_vert,fragmentShader:Ne.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ie}},vertexShader:Ne.backgroundCube_vert,fragmentShader:Ne.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ne.cube_vert,fragmentShader:Ne.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ne.equirect_vert,fragmentShader:Ne.equirect_frag},distance:{uniforms:Nt([he.common,he.displacementmap,{referencePosition:{value:new U},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ne.distance_vert,fragmentShader:Ne.distance_frag},shadow:{uniforms:Nt([he.lights,he.fog,{color:{value:new Xe(0)},opacity:{value:1}}]),vertexShader:Ne.shadow_vert,fragmentShader:Ne.shadow_frag}};fn.physical={uniforms:Nt([fn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ie},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ie},clearcoatNormalScale:{value:new Ye(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ie},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ie},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ie},sheen:{value:0},sheenColor:{value:new Xe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ie},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ie},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ie},transmissionSamplerSize:{value:new Ye},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ie},attenuationDistance:{value:0},attenuationColor:{value:new Xe(0)},specularColor:{value:new Xe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ie},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ie},anisotropyVector:{value:new Ye},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ie}}]),vertexShader:Ne.meshphysical_vert,fragmentShader:Ne.meshphysical_frag};const ns={r:0,b:0,g:0},Z_=new Qe,dd=new Ie;dd.set(-1,0,0,0,1,0,0,0,1);function J_(n,e,t,i,r,s){const a=new Xe(0);let o=r===!0?0:1,c,l,h=null,p=0,u=null;function m(E){let A=E.isScene===!0?E.background:null;if(A&&A.isTexture){const S=E.backgroundBlurriness>0;A=e.get(A,S)}return A}function g(E){let A=!1;const S=m(E);S===null?f(a,o):S&&S.isColor&&(f(S,1),A=!0);const w=n.xr.getEnvironmentBlendMode();w==="additive"?t.buffers.color.setClear(0,0,0,1,s):w==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(n.autoClear||A)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function v(E,A){const S=m(A);S&&(S.isCubeTexture||S.mapping===Fs)?(l===void 0&&(l=new bt(new Nn(1,1,1),new on({name:"BackgroundCubeMaterial",uniforms:Xi(fn.backgroundCube.uniforms),vertexShader:fn.backgroundCube.vertexShader,fragmentShader:fn.backgroundCube.fragmentShader,side:Ut,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(w,b,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(l)),l.material.uniforms.envMap.value=S,l.material.uniforms.backgroundBlurriness.value=A.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Z_.makeRotationFromEuler(A.backgroundRotation)).transpose(),S.isCubeTexture&&S.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(dd),l.material.toneMapped=ke.getTransfer(S.colorSpace)!==Ze,(h!==S||p!==S.version||u!==n.toneMapping)&&(l.material.needsUpdate=!0,h=S,p=S.version,u=n.toneMapping),l.layers.enableAll(),E.unshift(l,l.geometry,l.material,0,0,null)):S&&S.isTexture&&(c===void 0&&(c=new bt(new yr(2,2),new on({name:"BackgroundMaterial",uniforms:Xi(fn.background.uniforms),vertexShader:fn.background.vertexShader,fragmentShader:fn.background.fragmentShader,side:Zn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=S,c.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,c.material.toneMapped=ke.getTransfer(S.colorSpace)!==Ze,S.matrixAutoUpdate===!0&&S.updateMatrix(),c.material.uniforms.uvTransform.value.copy(S.matrix),(h!==S||p!==S.version||u!==n.toneMapping)&&(c.material.needsUpdate=!0,h=S,p=S.version,u=n.toneMapping),c.layers.enableAll(),E.unshift(c,c.geometry,c.material,0,0,null))}function f(E,A){E.getRGB(ns,ad(n)),t.buffers.color.setClear(ns.r,ns.g,ns.b,A,s)}function d(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(E,A=1){a.set(E),o=A,f(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(E){o=E,f(a,o)},render:g,addToRenderList:v,dispose:d}}function Q_(n,e){const t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=u(null);let s=r,a=!1;function o(C,F,$,q,z){let Y=!1;const X=p(C,q,$,F);s!==X&&(s=X,l(s.object)),Y=m(C,q,$,z),Y&&g(C,q,$,z),z!==null&&e.update(z,n.ELEMENT_ARRAY_BUFFER),(Y||a)&&(a=!1,S(C,F,$,q),z!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(z).buffer))}function c(){return n.createVertexArray()}function l(C){return n.bindVertexArray(C)}function h(C){return n.deleteVertexArray(C)}function p(C,F,$,q){const z=q.wireframe===!0;let Y=i[F.id];Y===void 0&&(Y={},i[F.id]=Y);const X=C.isInstancedMesh===!0?C.id:0;let P=Y[X];P===void 0&&(P={},Y[X]=P);let Z=P[$.id];Z===void 0&&(Z={},P[$.id]=Z);let ne=Z[z];return ne===void 0&&(ne=u(c()),Z[z]=ne),ne}function u(C){const F=[],$=[],q=[];for(let z=0;z<t;z++)F[z]=0,$[z]=0,q[z]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:F,enabledAttributes:$,attributeDivisors:q,object:C,attributes:{},index:null}}function m(C,F,$,q){const z=s.attributes,Y=F.attributes;let X=0;const P=$.getAttributes();for(const Z in P)if(P[Z].location>=0){const ie=z[Z];let ue=Y[Z];if(ue===void 0&&(Z==="instanceMatrix"&&C.instanceMatrix&&(ue=C.instanceMatrix),Z==="instanceColor"&&C.instanceColor&&(ue=C.instanceColor)),ie===void 0||ie.attribute!==ue||ue&&ie.data!==ue.data)return!0;X++}return s.attributesNum!==X||s.index!==q}function g(C,F,$,q){const z={},Y=F.attributes;let X=0;const P=$.getAttributes();for(const Z in P)if(P[Z].location>=0){let ie=Y[Z];ie===void 0&&(Z==="instanceMatrix"&&C.instanceMatrix&&(ie=C.instanceMatrix),Z==="instanceColor"&&C.instanceColor&&(ie=C.instanceColor));const ue={};ue.attribute=ie,ie&&ie.data&&(ue.data=ie.data),z[Z]=ue,X++}s.attributes=z,s.attributesNum=X,s.index=q}function v(){const C=s.newAttributes;for(let F=0,$=C.length;F<$;F++)C[F]=0}function f(C){d(C,0)}function d(C,F){const $=s.newAttributes,q=s.enabledAttributes,z=s.attributeDivisors;$[C]=1,q[C]===0&&(n.enableVertexAttribArray(C),q[C]=1),z[C]!==F&&(n.vertexAttribDivisor(C,F),z[C]=F)}function E(){const C=s.newAttributes,F=s.enabledAttributes;for(let $=0,q=F.length;$<q;$++)F[$]!==C[$]&&(n.disableVertexAttribArray($),F[$]=0)}function A(C,F,$,q,z,Y,X){X===!0?n.vertexAttribIPointer(C,F,$,z,Y):n.vertexAttribPointer(C,F,$,q,z,Y)}function S(C,F,$,q){v();const z=q.attributes,Y=$.getAttributes(),X=F.defaultAttributeValues;for(const P in Y){const Z=Y[P];if(Z.location>=0){let ne=z[P];if(ne===void 0&&(P==="instanceMatrix"&&C.instanceMatrix&&(ne=C.instanceMatrix),P==="instanceColor"&&C.instanceColor&&(ne=C.instanceColor)),ne!==void 0){const ie=ne.normalized,ue=ne.itemSize,Fe=e.get(ne);if(Fe===void 0)continue;const qe=Fe.buffer,Ge=Fe.type,Q=Fe.bytesPerElement,B=Ge===n.INT||Ge===n.UNSIGNED_INT||ne.gpuType===Ko;if(ne.isInterleavedBufferAttribute){const W=ne.data,Se=W.stride,Pe=ne.offset;if(W.isInstancedInterleavedBuffer){for(let we=0;we<Z.locationSize;we++)d(Z.location+we,W.meshPerAttribute);C.isInstancedMesh!==!0&&q._maxInstanceCount===void 0&&(q._maxInstanceCount=W.meshPerAttribute*W.count)}else for(let we=0;we<Z.locationSize;we++)f(Z.location+we);n.bindBuffer(n.ARRAY_BUFFER,qe);for(let we=0;we<Z.locationSize;we++)A(Z.location+we,ue/Z.locationSize,Ge,ie,Se*Q,(Pe+ue/Z.locationSize*we)*Q,B)}else{if(ne.isInstancedBufferAttribute){for(let W=0;W<Z.locationSize;W++)d(Z.location+W,ne.meshPerAttribute);C.isInstancedMesh!==!0&&q._maxInstanceCount===void 0&&(q._maxInstanceCount=ne.meshPerAttribute*ne.count)}else for(let W=0;W<Z.locationSize;W++)f(Z.location+W);n.bindBuffer(n.ARRAY_BUFFER,qe);for(let W=0;W<Z.locationSize;W++)A(Z.location+W,ue/Z.locationSize,Ge,ie,ue*Q,ue/Z.locationSize*W*Q,B)}}else if(X!==void 0){const ie=X[P];if(ie!==void 0)switch(ie.length){case 2:n.vertexAttrib2fv(Z.location,ie);break;case 3:n.vertexAttrib3fv(Z.location,ie);break;case 4:n.vertexAttrib4fv(Z.location,ie);break;default:n.vertexAttrib1fv(Z.location,ie)}}}}E()}function w(){y();for(const C in i){const F=i[C];for(const $ in F){const q=F[$];for(const z in q){const Y=q[z];for(const X in Y)h(Y[X].object),delete Y[X];delete q[z]}}delete i[C]}}function b(C){if(i[C.id]===void 0)return;const F=i[C.id];for(const $ in F){const q=F[$];for(const z in q){const Y=q[z];for(const X in Y)h(Y[X].object),delete Y[X];delete q[z]}}delete i[C.id]}function R(C){for(const F in i){const $=i[F];for(const q in $){const z=$[q];if(z[C.id]===void 0)continue;const Y=z[C.id];for(const X in Y)h(Y[X].object),delete Y[X];delete z[C.id]}}}function x(C){for(const F in i){const $=i[F],q=C.isInstancedMesh===!0?C.id:0,z=$[q];if(z!==void 0){for(const Y in z){const X=z[Y];for(const P in X)h(X[P].object),delete X[P];delete z[Y]}delete $[q],Object.keys($).length===0&&delete i[F]}}}function y(){I(),a=!0,s!==r&&(s=r,l(s.object))}function I(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:y,resetDefaultState:I,dispose:w,releaseStatesOfGeometry:b,releaseStatesOfObject:x,releaseStatesOfProgram:R,initAttributes:v,enableAttribute:f,disableUnusedAttributes:E}}function j_(n,e,t){let i;function r(c){i=c}function s(c,l){n.drawArrays(i,c,l),t.update(l,i,1)}function a(c,l,h){h!==0&&(n.drawArraysInstanced(i,c,l,h),t.update(l,i,h))}function o(c,l,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,l,0,h);let u=0;for(let m=0;m<h;m++)u+=l[m];t.update(u,i,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function e0(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const R=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(R){return!(R!==sn&&i.convert(R)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(R){const x=R===Un&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(R!==Jt&&i.convert(R)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&R!==pn&&!x)}function c(R){if(R==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp";const h=c(l);h!==l&&(Ce("WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);const p=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&Ce("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const m=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=n.getParameter(n.MAX_TEXTURE_SIZE),f=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),d=n.getParameter(n.MAX_VERTEX_ATTRIBS),E=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),A=n.getParameter(n.MAX_VARYING_VECTORS),S=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),w=n.getParameter(n.MAX_SAMPLES),b=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:p,reversedDepthBuffer:u,maxTextures:m,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:f,maxAttributes:d,maxVertexUniforms:E,maxVaryings:A,maxFragmentUniforms:S,maxSamples:w,samples:b}}function t0(n){const e=this;let t=null,i=0,r=!1,s=!1;const a=new ii,o=new Ie,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(p,u){const m=p.length!==0||u||i!==0||r;return r=u,i=p.length,m},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(p,u){t=h(p,u,0)},this.setState=function(p,u,m){const g=p.clippingPlanes,v=p.clipIntersection,f=p.clipShadows,d=n.get(p);if(!r||g===null||g.length===0||s&&!f)s?h(null):l();else{const E=s?0:i,A=E*4;let S=d.clippingState||null;c.value=S,S=h(g,u,A,m);for(let w=0;w!==A;++w)S[w]=t[w];d.clippingState=S,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=E}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(p,u,m,g){const v=p!==null?p.length:0;let f=null;if(v!==0){if(f=c.value,g!==!0||f===null){const d=m+v*4,E=u.matrixWorldInverse;o.getNormalMatrix(E),(f===null||f.length<d)&&(f=new Float32Array(d));for(let A=0,S=m;A!==v;++A,S+=4)a.copy(p[A]).applyMatrix4(E,o),a.normal.toArray(f,S),f[S+3]=a.constant}c.value=f,c.needsUpdate=!0}return e.numPlanes=v,e.numIntersection=0,f}}const qn=4,dl=[.125,.215,.35,.446,.526,.582],ai=20,n0=256,nr=new cd,hl=new Xe;let wa=null,Ra=0,Ca=0,Pa=!1;const i0=new U;class fl{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,s={}){const{size:a=256,position:o=i0}=s;wa=this._renderer.getRenderTarget(),Ra=this._renderer.getActiveCubeFace(),Ca=this._renderer.getActiveMipmapLevel(),Pa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,i,r,c,o),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=gl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ml(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(wa,Ra,Ca),this._renderer.xr.enabled=Pa,e.scissorTest=!1,Li(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===fi||e.mapping===Hi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),wa=this._renderer.getRenderTarget(),Ra=this._renderer.getActiveCubeFace(),Ca=this._renderer.getActiveMipmapLevel(),Pa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Pt,minFilter:Pt,generateMipmaps:!1,type:Un,format:sn,colorSpace:Es,depthBuffer:!1},r=pl(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=pl(e,t,i);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=r0(s)),this._blurMaterial=a0(s,e,t),this._ggxMaterial=s0(s,e,t)}return r}_compileMaterial(e){const t=new bt(new It,e);this._renderer.compile(t,nr)}_sceneToCubeUV(e,t,i,r,s){const c=new Zt(90,1,t,i),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],p=this._renderer,u=p.autoClear,m=p.toneMapping;p.getClearColor(hl),p.toneMapping=xn,p.autoClear=!1,p.state.buffers.depth.getReversed()&&(p.setRenderTarget(r),p.clearDepth(),p.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new bt(new Nn,new Bs({name:"PMREM.Background",side:Ut,depthWrite:!1,depthTest:!1})));const v=this._backgroundBox,f=v.material;let d=!1;const E=e.background;E?E.isColor&&(f.color.copy(E),e.background=null,d=!0):(f.color.copy(hl),d=!0);for(let A=0;A<6;A++){const S=A%3;S===0?(c.up.set(0,l[A],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x+h[A],s.y,s.z)):S===1?(c.up.set(0,0,l[A]),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y+h[A],s.z)):(c.up.set(0,l[A],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y,s.z+h[A]));const w=this._cubeSize;Li(r,S*w,A>2?w:0,w,w),p.setRenderTarget(r),d&&p.render(v,c),p.render(e,c)}p.toneMapping=m,p.autoClear=u,e.background=E}_textureToCubeUV(e,t){const i=this._renderer,r=e.mapping===fi||e.mapping===Hi;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=gl()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ml());const s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;const o=s.uniforms;o.envMap.value=e;const c=this._cubeSize;Li(t,0,0,3*c,2*c),i.setRenderTarget(t),i.render(a,nr)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=i}_applyGGXFilter(e,t,i){const r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[i];o.material=a;const c=a.uniforms,l=i/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),p=Math.sqrt(l*l-h*h),u=0+l*1.25,m=p*u,{_lodMax:g}=this,v=this._sizeLods[i],f=3*v*(i>g-qn?i-g+qn:0),d=4*(this._cubeSize-v);c.envMap.value=e.texture,c.roughness.value=m,c.mipInt.value=g-t,Li(s,f,d,3*v,2*v),r.setRenderTarget(s),r.render(o,nr),c.envMap.value=s.texture,c.roughness.value=0,c.mipInt.value=g-i,Li(e,f,d,3*v,2*v),r.setRenderTarget(e),r.render(o,nr)}_blur(e,t,i,r,s){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,r,"latitudinal",s),this._halfBlur(a,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,a,o){const c=this._renderer,l=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&We("blur direction must be either latitudinal or longitudinal!");const h=3,p=this._lodMeshes[r];p.material=l;const u=l.uniforms,m=this._sizeLods[i]-1,g=isFinite(s)?Math.PI/(2*m):2*Math.PI/(2*ai-1),v=s/g,f=isFinite(s)?1+Math.floor(h*v):ai;f>ai&&Ce(`sigmaRadians, ${s}, is too large and will clip, as it requested ${f} samples when the maximum is set to ${ai}`);const d=[];let E=0;for(let R=0;R<ai;++R){const x=R/v,y=Math.exp(-x*x/2);d.push(y),R===0?E+=y:R<f&&(E+=2*y)}for(let R=0;R<d.length;R++)d[R]=d[R]/E;u.envMap.value=e.texture,u.samples.value=f,u.weights.value=d,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);const{_lodMax:A}=this;u.dTheta.value=g,u.mipInt.value=A-i;const S=this._sizeLods[r],w=3*S*(r>A-qn?r-A+qn:0),b=4*(this._cubeSize-S);Li(t,w,b,3*S,2*S),c.setRenderTarget(t),c.render(p,nr)}}function r0(n){const e=[],t=[],i=[];let r=n;const s=n-qn+1+dl.length;for(let a=0;a<s;a++){const o=Math.pow(2,r);e.push(o);let c=1/o;a>n-qn?c=dl[a-n+qn-1]:a===0&&(c=0),t.push(c);const l=1/(o-2),h=-l,p=1+l,u=[h,h,p,h,p,p,h,h,p,p,h,p],m=6,g=6,v=3,f=2,d=1,E=new Float32Array(v*g*m),A=new Float32Array(f*g*m),S=new Float32Array(d*g*m);for(let b=0;b<m;b++){const R=b%3*2/3-1,x=b>2?0:-1,y=[R,x,0,R+2/3,x,0,R+2/3,x+1,0,R,x,0,R+2/3,x+1,0,R,x+1,0];E.set(y,v*g*b),A.set(u,f*g*b);const I=[b,b,b,b,b,b];S.set(I,d*g*b)}const w=new It;w.setAttribute("position",new Ot(E,v)),w.setAttribute("uv",new Ot(A,f)),w.setAttribute("faceIndex",new Ot(S,d)),i.push(new bt(w,null)),r>qn&&r--}return{lodMeshes:i,sizeLods:e,sigmas:t}}function pl(n,e,t){const i=new vn(n,e,t);return i.texture.mapping=Fs,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Li(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function s0(n,e,t){return new on({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:n0,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:zs(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function a0(n,e,t){const i=new Float32Array(ai),r=new U(0,1,0);return new on({name:"SphericalGaussianBlur",defines:{n:ai,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:zs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function ml(){return new on({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:zs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function gl(){return new on({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:zs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function zs(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}class hd extends vn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new rd(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Nn(5,5,5),s=new on({name:"CubemapFromEquirect",uniforms:Xi(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Ut,blending:In});s.uniforms.tEquirect.value=t;const a=new bt(r,s),o=t.minFilter;return t.minFilter===li&&(t.minFilter=Pt),new hm(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,r);e.setRenderTarget(s)}}function o0(n){let e=new WeakMap,t=new WeakMap,i=null;function r(u,m=!1){return u==null?null:m?a(u):s(u)}function s(u){if(u&&u.isTexture){const m=u.mapping;if(m===ea||m===ta)if(e.has(u)){const g=e.get(u).texture;return o(g,u.mapping)}else{const g=u.image;if(g&&g.height>0){const v=new hd(g.height);return v.fromEquirectangularTexture(n,u),e.set(u,v),u.addEventListener("dispose",l),o(v.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture){const m=u.mapping,g=m===ea||m===ta,v=m===fi||m===Hi;if(g||v){let f=t.get(u);const d=f!==void 0?f.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==d)return i===null&&(i=new fl(n)),f=g?i.fromEquirectangular(u,f):i.fromCubemap(u,f),f.texture.pmremVersion=u.pmremVersion,t.set(u,f),f.texture;if(f!==void 0)return f.texture;{const E=u.image;return g&&E&&E.height>0||v&&E&&c(E)?(i===null&&(i=new fl(n)),f=g?i.fromEquirectangular(u):i.fromCubemap(u),f.texture.pmremVersion=u.pmremVersion,t.set(u,f),u.addEventListener("dispose",h),f.texture):null}}}return u}function o(u,m){return m===ea?u.mapping=fi:m===ta&&(u.mapping=Hi),u}function c(u){let m=0;const g=6;for(let v=0;v<g;v++)u[v]!==void 0&&m++;return m===g}function l(u){const m=u.target;m.removeEventListener("dispose",l);const g=e.get(m);g!==void 0&&(e.delete(m),g.dispose())}function h(u){const m=u.target;m.removeEventListener("dispose",h);const g=t.get(m);g!==void 0&&(t.delete(m),g.dispose())}function p(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:p}}function c0(n){const e={};function t(i){if(e[i]!==void 0)return e[i];const r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const r=t(i);return r===null&&Bi("WebGLRenderer: "+i+" extension not supported."),r}}}function l0(n,e,t,i){const r={},s=new WeakMap;function a(p){const u=p.target;u.index!==null&&e.remove(u.index);for(const g in u.attributes)e.remove(u.attributes[g]);u.removeEventListener("dispose",a),delete r[u.id];const m=s.get(u);m&&(e.remove(m),s.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function o(p,u){return r[u.id]===!0||(u.addEventListener("dispose",a),r[u.id]=!0,t.memory.geometries++),u}function c(p){const u=p.attributes;for(const m in u)e.update(u[m],n.ARRAY_BUFFER)}function l(p){const u=[],m=p.index,g=p.attributes.position;let v=0;if(g===void 0)return;if(m!==null){const E=m.array;v=m.version;for(let A=0,S=E.length;A<S;A+=3){const w=E[A+0],b=E[A+1],R=E[A+2];u.push(w,b,b,R,R,w)}}else{const E=g.array;v=g.version;for(let A=0,S=E.length/3-1;A<S;A+=3){const w=A+0,b=A+1,R=A+2;u.push(w,b,b,R,R,w)}}const f=new(g.count>=65535?td:ed)(u,1);f.version=v;const d=s.get(p);d&&e.remove(d),s.set(p,f)}function h(p){const u=s.get(p);if(u){const m=p.index;m!==null&&u.version<m.version&&l(p)}else l(p);return s.get(p)}return{get:o,update:c,getWireframeAttribute:h}}function u0(n,e,t){let i;function r(p){i=p}let s,a;function o(p){s=p.type,a=p.bytesPerElement}function c(p,u){n.drawElements(i,u,s,p*a),t.update(u,i,1)}function l(p,u,m){m!==0&&(n.drawElementsInstanced(i,u,s,p*a,m),t.update(u,i,m))}function h(p,u,m){if(m===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,s,p,0,m);let v=0;for(let f=0;f<m;f++)v+=u[f];t.update(v,i,1)}this.setMode=r,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=h}function d0(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,o){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=o*(s/3);break;case n.LINES:t.lines+=o*(s/2);break;case n.LINE_STRIP:t.lines+=o*(s-1);break;case n.LINE_LOOP:t.lines+=o*s;break;case n.POINTS:t.points+=o*s;break;default:We("WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function h0(n,e,t){const i=new WeakMap,r=new lt;function s(a,o,c){const l=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,p=h!==void 0?h.length:0;let u=i.get(o);if(u===void 0||u.count!==p){let y=function(){R.dispose(),i.delete(o),o.removeEventListener("dispose",y)};u!==void 0&&u.texture.dispose();const m=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,v=o.morphAttributes.color!==void 0,f=o.morphAttributes.position||[],d=o.morphAttributes.normal||[],E=o.morphAttributes.color||[];let A=0;m===!0&&(A=1),g===!0&&(A=2),v===!0&&(A=3);let S=o.attributes.position.count*A,w=1;S>e.maxTextureSize&&(w=Math.ceil(S/e.maxTextureSize),S=e.maxTextureSize);const b=new Float32Array(S*w*4*p),R=new Ju(b,S,w,p);R.type=pn,R.needsUpdate=!0;const x=A*4;for(let I=0;I<p;I++){const C=f[I],F=d[I],$=E[I],q=S*w*4*I;for(let z=0;z<C.count;z++){const Y=z*x;m===!0&&(r.fromBufferAttribute(C,z),b[q+Y+0]=r.x,b[q+Y+1]=r.y,b[q+Y+2]=r.z,b[q+Y+3]=0),g===!0&&(r.fromBufferAttribute(F,z),b[q+Y+4]=r.x,b[q+Y+5]=r.y,b[q+Y+6]=r.z,b[q+Y+7]=0),v===!0&&(r.fromBufferAttribute($,z),b[q+Y+8]=r.x,b[q+Y+9]=r.y,b[q+Y+10]=r.z,b[q+Y+11]=$.itemSize===4?r.w:1)}}u={count:p,texture:R,size:new Ye(S,w)},i.set(o,u),o.addEventListener("dispose",y)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(n,"morphTexture",a.morphTexture,t);else{let m=0;for(let v=0;v<l.length;v++)m+=l[v];const g=o.morphTargetsRelative?1:1-m;c.getUniforms().setValue(n,"morphTargetBaseInfluence",g),c.getUniforms().setValue(n,"morphTargetInfluences",l)}c.getUniforms().setValue(n,"morphTargetsTexture",u.texture,t),c.getUniforms().setValue(n,"morphTargetsTextureSize",u.size)}return{update:s}}function f0(n,e,t,i,r){let s=new WeakMap;function a(l){const h=r.render.frame,p=l.geometry,u=e.get(l,p);if(s.get(u)!==h&&(e.update(u),s.set(u,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),s.get(l)!==h&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),s.set(l,h))),l.isSkinnedMesh){const m=l.skeleton;s.get(m)!==h&&(m.update(),s.set(m,h))}return u}function o(){s=new WeakMap}function c(l){const h=l.target;h.removeEventListener("dispose",c),i.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:a,dispose:o}}const p0={[Uu]:"LINEAR_TONE_MAPPING",[Fu]:"REINHARD_TONE_MAPPING",[Ou]:"CINEON_TONE_MAPPING",[Bu]:"ACES_FILMIC_TONE_MAPPING",[Gu]:"AGX_TONE_MAPPING",[ku]:"NEUTRAL_TONE_MAPPING",[zu]:"CUSTOM_TONE_MAPPING"};function m0(n,e,t,i,r,s){const a=new vn(e,t,{type:n,depthBuffer:r,stencilBuffer:s,samples:i?4:0,depthTexture:r?new Wi(e,t):void 0}),o=new vn(e,t,{type:Un,depthBuffer:!1,stencilBuffer:!1}),c=new It;c.setAttribute("position",new St([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new St([0,2,0,0,2,0],2));const l=new lm({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),h=new bt(c,l),p=new cd(-1,1,1,-1,0,1);let u=null,m=null,g=!1,v,f=null,d=[],E=!1;this.setSize=function(A,S){a.setSize(A,S),o.setSize(A,S);for(let w=0;w<d.length;w++){const b=d[w];b.setSize&&b.setSize(A,S)}},this.setEffects=function(A){d=A,E=d.length>0&&d[0].isRenderPass===!0;const S=a.width,w=a.height;for(let b=0;b<d.length;b++){const R=d[b];R.setSize&&R.setSize(S,w)}},this.begin=function(A,S){if(g||A.toneMapping===xn&&d.length===0)return!1;if(f=S,S!==null){const w=S.width,b=S.height;(a.width!==w||a.height!==b)&&this.setSize(w,b)}return E===!1&&A.setRenderTarget(a),v=A.toneMapping,A.toneMapping=xn,!0},this.hasRenderPass=function(){return E},this.end=function(A,S){A.toneMapping=v,g=!0;let w=a,b=o;for(let R=0;R<d.length;R++){const x=d[R];if(x.enabled!==!1&&(x.render(A,b,w,S),x.needsSwap!==!1)){const y=w;w=b,b=y}}if(u!==A.outputColorSpace||m!==A.toneMapping){u=A.outputColorSpace,m=A.toneMapping,l.defines={},ke.getTransfer(u)===Ze&&(l.defines.SRGB_TRANSFER="");const R=p0[m];R&&(l.defines[R]=""),l.needsUpdate=!0}l.uniforms.tDiffuse.value=w.texture,A.setRenderTarget(f),A.render(h,p),f=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){a.depthTexture&&a.depthTexture.dispose(),a.dispose(),o.dispose(),c.dispose(),l.dispose()}}const fd=new Ft,Bo=new Wi(1,1),pd=new Ju,md=new Op,gd=new rd,_l=[],xl=[],vl=new Float32Array(16),Ml=new Float32Array(9),Sl=new Float32Array(4);function Ki(n,e,t){const i=n[0];if(i<=0||i>0)return n;const r=e*t;let s=_l[r];if(s===void 0&&(s=new Float32Array(r),_l[r]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,n[a].toArray(s,o)}return s}function _t(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function xt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Gs(n,e){let t=xl[e];t===void 0&&(t=new Int32Array(e),xl[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function g0(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function _0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;n.uniform2fv(this.addr,e),xt(t,e)}}function x0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(_t(t,e))return;n.uniform3fv(this.addr,e),xt(t,e)}}function v0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;n.uniform4fv(this.addr,e),xt(t,e)}}function M0(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(_t(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),xt(t,e)}else{if(_t(t,i))return;Sl.set(i),n.uniformMatrix2fv(this.addr,!1,Sl),xt(t,i)}}function S0(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(_t(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),xt(t,e)}else{if(_t(t,i))return;Ml.set(i),n.uniformMatrix3fv(this.addr,!1,Ml),xt(t,i)}}function E0(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(_t(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),xt(t,e)}else{if(_t(t,i))return;vl.set(i),n.uniformMatrix4fv(this.addr,!1,vl),xt(t,i)}}function y0(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function b0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;n.uniform2iv(this.addr,e),xt(t,e)}}function T0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(_t(t,e))return;n.uniform3iv(this.addr,e),xt(t,e)}}function A0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;n.uniform4iv(this.addr,e),xt(t,e)}}function w0(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function R0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;n.uniform2uiv(this.addr,e),xt(t,e)}}function C0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(_t(t,e))return;n.uniform3uiv(this.addr,e),xt(t,e)}}function P0(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;n.uniform4uiv(this.addr,e),xt(t,e)}}function I0(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(Bo.compareFunction=t.isReversedDepthBuffer()?nc:tc,s=Bo):s=fd,t.setTexture2D(e||s,r)}function L0(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||md,r)}function D0(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||gd,r)}function N0(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||pd,r)}function U0(n){switch(n){case 5126:return g0;case 35664:return _0;case 35665:return x0;case 35666:return v0;case 35674:return M0;case 35675:return S0;case 35676:return E0;case 5124:case 35670:return y0;case 35667:case 35671:return b0;case 35668:case 35672:return T0;case 35669:case 35673:return A0;case 5125:return w0;case 36294:return R0;case 36295:return C0;case 36296:return P0;case 35678:case 36198:case 36298:case 36306:case 35682:return I0;case 35679:case 36299:case 36307:return L0;case 35680:case 36300:case 36308:case 36293:return D0;case 36289:case 36303:case 36311:case 36292:return N0}}function F0(n,e){n.uniform1fv(this.addr,e)}function O0(n,e){const t=Ki(e,this.size,2);n.uniform2fv(this.addr,t)}function B0(n,e){const t=Ki(e,this.size,3);n.uniform3fv(this.addr,t)}function z0(n,e){const t=Ki(e,this.size,4);n.uniform4fv(this.addr,t)}function G0(n,e){const t=Ki(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function k0(n,e){const t=Ki(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function V0(n,e){const t=Ki(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function H0(n,e){n.uniform1iv(this.addr,e)}function W0(n,e){n.uniform2iv(this.addr,e)}function X0(n,e){n.uniform3iv(this.addr,e)}function Y0(n,e){n.uniform4iv(this.addr,e)}function $0(n,e){n.uniform1uiv(this.addr,e)}function q0(n,e){n.uniform2uiv(this.addr,e)}function K0(n,e){n.uniform3uiv(this.addr,e)}function Z0(n,e){n.uniform4uiv(this.addr,e)}function J0(n,e,t){const i=this.cache,r=e.length,s=Gs(t,r);_t(i,s)||(n.uniform1iv(this.addr,s),xt(i,s));let a;this.type===n.SAMPLER_2D_SHADOW?a=Bo:a=fd;for(let o=0;o!==r;++o)t.setTexture2D(e[o]||a,s[o])}function Q0(n,e,t){const i=this.cache,r=e.length,s=Gs(t,r);_t(i,s)||(n.uniform1iv(this.addr,s),xt(i,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||md,s[a])}function j0(n,e,t){const i=this.cache,r=e.length,s=Gs(t,r);_t(i,s)||(n.uniform1iv(this.addr,s),xt(i,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||gd,s[a])}function ex(n,e,t){const i=this.cache,r=e.length,s=Gs(t,r);_t(i,s)||(n.uniform1iv(this.addr,s),xt(i,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||pd,s[a])}function tx(n){switch(n){case 5126:return F0;case 35664:return O0;case 35665:return B0;case 35666:return z0;case 35674:return G0;case 35675:return k0;case 35676:return V0;case 5124:case 35670:return H0;case 35667:case 35671:return W0;case 35668:case 35672:return X0;case 35669:case 35673:return Y0;case 5125:return $0;case 36294:return q0;case 36295:return K0;case 36296:return Z0;case 35678:case 36198:case 36298:case 36306:case 35682:return J0;case 35679:case 36299:case 36307:return Q0;case 35680:case 36300:case 36308:case 36293:return j0;case 36289:case 36303:case 36311:case 36292:return ex}}class nx{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=U0(t.type)}}class ix{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=tx(t.type)}}class rx{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,t[o.id],i)}}}const Ia=/(\w+)(\])?(\[|\.)?/g;function El(n,e){n.seq.push(e),n.map[e.id]=e}function sx(n,e,t){const i=n.name,r=i.length;for(Ia.lastIndex=0;;){const s=Ia.exec(i),a=Ia.lastIndex;let o=s[1];const c=s[2]==="]",l=s[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===r){El(t,l===void 0?new nx(o,n,e):new ix(o,n,e));break}else{let p=t.map[o];p===void 0&&(p=new rx(o),El(t,p)),t=p}}}class ps{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){const o=e.getActiveUniform(t,a),c=e.getUniformLocation(t,o.name);sx(o,c,this)}const r=[],s=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,i,r){const s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){const r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,a=t.length;s!==a;++s){const o=t[s],c=i[o.id];c.needsUpdate!==!1&&o.setValue(e,c.value,r)}}static seqWithValue(e,t){const i=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in t&&i.push(a)}return i}}function yl(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const ax=37297;let ox=0;function cx(n,e){const t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){const o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}const bl=new Ie;function lx(n){ke._getMatrix(bl,ke.workingColorSpace,n);const e=`mat3( ${bl.elements.map(t=>t.toFixed(4))} )`;switch(ke.getTransfer(n)){case ys:return[e,"LinearTransferOETF"];case Ze:return[e,"sRGBTransferOETF"];default:return Ce("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Tl(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),s=(n.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+cx(n.getShaderSource(e),o)}else return s}function ux(n,e){const t=lx(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const dx={[Uu]:"Linear",[Fu]:"Reinhard",[Ou]:"Cineon",[Bu]:"ACESFilmic",[Gu]:"AgX",[ku]:"Neutral",[zu]:"Custom"};function hx(n,e){const t=dx[e];return t===void 0?(Ce("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const is=new U;function fx(){ke.getLuminanceCoefficients(is);const n=is.x.toFixed(4),e=is.y.toFixed(4),t=is.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function px(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(or).join(`
`)}function mx(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function gx(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=n.getActiveAttrib(e,r),a=s.name;let o=1;s.type===n.FLOAT_MAT2&&(o=2),s.type===n.FLOAT_MAT3&&(o=3),s.type===n.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:n.getAttribLocation(e,a),locationSize:o}}return t}function or(n){return n!==""}function Al(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function wl(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const _x=/^[ \t]*#include +<([\w\d./]+)>/gm;function zo(n){return n.replace(_x,vx)}const xx=new Map;function vx(n,e){let t=Ne[e];if(t===void 0){const i=xx.get(e);if(i!==void 0)t=Ne[i],Ce('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return zo(t)}const Mx=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Rl(n){return n.replace(Mx,Sx)}function Sx(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Cl(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const Ex={[ls]:"SHADOWMAP_TYPE_PCF",[ar]:"SHADOWMAP_TYPE_VSM"};function yx(n){return Ex[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const bx={[fi]:"ENVMAP_TYPE_CUBE",[Hi]:"ENVMAP_TYPE_CUBE",[Fs]:"ENVMAP_TYPE_CUBE_UV"};function Tx(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":bx[n.envMapMode]||"ENVMAP_TYPE_CUBE"}const Ax={[Hi]:"ENVMAP_MODE_REFRACTION"};function wx(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":Ax[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}const Rx={[Nu]:"ENVMAP_BLENDING_MULTIPLY",[tp]:"ENVMAP_BLENDING_MIX",[np]:"ENVMAP_BLENDING_ADD"};function Cx(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":Rx[n.combine]||"ENVMAP_BLENDING_NONE"}function Px(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function Ix(n,e,t,i){const r=n.getContext(),s=t.defines;let a=t.vertexShader,o=t.fragmentShader;const c=yx(t),l=Tx(t),h=wx(t),p=Cx(t),u=Px(t),m=px(t),g=mx(s),v=r.createProgram();let f,d,E=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(or).join(`
`),f.length>0&&(f+=`
`),d=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(or).join(`
`),d.length>0&&(d+=`
`)):(f=[Cl(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(or).join(`
`),d=[Cl(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+h:"",t.envMap?"#define "+p:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==xn?"#define TONE_MAPPING":"",t.toneMapping!==xn?Ne.tonemapping_pars_fragment:"",t.toneMapping!==xn?hx("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ne.colorspace_pars_fragment,ux("linearToOutputTexel",t.outputColorSpace),fx(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(or).join(`
`)),a=zo(a),a=Al(a,t),a=wl(a,t),o=zo(o),o=Al(o,t),o=wl(o,t),a=Rl(a),o=Rl(o),t.isRawShaderMaterial!==!0&&(E=`#version 300 es
`,f=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,d=["#define varying in",t.glslVersion===Gc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Gc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+d);const A=E+f+a,S=E+d+o,w=yl(r,r.VERTEX_SHADER,A),b=yl(r,r.FRAGMENT_SHADER,S);r.attachShader(v,w),r.attachShader(v,b),t.index0AttributeName!==void 0?r.bindAttribLocation(v,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(v,0,"position"),r.linkProgram(v);function R(C){if(n.debug.checkShaderErrors){const F=r.getProgramInfoLog(v)||"",$=r.getShaderInfoLog(w)||"",q=r.getShaderInfoLog(b)||"",z=F.trim(),Y=$.trim(),X=q.trim();let P=!0,Z=!0;if(r.getProgramParameter(v,r.LINK_STATUS)===!1)if(P=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,v,w,b);else{const ne=Tl(r,w,"vertex"),ie=Tl(r,b,"fragment");We("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(v,r.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+z+`
`+ne+`
`+ie)}else z!==""?Ce("WebGLProgram: Program Info Log:",z):(Y===""||X==="")&&(Z=!1);Z&&(C.diagnostics={runnable:P,programLog:z,vertexShader:{log:Y,prefix:f},fragmentShader:{log:X,prefix:d}})}r.deleteShader(w),r.deleteShader(b),x=new ps(r,v),y=gx(r,v)}let x;this.getUniforms=function(){return x===void 0&&R(this),x};let y;this.getAttributes=function(){return y===void 0&&R(this),y};let I=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return I===!1&&(I=r.getProgramParameter(v,ax)),I},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(v),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=ox++,this.cacheKey=e,this.usedTimes=1,this.program=v,this.vertexShader=w,this.fragmentShader=b,this}let Lx=0;class Dx{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,i){const r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(i)===!1&&(r.add(i),i.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new Nx(e),t.set(e,i)),i}}class Nx{constructor(e){this.id=Lx++,this.code=e,this.usedTimes=0}}function Ux(n){return n===pi||n===Ms||n===Ss}function Fx(n,e,t,i,r,s){const a=new Qu,o=new Dx,c=new Set,l=[],h=new Map,p=i.logarithmicDepthBuffer;let u=i.precision;const m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(x){return c.add(x),x===0?"uv":`uv${x}`}function v(x,y,I,C,F,$){const q=C.fog,z=F.geometry,Y=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?C.environment:null,X=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,P=e.get(x.envMap||Y,X),Z=P&&P.mapping===Fs?P.image.height:null,ne=m[x.type];x.precision!==null&&(u=i.getMaxPrecision(x.precision),u!==x.precision&&Ce("WebGLProgram.getParameters:",x.precision,"not supported, using",u,"instead."));const ie=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,ue=ie!==void 0?ie.length:0;let Fe=0;z.morphAttributes.position!==void 0&&(Fe=1),z.morphAttributes.normal!==void 0&&(Fe=2),z.morphAttributes.color!==void 0&&(Fe=3);let qe,Ge,Q,B;if(ne){const ve=fn[ne];qe=ve.vertexShader,Ge=ve.fragmentShader}else{qe=x.vertexShader,Ge=x.fragmentShader;const ve=o.getVertexShaderStage(x),ot=o.getFragmentShaderStage(x);o.update(x,ve,ot),Q=ve.id,B=ot.id}const W=n.getRenderTarget(),Se=n.state.buffers.depth.getReversed(),Pe=F.isInstancedMesh===!0,we=F.isBatchedMesh===!0,ut=!!x.map,Be=!!x.matcap,et=!!P,$e=!!x.aoMap,Ve=!!x.lightMap,ft=!!x.bumpMap&&x.wireframe===!1,gt=!!x.normalMap,vt=!!x.displacementMap,Et=!!x.emissiveMap,at=!!x.metalnessMap,pt=!!x.roughnessMap,D=x.anisotropy>0,Bt=x.clearcoat>0,Ke=x.dispersion>0,T=x.iridescence>0,_=x.sheen>0,O=x.transmission>0,V=D&&!!x.anisotropyMap,K=Bt&&!!x.clearcoatMap,re=Bt&&!!x.clearcoatNormalMap,ae=Bt&&!!x.clearcoatRoughnessMap,J=T&&!!x.iridescenceMap,ee=T&&!!x.iridescenceThicknessMap,oe=_&&!!x.sheenColorMap,ye=_&&!!x.sheenRoughnessMap,de=!!x.specularMap,ce=!!x.specularColorMap,Ae=!!x.specularIntensityMap,Re=O&&!!x.transmissionMap,Le=O&&!!x.thicknessMap,L=!!x.gradientMap,se=!!x.alphaMap,j=x.alphaTest>0,le=!!x.alphaHash,me=!!x.extensions;let te=xn;x.toneMapped&&(W===null||W.isXRRenderTarget===!0)&&(te=n.toneMapping);const Ee={shaderID:ne,shaderType:x.type,shaderName:x.name,vertexShader:qe,fragmentShader:Ge,defines:x.defines,customVertexShaderID:Q,customFragmentShaderID:B,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:u,batching:we,batchingColor:we&&F._colorsTexture!==null,instancing:Pe,instancingColor:Pe&&F.instanceColor!==null,instancingMorph:Pe&&F.morphTexture!==null,outputColorSpace:W===null?n.outputColorSpace:W.isXRRenderTarget===!0?W.texture.colorSpace:ke.workingColorSpace,alphaToCoverage:!!x.alphaToCoverage,map:ut,matcap:Be,envMap:et,envMapMode:et&&P.mapping,envMapCubeUVHeight:Z,aoMap:$e,lightMap:Ve,bumpMap:ft,normalMap:gt,displacementMap:vt,emissiveMap:Et,normalMapObjectSpace:gt&&x.normalMapType===sp,normalMapTangentSpace:gt&&x.normalMapType===Bc,packedNormalMap:gt&&x.normalMapType===Bc&&Ux(x.normalMap.format),metalnessMap:at,roughnessMap:pt,anisotropy:D,anisotropyMap:V,clearcoat:Bt,clearcoatMap:K,clearcoatNormalMap:re,clearcoatRoughnessMap:ae,dispersion:Ke,iridescence:T,iridescenceMap:J,iridescenceThicknessMap:ee,sheen:_,sheenColorMap:oe,sheenRoughnessMap:ye,specularMap:de,specularColorMap:ce,specularIntensityMap:Ae,transmission:O,transmissionMap:Re,thicknessMap:Le,gradientMap:L,opaque:x.transparent===!1&&x.blending===Oi&&x.alphaToCoverage===!1,alphaMap:se,alphaTest:j,alphaHash:le,combine:x.combine,mapUv:ut&&g(x.map.channel),aoMapUv:$e&&g(x.aoMap.channel),lightMapUv:Ve&&g(x.lightMap.channel),bumpMapUv:ft&&g(x.bumpMap.channel),normalMapUv:gt&&g(x.normalMap.channel),displacementMapUv:vt&&g(x.displacementMap.channel),emissiveMapUv:Et&&g(x.emissiveMap.channel),metalnessMapUv:at&&g(x.metalnessMap.channel),roughnessMapUv:pt&&g(x.roughnessMap.channel),anisotropyMapUv:V&&g(x.anisotropyMap.channel),clearcoatMapUv:K&&g(x.clearcoatMap.channel),clearcoatNormalMapUv:re&&g(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ae&&g(x.clearcoatRoughnessMap.channel),iridescenceMapUv:J&&g(x.iridescenceMap.channel),iridescenceThicknessMapUv:ee&&g(x.iridescenceThicknessMap.channel),sheenColorMapUv:oe&&g(x.sheenColorMap.channel),sheenRoughnessMapUv:ye&&g(x.sheenRoughnessMap.channel),specularMapUv:de&&g(x.specularMap.channel),specularColorMapUv:ce&&g(x.specularColorMap.channel),specularIntensityMapUv:Ae&&g(x.specularIntensityMap.channel),transmissionMapUv:Re&&g(x.transmissionMap.channel),thicknessMapUv:Le&&g(x.thicknessMap.channel),alphaMapUv:se&&g(x.alphaMap.channel),vertexTangents:!!z.attributes.tangent&&(gt||D),vertexNormals:!!z.attributes.normal,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,pointsUvs:F.isPoints===!0&&!!z.attributes.uv&&(ut||se),fog:!!q,useFog:x.fog===!0,fogExp2:!!q&&q.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||z.attributes.normal===void 0&&gt===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:p,reversedDepthBuffer:Se,skinning:F.isSkinnedMesh===!0,hasPositionAttribute:z.attributes.position!==void 0,morphTargets:z.morphAttributes.position!==void 0,morphNormals:z.morphAttributes.normal!==void 0,morphColors:z.morphAttributes.color!==void 0,morphTargetsCount:ue,morphTextureStride:Fe,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numLightProbeGrids:$.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:x.dithering,shadowMapEnabled:n.shadowMap.enabled&&I.length>0,shadowMapType:n.shadowMap.type,toneMapping:te,decodeVideoTexture:ut&&x.map.isVideoTexture===!0&&ke.getTransfer(x.map.colorSpace)===Ze,decodeVideoTextureEmissive:Et&&x.emissiveMap.isVideoTexture===!0&&ke.getTransfer(x.emissiveMap.colorSpace)===Ze,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===Rn,flipSided:x.side===Ut,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:me&&x.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(me&&x.extensions.multiDraw===!0||we)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return Ee.vertexUv1s=c.has(1),Ee.vertexUv2s=c.has(2),Ee.vertexUv3s=c.has(3),c.clear(),Ee}function f(x){const y=[];if(x.shaderID?y.push(x.shaderID):(y.push(x.customVertexShaderID),y.push(x.customFragmentShaderID)),x.defines!==void 0)for(const I in x.defines)y.push(I),y.push(x.defines[I]);return x.isRawShaderMaterial===!1&&(d(y,x),E(y,x),y.push(n.outputColorSpace)),y.push(x.customProgramCacheKey),y.join()}function d(x,y){x.push(y.precision),x.push(y.outputColorSpace),x.push(y.envMapMode),x.push(y.envMapCubeUVHeight),x.push(y.mapUv),x.push(y.alphaMapUv),x.push(y.lightMapUv),x.push(y.aoMapUv),x.push(y.bumpMapUv),x.push(y.normalMapUv),x.push(y.displacementMapUv),x.push(y.emissiveMapUv),x.push(y.metalnessMapUv),x.push(y.roughnessMapUv),x.push(y.anisotropyMapUv),x.push(y.clearcoatMapUv),x.push(y.clearcoatNormalMapUv),x.push(y.clearcoatRoughnessMapUv),x.push(y.iridescenceMapUv),x.push(y.iridescenceThicknessMapUv),x.push(y.sheenColorMapUv),x.push(y.sheenRoughnessMapUv),x.push(y.specularMapUv),x.push(y.specularColorMapUv),x.push(y.specularIntensityMapUv),x.push(y.transmissionMapUv),x.push(y.thicknessMapUv),x.push(y.combine),x.push(y.fogExp2),x.push(y.sizeAttenuation),x.push(y.morphTargetsCount),x.push(y.morphAttributeCount),x.push(y.numDirLights),x.push(y.numPointLights),x.push(y.numSpotLights),x.push(y.numSpotLightMaps),x.push(y.numHemiLights),x.push(y.numRectAreaLights),x.push(y.numDirLightShadows),x.push(y.numPointLightShadows),x.push(y.numSpotLightShadows),x.push(y.numSpotLightShadowsWithMaps),x.push(y.numLightProbes),x.push(y.shadowMapType),x.push(y.toneMapping),x.push(y.numClippingPlanes),x.push(y.numClipIntersection),x.push(y.depthPacking)}function E(x,y){a.disableAll(),y.instancing&&a.enable(0),y.instancingColor&&a.enable(1),y.instancingMorph&&a.enable(2),y.matcap&&a.enable(3),y.envMap&&a.enable(4),y.normalMapObjectSpace&&a.enable(5),y.normalMapTangentSpace&&a.enable(6),y.clearcoat&&a.enable(7),y.iridescence&&a.enable(8),y.alphaTest&&a.enable(9),y.vertexColors&&a.enable(10),y.vertexAlphas&&a.enable(11),y.vertexUv1s&&a.enable(12),y.vertexUv2s&&a.enable(13),y.vertexUv3s&&a.enable(14),y.vertexTangents&&a.enable(15),y.anisotropy&&a.enable(16),y.alphaHash&&a.enable(17),y.batching&&a.enable(18),y.dispersion&&a.enable(19),y.batchingColor&&a.enable(20),y.gradientMap&&a.enable(21),y.packedNormalMap&&a.enable(22),y.vertexNormals&&a.enable(23),x.push(a.mask),a.disableAll(),y.fog&&a.enable(0),y.useFog&&a.enable(1),y.flatShading&&a.enable(2),y.logarithmicDepthBuffer&&a.enable(3),y.reversedDepthBuffer&&a.enable(4),y.skinning&&a.enable(5),y.morphTargets&&a.enable(6),y.morphNormals&&a.enable(7),y.morphColors&&a.enable(8),y.premultipliedAlpha&&a.enable(9),y.shadowMapEnabled&&a.enable(10),y.doubleSided&&a.enable(11),y.flipSided&&a.enable(12),y.useDepthPacking&&a.enable(13),y.dithering&&a.enable(14),y.transmission&&a.enable(15),y.sheen&&a.enable(16),y.opaque&&a.enable(17),y.pointsUvs&&a.enable(18),y.decodeVideoTexture&&a.enable(19),y.decodeVideoTextureEmissive&&a.enable(20),y.alphaToCoverage&&a.enable(21),y.numLightProbeGrids>0&&a.enable(22),y.hasPositionAttribute&&a.enable(23),x.push(a.mask)}function A(x){const y=m[x.type];let I;if(y){const C=fn[y];I=am.clone(C.uniforms)}else I=x.uniforms;return I}function S(x,y){let I=h.get(y);return I!==void 0?++I.usedTimes:(I=new Ix(n,y,x,r),l.push(I),h.set(y,I)),I}function w(x){if(--x.usedTimes===0){const y=l.indexOf(x);l[y]=l[l.length-1],l.pop(),h.delete(x.cacheKey),x.destroy()}}function b(x){o.remove(x)}function R(){o.dispose()}return{getParameters:v,getProgramCacheKey:f,getUniforms:A,acquireProgram:S,releaseProgram:w,releaseShaderCache:b,programs:l,dispose:R}}function Ox(){let n=new WeakMap;function e(a){return n.has(a)}function t(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function i(a){n.delete(a)}function r(a,o,c){n.get(a)[o]=c}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function Bx(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function Pl(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Il(){const n=[];let e=0;const t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function a(u){let m=0;return u.isInstancedMesh&&(m+=2),u.isSkinnedMesh&&(m+=1),m}function o(u,m,g,v,f,d){let E=n[e];return E===void 0?(E={id:u.id,object:u,geometry:m,material:g,materialVariant:a(u),groupOrder:v,renderOrder:u.renderOrder,z:f,group:d},n[e]=E):(E.id=u.id,E.object=u,E.geometry=m,E.material=g,E.materialVariant=a(u),E.groupOrder=v,E.renderOrder=u.renderOrder,E.z=f,E.group=d),e++,E}function c(u,m,g,v,f,d){const E=o(u,m,g,v,f,d);g.transmission>0?i.push(E):g.transparent===!0?r.push(E):t.push(E)}function l(u,m,g,v,f,d){const E=o(u,m,g,v,f,d);g.transmission>0?i.unshift(E):g.transparent===!0?r.unshift(E):t.unshift(E)}function h(u,m,g){t.length>1&&t.sort(u||Bx),i.length>1&&i.sort(m||Pl),r.length>1&&r.sort(m||Pl),g&&(t.reverse(),i.reverse(),r.reverse())}function p(){for(let u=e,m=n.length;u<m;u++){const g=n[u];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:c,unshift:l,finish:p,sort:h}}function zx(){let n=new WeakMap;function e(i,r){const s=n.get(i);let a;return s===void 0?(a=new Il,n.set(i,[a])):r>=s.length?(a=new Il,s.push(a)):a=s[r],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function Gx(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new U,color:new Xe};break;case"SpotLight":t={position:new U,direction:new U,color:new Xe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new U,color:new Xe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new U,skyColor:new Xe,groundColor:new Xe};break;case"RectAreaLight":t={color:new Xe,position:new U,halfWidth:new U,halfHeight:new U};break}return n[e.id]=t,t}}}function kx(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ye};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ye};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ye,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let Vx=0;function Hx(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function Wx(n){const e=new Gx,t=kx(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new U);const r=new U,s=new Qe,a=new Qe;function o(l){let h=0,p=0,u=0;for(let y=0;y<9;y++)i.probe[y].set(0,0,0);let m=0,g=0,v=0,f=0,d=0,E=0,A=0,S=0,w=0,b=0,R=0;l.sort(Hx);for(let y=0,I=l.length;y<I;y++){const C=l[y],F=C.color,$=C.intensity,q=C.distance;let z=null;if(C.shadow&&C.shadow.map&&(C.shadow.map.texture.format===pi?z=C.shadow.map.texture:z=C.shadow.map.depthTexture||C.shadow.map.texture),C.isAmbientLight)h+=F.r*$,p+=F.g*$,u+=F.b*$;else if(C.isLightProbe){for(let Y=0;Y<9;Y++)i.probe[Y].addScaledVector(C.sh.coefficients[Y],$);R++}else if(C.isDirectionalLight){const Y=e.get(C);if(Y.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){const X=C.shadow,P=t.get(C);P.shadowIntensity=X.intensity,P.shadowBias=X.bias,P.shadowNormalBias=X.normalBias,P.shadowRadius=X.radius,P.shadowMapSize=X.mapSize,i.directionalShadow[m]=P,i.directionalShadowMap[m]=z,i.directionalShadowMatrix[m]=C.shadow.matrix,E++}i.directional[m]=Y,m++}else if(C.isSpotLight){const Y=e.get(C);Y.position.setFromMatrixPosition(C.matrixWorld),Y.color.copy(F).multiplyScalar($),Y.distance=q,Y.coneCos=Math.cos(C.angle),Y.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),Y.decay=C.decay,i.spot[v]=Y;const X=C.shadow;if(C.map&&(i.spotLightMap[w]=C.map,w++,X.updateMatrices(C),C.castShadow&&b++),i.spotLightMatrix[v]=X.matrix,C.castShadow){const P=t.get(C);P.shadowIntensity=X.intensity,P.shadowBias=X.bias,P.shadowNormalBias=X.normalBias,P.shadowRadius=X.radius,P.shadowMapSize=X.mapSize,i.spotShadow[v]=P,i.spotShadowMap[v]=z,S++}v++}else if(C.isRectAreaLight){const Y=e.get(C);Y.color.copy(F).multiplyScalar($),Y.halfWidth.set(C.width*.5,0,0),Y.halfHeight.set(0,C.height*.5,0),i.rectArea[f]=Y,f++}else if(C.isPointLight){const Y=e.get(C);if(Y.color.copy(C.color).multiplyScalar(C.intensity),Y.distance=C.distance,Y.decay=C.decay,C.castShadow){const X=C.shadow,P=t.get(C);P.shadowIntensity=X.intensity,P.shadowBias=X.bias,P.shadowNormalBias=X.normalBias,P.shadowRadius=X.radius,P.shadowMapSize=X.mapSize,P.shadowCameraNear=X.camera.near,P.shadowCameraFar=X.camera.far,i.pointShadow[g]=P,i.pointShadowMap[g]=z,i.pointShadowMatrix[g]=C.shadow.matrix,A++}i.point[g]=Y,g++}else if(C.isHemisphereLight){const Y=e.get(C);Y.skyColor.copy(C.color).multiplyScalar($),Y.groundColor.copy(C.groundColor).multiplyScalar($),i.hemi[d]=Y,d++}}f>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=he.LTC_FLOAT_1,i.rectAreaLTC2=he.LTC_FLOAT_2):(i.rectAreaLTC1=he.LTC_HALF_1,i.rectAreaLTC2=he.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=p,i.ambient[2]=u;const x=i.hash;(x.directionalLength!==m||x.pointLength!==g||x.spotLength!==v||x.rectAreaLength!==f||x.hemiLength!==d||x.numDirectionalShadows!==E||x.numPointShadows!==A||x.numSpotShadows!==S||x.numSpotMaps!==w||x.numLightProbes!==R)&&(i.directional.length=m,i.spot.length=v,i.rectArea.length=f,i.point.length=g,i.hemi.length=d,i.directionalShadow.length=E,i.directionalShadowMap.length=E,i.pointShadow.length=A,i.pointShadowMap.length=A,i.spotShadow.length=S,i.spotShadowMap.length=S,i.directionalShadowMatrix.length=E,i.pointShadowMatrix.length=A,i.spotLightMatrix.length=S+w-b,i.spotLightMap.length=w,i.numSpotLightShadowsWithMaps=b,i.numLightProbes=R,x.directionalLength=m,x.pointLength=g,x.spotLength=v,x.rectAreaLength=f,x.hemiLength=d,x.numDirectionalShadows=E,x.numPointShadows=A,x.numSpotShadows=S,x.numSpotMaps=w,x.numLightProbes=R,i.version=Vx++)}function c(l,h){let p=0,u=0,m=0,g=0,v=0;const f=h.matrixWorldInverse;for(let d=0,E=l.length;d<E;d++){const A=l[d];if(A.isDirectionalLight){const S=i.directional[p];S.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(f),p++}else if(A.isSpotLight){const S=i.spot[m];S.position.setFromMatrixPosition(A.matrixWorld),S.position.applyMatrix4(f),S.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(f),m++}else if(A.isRectAreaLight){const S=i.rectArea[g];S.position.setFromMatrixPosition(A.matrixWorld),S.position.applyMatrix4(f),a.identity(),s.copy(A.matrixWorld),s.premultiply(f),a.extractRotation(s),S.halfWidth.set(A.width*.5,0,0),S.halfHeight.set(0,A.height*.5,0),S.halfWidth.applyMatrix4(a),S.halfHeight.applyMatrix4(a),g++}else if(A.isPointLight){const S=i.point[u];S.position.setFromMatrixPosition(A.matrixWorld),S.position.applyMatrix4(f),u++}else if(A.isHemisphereLight){const S=i.hemi[v];S.direction.setFromMatrixPosition(A.matrixWorld),S.direction.transformDirection(f),v++}}}return{setup:o,setupView:c,state:i}}function Ll(n){const e=new Wx(n),t=[],i=[],r=[];function s(u){p.camera=u,t.length=0,i.length=0,r.length=0}function a(u){t.push(u)}function o(u){i.push(u)}function c(u){r.push(u)}function l(){e.setup(t)}function h(u){e.setupView(t,u)}const p={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:p,setupLights:l,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:c}}function Xx(n){let e=new WeakMap;function t(r,s=0){const a=e.get(r);let o;return a===void 0?(o=new Ll(n),e.set(r,[o])):s>=a.length?(o=new Ll(n),a.push(o)):o=a[s],o}function i(){e=new WeakMap}return{get:t,dispose:i}}const Yx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,$x=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,qx=[new U(1,0,0),new U(-1,0,0),new U(0,1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1)],Kx=[new U(0,-1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1),new U(0,-1,0),new U(0,-1,0)],Dl=new Qe,ir=new U,La=new U;function Zx(n,e,t){let i=new id;const r=new Ye,s=new Ye,a=new lt,o=new um,c=new dm,l={},h=t.maxTextureSize,p={[Zn]:Ut,[Ut]:Zn,[Rn]:Rn},u=new on({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ye},radius:{value:4}},vertexShader:Yx,fragmentShader:$x}),m=u.clone();m.defines.HORIZONTAL_PASS=1;const g=new It;g.setAttribute("position",new Ot(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new bt(g,u),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ls;let d=this.type;this.render=function(b,R,x){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||b.length===0)return;this.type===Ff&&(Ce("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=ls);const y=n.getRenderTarget(),I=n.getActiveCubeFace(),C=n.getActiveMipmapLevel(),F=n.state;F.setBlending(In),F.buffers.depth.getReversed()===!0?F.buffers.color.setClear(0,0,0,0):F.buffers.color.setClear(1,1,1,1),F.buffers.depth.setTest(!0),F.setScissorTest(!1);const $=d!==this.type;$&&R.traverse(function(q){q.material&&(Array.isArray(q.material)?q.material.forEach(z=>z.needsUpdate=!0):q.material.needsUpdate=!0)});for(let q=0,z=b.length;q<z;q++){const Y=b[q],X=Y.shadow;if(X===void 0){Ce("WebGLShadowMap:",Y,"has no shadow.");continue}if(X.autoUpdate===!1&&X.needsUpdate===!1)continue;r.copy(X.mapSize);const P=X.getFrameExtents();r.multiply(P),s.copy(X.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(s.x=Math.floor(h/P.x),r.x=s.x*P.x,X.mapSize.x=s.x),r.y>h&&(s.y=Math.floor(h/P.y),r.y=s.y*P.y,X.mapSize.y=s.y));const Z=n.state.buffers.depth.getReversed();if(X.camera._reversedDepth=Z,X.map===null||$===!0){if(X.map!==null&&(X.map.depthTexture!==null&&(X.map.depthTexture.dispose(),X.map.depthTexture=null),X.map.dispose()),this.type===ar){if(Y.isPointLight){Ce("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}X.map=new vn(r.x,r.y,{format:pi,type:Un,minFilter:Pt,magFilter:Pt,generateMipmaps:!1}),X.map.texture.name=Y.name+".shadowMap",X.map.depthTexture=new Wi(r.x,r.y,pn),X.map.depthTexture.name=Y.name+".shadowMapDepth",X.map.depthTexture.format=Fn,X.map.depthTexture.compareFunction=null,X.map.depthTexture.minFilter=Tt,X.map.depthTexture.magFilter=Tt}else Y.isPointLight?(X.map=new hd(r.x),X.map.depthTexture=new im(r.x,Sn)):(X.map=new vn(r.x,r.y),X.map.depthTexture=new Wi(r.x,r.y,Sn)),X.map.depthTexture.name=Y.name+".shadowMap",X.map.depthTexture.format=Fn,this.type===ls?(X.map.depthTexture.compareFunction=Z?nc:tc,X.map.depthTexture.minFilter=Pt,X.map.depthTexture.magFilter=Pt):(X.map.depthTexture.compareFunction=null,X.map.depthTexture.minFilter=Tt,X.map.depthTexture.magFilter=Tt);X.camera.updateProjectionMatrix()}const ne=X.map.isWebGLCubeRenderTarget?6:1;for(let ie=0;ie<ne;ie++){if(X.map.isWebGLCubeRenderTarget)n.setRenderTarget(X.map,ie),n.clear();else{ie===0&&(n.setRenderTarget(X.map),n.clear());const ue=X.getViewport(ie);a.set(s.x*ue.x,s.y*ue.y,s.x*ue.z,s.y*ue.w),F.viewport(a)}if(Y.isPointLight){const ue=X.camera,Fe=X.matrix,qe=Y.distance||ue.far;qe!==ue.far&&(ue.far=qe,ue.updateProjectionMatrix()),ir.setFromMatrixPosition(Y.matrixWorld),ue.position.copy(ir),La.copy(ue.position),La.add(qx[ie]),ue.up.copy(Kx[ie]),ue.lookAt(La),ue.updateMatrixWorld(),Fe.makeTranslation(-ir.x,-ir.y,-ir.z),Dl.multiplyMatrices(ue.projectionMatrix,ue.matrixWorldInverse),X._frustum.setFromProjectionMatrix(Dl,ue.coordinateSystem,ue.reversedDepth)}else X.updateMatrices(Y);i=X.getFrustum(),S(R,x,X.camera,Y,this.type)}X.isPointLightShadow!==!0&&this.type===ar&&E(X,x),X.needsUpdate=!1}d=this.type,f.needsUpdate=!1,n.setRenderTarget(y,I,C)};function E(b,R){const x=e.update(v);u.defines.VSM_SAMPLES!==b.blurSamples&&(u.defines.VSM_SAMPLES=b.blurSamples,m.defines.VSM_SAMPLES=b.blurSamples,u.needsUpdate=!0,m.needsUpdate=!0),b.mapPass===null&&(b.mapPass=new vn(r.x,r.y,{format:pi,type:Un})),u.uniforms.shadow_pass.value=b.map.depthTexture,u.uniforms.resolution.value=b.mapSize,u.uniforms.radius.value=b.radius,n.setRenderTarget(b.mapPass),n.clear(),n.renderBufferDirect(R,null,x,u,v,null),m.uniforms.shadow_pass.value=b.mapPass.texture,m.uniforms.resolution.value=b.mapSize,m.uniforms.radius.value=b.radius,n.setRenderTarget(b.map),n.clear(),n.renderBufferDirect(R,null,x,m,v,null)}function A(b,R,x,y){let I=null;const C=x.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(C!==void 0)I=C;else if(I=x.isPointLight===!0?c:o,n.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){const F=I.uuid,$=R.uuid;let q=l[F];q===void 0&&(q={},l[F]=q);let z=q[$];z===void 0&&(z=I.clone(),q[$]=z,R.addEventListener("dispose",w)),I=z}if(I.visible=R.visible,I.wireframe=R.wireframe,y===ar?I.side=R.shadowSide!==null?R.shadowSide:R.side:I.side=R.shadowSide!==null?R.shadowSide:p[R.side],I.alphaMap=R.alphaMap,I.alphaTest=R.alphaToCoverage===!0?.5:R.alphaTest,I.map=R.map,I.clipShadows=R.clipShadows,I.clippingPlanes=R.clippingPlanes,I.clipIntersection=R.clipIntersection,I.displacementMap=R.displacementMap,I.displacementScale=R.displacementScale,I.displacementBias=R.displacementBias,I.wireframeLinewidth=R.wireframeLinewidth,I.linewidth=R.linewidth,x.isPointLight===!0&&I.isMeshDistanceMaterial===!0){const F=n.properties.get(I);F.light=x}return I}function S(b,R,x,y,I){if(b.visible===!1)return;if(b.layers.test(R.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&I===ar)&&(!b.frustumCulled||i.intersectsObject(b))){b.modelViewMatrix.multiplyMatrices(x.matrixWorldInverse,b.matrixWorld);const $=e.update(b),q=b.material;if(Array.isArray(q)){const z=$.groups;for(let Y=0,X=z.length;Y<X;Y++){const P=z[Y],Z=q[P.materialIndex];if(Z&&Z.visible){const ne=A(b,Z,y,I);b.onBeforeShadow(n,b,R,x,$,ne,P),n.renderBufferDirect(x,null,$,ne,b,P),b.onAfterShadow(n,b,R,x,$,ne,P)}}}else if(q.visible){const z=A(b,q,y,I);b.onBeforeShadow(n,b,R,x,$,z,null),n.renderBufferDirect(x,null,$,z,b,null),b.onAfterShadow(n,b,R,x,$,z,null)}}const F=b.children;for(let $=0,q=F.length;$<q;$++)S(F[$],R,x,y,I)}function w(b){b.target.removeEventListener("dispose",w);for(const x in l){const y=l[x],I=b.target.uuid;I in y&&(y[I].dispose(),delete y[I])}}}function Jx(n,e){function t(){let L=!1;const se=new lt;let j=null;const le=new lt(0,0,0,0);return{setMask:function(me){j!==me&&!L&&(n.colorMask(me,me,me,me),j=me)},setLocked:function(me){L=me},setClear:function(me,te,Ee,ve,ot){ot===!0&&(me*=ve,te*=ve,Ee*=ve),se.set(me,te,Ee,ve),le.equals(se)===!1&&(n.clearColor(me,te,Ee,ve),le.copy(se))},reset:function(){L=!1,j=null,le.set(-1,0,0,0)}}}function i(){let L=!1,se=!1,j=null,le=null,me=null;return{setReversed:function(te){if(se!==te){const Ee=e.get("EXT_clip_control");te?Ee.clipControlEXT(Ee.LOWER_LEFT_EXT,Ee.ZERO_TO_ONE_EXT):Ee.clipControlEXT(Ee.LOWER_LEFT_EXT,Ee.NEGATIVE_ONE_TO_ONE_EXT),se=te;const ve=me;me=null,this.setClear(ve)}},getReversed:function(){return se},setTest:function(te){te?W(n.DEPTH_TEST):Se(n.DEPTH_TEST)},setMask:function(te){j!==te&&!L&&(n.depthMask(te),j=te)},setFunc:function(te){if(se&&(te=mp[te]),le!==te){switch(te){case Ja:n.depthFunc(n.NEVER);break;case Qa:n.depthFunc(n.ALWAYS);break;case ja:n.depthFunc(n.LESS);break;case Vi:n.depthFunc(n.LEQUAL);break;case eo:n.depthFunc(n.EQUAL);break;case to:n.depthFunc(n.GEQUAL);break;case no:n.depthFunc(n.GREATER);break;case io:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}le=te}},setLocked:function(te){L=te},setClear:function(te){me!==te&&(me=te,se&&(te=1-te),n.clearDepth(te))},reset:function(){L=!1,j=null,le=null,me=null,se=!1}}}function r(){let L=!1,se=null,j=null,le=null,me=null,te=null,Ee=null,ve=null,ot=null;return{setTest:function(it){L||(it?W(n.STENCIL_TEST):Se(n.STENCIL_TEST))},setMask:function(it){se!==it&&!L&&(n.stencilMask(it),se=it)},setFunc:function(it,cn,ln){(j!==it||le!==cn||me!==ln)&&(n.stencilFunc(it,cn,ln),j=it,le=cn,me=ln)},setOp:function(it,cn,ln){(te!==it||Ee!==cn||ve!==ln)&&(n.stencilOp(it,cn,ln),te=it,Ee=cn,ve=ln)},setLocked:function(it){L=it},setClear:function(it){ot!==it&&(n.clearStencil(it),ot=it)},reset:function(){L=!1,se=null,j=null,le=null,me=null,te=null,Ee=null,ve=null,ot=null}}}const s=new t,a=new i,o=new r,c=new WeakMap,l=new WeakMap;let h={},p={},u={},m=new WeakMap,g=[],v=null,f=!1,d=null,E=null,A=null,S=null,w=null,b=null,R=null,x=new Xe(0,0,0),y=0,I=!1,C=null,F=null,$=null,q=null,z=null;const Y=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let X=!1,P=0;const Z=n.getParameter(n.VERSION);Z.indexOf("WebGL")!==-1?(P=parseFloat(/^WebGL (\d)/.exec(Z)[1]),X=P>=1):Z.indexOf("OpenGL ES")!==-1&&(P=parseFloat(/^OpenGL ES (\d)/.exec(Z)[1]),X=P>=2);let ne=null,ie={};const ue=n.getParameter(n.SCISSOR_BOX),Fe=n.getParameter(n.VIEWPORT),qe=new lt().fromArray(ue),Ge=new lt().fromArray(Fe);function Q(L,se,j,le){const me=new Uint8Array(4),te=n.createTexture();n.bindTexture(L,te),n.texParameteri(L,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(L,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Ee=0;Ee<j;Ee++)L===n.TEXTURE_3D||L===n.TEXTURE_2D_ARRAY?n.texImage3D(se,0,n.RGBA,1,1,le,0,n.RGBA,n.UNSIGNED_BYTE,me):n.texImage2D(se+Ee,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,me);return te}const B={};B[n.TEXTURE_2D]=Q(n.TEXTURE_2D,n.TEXTURE_2D,1),B[n.TEXTURE_CUBE_MAP]=Q(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),B[n.TEXTURE_2D_ARRAY]=Q(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),B[n.TEXTURE_3D]=Q(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),W(n.DEPTH_TEST),a.setFunc(Vi),ft(!1),gt(Nc),W(n.CULL_FACE),$e(In);function W(L){h[L]!==!0&&(n.enable(L),h[L]=!0)}function Se(L){h[L]!==!1&&(n.disable(L),h[L]=!1)}function Pe(L,se){return u[L]!==se?(n.bindFramebuffer(L,se),u[L]=se,L===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=se),L===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=se),!0):!1}function we(L,se){let j=g,le=!1;if(L){j=m.get(se),j===void 0&&(j=[],m.set(se,j));const me=L.textures;if(j.length!==me.length||j[0]!==n.COLOR_ATTACHMENT0){for(let te=0,Ee=me.length;te<Ee;te++)j[te]=n.COLOR_ATTACHMENT0+te;j.length=me.length,le=!0}}else j[0]!==n.BACK&&(j[0]=n.BACK,le=!0);le&&n.drawBuffers(j)}function ut(L){return v!==L?(n.useProgram(L),v=L,!0):!1}const Be={[si]:n.FUNC_ADD,[Bf]:n.FUNC_SUBTRACT,[zf]:n.FUNC_REVERSE_SUBTRACT};Be[Gf]=n.MIN,Be[kf]=n.MAX;const et={[Vf]:n.ZERO,[Hf]:n.ONE,[Wf]:n.SRC_COLOR,[Ka]:n.SRC_ALPHA,[Zf]:n.SRC_ALPHA_SATURATE,[qf]:n.DST_COLOR,[Yf]:n.DST_ALPHA,[Xf]:n.ONE_MINUS_SRC_COLOR,[Za]:n.ONE_MINUS_SRC_ALPHA,[Kf]:n.ONE_MINUS_DST_COLOR,[$f]:n.ONE_MINUS_DST_ALPHA,[Jf]:n.CONSTANT_COLOR,[Qf]:n.ONE_MINUS_CONSTANT_COLOR,[jf]:n.CONSTANT_ALPHA,[ep]:n.ONE_MINUS_CONSTANT_ALPHA};function $e(L,se,j,le,me,te,Ee,ve,ot,it){if(L===In){f===!0&&(Se(n.BLEND),f=!1);return}if(f===!1&&(W(n.BLEND),f=!0),L!==Of){if(L!==d||it!==I){if((E!==si||w!==si)&&(n.blendEquation(n.FUNC_ADD),E=si,w=si),it)switch(L){case Oi:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Uc:n.blendFunc(n.ONE,n.ONE);break;case Fc:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Oc:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:We("WebGLState: Invalid blending: ",L);break}else switch(L){case Oi:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Uc:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Fc:We("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Oc:We("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:We("WebGLState: Invalid blending: ",L);break}A=null,S=null,b=null,R=null,x.set(0,0,0),y=0,d=L,I=it}return}me=me||se,te=te||j,Ee=Ee||le,(se!==E||me!==w)&&(n.blendEquationSeparate(Be[se],Be[me]),E=se,w=me),(j!==A||le!==S||te!==b||Ee!==R)&&(n.blendFuncSeparate(et[j],et[le],et[te],et[Ee]),A=j,S=le,b=te,R=Ee),(ve.equals(x)===!1||ot!==y)&&(n.blendColor(ve.r,ve.g,ve.b,ot),x.copy(ve),y=ot),d=L,I=!1}function Ve(L,se){L.side===Rn?Se(n.CULL_FACE):W(n.CULL_FACE);let j=L.side===Ut;se&&(j=!j),ft(j),L.blending===Oi&&L.transparent===!1?$e(In):$e(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),a.setFunc(L.depthFunc),a.setTest(L.depthTest),a.setMask(L.depthWrite),s.setMask(L.colorWrite);const le=L.stencilWrite;o.setTest(le),le&&(o.setMask(L.stencilWriteMask),o.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),o.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),Et(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?W(n.SAMPLE_ALPHA_TO_COVERAGE):Se(n.SAMPLE_ALPHA_TO_COVERAGE)}function ft(L){C!==L&&(L?n.frontFace(n.CW):n.frontFace(n.CCW),C=L)}function gt(L){L!==Nf?(W(n.CULL_FACE),L!==F&&(L===Nc?n.cullFace(n.BACK):L===Uf?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Se(n.CULL_FACE),F=L}function vt(L){L!==$&&(X&&n.lineWidth(L),$=L)}function Et(L,se,j){L?(W(n.POLYGON_OFFSET_FILL),(q!==se||z!==j)&&(q=se,z=j,a.getReversed()&&(se=-se),n.polygonOffset(se,j))):Se(n.POLYGON_OFFSET_FILL)}function at(L){L?W(n.SCISSOR_TEST):Se(n.SCISSOR_TEST)}function pt(L){L===void 0&&(L=n.TEXTURE0+Y-1),ne!==L&&(n.activeTexture(L),ne=L)}function D(L,se,j){j===void 0&&(ne===null?j=n.TEXTURE0+Y-1:j=ne);let le=ie[j];le===void 0&&(le={type:void 0,texture:void 0},ie[j]=le),(le.type!==L||le.texture!==se)&&(ne!==j&&(n.activeTexture(j),ne=j),n.bindTexture(L,se||B[L]),le.type=L,le.texture=se)}function Bt(){const L=ie[ne];L!==void 0&&L.type!==void 0&&(n.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function Ke(){try{n.compressedTexImage2D(...arguments)}catch(L){We("WebGLState:",L)}}function T(){try{n.compressedTexImage3D(...arguments)}catch(L){We("WebGLState:",L)}}function _(){try{n.texSubImage2D(...arguments)}catch(L){We("WebGLState:",L)}}function O(){try{n.texSubImage3D(...arguments)}catch(L){We("WebGLState:",L)}}function V(){try{n.compressedTexSubImage2D(...arguments)}catch(L){We("WebGLState:",L)}}function K(){try{n.compressedTexSubImage3D(...arguments)}catch(L){We("WebGLState:",L)}}function re(){try{n.texStorage2D(...arguments)}catch(L){We("WebGLState:",L)}}function ae(){try{n.texStorage3D(...arguments)}catch(L){We("WebGLState:",L)}}function J(){try{n.texImage2D(...arguments)}catch(L){We("WebGLState:",L)}}function ee(){try{n.texImage3D(...arguments)}catch(L){We("WebGLState:",L)}}function oe(L){return p[L]!==void 0?p[L]:n.getParameter(L)}function ye(L,se){p[L]!==se&&(n.pixelStorei(L,se),p[L]=se)}function de(L){qe.equals(L)===!1&&(n.scissor(L.x,L.y,L.z,L.w),qe.copy(L))}function ce(L){Ge.equals(L)===!1&&(n.viewport(L.x,L.y,L.z,L.w),Ge.copy(L))}function Ae(L,se){let j=l.get(se);j===void 0&&(j=new WeakMap,l.set(se,j));let le=j.get(L);le===void 0&&(le=n.getUniformBlockIndex(se,L.name),j.set(L,le))}function Re(L,se){const le=l.get(se).get(L);c.get(se)!==le&&(n.uniformBlockBinding(se,le,L.__bindingPointIndex),c.set(se,le))}function Le(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),a.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),h={},p={},ne=null,ie={},u={},m=new WeakMap,g=[],v=null,f=!1,d=null,E=null,A=null,S=null,w=null,b=null,R=null,x=new Xe(0,0,0),y=0,I=!1,C=null,F=null,$=null,q=null,z=null,qe.set(0,0,n.canvas.width,n.canvas.height),Ge.set(0,0,n.canvas.width,n.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:W,disable:Se,bindFramebuffer:Pe,drawBuffers:we,useProgram:ut,setBlending:$e,setMaterial:Ve,setFlipSided:ft,setCullFace:gt,setLineWidth:vt,setPolygonOffset:Et,setScissorTest:at,activeTexture:pt,bindTexture:D,unbindTexture:Bt,compressedTexImage2D:Ke,compressedTexImage3D:T,texImage2D:J,texImage3D:ee,pixelStorei:ye,getParameter:oe,updateUBOMapping:Ae,uniformBlockBinding:Re,texStorage2D:re,texStorage3D:ae,texSubImage2D:_,texSubImage3D:O,compressedTexSubImage2D:V,compressedTexSubImage3D:K,scissor:de,viewport:ce,reset:Le}}function Qx(n,e,t,i,r,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Ye,h=new WeakMap,p=new Set;let u;const m=new WeakMap;let g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function v(T,_){return g?new OffscreenCanvas(T,_):Ts("canvas")}function f(T,_,O){let V=1;const K=Ke(T);if((K.width>O||K.height>O)&&(V=O/Math.max(K.width,K.height)),V<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){const re=Math.floor(V*K.width),ae=Math.floor(V*K.height);u===void 0&&(u=v(re,ae));const J=_?v(re,ae):u;return J.width=re,J.height=ae,J.getContext("2d").drawImage(T,0,0,re,ae),Ce("WebGLRenderer: Texture has been resized from ("+K.width+"x"+K.height+") to ("+re+"x"+ae+")."),J}else return"data"in T&&Ce("WebGLRenderer: Image in DataTexture is too big ("+K.width+"x"+K.height+")."),T;return T}function d(T){return T.generateMipmaps}function E(T){n.generateMipmap(T)}function A(T){return T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?n.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function S(T,_,O,V,K,re=!1){if(T!==null){if(n[T]!==void 0)return n[T];Ce("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let ae;V&&(ae=e.get("EXT_texture_norm16"),ae||Ce("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let J=_;if(_===n.RED&&(O===n.FLOAT&&(J=n.R32F),O===n.HALF_FLOAT&&(J=n.R16F),O===n.UNSIGNED_BYTE&&(J=n.R8),O===n.UNSIGNED_SHORT&&ae&&(J=ae.R16_EXT),O===n.SHORT&&ae&&(J=ae.R16_SNORM_EXT)),_===n.RED_INTEGER&&(O===n.UNSIGNED_BYTE&&(J=n.R8UI),O===n.UNSIGNED_SHORT&&(J=n.R16UI),O===n.UNSIGNED_INT&&(J=n.R32UI),O===n.BYTE&&(J=n.R8I),O===n.SHORT&&(J=n.R16I),O===n.INT&&(J=n.R32I)),_===n.RG&&(O===n.FLOAT&&(J=n.RG32F),O===n.HALF_FLOAT&&(J=n.RG16F),O===n.UNSIGNED_BYTE&&(J=n.RG8),O===n.UNSIGNED_SHORT&&ae&&(J=ae.RG16_EXT),O===n.SHORT&&ae&&(J=ae.RG16_SNORM_EXT)),_===n.RG_INTEGER&&(O===n.UNSIGNED_BYTE&&(J=n.RG8UI),O===n.UNSIGNED_SHORT&&(J=n.RG16UI),O===n.UNSIGNED_INT&&(J=n.RG32UI),O===n.BYTE&&(J=n.RG8I),O===n.SHORT&&(J=n.RG16I),O===n.INT&&(J=n.RG32I)),_===n.RGB_INTEGER&&(O===n.UNSIGNED_BYTE&&(J=n.RGB8UI),O===n.UNSIGNED_SHORT&&(J=n.RGB16UI),O===n.UNSIGNED_INT&&(J=n.RGB32UI),O===n.BYTE&&(J=n.RGB8I),O===n.SHORT&&(J=n.RGB16I),O===n.INT&&(J=n.RGB32I)),_===n.RGBA_INTEGER&&(O===n.UNSIGNED_BYTE&&(J=n.RGBA8UI),O===n.UNSIGNED_SHORT&&(J=n.RGBA16UI),O===n.UNSIGNED_INT&&(J=n.RGBA32UI),O===n.BYTE&&(J=n.RGBA8I),O===n.SHORT&&(J=n.RGBA16I),O===n.INT&&(J=n.RGBA32I)),_===n.RGB&&(O===n.UNSIGNED_SHORT&&ae&&(J=ae.RGB16_EXT),O===n.SHORT&&ae&&(J=ae.RGB16_SNORM_EXT),O===n.UNSIGNED_INT_5_9_9_9_REV&&(J=n.RGB9_E5),O===n.UNSIGNED_INT_10F_11F_11F_REV&&(J=n.R11F_G11F_B10F)),_===n.RGBA){const ee=re?ys:ke.getTransfer(K);O===n.FLOAT&&(J=n.RGBA32F),O===n.HALF_FLOAT&&(J=n.RGBA16F),O===n.UNSIGNED_BYTE&&(J=ee===Ze?n.SRGB8_ALPHA8:n.RGBA8),O===n.UNSIGNED_SHORT&&ae&&(J=ae.RGBA16_EXT),O===n.SHORT&&ae&&(J=ae.RGBA16_SNORM_EXT),O===n.UNSIGNED_SHORT_4_4_4_4&&(J=n.RGBA4),O===n.UNSIGNED_SHORT_5_5_5_1&&(J=n.RGB5_A1)}return(J===n.R16F||J===n.R32F||J===n.RG16F||J===n.RG32F||J===n.RGBA16F||J===n.RGBA32F)&&e.get("EXT_color_buffer_float"),J}function w(T,_){let O;return T?_===null||_===Sn||_===_r?O=n.DEPTH24_STENCIL8:_===pn?O=n.DEPTH32F_STENCIL8:_===gr&&(O=n.DEPTH24_STENCIL8,Ce("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===Sn||_===_r?O=n.DEPTH_COMPONENT24:_===pn?O=n.DEPTH_COMPONENT32F:_===gr&&(O=n.DEPTH_COMPONENT16),O}function b(T,_){return d(T)===!0||T.isFramebufferTexture&&T.minFilter!==Tt&&T.minFilter!==Pt?Math.log2(Math.max(_.width,_.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?_.mipmaps.length:1}function R(T){const _=T.target;_.removeEventListener("dispose",R),y(_),_.isVideoTexture&&h.delete(_),_.isHTMLTexture&&p.delete(_)}function x(T){const _=T.target;_.removeEventListener("dispose",x),C(_)}function y(T){const _=i.get(T);if(_.__webglInit===void 0)return;const O=T.source,V=m.get(O);if(V){const K=V[_.__cacheKey];K.usedTimes--,K.usedTimes===0&&I(T),Object.keys(V).length===0&&m.delete(O)}i.remove(T)}function I(T){const _=i.get(T);n.deleteTexture(_.__webglTexture);const O=T.source,V=m.get(O);delete V[_.__cacheKey],a.memory.textures--}function C(T){const _=i.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),i.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let V=0;V<6;V++){if(Array.isArray(_.__webglFramebuffer[V]))for(let K=0;K<_.__webglFramebuffer[V].length;K++)n.deleteFramebuffer(_.__webglFramebuffer[V][K]);else n.deleteFramebuffer(_.__webglFramebuffer[V]);_.__webglDepthbuffer&&n.deleteRenderbuffer(_.__webglDepthbuffer[V])}else{if(Array.isArray(_.__webglFramebuffer))for(let V=0;V<_.__webglFramebuffer.length;V++)n.deleteFramebuffer(_.__webglFramebuffer[V]);else n.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&n.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&n.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let V=0;V<_.__webglColorRenderbuffer.length;V++)_.__webglColorRenderbuffer[V]&&n.deleteRenderbuffer(_.__webglColorRenderbuffer[V]);_.__webglDepthRenderbuffer&&n.deleteRenderbuffer(_.__webglDepthRenderbuffer)}const O=T.textures;for(let V=0,K=O.length;V<K;V++){const re=i.get(O[V]);re.__webglTexture&&(n.deleteTexture(re.__webglTexture),a.memory.textures--),i.remove(O[V])}i.remove(T)}let F=0;function $(){F=0}function q(){return F}function z(T){F=T}function Y(){const T=F;return T>=r.maxTextures&&Ce("WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+r.maxTextures),F+=1,T}function X(T){const _=[];return _.push(T.wrapS),_.push(T.wrapT),_.push(T.wrapR||0),_.push(T.magFilter),_.push(T.minFilter),_.push(T.anisotropy),_.push(T.internalFormat),_.push(T.format),_.push(T.type),_.push(T.generateMipmaps),_.push(T.premultiplyAlpha),_.push(T.flipY),_.push(T.unpackAlignment),_.push(T.colorSpace),_.join()}function P(T,_){const O=i.get(T);if(T.isVideoTexture&&D(T),T.isRenderTargetTexture===!1&&T.isExternalTexture!==!0&&T.version>0&&O.__version!==T.version){const V=T.image;if(V===null)Ce("WebGLRenderer: Texture marked for update but no image data found.");else if(V.complete===!1)Ce("WebGLRenderer: Texture marked for update but image is incomplete");else{Se(O,T,_);return}}else T.isExternalTexture&&(O.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,O.__webglTexture,n.TEXTURE0+_)}function Z(T,_){const O=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&O.__version!==T.version){Se(O,T,_);return}else T.isExternalTexture&&(O.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,O.__webglTexture,n.TEXTURE0+_)}function ne(T,_){const O=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&O.__version!==T.version){Se(O,T,_);return}t.bindTexture(n.TEXTURE_3D,O.__webglTexture,n.TEXTURE0+_)}function ie(T,_){const O=i.get(T);if(T.isCubeDepthTexture!==!0&&T.version>0&&O.__version!==T.version){Pe(O,T,_);return}t.bindTexture(n.TEXTURE_CUBE_MAP,O.__webglTexture,n.TEXTURE0+_)}const ue={[ro]:n.REPEAT,[Cn]:n.CLAMP_TO_EDGE,[so]:n.MIRRORED_REPEAT},Fe={[Tt]:n.NEAREST,[ip]:n.NEAREST_MIPMAP_NEAREST,[Pr]:n.NEAREST_MIPMAP_LINEAR,[Pt]:n.LINEAR,[na]:n.LINEAR_MIPMAP_NEAREST,[li]:n.LINEAR_MIPMAP_LINEAR},qe={[ap]:n.NEVER,[dp]:n.ALWAYS,[op]:n.LESS,[tc]:n.LEQUAL,[cp]:n.EQUAL,[nc]:n.GEQUAL,[lp]:n.GREATER,[up]:n.NOTEQUAL};function Ge(T,_){if(_.type===pn&&e.has("OES_texture_float_linear")===!1&&(_.magFilter===Pt||_.magFilter===na||_.magFilter===Pr||_.magFilter===li||_.minFilter===Pt||_.minFilter===na||_.minFilter===Pr||_.minFilter===li)&&Ce("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(T,n.TEXTURE_WRAP_S,ue[_.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,ue[_.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,ue[_.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,Fe[_.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,Fe[_.minFilter]),_.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,qe[_.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Tt||_.minFilter!==Pr&&_.minFilter!==li||_.type===pn&&e.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||i.get(_).__currentAnisotropy){const O=e.get("EXT_texture_filter_anisotropic");n.texParameterf(T,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,r.getMaxAnisotropy())),i.get(_).__currentAnisotropy=_.anisotropy}}}function Q(T,_){let O=!1;T.__webglInit===void 0&&(T.__webglInit=!0,_.addEventListener("dispose",R));const V=_.source;let K=m.get(V);K===void 0&&(K={},m.set(V,K));const re=X(_);if(re!==T.__cacheKey){K[re]===void 0&&(K[re]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,O=!0),K[re].usedTimes++;const ae=K[T.__cacheKey];ae!==void 0&&(K[T.__cacheKey].usedTimes--,ae.usedTimes===0&&I(_)),T.__cacheKey=re,T.__webglTexture=K[re].texture}return O}function B(T,_,O){return Math.floor(Math.floor(T/O)/_)}function W(T,_,O,V){const re=T.updateRanges;if(re.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,_.width,_.height,O,V,_.data);else{re.sort((ye,de)=>ye.start-de.start);let ae=0;for(let ye=1;ye<re.length;ye++){const de=re[ae],ce=re[ye],Ae=de.start+de.count,Re=B(ce.start,_.width,4),Le=B(de.start,_.width,4);ce.start<=Ae+1&&Re===Le&&B(ce.start+ce.count-1,_.width,4)===Re?de.count=Math.max(de.count,ce.start+ce.count-de.start):(++ae,re[ae]=ce)}re.length=ae+1;const J=t.getParameter(n.UNPACK_ROW_LENGTH),ee=t.getParameter(n.UNPACK_SKIP_PIXELS),oe=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,_.width);for(let ye=0,de=re.length;ye<de;ye++){const ce=re[ye],Ae=Math.floor(ce.start/4),Re=Math.ceil(ce.count/4),Le=Ae%_.width,L=Math.floor(Ae/_.width),se=Re,j=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,Le),t.pixelStorei(n.UNPACK_SKIP_ROWS,L),t.texSubImage2D(n.TEXTURE_2D,0,Le,L,se,j,O,V,_.data)}T.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,J),t.pixelStorei(n.UNPACK_SKIP_PIXELS,ee),t.pixelStorei(n.UNPACK_SKIP_ROWS,oe)}}function Se(T,_,O){let V=n.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(V=n.TEXTURE_2D_ARRAY),_.isData3DTexture&&(V=n.TEXTURE_3D);const K=Q(T,_),re=_.source;t.bindTexture(V,T.__webglTexture,n.TEXTURE0+O);const ae=i.get(re);if(re.version!==ae.__version||K===!0){if(t.activeTexture(n.TEXTURE0+O),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){const j=ke.getPrimaries(ke.workingColorSpace),le=_.colorSpace===$n?null:ke.getPrimaries(_.colorSpace),me=_.colorSpace===$n||j===le?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,me)}t.pixelStorei(n.UNPACK_ALIGNMENT,_.unpackAlignment);let ee=f(_.image,!1,r.maxTextureSize);ee=Bt(_,ee);const oe=s.convert(_.format,_.colorSpace),ye=s.convert(_.type);let de=S(_.internalFormat,oe,ye,_.normalized,_.colorSpace,_.isVideoTexture);Ge(V,_);let ce;const Ae=_.mipmaps,Re=_.isVideoTexture!==!0,Le=ae.__version===void 0||K===!0,L=re.dataReady,se=b(_,ee);if(_.isDepthTexture)de=w(_.format===ui,_.type),Le&&(Re?t.texStorage2D(n.TEXTURE_2D,1,de,ee.width,ee.height):t.texImage2D(n.TEXTURE_2D,0,de,ee.width,ee.height,0,oe,ye,null));else if(_.isDataTexture)if(Ae.length>0){Re&&Le&&t.texStorage2D(n.TEXTURE_2D,se,de,Ae[0].width,Ae[0].height);for(let j=0,le=Ae.length;j<le;j++)ce=Ae[j],Re?L&&t.texSubImage2D(n.TEXTURE_2D,j,0,0,ce.width,ce.height,oe,ye,ce.data):t.texImage2D(n.TEXTURE_2D,j,de,ce.width,ce.height,0,oe,ye,ce.data);_.generateMipmaps=!1}else Re?(Le&&t.texStorage2D(n.TEXTURE_2D,se,de,ee.width,ee.height),L&&W(_,ee,oe,ye)):t.texImage2D(n.TEXTURE_2D,0,de,ee.width,ee.height,0,oe,ye,ee.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Re&&Le&&t.texStorage3D(n.TEXTURE_2D_ARRAY,se,de,Ae[0].width,Ae[0].height,ee.depth);for(let j=0,le=Ae.length;j<le;j++)if(ce=Ae[j],_.format!==sn)if(oe!==null)if(Re){if(L)if(_.layerUpdates.size>0){const me=ul(ce.width,ce.height,_.format,_.type);for(const te of _.layerUpdates){const Ee=ce.data.subarray(te*me/ce.data.BYTES_PER_ELEMENT,(te+1)*me/ce.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,j,0,0,te,ce.width,ce.height,1,oe,Ee)}_.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,j,0,0,0,ce.width,ce.height,ee.depth,oe,ce.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,j,de,ce.width,ce.height,ee.depth,0,ce.data,0,0);else Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Re?L&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,j,0,0,0,ce.width,ce.height,ee.depth,oe,ye,ce.data):t.texImage3D(n.TEXTURE_2D_ARRAY,j,de,ce.width,ce.height,ee.depth,0,oe,ye,ce.data)}else{Re&&Le&&t.texStorage2D(n.TEXTURE_2D,se,de,Ae[0].width,Ae[0].height);for(let j=0,le=Ae.length;j<le;j++)ce=Ae[j],_.format!==sn?oe!==null?Re?L&&t.compressedTexSubImage2D(n.TEXTURE_2D,j,0,0,ce.width,ce.height,oe,ce.data):t.compressedTexImage2D(n.TEXTURE_2D,j,de,ce.width,ce.height,0,ce.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Re?L&&t.texSubImage2D(n.TEXTURE_2D,j,0,0,ce.width,ce.height,oe,ye,ce.data):t.texImage2D(n.TEXTURE_2D,j,de,ce.width,ce.height,0,oe,ye,ce.data)}else if(_.isDataArrayTexture)if(Re){if(Le&&t.texStorage3D(n.TEXTURE_2D_ARRAY,se,de,ee.width,ee.height,ee.depth),L)if(_.layerUpdates.size>0){const j=ul(ee.width,ee.height,_.format,_.type);for(const le of _.layerUpdates){const me=ee.data.subarray(le*j/ee.data.BYTES_PER_ELEMENT,(le+1)*j/ee.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,le,ee.width,ee.height,1,oe,ye,me)}_.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ee.width,ee.height,ee.depth,oe,ye,ee.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,de,ee.width,ee.height,ee.depth,0,oe,ye,ee.data);else if(_.isData3DTexture)Re?(Le&&t.texStorage3D(n.TEXTURE_3D,se,de,ee.width,ee.height,ee.depth),L&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ee.width,ee.height,ee.depth,oe,ye,ee.data)):t.texImage3D(n.TEXTURE_3D,0,de,ee.width,ee.height,ee.depth,0,oe,ye,ee.data);else if(_.isFramebufferTexture){if(Le)if(Re)t.texStorage2D(n.TEXTURE_2D,se,de,ee.width,ee.height);else{let j=ee.width,le=ee.height;for(let me=0;me<se;me++)t.texImage2D(n.TEXTURE_2D,me,de,j,le,0,oe,ye,null),j>>=1,le>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in n){const j=n.canvas;if(j.hasAttribute("layoutsubtree")||j.setAttribute("layoutsubtree","true"),ee.parentNode!==j){j.appendChild(ee),p.add(_),j.onpaint=le=>{const me=le.changedElements;for(const te of p)me.includes(te.image)&&(te.needsUpdate=!0)},j.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,ee);else{const me=n.RGBA,te=n.RGBA,Ee=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,me,te,Ee,ee)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(Ae.length>0){if(Re&&Le){const j=Ke(Ae[0]);t.texStorage2D(n.TEXTURE_2D,se,de,j.width,j.height)}for(let j=0,le=Ae.length;j<le;j++)ce=Ae[j],Re?L&&t.texSubImage2D(n.TEXTURE_2D,j,0,0,oe,ye,ce):t.texImage2D(n.TEXTURE_2D,j,de,oe,ye,ce);_.generateMipmaps=!1}else if(Re){if(Le){const j=Ke(ee);t.texStorage2D(n.TEXTURE_2D,se,de,j.width,j.height)}L&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,oe,ye,ee)}else t.texImage2D(n.TEXTURE_2D,0,de,oe,ye,ee);d(_)&&E(V),ae.__version=re.version,_.onUpdate&&_.onUpdate(_)}T.__version=_.version}function Pe(T,_,O){if(_.image.length!==6)return;const V=Q(T,_),K=_.source;t.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+O);const re=i.get(K);if(K.version!==re.__version||V===!0){t.activeTexture(n.TEXTURE0+O);const ae=ke.getPrimaries(ke.workingColorSpace),J=_.colorSpace===$n?null:ke.getPrimaries(_.colorSpace),ee=_.colorSpace===$n||ae===J?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,_.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ee);const oe=_.isCompressedTexture||_.image[0].isCompressedTexture,ye=_.image[0]&&_.image[0].isDataTexture,de=[];for(let te=0;te<6;te++)!oe&&!ye?de[te]=f(_.image[te],!0,r.maxCubemapSize):de[te]=ye?_.image[te].image:_.image[te],de[te]=Bt(_,de[te]);const ce=de[0],Ae=s.convert(_.format,_.colorSpace),Re=s.convert(_.type),Le=S(_.internalFormat,Ae,Re,_.normalized,_.colorSpace),L=_.isVideoTexture!==!0,se=re.__version===void 0||V===!0,j=K.dataReady;let le=b(_,ce);Ge(n.TEXTURE_CUBE_MAP,_);let me;if(oe){L&&se&&t.texStorage2D(n.TEXTURE_CUBE_MAP,le,Le,ce.width,ce.height);for(let te=0;te<6;te++){me=de[te].mipmaps;for(let Ee=0;Ee<me.length;Ee++){const ve=me[Ee];_.format!==sn?Ae!==null?L?j&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,0,0,ve.width,ve.height,Ae,ve.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,Le,ve.width,ve.height,0,ve.data):Ce("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):L?j&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,0,0,ve.width,ve.height,Ae,Re,ve.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,Le,ve.width,ve.height,0,Ae,Re,ve.data)}}}else{if(me=_.mipmaps,L&&se){me.length>0&&le++;const te=Ke(de[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,le,Le,te.width,te.height)}for(let te=0;te<6;te++)if(ye){L?j&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,de[te].width,de[te].height,Ae,Re,de[te].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,Le,de[te].width,de[te].height,0,Ae,Re,de[te].data);for(let Ee=0;Ee<me.length;Ee++){const ot=me[Ee].image[te].image;L?j&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,0,0,ot.width,ot.height,Ae,Re,ot.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,Le,ot.width,ot.height,0,Ae,Re,ot.data)}}else{L?j&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,Ae,Re,de[te]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,Le,Ae,Re,de[te]);for(let Ee=0;Ee<me.length;Ee++){const ve=me[Ee];L?j&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,0,0,Ae,Re,ve.image[te]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,Le,Ae,Re,ve.image[te])}}}d(_)&&E(n.TEXTURE_CUBE_MAP),re.__version=K.version,_.onUpdate&&_.onUpdate(_)}T.__version=_.version}function we(T,_,O,V,K,re){const ae=s.convert(O.format,O.colorSpace),J=s.convert(O.type),ee=S(O.internalFormat,ae,J,O.normalized,O.colorSpace),oe=i.get(_),ye=i.get(O);if(ye.__renderTarget=_,!oe.__hasExternalTextures){const de=Math.max(1,_.width>>re),ce=Math.max(1,_.height>>re);K===n.TEXTURE_3D||K===n.TEXTURE_2D_ARRAY?t.texImage3D(K,re,ee,de,ce,_.depth,0,ae,J,null):t.texImage2D(K,re,ee,de,ce,0,ae,J,null)}t.bindFramebuffer(n.FRAMEBUFFER,T),pt(_)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,V,K,ye.__webglTexture,0,at(_)):(K===n.TEXTURE_2D||K>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&K<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,V,K,ye.__webglTexture,re),t.bindFramebuffer(n.FRAMEBUFFER,null)}function ut(T,_,O){if(n.bindRenderbuffer(n.RENDERBUFFER,T),_.depthBuffer){const V=_.depthTexture,K=V&&V.isDepthTexture?V.type:null,re=w(_.stencilBuffer,K),ae=_.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;pt(_)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,at(_),re,_.width,_.height):O?n.renderbufferStorageMultisample(n.RENDERBUFFER,at(_),re,_.width,_.height):n.renderbufferStorage(n.RENDERBUFFER,re,_.width,_.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,ae,n.RENDERBUFFER,T)}else{const V=_.textures;for(let K=0;K<V.length;K++){const re=V[K],ae=s.convert(re.format,re.colorSpace),J=s.convert(re.type),ee=S(re.internalFormat,ae,J,re.normalized,re.colorSpace);pt(_)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,at(_),ee,_.width,_.height):O?n.renderbufferStorageMultisample(n.RENDERBUFFER,at(_),ee,_.width,_.height):n.renderbufferStorage(n.RENDERBUFFER,ee,_.width,_.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Be(T,_,O){const V=_.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,T),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const K=i.get(_.depthTexture);if(K.__renderTarget=_,(!K.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),V){if(K.__webglInit===void 0&&(K.__webglInit=!0,_.depthTexture.addEventListener("dispose",R)),K.__webglTexture===void 0){K.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,K.__webglTexture),Ge(n.TEXTURE_CUBE_MAP,_.depthTexture);const oe=s.convert(_.depthTexture.format),ye=s.convert(_.depthTexture.type);let de;_.depthTexture.format===Fn?de=n.DEPTH_COMPONENT24:_.depthTexture.format===ui&&(de=n.DEPTH24_STENCIL8);for(let ce=0;ce<6;ce++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ce,0,de,_.width,_.height,0,oe,ye,null)}}else P(_.depthTexture,0);const re=K.__webglTexture,ae=at(_),J=V?n.TEXTURE_CUBE_MAP_POSITIVE_X+O:n.TEXTURE_2D,ee=_.depthTexture.format===ui?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(_.depthTexture.format===Fn)pt(_)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ee,J,re,0,ae):n.framebufferTexture2D(n.FRAMEBUFFER,ee,J,re,0);else if(_.depthTexture.format===ui)pt(_)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ee,J,re,0,ae):n.framebufferTexture2D(n.FRAMEBUFFER,ee,J,re,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function et(T){const _=i.get(T),O=T.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==T.depthTexture){const V=T.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),V){const K=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,V.removeEventListener("dispose",K)};V.addEventListener("dispose",K),_.__depthDisposeCallback=K}_.__boundDepthTexture=V}if(T.depthTexture&&!_.__autoAllocateDepthBuffer)if(O)for(let V=0;V<6;V++)Be(_.__webglFramebuffer[V],T,V);else{const V=T.texture.mipmaps;V&&V.length>0?Be(_.__webglFramebuffer[0],T,0):Be(_.__webglFramebuffer,T,0)}else if(O){_.__webglDepthbuffer=[];for(let V=0;V<6;V++)if(t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer[V]),_.__webglDepthbuffer[V]===void 0)_.__webglDepthbuffer[V]=n.createRenderbuffer(),ut(_.__webglDepthbuffer[V],T,!1);else{const K=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,re=_.__webglDepthbuffer[V];n.bindRenderbuffer(n.RENDERBUFFER,re),n.framebufferRenderbuffer(n.FRAMEBUFFER,K,n.RENDERBUFFER,re)}}else{const V=T.texture.mipmaps;if(V&&V.length>0?t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=n.createRenderbuffer(),ut(_.__webglDepthbuffer,T,!1);else{const K=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,re=_.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,re),n.framebufferRenderbuffer(n.FRAMEBUFFER,K,n.RENDERBUFFER,re)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function $e(T,_,O){const V=i.get(T);_!==void 0&&we(V.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),O!==void 0&&et(T)}function Ve(T){const _=T.texture,O=i.get(T),V=i.get(_);T.addEventListener("dispose",x);const K=T.textures,re=T.isWebGLCubeRenderTarget===!0,ae=K.length>1;if(ae||(V.__webglTexture===void 0&&(V.__webglTexture=n.createTexture()),V.__version=_.version,a.memory.textures++),re){O.__webglFramebuffer=[];for(let J=0;J<6;J++)if(_.mipmaps&&_.mipmaps.length>0){O.__webglFramebuffer[J]=[];for(let ee=0;ee<_.mipmaps.length;ee++)O.__webglFramebuffer[J][ee]=n.createFramebuffer()}else O.__webglFramebuffer[J]=n.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){O.__webglFramebuffer=[];for(let J=0;J<_.mipmaps.length;J++)O.__webglFramebuffer[J]=n.createFramebuffer()}else O.__webglFramebuffer=n.createFramebuffer();if(ae)for(let J=0,ee=K.length;J<ee;J++){const oe=i.get(K[J]);oe.__webglTexture===void 0&&(oe.__webglTexture=n.createTexture(),a.memory.textures++)}if(T.samples>0&&pt(T)===!1){O.__webglMultisampledFramebuffer=n.createFramebuffer(),O.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let J=0;J<K.length;J++){const ee=K[J];O.__webglColorRenderbuffer[J]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,O.__webglColorRenderbuffer[J]);const oe=s.convert(ee.format,ee.colorSpace),ye=s.convert(ee.type),de=S(ee.internalFormat,oe,ye,ee.normalized,ee.colorSpace,T.isXRRenderTarget===!0),ce=at(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,ce,de,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+J,n.RENDERBUFFER,O.__webglColorRenderbuffer[J])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(O.__webglDepthRenderbuffer=n.createRenderbuffer(),ut(O.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(re){t.bindTexture(n.TEXTURE_CUBE_MAP,V.__webglTexture),Ge(n.TEXTURE_CUBE_MAP,_);for(let J=0;J<6;J++)if(_.mipmaps&&_.mipmaps.length>0)for(let ee=0;ee<_.mipmaps.length;ee++)we(O.__webglFramebuffer[J][ee],T,_,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+J,ee);else we(O.__webglFramebuffer[J],T,_,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+J,0);d(_)&&E(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ae){for(let J=0,ee=K.length;J<ee;J++){const oe=K[J],ye=i.get(oe);let de=n.TEXTURE_2D;(T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(de=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(de,ye.__webglTexture),Ge(de,oe),we(O.__webglFramebuffer,T,oe,n.COLOR_ATTACHMENT0+J,de,0),d(oe)&&E(de)}t.unbindTexture()}else{let J=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(J=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(J,V.__webglTexture),Ge(J,_),_.mipmaps&&_.mipmaps.length>0)for(let ee=0;ee<_.mipmaps.length;ee++)we(O.__webglFramebuffer[ee],T,_,n.COLOR_ATTACHMENT0,J,ee);else we(O.__webglFramebuffer,T,_,n.COLOR_ATTACHMENT0,J,0);d(_)&&E(J),t.unbindTexture()}T.depthBuffer&&et(T)}function ft(T){const _=T.textures;for(let O=0,V=_.length;O<V;O++){const K=_[O];if(d(K)){const re=A(T),ae=i.get(K).__webglTexture;t.bindTexture(re,ae),E(re),t.unbindTexture()}}}const gt=[],vt=[];function Et(T){if(T.samples>0){if(pt(T)===!1){const _=T.textures,O=T.width,V=T.height;let K=n.COLOR_BUFFER_BIT;const re=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ae=i.get(T),J=_.length>1;if(J)for(let oe=0;oe<_.length;oe++)t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+oe,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+oe,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,ae.__webglMultisampledFramebuffer);const ee=T.texture.mipmaps;ee&&ee.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ae.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ae.__webglFramebuffer);for(let oe=0;oe<_.length;oe++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(K|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(K|=n.STENCIL_BUFFER_BIT)),J){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,ae.__webglColorRenderbuffer[oe]);const ye=i.get(_[oe]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ye,0)}n.blitFramebuffer(0,0,O,V,0,0,O,V,K,n.NEAREST),c===!0&&(gt.length=0,vt.length=0,gt.push(n.COLOR_ATTACHMENT0+oe),T.depthBuffer&&T.resolveDepthBuffer===!1&&(gt.push(re),vt.push(re),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,vt)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,gt))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),J)for(let oe=0;oe<_.length;oe++){t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+oe,n.RENDERBUFFER,ae.__webglColorRenderbuffer[oe]);const ye=i.get(_[oe]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,ae.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+oe,n.TEXTURE_2D,ye,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ae.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.resolveDepthBuffer===!1&&c){const _=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[_])}}}function at(T){return Math.min(r.maxSamples,T.samples)}function pt(T){const _=i.get(T);return T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function D(T){const _=a.render.frame;h.get(T)!==_&&(h.set(T,_),T.update())}function Bt(T,_){const O=T.colorSpace,V=T.format,K=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||O!==Es&&O!==$n&&(ke.getTransfer(O)===Ze?(V!==sn||K!==Jt)&&Ce("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):We("WebGLTextures: Unsupported texture color space:",O)),_}function Ke(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(l.width=T.naturalWidth||T.width,l.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(l.width=T.displayWidth,l.height=T.displayHeight):(l.width=T.width,l.height=T.height),l}this.allocateTextureUnit=Y,this.resetTextureUnits=$,this.getTextureUnits=q,this.setTextureUnits=z,this.setTexture2D=P,this.setTexture2DArray=Z,this.setTexture3D=ne,this.setTextureCube=ie,this.rebindTextures=$e,this.setupRenderTarget=Ve,this.updateRenderTargetMipmap=ft,this.updateMultisampleRenderTarget=Et,this.setupDepthRenderbuffer=et,this.setupFrameBufferTexture=we,this.useMultisampledRTT=pt,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function jx(n,e){function t(i,r=$n){let s;const a=ke.getTransfer(r);if(i===Jt)return n.UNSIGNED_BYTE;if(i===Zo)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Jo)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Xu)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Yu)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===Hu)return n.BYTE;if(i===Wu)return n.SHORT;if(i===gr)return n.UNSIGNED_SHORT;if(i===Ko)return n.INT;if(i===Sn)return n.UNSIGNED_INT;if(i===pn)return n.FLOAT;if(i===Un)return n.HALF_FLOAT;if(i===$u)return n.ALPHA;if(i===qu)return n.RGB;if(i===sn)return n.RGBA;if(i===Fn)return n.DEPTH_COMPONENT;if(i===ui)return n.DEPTH_STENCIL;if(i===Ku)return n.RED;if(i===Qo)return n.RED_INTEGER;if(i===pi)return n.RG;if(i===jo)return n.RG_INTEGER;if(i===ec)return n.RGBA_INTEGER;if(i===us||i===ds||i===hs||i===fs)if(a===Ze)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===us)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ds)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===hs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===fs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===us)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ds)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===hs)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===fs)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===ao||i===oo||i===co||i===lo)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===ao)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===oo)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===co)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===lo)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===uo||i===ho||i===fo||i===po||i===mo||i===Ms||i===go)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===uo||i===ho)return a===Ze?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===fo)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===po)return s.COMPRESSED_R11_EAC;if(i===mo)return s.COMPRESSED_SIGNED_R11_EAC;if(i===Ms)return s.COMPRESSED_RG11_EAC;if(i===go)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===_o||i===xo||i===vo||i===Mo||i===So||i===Eo||i===yo||i===bo||i===To||i===Ao||i===wo||i===Ro||i===Co||i===Po)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===_o)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===xo)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===vo)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Mo)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===So)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Eo)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===yo)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===bo)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===To)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Ao)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===wo)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Ro)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Co)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Po)return a===Ze?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Io||i===Lo||i===Do)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===Io)return a===Ze?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Lo)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Do)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===No||i===Uo||i===Ss||i===Fo)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===No)return s.COMPRESSED_RED_RGTC1_EXT;if(i===Uo)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Ss)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Fo)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===_r?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}const ev=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,tv=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class nv{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const i=new sd(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,i=new on({vertexShader:ev,fragmentShader:tv,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new bt(new yr(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class iv extends gi{constructor(e,t){super();const i=this;let r=null,s=1,a=null,o="local-floor",c=1,l=null,h=null,p=null,u=null,m=null,g=null;const v=typeof XRWebGLBinding<"u",f=new nv,d={},E=t.getContextAttributes();let A=null,S=null;const w=[],b=[],R=new Ye;let x=null;const y=new Zt;y.viewport=new lt;const I=new Zt;I.viewport=new lt;const C=[y,I],F=new fm;let $=null,q=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Q){let B=w[Q];return B===void 0&&(B=new ca,w[Q]=B),B.getTargetRaySpace()},this.getControllerGrip=function(Q){let B=w[Q];return B===void 0&&(B=new ca,w[Q]=B),B.getGripSpace()},this.getHand=function(Q){let B=w[Q];return B===void 0&&(B=new ca,w[Q]=B),B.getHandSpace()};function z(Q){const B=b.indexOf(Q.inputSource);if(B===-1)return;const W=w[B];W!==void 0&&(W.update(Q.inputSource,Q.frame,l||a),W.dispatchEvent({type:Q.type,data:Q.inputSource}))}function Y(){r.removeEventListener("select",z),r.removeEventListener("selectstart",z),r.removeEventListener("selectend",z),r.removeEventListener("squeeze",z),r.removeEventListener("squeezestart",z),r.removeEventListener("squeezeend",z),r.removeEventListener("end",Y),r.removeEventListener("inputsourceschange",X);for(let Q=0;Q<w.length;Q++){const B=b[Q];B!==null&&(b[Q]=null,w[Q].disconnect(B))}$=null,q=null,f.reset();for(const Q in d)delete d[Q];e.setRenderTarget(A),m=null,u=null,p=null,r=null,S=null,Ge.stop(),i.isPresenting=!1,e.setPixelRatio(x),e.setSize(R.width,R.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Q){s=Q,i.isPresenting===!0&&Ce("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Q){o=Q,i.isPresenting===!0&&Ce("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(Q){l=Q},this.getBaseLayer=function(){return u!==null?u:m},this.getBinding=function(){return p===null&&v&&(p=new XRWebGLBinding(r,t)),p},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(Q){if(r=Q,r!==null){if(A=e.getRenderTarget(),r.addEventListener("select",z),r.addEventListener("selectstart",z),r.addEventListener("selectend",z),r.addEventListener("squeeze",z),r.addEventListener("squeezestart",z),r.addEventListener("squeezeend",z),r.addEventListener("end",Y),r.addEventListener("inputsourceschange",X),E.xrCompatible!==!0&&await t.makeXRCompatible(),x=e.getPixelRatio(),e.getSize(R),v&&"createProjectionLayer"in XRWebGLBinding.prototype){let W=null,Se=null,Pe=null;E.depth&&(Pe=E.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,W=E.stencil?ui:Fn,Se=E.stencil?_r:Sn);const we={colorFormat:t.RGBA8,depthFormat:Pe,scaleFactor:s};p=this.getBinding(),u=p.createProjectionLayer(we),r.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),S=new vn(u.textureWidth,u.textureHeight,{format:sn,type:Jt,depthTexture:new Wi(u.textureWidth,u.textureHeight,Se,void 0,void 0,void 0,void 0,void 0,void 0,W),stencilBuffer:E.stencil,colorSpace:e.outputColorSpace,samples:E.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}else{const W={antialias:E.antialias,alpha:!0,depth:E.depth,stencil:E.stencil,framebufferScaleFactor:s};m=new XRWebGLLayer(r,t,W),r.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),S=new vn(m.framebufferWidth,m.framebufferHeight,{format:sn,type:Jt,colorSpace:e.outputColorSpace,stencilBuffer:E.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await r.requestReferenceSpace(o),Ge.setContext(r),Ge.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return f.getDepthTexture()};function X(Q){for(let B=0;B<Q.removed.length;B++){const W=Q.removed[B],Se=b.indexOf(W);Se>=0&&(b[Se]=null,w[Se].disconnect(W))}for(let B=0;B<Q.added.length;B++){const W=Q.added[B];let Se=b.indexOf(W);if(Se===-1){for(let we=0;we<w.length;we++)if(we>=b.length){b.push(W),Se=we;break}else if(b[we]===null){b[we]=W,Se=we;break}if(Se===-1)break}const Pe=w[Se];Pe&&Pe.connect(W)}}const P=new U,Z=new U;function ne(Q,B,W){P.setFromMatrixPosition(B.matrixWorld),Z.setFromMatrixPosition(W.matrixWorld);const Se=P.distanceTo(Z),Pe=B.projectionMatrix.elements,we=W.projectionMatrix.elements,ut=Pe[14]/(Pe[10]-1),Be=Pe[14]/(Pe[10]+1),et=(Pe[9]+1)/Pe[5],$e=(Pe[9]-1)/Pe[5],Ve=(Pe[8]-1)/Pe[0],ft=(we[8]+1)/we[0],gt=ut*Ve,vt=ut*ft,Et=Se/(-Ve+ft),at=Et*-Ve;if(B.matrixWorld.decompose(Q.position,Q.quaternion,Q.scale),Q.translateX(at),Q.translateZ(Et),Q.matrixWorld.compose(Q.position,Q.quaternion,Q.scale),Q.matrixWorldInverse.copy(Q.matrixWorld).invert(),Pe[10]===-1)Q.projectionMatrix.copy(B.projectionMatrix),Q.projectionMatrixInverse.copy(B.projectionMatrixInverse);else{const pt=ut+Et,D=Be+Et,Bt=gt-at,Ke=vt+(Se-at),T=et*Be/D*pt,_=$e*Be/D*pt;Q.projectionMatrix.makePerspective(Bt,Ke,T,_,pt,D),Q.projectionMatrixInverse.copy(Q.projectionMatrix).invert()}}function ie(Q,B){B===null?Q.matrixWorld.copy(Q.matrix):Q.matrixWorld.multiplyMatrices(B.matrixWorld,Q.matrix),Q.matrixWorldInverse.copy(Q.matrixWorld).invert()}this.updateCamera=function(Q){if(r===null)return;let B=Q.near,W=Q.far;f.texture!==null&&(f.depthNear>0&&(B=f.depthNear),f.depthFar>0&&(W=f.depthFar)),F.near=I.near=y.near=B,F.far=I.far=y.far=W,($!==F.near||q!==F.far)&&(r.updateRenderState({depthNear:F.near,depthFar:F.far}),$=F.near,q=F.far),F.layers.mask=Q.layers.mask|6,y.layers.mask=F.layers.mask&-5,I.layers.mask=F.layers.mask&-3;const Se=Q.parent,Pe=F.cameras;ie(F,Se);for(let we=0;we<Pe.length;we++)ie(Pe[we],Se);Pe.length===2?ne(F,y,I):F.projectionMatrix.copy(y.projectionMatrix),ue(Q,F,Se)};function ue(Q,B,W){W===null?Q.matrix.copy(B.matrixWorld):(Q.matrix.copy(W.matrixWorld),Q.matrix.invert(),Q.matrix.multiply(B.matrixWorld)),Q.matrix.decompose(Q.position,Q.quaternion,Q.scale),Q.updateMatrixWorld(!0),Q.projectionMatrix.copy(B.projectionMatrix),Q.projectionMatrixInverse.copy(B.projectionMatrixInverse),Q.isPerspectiveCamera&&(Q.fov=xr*2*Math.atan(1/Q.projectionMatrix.elements[5]),Q.zoom=1)}this.getCamera=function(){return F},this.getFoveation=function(){if(!(u===null&&m===null))return c},this.setFoveation=function(Q){c=Q,u!==null&&(u.fixedFoveation=Q),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=Q)},this.hasDepthSensing=function(){return f.texture!==null},this.getDepthSensingMesh=function(){return f.getMesh(F)},this.getCameraTexture=function(Q){return d[Q]};let Fe=null;function qe(Q,B){if(h=B.getViewerPose(l||a),g=B,h!==null){const W=h.views;m!==null&&(e.setRenderTargetFramebuffer(S,m.framebuffer),e.setRenderTarget(S));let Se=!1;W.length!==F.cameras.length&&(F.cameras.length=0,Se=!0);for(let Be=0;Be<W.length;Be++){const et=W[Be];let $e=null;if(m!==null)$e=m.getViewport(et);else{const ft=p.getViewSubImage(u,et);$e=ft.viewport,Be===0&&(e.setRenderTargetTextures(S,ft.colorTexture,ft.depthStencilTexture),e.setRenderTarget(S))}let Ve=C[Be];Ve===void 0&&(Ve=new Zt,Ve.layers.enable(Be),Ve.viewport=new lt,C[Be]=Ve),Ve.matrix.fromArray(et.transform.matrix),Ve.matrix.decompose(Ve.position,Ve.quaternion,Ve.scale),Ve.projectionMatrix.fromArray(et.projectionMatrix),Ve.projectionMatrixInverse.copy(Ve.projectionMatrix).invert(),Ve.viewport.set($e.x,$e.y,$e.width,$e.height),Be===0&&(F.matrix.copy(Ve.matrix),F.matrix.decompose(F.position,F.quaternion,F.scale)),Se===!0&&F.cameras.push(Ve)}const Pe=r.enabledFeatures;if(Pe&&Pe.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&v){p=i.getBinding();const Be=p.getDepthInformation(W[0]);Be&&Be.isValid&&Be.texture&&f.init(Be,r.renderState)}if(Pe&&Pe.includes("camera-access")&&v){e.state.unbindTexture(),p=i.getBinding();for(let Be=0;Be<W.length;Be++){const et=W[Be].camera;if(et){let $e=d[et];$e||($e=new sd,d[et]=$e);const Ve=p.getCameraImage(et);$e.sourceTexture=Ve}}}}for(let W=0;W<w.length;W++){const Se=b[W],Pe=w[W];Se!==null&&Pe!==void 0&&Pe.update(Se,B,l||a)}Fe&&Fe(Q,B),B.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:B}),g=null}const Ge=new ud;Ge.setAnimationLoop(qe),this.setAnimationLoop=function(Q){Fe=Q},this.dispose=function(){}}}const rv=new Qe,_d=new Ie;_d.set(-1,0,0,0,1,0,0,0,1);function sv(n,e){function t(f,d){f.matrixAutoUpdate===!0&&f.updateMatrix(),d.value.copy(f.matrix)}function i(f,d){d.color.getRGB(f.fogColor.value,ad(n)),d.isFog?(f.fogNear.value=d.near,f.fogFar.value=d.far):d.isFogExp2&&(f.fogDensity.value=d.density)}function r(f,d,E,A,S){d.isNodeMaterial?d.uniformsNeedUpdate=!1:d.isMeshBasicMaterial?s(f,d):d.isMeshLambertMaterial?(s(f,d),d.envMap&&(f.envMapIntensity.value=d.envMapIntensity)):d.isMeshToonMaterial?(s(f,d),p(f,d)):d.isMeshPhongMaterial?(s(f,d),h(f,d),d.envMap&&(f.envMapIntensity.value=d.envMapIntensity)):d.isMeshStandardMaterial?(s(f,d),u(f,d),d.isMeshPhysicalMaterial&&m(f,d,S)):d.isMeshMatcapMaterial?(s(f,d),g(f,d)):d.isMeshDepthMaterial?s(f,d):d.isMeshDistanceMaterial?(s(f,d),v(f,d)):d.isMeshNormalMaterial?s(f,d):d.isLineBasicMaterial?(a(f,d),d.isLineDashedMaterial&&o(f,d)):d.isPointsMaterial?c(f,d,E,A):d.isSpriteMaterial?l(f,d):d.isShadowMaterial?(f.color.value.copy(d.color),f.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function s(f,d){f.opacity.value=d.opacity,d.color&&f.diffuse.value.copy(d.color),d.emissive&&f.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(f.map.value=d.map,t(d.map,f.mapTransform)),d.alphaMap&&(f.alphaMap.value=d.alphaMap,t(d.alphaMap,f.alphaMapTransform)),d.bumpMap&&(f.bumpMap.value=d.bumpMap,t(d.bumpMap,f.bumpMapTransform),f.bumpScale.value=d.bumpScale,d.side===Ut&&(f.bumpScale.value*=-1)),d.normalMap&&(f.normalMap.value=d.normalMap,t(d.normalMap,f.normalMapTransform),f.normalScale.value.copy(d.normalScale),d.side===Ut&&f.normalScale.value.negate()),d.displacementMap&&(f.displacementMap.value=d.displacementMap,t(d.displacementMap,f.displacementMapTransform),f.displacementScale.value=d.displacementScale,f.displacementBias.value=d.displacementBias),d.emissiveMap&&(f.emissiveMap.value=d.emissiveMap,t(d.emissiveMap,f.emissiveMapTransform)),d.specularMap&&(f.specularMap.value=d.specularMap,t(d.specularMap,f.specularMapTransform)),d.alphaTest>0&&(f.alphaTest.value=d.alphaTest);const E=e.get(d),A=E.envMap,S=E.envMapRotation;A&&(f.envMap.value=A,f.envMapRotation.value.setFromMatrix4(rv.makeRotationFromEuler(S)).transpose(),A.isCubeTexture&&A.isRenderTargetTexture===!1&&f.envMapRotation.value.premultiply(_d),f.reflectivity.value=d.reflectivity,f.ior.value=d.ior,f.refractionRatio.value=d.refractionRatio),d.lightMap&&(f.lightMap.value=d.lightMap,f.lightMapIntensity.value=d.lightMapIntensity,t(d.lightMap,f.lightMapTransform)),d.aoMap&&(f.aoMap.value=d.aoMap,f.aoMapIntensity.value=d.aoMapIntensity,t(d.aoMap,f.aoMapTransform))}function a(f,d){f.diffuse.value.copy(d.color),f.opacity.value=d.opacity,d.map&&(f.map.value=d.map,t(d.map,f.mapTransform))}function o(f,d){f.dashSize.value=d.dashSize,f.totalSize.value=d.dashSize+d.gapSize,f.scale.value=d.scale}function c(f,d,E,A){f.diffuse.value.copy(d.color),f.opacity.value=d.opacity,f.size.value=d.size*E,f.scale.value=A*.5,d.map&&(f.map.value=d.map,t(d.map,f.uvTransform)),d.alphaMap&&(f.alphaMap.value=d.alphaMap,t(d.alphaMap,f.alphaMapTransform)),d.alphaTest>0&&(f.alphaTest.value=d.alphaTest)}function l(f,d){f.diffuse.value.copy(d.color),f.opacity.value=d.opacity,f.rotation.value=d.rotation,d.map&&(f.map.value=d.map,t(d.map,f.mapTransform)),d.alphaMap&&(f.alphaMap.value=d.alphaMap,t(d.alphaMap,f.alphaMapTransform)),d.alphaTest>0&&(f.alphaTest.value=d.alphaTest)}function h(f,d){f.specular.value.copy(d.specular),f.shininess.value=Math.max(d.shininess,1e-4)}function p(f,d){d.gradientMap&&(f.gradientMap.value=d.gradientMap)}function u(f,d){f.metalness.value=d.metalness,d.metalnessMap&&(f.metalnessMap.value=d.metalnessMap,t(d.metalnessMap,f.metalnessMapTransform)),f.roughness.value=d.roughness,d.roughnessMap&&(f.roughnessMap.value=d.roughnessMap,t(d.roughnessMap,f.roughnessMapTransform)),d.envMap&&(f.envMapIntensity.value=d.envMapIntensity)}function m(f,d,E){f.ior.value=d.ior,d.sheen>0&&(f.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),f.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(f.sheenColorMap.value=d.sheenColorMap,t(d.sheenColorMap,f.sheenColorMapTransform)),d.sheenRoughnessMap&&(f.sheenRoughnessMap.value=d.sheenRoughnessMap,t(d.sheenRoughnessMap,f.sheenRoughnessMapTransform))),d.clearcoat>0&&(f.clearcoat.value=d.clearcoat,f.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(f.clearcoatMap.value=d.clearcoatMap,t(d.clearcoatMap,f.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(f.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,t(d.clearcoatRoughnessMap,f.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(f.clearcoatNormalMap.value=d.clearcoatNormalMap,t(d.clearcoatNormalMap,f.clearcoatNormalMapTransform),f.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===Ut&&f.clearcoatNormalScale.value.negate())),d.dispersion>0&&(f.dispersion.value=d.dispersion),d.iridescence>0&&(f.iridescence.value=d.iridescence,f.iridescenceIOR.value=d.iridescenceIOR,f.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],f.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(f.iridescenceMap.value=d.iridescenceMap,t(d.iridescenceMap,f.iridescenceMapTransform)),d.iridescenceThicknessMap&&(f.iridescenceThicknessMap.value=d.iridescenceThicknessMap,t(d.iridescenceThicknessMap,f.iridescenceThicknessMapTransform))),d.transmission>0&&(f.transmission.value=d.transmission,f.transmissionSamplerMap.value=E.texture,f.transmissionSamplerSize.value.set(E.width,E.height),d.transmissionMap&&(f.transmissionMap.value=d.transmissionMap,t(d.transmissionMap,f.transmissionMapTransform)),f.thickness.value=d.thickness,d.thicknessMap&&(f.thicknessMap.value=d.thicknessMap,t(d.thicknessMap,f.thicknessMapTransform)),f.attenuationDistance.value=d.attenuationDistance,f.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(f.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(f.anisotropyMap.value=d.anisotropyMap,t(d.anisotropyMap,f.anisotropyMapTransform))),f.specularIntensity.value=d.specularIntensity,f.specularColor.value.copy(d.specularColor),d.specularColorMap&&(f.specularColorMap.value=d.specularColorMap,t(d.specularColorMap,f.specularColorMapTransform)),d.specularIntensityMap&&(f.specularIntensityMap.value=d.specularIntensityMap,t(d.specularIntensityMap,f.specularIntensityMapTransform))}function g(f,d){d.matcap&&(f.matcap.value=d.matcap)}function v(f,d){const E=e.get(d).light;f.referencePosition.value.setFromMatrixPosition(E.matrixWorld),f.nearDistance.value=E.shadow.camera.near,f.farDistance.value=E.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function av(n,e,t,i){let r={},s={},a=[];const o=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function c(S,w){const b=w.program;i.uniformBlockBinding(S,b)}function l(S,w){let b=r[S.id];b===void 0&&(f(S),b=h(S),r[S.id]=b,S.addEventListener("dispose",E));const R=w.program;i.updateUBOMapping(S,R);const x=e.render.frame;s[S.id]!==x&&(u(S),s[S.id]=x)}function h(S){const w=p();S.__bindingPointIndex=w;const b=n.createBuffer(),R=S.__size,x=S.usage;return n.bindBuffer(n.UNIFORM_BUFFER,b),n.bufferData(n.UNIFORM_BUFFER,R,x),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,w,b),b}function p(){for(let S=0;S<o;S++)if(a.indexOf(S)===-1)return a.push(S),S;return We("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(S){const w=r[S.id],b=S.uniforms,R=S.__cache;n.bindBuffer(n.UNIFORM_BUFFER,w);for(let x=0,y=b.length;x<y;x++){const I=b[x];if(Array.isArray(I))for(let C=0,F=I.length;C<F;C++)m(I[C],x,C,R);else m(I,x,0,R)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function m(S,w,b,R){if(v(S,w,b,R)===!0){const x=S.__offset,y=S.value;if(Array.isArray(y)){let I=0;for(let C=0;C<y.length;C++){const F=y[C],$=d(F);g(F,S.__data,I),typeof F!="number"&&typeof F!="boolean"&&!F.isMatrix3&&!ArrayBuffer.isView(F)&&(I+=$.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(y,S.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,x,S.__data)}}function g(S,w,b){typeof S=="number"||typeof S=="boolean"?w[0]=S:S.isMatrix3?(w[0]=S.elements[0],w[1]=S.elements[1],w[2]=S.elements[2],w[3]=0,w[4]=S.elements[3],w[5]=S.elements[4],w[6]=S.elements[5],w[7]=0,w[8]=S.elements[6],w[9]=S.elements[7],w[10]=S.elements[8],w[11]=0):ArrayBuffer.isView(S)?w.set(new S.constructor(S.buffer,S.byteOffset,w.length)):S.toArray(w,b)}function v(S,w,b,R){const x=S.value,y=w+"_"+b;if(R[y]===void 0)return typeof x=="number"||typeof x=="boolean"?R[y]=x:ArrayBuffer.isView(x)?R[y]=x.slice():R[y]=x.clone(),!0;{const I=R[y];if(typeof x=="number"||typeof x=="boolean"){if(I!==x)return R[y]=x,!0}else{if(ArrayBuffer.isView(x))return!0;if(I.equals(x)===!1)return I.copy(x),!0}}return!1}function f(S){const w=S.uniforms;let b=0;const R=16;for(let y=0,I=w.length;y<I;y++){const C=Array.isArray(w[y])?w[y]:[w[y]];for(let F=0,$=C.length;F<$;F++){const q=C[F],z=Array.isArray(q.value)?q.value:[q.value];for(let Y=0,X=z.length;Y<X;Y++){const P=z[Y],Z=d(P),ne=b%R,ie=ne%Z.boundary,ue=ne+ie;b+=ie,ue!==0&&R-ue<Z.storage&&(b+=R-ue),q.__data=new Float32Array(Z.storage/Float32Array.BYTES_PER_ELEMENT),q.__offset=b,b+=Z.storage}}}const x=b%R;return x>0&&(b+=R-x),S.__size=b,S.__cache={},this}function d(S){const w={boundary:0,storage:0};return typeof S=="number"||typeof S=="boolean"?(w.boundary=4,w.storage=4):S.isVector2?(w.boundary=8,w.storage=8):S.isVector3||S.isColor?(w.boundary=16,w.storage=12):S.isVector4?(w.boundary=16,w.storage=16):S.isMatrix3?(w.boundary=48,w.storage=48):S.isMatrix4?(w.boundary=64,w.storage=64):S.isTexture?Ce("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(S)?(w.boundary=16,w.storage=S.byteLength):Ce("WebGLRenderer: Unsupported uniform value type.",S),w}function E(S){const w=S.target;w.removeEventListener("dispose",E);const b=a.indexOf(w.__bindingPointIndex);a.splice(b,1),n.deleteBuffer(r[w.id]),delete r[w.id],delete s[w.id]}function A(){for(const S in r)n.deleteBuffer(r[S]);a=[],r={},s={}}return{bind:c,update:l,dispose:A}}const ov=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let hn=null;function cv(){return hn===null&&(hn=new Qp(ov,16,16,pi,Un),hn.name="DFG_LUT",hn.minFilter=Pt,hn.magFilter=Pt,hn.wrapS=Cn,hn.wrapT=Cn,hn.generateMipmaps=!1,hn.needsUpdate=!0),hn}class lv{constructor(e={}){const{canvas:t=fp(),context:i=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:p=!1,reversedDepthBuffer:u=!1,outputBufferType:m=Jt}=e;this.isWebGLRenderer=!0;let g;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=i.getContextAttributes().alpha}else g=a;const v=m,f=new Set([ec,jo,Qo]),d=new Set([Jt,Sn,gr,_r,Zo,Jo]),E=new Uint32Array(4),A=new Int32Array(4),S=new U;let w=null,b=null;const R=[],x=[];let y=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=xn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const I=this;let C=!1,F=null,$=null,q=null,z=null;this._outputColorSpace=Kt;let Y=0,X=0,P=null,Z=-1,ne=null;const ie=new lt,ue=new lt;let Fe=null;const qe=new Xe(0);let Ge=0,Q=t.width,B=t.height,W=1,Se=null,Pe=null;const we=new lt(0,0,Q,B),ut=new lt(0,0,Q,B);let Be=!1;const et=new id;let $e=!1,Ve=!1;const ft=new Qe,gt=new U,vt=new lt,Et={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let at=!1;function pt(){return P===null?W:1}let D=i;function Bt(M,N){return t.getContext(M,N)}try{const M={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:p};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${qo}`),t.addEventListener("webglcontextlost",ot,!1),t.addEventListener("webglcontextrestored",it,!1),t.addEventListener("webglcontextcreationerror",cn,!1),D===null){const N="webgl2";if(D=Bt(N,M),D===null)throw Bt(N)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(M){throw We("WebGLRenderer: "+M.message),M}let Ke,T,_,O,V,K,re,ae,J,ee,oe,ye,de,ce,Ae,Re,Le,L,se,j,le,me,te;function Ee(){Ke=new c0(D),Ke.init(),le=new jx(D,Ke),T=new e0(D,Ke,e,le),_=new Jx(D,Ke),T.reversedDepthBuffer&&u&&_.buffers.depth.setReversed(!0),$=D.createFramebuffer(),q=D.createFramebuffer(),z=D.createFramebuffer(),O=new d0(D),V=new Ox,K=new Qx(D,Ke,_,V,T,le,O),re=new o0(I),ae=new mm(D),me=new Q_(D,ae),J=new l0(D,ae,O,me),ee=new f0(D,J,ae,me,O),L=new h0(D,T,K),Ae=new t0(V),oe=new Fx(I,re,Ke,T,me,Ae),ye=new sv(I,V),de=new zx,ce=new Xx(Ke),Le=new J_(I,re,_,ee,g,c),Re=new Zx(I,ee,T),te=new av(D,O,T,_),se=new j_(D,Ke,O),j=new u0(D,Ke,O),O.programs=oe.programs,I.capabilities=T,I.extensions=Ke,I.properties=V,I.renderLists=de,I.shadowMap=Re,I.state=_,I.info=O}Ee(),v!==Jt&&(y=new m0(v,t.width,t.height,o,r,s));const ve=new iv(I,D);this.xr=ve,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){const M=Ke.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=Ke.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return W},this.setPixelRatio=function(M){M!==void 0&&(W=M,this.setSize(Q,B,!1))},this.getSize=function(M){return M.set(Q,B)},this.setSize=function(M,N,H=!0){if(ve.isPresenting){Ce("WebGLRenderer: Can't change size while VR device is presenting.");return}Q=M,B=N,t.width=Math.floor(M*W),t.height=Math.floor(N*W),H===!0&&(t.style.width=M+"px",t.style.height=N+"px"),y!==null&&y.setSize(t.width,t.height),this.setViewport(0,0,M,N)},this.getDrawingBufferSize=function(M){return M.set(Q*W,B*W).floor()},this.setDrawingBufferSize=function(M,N,H){Q=M,B=N,W=H,t.width=Math.floor(M*H),t.height=Math.floor(N*H),this.setViewport(0,0,M,N)},this.setEffects=function(M){if(v===Jt){We("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let N=0;N<M.length;N++)if(M[N].isOutputPass===!0){Ce("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}y.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(ie)},this.getViewport=function(M){return M.copy(we)},this.setViewport=function(M,N,H,G){M.isVector4?we.set(M.x,M.y,M.z,M.w):we.set(M,N,H,G),_.viewport(ie.copy(we).multiplyScalar(W).round())},this.getScissor=function(M){return M.copy(ut)},this.setScissor=function(M,N,H,G){M.isVector4?ut.set(M.x,M.y,M.z,M.w):ut.set(M,N,H,G),_.scissor(ue.copy(ut).multiplyScalar(W).round())},this.getScissorTest=function(){return Be},this.setScissorTest=function(M){_.setScissorTest(Be=M)},this.setOpaqueSort=function(M){Se=M},this.setTransparentSort=function(M){Pe=M},this.getClearColor=function(M){return M.copy(Le.getClearColor())},this.setClearColor=function(){Le.setClearColor(...arguments)},this.getClearAlpha=function(){return Le.getClearAlpha()},this.setClearAlpha=function(){Le.setClearAlpha(...arguments)},this.clear=function(M=!0,N=!0,H=!0){let G=0;if(M){let k=!1;if(P!==null){const pe=P.texture.format;k=f.has(pe)}if(k){const pe=P.texture.type,_e=d.has(pe),fe=Le.getClearColor(),Me=Le.getClearAlpha(),be=fe.r,De=fe.g,Ue=fe.b;_e?(E[0]=be,E[1]=De,E[2]=Ue,E[3]=Me,D.clearBufferuiv(D.COLOR,0,E)):(A[0]=be,A[1]=De,A[2]=Ue,A[3]=Me,D.clearBufferiv(D.COLOR,0,A))}else G|=D.COLOR_BUFFER_BIT}N&&(G|=D.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),H&&(G|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),G!==0&&D.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),F=M},this.dispose=function(){t.removeEventListener("webglcontextlost",ot,!1),t.removeEventListener("webglcontextrestored",it,!1),t.removeEventListener("webglcontextcreationerror",cn,!1),Le.dispose(),de.dispose(),ce.dispose(),V.dispose(),re.dispose(),ee.dispose(),me.dispose(),te.dispose(),oe.dispose(),ve.dispose(),ve.removeEventListener("sessionstart",dc),ve.removeEventListener("sessionend",hc),Qn.stop()};function ot(M){M.preventDefault(),As("WebGLRenderer: Context Lost."),C=!0}function it(){As("WebGLRenderer: Context Restored."),C=!1;const M=O.autoReset,N=Re.enabled,H=Re.autoUpdate,G=Re.needsUpdate,k=Re.type;Ee(),O.autoReset=M,Re.enabled=N,Re.autoUpdate=H,Re.needsUpdate=G,Re.type=k}function cn(M){We("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function ln(M){const N=M.target;N.removeEventListener("dispose",ln),wd(N)}function wd(M){Rd(M),V.remove(M)}function Rd(M){const N=V.get(M).programs;N!==void 0&&(N.forEach(function(H){oe.releaseProgram(H)}),M.isShaderMaterial&&oe.releaseShaderCache(M))}this.renderBufferDirect=function(M,N,H,G,k,pe){N===null&&(N=Et);const _e=k.isMesh&&k.matrixWorld.determinantAffine()<0,fe=Id(M,N,H,G,k);_.setMaterial(G,_e);let Me=H.index,be=1;if(G.wireframe===!0){if(Me=J.getWireframeAttribute(H),Me===void 0)return;be=2}const De=H.drawRange,Ue=H.attributes.position;let Te=De.start*be,je=(De.start+De.count)*be;pe!==null&&(Te=Math.max(Te,pe.start*be),je=Math.min(je,(pe.start+pe.count)*be)),Me!==null?(Te=Math.max(Te,0),je=Math.min(je,Me.count)):Ue!=null&&(Te=Math.max(Te,0),je=Math.min(je,Ue.count));const dt=je-Te;if(dt<0||dt===1/0)return;me.setup(k,G,fe,H,Me);let ct,tt=se;if(Me!==null&&(ct=ae.get(Me),tt=j,tt.setIndex(ct)),k.isMesh)G.wireframe===!0?(_.setLineWidth(G.wireframeLinewidth*pt()),tt.setMode(D.LINES)):tt.setMode(D.TRIANGLES);else if(k.isLine){let wt=G.linewidth;wt===void 0&&(wt=1),_.setLineWidth(wt*pt()),k.isLineSegments?tt.setMode(D.LINES):k.isLineLoop?tt.setMode(D.LINE_LOOP):tt.setMode(D.LINE_STRIP)}else k.isPoints?tt.setMode(D.POINTS):k.isSprite&&tt.setMode(D.TRIANGLES);if(k.isBatchedMesh)if(Ke.get("WEBGL_multi_draw"))tt.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{const wt=k._multiDrawStarts,ge=k._multiDrawCounts,Vt=k._multiDrawCount,He=Me?ae.get(Me).bytesPerElement:1,Yt=V.get(G).currentProgram.getUniforms();for(let un=0;un<Vt;un++)Yt.setValue(D,"_gl_DrawID",un),tt.render(wt[un]/He,ge[un])}else if(k.isInstancedMesh)tt.renderInstances(Te,dt,k.count);else if(H.isInstancedBufferGeometry){const wt=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,ge=Math.min(H.instanceCount,wt);tt.renderInstances(Te,dt,ge)}else tt.render(Te,dt)};function uc(M,N,H){M.transparent===!0&&M.side===Rn&&M.forceSinglePass===!1?(M.side=Ut,M.needsUpdate=!0,Ar(M,N,H),M.side=Zn,M.needsUpdate=!0,Ar(M,N,H),M.side=Rn):Ar(M,N,H)}this.compile=function(M,N,H=null){H===null&&(H=M),b=ce.get(H),b.init(N),x.push(b),H.traverseVisible(function(k){k.isLight&&k.layers.test(N.layers)&&(b.pushLight(k),k.castShadow&&b.pushShadow(k))}),M!==H&&M.traverseVisible(function(k){k.isLight&&k.layers.test(N.layers)&&(b.pushLight(k),k.castShadow&&b.pushShadow(k))}),b.setupLights();const G=new Set;return M.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;const pe=k.material;if(pe)if(Array.isArray(pe))for(let _e=0;_e<pe.length;_e++){const fe=pe[_e];uc(fe,H,k),G.add(fe)}else uc(pe,H,k),G.add(pe)}),b=x.pop(),G},this.compileAsync=function(M,N,H=null){const G=this.compile(M,N,H);return new Promise(k=>{function pe(){if(G.forEach(function(_e){V.get(_e).currentProgram.isReady()&&G.delete(_e)}),G.size===0){k(M);return}setTimeout(pe,10)}Ke.get("KHR_parallel_shader_compile")!==null?pe():setTimeout(pe,10)})};let Vs=null;function Cd(M){Vs&&Vs(M)}function dc(){Qn.stop()}function hc(){Qn.start()}const Qn=new ud;Qn.setAnimationLoop(Cd),typeof self<"u"&&Qn.setContext(self),this.setAnimationLoop=function(M){Vs=M,ve.setAnimationLoop(M),M===null?Qn.stop():Qn.start()},ve.addEventListener("sessionstart",dc),ve.addEventListener("sessionend",hc),this.render=function(M,N){if(N!==void 0&&N.isCamera!==!0){We("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(C===!0)return;F!==null&&F.renderStart(M,N);const H=ve.enabled===!0&&ve.isPresenting===!0,G=y!==null&&(P===null||H)&&y.begin(I,P);if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),ve.enabled===!0&&ve.isPresenting===!0&&(y===null||y.isCompositing()===!1)&&(ve.cameraAutoUpdate===!0&&ve.updateCamera(N),N=ve.getCamera()),M.isScene===!0&&M.onBeforeRender(I,M,N,P),b=ce.get(M,x.length),b.init(N),b.state.textureUnits=K.getTextureUnits(),x.push(b),ft.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),et.setFromProjectionMatrix(ft,mn,N.reversedDepth),Ve=this.localClippingEnabled,$e=Ae.init(this.clippingPlanes,Ve),w=de.get(M,R.length),w.init(),R.push(w),ve.enabled===!0&&ve.isPresenting===!0){const _e=I.xr.getDepthSensingMesh();_e!==null&&Hs(_e,N,-1/0,I.sortObjects)}Hs(M,N,0,I.sortObjects),w.finish(),I.sortObjects===!0&&w.sort(Se,Pe,N.reversedDepth),at=ve.enabled===!1||ve.isPresenting===!1||ve.hasDepthSensing()===!1,at&&Le.addToRenderList(w,M),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),$e===!0&&Ae.beginShadows();const k=b.state.shadowsArray;if(Re.render(k,M,N),$e===!0&&Ae.endShadows(),(G&&y.hasRenderPass())===!1){const _e=w.opaque,fe=w.transmissive;if(b.setupLights(),N.isArrayCamera){const Me=N.cameras;if(fe.length>0)for(let be=0,De=Me.length;be<De;be++){const Ue=Me[be];pc(_e,fe,M,Ue)}at&&Le.render(M);for(let be=0,De=Me.length;be<De;be++){const Ue=Me[be];fc(w,M,Ue,Ue.viewport)}}else fe.length>0&&pc(_e,fe,M,N),at&&Le.render(M),fc(w,M,N)}P!==null&&X===0&&(K.updateMultisampleRenderTarget(P),K.updateRenderTargetMipmap(P)),G&&y.end(I),M.isScene===!0&&M.onAfterRender(I,M,N),me.resetDefaultState(),Z=-1,ne=null,x.pop(),x.length>0?(b=x[x.length-1],K.setTextureUnits(b.state.textureUnits),$e===!0&&Ae.setGlobalState(I.clippingPlanes,b.state.camera)):b=null,R.pop(),R.length>0?w=R[R.length-1]:w=null,F!==null&&F.renderEnd()};function Hs(M,N,H,G){if(M.visible===!1)return;if(M.layers.test(N.layers)){if(M.isGroup)H=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(N);else if(M.isLightProbeGrid)b.pushLightProbeGrid(M);else if(M.isLight)b.pushLight(M),M.castShadow&&b.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||et.intersectsSprite(M)){G&&vt.setFromMatrixPosition(M.matrixWorld).applyMatrix4(ft);const _e=ee.update(M),fe=M.material;fe.visible&&w.push(M,_e,fe,H,vt.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||et.intersectsObject(M))){const _e=ee.update(M),fe=M.material;if(G&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),vt.copy(M.boundingSphere.center)):(_e.boundingSphere===null&&_e.computeBoundingSphere(),vt.copy(_e.boundingSphere.center)),vt.applyMatrix4(M.matrixWorld).applyMatrix4(ft)),Array.isArray(fe)){const Me=_e.groups;for(let be=0,De=Me.length;be<De;be++){const Ue=Me[be],Te=fe[Ue.materialIndex];Te&&Te.visible&&w.push(M,_e,Te,H,vt.z,Ue)}}else fe.visible&&w.push(M,_e,fe,H,vt.z,null)}}const pe=M.children;for(let _e=0,fe=pe.length;_e<fe;_e++)Hs(pe[_e],N,H,G)}function fc(M,N,H,G){const{opaque:k,transmissive:pe,transparent:_e}=M;b.setupLightsView(H),$e===!0&&Ae.setGlobalState(I.clippingPlanes,H),G&&_.viewport(ie.copy(G)),k.length>0&&Tr(k,N,H),pe.length>0&&Tr(pe,N,H),_e.length>0&&Tr(_e,N,H),_.buffers.depth.setTest(!0),_.buffers.depth.setMask(!0),_.buffers.color.setMask(!0),_.setPolygonOffset(!1)}function pc(M,N,H,G){if((H.isScene===!0?H.overrideMaterial:null)!==null)return;if(b.state.transmissionRenderTarget[G.id]===void 0){const Te=Ke.has("EXT_color_buffer_half_float")||Ke.has("EXT_color_buffer_float");b.state.transmissionRenderTarget[G.id]=new vn(1,1,{generateMipmaps:!0,type:Te?Un:Jt,minFilter:li,samples:Math.max(4,T.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ke.workingColorSpace})}const pe=b.state.transmissionRenderTarget[G.id],_e=G.viewport||ie;pe.setSize(_e.z*I.transmissionResolutionScale,_e.w*I.transmissionResolutionScale);const fe=I.getRenderTarget(),Me=I.getActiveCubeFace(),be=I.getActiveMipmapLevel();I.setRenderTarget(pe),I.getClearColor(qe),Ge=I.getClearAlpha(),Ge<1&&I.setClearColor(16777215,.5),I.clear(),at&&Le.render(H);const De=I.toneMapping;I.toneMapping=xn;const Ue=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),b.setupLightsView(G),$e===!0&&Ae.setGlobalState(I.clippingPlanes,G),Tr(M,H,G),K.updateMultisampleRenderTarget(pe),K.updateRenderTargetMipmap(pe),Ke.has("WEBGL_multisampled_render_to_texture")===!1){let Te=!1;for(let je=0,dt=N.length;je<dt;je++){const ct=N[je],{object:tt,geometry:wt,material:ge,group:Vt}=ct;if(ge.side===Rn&&tt.layers.test(G.layers)){const He=ge.side;ge.side=Ut,ge.needsUpdate=!0,mc(tt,H,G,wt,ge,Vt),ge.side=He,ge.needsUpdate=!0,Te=!0}}Te===!0&&(K.updateMultisampleRenderTarget(pe),K.updateRenderTargetMipmap(pe))}I.setRenderTarget(fe,Me,be),I.setClearColor(qe,Ge),Ue!==void 0&&(G.viewport=Ue),I.toneMapping=De}function Tr(M,N,H){const G=N.isScene===!0?N.overrideMaterial:null;for(let k=0,pe=M.length;k<pe;k++){const _e=M[k],{object:fe,geometry:Me,group:be}=_e;let De=_e.material;De.allowOverride===!0&&G!==null&&(De=G),fe.layers.test(H.layers)&&mc(fe,N,H,Me,De,be)}}function mc(M,N,H,G,k,pe){M.onBeforeRender(I,N,H,G,k,pe),M.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),k.onBeforeRender(I,N,H,G,M,pe),k.transparent===!0&&k.side===Rn&&k.forceSinglePass===!1?(k.side=Ut,k.needsUpdate=!0,I.renderBufferDirect(H,N,G,k,M,pe),k.side=Zn,k.needsUpdate=!0,I.renderBufferDirect(H,N,G,k,M,pe),k.side=Rn):I.renderBufferDirect(H,N,G,k,M,pe),M.onAfterRender(I,N,H,G,k,pe)}function Ar(M,N,H){N.isScene!==!0&&(N=Et);const G=V.get(M),k=b.state.lights,pe=b.state.shadowsArray,_e=k.state.version,fe=oe.getParameters(M,k.state,pe,N,H,b.state.lightProbeGridArray),Me=oe.getProgramCacheKey(fe);let be=G.programs;G.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?N.environment:null,G.fog=N.fog;const De=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;G.envMap=re.get(M.envMap||G.environment,De),G.envMapRotation=G.environment!==null&&M.envMap===null?N.environmentRotation:M.envMapRotation,be===void 0&&(M.addEventListener("dispose",ln),be=new Map,G.programs=be);let Ue=be.get(Me);if(Ue!==void 0){if(G.currentProgram===Ue&&G.lightsStateVersion===_e)return _c(M,fe),Ue}else fe.uniforms=oe.getUniforms(M),F!==null&&M.isNodeMaterial&&F.build(M,H,fe),M.onBeforeCompile(fe,I),Ue=oe.acquireProgram(fe,Me),be.set(Me,Ue),G.uniforms=fe.uniforms;const Te=G.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Te.clippingPlanes=Ae.uniform),_c(M,fe),G.needsLights=Dd(M),G.lightsStateVersion=_e,G.needsLights&&(Te.ambientLightColor.value=k.state.ambient,Te.lightProbe.value=k.state.probe,Te.directionalLights.value=k.state.directional,Te.directionalLightShadows.value=k.state.directionalShadow,Te.spotLights.value=k.state.spot,Te.spotLightShadows.value=k.state.spotShadow,Te.rectAreaLights.value=k.state.rectArea,Te.ltc_1.value=k.state.rectAreaLTC1,Te.ltc_2.value=k.state.rectAreaLTC2,Te.pointLights.value=k.state.point,Te.pointLightShadows.value=k.state.pointShadow,Te.hemisphereLights.value=k.state.hemi,Te.directionalShadowMatrix.value=k.state.directionalShadowMatrix,Te.spotLightMatrix.value=k.state.spotLightMatrix,Te.spotLightMap.value=k.state.spotLightMap,Te.pointShadowMatrix.value=k.state.pointShadowMatrix),G.lightProbeGrid=b.state.lightProbeGridArray.length>0,G.currentProgram=Ue,G.uniformsList=null,Ue}function gc(M){if(M.uniformsList===null){const N=M.currentProgram.getUniforms();M.uniformsList=ps.seqWithValue(N.seq,M.uniforms)}return M.uniformsList}function _c(M,N){const H=V.get(M);H.outputColorSpace=N.outputColorSpace,H.batching=N.batching,H.batchingColor=N.batchingColor,H.instancing=N.instancing,H.instancingColor=N.instancingColor,H.instancingMorph=N.instancingMorph,H.skinning=N.skinning,H.morphTargets=N.morphTargets,H.morphNormals=N.morphNormals,H.morphColors=N.morphColors,H.morphTargetsCount=N.morphTargetsCount,H.numClippingPlanes=N.numClippingPlanes,H.numIntersection=N.numClipIntersection,H.vertexAlphas=N.vertexAlphas,H.vertexTangents=N.vertexTangents,H.toneMapping=N.toneMapping}function Pd(M,N){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;S.setFromMatrixPosition(N.matrixWorld);for(let H=0,G=M.length;H<G;H++){const k=M[H];if(k.texture!==null&&k.boundingBox.containsPoint(S))return k}return null}function Id(M,N,H,G,k){N.isScene!==!0&&(N=Et),K.resetTextureUnits();const pe=N.fog,_e=G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial?N.environment:null,fe=P===null?I.outputColorSpace:P.isXRRenderTarget===!0?P.texture.colorSpace:ke.workingColorSpace,Me=G.isMeshStandardMaterial||G.isMeshLambertMaterial&&!G.envMap||G.isMeshPhongMaterial&&!G.envMap,be=re.get(G.envMap||_e,Me),De=G.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,Ue=!!H.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),Te=!!H.morphAttributes.position,je=!!H.morphAttributes.normal,dt=!!H.morphAttributes.color;let ct=xn;G.toneMapped&&(P===null||P.isXRRenderTarget===!0)&&(ct=I.toneMapping);const tt=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,wt=tt!==void 0?tt.length:0,ge=V.get(G),Vt=b.state.lights;if($e===!0&&(Ve===!0||M!==ne)){const rt=M===ne&&G.id===Z;Ae.setState(G,M,rt)}let He=!1;G.version===ge.__version?(ge.needsLights&&ge.lightsStateVersion!==Vt.state.version||ge.outputColorSpace!==fe||k.isBatchedMesh&&ge.batching===!1||!k.isBatchedMesh&&ge.batching===!0||k.isBatchedMesh&&ge.batchingColor===!0&&k.colorTexture===null||k.isBatchedMesh&&ge.batchingColor===!1&&k.colorTexture!==null||k.isInstancedMesh&&ge.instancing===!1||!k.isInstancedMesh&&ge.instancing===!0||k.isSkinnedMesh&&ge.skinning===!1||!k.isSkinnedMesh&&ge.skinning===!0||k.isInstancedMesh&&ge.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&ge.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&ge.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&ge.instancingMorph===!1&&k.morphTexture!==null||ge.envMap!==be||G.fog===!0&&ge.fog!==pe||ge.numClippingPlanes!==void 0&&(ge.numClippingPlanes!==Ae.numPlanes||ge.numIntersection!==Ae.numIntersection)||ge.vertexAlphas!==De||ge.vertexTangents!==Ue||ge.morphTargets!==Te||ge.morphNormals!==je||ge.morphColors!==dt||ge.toneMapping!==ct||ge.morphTargetsCount!==wt||!!ge.lightProbeGrid!=b.state.lightProbeGridArray.length>0)&&(He=!0):(He=!0,ge.__version=G.version);let Yt=ge.currentProgram;He===!0&&(Yt=Ar(G,N,k),F&&G.isNodeMaterial&&F.onUpdateProgram(G,Yt,ge));let un=!1,Bn=!1,_i=!1;const nt=Yt.getUniforms(),ht=ge.uniforms;if(_.useProgram(Yt.program)&&(un=!0,Bn=!0,_i=!0),G.id!==Z&&(Z=G.id,Bn=!0),ge.needsLights){const rt=Pd(b.state.lightProbeGridArray,k);ge.lightProbeGrid!==rt&&(ge.lightProbeGrid=rt,Bn=!0)}if(un||ne!==M){_.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),nt.setValue(D,"projectionMatrix",M.projectionMatrix),nt.setValue(D,"viewMatrix",M.matrixWorldInverse);const Gn=nt.map.cameraPosition;Gn!==void 0&&Gn.setValue(D,gt.setFromMatrixPosition(M.matrixWorld)),T.logarithmicDepthBuffer&&nt.setValue(D,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&nt.setValue(D,"isOrthographic",M.isOrthographicCamera===!0),ne!==M&&(ne=M,Bn=!0,_i=!0)}if(ge.needsLights&&(Vt.state.directionalShadowMap.length>0&&nt.setValue(D,"directionalShadowMap",Vt.state.directionalShadowMap,K),Vt.state.spotShadowMap.length>0&&nt.setValue(D,"spotShadowMap",Vt.state.spotShadowMap,K),Vt.state.pointShadowMap.length>0&&nt.setValue(D,"pointShadowMap",Vt.state.pointShadowMap,K)),k.isSkinnedMesh){nt.setOptional(D,k,"bindMatrix"),nt.setOptional(D,k,"bindMatrixInverse");const rt=k.skeleton;rt&&(rt.boneTexture===null&&rt.computeBoneTexture(),nt.setValue(D,"boneTexture",rt.boneTexture,K))}k.isBatchedMesh&&(nt.setOptional(D,k,"batchingTexture"),nt.setValue(D,"batchingTexture",k._matricesTexture,K),nt.setOptional(D,k,"batchingIdTexture"),nt.setValue(D,"batchingIdTexture",k._indirectTexture,K),nt.setOptional(D,k,"batchingColorTexture"),k._colorsTexture!==null&&nt.setValue(D,"batchingColorTexture",k._colorsTexture,K));const zn=H.morphAttributes;if((zn.position!==void 0||zn.normal!==void 0||zn.color!==void 0)&&L.update(k,H,Yt),(Bn||ge.receiveShadow!==k.receiveShadow)&&(ge.receiveShadow=k.receiveShadow,nt.setValue(D,"receiveShadow",k.receiveShadow)),(G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial)&&G.envMap===null&&N.environment!==null&&(ht.envMapIntensity.value=N.environmentIntensity),ht.dfgLUT!==void 0&&(ht.dfgLUT.value=cv()),Bn){if(nt.setValue(D,"toneMappingExposure",I.toneMappingExposure),ge.needsLights&&Ld(ht,_i),pe&&G.fog===!0&&ye.refreshFogUniforms(ht,pe),ye.refreshMaterialUniforms(ht,G,W,B,b.state.transmissionRenderTarget[M.id]),ge.needsLights&&ge.lightProbeGrid){const rt=ge.lightProbeGrid;ht.probesSH.value=rt.texture,ht.probesMin.value.copy(rt.boundingBox.min),ht.probesMax.value.copy(rt.boundingBox.max),ht.probesResolution.value.copy(rt.resolution)}ps.upload(D,gc(ge),ht,K)}if(G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&(ps.upload(D,gc(ge),ht,K),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&nt.setValue(D,"center",k.center),nt.setValue(D,"modelViewMatrix",k.modelViewMatrix),nt.setValue(D,"normalMatrix",k.normalMatrix),nt.setValue(D,"modelMatrix",k.matrixWorld),G.uniformsGroups!==void 0){const rt=G.uniformsGroups;for(let Gn=0,xi=rt.length;Gn<xi;Gn++){const xc=rt[Gn];te.update(xc,Yt),te.bind(xc,Yt)}}return Yt}function Ld(M,N){M.ambientLightColor.needsUpdate=N,M.lightProbe.needsUpdate=N,M.directionalLights.needsUpdate=N,M.directionalLightShadows.needsUpdate=N,M.pointLights.needsUpdate=N,M.pointLightShadows.needsUpdate=N,M.spotLights.needsUpdate=N,M.spotLightShadows.needsUpdate=N,M.rectAreaLights.needsUpdate=N,M.hemisphereLights.needsUpdate=N}function Dd(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return Y},this.getActiveMipmapLevel=function(){return X},this.getRenderTarget=function(){return P},this.setRenderTargetTextures=function(M,N,H){const G=V.get(M);G.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,G.__autoAllocateDepthBuffer===!1&&(G.__useRenderToTexture=!1),V.get(M.texture).__webglTexture=N,V.get(M.depthTexture).__webglTexture=G.__autoAllocateDepthBuffer?void 0:H,G.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,N){const H=V.get(M);H.__webglFramebuffer=N,H.__useDefaultFramebuffer=N===void 0},this.setRenderTarget=function(M,N=0,H=0){P=M,Y=N,X=H;let G=null,k=!1,pe=!1;if(M){const fe=V.get(M);if(fe.__useDefaultFramebuffer!==void 0){_.bindFramebuffer(D.FRAMEBUFFER,fe.__webglFramebuffer),ie.copy(M.viewport),ue.copy(M.scissor),Fe=M.scissorTest,_.viewport(ie),_.scissor(ue),_.setScissorTest(Fe),Z=-1;return}else if(fe.__webglFramebuffer===void 0)K.setupRenderTarget(M);else if(fe.__hasExternalTextures)K.rebindTextures(M,V.get(M.texture).__webglTexture,V.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){const De=M.depthTexture;if(fe.__boundDepthTexture!==De){if(De!==null&&V.has(De)&&(M.width!==De.image.width||M.height!==De.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");K.setupDepthRenderbuffer(M)}}const Me=M.texture;(Me.isData3DTexture||Me.isDataArrayTexture||Me.isCompressedArrayTexture)&&(pe=!0);const be=V.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(be[N])?G=be[N][H]:G=be[N],k=!0):M.samples>0&&K.useMultisampledRTT(M)===!1?G=V.get(M).__webglMultisampledFramebuffer:Array.isArray(be)?G=be[H]:G=be,ie.copy(M.viewport),ue.copy(M.scissor),Fe=M.scissorTest}else ie.copy(we).multiplyScalar(W).floor(),ue.copy(ut).multiplyScalar(W).floor(),Fe=Be;if(H!==0&&(G=$),_.bindFramebuffer(D.FRAMEBUFFER,G)&&_.drawBuffers(M,G),_.viewport(ie),_.scissor(ue),_.setScissorTest(Fe),k){const fe=V.get(M.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+N,fe.__webglTexture,H)}else if(pe){const fe=N;for(let Me=0;Me<M.textures.length;Me++){const be=V.get(M.textures[Me]);D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0+Me,be.__webglTexture,H,fe)}}else if(M!==null&&H!==0){const fe=V.get(M.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,fe.__webglTexture,H)}Z=-1},this.readRenderTargetPixels=function(M,N,H,G,k,pe,_e,fe=0){if(!(M&&M.isWebGLRenderTarget)){We("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Me=V.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&_e!==void 0&&(Me=Me[_e]),Me){_.bindFramebuffer(D.FRAMEBUFFER,Me);try{const be=M.textures[fe],De=be.format,Ue=be.type;if(M.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+fe),!T.textureFormatReadable(De)){We("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!T.textureTypeReadable(Ue)){We("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=M.width-G&&H>=0&&H<=M.height-k&&D.readPixels(N,H,G,k,le.convert(De),le.convert(Ue),pe)}finally{const be=P!==null?V.get(P).__webglFramebuffer:null;_.bindFramebuffer(D.FRAMEBUFFER,be)}}},this.readRenderTargetPixelsAsync=async function(M,N,H,G,k,pe,_e,fe=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Me=V.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&_e!==void 0&&(Me=Me[_e]),Me)if(N>=0&&N<=M.width-G&&H>=0&&H<=M.height-k){_.bindFramebuffer(D.FRAMEBUFFER,Me);const be=M.textures[fe],De=be.format,Ue=be.type;if(M.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+fe),!T.textureFormatReadable(De))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!T.textureTypeReadable(Ue))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Te=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,Te),D.bufferData(D.PIXEL_PACK_BUFFER,pe.byteLength,D.STREAM_READ),D.readPixels(N,H,G,k,le.convert(De),le.convert(Ue),0);const je=P!==null?V.get(P).__webglFramebuffer:null;_.bindFramebuffer(D.FRAMEBUFFER,je);const dt=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await pp(D,dt,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,Te),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,pe),D.deleteBuffer(Te),D.deleteSync(dt),pe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,N=null,H=0){const G=Math.pow(2,-H),k=Math.floor(M.image.width*G),pe=Math.floor(M.image.height*G),_e=N!==null?N.x:0,fe=N!==null?N.y:0;K.setTexture2D(M,0),D.copyTexSubImage2D(D.TEXTURE_2D,H,0,0,_e,fe,k,pe),_.unbindTexture()},this.copyTextureToTexture=function(M,N,H=null,G=null,k=0,pe=0){let _e,fe,Me,be,De,Ue,Te,je,dt;const ct=M.isCompressedTexture?M.mipmaps[pe]:M.image;if(H!==null)_e=H.max.x-H.min.x,fe=H.max.y-H.min.y,Me=H.isBox3?H.max.z-H.min.z:1,be=H.min.x,De=H.min.y,Ue=H.isBox3?H.min.z:0;else{const ht=Math.pow(2,-k);_e=Math.floor(ct.width*ht),fe=Math.floor(ct.height*ht),M.isDataArrayTexture?Me=ct.depth:M.isData3DTexture?Me=Math.floor(ct.depth*ht):Me=1,be=0,De=0,Ue=0}G!==null?(Te=G.x,je=G.y,dt=G.z):(Te=0,je=0,dt=0);const tt=le.convert(N.format),wt=le.convert(N.type);let ge;N.isData3DTexture?(K.setTexture3D(N,0),ge=D.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(K.setTexture2DArray(N,0),ge=D.TEXTURE_2D_ARRAY):(K.setTexture2D(N,0),ge=D.TEXTURE_2D),_.activeTexture(D.TEXTURE0),_.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,N.flipY),_.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),_.pixelStorei(D.UNPACK_ALIGNMENT,N.unpackAlignment);const Vt=_.getParameter(D.UNPACK_ROW_LENGTH),He=_.getParameter(D.UNPACK_IMAGE_HEIGHT),Yt=_.getParameter(D.UNPACK_SKIP_PIXELS),un=_.getParameter(D.UNPACK_SKIP_ROWS),Bn=_.getParameter(D.UNPACK_SKIP_IMAGES);_.pixelStorei(D.UNPACK_ROW_LENGTH,ct.width),_.pixelStorei(D.UNPACK_IMAGE_HEIGHT,ct.height),_.pixelStorei(D.UNPACK_SKIP_PIXELS,be),_.pixelStorei(D.UNPACK_SKIP_ROWS,De),_.pixelStorei(D.UNPACK_SKIP_IMAGES,Ue);const _i=M.isDataArrayTexture||M.isData3DTexture,nt=N.isDataArrayTexture||N.isData3DTexture;if(M.isDepthTexture){const ht=V.get(M),zn=V.get(N),rt=V.get(ht.__renderTarget),Gn=V.get(zn.__renderTarget);_.bindFramebuffer(D.READ_FRAMEBUFFER,rt.__webglFramebuffer),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,Gn.__webglFramebuffer);for(let xi=0;xi<Me;xi++)_i&&(D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,V.get(M).__webglTexture,k,Ue+xi),D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,V.get(N).__webglTexture,pe,dt+xi)),D.blitFramebuffer(be,De,_e,fe,Te,je,_e,fe,D.DEPTH_BUFFER_BIT,D.NEAREST);_.bindFramebuffer(D.READ_FRAMEBUFFER,null),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else if(k!==0||M.isRenderTargetTexture||V.has(M)){const ht=V.get(M),zn=V.get(N);_.bindFramebuffer(D.READ_FRAMEBUFFER,q),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,z);for(let rt=0;rt<Me;rt++)_i?D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,ht.__webglTexture,k,Ue+rt):D.framebufferTexture2D(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,ht.__webglTexture,k),nt?D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,zn.__webglTexture,pe,dt+rt):D.framebufferTexture2D(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,zn.__webglTexture,pe),k!==0?D.blitFramebuffer(be,De,_e,fe,Te,je,_e,fe,D.COLOR_BUFFER_BIT,D.NEAREST):nt?D.copyTexSubImage3D(ge,pe,Te,je,dt+rt,be,De,_e,fe):D.copyTexSubImage2D(ge,pe,Te,je,be,De,_e,fe);_.bindFramebuffer(D.READ_FRAMEBUFFER,null),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else nt?M.isDataTexture||M.isData3DTexture?D.texSubImage3D(ge,pe,Te,je,dt,_e,fe,Me,tt,wt,ct.data):N.isCompressedArrayTexture?D.compressedTexSubImage3D(ge,pe,Te,je,dt,_e,fe,Me,tt,ct.data):D.texSubImage3D(ge,pe,Te,je,dt,_e,fe,Me,tt,wt,ct):M.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,pe,Te,je,_e,fe,tt,wt,ct.data):M.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,pe,Te,je,ct.width,ct.height,tt,ct.data):D.texSubImage2D(D.TEXTURE_2D,pe,Te,je,_e,fe,tt,wt,ct);_.pixelStorei(D.UNPACK_ROW_LENGTH,Vt),_.pixelStorei(D.UNPACK_IMAGE_HEIGHT,He),_.pixelStorei(D.UNPACK_SKIP_PIXELS,Yt),_.pixelStorei(D.UNPACK_SKIP_ROWS,un),_.pixelStorei(D.UNPACK_SKIP_IMAGES,Bn),pe===0&&N.generateMipmaps&&D.generateMipmap(ge),_.unbindTexture()},this.initRenderTarget=function(M){V.get(M).__webglFramebuffer===void 0&&K.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?K.setTextureCube(M,0):M.isData3DTexture?K.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?K.setTexture2DArray(M,0):K.setTexture2D(M,0),_.unbindTexture()},this.resetState=function(){Y=0,X=0,P=null,_.reset(),me.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return mn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=ke._getDrawingBufferColorSpace(e),t.unpackColorSpace=ke._getUnpackColorSpace()}}const uv=["front","top","right","home"],xd=.001,dv=Math.PI-.001,Da=.01,Nl=1e4,Na={front:{azimuth:0,polar:Math.PI/2},top:{azimuth:0,polar:xd},right:{azimuth:Math.PI/2,polar:Math.PI/2},home:{azimuth:Math.PI/4,polar:Math.PI/3}},Ul=5,hv=1.3;class fv{camera;#e=new U(0,0,0);#t=Na.home.azimuth;#n=Na.home.polar;#i=Ul;constructor(e={}){this.camera=new Zt(e.fovDegrees??50,1,e.near??.01,e.far??1e3),this.#r()}get target(){return[this.#e.x,this.#e.y,this.#e.z]}get radius(){return this.#i}get pose(){const{position:e,quaternion:t}=this.camera;return{position:{x:e.x,y:e.y,z:e.z},orientation:{x:t.x,y:t.y,z:t.z,w:t.w},fovDegrees:this.camera.fov,aspect:this.camera.aspect}}setAspect(e){this.camera.aspect!==e&&(this.camera.aspect=e,this.camera.updateProjectionMatrix())}orbit(e,t){this.#t-=e,this.#n=Ir.clamp(this.#n-t,xd,dv),this.#r()}pan(e,t){const i=new U,r=new U;this.camera.matrixWorld.extractBasis(i,r,new U),this.#e.addScaledVector(i,-e).addScaledVector(r,t),this.#r()}dolly(e){this.#i=Ir.clamp(this.#i*e,Da,Nl),this.#r()}setView(e){const t=Na[e];this.#t=t.azimuth,this.#n=t.polar,this.#r()}frame(e){if(!e){this.#e.set(0,0,0),this.#i=Ul,this.#r();return}const t=new U((e.min[0]+e.max[0])/2,(e.min[1]+e.max[1])/2,(e.min[2]+e.max[2])/2),i=new U(e.max[0]-e.min[0],e.max[1]-e.min[1],e.max[2]-e.min[2]),r=Math.max(i.length()/2,Da),s=Ir.degToRad(this.camera.fov),a=r/Math.sin(s/2)*hv;this.#e.copy(t),this.#i=Ir.clamp(a,Da,Nl),this.#r()}#r(){const e=Math.sin(this.#n),t=new U(this.#i*e*Math.sin(this.#t),this.#i*Math.cos(this.#n),this.#i*e*Math.cos(this.#t));this.camera.position.copy(this.#e).add(t),this.camera.lookAt(this.#e),this.camera.updateMatrixWorld(!0)}}class pv{#e;#t;#n;#i=e=>{e.preventDefault(),this.#s=!0,this.#n?.(!0)};#r=()=>{this.#s=!1,this.#n?.(!1)};#s=!1;#a=0;constructor(e,t={}){this.#t=e,this.#n=t.onContextLoss,this.#e=new lv({canvas:e,antialias:t.antialias??!0,alpha:!1}),this.#e.setClearColor(2764081,1),e.addEventListener("webglcontextlost",this.#i,!1),e.addEventListener("webglcontextrestored",this.#r,!1)}get contextLost(){return this.#s}get lastFrameTimeMs(){return this.#a}resize(e,t,i){this.#e.setPixelRatio(i),this.#e.setSize(e,t,!1)}render(e,t){if(this.#s)return;const i=performance.now();this.#e.render(e,t),this.#a=performance.now()-i}dispose(){this.#t.removeEventListener("webglcontextlost",this.#i,!1),this.#t.removeEventListener("webglcontextrestored",this.#r,!1),this.#e.dispose()}}const cr=["x","y","z"],rs=Object.freeze({x:16734564,y:7266426,z:5941759}),mv=15782500,gv=16769126,_v=1e3,Di=.07,Ps=.16,Is=1,dr=.24,hr=.52,Fl=.04,ri=.12,lc=1,ms=.11;function En(n){return n==="x"?0:n==="y"?1:2}function xv(n){return cr.filter(e=>e!==n)}function Ol(n,e,t){const i=[-Di,-Di,-Di],r=[Di,Di,Di];return i[En(n)]=e,r[En(n)]=t,{min:i,max:r}}function vv(n){const e=[dr,dr,dr],t=[hr,hr,hr];return e[En(n)]=-Fl,t[En(n)]=Fl,{min:e,max:t}}function Mv(n){const e=lc+ms,t=[-e,-e,-e],i=[e,e,e];return t[En(n)]=-ms,i[En(n)]=ms,{min:t,max:i}}const Go=Object.freeze([{id:"scale-uniform",mode:"scale",kind:"uniform",axis:null,box:{min:[-ri,-ri,-ri],max:[ri,ri,ri]},color:mv},...cr.map(n=>({id:`translate-plane-${n}`,mode:"translate",kind:"plane",axis:n,box:vv(n),color:rs[n]})),...cr.map(n=>({id:`translate-${n}`,mode:"translate",kind:"axis",axis:n,box:Ol(n,Ps,Is+.18),color:rs[n]})),...cr.map(n=>({id:`scale-${n}`,mode:"scale",kind:"axis",axis:n,box:Ol(n,Ps,Is+.1),color:rs[n]})),...cr.map(n=>({id:`rotate-${n}`,mode:"rotate",kind:"ring",axis:n,box:Mv(n),radius:lc,color:rs[n]}))]);function Sv(n){return Go.filter(e=>e.mode===n)}class Ev{group=new di;#e=new Map;#t=[];#n="translate";constructor(){this.group.visible=!1;for(const e of Go){const t=this.#s(e);t.node.visible=!1,this.group.add(t.node),this.#e.set(e.id,t)}this.group.traverse(e=>{e.renderOrder=_v})}clear(){this.group.visible=!1}update(e){this.group.visible=!0,this.#n=e.mode;const t=new Qe().fromArray([...e.matrix]);t.multiply(new Qe().makeScale(e.size,e.size,e.size)),this.group.matrix.copy(t),this.group.matrixAutoUpdate=!1,this.group.matrixWorldNeedsUpdate=!0;for(const i of Go){const r=this.#e.get(i.id);if(!r)continue;r.node.visible=i.mode===this.#n;const s=i.id===e.activeId?gv:i.color;for(const a of r.materials)"color"in a&&a.color.setHex(s)}}dispose(){for(const e of this.#t)e.dispose();this.#t.length=0,this.#e.clear()}#i(e,t){const i=new Bs({color:e,depthTest:!1,depthWrite:!1,transparent:t<1,opacity:t,side:2});return this.#t.push(i),i}#r(e){return this.#t.push(e),e}#s(e){const t=new di,i=[];switch(e.kind){case"axis":{if(!e.axis)break;const r=this.#i(e.color,1);i.push(r);const s=Is-Ps,a=new bt(this.#r(new Nn(.022,s,.022)),r);Bl(a,e.axis,Ps+s/2),t.add(a);const o=e.mode==="translate"?new bt(this.#r(new oc(.07,.22,16)),r):new bt(this.#r(new Nn(.13,.13,.13)),r);Bl(o,e.axis,Is+(e.mode==="translate"?.11:0)),t.add(o);break}case"plane":{if(!e.axis)break;const r=this.#i(e.color,.35);i.push(r);const s=hr-dr,a=new bt(this.#r(new yr(s,s)),r),o=(dr+hr)/2,[c,l]=xv(e.axis);a.position.setComponent(En(c),o),a.position.setComponent(En(l),o),e.axis==="x"&&(a.rotation.y=Math.PI/2),e.axis==="y"&&(a.rotation.x=Math.PI/2),t.add(a);break}case"ring":{if(!e.axis)break;const r=this.#i(e.color,1);i.push(r);const s=new bt(this.#r(new cc(lc,.016,8,96)),r);e.axis==="x"&&(s.rotation.y=Math.PI/2),e.axis==="y"&&(s.rotation.x=Math.PI/2),t.add(s);break}case"uniform":{const r=this.#i(e.color,1);i.push(r);const s=ri*2*.8;t.add(new bt(this.#r(new Nn(s,s,s)),r));break}}return{node:t,materials:i}}}function Bl(n,e,t){e==="x"&&(n.rotation.z=-Math.PI/2),e==="z"&&(n.rotation.x=Math.PI/2),n.position.setComponent(En(e),t)}const yv=.1,bv=.34,Tv=10;function Av(n,e){const t=[],i=[],r=Math.floor(n/e);for(let o=-r;o<=r;o+=1){const c=o*e,l=(1-Math.abs(c)/n)**2,h=o%Tv===0?bv:yv;for(const[p,u,m,g]of[[c,-n,c,n],[-n,c,n,c]])t.push(p,0,u,m,0,g),i.push(l*h,l*h)}const s=new It;s.setAttribute("position",new Ot(new Float32Array(t),3));const a=new Float32Array(i.length*3);return i.forEach((o,c)=>{a[c*3]=o*.82,a[c*3+1]=o*.88,a[c*3+2]=o}),s.setAttribute("color",new Ot(a,3)),new sc(s,new vr({vertexColors:!0,transparent:!0,opacity:.9}))}function vd(n,e){const t=new Kp(e.vertices,e.stride),i=new ws(t,3,e.positionOffset,!1),r=new ws(t,3,e.normalOffset,!1);n.setAttribute("position",i),n.setAttribute("normal",r),n.setIndex(new Ot(e.indices,1,!1)),n.computeBoundingSphere(),n.computeBoundingBox()}function wv(n){return Math.floor(n.indices.length/3)}const Rv=`
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -viewPosition.xyz;
    gl_Position = projectionMatrix * viewPosition;
  }
`,Cv=`
  uniform vec3 uColor;
  uniform vec3 uKeyLightDir;
  uniform vec3 uFillLightDir;
  uniform float uAmbient;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    if (!gl_FrontFacing) normal = -normal;

    float key = max(dot(normal, uKeyLightDir), 0.0);
    float fill = max(dot(normal, uFillLightDir), 0.0) * 0.35;

    vec3 viewDir = normalize(vViewPosition);
    vec3 halfVec = normalize(uKeyLightDir + viewDir);
    float specular = pow(max(dot(normal, halfVec), 0.0), 32.0) * 0.25;

    float lighting = uAmbient + key + fill;
    vec3 color = uColor * lighting + vec3(specular);
    gl_FragColor = vec4(color, 1.0);
  }
`,Pv=10134701;function Iv(n={}){const e=new Xe(n.color??Pv);return new on({vertexShader:Rv,fragmentShader:Cv,uniforms:{uColor:{value:e},uKeyLightDir:{value:new U(.5,.8,.3).normalize()},uFillLightDir:{value:new U(-.6,.2,-.4).normalize()},uAmbient:{value:.25}}})}const Lv=16761415,Dv=16771496,Nv=9426175;class Uv{group=new di;#e=new rm(new Nn(1,1,1));#t=new vr({color:Lv,depthTest:!1,transparent:!0,opacity:.9});#n=new vr({color:Dv,depthTest:!1});#i=[];constructor(){this.group.renderOrder=900}set(e){for(;this.#i.length<e.length;){const t=new sc(this.#e,this.#t);t.matrixAutoUpdate=!1,t.renderOrder=900,this.#i.push(t),this.group.add(t)}this.#i.forEach((t,i)=>{const r=e[i];if(!r){t.visible=!1;return}t.visible=!0,t.material=r.primary===!0?this.#n:this.#t;const s=[0,1,2].map(c=>Math.max((r.bounds.max[c]??0)-(r.bounds.min[c]??0),1e-6)),a=[0,1,2].map(c=>((r.bounds.max[c]??0)+(r.bounds.min[c]??0))/2),o=new Qe().makeTranslation(a[0]??0,a[1]??0,a[2]??0).multiply(new Qe().makeScale(s[0]??1,s[1]??1,s[2]??1));t.matrix.copy(new Qe().fromArray([...r.matrix]).multiply(o)),t.matrixWorldNeedsUpdate=!0})}clear(){for(const e of this.#i)e.visible=!1}dispose(){this.#e.dispose(),this.#t.dispose(),this.#n.dispose(),this.#i.length=0}}class Fv{mesh;#e=new It;#t=new Bs({color:Nv,transparent:!0,opacity:.28,depthWrite:!1,side:Ut});constructor(){this.mesh=new bt(this.#e,this.#t),this.mesh.visible=!1,this.mesh.matrixAutoUpdate=!1,this.mesh.renderOrder=800}set(e){if(!e?.mesh||e.mesh.indices.length===0){this.mesh.visible=!1;return}vd(this.#e,e.mesh),this.mesh.matrix.copy(new Qe().fromArray([...e.matrix])),this.mesh.matrixWorldNeedsUpdate=!0,this.mesh.visible=!0}dispose(){this.#e.dispose(),this.#t.dispose()}}class Ov{lines;#e=new It;#t=new vr({color:16777215,depthTest:!1});constructor(){this.#e.setAttribute("position",new Ot(new Float32Array([-1,0,0,1,0,0,0,-1,0,0,1,0,0,0,-1,0,0,1]),3)),this.lines=new sc(this.#e,this.#t),this.lines.visible=!1,this.lines.matrixAutoUpdate=!1,this.lines.renderOrder=1100}set(e,t){if(!e){this.lines.visible=!1;return}this.lines.matrix.makeTranslation(e[0],e[1],e[2]).multiply(new Qe().makeScale(t,t,t)),this.lines.matrixWorldNeedsUpdate=!0,this.lines.visible=!0}dispose(){this.#e.dispose(),this.#t.dispose()}}const Bv=1,zv=.01;class Gv{scene=new Xp;#e;#t;#n=Av(Bv,zv);#i=new Uv;#r=new Fv;#s=new Ov;#a=new Ev;#o=0;constructor(){this.#t=Iv(),this.#e=new bt(void 0,this.#t),this.#e.visible=!1,this.scene.add(this.#e),this.scene.add(this.#n),this.scene.add(this.#i.group),this.scene.add(this.#r.mesh),this.scene.add(this.#s.lines),this.scene.add(this.#a.group)}get triangleCount(){return this.#o}get solid(){return this.#e}setGridVisible(e){this.#n.visible=e}setSelection(e){this.#i.set(e)}setGhost(e){this.#r.set(e)}setSnapMarker(e,t){this.#s.set(e,t)}setGizmo(e){e===null?this.#a.clear():this.#a.update(e)}upload(e){if(e.indices.length===0){this.#e.visible=!1,this.#o=0;return}vd(this.#e.geometry,e),this.#e.visible=!0,this.#o=wv(e)}dispose(){this.#e.geometry.dispose(),this.#t.dispose(),this.#n.geometry.dispose(),(Array.isArray(this.#n.material)?this.#n.material:[this.#n.material]).forEach(e=>e.dispose()),this.#i.dispose(),this.#r.dispose(),this.#s.dispose(),this.#a.dispose()}}const kv="render";function Vv(n,e={}){const t=new Gv,i=new fv(e.fovDegrees===void 0?{}:{fovDegrees:e.fovDegrees}),r=new pv(n,{...e.antialias===void 0?{}:{antialias:e.antialias},...e.onContextLoss===void 0?{}:{onContextLoss:e.onContextLoss}});let s=0;return{renderFrame(){r.render(t.scene,i.camera)},upload(o){t.upload(o)},resize(o,c,l=globalThis.devicePixelRatio||1){r.resize(o,c,l),i.setAspect(c===0?1:o/c)},camera:{orbit:(o,c)=>i.orbit(o,c),pan:(o,c)=>i.pan(o,c),dolly:o=>i.dolly(o),setView:o=>i.setView(o),frame:o=>i.frame(o),get target(){return i.target},get pose(){return i.pose}},setGridVisible(o){t.setGridVisible(o)},setSelection(o){t.setSelection(o)},setGhost(o){t.setGhost(o)},setSnapMarker(o,c){t.setSnapMarker(o,c)},setGizmo(o){t.setGizmo(o)},get stats(){return{frameTimeMs:r.lastFrameTimeMs,triangleCount:t.triangleCount,evaluationQueueDepth:s}},setEvaluationQueueDepth(o){s=o},get contextLost(){return r.contextLost},dispose(){t.dispose(),r.dispose()}}}function xe(n,e={},t=[]){const i=document.createElement(n);e.class!==void 0&&(i.className=e.class),e.text!==void 0&&(i.textContent=e.text),e.title!==void 0&&(i.title=e.title);for(const[r,s]of Object.entries(e.attrs??{}))s===!1||s===null||s===void 0?i.removeAttribute(r):i.setAttribute(r,String(s));for(const[r,s]of Object.entries(e.dataset??{}))i.dataset[r]=s;for(const[r,s]of Object.entries(e.on??{}))i.addEventListener(r,s);return Hv(i,t),i}function Hv(n,e){for(const t of e)t==null||t===!1||n.appendChild(typeof t=="string"?document.createTextNode(t):t)}function ks(n){for(;n.firstChild;)n.removeChild(n.firstChild)}function yt(n,e,t={}){return xe("button",{...t,text:n,attrs:{type:"button",...t.attrs},on:{click:()=>e(),...t.on}})}function Ls(n,e,t){n.classList.toggle(e,t)}function Wv(n){const e="http://www.w3.org/2000/svg",t=document.createElementNS(e,"svg");t.setAttribute("viewBox",n.viewBox),t.setAttribute("aria-hidden","true"),t.setAttribute("fill","none"),t.setAttribute("stroke","currentColor"),t.setAttribute("stroke-width","1.4"),t.setAttribute("stroke-linejoin","round");for(const i of n.paths){const r=document.createElementNS(e,"path");r.setAttribute("d",i),t.appendChild(r)}return t}const Xv=["Edit","Transform","Booleans","View","File"],Md=Object.freeze([{id:"undo",key:"z",mod:!0,group:"Edit",description:"Undo the last edit"},{id:"redo",key:"z",mod:!0,shift:!0,group:"Edit",description:"Redo"},{id:"redo",key:"y",mod:!0,group:"Edit",description:"Redo"},{id:"delete",key:"Delete",group:"Edit",description:"Delete the selection"},{id:"delete",key:"Backspace",group:"Edit",description:"Delete the selection"},{id:"select-all",key:"a",mod:!0,group:"Edit",description:"Select every top-level solid"},{id:"deselect",key:"a",alt:!0,group:"Edit",description:"Clear the selection"},{id:"mode-translate",key:"g",group:"Transform",description:"Translate gizmo"},{id:"mode-rotate",key:"r",group:"Transform",description:"Rotate gizmo"},{id:"mode-scale",key:"s",group:"Transform",description:"Scale gizmo"},{id:"toggle-space",key:"q",group:"Transform",description:"World / local space"},{id:"toggle-snapping",key:"x",group:"Transform",description:"Grid and feature snapping"},{id:"boolean-union",key:"u",shift:!0,group:"Booleans",description:"Union the selection"},{id:"boolean-subtract",key:"s",shift:!0,group:"Booleans",description:"Subtract: the first selected solid is the base"},{id:"boolean-intersect",key:"i",shift:!0,group:"Booleans",description:"Intersect the selection"},{id:"view-front",key:"1",group:"View",description:"Front view"},{id:"view-top",key:"2",group:"View",description:"Top view"},{id:"view-right",key:"3",group:"View",description:"Right view"},{id:"view-home",key:"4",group:"View",description:"Home view"},{id:"frame-selection",key:"f",group:"View",description:"Frame the selection"},{id:"frame-all",key:"f",shift:!0,group:"View",description:"Frame the whole document"},{id:"hide-selection",key:"h",group:"View",description:"Hide the selection"},{id:"show-all",key:"h",alt:!0,group:"View",description:"Show everything again"},{id:"toggle-grid",key:"b",group:"View",description:"Ground grid"},{id:"toggle-stats",key:"p",group:"View",description:"Performance overlay"},{id:"toggle-help",key:"?",shift:!0,group:"View",description:"This list"},{id:"cancel",key:"Escape",group:"View",description:"Cancel a drag, or close a panel"},{id:"save",key:"s",mod:!0,group:"File",description:"Save a .carve file"},{id:"open",key:"o",mod:!0,group:"File",description:"Open a .carve file"}]);function Yv(n){return n.ctrlKey===!0||n.metaKey===!0}function $v(n){if(typeof n!="object"||n===null)return!1;const e=n;if(e.isContentEditable===!0)return!0;const t=typeof e.tagName=="string"?e.tagName.toUpperCase():"";return t==="INPUT"||t==="TEXTAREA"||t==="SELECT"}function qv(n,e=Md){const t=$v(n.target);for(const i of e)if(i.key.toLowerCase()===n.key.toLowerCase()&&(i.mod??!1)===Yv(n)&&(i.shift??!1)===(n.shiftKey===!0)&&(i.alt??!1)===(n.altKey===!0)&&!(t&&!(i.mod??!1)&&i.key!=="Escape"))return i.id;return null}function Kv(n,e="other"){const t=[];return n.mod&&t.push(e==="mac"?"⌘":"Ctrl"),n.shift&&t.push(e==="mac"?"⇧":"Shift"),n.alt&&t.push(e==="mac"?"⌥":"Alt"),t.push(n.key.length===1?n.key.toUpperCase():n.key),t.join(e==="mac"?"":"+")}function Zv(n=Md){return Xv.map(e=>[e,n.filter(t=>t.group===e)]).filter(([,e])=>e.length>0)}const Jv=[["Left drag","Move the solid under the cursor, or drag a gizmo handle"],["Left click","Select. Shift or Ctrl adds; Alt drills into a boolean"],["Right drag","Orbit"],["Middle drag","Pan"],["Wheel","Zoom"],["Drag a row","Reparent or reorder in the tree"],["Drag a number","Scrub the value; one undo entry for the whole drag"]];function Qv(n){const e=xe("div",{class:"carve-help-body"}),t=xe("div",{class:"carve-help-panel",attrs:{role:"dialog","aria-label":"Keyboard shortcuts"}},[xe("header",{class:"carve-panel-header"},[xe("span",{text:"Shortcuts"}),xe("button",{class:"carve-tool",text:"Close",attrs:{type:"button"},on:{click:()=>n()}})]),e]),i=xe("div",{class:"carve-help"},[t]);i.hidden=!0,i.addEventListener("pointerdown",a=>{a.target===i&&n()});const r=typeof navigator<"u"&&/mac/i.test(navigator.platform??"")?"mac":"other";function s(){ks(e);for(const[a,o]of Zv()){const c=o.map(l=>xe("div",{class:"carve-help-row"},[xe("kbd",{text:Kv(l,r)}),xe("span",{text:l.description})]));e.appendChild(xe("section",{class:"carve-help-group"},[xe("h4",{text:a}),...c]))}e.appendChild(xe("section",{class:"carve-help-group"},[xe("h4",{text:"Pointer"}),...Jv.map(([a,o])=>xe("div",{class:"carve-help-row"},[xe("kbd",{text:a}),xe("span",{text:o})]))]))}return s(),{element:i,setVisible(a){i.hidden=!a}}}function jv(n){const e=Yi(n.primitive),t=Hd(n.primitive,n.params),i=a=>t.find(o=>o.key===a)?.message??null,r=e.parameters.map(a=>eM(a,n.params[a.key]??a.default,i(a.key))),s=new Set(e.parameters.map(a=>a.key));return{nodeId:n.id,primitiveLabel:e.label,description:e.description,dimensions:r.filter(a=>!a.schema.tessellation),tessellation:r.filter(a=>a.schema.tessellation===!0),otherIssues:t.filter(a=>!s.has(a.key)).map(a=>a.message)}}function eM(n,e,t){const i=Mn[n.unit];return{schema:n,value:e,display:rr(n,e),displayMin:rr(n,n.min),displayMax:rr(n,n.max),displayStep:rr(n,n.step),decimals:i.decimals,suffix:i.suffix,formatted:Xd(n,e),issue:t}}function tM(n,e){const t=e.trim();if(t.length===0)return{ok:!1,message:"Enter a number."};const i=t.replace(Mn[n.unit].suffix,"").trim(),r=Number(i);return Number.isFinite(r)?{ok:!0,value:Wa(n,r)}:{ok:!1,message:"Not a number."}}function zl(n,e,t){const i=Va(n.primitive,{...n.params,[e]:t});return du(n.id,i)}function nM(n,e,t){const i=Math.min(e.max,Math.max(e.min,t));return du(n.id,{[e.key]:i})}const Ua=["x","y","z"];function iM(n,e){const t=Mn.length,i=Mn.angle,r=Sd(e.rotation);return{nodeId:n,translation:Ua.map(s=>({axis:s,display:e.translation[s]*t.perCanonical,suffix:t.suffix,decimals:t.decimals,step:1})),rotationDegrees:Ua.map(s=>({axis:s,display:r[s]*i.perCanonical,suffix:i.suffix,decimals:i.decimals,step:1})),scale:Ua.map(s=>({axis:s,display:e.scale[s],suffix:"×",decimals:3,step:.01}))}}function Sd(n){const{x:e,y:t,z:i,w:r}=n,s=2*(r*t-i*e);return Math.abs(s)>=.999999?{x:0,y:Math.sign(s)*Math.PI/2,z:2*Math.atan2(i,r)*Math.sign(s)}:{x:Math.atan2(2*(r*e+t*i),1-2*(e*e+t*t)),y:Math.asin(s),z:Math.atan2(2*(r*i+e*t),1-2*(t*t+i*i))}}function rM(n){const[e,t]=[Math.cos(n.x/2),Math.sin(n.x/2)],[i,r]=[Math.cos(n.y/2),Math.sin(n.y/2)],[s,a]=[Math.cos(n.z/2),Math.sin(n.z/2)];return{x:t*i*s-e*r*a,y:e*r*s+t*i*a,z:e*i*a-t*r*s,w:e*i*s+t*r*a}}function sM(n,e){const t=n.get(e);if(!t)return null;if(t.kind==="primitive")return t;if(t.kind!=="transform")return null;const i=n.childrenOf(e);if(i.length!==1)return null;const r=i[0]===void 0?void 0:n.get(i[0]);return r?.kind==="primitive"?r:null}const Fa=4;function aM(n){const{document:e}=n,t=xe("div",{class:"carve-inspector-body"}),i=xe("section",{class:"carve-panel carve-inspector"},[xe("header",{class:"carve-panel-header",text:"Inspector"}),t]);function r(){ks(t);const p=e.selection,u=p[p.length-1];if(u===void 0){t.appendChild(xe("p",{class:"carve-empty",text:"Select a solid to edit it."}));return}p.length>1&&t.appendChild(xe("p",{class:"carve-note",text:`${p.length} selected — editing the last one.`}));const m=e.get(u);if(!m)return;t.appendChild(xe("h3",{class:"carve-section-title",text:m.name})),m.kind==="boolean"&&t.appendChild(xe("p",{class:"carve-note",text:`A ${m.op} of ${e.childrenOf(u).length} operands. Reorder them in the tree; the first is the base.`}));const g=m.kind==="transform"?u:null;g!==null&&m.kind==="transform"&&t.appendChild(o(g,m.transform));const v=sM(e,u);v&&t.appendChild(s(v))}function s(p){const u=jv(p),m=xe("div",{class:"carve-section"},[xe("h4",{class:"carve-section-title",text:u.primitiveLabel,title:u.description})]);for(const g of u.dimensions)m.appendChild(a(p,g));if(u.tessellation.length>0){m.appendChild(xe("h4",{class:"carve-section-title carve-subtle",text:"Tessellation"}));for(const g of u.tessellation)m.appendChild(a(p,g))}for(const g of u.otherIssues)m.appendChild(xe("p",{class:"carve-issue",text:g}));return m}function a(p,u){const m=l(u.display,u.decimals,u.suffix),g=xe("label",{class:"carve-field",title:u.schema.description},[xe("span",{class:"carve-field-label",text:u.schema.label}),m]);return u.issue&&(g.classList.add("is-invalid"),g.appendChild(xe("span",{class:"carve-issue",text:u.issue}))),h(m,{step:u.displayStep,onDrag:(v,f)=>f.dispatch(nM(p,u.schema,Wa(u.schema,v))),onCommit:v=>n.onCommand(zl(p,u.schema.key,Wa(u.schema,v))),label:u.schema.label}),m.addEventListener("change",()=>{const v=tM(u.schema,m.value);if(!v.ok){m.value=ss(u.display,u.decimals);return}n.onCommand(zl(p,u.schema.key,v.value))}),g}function o(p,u){const m=iM(p,u),g=xe("div",{class:"carve-section"},[xe("h4",{class:"carve-section-title",text:"Placement"})]),v=[{title:"Position",fields:m.translation,part:"translation"},{title:"Rotation",fields:m.rotationDegrees,part:"rotation"},{title:"Scale",fields:m.scale,part:"scale"}];for(const f of v){const d=xe("div",{class:"carve-vector"},[xe("span",{class:"carve-field-label",text:f.title})]);for(const E of f.fields){const A=l(E.display,E.decimals,E.suffix);A.setAttribute("aria-label",`${f.title} ${E.axis.toUpperCase()}`);const S=(w,b)=>{b(uu(p,cM(c(p,u),f.part,E.axis,w)))};h(A,{step:E.step,label:`${f.title} ${E.axis}`,onDrag:(w,b)=>S(w,R=>b.dispatch(R)),onCommit:w=>S(w,n.onCommand)}),A.addEventListener("change",()=>{const w=Number(A.value.replace(E.suffix,"").trim());if(!Number.isFinite(w)){A.value=ss(E.display,E.decimals);return}S(w,n.onCommand)}),d.appendChild(xe("span",{class:`carve-axis carve-axis-${E.axis}`},[xe("span",{class:"carve-axis-label",text:E.axis.toUpperCase()}),A]))}g.appendChild(d)}return g}function c(p,u){const m=e.get(p);return m?.kind==="transform"?m.transform:u}function l(p,u,m){const g=xe("input",{class:"carve-number",attrs:{type:"text",inputmode:"decimal",spellcheck:"false"},...m.length>0?{title:`In ${m}`}:{}});return g.value=ss(p,u),g}function h(p,u){let m=null,g=null;p.addEventListener("pointerdown",f=>{if(f.button!==0)return;const d=Number(p.value.replace(/[^\d.eE+-]/g,""));Number.isFinite(d)&&(m={x:f.clientX,value:d,pointerId:f.pointerId})}),p.addEventListener("pointermove",f=>{if(!m)return;const d=f.clientX-m.x;if(!g){if(Math.abs(d)<Fa)return;if(g=n.beginGesture(u.label),!g){m=null;return}p.setPointerCapture(m.pointerId)}const E=m.value+Math.round(d/Fa)*u.step;p.value=ss(E,oM(u.step)),u.onDrag(E,g)});const v=f=>{const d=m;if(m=null,!d||!g)return;const E=g;g=null,p.releasePointerCapture(d.pointerId),E.commit();const A=f.clientX-d.x;u.onCommit(d.value+Math.round(A/Fa)*u.step)};p.addEventListener("pointerup",v),p.addEventListener("pointercancel",()=>{m=null,g?.cancel(),g=null})}return r(),{element:i,render:r}}function ss(n,e){return n.toFixed(e)}function oM(n){return!Number.isFinite(n)||n<=0?2:Math.min(4,Math.max(0,Math.ceil(-Math.log10(n))))}function cM(n,e,t,i){if(e==="translation"){const s=i/Mn.length.perCanonical;return{...n,translation:{...n.translation,[t]:s}}}if(e==="scale")return{...n,scale:{...n.scale,[t]:i}};const r=Sd(n.rotation);return{...n,rotation:rM({...r,[t]:i/Mn.angle.perCanonical})}}function lM(n,e){const t=[];for(const s of[...n.childrenOf(n.rootId)])t.push(lu(s));for(const s of e.childrenOf(e.rootId))t.push(cu(e.bundle(s),n.rootId));const i=e.get(e.rootId)?.name,r=n.get(n.rootId)?.name;return i!==void 0&&i!==r&&t.push(hu(n.rootId,i)),t.length===0?null:fu(t,"Open")}function Gl(n,e){const t=lM(n,e);t&&n.dispatch(t),n.clearHistory(),n.clearSelection()}function uM(n,e){const t=[],i=(r,s,a)=>{const o=n.get(r);if(!o)return;const c=o.kind==="boolean";gn(o).forEach((l,h)=>{const p=n.get(l);if(!p)return;const u=e.isHidden(l),m=a||u,g=gn(p),v=e.isCollapsed(l);t.push({nodeId:l,depth:s,kind:p.kind,name:p.name,badge:dM(p),hasChildren:g.length>0,collapsed:v,selected:n.isSelected(l),hidden:m,hiddenSelf:u,operandRole:c?h===0?"base":"tool":null,index:h,parentId:r}),g.length>0&&!v&&i(l,s+1,m)})};return i(n.rootId,0,!1),t}function dM(n){switch(n.kind){case"primitive":return Yi(n.primitive).label;case"boolean":return n.op;case"transform":return"transform";case"group":return"group"}}function as(n,e,t,i){if(!n.has(e))return{ok:!1,reason:"unknown-node"};if(e===n.rootId)return{ok:!1,reason:"no-parent"};if(i==="root")return Oa(n,e,n.rootId,n.childrenOf(n.rootId).length);if(!n.has(t))return{ok:!1,reason:"unknown-node"};if(t===e)return{ok:!1,reason:"same-node"};if(n.ancestorsOf(t).includes(e))return{ok:!1,reason:"into-own-subtree"};if(i==="inside"){const a=n.get(t);return!a||!fr(a)?{ok:!1,reason:"not-a-container"}:Oa(n,e,t,gn(a).length)}const r=n.parentOf(t);if(r===null)return{ok:!1,reason:"no-parent"};const s=n.indexOf(t);return Oa(n,e,r,i==="before"?s:s+1)}function Oa(n,e,t,i){const r=n.parentOf(e);if(r===null)return{ok:!1,reason:"no-parent"};const s=r===t,a=s?hM(i,n.indexOf(e)):Math.max(0,i);if(s&&a===n.indexOf(e))return{ok:!1,reason:"no-change"};const c=n.get(t)?.kind==="boolean"&&a===0?"Make base operand":"Reparent in the tree";return{ok:!0,parentId:t,index:a,label:c}}function hM(n,e){return Math.max(0,n>e?n-1:n)}function kl(n,e){return n.ok?Qd(e,n.parentId,n.index):null}function Ba(n){return n.childrenOf(n.rootId)}const Vl=.3;function fM(n){const{document:e,view:t}=n,i=xe("div",{class:"carve-outliner-list",attrs:{role:"tree"}}),r=xe("section",{class:"carve-panel carve-outliner"},[xe("header",{class:"carve-panel-header",text:"Tree"}),i]);let s=null,a=null;function o(){const g=i.scrollTop;ks(i);const v=uM(e,t);if(v.length===0){i.appendChild(xe("p",{class:"carve-empty",text:"Nothing here yet. Spawn a primitive from the palette above."}));return}for(const f of v)i.appendChild(c(f));i.appendChild(p()),i.scrollTop=g}function c(g){const v=xe("div",{class:"carve-row",attrs:{role:"treeitem",draggable:"true","aria-selected":g.selected},dataset:{nodeId:g.nodeId}});return Ls(v,"is-selected",g.selected),Ls(v,"is-hidden",g.hidden),v.style.setProperty("--depth",String(g.depth)),v.appendChild(g.hasChildren?yt(g.collapsed?"▸":"▾",()=>t.toggleCollapsed(g.nodeId),{class:"carve-twisty",title:g.collapsed?"Expand":"Collapse"}):xe("span",{class:"carve-twisty carve-twisty-empty"})),g.operandRole&&v.appendChild(xe("span",{class:`carve-operand carve-operand-${g.operandRole}`,text:g.operandRole==="base"?"base":"tool",title:g.operandRole==="base"?"The solid the other operands act on. Drag a row to the top of the boolean to make it the base.":"Applied to the base, in order."})),a===g.nodeId?v.appendChild(l(g)):v.appendChild(xe("span",{class:"carve-row-name",text:g.name,title:g.name,on:{dblclick:()=>{a=g.nodeId,o()}}})),v.appendChild(xe("span",{class:"carve-row-badge",text:g.badge})),v.appendChild(yt(g.hiddenSelf?"◌":"●",()=>t.toggleHidden(g.nodeId),{class:"carve-eye",title:g.hiddenSelf?"Show":"Hide"})),v.addEventListener("pointerdown",f=>{f.button===0&&a!==g.nodeId&&n.onSelect(g.nodeId,f.shiftKey||f.ctrlKey||f.metaKey)}),h(v,g),v}function l(g){const v=xe("input",{class:"carve-rename",attrs:{type:"text",value:g.name,"aria-label":"Node name"}}),f=()=>{a=null;const d=v.value.trim();d.length>0&&d!==g.name?n.onCommand(hu(g.nodeId,d)):o()};return v.addEventListener("blur",f),v.addEventListener("keydown",d=>{d.key==="Enter"&&f(),d.key==="Escape"&&(a=null,o())}),queueMicrotask(()=>{v.focus(),v.select()}),v}function h(g,v){g.addEventListener("dragstart",f=>{s=v.nodeId,g.classList.add("is-dragging"),f.dataTransfer?.setData("text/plain",v.nodeId)}),g.addEventListener("dragend",()=>{s=null,o()}),g.addEventListener("dragover",f=>{if(s===null)return;const d=u(g,f),E=as(e,s,v.nodeId,d);if(m(g),!E.ok){g.classList.add("is-drop-refused");return}f.preventDefault(),g.classList.add(`is-drop-${d}`)}),g.addEventListener("dragleave",()=>m(g)),g.addEventListener("drop",f=>{if(f.preventDefault(),m(g),s===null)return;const d=as(e,s,v.nodeId,u(g,f)),E=kl(d,s);s=null,E&&n.onCommand(E)})}function p(){const g=xe("div",{class:"carve-drop-root",text:"Drop here for top level"});return g.addEventListener("dragover",v=>{s!==null&&as(e,s,e.rootId,"root").ok&&(v.preventDefault(),g.classList.add("is-drop-inside"))}),g.addEventListener("dragleave",()=>g.classList.remove("is-drop-inside")),g.addEventListener("drop",v=>{if(v.preventDefault(),g.classList.remove("is-drop-inside"),s===null)return;const f=kl(as(e,s,e.rootId,"root"),s);s=null,f&&n.onCommand(f)}),g}function u(g,v){const f=g.getBoundingClientRect(),d=f.height===0?.5:(v.clientY-f.top)/f.height;return d<Vl?"before":d>1-Vl?"after":"inside"}function m(g){g.classList.remove("is-drop-before","is-drop-after","is-drop-inside","is-drop-refused")}return i.addEventListener("pointerdown",g=>{g.target===i&&n.onSelect(null,!1)}),o(),{element:r,render:o}}function pM(n,e){return`bounds:${Ha(n,e)}`}class mM{#e;#t=new Map;#n=new Set;#i=new Set;constructor(e){this.#e=e}get size(){return this.#t.size}onChange(e){return this.#i.add(e),()=>this.#i.delete(e)}lookup=(e,t)=>{const i=Ha(e,t),r=this.#t.get(i);if(r)return r;this.#n.has(i)||this.#r(e,t,i)};put(e,t,i){this.#t.set(Ha(e,t),i)}async#r(e,t,i){this.#n.add(i);try{const r=await this.#e({kind:e,params:t,fit:0},{channel:pM(e,t)});if(!r)return;this.#t.set(i,{min:r.bounds.min,max:r.bounds.max});for(const s of this.#i)s()}catch{}finally{this.#n.delete(i)}}}function br(n,e,t){const i=n.get(e);if(!i)return null;if(i.kind==="primitive")return t(i.primitive,i.params)??null;let r=null;for(const s of gn(i)){const a=n.get(s);if(!a)continue;const o=br(n,s,t);o&&(r=Ed(r,Tu(gM(a),o)))}return r}function gM(n){return n.kind==="transform"?Pn(n.transform):ko}function Ed(n,e){return n?e?{min:[Math.min(n.min[0],e.min[0]),Math.min(n.min[1],e.min[1]),Math.min(n.min[2],e.min[2])],max:[Math.max(n.max[0],e.max[0]),Math.max(n.max[1],e.max[1]),Math.max(n.max[2],e.max[2])]}:n:e}function _M(n,e,t={}){const i=t.hidden??new Set,r=[],s=a=>{for(const o of n.childrenOf(a)){if(i.has(o))continue;const c=br(n,o,e);c&&r.push({nodeId:o,worldMatrix:n.worldMatrix(o),bounds:c}),s(o)}};return s(n.rootId),r}function xM(n,e,t={}){const i=t.hidden??new Set,r=new bh;for(const s of n.childrenOf(n.rootId)){if(i.has(s))continue;const a=br(n,s,e);a&&r.setFromBounds(s,a,n.worldMatrix(s))}return r}function yd(n,e,t){let i=null;for(const r of e){const s=br(n,r,t);s&&(i=Ed(i,Tu(n.worldMatrix(r),s)))}return i}function Hl(n,e){return yd(n,n.childrenOf(n.rootId),e)}function vM(n,e){if(e.size===0)return n;const t=new Map(n.nodes.map(s=>[s.id,s]));if(e.has(n.rootId))return{rootId:n.rootId,nodes:[]};const i=[],r=s=>{const a=t.get(s);if(!a)return;const o=gn(a).filter(c=>!e.has(c));i.push(fr(a)&&o.length!==a.children.length?Ui(a,o):a);for(const c of o)r(c)};return r(n.rootId),{rootId:n.rootId,nodes:i}}const Wl=250;function MM(n){const{document:e,view:t}=n,i=xe("span",{class:"carve-status-message"}),r=xe("span",{class:"carve-status-warnings"}),s=xe("span",{class:"carve-status-selection"}),a=xe("span",{class:"carve-status-stats"}),o=xe("footer",{class:"carve-status",attrs:{role:"status"}},[i,r,xe("span",{class:"carve-status-spacer"}),s,a]);let c=[],l=0,h=0;function p(d,E="info"){i.textContent=d,i.classList.toggle("is-warn",E==="warn")}function u(d){c=d,m()}function m(){if(ks(r),c.length===0)return;const d=c[0];if(!d)return;const E=e.get(d.nodeId)?.name??"a node";r.appendChild(xe("span",{class:"carve-warning",text:c.length===1?`${E}: ${d.message}`:`${E}: ${d.message} (+${c.length-1} more)`,title:c.map(A=>`${A.code}: ${A.message}`).join(`
`)}))}function g(){const d=e.selection;s.textContent=d.length===0?`${e.size-1} nodes`:d.length===1?e.get(d[0]??"")?.name??"":`${d.length} selected`,m(),v(!0)}function v(d=!1){if(!t.showStats){a.textContent="";return}const E=performance.now();if(!d&&E-l<Wl)return;l=E;const A=n.stats();h=h===0?A.frameTimeMs:h*.8+A.frameTimeMs*.2;const S=h>0?Math.round(1e3/h):0;a.textContent=`${S} fps · ${h.toFixed(1)} ms · ${A.triangleCount.toLocaleString()} tris · queue ${A.evaluationQueueDepth}`}const f=setInterval(()=>v(),Wl);return g(),{element:o,setMessage:p,setWarnings:u,render:g,dispose:()=>clearInterval(f)}}const SM=["translate","rotate","scale"];class EM{#e="translate";#t="world";#n=!0;#i=!0;#r=!1;#s=!1;#a=new Set;#o=new Set;#u=new Set;subscribe(e){return this.#u.add(e),()=>this.#u.delete(e)}snapshot(){return{gizmoMode:this.#e,space:this.#t,snapping:this.#n,showGrid:this.#i,showStats:this.#r,showHelp:this.#s,hidden:this.#a,collapsed:this.#o}}get gizmoMode(){return this.#e}setGizmoMode(e){this.#e!==e&&(this.#e=e,this.#c())}get space(){return this.#t}setSpace(e){this.#t!==e&&(this.#t=e,this.#c())}toggleSpace(){this.setSpace(this.#t==="world"?"local":"world")}get snapping(){return this.#n}setSnapping(e){this.#n!==e&&(this.#n=e,this.#c())}get showGrid(){return this.#i}setShowGrid(e){this.#i!==e&&(this.#i=e,this.#c())}get showStats(){return this.#r}setShowStats(e){this.#r!==e&&(this.#r=e,this.#c())}get showHelp(){return this.#s}setShowHelp(e){this.#s!==e&&(this.#s=e,this.#c())}get hidden(){return this.#a}isHidden(e){return this.#a.has(e)}setHidden(e,t){const i=t?!this.#a.has(e):this.#a.delete(e);t&&this.#a.add(e),i&&this.#c()}toggleHidden(e){this.setHidden(e,!this.#a.has(e))}isCollapsed(e){return this.#o.has(e)}setCollapsed(e,t){const i=t?!this.#o.has(e):this.#o.delete(e);t&&this.#o.add(e),i&&this.#c()}toggleCollapsed(e){this.setCollapsed(e,!this.#o.has(e))}prune(e){let t=!1;for(const i of[this.#a,this.#o])for(const r of[...i])e(r)||(i.delete(r),t=!0);t&&this.#c()}#c(){for(const e of this.#u)e()}}const yM=Object.freeze({union:"Union",subtract:"Subtract",intersect:"Intersect"}),bM=Object.freeze({union:"Fuse the selected solids into one.",subtract:"Cut every later selected solid out of the first one.",intersect:"Keep only what all the selected solids share."}),Xl=Object.freeze({translate:"Move",rotate:"Rotate",scale:"Scale"}),Yl=Object.freeze({front:"Front",top:"Top",right:"Right",home:"Home"});function TM(n){const{document:e,view:t,actions:i}=n,r=new Map,s=new Map,a=[];let o=null,c=null,l=null;function h(R,x){return xe("div",{class:"carve-toolgroup",attrs:{"aria-label":R}},[xe("span",{class:"carve-toolgroup-label",text:R}),xe("div",{class:"carve-toolgroup-body"},x)])}function p(R,x,y,I){const C=yt(R,I,{class:"carve-tool carve-toggle",title:x});return C.setAttribute("aria-pressed",String(y())),a.push({node:C,on:y}),C}const u=Vd().map(R=>{const x=yt(R.label,()=>i.spawn(R.kind),{class:"carve-tool carve-primitive",title:R.description});return x.insertBefore(Wv(R.icon),x.firstChild),x}),m=ka.map(R=>{const x=yt(yM[R],()=>i.applyBoolean(R),{class:"carve-tool",title:bM[R]});return r.set(R,x),x}),g=SM.map(R=>{const x=yt(Xl[R],()=>t.setGizmoMode(R),{class:"carve-tool carve-toggle",title:`${Xl[R]} gizmo`});return s.set(R,x),x}),v=p("Local","World or local axes. Scale is always world-aligned — see the docs.",()=>t.space==="local",()=>t.toggleSpace()),f=p("Snap","Snap to the 1mm grid and to nearby corners, edges and faces.",()=>t.snapping,()=>t.setSnapping(!t.snapping)),d=p("Grid","Ground grid",()=>t.showGrid,()=>t.setShowGrid(!t.showGrid)),E=p("Stats","Frame time, triangles and evaluation queue depth",()=>t.showStats,()=>t.setShowStats(!t.showStats));o=yt("Undo",i.undo,{class:"carve-tool",title:"Undo"}),c=yt("Redo",i.redo,{class:"carve-tool",title:"Redo"}),l=yt("Delete",i.deleteSelection,{class:"carve-tool",title:"Delete the selection"});const A=[...uv.map(R=>yt(Yl[R],()=>i.setView(R),{class:"carve-tool",title:`${Yl[R]} view`})),yt("Frame",i.frameSelection,{class:"carve-tool",title:"Frame the selection, or the whole document when nothing is selected"})],S=[yt("New",i.newDocument,{class:"carve-tool",title:"Start an empty document"}),yt("Open",i.open,{class:"carve-tool",title:"Open a .carve file"}),yt("Save",i.save,{class:"carve-tool",title:"Download a .carve file"}),yt("STL",()=>i.exportAs("stl"),{class:"carve-tool",title:"Export the selection, or the whole document, as binary STL in millimetres"}),yt("GLB",()=>i.exportAs("glb"),{class:"carve-tool",title:"Export as glTF binary"}),yt("?",i.toggleHelp,{class:"carve-tool",title:"Keyboard shortcuts"})],w=xe("header",{class:"carve-toolbar"},[xe("span",{class:"carve-brand",text:"Carve"}),h("Primitives",u),h("Booleans",m),h("Transform",[...g,v,f]),h("Edit",[o,c,l]),h("View",[...A,d,E]),h("File",S)]);function b(){const R=e.selection;o&&(o.disabled=!e.canUndo),c&&(c.disabled=!e.canRedo),l&&(l.disabled=R.length===0);for(const x of r.values())x.disabled=R.length<2;for(const[x,y]of s){const I=t.gizmoMode===x;y.setAttribute("aria-pressed",String(I)),Ls(y,"is-active",I)}for(const x of a){const y=x.on();x.node.setAttribute("aria-pressed",String(y)),Ls(x.node,"is-active",y)}}return b(),{element:w,render:b}}function AM(n,e,t,i,r){if(!n.has(e))return null;const s=n.worldMatrix(e),a=hi(s,st(0,0,0));if(!(i==="local"&&t!=="scale"))return{matrix:Pn({translation:a,rotation:Ga(0,0,0,1),scale:st(1,1,1)}),origin:a,size:r};const c=[0,1,2].map(u=>On(st(s[u*4]??0,s[u*4+1]??0,s[u*4+2]??0)));if(c.some(u=>_n(u)<.5))return{matrix:Pn({translation:a,rotation:Ga(0,0,0,1),scale:st(1,1,1)}),origin:a,size:r};const[l,h,p]=c;return{matrix:[l.x,l.y,l.z,0,h.x,h.y,h.z,0,p.x,p.y,p.z,0,a.x,a.y,a.z,1],origin:a,size:r}}function wM(n,e,t,i=.14){return Math.max(gs(n,e),1e-4)*Math.tan(t/2*Math.PI/180)*2*i}function $l(n,e,t){const i=Us(e.matrix);if(!i)return null;const r=Eu(i,n),s=_h(an(r.origin,1/e.size),r.direction);for(const a of Sv(t)){if(a.kind==="ring"){if(a.axis&&RM(s,a.axis,a.radius??1))return a;continue}if(bu(s,a.box)!==null)return a}return null}function RM(n,e,t){const i=bd(e),r=xs(n,st(0,0,0),i);if(r===null)return!1;const s=_s(n,r);return Math.abs(_n(s)-t)<=ms}function bd(n){return st(+(n==="x"),+(n==="y"),+(n==="z"))}function CM(n,e,t){const i=n.axis?PM(e,n.axis):st(0,1,0),r=Td(n,e,i,t);if(!r)return null;const s=Gt(r,e.origin),a=_n(s);return{handle:n,frame:e,axis:i,anchor:r,anchorRadius:a,reference:a>1e-9?an(s,1/a):DM(i)}}function ql(n,e){const t=Td(n.handle,n.frame,n.axis,e);if(!t)return null;switch(n.handle.mode){case"translate":return sr({translation:Gt(t,n.anchor)});case"rotate":{const i=Gt(t,n.frame.origin),r=_n(i);if(r<1e-9)return null;const s=an(i,1/r),a=Math.atan2(zt(Fi(n.reference,s),n.axis),zt(n.reference,s));return sr({rotation:LM(n.axis,a)})}case"scale":{const i=_n(Gt(t,n.frame.origin));if(n.anchorRadius<1e-9)return null;const r=Math.max(i/n.anchorRadius,.001);if(n.handle.kind==="uniform")return sr({scale:st(r,r,r)});const s=[1,1,1];return n.handle.axis&&(s[En(n.handle.axis)]=r),sr({scale:st(s[0],s[1],s[2])})}}}function Td(n,e,t,i){switch(n.kind){case"axis":return IM(i,e.origin,t);case"plane":case"ring":{const r=xs(i,e.origin,t);return r===null?null:_s(i,r)}case"uniform":{const r=On(Gt(i.origin,e.origin)),s=xs(i,e.origin,r);return s===null?null:_s(i,s)}}}function PM(n,e){return On(Su(n.matrix,bd(e)))}function IM(n,e,t){const i=Gt(e,n.origin),r=zt(t,n.direction),s=1-r*r;if(Math.abs(s)<3e-4)return null;const a=(r*zt(n.direction,i)-zt(t,i))/s;return Mu(e,an(t,a))}function LM(n,e){const t=e/2,i=Math.sin(t);return oi(Ga(n.x*i,n.y*i,n.z*i,Math.cos(t)))}function DM(n){const e=Math.abs(n.x)<.9?st(1,0,0):st(0,1,0);return On(Fi(n,e))}const NM=0,UM=1,Kl=2,Zl=.008,Jl=1.1;function FM(n,e){const{document:t,router:i,view:r}=e,s=document.createElement("canvas");s.className="carve-canvas",s.style.touchAction="none",n.appendChild(s);const a=Vv(s,{antialias:!0}),o=new vh;let c=null,l=null,h=null,p=null,u=null,m=!0;function g(){const P=s.getBoundingClientRect();return{width:P.width,height:P.height}}function v(P){const Z=s.getBoundingClientRect();return yu(a.camera.pose,P.clientX-Z.left,P.clientY-Z.top,Z.width,Z.height)}const f=Rh({emit:P=>{i.handle(P)},camera:()=>a.camera.pose,pick:(P,{drillIn:Z})=>o.pick(P,{drillIn:Z,tree:t}),viewport:g,mode:()=>r.gizmoMode});function d(){const P=t.selection,Z=P[P.length-1];if(Z===void 0)return null;const ne=AM(t,Z,r.gizmoMode,r.space,1);if(!ne)return null;const ie=wM(a.camera.pose.position,ne.origin,a.camera.pose.fovDegrees);return{...ne,size:ie}}function E(){const P=t.selection;return P[P.length-1]??null}function A(P){const Z=t.get(P),ne=t.parentOf(P);if(!Z||Z.kind!=="transform"||ne===null)return;const ie=Us(Pn(Z.transform));ie&&(p={parentWorld:t.worldMatrix(ne),startInverse:ie,mesh:null},e.requestGhost(P).then(ue=>{p&&(p.mesh=ue)}))}function S(){const P=i.transforming?.nodeId;if(!p?.mesh||P===void 0)return null;const Z=t.get(P);if(!Z||Z.kind!=="transform")return null;const ne=Kn(p.parentWorld,Kn(Pn(Z.transform),p.startInverse));return{mesh:p.mesh,matrix:ne}}const w=i.subscribe(P=>{P.status==="applied"&&(P.intent.kind==="transform-begin"&&P.nodeId!==void 0&&A(P.nodeId),P.intent.kind==="transform-update"&&(u=b(P.snappedTo)),(P.intent.kind==="transform-commit"||P.intent.kind==="transform-cancel")&&(p=null,u=null))});function b(P){return P?st(P.point.x,P.point.y,P.point.z):null}function R(P){if(s.focus(),P.button===UM||P.button===Kl){P.preventDefault(),c={kind:P.button===Kl?"orbit":"pan",x:P.clientX,y:P.clientY,pointerId:P.pointerId},s.setPointerCapture(P.pointerId);return}if(P.button!==NM)return;const Z=d(),ne=E();if(Z&&ne!==null){const ie=$l(v(P),Z,r.gizmoMode);if(ie){const ue=CM(ie,Z,v(P));if(ue){l=ue,h=ie,s.setPointerCapture(P.pointerId),i.handle(xu(ne,r.gizmoMode,Z.origin));return}}}f.pointerDown(P)}function x(P){if(c){const ne=P.clientX-c.x,ie=P.clientY-c.y;if(c.x=P.clientX,c.y=P.clientY,c.kind==="orbit")a.camera.orbit(ne*Zl,ie*Zl);else{const{height:ue}=g(),Fe=a.camera.pose,qe=a.camera.target,Ge=Math.hypot(Fe.position.x-qe[0],Fe.position.y-qe[1],Fe.position.z-qe[2]),Q=ue===0?0:2*Ge*Math.tan(Fe.fovDegrees/2*Math.PI/180)/ue;a.camera.pan(ne*Q,ie*Q)}return}if(l){const ne=ql(l,v(P));ne&&i.handle(Ya(ne));return}const Z=d();h=Z?$l(v(P),Z,r.gizmoMode):null,!h&&f.pointerMove(P)}function y(P){if(c?.pointerId===P.pointerId){s.releasePointerCapture(P.pointerId),c=null;return}if(l){const Z=ql(l,v(P));Z&&i.handle(Ya(Z)),l=null,s.releasePointerCapture(P.pointerId),i.handle(vu());return}f.pointerUp(P)}function I(){if(c=null,l){l=null,i.abort("interrupted");return}f.pointerCancel("interrupted")}function C(P){P.preventDefault(),a.camera.dolly(P.deltaY>0?Jl:1/Jl)}s.addEventListener("pointerdown",R),s.addEventListener("pointermove",x),s.addEventListener("pointerup",y),s.addEventListener("pointercancel",I),s.addEventListener("wheel",C,{passive:!1}),s.addEventListener("contextmenu",P=>P.preventDefault());function F(){o.clear();for(const ie of e.targets())o.register(ie);const P=t.selection,Z=P[P.length-1],ne=[];for(const ie of P){const ue=e.boundsOf(ie);ue&&ne.push({bounds:ue,matrix:t.worldMatrix(ie),primary:ie===Z})}a.setSelection(ne)}const $=new ResizeObserver(()=>{const{width:P,height:Z}=g();P>0&&Z>0&&a.resize(P,Z)});$.observe(n);function q(){if(!m)return;a.setGridVisible(r.showGrid);const P=d();P?a.setGizmo({matrix:P.matrix,mode:r.gizmoMode,size:P.size,activeId:(l?.handle??h)?.id??null}):a.setGizmo(null),a.setGhost(S()),a.setSnapMarker(u?[u.x,u.y,u.z]:null,P?P.size*.14:.01),a.renderFrame(),requestAnimationFrame(q)}const{width:z,height:Y}=g();z>0&&Y>0&&a.resize(z,Y),requestAnimationFrame(q);const X=r.subscribe(()=>{i.setSnapSettings(r.snapping?$a:yc)});return i.setSnapSettings(r.snapping?$a:yc),{canvas:s,renderer:a,refresh:F,setView:P=>a.camera.setView(P),frame:P=>a.camera.frame(P),cancelDrag(){if(l){l=null,i.abort("user");return}f.pointerCancel("user")},dispose(){m=!1,$.disconnect(),w(),X(),s.removeEventListener("pointerdown",R),s.removeEventListener("pointermove",x),s.removeEventListener("pointerup",y),s.removeEventListener("pointercancel",I),s.removeEventListener("wheel",C),a.dispose(),s.remove()}}}const OM="ghost",BM=.001,os={min:[-.15,-.15,-.15],max:[.15,.15,.15]};function zM(n){const{host:e,kernel:t}=n;e.replaceChildren();const i=ki.create(),r=new EM,s=new Ah({document:i}),a=new mM((B,W)=>t.requestPreview(B,W));let o=null,c=0,l=!1;const h=xe("div",{class:"carve-viewport"}),p=Qv(()=>r.setShowHelp(!1)),u=fM({document:i,view:r,onSelect:(B,W)=>I(B,W),onCommand:B=>C(B)}),m=aM({document:i,onCommand:B=>C(B),beginGesture:B=>F(B)}),g=TM({document:i,view:r,actions:{spawn:B=>q(B),applyBoolean:B=>z(B),undo:()=>$("undo"),redo:()=>$("redo"),deleteSelection:()=>$("delete"),setView:B=>v.setView(B),frameSelection:()=>Y(),newDocument:()=>P(),open:()=>{ie()},save:()=>Z(),exportAs:B=>{ue(B)},toggleHelp:()=>r.setShowHelp(!r.showHelp)}});e.append(g.element,xe("div",{class:"carve-body"},[u.element,h,m.element]));const v=FM(h,{document:i,router:s,view:r,boundsOf:B=>br(i,B,a.lookup),targets:()=>_M(i,a.lookup,{hidden:r.hidden}),requestGhost:B=>y(B)}),f=MM({document:i,view:r,stats:()=>v.renderer.stats});e.append(f.element,p.element);const d=i.subscribe(B=>{r.prune(W=>i.has(W)),R(),x(),b(),B.gesturePhase!=="update"&&f.setMessage(GM(B.source,B.label))}),E=i.subscribeSelection(()=>b()),A=a.onChange(()=>{R(),v.refresh(),l&&(l=!1,Y())}),S=r.subscribe(()=>{x(),b()}),w=t.subscribe(B=>{v.renderer.upload(B.mesh),f.setWarnings(B.warnings)});function b(){u.render(),m.render(),g.render(),f.render(),v.refresh(),p.setVisible(r.showHelp)}function R(){s.setSnapField(xM(i,a.lookup,{hidden:r.hidden}))}async function x(){c+=1,v.renderer.setEvaluationQueueDepth(c);try{await t.request(vM(i.bundle(),r.hidden))}catch(B){f.setMessage(`The kernel failed: ${Ni(B)}`,"warn")}finally{c-=1,v.renderer.setEvaluationQueueDepth(c)}}async function y(B){try{return(await t.request(i.bundle(B),{channel:OM}))?.mesh??null}catch{return null}}function I(B,W){if(B===null){i.clearSelection();return}if(!W){i.setSelection([B]);return}i.setSelection(i.isSelected(B)?i.selection.filter(Se=>Se!==B):[...i.selection,B])}function C(B){try{i.dispatch(B)}catch(W){f.setMessage(Ni(W),"warn")}}function F(B){try{return i.beginGesture(B)}catch{return null}}function $(B){const W=s.handle($s({name:B}));W.status==="rejected"&&f.setMessage(za(W.reason),"warn")}function q(B){const W=Ba(i).length===0,Se=v.renderer.camera.target,Pe=wu(st(Se[0],Se[1],Se[2]),BM),we=s.handle($s({name:"spawn-primitive",primitive:B,transform:cs({translation:Pe})}));if(we.status==="rejected"){f.setMessage(za(we.reason),"warn");return}W&&(l=!0)}function z(B){const W=s.handle($s({name:"apply-boolean",op:B}));W.status==="rejected"&&f.setMessage(za(W.reason),"warn")}function Y(){const B=i.selection.length>0?i.selection:Ba(i),W=yd(i,B,a.lookup)??Hl(i,a.lookup);v.frame(Ql(W)??os)}function X(){return i.get(i.rootId)?.name??Ru}function P(){Gl(i,ki.create()),v.frame(os),b(),f.setMessage("New document.")}function Z(){Dc(cf(i,X())),f.setMessage("Saved.")}function ne(B,W){Gl(i,B),b(),Y(),f.setMessage(`Opened ${W}.`)}async function ie(){const B=xe("input",{attrs:{type:"file",accept:Rf,hidden:"hidden"}});e.appendChild(B);const W=await new Promise(Se=>{B.addEventListener("change",()=>Se(B.files?.item(0)??null)),window.addEventListener("focus",()=>setTimeout(()=>Se(null),400),{once:!0}),B.click()});if(B.remove(),!!W)try{ne(await Du(W),W.name)}catch(Se){f.setMessage(`Could not open that file: ${Ni(Se)}`,"warn")}}async function ue(B){f.setMessage(`Exporting ${B.toUpperCase()}…`);try{const W=await af(t,i,{format:B,roots:i.selection,name:X()});Dc(W),f.setMessage(W.warnings.length>0?`Exported ${W.fileName} with ${W.warnings.length} warning(s).`:`Exported ${W.fileName} — ${W.triangles.toLocaleString()} triangles.`,W.warnings.length>0?"warn":"info")}catch(W){f.setMessage(`Export failed: ${Ni(W)}`,"warn")}}const Fe=Cf(e,{onDocument:(B,W)=>ne(B,W.name),onError:B=>f.setMessage(`Could not open that file: ${Ni(B)}`,"warn"),onDragStateChange:B=>e.classList.toggle("is-drop-target",B)});function qe(B){const W=qv({key:B.key,ctrlKey:B.ctrlKey,metaKey:B.metaKey,shiftKey:B.shiftKey,altKey:B.altKey,target:B.target});W!==null&&(B.preventDefault(),Ge(W))}function Ge(B){switch(B){case"undo":case"redo":case"delete":$(B);return;case"select-all":i.setSelection(Ba(i));return;case"deselect":i.clearSelection();return;case"mode-translate":r.setGizmoMode("translate");return;case"mode-rotate":r.setGizmoMode("rotate");return;case"mode-scale":r.setGizmoMode("scale");return;case"toggle-space":r.toggleSpace();return;case"toggle-snapping":r.setSnapping(!r.snapping);return;case"toggle-grid":r.setShowGrid(!r.showGrid);return;case"toggle-stats":r.setShowStats(!r.showStats);return;case"toggle-help":r.setShowHelp(!r.showHelp);return;case"view-front":v.setView("front");return;case"view-top":v.setView("top");return;case"view-right":v.setView("right");return;case"view-home":v.setView("home");return;case"frame-selection":Y();return;case"frame-all":v.frame(Ql(Hl(i,a.lookup))??os);return;case"boolean-union":z("union");return;case"boolean-subtract":z("subtract");return;case"boolean-intersect":z("intersect");return;case"hide-selection":for(const W of i.selection)r.setHidden(W,!0);return;case"show-all":for(const W of[...r.hidden])r.setHidden(W,!1);return;case"save":Z();return;case"open":ie();return;case"cancel":r.showHelp?r.setShowHelp(!1):v.cancelDrag();return}}window.addEventListener("keydown",qe),R(),b(),v.frame(os),x();let Q=null;return n.persistence!==!1&&_f().then(async B=>{!B.persistent&&B.reason&&f.setMessage(B.reason,"warn");const W=await Af(B.store);W&&i.size<=1&&i.undoDepth===0&&ne(W.document,`"${W.record.name}" from autosave`),o=$o.attach(i,B.store,{onError:Se=>f.setMessage(`Autosave failed: ${Ni(Se)}`,"warn")}),Q=Pf(()=>{o?.flush()})}),{document:i,dispose(){window.removeEventListener("keydown",qe),Fe(),Q?.(),d(),E(),A(),S(),w(),o?.stop(),f.dispose(),v.dispose(),e.replaceChildren()}}}function Ql(n){return n===null?null:{min:n.min,max:n.max}}function Ni(n){return n instanceof Error?n.message:String(n)}function GM(n,e){return n==="undo"?`Undid ${e.toLowerCase()}.`:n==="redo"?`Redid ${e.toLowerCase()}.`:`${e}.`}function za(n){switch(n){case"needs-two-operands":return"Select at least two solids to boolean them.";case"nothing-selected":return"Nothing is selected.";case"nothing-to-undo":return"Nothing to undo.";case"nothing-to-redo":return"Nothing to redo.";case"cannot-delete-root":return"The document root cannot be deleted.";case"gesture-open":return"Finish the drag first.";case"no-transform-target":return"That node has no transform to move. Move its parent instead.";case"already-transforming":return"Something is already being dragged.";case"degenerate-transform":return"That node has a zero scale somewhere above it and cannot be moved.";case"unknown-node":return"That node is gone.";default:return`That did not work (${n??"unknown"}).`}}const kM="ui",VM="xr",HM=[dh,Bh,If,kv,Ch,kM,VM];document.documentElement.dataset.carveBoot=HM.join(",");const Ad=document.querySelector("#app");if(!Ad)throw new Error("index.html is missing its #app host element");zM({host:Ad,kernel:Df()});document.documentElement.dataset.carveReady="true";
//# sourceMappingURL=index-gJcpu9ZV.js.map
