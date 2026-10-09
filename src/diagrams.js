import dagre from '@dagrejs/dagre';
import {convertToExcalidrawElements, FONT_FAMILY} from '@excalidraw/excalidraw';

export const fontPresets = [
  {id:'Excalifont',zh:'手绘',en:'Hand-drawn',sample:'Aa',css:'Excalifont, Xiaolai, cursive'},
  {id:'Nunito',zh:'圆润',en:'Rounded',sample:'Aa',css:'Nunito, Xiaolai, sans-serif'},
  {id:'Helvetica',zh:'简洁',en:'Clean',sample:'Aa',css:'Helvetica, Arial, sans-serif'},
  {id:'Comic Shanns',zh:'代码',en:'Mono',sample:'Aa',css:'"Comic Shanns", Xiaolai, monospace'},
];
export function drawingFont(id){return FONT_FAMILY[fontPresets.find(font=>font.id===id)?.id||'Excalifont'];}

export const palettes = {
  violet: ['#e9e3ff', '#6454a4'], blue: ['#dcecff', '#476e9b'], green: ['#dff2e5', '#4a7d60'],
  yellow: ['#fff1cb', '#96793d'], pink: ['#fce2e7', '#a65b70'], gray: ['#f1f0ee', '#74716d'],
};
const node = (id, label, color='violet', kind='rectangle', extra={}) => ({id,label,color,kind,x:0,y:0,width:190,height:86,...extra});
export const templates = [
  {id:'flow',title:'实验流程图',en:'Experiment workflow',hint:'展示实验步骤、判断条件与迭代过程',hintEn:'Explain steps, decision points and iterations',type:'flowchart',direction:'LR',
    nodes:[node('idea','研究假设\n明确验证目标'),node('build','开展实验\n收集测量数据','blue'),node('check','达到预期吗？','yellow','diamond',{width:190,height:130}),node('launch','分析结果\n汇总研究结论','green')],
    edges:[{from:'idea',to:'build',label:''},{from:'build',to:'check',label:''},{from:'check',to:'launch',label:'是'},{from:'check',to:'build',label:'再打磨一下'}],
    english:['Hypothesis\nDefine the objective','Experiment\nCollect measurements','As expected?','Analyze\nSummarize findings']},
  {id:'architecture',title:'系统架构图',en:'System architecture',hint:'说明模块分层、数据流与系统关系',hintEn:'Present modules, data flows and dependencies',type:'flowchart',direction:'TB',
    nodes:[node('browser','浏览器\n画布与交互'),node('api','服务接口\n身份与权限','blue'),node('model','在线模型\n理解与生成','pink'),node('store','本地存储\n保存你的画作','green')],
    edges:[{from:'browser',to:'api',label:'生成请求'},{from:'api',to:'model',label:'结构化图表'},{from:'browser',to:'store',label:'自动保存'}],
    english:['Browser\nCanvas & interaction','Application API\nIdentity & permissions','Online model\nUnderstand & generate','Local storage\nKeep your drawings']},
  {id:'mindmap',title:'研究思维导图',en:'Research mind map',hint:'展开选题背景、方法、实验和创新点',hintEn:'Map the background, methods, experiments and contributions',type:'mindmap',direction:'LR',
    nodes:[node('main','我的研究主题'),node('why','研究背景\n现有问题与挑战','yellow'),node('who','相关工作\n已有方法与不足','blue'),node('how','研究方法\n关键设计与假设','green'),node('next','实验验证\n结果与创新点','pink')],
    edges:['why','who','how','next'].map(to=>({from:'main',to,label:''})),
    english:['Research topic','Background\nProblems & challenges','Related work\nMethods & gaps','Methods\nDesign & assumptions','Evaluation\nFindings & contributions']},
  {id:'wireframe',title:'PPT 图文布局',en:'Presentation layout',hint:'标题、核心结论与三栏图文的汇报版式',hintEn:'A slide with a headline, takeaway and three visual columns',type:'wireframe',direction:'TB',
    nodes:[node('screen','','gray','rectangle',{x:0,y:0,width:1120,height:630}),node('brand','研究进展汇报','violet','text',{x:30,y:24,width:200,height:40}),node('nav','背景    方法    结果','gray','text',{x:650,y:24,width:430,height:40}),node('headline','一句话概括研究发现','violet','text',{x:38,y:120,width:1040,height:65}),node('intro','补充研究背景、问题与本页的核心信息。','gray','text',{x:40,y:200,width:1040,height:45}),node('button','核心结论','violet','rectangle',{x:40,y:275,width:160,height:55}),node('card1','研究背景','blue','rectangle',{x:40,y:380,width:330,height:190}),node('card2','方法设计','green','rectangle',{x:395,y:380,width:330,height:190}),node('card3','实验结果','yellow','rectangle',{x:750,y:380,width:330,height:190})],edges:[],
    english:['','Research progress','Background   Method   Results','Summarize the key finding.','Explain the problem and the main takeaway.','Key finding','Background','Method','Results']},
];

