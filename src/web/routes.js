/**
 * Server-rendered routes for the PA#3 flow (criterion 1).
 *
 *   GET  /                      login or role home
 *   POST /login, POST /logout   session cookie
 *   GET  /ta                    TA's labs
 *   GET  /ta/labs/new           lab form
 *   POST /ta/labs               create a lab (multi-file test upload)
 *   GET  /ta/labs/:id/review    review queue + all-verdicts tab
 *   POST /ta/verdicts/:id       TA decision
 *   GET  /student               student's labs
 *   GET  /student/labs/:id      statement, constraints, deductions, submit
 *   POST /student/labs/:id/submit
 *   GET  /student/submissions/:id
 *
 * The API under `/v1` is untouched: `handle()` returns false for it so
 * `src/app.js` keeps the PA#2 contract.
 */

import { pairTestFiles, parseConstraintLines } from '../domain/labs.js';
import { parseEvidenceLines, selectReviewQueue, validateDecision } from '../domain/review.js';
import { summarizeLabCost } from '../model/cost.js';
import { clearCookie, parseCookies, readForm, serializeCookie, SESSION_COOKIE } from './form.js';
import { escapeHtml, layout, redirect, sendError, sendHtml } from './html.js';

/** @typedef {ReturnType<typeof import('./store.js').createWebStore>} WebStore */
/** @typedef {import('./store.js').Submission} Submission */
/** @typedef {import('../domain/review.js').Verdict} Verdict */

const REVIEW_ROUTE = /^\/ta\/labs\/(\d+)\/review$/;
const TA_VERDICT_ROUTE = /^\/ta\/verdicts\/(\d+)$/;
const STUDENT_LAB_ROUTE = /^\/student\/labs\/(\d+)$/;
const STUDENT_SUBMIT_ROUTE = /^\/student\/labs\/(\d+)\/submit$/;
const STUDENT_SUBMISSION_ROUTE = /^\/student\/submissions\/(\d+)$/;

const MAX_SOURCE_BYTES = 64 * 1024;

/**
 * @param {string} path
 * @param {RegExp} pattern
 * @returns {number | null}
 */
