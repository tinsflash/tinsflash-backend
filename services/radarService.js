// services/radarService.js
export async function radarHandler(zone) {
  try {
    return {
      success: true,
      tiles: [
        {
          name: "Radar pluie",
          url: "https://tilecache.rainviewer.com/v2/radar/{z}/{x}/{y}/2/1_1.png",
        },
        {
          name: "Radar nuages",
          url: "https://tilecache.rainviewer.com/v2/satellite/{z}/{x}/{y}/0/1_1.png",
        },
      ],
    };
  } catch (err) {
    console.error("❌ Radar error:", err.message);
    return { success: false, error: "Radar service failed" };
  }
}
