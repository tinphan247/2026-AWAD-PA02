import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { createApp } from '../../src/app.js';

/**
 * @param {ReturnType<typeof createApp>} app
 */
async function start(app = createApp()) {
  const server = createServer(app.handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(undefined)));
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('no address');

  return {
    base: `http://127.0.0.1:${address.port}`,
    app,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve(undefined));
      }),
  };
}

/**
 * @param {string} base
 * @param {string} token
 * @returns {Promise<string>} the session cookie
 */
async function login(base, token) {
  const res = await fetch(`${base}/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }).toString(),
    redirect: 'manual',
  });

  assert.equal(res.status, 303);
  const cookie = res.headers.get('set-cookie') ?? '';
  assert.match(cookie, /leetkob_session=/);
  return cookie.split(';')[0] ?? '';
}

/**
 * @param {Record<string, string>} fields
 * @param {{ name: string, filename: string, content: string }[]} files
 */
function multipart(fields, files) {
  const boundary = `----leetkob${Math.random().toString(16).slice(2)}`;
  const chunks = [];

  for (const [name, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
      ),
    );
  }

  for (const file of files) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\nContent-Type: text/plain\r\n\r\n`,
      ),
    );
    chunks.push(Buffer.from(file.content));
    chunks.push(Buffer.from('\r\n'));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { body: Buffer.concat(chunks), contentType: `multipart/form-data; boundary=${boundary}` };
}

/**
 * @param {string} base
 * @param {string} cookie
 * @param {number} labId
 * @param {string} sourceCode
 * @returns {Promise<number>} the submission id
 */
async function submitAs(base, cookie, labId, sourceCode) {
  const res = await fetch(`${base}/student/labs/${labId}/submit`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ sourceCode }).toString(),
    redirect: 'manual',
  });

  assert.equal(res.status, 303);
  return Number(/\/student\/submissions\/(\d+)/.exec(res.headers.get('location') ?? '')?.[1]);
}

/**
 * @param {string} haystack
 * @param {string} needle
 * @returns {number}
 */
function countOf(haystack, needle) {
  return haystack.split(needle).length - 1;
}

/**
 * @param {string} base
 * @param {string} cookie
 * @returns {Promise<string>}
 */
async function createLab(base, cookie) {
  const form = multipart(
    {
      title: 'Sort the array',
      statement: 'Read n, then n integers and print them in non-decreasing order.',
      constraints: 'Do not call `std::sort`. | 5\nUse a stable algorithm. | 3',
    },
    [
      { name: 'tests', filename: '01.in', content: '3\n3 1 2\n' },
      { name: 'tests', filename: '01.out', content: '1 2 3\n' },
      { name: 'tests', filename: '02.in', content: '2\n2 1\n' },
      { name: 'tests', filename: '02.out', content: '1 2\n' },
    ],
  );

  const res = await fetch(`${base}/ta/labs`, {
    method: 'POST',
    headers: { cookie, 'content-type': form.contentType },
    body: form.body,
    redirect: 'manual',
  });

  assert.equal(res.status, 303);
  const location = res.headers.get('location') ?? '';
  assert.match(location, /^\/ta\/labs\/\d+\/review$/);
  return location;
}

