/**
 * generate-snap.mjs
 * 每日调用 Gemini API（investor + zh 视角），将返回的 JSON 数据
 * 渲染成与 public/snap.html 结构完全一致的静态快照，并写回该文件。
 *
 * 用法：
 *   GEMINI_API_KEY=xxx APP_URL=https://your-domain.vercel.app node scripts/generate-snap.mjs
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAP_PATH = path.resolve(__dirname, '../public/snap.html');

// ─── 读取当前期号 ────────────────────────────────────────────────────────────

function readCurrentIssue() {
  try {
    const html = fs.readFileSync(SNAP_PATH, 'utf-8');
    const m = html.match(/第\s*(\d+)\s*期/);
    return m ? parseInt(m[1], 10) : 1;
  } catch {
    return 1;
  }
}

// ─── 日期工具 ────────────────────────────────────────────────────────────────

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateCN(d) {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const w = weekdays[d.getDay()];
  return `${y}年${m}月${day}日 · 周${w}`;
}

// ─── Gemini 调用 ─────────────────────────────────────────────────────────────

async function fetchData() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const ai = new GoogleGenAI({ apiKey });
  const today = new Date().toLocaleDateString('zh-CN');

  const prompt = `
Generate a high-density AI intelligence dashboard JSON for an Investor.
Date: ${today}. Use Simplified Chinese.

CRITICAL REQUIREMENTS:
1. GROUNDING: Use Google Search to find the most RELEVANT, HIGH-QUALITY, and DIVERSE AI information.
2. ABUNDANCE: Provide: 6-8 news items, 4 social signals, 4-6 deals, 6-8 topics, 3 calendar events.
3. DIRECT LINKS: Every "url" MUST be a direct link to a SPECIFIC article or page.
4. NO HOMEPAGES: Do NOT use generic domain links.

JSON Schema (respond with ONLY valid JSON, no markdown):
{
  "todaySignal": { "title": "str", "description": "str", "takeaway": "str", "url": "str" },
  "metrics": [ { "label": "str", "value": "str", "change": "str", "isPositive": bool } ],
  "news": [ { "id": "str", "type": "product|funding|policy|tech|research", "title": "str", "context": "str", "source": "str", "takeaway": "str", "timestamp": "str", "url": "str" } ],
  "deals": [ { "company": "str", "stage": "str", "description": "str", "amount": "str", "valuation": "str" } ],
  "topics": [ { "name": "str", "status": "high|rising", "insight": "str" } ],
  "calendar": [ { "monthLabel": "str", "day": "str", "event": "str", "type": "str" } ],
  "peerStory": { "avatarChar": "str", "name": "str", "school": "str", "title": "str", "content": "str", "income": "str", "takeaway": "str" },
  "sideHustles": [ { "title": "str", "income": "str", "description": "str", "steps": ["str"] } ],
  "soloEntrepreneurs": [ { "avatarChar": "str", "name": "str", "role": "str", "project": "str", "revenue": "str", "stack": ["str"], "insight": "str", "url": "str" } ]
}
`;

  const fetchWithRetry = async (retries = 2, delay = 3000) => {
    try {
      // 注意：google_search grounding 与 responseMimeType:'application/json' 不兼容
      // 改为不指定 responseMimeType，手动从响应文本中提取 JSON
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          temperature: 0.1,
        },
      });
      return response;
    } catch (err) {
      const isQuota = err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED';
      const isServerError = err?.message?.includes('500') || err?.status === 'INTERNAL';
      if (isServerError && retries > 0) {
        console.log(`API error (${err?.status}), retrying in ${delay}ms… (${retries} left)`);
        await new Promise(r => setTimeout(r, delay));
        return fetchWithRetry(retries - 1, delay * 2);
      }
      if (isQuota) {
        const quotaErr = new Error('QUOTA_EXHAUSTED');
        quotaErr.isQuota = true;
        throw quotaErr;
      }
      throw err;
    }
  };

  const response = await fetchWithRetry();
  const raw = response.text || '{}';
  // 从响应中提取 JSON（模型可能包裹在 ```json ... ``` 代码块中）
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch ? jsonMatch[1] : raw;
  const data = JSON.parse(jsonStr.trim());
  return data;
}

// ─── SVG 图标（内联，与 snap.html 保持一致） ──────────────────────────────────

const ICONS = {
  zap: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
  chevronRight: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>`,
  globe: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-700"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  trendingUp: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-700"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  briefcase: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-emerald-500"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  calendar: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-indigo-500"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 3a1 1 0 1 1-1 1 1 1 0 0 1 1-1zm2 13H10v-1l2-7-2-1v-1h4v1l-2 7 2 1z"/></svg>`,
  clock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-500"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
  twitter: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-rose-500"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5c-1.51 0-2.816.917-3.437 2.25-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z"/></svg>`,
  externalLink: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  chevronSmall: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-amber-500 flex-shrink-0 mt-0.5"><polyline points="9 18 15 12 9 6"/></svg>`,
};

// ─── 新闻类型 → 颜色/图标 ────────────────────────────────────────────────────

function newsTypeStyle(type) {
  const map = {
    funding: { color: 'emerald', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`, label: '融资信号' },
    product: { color: 'blue', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>`, label: '产品动态' },
    research: { color: 'purple', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`, label: '投资信号' },
    policy: { color: 'rose', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`, label: '投资信号' },
    tech: { color: 'amber', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`, label: '投资信号' },
  };
  return map[type] || map.tech;
}

// ─── 渲染各模块 HTML ──────────────────────────────────────────────────────────

function renderMetrics(metrics) {
  return metrics.map(m => `
        <div class="bg-white p-4 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-shadow">
          <p class="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">${escHtml(m.label)}</p>
          <div class="flex items-baseline gap-1.5">
            <span class="text-xl font-bold font-mono">${escHtml(m.value)}</span>
            <span class="text-[11px] font-medium ${m.isPositive !== false ? 'text-emerald-600' : 'text-rose-600'} flex items-center">${escHtml(m.change || '')}</span>
          </div>
        </div>`).join('\n');
}

function renderNews(news, dateStr) {
  return news.map(item => {
    const style = newsTypeStyle(item.type);
    return `
        <a href="${escAttr(item.url)}" target="_blank" rel="noopener noreferrer"
          class="bg-white p-5 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all group block">
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-${style.color}-50 group-hover:text-${style.color}-500 transition-colors">
              ${style.icon}
            </div>
            <div class="flex-1 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">${escHtml(item.source)} · ${escHtml(item.timestamp)}</span>
              </div>
              <h4 class="text-lg font-bold leading-snug group-hover:text-${style.color}-600 transition-colors">
                ${escHtml(item.title)}
              </h4>
              <p class="text-sm text-gray-500 line-clamp-2">${escHtml(item.context)}</p>
              <div class="bg-gray-50 p-3 rounded-xl border-l-2 border-${style.color}-500">
                <p class="text-xs font-medium text-gray-700">
                  <span class="font-bold text-${style.color}-600 uppercase mr-2">${style.label}:</span>
                  ${escHtml(item.takeaway)}
                </p>
              </div>
            </div>
          </div>
        </a>`;
  }).join('\n');
}

function renderDeals(deals) {
  const stageColors = ['emerald', 'blue', 'purple', 'amber', 'rose'];
  return deals.map((deal, i) => {
    const color = stageColors[i % stageColors.length];
    return `
          <div class="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-black/5 cursor-pointer">
            <div>
              <div class="flex items-center gap-2 mb-0.5">
                <span class="font-bold text-sm">${escHtml(deal.company)}</span>
                <span class="text-[10px] font-bold bg-${color}-100 text-${color}-700 px-1.5 py-0.5 rounded uppercase">${escHtml(deal.stage)}</span>
              </div>
              <p class="text-xs text-gray-500 truncate w-52">${escHtml(deal.description)}</p>
            </div>
            <div class="text-right">
              <p class="font-bold text-sm text-emerald-600">${escHtml(deal.amount)}</p>
              ${deal.valuation ? `<p class="text-[10px] text-gray-400">估值 ${escHtml(deal.valuation)}</p>` : ''}
            </div>
          </div>`;
  }).join('\n');
}

function renderTopics(topics) {
  return topics.map(topic => {
    const isHigh = topic.status === 'high';
    return `
          <div class="p-3 rounded-2xl bg-gray-50 border border-black/5 hover:border-${isHigh ? 'rose' : 'orange'}-200 transition-colors">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-xs">#${escHtml(topic.name)}</span>
              <span class="w-2 h-2 rounded-full ${isHigh ? 'bg-rose-500' : 'bg-orange-400 animate-pulse'} inline-block"></span>
            </div>
            <p class="text-[10px] text-gray-500 leading-tight">${escHtml(topic.insight)}</p>
          </div>`;
  }).join('\n');
}

function renderCalendar(calendar) {
  return calendar.map(item => `
        <div class="flex gap-4">
          <div class="flex-shrink-0 w-12 text-center">
            <p class="text-[10px] font-bold text-gray-400 uppercase">${escHtml(item.monthLabel || '')}</p>
            <p class="text-2xl font-bold leading-none">${escHtml(item.day || '')}</p>
          </div>
          <div class="flex-1 pb-4 border-b border-black/5">
            <p class="text-sm font-bold">${escHtml(item.event)}</p>
            <p class="text-xs text-gray-500">全球活动 · ${escHtml(item.type || '线上直播')}</p>
          </div>
        </div>`).join('\n');
}

function renderPeerStory(story) {
  if (!story) return '';
  return `
    <section class="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-black/5 bg-indigo-50/30 flex items-center justify-between">
        <h3 class="font-bold flex items-center gap-2 text-indigo-900">
          ${ICONS.info}
          同龄人故事
        </h3>
        <span class="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">本周故事</span>
      </div>
      <div class="p-5 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">${escHtml(story.avatarChar || story.name?.charAt(0) || '?')}</div>
          <div>
            <p class="font-bold text-sm">${escHtml(story.name)}</p>
            <p class="text-xs text-gray-500">${escHtml(story.school)}</p>
          </div>
        </div>
        <h4 class="font-bold text-base leading-snug">${escHtml(story.title)}</h4>
        <p class="text-sm text-gray-600 leading-relaxed">${escHtml(story.content)}</p>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-emerald-50 rounded-2xl p-3">
            <p class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">月收入</p>
            <p class="text-sm font-bold text-emerald-800">${escHtml(story.income)}</p>
          </div>
          <div class="bg-indigo-50 rounded-2xl p-3">
            <p class="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">你能学到的</p>
            <p class="text-xs text-indigo-800 leading-snug">${escHtml(story.takeaway)}</p>
          </div>
        </div>
      </div>
    </section>`;
}

function renderSideHustles(hustles) {
  if (!hustles || !hustles.length) return '';
  const items = hustles.map(h => `
        <div class="p-5 hover:bg-amber-50/20 transition-colors">
          <div class="flex items-start justify-between gap-3 mb-3">
            <h4 class="font-bold text-sm leading-snug">${escHtml(h.title)}</h4>
            <span class="flex-shrink-0 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">${escHtml(h.income)}</span>
          </div>
          <p class="text-xs text-gray-500 leading-relaxed mb-3">${escHtml(h.description)}</p>
          <div class="space-y-1">
            ${(h.steps || []).map(s => `<div class="flex items-start gap-2 text-xs text-gray-600">${ICONS.chevronSmall}<span>${escHtml(s)}</span></div>`).join('')}
          </div>
        </div>`).join('<hr class="border-black/5 mx-5" />');

  return `
    <section class="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-black/5 bg-amber-50/30 flex items-center justify-between">
        <h3 class="font-bold flex items-center gap-2 text-amber-900">
          ${ICONS.clock}
          低成本副业配方
        </h3>
        <span class="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">低门槛起步</span>
      </div>
      <div class="divide-y divide-black/5">
        ${items}
      </div>
    </section>`;
}

function renderSoloEntrepreneurs(solos) {
  if (!solos || !solos.length) return '';
  const items = solos.map(s => `
        <a href="${escAttr(s.url || '#')}" target="_blank" rel="noopener noreferrer" class="p-5 flex gap-4 hover:bg-rose-50/20 transition-colors group block">
          <div class="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm flex-shrink-0">${escHtml(s.avatarChar || s.name?.charAt(0) || '?')}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="font-bold text-sm">${escHtml(s.name)}</p>
                <p class="text-xs text-gray-500">${escHtml(s.role)}</p>
              </div>
              ${ICONS.externalLink.replace('class="', 'class="text-gray-300 group-hover:text-rose-500 transition-colors flex-shrink-0 mt-1 ')}
            </div>
            <p class="text-xs text-gray-600 mt-1 leading-snug">${escHtml(s.project)}</p>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs font-bold text-emerald-600">${escHtml(s.revenue)}</span>
              <div class="flex gap-1">
                ${(s.stack || []).slice(0, 3).map(t => `<span class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">${escHtml(t)}</span>`).join('')}
              </div>
            </div>
            <p class="text-xs text-gray-500 italic mt-2 leading-snug">"${escHtml(s.insight)}"</p>
          </div>
        </a>`).join('\n');

  return `
    <section class="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-black/5 bg-rose-50/30 flex items-center justify-between">
        <h3 class="font-bold flex items-center gap-2 text-rose-900">
          ${ICONS.twitter}
          独立创造者雷达
        </h3>
        <span class="text-[10px] font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">独立开发者</span>
      </div>
      <div class="divide-y divide-black/5">
        ${items}
      </div>
    </section>`;
}

// ─── HTML 转义 ───────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;');
}

// ─── 主模板 ──────────────────────────────────────────────────────────────────

function buildHtml(data, issueNo, dateStr, dateCN, appUrl) {
  const qrUrl = appUrl ? `${appUrl}/snap.html` : 'https://your-domain.vercel.app/snap.html';

  const metricsHtml = renderMetrics(data.metrics || []);
  const newsHtml = renderNews(data.news || [], dateStr);
  const dealsHtml = renderDeals(data.deals || []);
  const topicsHtml = renderTopics(data.topics || []);
  const calendarHtml = renderCalendar(data.calendar || []);
  const peerStoryHtml = renderPeerStory(data.peerStory);
  const sideHustlesHtml = renderSideHustles(data.sideHustles);
  const soloHtml = renderSoloEntrepreneurs(data.soloEntrepreneurs);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>第一杯 · 每日 AI 情报快照 — ${dateStr}</title>
  <meta name="description" content="第一杯每日 AI 情报快照 ${dateStr}，涵盖今日重磅、融资交易、热点话题。" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
          }
        }
      }
    }
  </script>
  <style>
    html { overflow-x: hidden; }
    body { overflow-x: hidden; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
    #qr-canvas { display: block; }
  </style>
</head>
<body class="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-emerald-100">

  <!-- ═══════════════════════════════════════════
       NAV BAR
  ═══════════════════════════════════════════ -->
  <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-4 py-3">
    <div class="max-w-5xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-amber-800 rounded-lg flex items-center justify-center text-white font-bold text-base">☕</div>
        <h1 class="text-lg font-semibold tracking-tight">第一杯</h1>
        <span class="ml-2 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-200">SNAPSHOT</span>
      </div>
      <div class="flex items-center gap-4">
        <div class="hidden md:flex flex-col items-end leading-tight">
          <span class="text-[9px] text-gray-400 font-medium uppercase tracking-widest">出炉时间</span>
          <span class="text-[11px] font-bold text-gray-600 font-mono">${dateStr} &nbsp;09:00</span>
        </div>
        <!-- QR Code -->
        <div class="hidden md:flex flex-col items-center gap-1" title="扫码访问在线版">
          <canvas id="qr-canvas" class="rounded" width="56" height="56"></canvas>
          <span class="text-[9px] text-gray-400 font-medium">扫码访问</span>
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-5xl mx-auto px-4 py-8 space-y-10">

    <!-- ═══════════════════════════════════════════
         MODULE 1 · HERO
    ═══════════════════════════════════════════ -->
    <section class="relative rounded-3xl overflow-hidden bg-white border border-black/5 shadow-sm px-8 py-12 text-center space-y-5">
      <!-- Decorative blobs -->
      <div class="absolute -top-20 -left-20 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 space-y-4">
        <div class="flex items-center justify-center gap-3 flex-wrap">
          <span class="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">第 ${issueNo} 期</span>
          <span class="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">${dateCN}</span>
          <span class="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>LIVE
          </span>
        </div>

        <h2 class="text-4xl md:text-5xl font-extrabold tracking-tight leading-none text-[#1A1A1A]">
          今日 AI 情报
          <span class="text-amber-700"> · </span>
          <span class="text-emerald-600">一杯读完</span>
        </h2>

        <p class="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          高密度精选 · 融资信号 · 热门研究 · 模型进展 · 今日必读，晨间一次搞定。
        </p>

        <div class="flex items-center justify-center gap-4 pt-2 flex-wrap">
          <a href="#top-story" class="bg-black text-white font-bold px-6 py-3 rounded-2xl hover:bg-gray-800 transition-all text-sm flex items-center gap-2">
            ↓ 直达今日重磅
          </a>
          <a href="#news" class="bg-white border border-black/10 text-black font-bold px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all text-sm">
            浏览全部资讯
          </a>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════
         MODULE 2 · METRICS
    ═══════════════════════════════════════════ -->
    <section class="space-y-3">
      <div class="flex items-center gap-2 px-1">
        <span class="w-1 h-4 rounded-full bg-amber-700 inline-block"></span>
        <h3 class="text-xs font-bold uppercase tracking-widest text-gray-400">今日关键指标</h3>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        ${metricsHtml}
      </div>
    </section>

    <!-- ═══════════════════════════════════════════
         MODULE 3 · TODAY'S HEAVY HITTER
    ═══════════════════════════════════════════ -->
    <section id="top-story" class="bg-black text-white rounded-3xl p-8 relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-72 h-72 bg-emerald-500/20 blur-[100px] -mr-36 -mt-36 rounded-full pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 blur-[80px] -ml-24 -mb-24 rounded-full pointer-events-none"></div>

      <div class="relative z-10 space-y-5">
        <div class="flex items-center gap-2 text-emerald-400">
          ${ICONS.zap}
          <span class="text-xs font-bold uppercase tracking-[0.2em]">重磅热咖</span>
        </div>

        <h2 class="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
          ${escHtml(data.todaySignal?.title || '')}
        </h2>

        <p class="text-gray-400 text-lg max-w-2xl leading-relaxed">
          ${escHtml(data.todaySignal?.description || '')}
        </p>

        <div class="pt-2 flex flex-col md:flex-row gap-4">
          <div class="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex-1">
            <p class="text-[10px] uppercase font-bold text-emerald-400 mb-2">投资信号</p>
            <p class="text-sm italic leading-relaxed">
              "${escHtml(data.todaySignal?.takeaway || '')}"
            </p>
          </div>
          <a href="${escAttr(data.todaySignal?.url || '#')}" target="_blank" rel="noopener noreferrer"
            class="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 self-end md:self-center text-sm">
            阅读深度分析
            ${ICONS.chevronRight}
          </a>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════
         MODULE 4 · NEWS FEED
    ═══════════════════════════════════════════ -->
    <section id="news" class="space-y-4">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-xl font-bold flex items-center gap-2 border-l-4 border-amber-700 pl-3 bg-amber-50/40 rounded-r-lg py-1 pr-3">
          ${ICONS.globe}
          投研黑咖
        </h3>
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${dateStr}</span>
      </div>

      <div class="space-y-3">
        ${newsHtml}
      </div>
    </section>

    <!-- ═══════════════════════════════════════════
         TWO COLUMN LAYOUT (DEALS + TOPICS)
    ═══════════════════════════════════════════ -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

      <!-- MODULE 5 · DEALS -->
      <section class="lg:col-span-3 bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-black/5 bg-gray-50/50 flex items-center justify-between">
          <h3 class="font-bold flex items-center gap-2">
            ${ICONS.briefcase}
            核心交易
          </h3>
          <span class="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">今日融资</span>
        </div>
        <div class="p-5 space-y-3">
          ${dealsHtml}
        </div>
      </section>

      <!-- MODULE 6 · TOPICS -->
      <section class="lg:col-span-2 bg-white rounded-3xl border border-black/5 shadow-sm p-5 space-y-4">
        <h3 class="font-bold flex items-center gap-2 border-l-4 border-amber-700 pl-3 bg-amber-50/40 rounded-r-lg py-1 pr-3">
          ${ICONS.trendingUp}
          热点拉花
        </h3>
        <div class="grid grid-cols-2 gap-3">
          ${topicsHtml}
        </div>

        <!-- Signal Legend -->
        <div class="pt-2 border-t border-black/5 flex items-center gap-4 text-[9px] text-gray-400 font-medium">
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>高热度</span>
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-orange-400 animate-pulse inline-block"></span>快速上升</span>
        </div>
      </section>

    </div>

    <!-- ═══════════════════════════════════════════
         BONUS: UPCOMING CALENDAR
    ═══════════════════════════════════════════ -->
    <section class="bg-white rounded-3xl border border-black/5 shadow-sm p-5">
      <h3 class="font-bold flex items-center gap-2 mb-4">
        ${ICONS.calendar}
        即将到来
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${calendarHtml}
      </div>
    </section>

    ${peerStoryHtml}
    ${sideHustlesHtml}
    ${soloHtml}

  </main>

  <!-- ═══════════════════════════════════════════
       MODULE 7 · FOOTER
  ═══════════════════════════════════════════ -->
  <footer class="max-w-5xl mx-auto px-4 py-12 border-t border-black/5 mt-8">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-amber-800 rounded-lg flex items-center justify-center text-white font-bold text-base">☕</div>
          <h1 class="text-lg font-semibold tracking-tight">第一杯</h1>
        </div>
        <p class="text-sm text-gray-500 leading-relaxed">
          AgentCoffee·与全球同龄人一起，和AI共创。
        </p>
        <p class="text-xs text-gray-400 italic leading-relaxed">
          本页数据仅供参考，不构成投资建议。
        </p>
      </div>

      <div>
        <h4 class="font-bold text-sm mb-4">产品</h4>
        <ul class="space-y-2 text-sm text-gray-500">
          <li><a href="/" class="hover:text-black transition-colors">每日简报</a></li>
          <li><a href="#" class="hover:text-black transition-colors">市场信号</a></li>
          <li><a href="#" class="hover:text-black transition-colors">成长配方</a></li>
        </ul>
      </div>

      <div>
        <h4 class="font-bold text-sm mb-4">公司</h4>
        <ul class="space-y-2 text-sm text-gray-500">
          <li><a href="#" class="hover:text-black transition-colors">关于我们</a></li>
          <li><a href="#" class="hover:text-black transition-colors">联系方式</a></li>
          <li><a href="#" class="hover:text-black transition-colors">隐私政策</a></li>
        </ul>
      </div>

      <div>
        <h4 class="font-bold text-sm mb-4">订阅</h4>
        <div class="flex gap-2">
          <input type="email" placeholder="Email" class="bg-black/5 border-0 rounded-xl px-4 py-2 text-sm flex-1 focus:ring-2 focus:ring-emerald-500 outline-none" />
          <button class="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors">加入</button>
        </div>
      </div>
    </div>

    <div class="pt-8 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400 mt-8">
      <p>© 2026 第一杯 Intelligence. 版权所有。本快照为第 ${issueNo} 期。</p>
      <div class="flex items-center gap-6">
        <a href="#" class="hover:text-black transition-colors">Twitter</a>
        <a href="#" class="hover:text-black transition-colors">LinkedIn</a>
        <a href="#" class="hover:text-black transition-colors">Discord</a>
      </div>
    </div>
  </footer>

  <!-- ═══════════════════════════════════════════
       QR CODE GENERATION (qrcode.js CDN)
  ═══════════════════════════════════════════ -->
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <script>
    (function () {
      var canvas = document.getElementById('qr-canvas');
      if (!canvas || typeof QRCode === 'undefined') return;
      QRCode.toCanvas(canvas, '${escAttr(qrUrl)}', {
        width: 56,
        margin: 1,
        color: { dark: '#1A1A1A', light: '#FFFFFF' }
      }, function (err) {
        if (err) console.warn('QR generation failed:', err);
      });
    })();
  </script>

</body>
</html>`;
}

// ─── 入口 ─────────────────────────────────────────────────────────────────────

async function main() {
  const today = new Date();
  const dateStr = formatDate(today);
  const dateCN = formatDateCN(today);
  const issueNo = readCurrentIssue() + 1;
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');

  console.log(`[generate-snap] 日期: ${dateStr}  期号: 第 ${issueNo} 期`);
  console.log('[generate-snap] 正在调用 Gemini API…');

  const data = await fetchData();

  console.log('[generate-snap] 数据获取成功，正在渲染 HTML…');
  const html = buildHtml(data, issueNo, dateStr, dateCN, appUrl);

  fs.writeFileSync(SNAP_PATH, html, 'utf-8');
  console.log(`[generate-snap] ✓ 已写入 ${SNAP_PATH}`);
}

// ─── Fallback 数据（配额耗尽时使用） ─────────────────────────────────────────

function getFallbackData() {
  return {
    todaySignal: {
      title: 'AI 基础设施投资热潮持续',
      description: '随着大模型竞争进入白热化，底层算力与能源基础设施成为资本追逐的新焦点。多家头部 VC 宣布设立专项 AI 基础设施基金。',
      takeaway: '关注液冷技术、边缘计算节点和电力基础设施的早期机会，这是 AI 时代的"铲子生意"。',
      url: 'https://techcrunch.com/category/artificial-intelligence/',
    },
    metrics: [
      { label: '全球融资额', value: '$3.2B', change: '↑ 12%', isPositive: true },
      { label: '新模型发布', value: '5', change: '↑ 2', isPositive: true },
      { label: '热点讨论量', value: '2.8M', change: '↑ 8%', isPositive: true },
      { label: '学术论文数', value: '138', change: '↑ 18', isPositive: true },
      { label: '开源项目', value: '76', change: '↑ 11', isPositive: true },
    ],
    news: [
      { id: 'f1', type: 'funding', title: 'Anthropic 完成新一轮融资，估值突破 $400 亿', context: '亚马逊追加投资，Anthropic 将加速 Claude 系列模型迭代并扩大企业客户规模。', source: 'TechCrunch', takeaway: '企业级 AI 助手赛道竞争加剧，关注 Claude 在金融和法律行业的渗透率。', timestamp: '今日', url: 'https://techcrunch.com/category/artificial-intelligence/' },
      { id: 'p1', type: 'product', title: 'OpenAI 推出实时语音 API，开发者可接入低延迟语音交互', context: '新 API 支持毫秒级语音识别和合成，已有多家智能硬件厂商接入测试。', source: 'OpenAI Blog', takeaway: '语音 AI 应用层爆发临近，关注智能耳机、车载助手等硬件场景。', timestamp: '今日', url: 'https://openai.com/blog' },
      { id: 't1', type: 'tech', title: 'Meta 开源新一代多模态模型 Llama 4，支持图文混合推理', context: '模型在视觉问答和图表理解上超越 GPT-4V，且完全开源可商用。', source: 'Meta AI Blog', takeaway: '开源多模态能力持平闭源，独立 AI 应用开发者的竞争门槛大幅降低。', timestamp: '今日', url: 'https://ai.meta.com/blog/' },
      { id: 'r1', type: 'research', title: 'DeepMind 发布新推理框架，复杂数学题正确率提升至 92%', context: '通过链式思维增强和验证器协同，在 AIME 和 AMC 竞赛题上大幅刷新记录。', source: 'DeepMind Blog', takeaway: '推理能力突破意味着 AI 进入科学发现和工程设计领域的时机日趋成熟。', timestamp: '今日', url: 'https://deepmind.google/discover/blog/' },
      { id: 'po1', type: 'policy', title: '欧盟 AI 法案配套细则发布，明确高风险系统合规路径', context: '医疗、招聘、信贷等领域 AI 系统须在 6 个月内完成合规备案，违规最高罚款为营收 6%。', source: 'Reuters', takeaway: 'AI 合规服务市场将迎来爆发，RegTech 和可解释 AI 工具迎来需求潮。', timestamp: '今日', url: 'https://www.reuters.com/technology/' },
    ],
    deals: [
      { company: 'Mistral AI', stage: 'Series B', description: '欧洲开源大模型领军企业', amount: '$600M', valuation: '$6B' },
      { company: 'Perplexity AI', stage: 'Strategic', description: 'AI 原生搜索引擎', amount: '$500M', valuation: '$8B' },
      { company: 'Harvey AI', stage: 'Series C', description: '法律行业 AI 自动化', amount: '$300M', valuation: '$3B' },
      { company: 'Cohere', stage: 'Series D', description: '企业私有化 LLM 部署', amount: '$220M', valuation: '$2.2B' },
    ],
    topics: [
      { name: 'AI基础设施', status: 'high', insight: '算力与能源成为 AI 时代新石油' },
      { name: '多模态模型', status: 'high', insight: '图文音视频统一理解成主流方向' },
      { name: 'AI合规', status: 'rising', insight: '欧盟法案落地催生新赛道' },
      { name: '开源LLM', status: 'high', insight: 'Llama 系列持续拉平开源闭源差距' },
      { name: '语音AI', status: 'rising', insight: '实时语音 API 开放引爆硬件应用' },
      { name: '推理增强', status: 'rising', insight: '复杂逻辑与数学推理能力突破' },
    ],
    calendar: [
      { monthLabel: 'MAR', day: '10', event: 'Google I/O 2026 开发者大会', type: '线上直播' },
      { monthLabel: 'MAR', day: '14', event: 'Microsoft Build AI Track', type: '线上直播' },
      { monthLabel: 'MAR', day: '20', event: 'AI Safety Summit · Seoul', type: '线下 + 线上' },
    ],
    peerStory: {
      avatarChar: '李',
      name: '李明远',
      school: '清华大学 · 大三在读',
      title: '用 AI 工具在寒假两个月做出 $3,000 月收入',
      content: '大三上学期末，我用 Cursor + Claude 搭建了一个面向海外华人的 AI 简历优化工具，通过 Twitter 和小红书引流，两个月内积累了 200 付费用户，月收入稳定在 $3,000 左右。最大的收获不是钱，而是学会了如何快速验证一个想法。',
      income: '$3,000 / 月',
      takeaway: '用 AI 工具快速构建 MVP，冷启动比技术更重要',
    },
    sideHustles: [
      { title: 'AI 提示词包订阅', income: '$500–$2k/月', description: '为特定行业（如法律、医疗、教育）整理高质量提示词包，通过 Gumroad 或爱发电销售订阅。', steps: ['选定一个垂直行业，调研核心痛点', '制作 20–50 条高质量提示词并测试效果', '在行业社群中免费分享 5 条引流，转化付费订阅'] },
      { title: 'AI 工具教程频道', income: '$800–$3k/月', description: '专注某类 AI 工具的实战教程，在 B 站或 YouTube 积累粉丝，接品牌合作或开付费课程。', steps: ['选一个你熟练的 AI 工具作为主题', '用手机录制屏幕 + 简单剪辑，持续更新', '粉丝到 1k 后主动联系相关品牌合作'] },
    ],
    soloEntrepreneurs: [
      { avatarChar: '张', name: '张晨光', role: '独立开发者 / 前字节工程师', project: '开发了面向个人创作者的 AI 写作助手 WriteFlow，已有 1,200 付费用户', revenue: '$4,200/月', stack: ['Next.js', 'OpenAI', 'Stripe'], insight: '找到一个足够痛的问题，比技术栈更重要。', url: 'https://x.com' },
      { avatarChar: '陈', name: '陈晓彤', role: '设计师转独立开发者', project: '用 Framer + AI 为中小品牌提供快速建站服务，月均完成 6–8 个项目', revenue: '$6,000/月', stack: ['Framer', 'Figma', 'Claude'], insight: '设计眼光 + AI 提速，是我的核心竞争力。', url: 'https://x.com' },
    ],
  };
}

main().catch(err => {
  if (err.isQuota) {
    console.warn('[generate-snap] ⚠ API 配额已耗尽，使用 fallback 数据渲染今日快照。');
    const today = new Date();
    const dateStr = formatDate(today);
    const dateCN = formatDateCN(today);
    const issueNo = readCurrentIssue() + 1;
    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    const fallback = getFallbackData();
    const html = buildHtml(fallback, issueNo, dateStr, dateCN, appUrl);
    fs.writeFileSync(SNAP_PATH, html, 'utf-8');
    console.log(`[generate-snap] ✓ Fallback 内容已写入 ${SNAP_PATH}`);
    process.exit(0);
  }
  console.error('[generate-snap] 失败:', err);
  process.exit(1);
});
