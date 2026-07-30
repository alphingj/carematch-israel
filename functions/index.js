const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

exports.onNewInterest = functions.firestore
  .document('interests/{interestId}')
  .onCreate(async (snap, context) => {
    const { jobId, caregiverName } = snap.data();
    if (!jobId) return;

    const job = await db.doc(`jobs/${jobId}`).get();
    if (!job.exists) return;

    const { ownerId, title } = job.data();

    const owner = await db.doc(`users/${ownerId}`).get();
    if (!owner.exists) return;

    const { fcmToken, notificationsEnabled } = owner.data();
    if (!fcmToken || notificationsEnabled === false) return;

    const message = {
      token: fcmToken,
      notification: {
        title: 'New Interest!',
        body: `${caregiverName || 'A caregiver'} is interested in "${title || 'your job'}"`,
      },
      data: {
        url: `/jobs/${jobId}`,
        type: 'interest',
      },
    };

    try {
      await admin.messaging().send(message);
    } catch (error) {
      functions.logger.error('Failed to send notification', error);
    }
  });

exports.onNewJob = functions.firestore
  .document('jobs/{jobId}')
  .onCreate(async (snap, context) => {
    const { area, title } = snap.data();
    if (!area || !title) return;

    const users = await db.collection('users')
      .where('notificationsEnabled', '==', true)
      .where('role', '==', 'caregiver')
      .get();

    const messages = [];
    users.forEach(doc => {
      const { fcmToken, workArea, languages } = doc.data();
      if (!fcmToken) return;
      if (workArea && workArea !== 'All Area' && workArea !== area) return;

      messages.push({
        token: fcmToken,
        notification: {
          title: 'New Job Posted',
          body: `${title} in ${area}`,
        },
        data: {
          url: `/jobs/${context.params.jobId}`,
          type: 'new_job',
        },
      });
    });

    const results = await Promise.allSettled(messages.map(m =>
      admin.messaging().send(m).catch(e => e)
    ));
    functions.logger.info(`Sent ${results.filter(r => r.status === 'fulfilled').length}/${messages.length} notifications`);
  });