// Fixed spatial compositions complement the auto-laid-out diagrams for papers and slides.
const label=(id,text,x,y,width=220,color='gray')=>node(id,text,color,'text',{x,y,width,height:44});
templates.push(
  {id:'fishbone',title:'鱼骨因果分析',en:'Fishbone analysis',hint:'梳理实验偏差、问题根因与影响因素',hintEn:'Trace causes of an experimental or practical problem',type:'wireframe',direction:'LR',
    nodes:[node('effect','研究结果偏差','violet','rectangle',{x:960,y:252,width:250,height:100}),
      ...['研究方法','数据质量','实验环境','人员因素','设备工具','评估标准'].map((text,i)=>node('cause'+i,text,['blue','green','yellow'][i%3],'rectangle',{x:80+(i%3)*280,y:i<3?20:510,width:220,height:62})),
      ...['样本选择与假设','缺失值与标注','外部条件控制','操作一致性','精度与校准','指标定义'].map((text,i)=>label('detail'+i,text,-45+(i%3)*280,i<3?123:431,250))],
    edges:[],decorations:[{type:'arrow',x:40,y:302,width:920,height:0,points:[[0,0],[920,0]],endArrowhead:'arrow',strokeWidth:2},...Array.from({length:6},(_,i)=>({type:'line',x:190+(i%3)*280,y:i<3?82:302,width:110,height:208,points:i<3?[[0,0],[110,220]]:[[110,0],[0,208]],strokeColor:['#476e9b','#4a7d60','#96793d'][i%3],strokeWidth:2}))],
    english:['Outcome variation','Methods','Data quality','Environment','People','Equipment','Evaluation','Sampling & hypotheses','Missing data & labels','Controlled conditions','Consistency','Accuracy & calibration','Metric definitions']},
  {id:'research',title:'论文技术路线',en:'Research roadmap',hint:'研究问题、方法、实验到结论的完整链路',hintEn:'Connect your question, method, evaluation and findings',type:'flowchart',direction:'TB',
    nodes:[node('question','研究问题与目标','violet','rectangle',{width:330}),node('review','文献调研\n理论依据','gray'),node('data','数据采集\n预处理','blue'),node('method','方法设计\n模型与关键假设','violet','rectangle',{width:330}),node('experiment','实验设计\n基线与对照','green'),node('ablation','消融与敏感性分析','yellow'),node('findings','结果讨论与研究结论','pink','rectangle',{width:330})],
    edges:[['question','review'],['question','data'],['review','method'],['data','method'],['method','experiment'],['method','ablation'],['experiment','findings'],['ablation','findings']].map(([from,to])=>({from,to,label:''})),
    english:['Research question & goals','Literature review\nTheoretical foundation','Data collection\nPreprocessing','Method design\nModel & assumptions','Experimental design\nBaselines & controls','Ablation & sensitivity','Discussion & conclusions']},
  {id:'timeline',title:'研究进度时间轴',en:'Research timeline',hint:'用四个阶段讲清计划与里程碑',hintEn:'Four phases with clear milestones for a presentation',type:'wireframe',direction:'LR',
    nodes:[label('title','研究计划与关键里程碑',20,0,1000,'violet'),...['01 选题与调研','02 方法与实现','03 实验与分析','04 写作与答辩'].map((text,i)=>node('phase'+i,text,['violet','blue','green','pink'][i],'rectangle',{x:20+i*300,y:145,width:265,height:80})),...['第 1–2 周\n确定问题 · 整理文献','第 3–6 周\n建立模型 · 完成实现','第 7–9 周\n对照实验 · 汇总结果','第 10–12 周\n撰写论文 · 准备汇报'].map((text,i)=>({...label('notes'+i,text,25+i*300,265,255),height:100}))],
    edges:[],decorations:[{type:'arrow',x:20,y:115,width:1170,height:0,points:[[0,0],[1170,0]],endArrowhead:'arrow',strokeColor:'#6454a4',strokeWidth:2},...Array.from({length:4},(_,i)=>({type:'line',x:150+i*300,y:115,width:0,height:30,points:[[0,0],[0,30]],strokeWidth:2}))],
    english:['Research plan & milestones','01 Explore','02 Build','03 Evaluate','04 Present','Weeks 1–2\nQuestion · Literature','Weeks 3–6\nModel · Implementation','Weeks 7–9\nControls · Results','Weeks 10–12\nPaper · Presentation']},
  {id:'comparison',title:'方案对比矩阵',en:'Comparison matrix',hint:'对比方法、优势、局限与适用场景',hintEn:'Compare strengths, limitations and use cases',type:'wireframe',direction:'LR',
    nodes:[label('title','研究方案对比',15,0,1100,'violet'),...['评价维度','方案 A','方案 B','本文方法'].flatMap((text,col)=>[node('header'+col,text,col===3?'violet':'blue','rectangle',{x:col*280,y:85,width:265,height:70}),...['核心思路','主要优势','使用局限','适用场景'].map((row,r)=>node('cell'+col+'-'+r,col===0?row:'填写对比内容',col===3?'violet':'gray','rectangle',{x:col*280,y:170+r*95,width:265,height:80}))])],edges:[],
    english:['Research approach comparison',...['Criteria','Approach A','Approach B','Our method'].flatMap((text,col)=>[text,...['Core idea','Strengths','Limitations','Use cases'].map(row=>col===0?row:'Add a comparison')])]},
);