function idFrom(path, pattern) {
  const match = pattern.exec(path);
  if (match === null) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * @param {string} filename
 * @returns {string}
 */
function basename(filename) {
  const parts = filename.split(/[\\/]/);
  return parts[parts.length - 1] ?? filename;
}

/**
 * @param {{ store: WebStore, clock?: { now: () => Date } }} deps
 */
export function createWebRoutes({ store, clock = { now: () => new Date() } }) {
  /**
   * @param {import('node:http').IncomingMessage} req
   * @returns {Promise<import('./store.js').User | null>}
   */
  async function currentUser(req) {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (token === undefined || token.length === 0) return null;
    return store.findUserByToken(token);
  }

  /**
   * @param {import('./store.js').User} user
   * @param {import('../domain/labs.js').Lab} lab
   * @returns {boolean}
   */
  function canAccessLab(user, lab) {
    if (user.role === 'admin') return true;
    return lab.classId === user.classId;
  }

  /**
   * @param {import('node:http').ServerResponse} res
   * @param {string | null} error
   * @returns {void}
   */
  function renderLogin(res, error = null) {
    const body = `<h1>Đăng nhập LeeTKOB</h1>
      ${error === null ? '' : `<p class="error">${escapeHtml(error)}</p>`}
      <form method="post" action="/login">
        <label for="token">Token đăng nhập</label>
        <input id="token" type="text" name="token" autocomplete="off" required>
        <button type="submit">Đăng nhập</button>
      </form>
      <p class="muted">Tài khoản demo (PA3.md): <code>admin-token</code>,
      <code>ta1-token</code>, <code>ta2-token</code>, <code>sv1-token</code>,
      <code>sv2-token</code>, <code>sv3-token</code>.</p>`;
    sendHtml(res, error === null ? 200 : 401, layout({ title: 'Đăng nhập', body }));
  }

  /**
   * @param {import('node:http').ServerResponse} res
   * @param {import('./store.js').User} user
   * @returns {Promise<void>}
   */
  async function renderTaHome(res, user) {
    const labs = await store.listLabs(user.classId);
    const rows =
      labs.length === 0
        ? '<p class="muted">Chưa có lab nào. Tạo lab đầu tiên.</p>'
        : `<table><thead><tr><th>#</th><th>Tiêu đề</th><th>Constraint</th><th>Test</th><th></th></tr></thead><tbody>
          ${labs
            .map(
              (lab) => `<tr>
                <td>${lab.id}</td>
                <td>${escapeHtml(lab.title)}</td>
                <td>${lab.constraints.length}</td>
                <td>${lab.tests.length}</td>
                <td><a href="/ta/labs/${lab.id}/review">Review</a></td>
              </tr>`,
            )
            .join('')}
          </tbody></table>`;

    const body = `<h1>Trang trợ giảng</h1>
      <p><a href="/ta/labs/new">+ Tạo lab mới</a></p>
      ${rows}`;
    sendHtml(res, 200, layout({ title: 'Trợ giảng', user, body }));
  }

  /**
   * @param {import('node:http').ServerResponse} res
   * @param {import('./store.js').User} user
   * @returns {void}
   */
  function renderLabForm(res, user) {
    const body = `<h1>Tạo lab</h1>
      <form method="post" action="/ta/labs" enctype="multipart/form-data">
        <label for="title">Tiêu đề</label>
        <input id="title" type="text" name="title" required>

        <label for="statement">Đề bài</label>
        <textarea id="statement" name="statement" required></textarea>

        <label for="constraints">Constraint — mỗi dòng <code>text | deduction</code></label>
        <textarea id="constraints" name="constraints" required
          placeholder="Do not call \`std::sort\`. | 5&#10;Dùng thuật toán ổn định. | 3"></textarea>

        <label for="tests">Test — chọn nhiều file <code>NN.in</code> và <code>NN.out</code> cùng lúc</label>
        <input id="tests" type="file" name="tests" multiple required>

        <button type="submit">Tạo lab</button>
      </form>`;
    sendHtml(res, 200, layout({ title: 'Tạo lab', user, body }));
  }

  /**
   * @param {Verdict | null} verdict
   * @returns {string}
   */
  function verdictBadge(verdict) {
    if (verdict === null) return '<span class="badge pending">chưa có</span>';
    return `<span class="badge ${verdict.verdict}">${verdict.verdict}</span>`;
  }

  /**
   * @param {Verdict | null} verdict
   * @returns {string}
   */
  function evidenceList(verdict) {
    if (verdict === null || verdict.evidence.length === 0) return '<span class="muted">—</span>';
    return `<ul>${verdict.evidence
      .map((line) => `<li>dòng ${line.line}: <code>${escapeHtml(line.text)}</code></li>`)
      .join('')}</ul>`;
  }

  /**
   * @param {Verdict} verdict
   * @returns {string}
   */
  function decisionCell(verdict) {
    if (verdict.taDecision !== null) {
      return `<span class="badge ${verdict.taDecision}">TA: ${verdict.taDecision}</span>`;
    }
    return `<form method="post" action="/ta/verdicts/${verdict.id}">
      <select name="decision">
        <option value="pass">pass</option>
        <option value="violation">violation</option>
      </select>
      <textarea name="evidence" placeholder="12|sort(a);"></textarea>
      <button type="submit">Lưu</button>
    </form>`;
  }

  /**
   * @param {import('node:http').ServerResponse} res
   * @param {import('./store.js').User} user
   * @param {import('../domain/labs.js').Lab} lab
   * @param {'queue' | 'all'} tab
   * @returns {Promise<void>}
   */
  async function renderReview(res, user, lab, tab) {
    const submissions = (await store.listSubmissions({ labId: lab.id })).filter(
      (submission) => submission.counted,
    );
    const allVerdicts = await store.listVerdictsForLab(lab.id);
    const queueIds = new Set(selectReviewQueue(allVerdicts).map((verdict) => verdict.id));

    /** @type {string[]} */
    const rows = [];
    for (const submission of submissions) {
      const student = store.findUser(submission.studentId);
      const verdicts = await store.listVerdictsForSubmission(submission.id);

      for (const constraint of lab.constraints) {
        const verdict = verdicts.find((entry) => entry.constraintId === constraint.id) ?? null;
        const inQueue = verdict !== null && queueIds.has(verdict.id);
        if (tab === 'queue' && !inQueue) continue;

        const sampleNote =
          verdict !== null && verdict.verdict === 'pass' && !inQueue
            ? '<div class="muted">không vào mẫu review 10%</div>'
            : '';

        rows.push(`<tr>
          <td>#${submission.id}</td>
          <td>${escapeHtml(student?.name ?? `user ${submission.studentId}`)}</td>
          <td>${escapeHtml(constraint.text)}<div class="muted">trừ ${constraint.deduction}</div></td>
          <td>${verdictBadge(verdict)}${sampleNote}</td>
          <td>${evidenceList(verdict)}${
            verdict?.unsureReason === null || verdict === null
              ? ''
              : `<div class="muted">unsure: ${escapeHtml(verdict.unsureReason)}</div>`
          }</td>
          <td>${verdict === null ? '—' : decisionCell(verdict)}</td>
        </tr>`);
      }
    }

    const calls = await store.listModelCalls(lab.id);
    const cost = summarizeLabCost(
      calls.map((call) => ({
        tokensIn: call.tokensIn,
        tokensOut: call.tokensOut,
        costUsd: call.costUsd,
      })),
    );

    const body = `<h1>${escapeHtml(lab.title)}</h1>
      <p class="muted">Lab #${lab.id} · lớp ${lab.classId} · ${lab.tests.length} test ·
        ${submissions.length} bài được tính</p>
      <ul class="tabs">
        <li><a href="?tab=queue" ${tab === 'queue' ? 'aria-current="page"' : ''}>Review queue (FAQ-10)</a></li>
        <li><a href="?tab=all" ${tab === 'all' ? 'aria-current="page"' : ''}>Tất cả verdict</a></li>
      </ul>
      ${
        rows.length === 0
          ? '<p class="muted">Chưa có verdict nào trong tab này.</p>'
          : `<table><thead><tr><th>Bài</th><th>Sinh viên</th><th>Constraint</th>
             <th>Verdict</th><th>Evidence</th><th>TA</th></tr></thead>
             <tbody>${rows.join('')}</tbody></table>`
      }
      <p class="muted">Model calls: ${cost.calls} · token vào ${cost.tokensIn} ·
        token ra ${cost.tokensOut} · list price $${cost.costUsd.toFixed(6)}</p>
      <p><a href="/ta">← Danh sách lab</a></p>`;

    sendHtml(res, 200, layout({ title: lab.title, user, body }));
  }

  /**
   * @param {import('node:http').ServerResponse} res
   * @param {import('./store.js').User} user
   * @returns {Promise<void>}
   */
  async function renderStudentHome(res, user) {
    const labs = await store.listLabs(user.classId);
    const rows =
      labs.length === 0
        ? '<p class="muted">Chưa có lab nào.</p>'
        : `<table><thead><tr><th>#</th><th>Tiêu đề</th><th>Constraint</th><th></th></tr></thead><tbody>
          ${labs
            .map(
              (lab) => `<tr>
                <td>${lab.id}</td>
                <td>${escapeHtml(lab.title)}</td>
                <td>${lab.constraints.length}</td>
                <td><a href="/student/labs/${lab.id}">Mở</a></td>
              </tr>`,
            )
            .join('')}
          </tbody></table>`;
    sendHtml(res, 200, layout({ title: 'Sinh viên', user, body: `<h1>Lab của lớp</h1>${rows}` }));
  }

  /**
   * @param {import('node:http').ServerResponse} res
   * @param {import('./store.js').User} user
   * @param {import('../domain/labs.js').Lab} lab
   * @returns {Promise<void>}
   */
  async function renderStudentLab(res, user, lab) {
    const submissions = await store.listSubmissions({ labId: lab.id, studentId: user.id });
    const latest = submissions.find((submission) => submission.counted) ?? null;

    const constraintRows = lab.constraints
      .map(
        (constraint) => `<tr>
          <td>${escapeHtml(constraint.text)}</td>
          <td>${constraint.deduction}</td>
          <td>${constraint.kind === 'ban_list' ? 'luật cứng' : 'model'}</td>
        </tr>`,
      )
      .join('');

    const latestBlock =
      latest === null
        ? ''
        : `<p>Bài nộp gần nhất: <a href="/student/submissions/${latest.id}">#${latest.id}</a>
           — <span class="badge ${latest.status === 'judged' ? 'pass' : 'pending'}">${latest.status}</span></p>`;

    const body = `<h1>${escapeHtml(lab.title)}</h1>
      <h2>Đề bài</h2>
      <p>${escapeHtml(lab.statement).replace(/\n/g, '<br>')}</p>

      <h2>Constraint và mức trừ</h2>
      <table><thead><tr><th>Constraint</th><th>Trừ</th><th>Cách soát</th></tr></thead>
      <tbody>${constraintRows}</tbody></table>

      <p class="notice">Bài nộp được soát bằng <strong>luật cứng</strong> và
      <strong>model ngôn ngữ</strong>. Model chỉ nhận đề bài, constraint và code
      <em>đã bỏ comment, tên và MSSV</em> (FAQ-06). Model không quyết định điểm;
      trợ giảng xem lại verdict trước khi công bố (FAQ-08).</p>

      <h2>Nộp bài</h2>
      <p class="muted">${lab.tests.length} test. Chỉ bài nộp cuối cùng của mỗi sinh viên
      được tính (FAQ-02). Nộp lại sẽ thay thế bài trước.</p>
      ${latestBlock}
      <form method="post" action="/student/labs/${lab.id}/submit">
        <label for="sourceCode">Mã nguồn C++</label>
        <textarea id="sourceCode" name="sourceCode" required></textarea>
        <button type="submit">Nộp</button>
      </form>
      <p><a href="/student">← Danh sách lab</a></p>`;

    sendHtml(res, 200, layout({ title: lab.title, user, body }));
  }

  /**
   * @param {import('node:http').ServerResponse} res
   * @param {import('./store.js').User} user
   * @param {Submission} submission
   * @returns {Promise<void>}
   */
  async function renderSubmission(res, user, submission) {
    const lab = await store.findLab(submission.labId);
    if (lab === null) {
      sendError(res, 404, 'Không tìm thấy lab của bài nộp.', { user });
      return;
    }

    const tests =
      submission.tests.length === 0
        ? '<p class="muted">Chưa có kết quả test.</p>'
        : `<table><thead><tr><th>Test</th><th>Kết quả</th></tr></thead><tbody>
          ${submission.tests
            .map(
              (test) => `<tr><td>${escapeHtml(test.name)}</td>
              <td><span class="badge ${test.verdict === 'AC' ? 'pass' : 'violation'}">${test.verdict}</span></td></tr>`,
            )
            .join('')}
          </tbody></table>`;

    const submissionVerdicts = await store.listVerdictsForSubmission(submission.id);
    const verdicts =
      lab.publishedAt === null
        ? `<p class="muted">Verdict constraint chưa được công bố. Trợ giảng xem lại trước
           (FAQ-08). Bạn vẫn thấy constraint và mức trừ ở trên.</p>`
        : `<table><thead><tr><th>Constraint</th><th>Verdict</th><th>Trừ</th></tr></thead><tbody>
          ${submissionVerdicts
            .map((verdict) => {
              const constraint = lab.constraints.find((entry) => entry.id === verdict.constraintId);
              return `<tr><td>${escapeHtml(constraint?.text ?? '')}</td>
                <td>${verdictBadge(verdict)}</td>
                <td>${verdict.verdict === 'violation' ? (constraint?.deduction ?? 0) : 0}</td></tr>`;
            })
            .join('')}
          </tbody></table>`;

    const body = `<h1>Bài nộp #${submission.id}</h1>
      <p>Lab: ${escapeHtml(lab.title)}</p>
      <p>Trạng thái: <span class="badge ${submission.status === 'judged' ? 'pass' : 'pending'}">
        ${submission.status}</span>
        ${submission.counted ? '' : '<span class="muted">(bài cũ, không được tính)</span>'}</p>
      <p class="muted">Nộp lúc ${escapeHtml(submission.submittedAt)} ·
        ${Buffer.byteLength(submission.sourceCode, 'utf8')} byte mã nguồn</p>

      <h2>Kết quả test</h2>
      ${tests}
      <p class="muted">Không hiển thị input/output của test (FAQ-02).</p>

      <h2>Verdict constraint</h2>
      ${verdicts}
      <p><a href="/student/labs/${lab.id}">← Về lab</a></p>`;

    sendHtml(res, 200, layout({ title: `Bài nộp #${submission.id}`, user, body }));
  }

  /**
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @returns {Promise<boolean>} whether this router handled the request
   */
  async function handle(req, res) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = url.pathname;
    const method = req.method ?? 'GET';

    // The PA#2 API keeps its own router and contract.
    if (path === '/v1' || path.startsWith('/v1/')) return false;

    if (path === '/healthz') {
      if (method !== 'GET') {
        sendError(res, 405, 'Chỉ hỗ trợ GET.');
        return true;
      }
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end('{"status":"ok"}');
      return true;
    }

    if (path === '/') {
      const user = await currentUser(req);
      if (user === null) {
        renderLogin(res);
        return true;
      }
      redirect(res, user.role === 'student' ? '/student' : '/ta');
      return true;
    }

    if (path === '/login') {
      if (method === 'GET') {
        renderLogin(res);
        return true;
      }
      if (method !== 'POST') {
        sendError(res, 405, 'Chỉ hỗ trợ GET và POST.');
        return true;
      }

      const form = await readForm(req, 64 * 1024);
      const token = (form.fields.token ?? '').trim();
      const user = token.length === 0 ? null : await store.findUserByToken(token);
      if (user === null) {
        renderLogin(res, 'Token không hợp lệ.');
        return true;
      }

      redirect(res, '/', { 'set-cookie': serializeCookie(SESSION_COOKIE, token) });
      return true;
    }

    if (path === '/logout') {
      if (method !== 'POST') {
        sendError(res, 405, 'Chỉ hỗ trợ POST.');
        return true;
      }
      redirect(res, '/', { 'set-cookie': clearCookie(SESSION_COOKIE) });
      return true;
    }

    const user = await currentUser(req);

    if (path === '/ta' || path.startsWith('/ta/')) {
      if (user === null) {
        redirect(res, '/');
        return true;
      }
      if (user.role !== 'ta' && user.role !== 'admin') {
        sendError(res, 403, 'Chỉ trợ giảng hoặc quản trị viên được vào trang này.', { user });
        return true;
      }

      if (path === '/ta' && method === 'GET') {
        await renderTaHome(res, user);
        return true;
      }

      if (path === '/ta/labs/new' && method === 'GET') {
        if (user.role !== 'ta') {
          sendError(res, 403, 'Chỉ trợ giảng được tạo lab.', { user });
          return true;
        }
        renderLabForm(res, user);
        return true;
      }

      if (path === '/ta/labs' && method === 'POST') {
        if (user.role !== 'ta' || user.classId === null) {
          sendError(res, 403, 'Chỉ trợ giảng được tạo lab.', { user });
          return true;
        }

        const form = await readForm(req);
        if (form.tooLarge) {
          sendError(res, 413, 'Biểu mẫu quá lớn.', { user });
          return true;
        }

        const title = (form.fields.title ?? '').trim();
        const statement = (form.fields.statement ?? '').trim();
        const constraints = parseConstraintLines(form.fields.constraints ?? '');
        const tests = pairTestFiles(
          form.files.map((file) => ({
            name: basename(file.filename),
            content: file.content.toString('utf8'),
          })),
        );

        if (title.length === 0 || statement.length === 0) {
          sendError(res, 400, 'Tiêu đề và đề bài là bắt buộc.', { user });
          return true;
        }
        if (constraints.length === 0) {
          sendError(res, 400, 'Cần ít nhất một constraint.', { user });
          return true;
        }
        if (tests.length === 0) {
          sendError(res, 400, 'Cần ít nhất một cặp file NN.in / NN.out.', { user });
          return true;
        }

        const lab = await store.createLab({
          classId: user.classId,
          title,
          statement,
          tests,
          constraints,
          createdBy: user.id,
          now: clock.now(),
        });

        redirect(res, `/ta/labs/${lab.id}/review`);
        return true;
      }

      const reviewId = idFrom(path, REVIEW_ROUTE);
      if (reviewId !== null) {
        if (method !== 'GET') {
          sendError(res, 405, 'Chỉ hỗ trợ GET.', { user });
          return true;
        }
        const lab = await store.findLab(reviewId);
        if (lab === null) {
          sendError(res, 404, 'Không tìm thấy lab.', { user });
          return true;
        }
        if (!canAccessLab(user, lab)) {
          sendError(res, 403, 'Lab này thuộc lớp khác.', { user });
          return true;
        }
        await renderReview(res, user, lab, url.searchParams.get('tab') === 'all' ? 'all' : 'queue');
        return true;
      }

      const verdictId = idFrom(path, TA_VERDICT_ROUTE);
      if (verdictId !== null) {
        if (method !== 'POST') {
          sendError(res, 405, 'Chỉ hỗ trợ POST.', { user });
          return true;
        }

        const verdict = await store.findVerdict(verdictId);
        if (verdict === null) {
          sendError(res, 404, 'Không tìm thấy verdict.', { user });
          return true;
        }
        const submission = await store.findSubmission(verdict.submissionId);
        const lab = submission === null ? null : await store.findLab(submission.labId);
        if (submission === null || lab === null) {
          sendError(res, 404, 'Không tìm thấy bài nộp.', { user });
          return true;
        }
        if (!canAccessLab(user, lab)) {
          sendError(res, 403, 'Lab này thuộc lớp khác.', { user });
          return true;
        }

        const form = await readForm(req, 64 * 1024);
        const decision = form.fields.decision;
        if (decision !== 'pass' && decision !== 'violation') {
          sendError(res, 400, 'Quyết định của trợ giảng phải là pass hoặc violation.', { user });
          return true;
        }
        const evidence = parseEvidenceLines(form.fields.evidence ?? '');
        const error = validateDecision(decision, evidence);
        if (error !== null) {
          sendError(res, 400, error, { user });
          return true;
        }

        await store.decideVerdict(verdictId, decision, evidence);
        redirect(res, `/ta/labs/${lab.id}/review`);
        return true;
      }

      sendError(res, 404, 'Không có trang này.', { user });
      return true;
    }

    if (path === '/student' || path.startsWith('/student/')) {
      if (user === null) {
        redirect(res, '/');
        return true;
      }
      if (user.role !== 'student') {
        sendError(res, 403, 'Chỉ sinh viên được vào trang này.', { user });
        return true;
      }

      if (path === '/student' && method === 'GET') {
        await renderStudentHome(res, user);
        return true;
      }

      const labId = idFrom(path, STUDENT_LAB_ROUTE);
      if (labId !== null && method === 'GET') {
        const lab = await store.findLab(labId);
        if (lab === null) {
          sendError(res, 404, 'Không tìm thấy lab.', { user });
          return true;
        }
        if (lab.classId !== user.classId) {
          sendError(res, 403, 'Lab này thuộc lớp khác.', { user });
          return true;
        }
        await renderStudentLab(res, user, lab);
        return true;
      }

      const submitLabId = idFrom(path, STUDENT_SUBMIT_ROUTE);
      if (submitLabId !== null) {
        if (method !== 'POST') {
          sendError(res, 405, 'Chỉ hỗ trợ POST.', { user });
          return true;
        }
        const lab = await store.findLab(submitLabId);
        if (lab === null) {
          sendError(res, 404, 'Không tìm thấy lab.', { user });
          return true;
        }
        if (lab.classId !== user.classId) {
          sendError(res, 403, 'Lab này thuộc lớp khác.', { user });
          return true;
        }

        const form = await readForm(req);
        if (form.tooLarge) {
          sendError(res, 413, 'Bài nộp quá lớn.', { user });
          return true;
        }

        const sourceCode = form.fields.sourceCode ?? '';
        if (sourceCode.trim().length === 0) {
          sendError(res, 400, 'Mã nguồn không được để trống.', { user });
          return true;
        }
        if (Buffer.byteLength(sourceCode, 'utf8') > MAX_SOURCE_BYTES) {
          sendError(res, 400, 'Mã nguồn tối đa 64 KiB.', { user });
          return true;
        }

        const submission = await store.createSubmission({
          labId: lab.id,
          studentId: user.id,
          sourceCode,
          submittedAt: clock.now().toISOString(),
        });

        redirect(res, `/student/submissions/${submission.id}`);
        return true;
      }

      const submissionId = idFrom(path, STUDENT_SUBMISSION_ROUTE);
      if (submissionId !== null && method === 'GET') {
        const submission = await store.findSubmission(submissionId);
        if (submission === null) {
          sendError(res, 404, 'Không tìm thấy bài nộp.', { user });
          return true;
        }
        if (submission.studentId !== user.id) {
          sendError(res, 403, 'Đây không phải bài nộp của bạn.', { user });
          return true;
        }
        await renderSubmission(res, user, submission);
        return true;
      }

      sendError(res, 404, 'Không có trang này.', { user });
      return true;
    }

    return false;
  }

  return { handle };
}
