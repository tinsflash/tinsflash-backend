// services/userService.js
import User from "../models/User.js";

export async function getUserStats() {
  try {
    const users = await User.aggregate([
      { $group: { _id: "$plan", count: { $sum: 1 } } }
    ]);

    const stats = { free: 0, premium: 0, pro: 0 };
    users.forEach(u => { stats[u._id] = u.count; });

    return stats;
  } catch (err) {
    console.error("❌ User stats error:", err.message);
    return { free: 0, premium: 0, pro: 0 };
  }
}
