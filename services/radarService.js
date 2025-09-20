export async function getRadarLayers() {
  return [
    {
      name: "Précipitations",
      url: "https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/2/1_1.png",
      attribution: "Radar RainViewer",
    },
    {
      name: "Nuages (satellite)",
      url: "https://tilecache.rainviewer.com/v2/satellite/{time}/256/{z}/{x}/{y}/2/1_1.png",
      attribution: "Satellite IR RainViewer",
    },
  ];
}
