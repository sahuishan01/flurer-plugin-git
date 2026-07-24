import { createMemo, Index, Show, For, onMount } from "solid-js";
import { useGit } from "../context";
import { formatTimestamp, surfaceBg } from "../utils";
import { EmptyState } from "./shared";

const LANE_W = 26, ROW_H = 34, DOT_R = 6;
const COLORS = ["#f59e0b","#60a5fa","#4ade80","#f87171","#c084fc","#2dd4bf","#fb923c","#a78bfa"];

interface GraphRow {
  hash:string; message:string; author:string; timestamp:number;
  parents:string[]; refs:string[]; lane:number; mergeLane:number;
}

function assignLanes(entries:any[]):GraphRow[]{
  const lanes:(string|null)[]=[]; const cl=new Map<string,number>();
  return entries.map(e=>{
    let lane=-1;
    for(let i=0;i<lanes.length;i++){if(lanes[i]&&e.parents.includes(lanes[i]!)){lane=i;break}}
    if(lane===-1){lane=lanes.findIndex(l=>l===null);if(lane===-1){lane=lanes.length;lanes.push(null)}}
    cl.set(e.hash,lane);
    const ml=e.parents.length>1?(cl.get(e.parents[1])??-1):-1;
    lanes[lane]=e.hash;
    return{...e,lane,mergeLane:ml};
  });
}

export function GraphView(){
  const ctx=useGit();
  onMount(()=>{if(ctx.graph().length===0)ctx.loadGraph()});
  const rows=createMemo(()=>assignLanes(ctx.graph()));
  const ml=createMemo(()=>{let m=0;for(const r of rows()){if(r.lane+1>m)m=r.lane+1;if(r.mergeLane+1>m)m=r.mergeLane+1}return Math.max(m,1)});
  const gw=()=>ml()*LANE_W+8;
  const cl=(l:number)=>COLORS[l%COLORS.length];
  const hr=createMemo(()=>{const m=new Map<string,number>();rows().forEach((r,i)=>m.set(r.hash,i));return m});

  return(
    <div style={{padding:"16px 24px",background:surfaceBg(0.04),height:"100%"}}>
      <Show when={rows().length===0}><EmptyState message="Loading graph..."/></Show>
      <Show when={rows().length>0}>
        <div style={{overflow:"auto",background:surfaceBg(0.04)}}>
          <div style={{"min-width":`${gw()+700}px`}}>
          <svg width={gw()+700} height={rows().length*ROW_H+20} style={{display:"block"}}>
            <Index each={rows()}>
              {(row,i)=>{
                const y=i*ROW_H+ROW_H/2;
                const cx=row().lane*LANE_W+LANE_W/2;
                return(
                  <g>
                    {/* parent line */}
                    <Show when={row().parents.length>0}>
                      <ParentLine hashRow={hr()} parentHash={row().parents[0]} thisY={y} thisX={cx}
                                  rows={rows()} lane={row().lane} color={cl(row().lane)}/>
                    </Show>
                    {/* merge line */}
                    <Show when={row().mergeLane>=0&&row().mergeLane!==row().lane&&row().parents.length>1}>
                      <ParentLine hashRow={hr()} parentHash={row().parents[1]} thisY={y} thisX={cx}
                                  rows={rows()} lane={row().mergeLane} color={cl(row().mergeLane)} dashed={true}/>
                    </Show>
                    {/* lane end */}
                    <Show when={i===rows().length-1}>
                      <line x1={cx-6} y1={y+DOT_R} x2={cx+6} y2={y+DOT_R}
                            stroke={cl(row().lane)} stroke-width="2" opacity="0.4"/>
                    </Show>
                    {/* dot */}
                    <circle cx={cx} cy={y} r={DOT_R} fill={cl(row().lane)}
                            stroke="var(--panel-bg,#1a1a2e)" stroke-width="2.5"/>
                    <circle cx={cx} cy={y} r={DOT_R+3} fill="none" stroke={cl(row().lane)}
                            stroke-width="1.5" opacity="0.3"/>
                    {/* refs */}
                    <Index each={row().refs}>
                      {(ref,ri)=>{
                        const rx=gw()+8+ri*130;
                        const tw=Math.min(ref().length*7.2+16,120);
                        return(<g>
                          <rect x={rx} y={y-9} width={tw} height={18} rx={4}
                                fill={cl(row().lane)} opacity="0.18"/>
                          <text x={rx+8} y={y+4} fill={cl(row().lane)}
                                font-size="10" font-weight="700" font-family="Space Mono,monospace">
                            {ref().length>14?ref().slice(0,14)+"…":ref()}
                          </text>
                        </g>);
                      }}
                    </Index>
                    {/* hash */}
                    <text x={gw()+14+Math.min(row().refs.length,3)*130} y={y+4}
                          fill="var(--accent-color,#f59e0b)" font-size="11"
                          font-family="Space Mono,monospace">{row().hash.slice(0,7)}</text>
                    {/* message */}
                    <foreignObject x={gw()+110+Math.min(row().refs.length,3)*130} y={y-10} width="320" height={ROW_H}>
                      <div xmlns="http://www.w3.org/1999/xhtml"
                           style={{"font-size":"12px",color:"var(--text-color)","line-height":`${ROW_H}px`,
                                   overflow:"hidden","text-overflow":"ellipsis","white-space":"nowrap"}}
                           title={row().message}>{row().message}</div>
                    </foreignObject>
                    {/* author+time */}
                    <text x={gw()+440+Math.min(row().refs.length,3)*130} y={y+4}
                          fill="var(--text-muted,#888)" font-size="11">
                      {row().author}{" · "}{formatTimestamp(row().timestamp)}
                    </text>
                  </g>
                );
              }}
            </Index>
          </svg>
          </div>
        </div>
      </Show>
    </div>
  );
}

// Separate component for parent-connection lines to avoid inline IIFE
function ParentLine(props:{hashRow:Map<string,number>;parentHash:string;thisY:number;thisX:number;
                          rows:GraphRow[];lane:number;color:string;dashed?:boolean}){
  const pIdx=props.hashRow.get(props.parentHash);
  if(pIdx===undefined||pIdx<=props.thisY) return null;
  const pRow=props.rows[pIdx];
  const py=pIdx*ROW_H+ROW_H/2;
  const px=pRow.lane*LANE_W+LANE_W/2;
  const dash=props.dashed?{"stroke-dasharray":"5,4"}:{};
  if(px===props.thisX){
    return<line x1={props.thisX} y1={props.thisY-DOT_R} x2={px} y2={py+DOT_R}
                stroke={props.color} stroke-width="3" opacity="0.5"/>;
  }
  const my=(props.thisY+py)/2;
  return<polyline points={`${props.thisX},${props.thisY-DOT_R} ${props.thisX},${my} ${px},${my} ${px},${py+DOT_R}`}
                   fill="none" stroke={props.color} stroke-width="3" opacity="0.5"
                   stroke-linejoin="round" {...dash}/>;
}