export function templateDiagram(id, language='zh') {
  const t=templates.find(t=>t.id===id)||templates[0];
  return {title:language==='en'?t.en:t.title,summary:language==='en'?'A starting point. Make it your own.':'从这里开始，继续画出你的想法。',type:t.type,direction:t.direction,decorations:t.decorations,
    nodes:t.nodes.map((n,i)=>({...n,label:language==='en'?t.english[i]:n.label})),edges:t.edges.map(e=>({...e,label:language==='en'?(e.label==='是'?'Yes':e.label==='再打磨一下'?'Refine':e.label==='生成请求'?'Generate':e.label==='结构化图表'?'Diagram':e.label==='自动保存'?'Autosave':e.label):e.label}))};
}

export function diagramElements(diagram, offset={x:0,y:0}) {
  const fontFamily=drawingFont(diagram.fontFamily||'Helvetica');
  const fontSize=[20,24,28].includes(diagram.fontSize)?diagram.fontSize:24;
  const prefix='draw-'+crypto.randomUUID().slice(0,8)+'-';
  const positions=new Map(),routes=new Map();
  if(diagram.type!=='wireframe') {
    const graph=new dagre.graphlib.Graph({multigraph:true});graph.setGraph({rankdir:diagram.direction||'LR',nodesep:60,ranksep:95,marginx:30,marginy:30});graph.setDefaultEdgeLabel(()=>({}));
    diagram.nodes.forEach(n=>graph.setNode(n.id,{width:n.width,height:Math.max(n.height,n.label.split('\n').length*30+30)}));
    diagram.edges.forEach((e,i)=>graph.setEdge(e.from,e.to,e.label?{width:Math.min(e.label.length*13,160),height:24,labelpos:'c'}:{},String(i)));dagre.layout(graph);
    diagram.nodes.forEach(n=>{const p=graph.node(n.id);positions.set(n.id,{x:p.x-p.width/2,y:p.y-p.height/2,width:p.width,height:p.height});});
    diagram.edges.forEach((e,i)=>routes.set(i,graph.edge({v:e.from,w:e.to,name:String(i)})?.points));
  } else diagram.nodes.forEach(n=>positions.set(n.id,n));
  const shapes=diagram.nodes.map(n=>{
    const p=positions.get(n.id),[fill,stroke]=palettes[n.color]||palettes.violet;
    const base={id:prefix+n.id,type:n.kind,x:p.x+offset.x,y:p.y+offset.y,width:p.width,height:p.height,strokeColor:stroke,backgroundColor:n.kind==='text'?'transparent':fill,fillStyle:'solid',strokeWidth:1.6,roughness:1.1,roundness:n.kind==='rectangle'?{type:3}:null};
    return n.kind==='text'?{...base,text:n.label,fontSize,fontFamily,textAlign:'left'}:{...base,label:{text:n.label,fontSize,fontFamily,strokeColor:'#302c35'}};
  });
  const arrows=diagram.edges.flatMap((e,i)=>{
    if(e.from===e.to)return [];
    const from=positions.get(e.from),to=positions.get(e.to);
    let route=routes.get(i)||[{x:from.x+from.width,y:from.y+from.height/2},{x:to.x,y:to.y+to.height/2}];
    // Keep retry / feedback paths clear of the main flow and its labels.
    if(diagram.type!=='wireframe'&&diagram.direction==='LR'&&to.x<from.x){
      const below=Math.max(...[...positions.values()].map(p=>p.y+p.height))+75+i*10;
      route=[{x:from.x+from.width/2,y:from.y+from.height},{x:from.x+from.width/2,y:below},{x:to.x+to.width/2,y:below},{x:to.x+to.width/2,y:to.y+to.height}];
    }else if(diagram.type!=='wireframe'&&diagram.direction==='TB'&&to.y<from.y){
      const right=Math.max(...[...positions.values()].map(p=>p.x+p.width))+75+i*10;
      route=[{x:from.x+from.width,y:from.y+from.height/2},{x:right,y:from.y+from.height/2},{x:right,y:to.y+to.height/2},{x:to.x+to.width,y:to.y+to.height/2}];
    }
    const start=route[0];
    return [{type:'arrow',x:start.x+offset.x,y:start.y+offset.y,points:route.map(point=>[point.x-start.x,point.y-start.y]),strokeColor:'#756c80',strokeWidth:1.5,roughness:1, start:{id:prefix+e.from},end:{id:prefix+e.to},endArrowhead:'arrow',...(e.label?{label:{text:e.label,fontSize:Math.max(18,fontSize-4),fontFamily,strokeColor:'#4c4357'}}:{})}];
  });
  const decorations=(diagram.decorations||[]).map(element=>({...element,x:element.x+offset.x,y:element.y+offset.y,strokeColor:element.strokeColor||'#756c80',roughness:0.7}));
  return convertToExcalidrawElements([...decorations,...shapes,...arrows],{regenerateIds:false});
}

const DB='workstudio-draw';
function dbOpen(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB,1);request.onupgradeneeded=()=>request.result.createObjectStore('documents');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
export async function readDocument(){const db=await dbOpen();try{return await new Promise((resolve,reject)=>{const request=db.transaction('documents').objectStore('documents').get('current');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}finally{db.close();}}
export async function writeDocument(document){const db=await dbOpen();try{await new Promise((resolve,reject)=>{const transaction=db.transaction('documents','readwrite');transaction.objectStore('documents').put(document,'current');transaction.oncomplete=resolve;transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error);});}finally{db.close();}}
