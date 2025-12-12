export const PRESETS = {
  box: {
    title: "方塊呼吸法 (Box Breathing)",
    shapePath: "M 10,90 L 10,10 L 90,10 L 90,90 L 10,90",
    cycle: [4, 4, 4, 4],
    actions: ["inhale", "hold", "exhale", "hold"],
    effects: ["fill", "hold-full", "drain", "hold-empty"],
    desc: "" // Unused now, handled by translations
  },
  custom: {
    title: "自訂模式 (Custom Mode)",
    shapePath: "M 10,90 L 10,10 L 90,10 L 90,90 L 10,90",
    cycle: [4, 4, 4, 4],
    actions: ["inhale", "hold", "exhale", "hold"],
    effects: ["fill", "hold-full", "drain", "hold-empty"],
    desc: ""
  },
  "478": {
    title: "4-7-8 呼吸法",
    shapePath: "M 50,90 L 10,10 L 90,10 L 50,90",
    cycle: [4, 7, 8],
    actions: ["inhale", "hold", "exhale"],
    effects: ["fill", "hold-full", "drain"],
    desc: ""
  },
  diaphragm: {
    title: "腹式呼吸法 (Diaphragmatic)",
    shapePath: "M 10,90 L 50,10 L 90,90 L 10,90",
    cycle: [5, 5, 2],
    actions: ["inhale", "exhale", "rest"],
    effects: ["fill", "drain", "hold-empty"],
    desc: ""
  },
  cyclic: {
    title: "循環歎息呼吸 (Cyclic Sighing)",
    shapePath: "M 50,90 A 40,40 0 0 1 50,10 A 40,40 0 0 1 50,90",
    cycle: [3, 1, 6],
    actions: ["inhale", "inhale", "exhale"],
    effects: ["fill", "fill-max", "drain"],
    desc: ""
  },
  humming: {
    title: "蜂鳴呼吸法 (Bhramari)",
    shapePath: "M 50,90 A 40,40 0 0 1 50,10 A 40,40 0 0 1 50,90",
    cycle: [4, 8],
    actions: ["inhale", "hum"],
    effects: ["fill", "drain"],
    desc: ""
  }
};
