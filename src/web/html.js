/**
 * Minimal server-rendered HTML for the PA#3 flow (criterion 1).
 *
 * No template engine and no client framework: the brief only needs the flow to
 * be usable through the product, so the pages are plain HTML strings with
 * every interpolated value escaped.
 */

/** @type {Readonly<Record<string, string>>} */
const ESCAPES = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
});

/**
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

/** @typedef {{ id: number, name: string, role: 'admin' | 'ta' | 'student' }} SessionUser */

/**
 * @param {{ title: string, user?: SessionUser | null, body: string }} input
 * @returns {string}
 */
export function layout({ title, user = null, body }) {
  const nav =
    user === null
      ? ''
      : `<nav><span>${escapeHtml(user.name)} (${escapeHtml(user.role)})</span>
         <form method="post" action="/logout"><button type="submit">Đăng xuất</button></form></nav>`;

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · LeeTKOB</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; color: #111; background: #fafafa; }
  header { background: #1f2937; color: #fff; padding: .75rem 1.25rem; }
  nav { display: flex; gap: 1rem; align-items: center; justify-content: space-between; }
  nav form { margin: 0; }
  main { max-width: 64rem; margin: 1.5rem auto; padding: 0 1.25rem 3rem; }
  table { border-collapse: collapse; width: 100%; background: #fff; }
  th, td { border: 1px solid #d1d5db; padding: .45rem .6rem; text-align: left; vertical-align: top; }
  th { background: #f3f4f6; }
  .badge { display: inline-block; padding: .1rem .45rem; border-radius: .3rem; font-size: .85em; }
  .pass { background: #dcfce7; color: #166534; }
  .violation { background: #fee2e2; color: #991b1b; }
  .unsure { background: #fef3c7; color: #92400e; }
  .pending { background: #e5e7eb; color: #374151; }
  .muted { color: #6b7280; }
  .error { background: #fee2e2; color: #991b1b; padding: .75rem; border-radius: .3rem; }
  .notice { background: #eff6ff; border-left: 4px solid #2563eb; padding: .75rem 1rem; }
  label { display: block; margin-top: .75rem; font-weight: 600; }
  input[type=text], textarea { width: 100%; box-sizing: border-box; padding: .5rem; font: inherit; }
  textarea { min-height: 8rem; }
  button { font: inherit; padding: .45rem .9rem; margin-top: .5rem; cursor: pointer; }
  code { background: #f3f4f6; padding: 0 .2rem; }
  ul.tabs { display: flex; gap: .5rem; list-style: none; padding: 0; }
  ul.tabs a { padding: .35rem .7rem; border: 1px solid #d1d5db; border-radius: .3rem; text-decoration: none; }
  ul.tabs a[aria-current=page] { background: #1f2937; color: #fff; }
</style>
</head>
<body>
<header>${nav}</header>
<main>${body}</main>
</body>
</html>`;
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {string} html
 * @param {Record<string, string>} [extraHeaders]
 * @returns {void}
 */
export function sendHtml(res, status, html, extraHeaders = {}) {
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', ...extraHeaders });
  res.end(html);
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {string} location
 * @param {Record<string, string>} [extraHeaders]
 * @returns {void}
 */
export function redirect(res, location, extraHeaders = {}) {
  res.writeHead(303, { location, ...extraHeaders });
  res.end();
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {string} message
 * @param {{ user?: SessionUser | null }} [options]
 * @returns {void}
 */
export function sendError(res, status, message, { user = null } = {}) {
  const html = layout({
    title: `Lỗi ${status}`,
    user,
    body: `<h1>Lỗi ${status}</h1><p class="error">${escapeHtml(message)}</p>
           <p><a href="/">Về trang chủ</a></p>`,
  });
  sendHtml(res, status, html);
}
