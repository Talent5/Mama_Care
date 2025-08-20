import Patient from '../models/Patient.js';

// Compute current gestational week from EDD (ISO or Date)
function computeWeekFromEdd(edd) {
  try {
    const eddDate = edd instanceof Date ? edd : new Date(edd);
    if (isNaN(eddDate.getTime())) return null;
    const today = new Date();
    // Normalize to UTC midnight for stable diff
    const toUtcMidnight = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const eddUTC = toUtcMidnight(new Date(eddDate.toISOString()));
    const todayUTC = toUtcMidnight(new Date(today.toISOString()));
    const daysUntil = Math.floor((eddUTC.getTime() - todayUTC.getTime()) / (24 * 60 * 60 * 1000));
    const weeksUntil = Math.floor(daysUntil / 7);
    const ga = 40 - weeksUntil; // gestational age in weeks
    const clamped = Math.max(1, Math.min(42, Math.round(ga)));
    return clamped;
  } catch {
    return null;
  }
}

export async function runPregnancyWeekUpdateOnce(logger = console) {
  try {
    const filter = {
      'currentPregnancy.isPregnant': true,
      'currentPregnancy.estimatedDueDate': { $exists: true, $ne: null },
      isActive: true,
    };
    const patients = await Patient.find(filter).select('currentPregnancy user');
    if (!patients.length) {
      logger.log('[PregnancyScheduler] No patients with EDD found.');
      return { processed: 0, updated: 0 };
    }
    let updated = 0;
    for (const p of patients) {
      const edd = p.currentPregnancy?.estimatedDueDate;
      const week = computeWeekFromEdd(edd);
      if (!week) continue;
      if (p.currentPregnancy?.currentWeek !== week) {
        p.currentPregnancy = {
          ...p.currentPregnancy?.toObject?.() || p.currentPregnancy || {},
          currentWeek: week,
          isPregnant: true,
        };
        try {
          await p.save();
          updated++;
        } catch (e) {
          logger.warn('[PregnancyScheduler] Failed to update patient week', p._id?.toString?.(), e?.message || e);
        }
      }
    }
    logger.log(`[PregnancyScheduler] Processed ${patients.length}, updated ${updated}`);
    return { processed: patients.length, updated };
  } catch (error) {
    console.error('[PregnancyScheduler] Error running update:', error);
    return { processed: 0, updated: 0, error };
  }
}

// Schedule to run once daily around 02:00 server time
export function initPregnancyScheduler(logger = console) {
  const scheduleNext = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(2, 0, 0, 0); // 02:00
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    const delay = next.getTime() - now.getTime();
    logger.log('[PregnancyScheduler] Next run at', next.toISOString());
    setTimeout(async () => {
      await runPregnancyWeekUpdateOnce(logger);
      scheduleNext();
    }, delay);
  };

  // Kick off soon after startup to correct any drift, then schedule next day
  setTimeout(() => {
    runPregnancyWeekUpdateOnce(logger).finally(() => scheduleNext());
  }, 30 * 1000); // wait 30s after boot

  logger.log('[PregnancyScheduler] Initialized');
}

export default initPregnancyScheduler;
