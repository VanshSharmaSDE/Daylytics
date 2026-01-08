const Task = require('../models/Task');
const DailyArchive = require('../models/DailyArchive');
const User = require('../models/User');

const formatDate = (d = new Date()) => d.toISOString().slice(0, 10);

/**
 * Auto-archive yesterday's tasks for all users
 * Runs daily at midnight
 * All tasks (completed and incomplete) stay on their original date
 */
async function autoArchiveAndUpdateTasks() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = formatDate(yesterday);

    console.log(`[Auto-Archive] Starting auto-archive for ${yesterdayDate}`);

    // Get all users
    const users = await User.find({});
    let archivedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      try {
        // Archive yesterday's tasks (all tasks, completed and incomplete)
        const existingArchive = await DailyArchive.findOne({ user: user._id, date: yesterdayDate });
        if (existingArchive) {
          skippedCount++;
          continue;
        }

        const tasks = await Task.find({ user: user._id, date: yesterdayDate });
        if (!tasks || tasks.length === 0) {
          skippedCount++;
          continue;
        }

        const total = tasks.length;
        const completed = tasks.filter(t => t.done).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        const archive = new DailyArchive({ 
          user: user._id, 
          date: yesterdayDate, 
          total, 
          completed, 
          percentage 
        });
        await archive.save();
        archivedCount++;
        console.log(`[Auto-Archive] Archived ${total} tasks for user ${user.email}`);

      } catch (userErr) {
        console.error(`[Auto-Archive] Error processing user ${user.email}:`, userErr.message);
      }
    }

    console.log(`[Auto-Archive] Completed: ${archivedCount} archived, ${skippedCount} skipped`);
  } catch (err) {
    console.error('[Auto-Archive] Error in auto-archive:', err.message);
  }
}

/**
 * Calculate milliseconds until next midnight
 */
function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight - now;
}

/**
 * Start the auto-archive scheduler
 */
function startAutoArchiveScheduler() {
  // Run at midnight every day
  const scheduleNextRun = () => {
    const delay = msUntilMidnight();
    console.log(`[Auto-Archive] Next run scheduled in ${Math.round(delay / 1000 / 60)} minutes`);
    
    setTimeout(() => {
      autoArchiveAndUpdateTasks();
      scheduleNextRun(); // Schedule next day
    }, delay);
  };

  scheduleNextRun();
  console.log('[Auto-Archive] Scheduler started');
}

module.exports = { startAutoArchiveScheduler, autoArchiveAndUpdateTasks };
