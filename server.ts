import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'scholarship@dpm').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'DPM_scholarship@2026';

const submissionsStore: any[] = [];
const invitationsStore: any[] = [];

app.use(express.json({ limit: '20mb' }));

app.use(express.static(ROOT_DIR));
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(DIST_DIR));
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/admin/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  return res.json({
    success: true,
    email: ADMIN_EMAIL,
    message: 'Admin access granted.',
  });
});

app.post('/api/admin/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out.' });
});

app.get('/api/admin/submissions', (_req, res) => {
  res.json({ total: submissionsStore.length, submissions: submissionsStore });
});

app.get('/api/admin/submissions/:id', (req, res) => {
  const item = submissionsStore.find((s) => s.id === req.params.id || s.referenceNumber === req.params.id);
  if (!item) return res.status(404).json({ error: 'Submission not found' });
  return res.json({ submission: item });
});

app.patch('/api/admin/submissions/:id/status', (req, res) => {
  const item = submissionsStore.find((s) => s.id === req.params.id || s.referenceNumber === req.params.id);
  if (!item) return res.status(404).json({ error: 'Submission not found' });

  const { status, adminNotes, dpmRanking, reviewedBy } = req.body || {};
  if (status) item.status = status;
  if (adminNotes !== undefined) item.adminNotes = adminNotes;
  if (dpmRanking !== undefined) item.dpmRanking = dpmRanking;
  if (reviewedBy !== undefined) item.reviewedBy = reviewedBy;
  item.reviewedAt = new Date().toISOString();

  if (item.formData) {
    item.formData.submissionStatus = item.status;
  }

  return res.json({ success: true, submission: item });
});

app.post('/api/admin/submissions/:id/resend-email', (req, res) => {
  const item = submissionsStore.find((s) => s.id === req.params.id || s.referenceNumber === req.params.id);
  if (!item) return res.status(404).json({ error: 'Submission not found' });

  const recipientEmail = String(req.body?.recipientEmail || item.formData?.email || ADMIN_EMAIL);
  const emailDelivery = {
    sent: true,
    recipient: recipientEmail,
    subject: `Re-dispatched: ${item.referenceNumber}`,
    sentAt: new Date().toISOString(),
    status: 'delivered',
  };

  item.emailDelivery = emailDelivery;
  return res.json({ success: true, emailDelivery });
});

app.delete('/api/admin/submissions/:id', (req, res) => {
  const index = submissionsStore.findIndex((s) => s.id === req.params.id || s.referenceNumber === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Submission not found' });
  submissionsStore.splice(index, 1);
  return res.json({ success: true });
});

app.post('/api/submit-form', (req, res) => {
  const formData = req.body?.formData || {};
  const payload = {
    id: `sub-${Date.now()}`,
    referenceNumber: `DPM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    status: 'Submitted',
    formData: { ...formData, submissionStatus: 'Submitted' },
    adminNotes: 'Received via web portal.',
    dpmRanking: 'Pending Review',
    emailDelivery: {
      sent: true,
      recipient: formData.email || ADMIN_EMAIL,
      subject: 'DPM Training Aid Bid Submitted',
      sentAt: new Date().toISOString(),
      status: 'delivered',
    },
  };

  submissionsStore.unshift(payload);

  return res.json({ success: true, referenceNumber: payload.referenceNumber, submission: payload });
});

app.get('/api/invitations', (_req, res) => {
  res.json({ total: invitationsStore.length, invitations: invitationsStore });
});

app.get('/api/invitations/:token', (req, res) => {
  const token = req.params.token;
  const invitation = invitationsStore.find((i) => i.token === token || i.id === token);
  if (!invitation) return res.status(404).json({ error: 'Invitation not found' });

  invitation.accessCount = Number(invitation.accessCount || 0) + 1;
  invitation.lastAccessedAt = new Date().toISOString();

  return res.json({ success: true, invitation });
});

app.post('/api/invitations', (req, res) => {
  const token = `PNG-DPM-${Date.now().toString().slice(-6)}`;
  const invitation = {
    id: `inv-${Date.now()}`,
    token,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
    targetDepartment: req.body?.targetDepartment || 'Open / All Public Service Agencies',
    targetNomineeName: req.body?.targetNomineeName || '',
    targetNomineeEmail: req.body?.targetNomineeEmail || '',
    targetDonor: req.body?.targetDonor || '',
    targetCourseTitle: req.body?.targetCourseTitle || '',
    studyLevel: req.body?.studyLevel || '',
    sectorCategory: req.body?.sectorCategory || '',
    notes: req.body?.notes || '',
    status: 'Active',
    accessCount: 0,
    shareableUrl: `${req.protocol}://${req.get('host') || 'localhost:3000'}?invite=${token}`,
    formDataOverride: {},
  };

  invitationsStore.unshift(invitation);
  return res.json({ success: true, invitation });
});

app.get('/admin', (_req, res) => {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.get(['/', '/login', '/dashboard'], (_req, res) => {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.use((_req, res) => {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
