(()=>{var m=globalThis,r=m.ShadowRoot&&(m.ShadyCSS===void 0||m.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ZQ=Symbol(),AQ=new WeakMap;class l{constructor(Q,X,$){if(this._$cssResult$=!0,$!==ZQ)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=Q,this.t=X}get styleSheet(){let Q=this.o,X=this.t;if(r&&Q===void 0){let $=X!==void 0&&X.length===1;$&&(Q=AQ.get(X)),Q===void 0&&((this.o=Q=new CSSStyleSheet).replaceSync(this.cssText),$&&AQ.set(X,Q))}return Q}toString(){return this.cssText}}var EQ=(Q)=>new l(typeof Q=="string"?Q:Q+"",void 0,ZQ),D=(Q,...X)=>{let $=Q.length===1?Q[0]:X.reduce((q,J,Z)=>q+((z)=>{if(z._$cssResult$===!0)return z.cssText;if(typeof z=="number")return z;throw Error("Value passed to 'css' function must be a 'css' function result: "+z+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(J)+Q[Z+1],Q[0]);return new l($,Q,ZQ)},fQ=(Q,X)=>{if(r)Q.adoptedStyleSheets=X.map(($)=>$ instanceof CSSStyleSheet?$:$.styleSheet);else for(let $ of X){let q=document.createElement("style"),J=m.litNonce;J!==void 0&&q.setAttribute("nonce",J),q.textContent=$.cssText,Q.appendChild(q)}},zQ=r?(Q)=>Q:(Q)=>Q instanceof CSSStyleSheet?((X)=>{let $="";for(let q of X.cssRules)$+=q.cssText;return EQ($)})(Q):Q;var{is:W4,defineProperty:G4,getOwnPropertyDescriptor:F4,getOwnPropertyNames:N4,getOwnPropertySymbols:Y4,getPrototypeOf:B4}=Object,o=globalThis,wQ=o.trustedTypes,K4=wQ?wQ.emptyScript:"",P4=o.reactiveElementPolyfillSupport,y=(Q,X)=>Q,VQ={toAttribute(Q,X){switch(X){case Boolean:Q=Q?K4:null;break;case Object:case Array:Q=Q==null?Q:JSON.stringify(Q)}return Q},fromAttribute(Q,X){let $=Q;switch(X){case Boolean:$=Q!==null;break;case Number:$=Q===null?null:Number(Q);break;case Object:case Array:try{$=JSON.parse(Q)}catch(q){$=null}}return $}},yQ=(Q,X)=>!W4(Q,X),bQ={attribute:!0,type:String,converter:VQ,reflect:!1,useDefault:!1,hasChanged:yQ};Symbol.metadata??=Symbol("metadata"),o.litPropertyMetadata??=new WeakMap;class C extends HTMLElement{static addInitializer(Q){this._$Ei(),(this.l??=[]).push(Q)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(Q,X=bQ){if(X.state&&(X.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(Q)&&((X=Object.create(X)).wrapped=!0),this.elementProperties.set(Q,X),!X.noAccessor){let $=Symbol(),q=this.getPropertyDescriptor(Q,$,X);q!==void 0&&G4(this.prototype,Q,q)}}static getPropertyDescriptor(Q,X,$){let{get:q,set:J}=F4(this.prototype,Q)??{get(){return this[X]},set(Z){this[X]=Z}};return{get:q,set(Z){let z=q?.call(this);J?.call(this,Z),this.requestUpdate(Q,z,$)},configurable:!0,enumerable:!0}}static getPropertyOptions(Q){return this.elementProperties.get(Q)??bQ}static _$Ei(){if(this.hasOwnProperty(y("elementProperties")))return;let Q=B4(this);Q.finalize(),Q.l!==void 0&&(this.l=[...Q.l]),this.elementProperties=new Map(Q.elementProperties)}static finalize(){if(this.hasOwnProperty(y("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y("properties"))){let X=this.properties,$=[...N4(X),...Y4(X)];for(let q of $)this.createProperty(q,X[q])}let Q=this[Symbol.metadata];if(Q!==null){let X=litPropertyMetadata.get(Q);if(X!==void 0)for(let[$,q]of X)this.elementProperties.set($,q)}this._$Eh=new Map;for(let[X,$]of this.elementProperties){let q=this._$Eu(X,$);q!==void 0&&this._$Eh.set(q,X)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(Q){let X=[];if(Array.isArray(Q)){let $=new Set(Q.flat(1/0).reverse());for(let q of $)X.unshift(zQ(q))}else Q!==void 0&&X.push(zQ(Q));return X}static _$Eu(Q,X){let $=X.attribute;return $===!1?void 0:typeof $=="string"?$:typeof Q=="string"?Q.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise((Q)=>this.enableUpdating=Q),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach((Q)=>Q(this))}addController(Q){(this._$EO??=new Set).add(Q),this.renderRoot!==void 0&&this.isConnected&&Q.hostConnected?.()}removeController(Q){this._$EO?.delete(Q)}_$E_(){let Q=new Map,X=this.constructor.elementProperties;for(let $ of X.keys())this.hasOwnProperty($)&&(Q.set($,this[$]),delete this[$]);Q.size>0&&(this._$Ep=Q)}createRenderRoot(){let Q=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return fQ(Q,this.constructor.elementStyles),Q}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach((Q)=>Q.hostConnected?.())}enableUpdating(Q){}disconnectedCallback(){this._$EO?.forEach((Q)=>Q.hostDisconnected?.())}attributeChangedCallback(Q,X,$){this._$AK(Q,$)}_$ET(Q,X){let $=this.constructor.elementProperties.get(Q),q=this.constructor._$Eu(Q,$);if(q!==void 0&&$.reflect===!0){let J=($.converter?.toAttribute!==void 0?$.converter:VQ).toAttribute(X,$.type);this._$Em=Q,J==null?this.removeAttribute(q):this.setAttribute(q,J),this._$Em=null}}_$AK(Q,X){let $=this.constructor,q=$._$Eh.get(Q);if(q!==void 0&&this._$Em!==q){let J=$.getPropertyOptions(q),Z=typeof J.converter=="function"?{fromAttribute:J.converter}:J.converter?.fromAttribute!==void 0?J.converter:VQ;this._$Em=q;let z=Z.fromAttribute(X,J.type);this[q]=z??this._$Ej?.get(q)??z,this._$Em=null}}requestUpdate(Q,X,$,q=!1,J){if(Q!==void 0){let Z=this.constructor;if(q===!1&&(J=this[Q]),$??=Z.getPropertyOptions(Q),!(($.hasChanged??yQ)(J,X)||$.useDefault&&$.reflect&&J===this._$Ej?.get(Q)&&!this.hasAttribute(Z._$Eu(Q,$))))return;this.C(Q,X,$)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(Q,X,{useDefault:$,reflect:q,wrapped:J},Z){$&&!(this._$Ej??=new Map).has(Q)&&(this._$Ej.set(Q,Z??X??this[Q]),J!==!0||Z!==void 0)||(this._$AL.has(Q)||(this.hasUpdated||$||(X=void 0),this._$AL.set(Q,X)),q===!0&&this._$Em!==Q&&(this._$Eq??=new Set).add(Q))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(X){Promise.reject(X)}let Q=this.scheduleUpdate();return Q!=null&&await Q,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[q,J]of this._$Ep)this[q]=J;this._$Ep=void 0}let $=this.constructor.elementProperties;if($.size>0)for(let[q,J]of $){let{wrapped:Z}=J,z=this[q];Z!==!0||this._$AL.has(q)||z===void 0||this.C(q,void 0,J,z)}}let Q=!1,X=this._$AL;try{Q=this.shouldUpdate(X),Q?(this.willUpdate(X),this._$EO?.forEach(($)=>$.hostUpdate?.()),this.update(X)):this._$EM()}catch($){throw Q=!1,this._$EM(),$}Q&&this._$AE(X)}willUpdate(Q){}_$AE(Q){this._$EO?.forEach((X)=>X.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(Q)),this.updated(Q)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(Q){return!0}update(Q){this._$Eq&&=this._$Eq.forEach((X)=>this._$ET(X,this[X])),this._$EM()}updated(Q){}firstUpdated(Q){}}C.elementStyles=[],C.shadowRootOptions={mode:"open"},C[y("elementProperties")]=new Map,C[y("finalized")]=new Map,P4?.({ReactiveElement:C}),(o.reactiveElementVersions??=[]).push("2.1.2");var WQ=globalThis,xQ=(Q)=>Q,i=WQ.trustedTypes,TQ=i?i.createPolicy("lit-html",{createHTML:(Q)=>Q}):void 0;var U=`lit$${Math.random().toFixed(9).slice(2)}$`,GQ="?"+U,O4=`<${GQ}>`,j=document,T=()=>j.createComment(""),S=(Q)=>Q===null||typeof Q!="object"&&typeof Q!="function",FQ=Array.isArray,hQ=(Q)=>FQ(Q)||typeof Q?.[Symbol.iterator]=="function";var x=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,SQ=/-->/g,vQ=/>/g,R=RegExp(`>|[ 	
\f\r](?:([^\\s"'>=/]+)([ 	
\f\r]*=[ 	
\f\r]*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),uQ=/'/g,gQ=/"/g,pQ=/^(?:script|style|textarea|title)$/i,NQ=(Q)=>(X,...$)=>({_$litType$:Q,strings:X,values:$}),V=NQ(1),Z6=NQ(2),z6=NQ(3),_=Symbol.for("lit-noChange"),O=Symbol.for("lit-nothing"),dQ=new WeakMap,k=j.createTreeWalker(j,129);function cQ(Q,X){if(!FQ(Q)||!Q.hasOwnProperty("raw"))throw Error("invalid template strings array");return TQ!==void 0?TQ.createHTML(X):X}var mQ=(Q,X)=>{let $=Q.length-1,q=[],J,Z=X===2?"<svg>":X===3?"<math>":"",z=x;for(let W=0;W<$;W++){let F=Q[W],K,G,N=-1,Y=0;for(;Y<F.length&&(z.lastIndex=Y,G=z.exec(F),G!==null);)Y=z.lastIndex,z===x?G[1]==="!--"?z=SQ:G[1]!==void 0?z=vQ:G[2]!==void 0?(pQ.test(G[2])&&(J=RegExp("</"+G[2],"g")),z=R):G[3]!==void 0&&(z=R):z===R?G[0]===">"?(z=J??x,N=-1):G[1]===void 0?N=-2:(N=z.lastIndex-G[2].length,K=G[1],z=G[3]===void 0?R:G[3]==='"'?gQ:uQ):z===gQ||z===uQ?z=R:z===SQ||z===vQ?z=x:(z=R,J=void 0);let B=z===R&&Q[W+1].startsWith("/>")?" ":"";Z+=z===x?F+O4:N>=0?(q.push(K),F.slice(0,N)+"$lit$"+F.slice(N)+U+B):F+U+(N===-2?W:B)}return[cQ(Q,Z+(Q[$]||"<?>")+(X===2?"</svg>":X===3?"</math>":"")),q]};class v{constructor({strings:Q,_$litType$:X},$){let q;this.parts=[];let J=0,Z=0,z=Q.length-1,W=this.parts,[F,K]=mQ(Q,X);if(this.el=v.createElement(F,$),k.currentNode=this.el.content,X===2||X===3){let G=this.el.content.firstChild;G.replaceWith(...G.childNodes)}for(;(q=k.nextNode())!==null&&W.length<z;){if(q.nodeType===1){if(q.hasAttributes())for(let G of q.getAttributeNames())if(G.endsWith("$lit$")){let N=K[Z++],Y=q.getAttribute(G).split(U),B=/([.?@])?(.*)/.exec(N);W.push({type:1,index:J,name:B[2],strings:Y,ctor:B[1]==="."?BQ:B[1]==="?"?KQ:B[1]==="@"?PQ:w}),q.removeAttribute(G)}else G.startsWith(U)&&(W.push({type:6,index:J}),q.removeAttribute(G));if(pQ.test(q.tagName)){let G=q.textContent.split(U),N=G.length-1;if(N>0){q.textContent=i?i.emptyScript:"";for(let Y=0;Y<N;Y++)q.append(G[Y],T()),k.nextNode(),W.push({type:2,index:++J});q.append(G[N],T())}}}else if(q.nodeType===8)if(q.data===GQ)W.push({type:2,index:J});else{let G=-1;for(;(G=q.data.indexOf(U,G+1))!==-1;)W.push({type:7,index:J}),G+=U.length-1}J++}}static createElement(Q,X){let $=j.createElement("template");return $.innerHTML=Q,$}}function A(Q,X,$=Q,q){if(X===_)return X;let J=q!==void 0?$._$Co?.[q]:$._$Cl,Z=S(X)?void 0:X._$litDirective$;return J?.constructor!==Z&&(J?._$AO?.(!1),Z===void 0?J=void 0:(J=new Z(Q),J._$AT(Q,$,q)),q!==void 0?($._$Co??=[])[q]=J:$._$Cl=J),J!==void 0&&(X=A(Q,J._$AS(Q,X.values),J,q)),X}class YQ{constructor(Q,X){this._$AV=[],this._$AN=void 0,this._$AD=Q,this._$AM=X}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(Q){let{el:{content:X},parts:$}=this._$AD,q=(Q?.creationScope??j).importNode(X,!0);k.currentNode=q;let J=k.nextNode(),Z=0,z=0,W=$[0];for(;W!==void 0;){if(Z===W.index){let F;W.type===2?F=new f(J,J.nextSibling,this,Q):W.type===1?F=new W.ctor(J,W.name,W.strings,this,Q):W.type===6&&(F=new OQ(J,this,Q)),this._$AV.push(F),W=$[++z]}Z!==W?.index&&(J=k.nextNode(),Z++)}return k.currentNode=j,q}p(Q){let X=0;for(let $ of this._$AV)$!==void 0&&($.strings!==void 0?($._$AI(Q,$,X),X+=$.strings.length-2):$._$AI(Q[X])),X++}}class f{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(Q,X,$,q){this.type=2,this._$AH=O,this._$AN=void 0,this._$AA=Q,this._$AB=X,this._$AM=$,this.options=q,this._$Cv=q?.isConnected??!0}get parentNode(){let Q=this._$AA.parentNode,X=this._$AM;return X!==void 0&&Q?.nodeType===11&&(Q=X.parentNode),Q}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(Q,X=this){Q=A(this,Q,X),S(Q)?Q===O||Q==null||Q===""?(this._$AH!==O&&this._$AR(),this._$AH=O):Q!==this._$AH&&Q!==_&&this._(Q):Q._$litType$!==void 0?this.$(Q):Q.nodeType!==void 0?this.T(Q):hQ(Q)?this.k(Q):this._(Q)}O(Q){return this._$AA.parentNode.insertBefore(Q,this._$AB)}T(Q){this._$AH!==Q&&(this._$AR(),this._$AH=this.O(Q))}_(Q){this._$AH!==O&&S(this._$AH)?this._$AA.nextSibling.data=Q:this.T(j.createTextNode(Q)),this._$AH=Q}$(Q){let{values:X,_$litType$:$}=Q,q=typeof $=="number"?this._$AC(Q):($.el===void 0&&($.el=v.createElement(cQ($.h,$.h[0]),this.options)),$);if(this._$AH?._$AD===q)this._$AH.p(X);else{let J=new YQ(q,this),Z=J.u(this.options);J.p(X),this.T(Z),this._$AH=J}}_$AC(Q){let X=dQ.get(Q.strings);return X===void 0&&dQ.set(Q.strings,X=new v(Q)),X}k(Q){FQ(this._$AH)||(this._$AH=[],this._$AR());let X=this._$AH,$,q=0;for(let J of Q)q===X.length?X.push($=new f(this.O(T()),this.O(T()),this,this.options)):$=X[q],$._$AI(J),q++;q<X.length&&(this._$AR($&&$._$AB.nextSibling,q),X.length=q)}_$AR(Q=this._$AA.nextSibling,X){for(this._$AP?.(!1,!0,X);Q!==this._$AB;){let $=xQ(Q).nextSibling;xQ(Q).remove(),Q=$}}setConnected(Q){this._$AM===void 0&&(this._$Cv=Q,this._$AP?.(Q))}}class w{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(Q,X,$,q,J){this.type=1,this._$AH=O,this._$AN=void 0,this.element=Q,this.name=X,this._$AM=q,this.options=J,$.length>2||$[0]!==""||$[1]!==""?(this._$AH=Array($.length-1).fill(new String),this.strings=$):this._$AH=O}_$AI(Q,X=this,$,q){let J=this.strings,Z=!1;if(J===void 0)Q=A(this,Q,X,0),Z=!S(Q)||Q!==this._$AH&&Q!==_,Z&&(this._$AH=Q);else{let z=Q,W,F;for(Q=J[0],W=0;W<J.length-1;W++)F=A(this,z[$+W],X,W),F===_&&(F=this._$AH[W]),Z||=!S(F)||F!==this._$AH[W],F===O?Q=O:Q!==O&&(Q+=(F??"")+J[W+1]),this._$AH[W]=F}Z&&!q&&this.j(Q)}j(Q){Q===O?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,Q??"")}}class BQ extends w{constructor(){super(...arguments),this.type=3}j(Q){this.element[this.name]=Q===O?void 0:Q}}class KQ extends w{constructor(){super(...arguments),this.type=4}j(Q){this.element.toggleAttribute(this.name,!!Q&&Q!==O)}}class PQ extends w{constructor(Q,X,$,q,J){super(Q,X,$,q,J),this.type=5}_$AI(Q,X=this){if((Q=A(this,Q,X,0)??O)===_)return;let $=this._$AH,q=Q===O&&$!==O||Q.capture!==$.capture||Q.once!==$.once||Q.passive!==$.passive,J=Q!==O&&($===O||q);q&&this.element.removeEventListener(this.name,this,$),J&&this.element.addEventListener(this.name,this,Q),this._$AH=Q}handleEvent(Q){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,Q):this._$AH.handleEvent(Q)}}class OQ{constructor(Q,X,$){this.element=Q,this.type=6,this._$AN=void 0,this._$AM=X,this.options=$}get _$AU(){return this._$AM._$AU}_$AI(Q){A(this,Q)}}var rQ={M:"$lit$",P:U,A:GQ,C:1,L:mQ,R:YQ,D:hQ,V:A,I:f,H:w,N:KQ,U:PQ,B:BQ,F:OQ},D4=WQ.litHtmlPolyfillSupport;D4?.(v,f),(WQ.litHtmlVersions??=[]).push("3.3.3");var lQ=(Q,X,$)=>{let q=$?.renderBefore??X,J=q._$litPart$;if(J===void 0){let Z=$?.renderBefore??null;q._$litPart$=J=new f(X.insertBefore(T(),Z),Z,void 0,$??{})}return J._$AI(Q),J};var DQ=globalThis;class E extends C{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let Q=super.createRenderRoot();return this.renderOptions.renderBefore??=Q.firstChild,Q}update(Q){let X=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(Q),this._$Do=lQ(X,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return _}}E._$litElement$=!0,E.finalized=!0,DQ.litElementHydrateSupport?.({LitElement:E});var H4=DQ.litElementPolyfillSupport;H4?.({LitElement:E});(DQ.litElementVersions??=[]).push("4.2.2");var u=(Q)=>{if(!Q.ok)throw Error(`annotai: ${Q.status} ${Q.statusText}`);return Q.json()},oQ=()=>fetch("/annotai/api/annotations").then(u).then((Q)=>Q.annotations||[]),iQ=(Q)=>fetch("/annotai/api/annotations",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Q)}).then(u),aQ=(Q,X)=>fetch(`/annotai/api/annotations/${Q}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(X)}).then(u),sQ=(Q,X)=>fetch(`/annotai/api/annotations/${Q}/reply`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message:X})}).then(u),nQ=(Q)=>fetch(`/annotai/api/annotations/${Q}`,{method:"DELETE"}),eQ=()=>fetch("/annotai/api/clear",{method:"POST"}),tQ=()=>fetch("/annotai/api/status").then(u).catch(()=>({connected:!1}));var I4=/^\s*<([A-Za-z0-9_.]+)>\s+(\S+):(\d+)/,U4=/^\s*<\/([A-Za-z0-9_.]+)>/,_4=/^\s*@caller\s+(\S+):(\d+)/;function Q3(Q){let X=document.createNodeIterator(document.documentElement,NodeFilter.SHOW_COMMENT),$=[],q=null,J;while(J=X.nextNode()){if(!(Q.compareDocumentPosition(J)&Node.DOCUMENT_POSITION_PRECEDING))break;let K=J.nodeValue,G;if(G=I4.exec(K))$.push({module:G[1],file:G[2],line:G[3]});else if(G=_4.exec(K))q={file:G[1],line:G[2]};else if(U4.test(K))$.pop()}let Z=$[$.length-1]||null,z=Q.getAttribute("data-phx-loc");return{source_file:Z&&Z.module&&!Z.module.endsWith(".render")&&q?q.file:Z?Z.file:q?q.file:null,source_line:z?parseInt(z,10):Z?parseInt(Z.line,10):null,component:Z?Z.module:null}}var C4=4;function L4(Q){let X=[],$=Q,q=0;while($&&$.nodeType===1&&q<C4&&$!==document.body){if($.id){X.unshift("#"+$.id);break}let J=$.tagName.toLowerCase(),Z=($.getAttribute("class")||"").trim().split(/\s+/).filter(Boolean)[0];if(Z)J+="."+Z;X.unshift(J),$=$.parentElement,q++}return X.join(" > ")}function MQ(Q){let X=Q.tagName.toLowerCase(),$=(Q.textContent||"").trim().slice(0,30);return $?`${X} "${$}"`:X}var X3=(Q)=>`"${String(Q).replace(/[\\"]/g,"\\$&")}"`;function R4(Q){if(Q.id)return"#"+Q.id;for(let X of["phx-click","phx-submit","phx-change"])if(Q.hasAttribute(X)){let $=`[${X}=${X3(Q.getAttribute(X))}]`;for(let q of Q.getAttributeNames())if(q.startsWith("phx-value-"))$+=`[${q}=${X3(Q.getAttribute(q))}]`;return $}return null}function k4(Q){let X=[];if(Q.previousElementSibling)X.push(Q.previousElementSibling.textContent.trim().slice(0,40));if(Q.nextElementSibling)X.push(Q.nextElementSibling.textContent.trim().slice(0,40));return X.filter(Boolean).join(" … ")||null}function IQ(Q,X,$){let q=Q.getBoundingClientRect(),J=L4(Q);return{element:MQ(Q),element_path:J,phx_selector:R4(Q),anchor_frac:j4(q,$),anchor_index:A4(Q,J),bounding_box:{x:Math.round(q.x),y:Math.round(q.y),width:Math.round(q.width),height:Math.round(q.height)},css_classes:(Q.getAttribute("class")||"").trim()||null,selected_text:X||null,nearby_text:k4(Q),url:location.href,...Q3(Q)}}var $3=(Q)=>Math.min(1,Math.max(0,Q));function j4(Q,X){if(!X||!Q.width||!Q.height)return{x:1,y:0};return{x:$3((X.x-Q.left)/Q.width),y:$3((X.y-Q.top)/Q.height)}}function HQ(Q){try{return[...document.querySelectorAll(Q)]}catch(X){return[]}}function A4(Q,X){if(!X)return null;let $=HQ(X).indexOf(Q);return $>=0?$:null}var E4=(Q,X)=>Number.isInteger(X)&&X>=0&&X<Q.length?Q[X]:null;function f4(Q,X){let $=(X.element||"").match(/"([^"]+)"/),q=$?$[1].trim().toLowerCase():"";if(!q)return null;let J=Q.filter((Z)=>(Z.textContent||"").trim().toLowerCase().includes(q));return J.length===1?J[0]:null}function g(Q){let X=Q.phx_selector?HQ(Q.phx_selector):[];if(X.length===1)return X[0];if(Q.element_path){let $=HQ(Q.element_path);if($.length===1)return $[0];if($.length>1)return f4($,Q)||E4($,Q.anchor_index)||$[0]}return X[0]||null}function a(Q){return!!Q.phx_selector&&Q.phx_selector[0]==="#"||/^#[-\w]+$/.test(Q.element_path||"")}function s(Q){if(!Q)return null;try{return new URL(Q,location.href).pathname}catch(X){return Q}}var w4=["resolved","dismissed"];function n(Q){if(Q==null)return null;if(Q<5000)return"just now";if(Q<60000)return`${Math.floor(Q/1000)}s ago`;if(Q<3600000)return`${Math.floor(Q/60000)}m ago`;if(Q<86400000)return`${Math.floor(Q/3600000)}h ago`;return`${Math.floor(Q/86400000)}d ago`}var b4=(Q)=>w4.includes(Q.status);function q3(Q,X){if(X)return Q;return Q.filter(($)=>!b4($))}var J3=4;function Z3(Q){let X=/^data:([^;,]+);base64,(.*)$/s.exec(Q||"");return X?{mime:X[1],data:X[2]}:null}function y4(Q,X,$){if(Q<=$&&X<=$)return{width:Q,height:X};let q=$/Math.max(Q,X);return{width:Math.max(1,Math.round(Q*q)),height:Math.max(1,Math.round(X*q))}}function x4(Q){let X=(Q||"").indexOf(","),$=X>=0?Q.slice(X+1):Q||"",q=$.endsWith("==")?2:$.endsWith("=")?1:0;return Math.max(0,Math.floor($.length*3/4)-q)}var T4=0,z3=()=>`att_${Date.now().toString(36)}_${(T4++).toString(36)}`;function UQ(Q){let X=[];for(let $ of Q?.items??[])if($.kind==="file"&&$.type.startsWith("image/")){let q=$.getAsFile();if(q)X.push(q)}return X}async function V3(Q,{maxDim:X=1600,maxBytes:$=2000000}={}){let q=await S4(Q),{width:J,height:Z}=y4(q.naturalWidth,q.naturalHeight,X),z=document.createElement("canvas");z.width=J,z.height=Z,z.getContext("2d").drawImage(q,0,0,J,Z);for(let[W,F]of[["image/png",void 0],["image/jpeg",0.85],["image/jpeg",0.6]]){let K=z.toDataURL(W,F);if(x4(K)<=$)return{mime:W,dataUrl:K,width:J,height:Z}}return null}function S4(Q){return new Promise((X,$)=>{let q=URL.createObjectURL(Q),J=new Image;J.onload=()=>{URL.revokeObjectURL(q),X(J)},J.onerror=(Z)=>{URL.revokeObjectURL(q),$(Z)},J.src=q})}var _Q=V`<svg viewBox="0 0 64 64" fill="none" role="img">
  <rect x="11" y="11" width="42" height="42" rx="11" fill="none" stroke="currentColor" stroke-width="7" />
  <g transform="rotate(-2.5 32 33)">
    <path
      d="M 5.50,23.06 C 10.34,21.46 20.11,23.27 27.26,23.36 C 34.41,23.46 41.34,23.53 48.38,23.62 C 55.42,23.72 66.60,22.37 69.50,23.93 C 72.40,25.49 67.62,29.92 65.79,33.00 C 63.96,36.08 63.34,40.80 58.50,42.42 C 53.66,44.05 43.89,42.74 36.74,42.76 C 29.59,42.77 22.66,42.49 15.62,42.52 C 8.58,42.56 -2.60,44.57 -5.50,42.98 C -8.40,41.39 -3.62,36.32 -1.79,33.00 C 0.04,29.68 0.66,24.67 5.50,23.06 Z"
      fill="#FFE600"
      fill-opacity="0.82"
    />
  </g>
</svg>`,W3=V`<svg viewBox="0 0 369.37 93.22" fill="none" role="img" aria-label="Annotai">
  <g transform="rotate(-1.5 323.10 59.35)">
    <path
      d="M 296.62,26.01 C 304.65,20.79 315.47,27.82 324.69,28.05 C 333.91,28.27 342.85,27.20 351.93,27.38 C 361.01,27.56 376.21,23.79 379.17,29.12 C 382.12,34.45 374.60,49.34 369.67,59.35 C 364.73,69.37 357.60,84.07 349.58,89.22 C 341.55,94.38 330.73,89.76 321.51,90.28 C 312.29,90.80 303.35,92.08 294.27,92.33 C 285.19,92.57 269.99,97.23 267.03,91.73 C 264.08,86.24 271.60,70.31 276.53,59.35 C 281.47,48.40 288.60,31.22 296.62,26.01 Z"
      fill="#FFE600"
      fill-opacity="0.92"
    />
  </g>
  <g transform="translate(3.95,85.81) scale(0.108,-0.108)">
    <path
      fill="currentColor"
      d="M196 -13Q144 -13 104.0 7.5Q64 28 41.5 65.5Q19 103 19 151Q19 203 43.5 239.5Q68 276 108.5 295.5Q149 315 198 315Q271 315 317.0 281.5Q363 248 377 183L311 198V309Q311 334 293.0 352.0Q275 370 237 370Q210 370 175.0 363.0Q140 356 101 337L55 452Q99 474 152.0 488.5Q205 503 262 503Q331 503 378.5 478.0Q426 453 450.0 407.5Q474 362 474 300V0H338L307 97L377 119Q362 58 317.5 22.5Q273 -13 196 -13ZM251 97Q279 97 296.0 112.0Q313 127 313 151Q313 174 296.0 189.0Q279 204 251 204Q221 204 204.5 189.0Q188 174 188 151Q188 127 204.5 112.0Q221 97 251 97Z"
    />
    <path
      transform="translate(513,0)"
      fill="currentColor"
      d="M356 503Q405 503 436.0 486.0Q467 469 484.0 440.5Q501 412 507.5 376.0Q514 340 514 301V0H352V282Q352 320 340.0 332.0Q328 344 305 344Q288 344 269.0 337.5Q250 331 231.5 318.5Q213 306 195 289L160 370H210V0H48V490H168L200 389L141 395Q166 423 199.5 447.5Q233 472 272.5 487.5Q312 503 356 503Z"
    />
    <path
      transform="translate(1067,0)"
      fill="currentColor"
      d="M356 503Q405 503 436.0 486.0Q467 469 484.0 440.5Q501 412 507.5 376.0Q514 340 514 301V0H352V282Q352 320 340.0 332.0Q328 344 305 344Q288 344 269.0 337.5Q250 331 231.5 318.5Q213 306 195 289L160 370H210V0H48V490H168L200 389L141 395Q166 423 199.5 447.5Q233 472 272.5 487.5Q312 503 356 503Z"
    />
    <path
      transform="translate(1621,0)"
      fill="currentColor"
      d="M279 -13Q202 -13 144.0 20.0Q86 53 53.0 111.0Q20 169 20 244Q20 320 53.0 378.0Q86 436 144.0 469.5Q202 503 279 503Q357 503 415.5 469.5Q474 436 506.5 378.0Q539 320 539 244Q539 169 506.5 111.0Q474 53 415.5 20.0Q357 -13 279 -13ZM279 145Q321 145 348.0 172.5Q375 200 375 245Q375 290 348.0 317.5Q321 345 279 345Q238 345 211.0 317.5Q184 290 184 245Q184 201 211.0 173.0Q238 145 279 145Z"
    />
    <path
      transform="translate(2181,0)"
      fill="currentColor"
      d="M280 -8Q193 -8 143.5 33.0Q94 74 94 169V484L92 490L126 609H256V213Q256 177 272.5 162.0Q289 147 316 147Q331 147 344.5 150.0Q358 153 367 156V4Q348 -2 327.0 -5.0Q306 -8 280 -8ZM18 340V490H367V340Z"
    />
    <path
      transform="translate(2591,0)"
      fill="#1A1A1A"
      d="M196 -13Q144 -13 104.0 7.5Q64 28 41.5 65.5Q19 103 19 151Q19 203 43.5 239.5Q68 276 108.5 295.5Q149 315 198 315Q271 315 317.0 281.5Q363 248 377 183L311 198V309Q311 334 293.0 352.0Q275 370 237 370Q210 370 175.0 363.0Q140 356 101 337L55 452Q99 474 152.0 488.5Q205 503 262 503Q331 503 378.5 478.0Q426 453 450.0 407.5Q474 362 474 300V0H338L307 97L377 119Q362 58 317.5 22.5Q273 -13 196 -13ZM251 97Q279 97 296.0 112.0Q313 127 313 151Q313 174 296.0 189.0Q279 204 251 204Q221 204 204.5 189.0Q188 174 188 151Q188 127 204.5 112.0Q221 97 251 97Z"
    />
    <path
      transform="translate(3104,0)"
      fill="#1A1A1A"
      d="M212 0H49V490H212ZM37 645Q37 688 63.0 713.5Q89 739 131 739Q174 739 199.0 713.5Q224 688 224 645Q224 604 199.0 578.5Q174 553 131 553Q89 553 63.0 578.5Q37 604 37 645Z"
    />
  </g>
</svg>`,G3=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z" />
  <path
    d="M12 2c-.377.333-.905 1.2 0 2m0 16c.377.333.906 1.2 0 2m7.5-17.497c-.532-.033-1.575.22-1.496 1.495M5.496 17.5c.033.532-.22 1.575-1.496 1.496M5.003 4.5c-.033.532.22 1.576 1.497 1.497M18 17.503c.532-.032 1.575.208 1.496 1.414M22 12c-.333-.377-1.2-.905-2 0m-16-.5c-.333.377-1.2.906-2 0"
  />
</svg>`,F3=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path
    d="M21.5 14.078A8.557 8.557 0 0 1 9.922 2.5C5.668 3.497 2.5 7.315 2.5 11.873a9.627 9.627 0 0 0 9.627 9.627c4.558 0 8.376-3.168 9.373-7.422"
  />
</svg>`,e=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path
    d="m19.5 5.5-.62 10.025c-.158 2.561-.237 3.842-.88 4.763a4 4 0 0 1-1.2 1.128c-.957.584-2.24.584-4.806.584-2.57 0-3.855 0-4.814-.585a4 4 0 0 1-1.2-1.13c-.642-.922-.72-2.205-.874-4.77L4.5 5.5M3 5.5h18m-4.944 0-.683-1.408c-.453-.936-.68-1.403-1.071-1.695a2 2 0 0 0-.275-.172C13.594 2 13.074 2 12.035 2c-1.066 0-1.599 0-2.04.234a2 2 0 0 0-.278.18c-.395.303-.616.788-1.058 1.757L8.053 5.5m1.447 11v-6m5 6v-6"
  />
</svg>`,t=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2.2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M12 4v16m8-8H4" />
</svg>`,QQ=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M18 6 6 18m12 0L6 6" />
</svg>`,N3=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="m6 9 6 6 6-6" />
</svg>`,Y3=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" />
  <path
    d="M21.011 14.097c.522-.141.783-.212.886-.346.103-.135.103-.351.103-.784v-1.934c0-.433 0-.65-.103-.784s-.364-.205-.886-.345c-1.95-.526-3.171-2.565-2.668-4.503.139-.533.208-.8.142-.956s-.256-.264-.635-.479l-1.725-.98c-.372-.21-.558-.316-.725-.294s-.356.21-.733.587c-1.459 1.455-3.873 1.455-5.333 0-.377-.376-.565-.564-.732-.587-.167-.022-.353.083-.725.295l-1.725.979c-.38.215-.57.323-.635.48-.066.155.003.422.141.955.503 1.938-.718 3.977-2.669 4.503-.522.14-.783.21-.886.345S2 10.6 2 11.033v1.934c0 .433 0 .65.103.784s.364.205.886.346c1.95.526 3.171 2.565 2.668 4.502-.139.533-.208.8-.142.956s.256.264.635.48l1.725.978c.372.212.558.317.725.295s.356-.21.733-.587c1.46-1.457 3.876-1.457 5.336 0 .377.376.565.564.732.587.167.022.353-.083.726-.295l1.724-.979c.38-.215.57-.323.635-.48s-.003-.422-.141-.955c-.504-1.937.716-3.976 2.666-4.502Z"
  />
</svg>`,B3=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path
    d="M9 15c0-2.828 0-4.243.879-5.121C10.757 9 12.172 9 15 9h1c2.828 0 4.243 0 5.121.879C22 10.757 22 12.172 22 15v1c0 2.828 0 4.243-.879 5.121C20.243 22 18.828 22 16 22h-1c-2.828 0-4.243 0-5.121-.879C9 20.243 9 18.828 9 16z"
  />
  <path
    d="M17 9c-.003-2.957-.047-4.489-.908-5.538a4 4 0 0 0-.554-.554C14.43 2 12.788 2 9.5 2c-3.287 0-4.931 0-6.038.908a4 4 0 0 0-.554.554C2 4.57 2 6.212 2 9.5c0 3.287 0 4.931.908 6.038a4 4 0 0 0 .554.554c1.05.86 2.58.906 5.538.908"
  />
</svg>`,K3=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="m5 14 3.5 3.5L19 6.5" />
</svg>`,P3=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.9"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M12 19V5m0 0-6 6m6-6 6 6" />
</svg>`,O3=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" />
  <path
    d="M9.6 9.6c0-1.326 1.074-2.4 2.4-2.4s2.4 1.074 2.4 2.4c0 .96-.563 1.787-1.376 2.17-.5.235-1.024.59-1.024 1.144V13.5"
  />
  <path d="M12 17h.008" />
</svg>`,D3=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M14.5 2h-5a1.5 1.5 0 0 0 0 3h5a1.5 1.5 0 0 0 0-3M8 15h3.429M8 11h8" />
  <path
    d="M16 3.5c1.554.047 2.48.22 3.121.862.88.878.88 2.293.88 5.12V16c0 2.828 0 4.242-.88 5.121-.878.879-2.293.879-5.12.879h-4c-2.83 0-4.244 0-5.122-.879S4 18.828 4 16V9.483c0-2.828 0-4.243.879-5.121C5.52 3.72 6.447 3.547 8 3.5"
  />
</svg>`,H3=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M8.5 14.5h7m-7-5H12" />
  <path
    d="M14.17 20.89c4.184-.277 7.516-3.657 7.79-7.9.053-.83.053-1.69 0-2.52-.274-4.242-3.606-7.62-7.79-7.899a33 33 0 0 0-4.34 0c-4.184.278-7.516 3.657-7.79 7.9a20 20 0 0 0 0 2.52c.1 1.545.783 2.976 1.588 4.184.467.845.159 1.9-.328 2.823-.35.665-.526.997-.385 1.237.14.24.455.248 1.084.263 1.245.03 2.084-.322 2.75-.813.377-.279.566-.418.696-.434s.387.09.899.3c.46.19.995.307 1.485.34 1.425.094 2.914.094 4.342 0Z"
  />
</svg>`,M3=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <circle cx="12" cy="12" r="10" />
  <path d="M12 8v4l2 2" />
</svg>`,I3=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M2 8s4.477-5 10-5 10 5 10 5" />
  <path
    d="M21.544 13.045c.304.426.456.64.456.955 0 .316-.152.529-.456.955C20.178 16.871 16.689 21 12 21c-4.69 0-8.178-4.13-9.544-6.045C2.152 14.529 2 14.315 2 14c0-.316.152-.529.456-.955C3.822 11.129 7.311 7 12 7c4.69 0 8.178 4.13 9.544 6.045Z"
  />
  <path d="M15 14a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z" />
</svg>`,U3=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10Z" />
  <path d="m8 12.5 2.5 2.5L16 9" />
</svg>`,_3=V`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10m-7 3L9 9m0 6 6-6" />
</svg>`;var C3=D`
  :host {
    --c-indigo: #6155f5;
    --c-green: #34c759;
    --c-amber: #ff8d28;
    --c-red: #ff383c;
    --c-grey: #888;
    /* accent palette — single source of truth: both the swatches (ui/settings.js) and the
       selectors below read these, so a color is defined exactly once. */
    --accent-blue: #0088ff;
    --accent-indigo: #6155f5;
    --accent-cyan: #00c3d0;
    --accent-green: #34c759;
    --accent-yellow: #ffcc00;
    --accent-orange: #ff8d28;
    --accent-red: #ff383c;
    --accent: var(--accent-blue);
    --on-accent: #fff; /* default = blue */
    /* Surface elevation: panels sit at --surface, content blocks step up to --raised (a
       gentle oklch step lighter in dark), inputs/code recess to --field. Kept deliberately
       subtle so raised blocks read as grouped, not floating. */
    --surface-step: 0.045;
    --surface: #1c1c1e;
    --raised: oklch(from var(--surface) calc(l + var(--surface-step)) c h);
    --field: #141416;
    --text: rgba(255, 255, 255, 0.9);
    --text-soft: rgba(255, 255, 255, 0.6);
    --text-mut: rgba(255, 255, 255, 0.45);
    --hover: rgba(255, 255, 255, 0.12);
    --line: rgba(255, 255, 255, 0.12);
    --surface-edge:
      inset 0 1px 0 0 rgba(255, 255, 255, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.3);
    /* One hairline + one soft shadow: enough to lift a block off the panel without popping. */
    --raised-edge: inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.28);
    --well-edge: inset 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.3);
    /* Widget placement: distance from each viewport edge for the toolbar (and the
       panels, offset above/below it). Defaults to bottom-right, 20px in. The host app
       overrides these inline via config :annotai, position: — see widget.js
       _applyPlacement, which also stamps data-annotai-corner for the panel rules below. */
    --annotai-inset-top: auto;
    --annotai-inset-right: 20px;
    --annotai-inset-bottom: 20px;
    --annotai-inset-left: auto;
  }
  /* Panels (history, settings) share the .anchored class: they sit 54px past the toolbar
     (its height + gap) along the vertical inset and stay flush to it horizontally, growing
     from the near corner. The corner attr flips the anchored axis so a top/left placement
     opens the panel downward/leftward instead. */
  .anchored {
    position: fixed;
    top: auto;
    right: var(--annotai-inset-right);
    bottom: calc(var(--annotai-inset-bottom) + 54px);
    left: auto;
    transform-origin: bottom right;
  }
  :host([data-annotai-corner="bottom-left"]) .anchored {
    right: auto;
    left: var(--annotai-inset-left);
    transform-origin: bottom left;
  }
  :host([data-annotai-corner="top-right"]) .anchored {
    top: calc(var(--annotai-inset-top) + 54px);
    bottom: auto;
    transform-origin: top right;
  }
  :host([data-annotai-corner="top-left"]) .anchored {
    top: calc(var(--annotai-inset-top) + 54px);
    bottom: auto;
    right: auto;
    left: var(--annotai-inset-left);
    transform-origin: top left;
  }
  /* selected accent + legible foreground (dark fg for light accents) */
  :host([data-annotai-accent="indigo"]) {
    --accent: var(--accent-indigo);
    --on-accent: #fff;
  }
  :host([data-annotai-accent="blue"]) {
    --accent: var(--accent-blue);
    --on-accent: #fff;
  }
  :host([data-annotai-accent="cyan"]) {
    --accent: var(--accent-cyan);
    --on-accent: #0c2027;
  }
  :host([data-annotai-accent="green"]) {
    --accent: var(--accent-green);
    --on-accent: #0c2415;
  }
  :host([data-annotai-accent="yellow"]) {
    --accent: var(--accent-yellow);
    --on-accent: #1a1a1a;
  }
  :host([data-annotai-accent="orange"]) {
    --accent: var(--accent-orange);
    --on-accent: #1a1a1a;
  }
  :host([data-annotai-accent="red"]) {
    --accent: var(--accent-red);
    --on-accent: #fff;
  }
  :host([data-annotai-theme="light"]) {
    /* Light stays flat (white ceiling): --field must stay below --raised so wells read sunken. */
    --surface: #fff;
    --raised: #fafafb;
    --field: #f0f0f2;
    --text: rgba(0, 0, 0, 0.85);
    --text-soft: rgba(0, 0, 0, 0.55);
    --text-mut: rgba(0, 0, 0, 0.4);
    --hover: rgba(0, 0, 0, 0.06);
    --line: rgba(0, 0, 0, 0.1);
    --surface-edge: 0 0 0 1px rgba(0, 0, 0, 0.07);
    --raised-edge: 0 0 0 1px rgba(0, 0, 0, 0.05);
    --well-edge: inset 0 0 0 1px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  * {
    box-sizing: border-box;
    font-family:
      system-ui,
      -apple-system,
      "Segoe UI",
      Roboto,
      sans-serif;
  }
  svg {
    display: block;
    width: 18px;
    height: 18px;
  }
`;var L3=({open:Q,settingsOpen:X,historyOpen:$,count:q,showBadge:J,onToggleOpen:Z,onToggleSettings:z,onToggleHistory:W,onClearAll:F,onClose:K,onTip:G,onUntip:N})=>V`<div class="bar" ?data-open=${Q}>
    ${Q?V`<span class="logo brand" aria-hidden="true">${_Q}</span>`:V`<button class="logo" aria-label="Open Annotai" @click=${Z}>
          ${_Q}${J?V`<span class="badge">${q}</span>`:null}
        </button>`}
    <div class="controls">
      <button
        class="ctrl"
        aria-label="Annotations"
        ?data-on=${$}
        @click=${W}
        @mouseenter=${(Y)=>G(Y,"Annotations")}
        @mouseleave=${N}
      >
        ${D3}
      </button>
      <button
        class="ctrl"
        aria-label="Settings"
        ?data-on=${X}
        @click=${z}
        @mouseenter=${(Y)=>G(Y,"Settings")}
        @mouseleave=${N}
      >
        ${Y3}
      </button>
      <button
        class="ctrl"
        aria-label="Clear all annotations"
        @click=${F}
        @mouseenter=${(Y)=>G(Y,"Clear all annotations")}
        @mouseleave=${N}
      >
        ${e}
      </button>
      <span class="sep"></span>
      <button
        class="ctrl"
        aria-label="Close"
        @click=${K}
        @mouseenter=${(Y)=>G(Y,"Close (Esc)")}
        @mouseleave=${N}
      >
        ${QQ}
      </button>
    </div>
  </div>`,R3=D`
  .bar {
    position: fixed;
    top: var(--annotai-inset-top);
    right: var(--annotai-inset-right);
    bottom: var(--annotai-inset-bottom);
    left: var(--annotai-inset-left);
    z-index: 100000;
    display: flex;
    align-items: center;
    gap: 0;
    padding: 6px;
    background: var(--surface);
    color: var(--text);
    border-radius: 24px;
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.2),
      0 4px 16px rgba(0, 0, 0, 0.1),
      var(--surface-edge);
  }
  .bar[data-open] {
    gap: 6px;
  }
  .bar:not([data-open]) {
    padding: 0;
  }
  .logo {
    all: unset;
    cursor: pointer;
    position: relative;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text);
    transition: background 0.15s ease;
  }
  .logo svg {
    width: 20px;
    height: 20px;
  }
  .bar:not([data-open]) .logo {
    width: 44px;
    height: 44px;
  }
  .bar:not([data-open]) .logo:hover {
    background: var(--hover);
  }
  /* Open: pure branding — no highlight, not interactive. */
  .logo.brand {
    cursor: default;
  }
  .badge {
    position: absolute;
    top: -3px;
    right: -4px;
    min-width: 17px;
    height: 17px;
    padding: 0 5px;
    border-radius: 9px;
    background: var(--accent);
    color: var(--on-accent);
    font: 600 10px system-ui;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 6px;
    max-width: 0;
    overflow: hidden;
    opacity: 0;
    transition:
      max-width 0.32s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.32s ease;
  }
  .bar[data-open] .controls {
    max-width: 200px;
    opacity: 1;
  }
  .ctrl {
    all: unset;
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-soft);
    transition:
      background 0.15s ease,
      color 0.15s ease,
      transform 0.1s ease;
  }
  .ctrl:hover {
    background: var(--hover);
    color: var(--text);
  }
  .ctrl:active {
    transform: scale(0.92);
  }
  .ctrl[data-on] {
    background: var(--accent);
    color: var(--on-accent);
  }
  .ctrl.sm {
    width: 28px;
    height: 28px;
  }
  .sep {
    width: 1px;
    height: 18px;
    background: var(--line);
    flex: none;
  }
`;var XQ=(Q,X)=>V`<div class="info-row"><span class="k">${Q}</span><code>${X}</code></div>`,v4=(Q)=>{let X=Date.parse(Q);if(Number.isNaN(X))return"";let $=Math.max(0,(Date.now()-X)/1000);if($<45)return"just now";if($<3600)return`${Math.round($/60)}m`;if($<86400)return`${Math.round($/3600)}h`;return`${Math.round($/86400)}d`},k3=(Q)=>{let X=[],$=0,q=/`([^`\n]+)`/g,J;while((J=q.exec(Q))!==null){if(J.index>$)X.push(Q.slice($,J.index));X.push(V`<code class="code">${J[1]}</code>`),$=J.index+J[0].length}if($<Q.length)X.push(Q.slice($));return X},u4=(Q)=>{if(typeof Q!=="string")return Q;let X=[],$=0,q=/```[^\n]*\n?([\s\S]*?)```/g,J;while((J=q.exec(Q))!==null){if(J.index>$)X.push(...k3(Q.slice($,J.index)));X.push(V`<pre class="codeblock"><code>${J[1].replace(/\n$/,"")}</code></pre>`),$=J.index+J[0].length}if($<Q.length)X.push(...k3(Q.slice($)));return X},g4=(Q)=>V`<div class="thread">
    ${Q.map((X)=>V`<div class="msg" data-role=${X.role}>
          <div class="msg-meta">
            <span class="msg-who">${X.role==="agent"?"Agent":"You"}</span>
            <span class="msg-time">${v4(X.at)}</span>
          </div>
          <div class="bubble">${u4(X.content)}</div>
        </div>`)}
  </div>`,j3=(Q,X)=>V`<div class="thumb">
    <img src=${Q} alt="attachment" />
    ${X?V`<button class="thumb-x" aria-label="Remove image" @click=${X}>${QQ}</button>`:null}
  </div>`,A3=(Q)=>Q.length===0?null:V`<div class="attachments">${Q}</div>`,d4=(Q,X)=>A3(Q.map(($)=>j3($.dataUrl,()=>X($.id)))),h4=(Q)=>A3((Q.images??[]).map((X)=>j3(`/annotai/api/annotations/${Q.id}/images/${X.id}`))),E3=({compose:Q,annotation:X,comment:$,attachments:q,dragging:J,replyText:Z,detailsOpen:z,popupStyle:W,onToggleDetails:F,onInput:K,onInputKey:G,onPaste:N,onRemoveImage:Y,onDragEnter:B,onDragOver:P,onDragLeave:H,onDrop:I,onReplyInput:p,onReplyKey:$4,onReplySend:q4,onCancel:RQ,onDelete:J4,onSubmit:Z4})=>{let M=Q.info,kQ=M.source_file?`${M.source_file}:${M.source_line}`:null,jQ=X.thread??[],c=Q.mode==="edit"&&jQ.length>0,z4=c,V4=c?[{role:"human",content:X.comment??"",at:X.inserted_at},...jQ]:[];return V`<div
    class="popup"
    style=${W}
    ?data-dragging=${J}
    @dragenter=${B}
    @dragover=${P}
    @dragleave=${H}
    @drop=${I}
  >
    ${Q.mode==="new"&&J?V`<div class="dropzone"><span>${t} Drop image to attach</span></div>`:null}
    <div class="hdr" title="More info" @click=${F}>
      <span class="title">${M.element}</span>
      <span class="chev" ?data-open=${z}>${N3}</span>
    </div>
    <div class="details" ?data-open=${z}>
      <div class="details-inner">
        <div class="details-pad">
          ${kQ?XQ("Source",kQ):null} ${M.component?XQ("Component",M.component):null}
          ${M.element_path?XQ("Selector",M.element_path):null}
          ${M.css_classes?XQ("Classes",M.css_classes):null}
        </div>
      </div>
    </div>
    ${M.selected_text?V`<div class="quote">${M.selected_text}</div>`:null}
    ${c?g4(V4):V`<textarea
          placeholder="What should change here? (paste a screenshot to attach)"
          autocomplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-bwignore
          data-form-type="other"
          .value=${$}
          @input=${K}
          @keydown=${G}
          @paste=${N}
        ></textarea>`}
    ${Q.mode==="new"?d4(q,Y):h4(X)}
    ${z4?V`<div class="reply">
          <textarea
            placeholder="Reply to the agent…"
            autocomplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-bwignore
            data-form-type="other"
            .value=${Z}
            @input=${p}
            @keydown=${$4}
          ></textarea>
          <button class="reply-send" aria-label="Send reply" ?disabled=${Z.trim()===""} @click=${q4}>
            ${P3}
          </button>
        </div>`:null}
    <div class="actions">
      ${Q.mode==="edit"?V`<button class="del" title="Delete" @click=${J4}>${e}</button>`:null}
      <span class="spacer"></span>
      ${c?V`<button class="ghost" @click=${RQ}>Close</button>`:V`<button class="ghost" @click=${RQ}>Cancel</button>
            <button class="solid" ?disabled=${$.trim()===""} @click=${Z4}>
              ${Q.mode==="edit"?"Save":"Add"}
            </button>`}
    </div>
  </div>`},f3=D`
  .popup {
    position: fixed;
    z-index: 100001;
    width: 288px;
    background: var(--surface);
    color: var(--text);
    border-radius: 16px;
    box-shadow:
      0 6px 28px rgba(0, 0, 0, 0.32),
      var(--surface-edge);
    padding: 12px 14px 14px;
    font-weight: 500;
    transform-origin: top center;
    animation: pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  /* Drop-zone overlay shown while dragging an image over a new-annotation popup. */
  .dropzone {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    border: 2px dashed var(--accent);
    background: color-mix(in srgb, var(--accent) 16%, var(--surface));
    pointer-events: none; /* let the drop land on .popup */
  }
  .dropzone span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text);
  }
  .dropzone svg {
    width: 16px;
    height: 16px;
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: scale(0.94) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .hdr {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    cursor: pointer;
    user-select: none;
  }
  .title {
    flex: 1;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .chev {
    display: flex;
    align-items: center;
    color: var(--text-mut);
  }
  .hdr:hover .chev {
    color: var(--text-soft);
  }
  .chev svg {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }
  .chev[data-open] svg {
    transform: rotate(180deg);
  }
  .details {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.22s ease;
  }
  .details[data-open] {
    grid-template-rows: 1fr;
  }
  .details-inner {
    overflow: hidden;
    min-height: 0;
  }
  .details-pad {
    padding-bottom: 8px;
  }
  .info-row {
    display: flex;
    gap: 10px;
    font-size: 11px;
    padding: 2px 0;
  }
  .info-row .k {
    color: var(--text-mut);
    width: 62px;
    flex: none;
  }
  .info-row code {
    color: var(--text-soft);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  textarea {
    width: 100%;
    min-height: 60px;
    resize: vertical;
    background: var(--field);
    color: var(--text);
    border: none;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
    outline: none;
    box-shadow: var(--well-edge);
    transition: box-shadow 0.15s ease;
  }
  textarea:focus {
    box-shadow:
      inset 0 0 0 1px var(--accent),
      var(--well-edge);
  }
  .attachments {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }
  .thumb {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--line);
    background: var(--field);
  }
  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .thumb-x {
    all: unset;
    position: absolute;
    top: 2px;
    right: 2px;
    box-sizing: border-box;
    width: 15px;
    height: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: #fff;
    background: rgba(0, 0, 0, 0.6);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.12s ease;
  }
  .thumb-x svg {
    width: 10px;
    height: 10px;
    display: block;
  }
  .thumb:hover .thumb-x {
    opacity: 1;
  }
  .thumb-x:hover {
    background: var(--c-red);
  }
  .quote {
    font: italic 12px/1.45 system-ui;
    color: var(--text-soft);
    background: var(--raised);
    box-shadow: var(--raised-edge);
    border-radius: 8px;
    padding: 6px 9px;
    margin-bottom: 8px;
    max-height: 62px;
    overflow: auto;
    border-left: 2px solid var(--accent);
  }
  .thread {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
    /* side padding + matching negative margin: room for the bubble shadows without
       shifting content (overflow-y:auto would otherwise clip them). */
    margin-inline: -8px;
    max-height: 320px;
    overflow-y: auto;
    padding: 1px 8px;
  }
  .msg {
    display: flex;
    flex-direction: column;
  }
  .msg-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 3px 6px;
  }
  .msg-who {
    font-size: 10.5px;
    font-weight: 600;
  }
  .msg[data-role="agent"] .msg-who {
    color: var(--accent);
  }
  .msg[data-role="human"] .msg-who {
    color: var(--text-soft);
  }
  .msg-time {
    font-size: 10px;
    color: var(--text-mut);
  }
  .bubble {
    font-size: 12.5px;
    line-height: 1.42;
    padding: 7px 11px;
    border-radius: 11px;
    white-space: pre-wrap;
    word-break: break-word;
    background: var(--raised);
    color: var(--text);
    box-shadow: var(--raised-edge);
  }
  .code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11.5px;
    background: color-mix(in srgb, var(--text) 9%, transparent);
    border-radius: 4px;
    padding: 1px 4px;
    word-break: break-word;
  }
  .codeblock {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11.5px;
    line-height: 1.4;
    margin: 6px 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--field);
    box-shadow: var(--well-edge);
    overflow-x: auto;
    white-space: pre;
  }
  .codeblock code {
    background: none;
    padding: 0;
    font-family: inherit; /* the universal * rule sets it on <code>; re-inherit the mono stack */
  }
  .reply {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    margin-top: 10px;
  }
  .reply textarea {
    flex: 1;
    min-width: 0;
    width: auto;
    min-height: 34px;
    max-height: 90px;
    resize: none;
    font-size: 12.5px;
    padding: 7px 9px;
  }
  .reply-send {
    all: unset;
    cursor: pointer;
    flex: none;
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--accent);
    color: var(--on-accent);
    border-radius: 8px;
    transition: opacity 0.15s ease;
  }
  .reply-send svg {
    width: 15px;
    height: 15px;
  }
  .reply-send[disabled] {
    opacity: 0.4;
    cursor: default;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
  }
  .del,
  .ghost,
  .solid {
    all: unset;
    cursor: pointer;
    height: 30px;
    display: inline-flex;
    align-items: center;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
  }
  .del {
    color: var(--c-red);
    padding: 0 8px;
  }
  .del svg {
    width: 16px;
    height: 16px;
  }
  .del:hover {
    background: color-mix(in srgb, var(--c-red) 14%, transparent);
  }
  .ghost {
    color: var(--text-soft);
    padding: 0 12px;
  }
  .ghost:hover {
    background: var(--hover);
  }
  .solid {
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 600;
    padding: 0 14px;
  }
  .solid[disabled] {
    opacity: 0.4;
    cursor: default;
  }
  .spacer {
    flex: 1;
  }
`;var p4=["blue","indigo","cyan","green","yellow","orange","red"],c4="Also show annotations the agent resolved or dismissed. Hidden by default so the page only shows open feedback.",m4="Show markers from every page, not just the current one. Off by default so a marker only appears where its element lives.",w3=n,b3=({label:Q,tip:X,ariaLabel:$,on:q,onToggle:J,onTip:Z,onUntip:z})=>V`<div class="set-row">
    <span class="set-row-left">
      <span class="set-row-label" @click=${J}>${Q}</span>
      <button class="help" aria-label="What is this?" @mouseenter=${(W)=>Z(W,X)} @mouseleave=${z}>
        ${O3}
      </button>
    </span>
    <button
      class="switch"
      role="switch"
      aria-label=${$}
      aria-checked=${q?"true":"false"}
      ?data-on=${q}
      @click=${J}
    >
      <span class="knob"></span>
    </button>
  </div>`,y3=({theme:Q,accent:X,version:$,showResolved:q,showAllPages:J,connected:Z,lastSeenMsAgo:z,copied:W,regCommand:F,onToggleTheme:K,onSetAccent:G,onToggleShowResolved:N,onToggleShowAllPages:Y,onTip:B,onUntip:P,onCopy:H})=>V`<div class="settings anchored">
    <div class="set-head">
      <span class="set-brand">${W3}</span>
      <span class="set-head-right">
        ${$?V`<span class="set-version">v${$}</span>`:""}
        <button class="ctrl sm theme-toggle" aria-label="Toggle theme" @click=${K}>
          ${Q==="light"?G3:F3}
        </button>
      </span>
    </div>

    <div class="set-divider"></div>

    <div class="set-label">Accent color</div>
    <div class="swatches">
      ${p4.map((I)=>V`<button
            class="swatch"
            ?data-selected=${X===I}
            style="--sw:var(--accent-${I})"
            aria-label=${I}
            @click=${()=>G(I)}
          ></button>`)}
    </div>

    <div class="set-divider"></div>

    ${b3({label:"Show resolved",tip:c4,ariaLabel:"Show resolved annotations",on:q,onToggle:N,onTip:B,onUntip:P})}
    ${b3({label:"Show all pages",tip:m4,ariaLabel:"Show markers from all pages",on:J,onToggle:Y,onTip:B,onUntip:P})}

    <div class="set-divider"></div>

    <div class="set-mcp">
      <span class="status-dot" ?data-on=${Z}></span>
      <span class="set-mcp-text">
        ${Z?V`<span class="set-mcp-label">Agent active</span>${w3(z)?V`<span class="set-mcp-sep">·</span><span class="set-mcp-ago">${w3(z)}</span>`:""}`:V`<span class="set-mcp-label">MCP ready</span><span class="set-mcp-sep">·</span
              ><span class="set-mcp-ago">waiting for agent</span>`}
      </span>
    </div>
    <div class="reg">
      <code>${F}</code>
      <button class="copy" aria-label="Copy" @click=${H}>${W?K3:B3}</button>
    </div>
  </div>`,x3=D`
  /* Placement (position, insets, transform-origin) comes from the shared .anchored
     rules in tokens.js so the panel tracks the widget's configured corner. */
  .settings {
    z-index: 100001;
    width: 258px;
    background: var(--surface);
    color: var(--text);
    border-radius: 14px;
    box-shadow:
      0 6px 28px rgba(0, 0, 0, 0.32),
      var(--surface-edge);
    padding: 12px 14px 14px;
    font-weight: 500;
    animation: pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .set-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .set-brand {
    display: flex;
    align-items: center;
  }
  .set-brand svg {
    height: 15px;
    width: auto;
    display: block;
  }
  .set-head-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
  }
  .set-version {
    font-size: 11px;
    color: var(--text-mut);
    font-variant-numeric: tabular-nums;
  }
  /* Keep the 28px tap target but stop it from inflating the header: the negative
     vertical margin lets the button overflow the row instead of setting its
     height, and the negative right margin pulls its icon flush to the edge so the
     button's padding doesn't inset it from the popover wall. */
  .theme-toggle {
    margin: -7px -6px -7px 0;
  }
  .theme-toggle svg {
    width: 15px;
    height: 15px;
  }
  .set-label {
    font-size: 13px;
    font-weight: 400;
    color: var(--text);
    margin: 10px 0 6px;
  }
  .swatches {
    display: flex;
    gap: 9px;
    margin-bottom: 4px;
  }
  .swatch {
    all: unset;
    cursor: pointer;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--sw);
    transition:
      box-shadow 0.15s ease,
      transform 0.1s ease;
  }
  .swatch:hover {
    transform: scale(1.08);
  }
  /* Selected = inner ring (gap + smaller center) so the footprint stays 18px — no outward growth. */
  .swatch[data-selected] {
    box-shadow:
      inset 0 0 0 2px var(--sw),
      inset 0 0 0 4px var(--surface);
  }
  .set-divider {
    height: 1px;
    background: color-mix(in srgb, var(--line) 55%, transparent);
    margin: 12px 0;
  }
  .set-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .set-row + .set-row {
    margin-top: 10px;
  }
  .set-row-left {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
  }
  .set-row-label {
    font-size: 13px;
    font-weight: 400;
    color: var(--text);
    cursor: pointer;
    user-select: none;
  }
  .help {
    all: unset;
    cursor: help;
    display: flex;
    align-items: center;
    color: var(--text-mut);
    border-radius: 50%;
    transition: color 0.15s ease;
  }
  .help:hover {
    color: var(--text-soft);
  }
  .help svg {
    width: 13px;
    height: 13px;
  }
  .switch {
    all: unset;
    cursor: pointer;
    box-sizing: border-box;
    width: 23px;
    height: 15px;
    border-radius: 8px;
    background: var(--c-grey);
    padding: 2px;
    transition: background-color 0.15s ease;
    flex: none;
  }
  .switch .knob {
    display: block;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.15s ease;
  }
  .switch[data-on] {
    background: var(--accent);
  }
  .switch[data-on] .knob {
    transform: translateX(8px);
  }
  .set-mcp {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 400;
    line-height: 1;
    color: var(--text-soft);
    margin-bottom: 8px;
  }
  .set-mcp-text {
    display: inline-flex;
    align-items: baseline;
  }
  .set-mcp-sep {
    margin: 0 5px;
    opacity: 0.5;
  }
  .set-mcp-ago {
    font-size: 11px;
    opacity: 0.65;
  }
  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--c-grey);
    flex: none;
    /* Optical centering: flex centers the dot on the cap-height, but mixed-case
       text reads as centered nearer the x-height, so nudge the dot down ~0.75px. */
    transform: translateY(0.75px);
  }
  .status-dot[data-on] {
    background: var(--c-green);
  }
  .reg {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--raised);
    box-shadow: var(--raised-edge);
    border-radius: 8px;
    padding: 6px 8px;
  }
  .reg code {
    flex: 1;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .copy {
    all: unset;
    cursor: pointer;
    color: var(--text-mut);
    display: flex;
    padding: 3px;
    border-radius: 6px;
  }
  .copy:hover {
    background: var(--hover);
    color: var(--text);
  }
  .copy svg {
    width: 15px;
    height: 15px;
  }
`;var T3=[{key:"pending",label:"Pending",icon:M3},{key:"acknowledged",label:"Acknowledged",icon:I3},{key:"resolved",label:"Resolved",icon:U3},{key:"dismissed",label:"Dismissed",icon:_3}],$Q=Object.fromEntries(T3.map((Q)=>[Q.key,Q])),r4=(Q)=>$Q[Q]??$Q.pending,l4=(Q)=>{let X=Date.parse(Q??"");return Number.isNaN(X)?null:n(Date.now()-X)},o4=(Q,X)=>T3.map(({key:$})=>({key:$,n:Q.filter((q)=>q.status===$).length})).filter(($)=>$.n>0||X.includes($.key)),i4=(Q,X)=>{let $=r4(Q.status),q=s(Q.url),J=l4(Q.inserted_at),Z=Array.isArray(Q.thread)?Q.thread.filter((z)=>z.role==="human").length:0;return V`<button class="hist-card" data-status=${$.key} @click=${()=>X(Q)}>
    <span class="hist-top">
      <span class="hist-ico" data-status=${$.key} aria-hidden="true">${$.icon}</span>
      <span class="hist-label" data-status=${$.key}>${$.label}</span>
      ${J?V`<span class="hist-time">${J}</span>`:null}
    </span>
    <span class="hist-comment">${Q.comment?.trim()||V`<span class="hist-empty">No comment</span>`}</span>
    ${q||Z>0?V`<span class="hist-foot">
          ${q?V`<span class="hist-page">${q}</span>`:null}
          ${Z>0?V`<span class="hist-replies" title=${`${Z} ${Z===1?"reply":"replies"}`}
                >${H3}${Z}</span
              >`:null}
        </span>`:null}
  </button>`},S3=({annotations:Q,filter:X,onJump:$,onToggleFilter:q,onTip:J,onUntip:Z})=>{let z=X??[],W=[...Q].reverse(),F=z.length?W.filter((G)=>z.includes(G.status)):W,K=o4(Q,z);return V`<div class="history anchored">
    <div class="hist-head">
      <span class="hist-title">Annotations</span>
      <span class="hist-counts">
        ${K.map((G)=>V`<button
              class="hist-count"
              data-status=${G.key}
              ?data-active=${z.includes(G.key)}
              aria-pressed=${z.includes(G.key)}
              @click=${()=>q(G.key)}
              @mouseenter=${(N)=>J(N,$Q[G.key].label)}
              @mouseleave=${Z}
            >
              <span class="hist-cico" data-status=${G.key}>${$Q[G.key].icon}</span>${G.n}
            </button>`)}
      </span>
    </div>
    <div class="hist-list">
      ${F.length?F.map((G)=>i4(G,$)):V`<div class="hist-none">${Q.length?"No matching annotations.":"No annotations yet."}</div>`}
    </div>
  </div>`},v3=D`
  /* Placement (position, insets, transform-origin) comes from the shared .anchored
     rules in tokens.js so the panel tracks the widget's configured corner. */
  .history {
    z-index: 100001;
    width: 300px;
    background: var(--surface);
    color: var(--text);
    border-radius: 14px;
    box-shadow:
      0 6px 28px rgba(0, 0, 0, 0.32),
      var(--surface-edge);
    padding: 12px 9px 9px;
    font-weight: 300;
    animation: pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .hist-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 6px;
  }
  .hist-title {
    font-size: 14px;
    font-weight: 400;
    color: var(--text);
  }
  .hist-counts {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  /* Count chip = a status filter toggle. Active chips get a filled pill; when any
     filter is on, inactive chips dim so the active selection reads clearly. */
  .hist-count {
    all: unset;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 500;
    color: var(--text-soft);
    font-variant-numeric: tabular-nums;
    transition:
      background 0.12s ease,
      opacity 0.12s ease;
  }
  .hist-count:hover {
    background: var(--hover);
  }
  .hist-count[data-active] {
    background: var(--hover);
    color: var(--text);
  }
  .hist-counts:has([data-active]) .hist-count:not([data-active]) {
    opacity: 0.45;
  }
  /* Header filter icon: the same status hugeicon as the row, sized down. */
  .hist-cico {
    width: 12px;
    height: 12px;
    flex: none;
  }
  .hist-cico svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  /* Shared status tint for the header filter icon. */
  .hist-cico {
    color: var(--c-grey);
  }
  .hist-cico[data-status="pending"] {
    color: var(--accent);
  }
  .hist-cico[data-status="acknowledged"] {
    color: var(--c-amber);
  }
  .hist-cico[data-status="resolved"] {
    color: var(--c-green);
  }
  .hist-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin: 10px -2px 0;
    max-height: 360px;
    overflow-y: auto;
    /* room for each card's raised-edge shadow (overflow-y:auto also clips x) */
    padding: 2px;
  }
  /* Each annotation is a raised card with a status-colored left rail. */
  .hist-card {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: grid;
    row-gap: 5px;
    width: 100%;
    padding: 8px 11px 9px 12px;
    border-radius: 10px;
    background: var(--raised);
    box-shadow: var(--raised-edge);
    border-left: 3px solid var(--c-grey);
    transition:
      background 0.12s ease,
      transform 0.08s ease;
  }
  .hist-card[data-status="pending"] {
    border-left-color: var(--accent);
  }
  .hist-card[data-status="acknowledged"] {
    border-left-color: var(--c-amber);
  }
  .hist-card[data-status="resolved"] {
    border-left-color: var(--c-green);
  }
  /* "Won't do" reads as the quietest state. */
  .hist-card[data-status="dismissed"] {
    opacity: 0.72;
  }
  .hist-card:hover {
    background: color-mix(in srgb, var(--text) 4%, var(--raised));
    opacity: 1;
  }
  .hist-card:active {
    transform: scale(0.99);
  }
  /* Header line: status marker + word, with the age pushed to the right edge. */
  .hist-top {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .hist-ico {
    width: 13px;
    height: 13px;
    flex: none;
    color: var(--c-grey);
  }
  .hist-ico svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .hist-ico[data-status="pending"] {
    color: var(--accent);
  }
  .hist-ico[data-status="acknowledged"] {
    color: var(--c-amber);
  }
  .hist-ico[data-status="resolved"] {
    color: var(--c-green);
  }
  .hist-label {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--c-grey);
  }
  .hist-label[data-status="pending"] {
    color: var(--accent);
  }
  .hist-label[data-status="acknowledged"] {
    color: var(--c-amber);
  }
  .hist-label[data-status="resolved"] {
    color: var(--c-green);
  }
  .hist-time {
    margin-left: auto;
    flex: none;
    font-size: 10.5px;
    color: var(--text-mut);
    font-variant-numeric: tabular-nums;
  }
  .hist-comment {
    font-size: 13px;
    font-weight: 300;
    line-height: 1.4;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hist-empty {
    color: var(--text-mut);
    font-style: italic;
  }
  .hist-foot {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .hist-page {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    color: var(--text-soft);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1;
  }
  .hist-replies {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10.5px;
    color: var(--text-mut);
    font-variant-numeric: tabular-nums;
  }
  .hist-replies svg {
    display: block;
    width: 12px;
    height: 12px;
  }
  .hist-none {
    padding: 18px 8px 20px;
    text-align: center;
    font-size: 13px;
    font-weight: 300;
    color: var(--text-mut);
  }
`;var u3={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},g3=(Q)=>(...X)=>({_$litDirective$:Q,values:X});class CQ{constructor(Q){}get _$AU(){return this._$AM._$AU}_$AT(Q,X,$){this._$Ct=Q,this._$AM=X,this._$Ci=$}_$AS(Q,X){return this.update(Q,X)}update(Q,X){return this.render(...X)}}var{I:a4}=rQ,d3=(Q)=>Q;var h3=()=>document.createComment(""),b=(Q,X,$)=>{let q=Q._$AA.parentNode,J=X===void 0?Q._$AB:X._$AA;if($===void 0){let Z=q.insertBefore(h3(),J),z=q.insertBefore(h3(),J);$=new a4(Z,z,Q,Q.options)}else{let Z=$._$AB.nextSibling,z=$._$AM,W=z!==Q;if(W){let F;$._$AQ?.(Q),$._$AM=Q,$._$AP!==void 0&&(F=Q._$AU)!==z._$AU&&$._$AP(F)}if(Z!==J||W){let F=$._$AA;for(;F!==Z;){let K=d3(F).nextSibling;d3(q).insertBefore(F,J),F=K}}}return $},L=(Q,X,$=Q)=>(Q._$AI(X,$),Q),s4={},p3=(Q,X=s4)=>Q._$AH=X,c3=(Q)=>Q._$AH,qQ=(Q)=>{Q._$AR(),Q._$AA.remove()};var m3=(Q,X,$)=>{let q=new Map;for(let J=X;J<=$;J++)q.set(Q[J],J);return q},r3=g3(class extends CQ{constructor(Q){if(super(Q),Q.type!==u3.CHILD)throw Error("repeat() can only be used in text expressions")}dt(Q,X,$){let q;$===void 0?$=X:X!==void 0&&(q=X);let J=[],Z=[],z=0;for(let W of Q)J[z]=q?q(W,z):z,Z[z]=$(W,z),z++;return{values:Z,keys:J}}render(Q,X,$){return this.dt(Q,X,$).values}update(Q,[X,$,q]){let J=c3(Q),{values:Z,keys:z}=this.dt(X,$,q);if(!Array.isArray(J))return this.ut=z,Z;let W=this.ut??=[],F=[],K,G,N=0,Y=J.length-1,B=0,P=Z.length-1;for(;N<=Y&&B<=P;)if(J[N]===null)N++;else if(J[Y]===null)Y--;else if(W[N]===z[B])F[B]=L(J[N],Z[B]),N++,B++;else if(W[Y]===z[P])F[P]=L(J[Y],Z[P]),Y--,P--;else if(W[N]===z[P])F[P]=L(J[N],Z[P]),b(Q,F[P+1],J[N]),N++,P--;else if(W[Y]===z[B])F[B]=L(J[Y],Z[B]),b(Q,J[N],J[Y]),Y--,B++;else if(K===void 0&&(K=m3(z,B,P),G=m3(W,N,Y)),K.has(W[N]))if(K.has(W[Y])){let H=G.get(z[B]),I=H!==void 0?J[H]:null;if(I===null){let p=b(Q,J[N]);L(p,Z[B]),F[B]=p}else F[B]=L(I,Z[B]),b(Q,J[N],I),J[H]=null;B++}else qQ(J[Y]),Y--;else qQ(J[N]),N++;for(;B<=P;){let H=b(Q,F[P+1]);L(H,Z[B]),F[B++]=H}for(;N<=Y;){let H=J[N++];H!==null&&qQ(H)}return this.ut=z,p3(Q,F),_}});var l3=({markers:Q,onEdit:X})=>V`<div class="markers">
    ${r3(Q,($)=>$.ann.id,($)=>V`<div
          class="marker"
          data-status=${$.ann.status||"pending"}
          style="left:${$.vp.x}px;top:${$.vp.y}px"
          @click=${(q)=>{q.stopPropagation(),X($.ann)}}
        >
          ${$.n}
        </div>`)}
  </div>`,o3=D`
  .markers {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 99998;
  }
  .marker,
  .add-pin {
    position: fixed;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.25),
      inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  }
  .marker {
    pointer-events: auto;
    cursor: pointer;
    font: 600 11px system-ui;
    z-index: 99998;
    transition:
      background 0.3s ease,
      transform 0.12s ease;
    animation: mark 0.28s cubic-bezier(0.22, 1, 0.3, 1);
  }
  @keyframes mark {
    from {
      transform: translate(-50%, -50%) scale(0.3);
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  .marker:hover {
    transform: translate(-50%, -50%) scale(1.12);
  }
  .marker[data-status="pending"] {
    background: var(--accent);
    color: var(--on-accent);
  }
  .marker[data-status="acknowledged"] {
    background: var(--c-amber);
  }
  .marker[data-status="resolved"] {
    background: var(--c-green);
  }
  .marker[data-status="dismissed"] {
    background: var(--c-grey);
    opacity: 0.55;
  }
  .add-pin {
    z-index: 100000;
    background: var(--accent);
    color: var(--on-accent);
    pointer-events: none;
    animation: pinpop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .add-pin svg {
    width: 16px;
    height: 16px;
  }
  @keyframes pinpop {
    from {
      transform: translate(-50%, -50%) scale(0.3);
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;var i3=D`
  .hl {
    position: fixed;
    z-index: 99997;
    pointer-events: none;
    border: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
    background: color-mix(in srgb, var(--accent) 6%, transparent);
    border-radius: 4px;
    transition: all 0.07s ease;
  }
  .cursor-tip {
    position: fixed;
    z-index: 100002;
    pointer-events: none;
    background: var(--surface);
    color: var(--text);
    font: 500 12px system-ui;
    padding: 4px 8px;
    border-radius: 6px;
    box-shadow:
      0 2px 10px rgba(0, 0, 0, 0.3),
      var(--surface-edge);
    white-space: nowrap;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bar-tip {
    position: fixed;
    z-index: 100002;
    transform: translate(-50%, -100%);
    pointer-events: none;
    background: var(--surface);
    color: var(--text);
    font: 400 12px system-ui;
    padding: 5px 9px;
    border-radius: 7px;
    box-shadow:
      0 2px 10px rgba(0, 0, 0, 0.3),
      var(--surface-edge);
    max-width: 210px;
    text-align: center;
    line-height: 1.35;
  }
`;var a3="annotai-theme",s3="annotai-accent",n3="annotai-show-resolved",e3="annotai-show-all-pages",JQ="annotai-draft",LQ="annotai-focus",n4=1e4,e4=2000,t4=400,t3=["pointerdown","mousedown","mouseup","click","focusin"],Q4=()=>location.pathname+location.search+location.hash,h="annotai-selecting";function Q6(){if(document.getElementById(h))return;let Q=Object.assign(document.createElement("style"),{id:h,textContent:`html.${h} *:not(annotai-widget) { cursor: crosshair !important }`});document.head.appendChild(Q)}class X4 extends E{static properties={theme:{reflect:!0,attribute:"data-annotai-theme"},accent:{reflect:!0,attribute:"data-annotai-accent"},open:{state:!0},settingsOpen:{state:!0},historyOpen:{state:!0},historyFilter:{state:!0},revealId:{state:!0},showResolved:{state:!0},showAllPages:{state:!0},connected:{state:!0},lastSeenMsAgo:{state:!0},copied:{state:!0},annotations:{state:!0},compose:{state:!0},comment:{state:!0},attachments:{state:!0},dragging:{state:!0},replyText:{state:!0},detailsOpen:{state:!0},hoverRect:{state:!0},cursorTip:{state:!0},barTip:{state:!0}};constructor(){super();this.theme=localStorage.getItem(a3)||"dark",this.accent=localStorage.getItem(s3)||"blue";let Q=document.querySelector("script[data-annotai-version]");this.version=Q?.dataset.annotaiVersion||null,this._corner=Q?.dataset.annotaiCorner||null,this._insetH=Q?.dataset.annotaiInsetH||null,this._insetV=Q?.dataset.annotaiInsetV||null,this.open=!1,this.settingsOpen=!1,this.historyOpen=!1,this.historyFilter=[],this.revealId=null,this.showResolved=localStorage.getItem(n3)==="1",this.showAllPages=localStorage.getItem(e3)==="1",this.connected=!1,this.lastSeenMsAgo=null,this.copied=!1,this.annotations=[],this.compose=null,this.comment="",this.attachments=[],this.dragging=!1,this._dragDepth=0,this.replyText="",this.detailsOpen=!1,this.hoverRect=null,this.cursorTip=null,this.barTip=null,this._raf=!1,this._move=null,this._skipNextClick=!1,this._refreshing=!1,this._threadKey=null,this._onClick=this._onClick.bind(this),this._onMove=this._onMove.bind(this),this._onUp=this._onUp.bind(this),this._onKey=this._onKey.bind(this),this._shield=this._shield.bind(this),this._onViewportChange=()=>{if(this.open)this.requestUpdate()},this._lastPath=location.pathname,this._onNavigate=()=>{if(location.pathname!==this._lastPath)this._lastPath=location.pathname,this.requestUpdate()},this._draftStored=!1,this._submitting=!1,this._openedByRestore=!1,this._restoreDraft();try{this._pendingFocusId=sessionStorage.getItem(LQ),sessionStorage.removeItem(LQ)}catch(X){this._pendingFocusId=null}this._pendingFocusAt=Date.now()}connectedCallback(){super.connectedCallback(),this._applyPlacement(),Q6(),document.addEventListener("click",this._onClick,!0),document.addEventListener("mousemove",this._onMove,!0),document.addEventListener("mouseup",this._onUp,!0),document.addEventListener("keydown",this._onKey,!0),window.addEventListener("scroll",this._onViewportChange,!0),window.addEventListener("resize",this._onViewportChange),window.addEventListener("popstate",this._onNavigate),window.addEventListener("phx:page-loading-stop",this._onNavigate);for(let Q of t3)window.addEventListener(Q,this._shield,!0);if(this._keepInteractive=new MutationObserver(()=>{if(this.hasAttribute("inert"))this.removeAttribute("inert")}),this._keepInteractive.observe(this,{attributes:!0,attributeFilter:["inert"]}),this.hasAttribute("inert"))this.removeAttribute("inert");this._pollTimer=setInterval(()=>{if(this._refresh(),this.settingsOpen)this._pollStatus()},e4),this._refresh()}_applyPlacement(){if(!this._corner)return;let[Q,X]=this._corner.split("-");for(let $ of["top","right","bottom","left"])this.style.setProperty(`--annotai-inset-${$}`,"auto");this.style.setProperty(`--annotai-inset-${X}`,this._insetH),this.style.setProperty(`--annotai-inset-${Q}`,this._insetV),this.setAttribute("data-annotai-corner",this._corner)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onClick,!0),document.removeEventListener("mousemove",this._onMove,!0),document.removeEventListener("mouseup",this._onUp,!0),document.removeEventListener("keydown",this._onKey,!0),window.removeEventListener("scroll",this._onViewportChange,!0),window.removeEventListener("resize",this._onViewportChange),window.removeEventListener("popstate",this._onNavigate),window.removeEventListener("phx:page-loading-stop",this._onNavigate);for(let Q of t3)window.removeEventListener(Q,this._shield,!0);this._keepInteractive?.disconnect(),clearInterval(this._pollTimer),document.documentElement.classList.remove(h)}get selecting(){return this.open&&!this.compose&&!this.settingsOpen&&!this.historyOpen}firstUpdated(){if(this.compose)this._focusInput()}updated(){if(document.documentElement.classList.toggle(h,this.selecting),!this.selecting){if(this.hoverRect)this.hoverRect=null;if(this.cursorTip)this.cursorTip=null}if(this.revealId&&this.compose?.id!==this.revealId)this.revealId=null;this._autoScrollThread(),this._persistDraft()}_persistDraft(){if(this.compose&&!this._submitting)this._writeDraft({path:Q4(),compose:this.compose,comment:this.comment,replyText:this.replyText,detailsOpen:this.detailsOpen,attachments:this.attachments}),this._draftStored=!0;else if(this._draftStored){try{sessionStorage.removeItem(JQ)}catch(Q){}this._draftStored=!1}}_writeDraft(Q){try{sessionStorage.setItem(JQ,JSON.stringify(Q))}catch(X){try{sessionStorage.setItem(JQ,JSON.stringify({...Q,attachments:[]}))}catch($){}}}_restoreDraft(){let Q;try{Q=JSON.parse(sessionStorage.getItem(JQ)||"null")}catch(X){return}if(!Q||!Q.compose||Q.path!==Q4())return;this.open=!0,this.compose=Q.compose,this.comment=Q.comment||"",this.replyText=Q.replyText||"",this.detailsOpen=!!Q.detailsOpen,this.attachments=Array.isArray(Q.attachments)?Q.attachments:[],this._draftStored=!0,this._openedByRestore=!0}async _refresh(){if(this._refreshing)return;this._refreshing=!0;try{if(this.annotations=await oQ(),this.compose?.mode==="edit"&&!this.annotations.some((Q)=>Q.id===this.compose.id)){if(this.compose=null,this.comment="",this.replyText="",this._openedByRestore)this.open=!1}if(this._openedByRestore=!1,this._pendingFocusId){let Q=this.annotations.find((X)=>X.id===this._pendingFocusId);if(this.compose||Date.now()-this._pendingFocusAt>n4)this._pendingFocusId=null;else if(Q&&this._markerVP(Q))this._pendingFocusId=null,this._focusAnnotation(Q)}}catch(Q){}finally{this._refreshing=!1}}_autoScrollThread(){if(this.compose?.mode!=="edit"){this._threadKey=null;return}let Q=this.annotations.find((q)=>q.id===this.compose.id),X=`${this.compose.id}:${Q?.thread?.length??0}`;if(X===this._threadKey)return;this._threadKey=X;let $=this.renderRoot.querySelector(".thread");if($)$.scrollTop=$.scrollHeight}_shield(Q){let X=Q.composedPath();if(!X.includes(this))return;if(Q.stopImmediatePropagation(),Q.type==="pointerdown"||Q.type==="mousedown"){if(X[0]?.closest?.("button, .hdr, .set-row-label, .marker"))Q.preventDefault();return}if(Q.type!=="click")return;Q.preventDefault(),X[0].dispatchEvent(new MouseEvent("click",{bubbles:!0,cancelable:!0,composed:!1,view:window,detail:Q.detail,button:Q.button,clientX:Q.clientX,clientY:Q.clientY,ctrlKey:Q.ctrlKey,shiftKey:Q.shiftKey,altKey:Q.altKey,metaKey:Q.metaKey}))}_onClick(Q){if(!this.open)return;if(this._skipNextClick){this._skipNextClick=!1,Q.preventDefault(),Q.stopImmediatePropagation();return}let X=Q.composedPath().includes(this);if(this.compose){if(X)return;Q.preventDefault(),Q.stopImmediatePropagation(),this._shake();return}if(this.settingsOpen){if(X)return;Q.preventDefault(),Q.stopImmediatePropagation(),this.settingsOpen=!1;return}if(this.historyOpen){if(X)return;Q.preventDefault(),Q.stopImmediatePropagation(),this.historyOpen=!1;return}if(X)return;Q.preventDefault(),Q.stopImmediatePropagation(),this._startNew(Q)}_onMove(Q){if(!this.selecting||Q.composedPath().includes(this)){if(this.hoverRect||this.cursorTip)this.hoverRect=null,this.cursorTip=null;return}if(this._move=Q,this._raf)return;this._raf=!0,requestAnimationFrame(()=>{this._raf=!1;let X=this._move,$=X&&X.target;if(!$||$.nodeType!==1||!$.isConnected){this.hoverRect=null,this.cursorTip=null;return}let q=$.getBoundingClientRect();this.hoverRect={left:q.left-2,top:q.top-2,width:q.width+4,height:q.height+4},this.cursorTip={x:X.clientX,y:X.clientY,label:MQ($)}})}_onUp(Q){if(!this.selecting||Q.composedPath().includes(this))return;let X=window.getSelection(),$=X?X.toString().trim():"";if(!X||!$||X.isCollapsed)return;Q.stopPropagation();let q=X.getRangeAt(0),J=q.getBoundingClientRect(),Z=q.commonAncestorContainer;if(Z.nodeType===3)Z=Z.parentElement;let z={x:(J.left+J.right)/2,y:J.bottom},W={x:z.x+window.scrollX,y:z.y+window.scrollY};this.compose={mode:"new",point:W,info:IQ(Z,$.slice(0,500),z)},this.comment="",this._clearAttachState(),this.detailsOpen=!1,this._skipNextClick=!0,setTimeout(()=>this._skipNextClick=!1,t4),this._focusInput()}_onKey(Q){if((Q.key==="x"||Q.key==="X")&&!Q.metaKey&&!Q.ctrlKey&&!Q.altKey){if(!this.open||this.compose||this.settingsOpen||this.historyOpen||this._isTyping(Q))return;Q.preventDefault(),this.clearAll();return}if(Q.key!=="Escape")return;if(this.barTip=null,this.compose)Q.preventDefault(),Q.stopPropagation(),this.cancel();else if(this.settingsOpen)Q.preventDefault(),Q.stopPropagation(),this.settingsOpen=!1;else if(this.historyOpen)Q.preventDefault(),Q.stopPropagation(),this.historyOpen=!1;else if(this.open)Q.preventDefault(),Q.stopPropagation(),this.open=!1}_isTyping(Q){let X=Q.composedPath()[0];if(!X||!X.tagName)return!1;let $=X.tagName.toLowerCase();return $==="input"||$==="textarea"||X.isContentEditable}_shake(){let Q=this.renderRoot.querySelector(".popup");if(!Q||typeof Q.animate!=="function")return;Q.animate([0,-5,5,-4,4,-2,2,0].map((X)=>({transform:`translateX(${X}px)`})),{duration:380,easing:"ease-in-out"})}_startNew(Q){let X={x:Q.clientX+window.scrollX,y:Q.clientY+window.scrollY},$=window.getSelection()?.toString().trim().slice(0,500)??"",q=IQ(Q.target,$,{x:Q.clientX,y:Q.clientY});this.compose={mode:"new",point:X,info:q},this.comment="",this._clearAttachState(),this.detailsOpen=!1,this._focusInput()}_editMarker(Q){let X=this._markerVP(Q)||{x:window.innerWidth/2,y:window.innerHeight/2},$={x:X.x+window.scrollX,y:X.y+window.scrollY};this.compose={mode:"edit",id:Q.id,point:$,info:Q},this.comment=Q.comment||"",this._clearAttachState(),this.replyText="",this.detailsOpen=!1,this._focusInput()}toggleDetails(){this.detailsOpen=!this.detailsOpen}_focusInput(){this.updateComplete.then(()=>{let Q=this.renderRoot.querySelector("textarea");if(Q)Q.focus()})}_dismiss(Q){this.revealId=null;let X=this.renderRoot.querySelector(".popup"),$=()=>{if(this.compose=null,this.comment="",this._clearAttachState(),this.replyText="",this.detailsOpen=!1,this._submitting=!1,Q)Q()};if(!X||typeof X.animate!=="function")return $();let q=X.animate([{opacity:1},{opacity:0,transform:"scale(.96) translateY(-4px)"}],{duration:130,easing:"ease-in"});q.onfinish=$,q.oncancel=$}cancel(){this._dismiss()}submit(){let Q=this.comment.trim();if(Q===""||!this.compose)return;let X=this.compose;this._submitting=!0,this._persistDraft(),(X.mode==="edit"?aQ(X.id,{comment:Q}):iQ({...X.info,comment:Q,point:X.point,status:"pending",images:this._imagePayload()})).then(()=>{this._dismiss(),this._refresh()}).catch(()=>{this._submitting=!1,this._persistDraft(),this._shake()})}_imagePayload(){return this.attachments.flatMap((Q)=>{let X=Z3(Q.dataUrl);return X?[{mime:X.mime,data:X.data,width:Q.width,height:Q.height}]:[]})}async _ingestImages(Q){for(let X of Q){if(this.attachments.length>=J3)break;try{let $=await V3(X);if($)this.attachments=[...this.attachments,{id:z3(),...$}]}catch($){}}}async _onPaste(Q){let X=UQ(Q.clipboardData);if(X.length===0)return;Q.preventDefault(),await this._ingestImages(X)}_canDrop(Q){return this.compose?.mode==="new"&&Array.from(Q.dataTransfer?.types??[]).includes("Files")}_onDragEnter(Q){if(!this._canDrop(Q))return;Q.preventDefault(),this._dragDepth++,this.dragging=!0}_onDragOver(Q){if(this._canDrop(Q))Q.preventDefault()}_onDragLeave(Q){if(!this._canDrop(Q))return;if(--this._dragDepth<=0)this._dragDepth=0,this.dragging=!1}async _onDrop(Q){if(!this._canDrop(Q))return;Q.preventDefault(),this.dragging=!1,this._dragDepth=0,await this._ingestImages(UQ(Q.dataTransfer))}_removeAttachment(Q){this.attachments=this.attachments.filter((X)=>X.id!==Q)}_clearAttachState(){this.attachments=[],this.dragging=!1,this._dragDepth=0}del(){if(this.compose&&this.compose.mode==="edit")nQ(this.compose.id).then(()=>{this._dismiss(),this._refresh()})}_onInputKey(Q){if(Q.key==="Enter"&&!Q.shiftKey)Q.preventDefault(),this.submit()}_sendReply(){let Q=this.replyText.trim();if(Q===""||!this.compose||this.compose.mode!=="edit")return;this._submitting=!0,this._persistDraft(),sQ(this.compose.id,Q).then(()=>{this._submitting=!1,this.replyText="",this._refresh()}).catch(()=>{this._submitting=!1,this._persistDraft(),this._shake()})}_onReplyKey(Q){if(Q.key==="Enter"&&!Q.shiftKey)Q.preventDefault(),this._sendReply()}toggleOpen(){if(this.open=!this.open,this.barTip=null,!this.open)this.compose=null,this.settingsOpen=!1,this.historyOpen=!1}close(){this.open=!1,this.compose=null,this.settingsOpen=!1,this.historyOpen=!1,this.barTip=null}_tip(Q,X){let $=Q.currentTarget.getBoundingClientRect();this.barTip={x:$.left+$.width/2,y:$.top-8,label:X}}_untip(){this.barTip=null}toggleTheme(){this.theme=this.theme==="light"?"dark":"light",localStorage.setItem(a3,this.theme)}setAccent(Q){this.accent=Q,localStorage.setItem(s3,Q)}toggleShowResolved(){this.showResolved=!this.showResolved,localStorage.setItem(n3,this.showResolved?"1":"0")}toggleShowAllPages(){this.showAllPages=!this.showAllPages,localStorage.setItem(e3,this.showAllPages?"1":"0")}toggleSettings(){if(this.settingsOpen=!this.settingsOpen,this.settingsOpen)this.historyOpen=!1,this._pollStatus()}toggleHistory(){if(this.historyOpen=!this.historyOpen,this.historyOpen){if(this.settingsOpen=!1,this.historyFilter=[],this.compose)this.cancel()}}_toggleHistoryFilter(Q){this.historyFilter=this.historyFilter.includes(Q)?this.historyFilter.filter((X)=>X!==Q):[...this.historyFilter,Q]}_onThisPage(Q){if(!Q.url)return!0;if(this._samePath(Q.url))return!0;return a(Q)&&!!g(Q)}_jumpTo(Q){if(this._onThisPage(Q)){this.historyOpen=!1,this._focusAnnotation(Q);return}try{sessionStorage.setItem(LQ,Q.id)}catch(X){}try{let X=new URL(Q.url,location.href);location.href=new URL(X.pathname+X.search+X.hash,location.href).href}catch(X){location.href=Q.url}}_focusAnnotation(Q){this.open=!0;let X=g(Q);if(X)X.scrollIntoView?.({block:"center",inline:"nearest",behavior:"instant"});else if(Q.point)window.scrollTo?.({top:Math.max(0,Q.point.y-window.innerHeight/2),behavior:"instant"});this._editMarker(Q),this.revealId=Q.id}async _pollStatus(){let Q=await tQ();this.connected=!!Q.connected,this.lastSeenMsAgo=typeof Q.last_seen_ms_ago==="number"?Q.last_seen_ms_ago:null}get regCommand(){return`claude mcp add --transport http annotai http://${location.host}/annotai/mcp`}async copyReg(){try{await navigator.clipboard.writeText(this.regCommand),this.copied=!0,setTimeout(()=>this.copied=!1,1500)}catch(Q){}}clearAll(){eQ().then(()=>this._refresh())}_vp(Q){return{x:Q.x-window.scrollX,y:Q.y-window.scrollY}}_samePath(Q){return!!Q&&s(Q)===location.pathname}_markerVP(Q){let X=g(Q);if(X){let $=X.getBoundingClientRect();if((this.showAllPages||a(Q)||this._samePath(Q.url))&&($.width>0||$.height>0)){let J=Q.anchor_frac&&Number.isFinite(Q.anchor_frac.x)&&Number.isFinite(Q.anchor_frac.y)?Q.anchor_frac:{x:1,y:0};return{x:$.left+J.x*$.width,y:$.top+J.y*$.height}}}if(!Q.point)return null;if(this.showAllPages||!Q.url||this._samePath(Q.url))return this._vp(Q.point);return null}_activeHL(){if(this.compose?.mode!=="edit")return null;let Q=this.annotations.find((J)=>J.id===this.compose.id)??this.compose.info,X=g(Q);if(!X)return null;if(!(this.showAllPages||a(Q)||this._samePath(Q.url)))return null;let q=X.getBoundingClientRect();if(q.width===0&&q.height===0)return null;return{left:q.left-2,top:q.top-2,width:q.width+4,height:q.height+4}}_popupStyle(Q){let J=Math.min(Math.max(8,Q.x-144),window.innerWidth-288-8);return Q.y<window.innerHeight/2?`left:${J}px;top:${Q.y+26}px`:`left:${J}px;bottom:${window.innerHeight-(Q.y-26)}px`}render(){let Q=q3(this.annotations,this.showResolved);if(this.revealId&&!Q.some((Z)=>Z.id===this.revealId)){let Z=this.annotations.find((z)=>z.id===this.revealId);if(Z)Q=[...Q,Z]}let X=Q.map((Z)=>({ann:Z,vp:this._markerVP(Z)})).filter((Z)=>Z.vp).map((Z,z)=>({...Z,n:z+1})),$=X.length,q=!this.open&&$>0,J=this._activeHL();return V`
      ${this.open?this._renderMarkers(X):null}
      ${J?V`<div
            class="hl"
            style="left:${J.left}px;top:${J.top}px;width:${J.width}px;height:${J.height}px"
          ></div>`:null}
      ${this.selecting&&this.hoverRect?V`<div
            class="hl"
            style="left:${this.hoverRect.left}px;top:${this.hoverRect.top}px;width:${this.hoverRect.width}px;height:${this.hoverRect.height}px"
          ></div>`:null}
      ${this.selecting&&this.cursorTip?V`<div class="cursor-tip" style="left:${this.cursorTip.x+14}px;top:${this.cursorTip.y+16}px">
            ${this.cursorTip.label}
          </div>`:null}
      ${this.compose&&this.compose.mode==="new"?(()=>{let Z=this._vp(this.compose.point);return V`<div class="add-pin" style="left:${Z.x}px;top:${Z.y}px">${t}</div>`})():null}
      ${this._renderToolbar($,q)} ${this.settingsOpen?this._renderSettings():null}
      ${this.historyOpen?this._renderHistory():null}
      ${this.barTip?V`<div class="bar-tip" style="left:${this.barTip.x}px;top:${this.barTip.y}px">${this.barTip.label}</div>`:null}
      ${this.compose?this._renderPopup():null}
    `}_renderMarkers(Q){return l3({markers:Q,onEdit:(X)=>this._editMarker(X)})}_renderToolbar(Q,X){return L3({open:this.open,settingsOpen:this.settingsOpen,historyOpen:this.historyOpen,count:Q,showBadge:X,onToggleOpen:this.toggleOpen,onToggleSettings:this.toggleSettings,onToggleHistory:this.toggleHistory,onClearAll:this.clearAll,onClose:this.close,onTip:($,q)=>this._tip($,q),onUntip:this._untip})}_renderPopup(){let Q=this.compose,X=Q.mode==="edit"?this.annotations.find(($)=>$.id===Q.id)??Q.info:Q.info;return E3({compose:this.compose,annotation:X,comment:this.comment,attachments:this.attachments,dragging:this.dragging,replyText:this.replyText,detailsOpen:this.detailsOpen,popupStyle:this._popupStyle(this._vp(this.compose.point)),onToggleDetails:this.toggleDetails,onInput:($)=>this.comment=$.target.value,onInputKey:this._onInputKey,onPaste:($)=>this._onPaste($),onRemoveImage:($)=>this._removeAttachment($),onDragEnter:($)=>this._onDragEnter($),onDragOver:($)=>this._onDragOver($),onDragLeave:($)=>this._onDragLeave($),onDrop:($)=>this._onDrop($),onReplyInput:($)=>this.replyText=$.target.value,onReplyKey:this._onReplyKey,onReplySend:this._sendReply,onCancel:this.cancel,onDelete:this.del,onSubmit:this.submit})}_renderSettings(){return y3({theme:this.theme,accent:this.accent,version:this.version,showResolved:this.showResolved,showAllPages:this.showAllPages,connected:this.connected,lastSeenMsAgo:this.lastSeenMsAgo,copied:this.copied,regCommand:this.regCommand,onToggleTheme:this.toggleTheme,onSetAccent:(Q)=>this.setAccent(Q),onToggleShowResolved:this.toggleShowResolved,onToggleShowAllPages:this.toggleShowAllPages,onTip:(Q,X)=>this._tip(Q,X),onUntip:this._untip,onCopy:this.copyReg})}_renderHistory(){return S3({annotations:this.annotations,filter:this.historyFilter,onJump:(Q)=>this._jumpTo(Q),onToggleFilter:(Q)=>this._toggleHistoryFilter(Q),onTip:(Q,X)=>this._tip(Q,X),onUntip:this._untip})}static styles=[C3,R3,f3,x3,v3,o3,i3]}customElements.define("annotai-widget",X4);if(!window.__annotaiLoaded)window.__annotaiLoaded=!0,document.body.appendChild(document.createElement("annotai-widget"));})();