test('the PA#3 flow: TA creates a lab, student submits, TA reviews and decides', async () => {
  const app = await start();
  try {
    const ta = await login(app.base, 'ta1-token');
    const location = await createLab(app.base, ta);
    const labId = Number(/\/ta\/labs\/(\d+)\/review/.exec(location)?.[1]);

    const lab = app.app.testing.webStore.findLab(labId);
    assert.ok(lab);
    assert.equal(lab.tests.length, 2, 'both .in/.out pairs are stored');
    assert.equal(lab.constraints.length, 2);
    assert.equal(lab.constraints[0]?.kind, 'ban_list');
    assert.equal(lab.constraints[1]?.kind, 'semantic');

    // A TA of another class gets 403.
    const otherTa = await login(app.base, 'ta2-token');
    const forbidden = await fetch(`${app.base}${location}`, { headers: { cookie: otherTa } });
    assert.equal(forbidden.status, 403);

    // Student sees the constraints, deductions and the model notice.
    const student = await login(app.base, 'sv1-token');
    const labPage = await fetch(`${app.base}/student/labs/${labId}`, {
      headers: { cookie: student },
    });
    const labHtml = await labPage.text();
    assert.equal(labPage.status, 200);
    assert.match(labHtml, /Do not call `std::sort`\./);
    assert.match(labHtml, /FAQ-06/);
    assert.match(labHtml, /trừ 5|>5</);

    // Submit, then the status page hides constraint verdicts (FAQ-08).
    const submitted = await fetch(`${app.base}/student/labs/${labId}/submit`, {
      method: 'POST',
      headers: { cookie: student, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        sourceCode: '#include <algorithm>\nint main() { return 0; }\n',
      }).toString(),
      redirect: 'manual',
    });
    assert.equal(submitted.status, 303);
    const submissionUrl = submitted.headers.get('location') ?? '';
    assert.match(submissionUrl, /^\/student\/submissions\/\d+$/);

    const statusPage = await fetch(`${app.base}${submissionUrl}`, { headers: { cookie: student } });
    const statusHtml = await statusPage.text();
    assert.equal(statusPage.status, 200);
    assert.match(statusHtml, /queued/);
    assert.doesNotMatch(statusHtml, /Do not call `std::sort`\./);
    assert.match(statusHtml, /chưa được công bố/);

    // Inject the verdicts the worker will write: one violation and three passes.
    const submissionId = Number(/\/student\/submissions\/(\d+)/.exec(submissionUrl)?.[1]);
    const [banList, semantic] = lab.constraints;
    assert.ok(banList && semantic);
    app.app.testing.webStore.addVerdict({
      submissionId,
      constraintId: banList.id,
      verdict: 'violation',
      evidence: [{ line: 2, text: 'sort(a, a + n);' }],
      decidedBy: 'hard_rule',
    });

    // Two more students submit, so the 10% pass sample does not cover them all.
    const sv2 = await login(app.base, 'sv2-token');
    const sv3 = await login(app.base, 'sv3-token');
    const sv2Submission = await submitAs(app.base, sv2, labId, 'int main() { return 0; }');
    const sv3Submission = await submitAs(app.base, sv3, labId, 'int main() { return 1; }');

    for (const id of [submissionId, sv2Submission, sv3Submission]) {
      app.app.testing.webStore.addVerdict({
        submissionId: id,
        constraintId: semantic.id,
        verdict: 'pass',
        decidedBy: 'model',
      });
    }

    // FAQ-10: the violation is always queued; ceil(10% of 3 passes) = 1 pass.
    const queuePage = await fetch(`${app.base}${location}?tab=queue`, {
      headers: { cookie: ta },
    });
    const queueHtml = await queuePage.text();
    assert.equal(queuePage.status, 200);
    assert.match(queueHtml, /violation/);
    assert.match(queueHtml, /sort\(a, a \+ n\);/);
    assert.match(queueHtml, /trừ 5/);
    assert.equal(countOf(queueHtml, 'Use a stable algorithm.'), 1);

    // The all-verdicts tab shows every pass, marking the ones outside the sample.
    const allPage = await fetch(`${app.base}${location}?tab=all`, { headers: { cookie: ta } });
    const allHtml = await allPage.text();
    assert.equal(countOf(allHtml, 'Use a stable algorithm.'), 3);
    assert.equal(countOf(allHtml, 'không vào mẫu review 10%'), 2);

    // A violation decision needs evidence; then it is stored.
    const verdictId = app.app.testing.webStore.listVerdictsForLab(labId)[0]?.id;
    assert.ok(verdictId);

    const missingEvidence = await fetch(`${app.base}/ta/verdicts/${verdictId}`, {
      method: 'POST',
      headers: { cookie: ta, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ decision: 'violation', evidence: '' }).toString(),
      redirect: 'manual',
    });
    assert.equal(missingEvidence.status, 400);

    const invalidDecision = await fetch(`${app.base}/ta/verdicts/${verdictId}`, {
      method: 'POST',
      headers: { cookie: ta, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ decision: 'unsure', evidence: '' }).toString(),
      redirect: 'manual',
    });
    assert.equal(invalidDecision.status, 400);
    assert.equal(app.app.testing.webStore.findVerdict(verdictId)?.taDecision, null);

    const decided = await fetch(`${app.base}/ta/verdicts/${verdictId}`, {
      method: 'POST',
      headers: { cookie: ta, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        decision: 'violation',
        evidence: '2|sort(a, a + n);',
      }).toString(),
      redirect: 'manual',
    });
    assert.equal(decided.status, 303);
    assert.equal(app.app.testing.webStore.findVerdict(verdictId)?.taDecision, 'violation');
  } finally {
    await app.close();
  }
});

test('only the last submission of a student is counted (FAQ-02)', async () => {
  const app = await start();
  try {
    const ta = await login(app.base, 'ta1-token');
    const location = await createLab(app.base, ta);
    const labId = Number(/\/ta\/labs\/(\d+)\/review/.exec(location)?.[1]);

    const student = await login(app.base, 'sv2-token');
    for (const code of ['int main() { return 1; }', 'int main() { return 2; }']) {
      const res = await fetch(`${app.base}/student/labs/${labId}/submit`, {
        method: 'POST',
        headers: { cookie: student, 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ sourceCode: code }).toString(),
        redirect: 'manual',
      });
      assert.equal(res.status, 303);
    }

    const submissions = app.app.testing.webStore.listSubmissions({ labId });
    assert.equal(submissions.length, 2);
    assert.equal(submissions.filter((submission) => submission.counted).length, 1);
    assert.equal(submissions[1]?.counted, true);
  } finally {
    await app.close();
  }
});

test('the UI is closed without a session and /v1 keeps its PA#2 contract', async () => {
  const app = await start();
  try {
    const home = await fetch(`${app.base}/`, { redirect: 'manual' });
    assert.equal(home.status, 200);
    assert.match(await home.text(), /Đăng nhập/);

    const ta = await fetch(`${app.base}/ta`, { redirect: 'manual' });
    assert.equal(ta.status, 303);
    assert.equal(ta.headers.get('location'), '/');

    const healthz = await fetch(`${app.base}/healthz`);
    assert.equal(healthz.status, 200);
    assert.deepEqual(await healthz.json(), { status: 'ok' });

    const api = await fetch(`${app.base}/v1/labs/7/submissions`);
    assert.equal(api.status, 405);
    assert.match(api.headers.get('content-type') ?? '', /^application\/problem\+json/);
  } finally {
    await app.close();
  }
});
