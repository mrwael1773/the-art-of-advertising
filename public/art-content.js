(() => {
  "use strict";

  const sentences = [
    { id: "fiat-1", section: "fiat", text: "The FIAT 500 is a compact Italian car with a classic design.", start: 0.341, end: 3.968 },
    { id: "fiat-2", section: "fiat", text: "The modern model is about 335 centimeters long, 165 centimeters wide, and 149 centimeters high.", start: 4.651, end: 12.757 },
    { id: "fiat-3", section: "fiat", text: "Buyers can choose from different colors and options.", start: 13.041, end: 15.132 },
    { id: "fiat-4", section: "fiat", text: "The two-seat FIAT 500 first appeared in 1957.", start: 16.07, end: 19.484 },
    { id: "fiat-5", section: "fiat", text: "Its engine had 13 horsepower and its top speed was about 85 kilometers per hour.", start: 19.953, end: 24.945 },

    { id: "henk-1", section: "henk", text: "The Henk is a very expensive suitcase designed by Dutch engineers and designers.", start: 25.473, end: 29.612 },
    { id: "henk-2", section: "henk", text: "They spent ten years developing it, and each case is made individually for its customer.", start: 30.337, end: 34.689 },
    { id: "henk-3", section: "henk", text: "It can be made from ebony wood or Italian leather.", start: 35.5, end: 37.804 },
    { id: "henk-4", section: "henk", text: "A remote control hides its titanium wheels and activates a locking system.", start: 38.334, end: 42.003 },
    { id: "henk-5", section: "henk", text: "The suitcase is designed to feel extremely light, and its price ranges from 20,000 to 40,000 dollars.", start: 43.07, end: 49.214 },

    { id: "fold-1", section: "fold", text: "A fold-up bike is portable: it looks like an ordinary bicycle, but it can be folded for easy transport.", start: 49.709, end: 55.469 },
    { id: "fold-2", section: "fold", text: "It is smaller and less bulky than a standard bike.", start: 56.45, end: 58.84 },
    { id: "fold-3", section: "fold", text: "This makes it easier to carry, park, and store.", start: 59.565, end: 62.168 },

    { id: "bicycle-1", section: "bicycle", text: "The first bicycles appeared in France during the 1790s.", start: 62.779, end: 65.809 },
    { id: "bicycle-2", section: "bicycle", text: "They were made of wood, and their front wheels could not turn from side to side.", start: 66.492, end: 70.118 },
    { id: "bicycle-3", section: "bicycle", text: "These early bicycles did not have pedals.", start: 70.886, end: 72.806 },
    { id: "bicycle-4", section: "bicycle", text: "In 1817, Baron Karl von Drais introduced a bicycle with a steerable front wheel in Germany.", start: 73.299, end: 79.358 },
    { id: "bicycle-5", section: "bicycle", text: "In 1839, Scottish blacksmith Kirkpatrick MacMillan introduced the first pedals.", start: 80.04, end: 84.904 },
    { id: "bicycle-6", section: "bicycle", text: "People once believed that a larger front wheel made a bicycle go faster.", start: 85.479, end: 89.277 }
  ];

  const sections = [
    { id: "fiat", title: "COMPACT CARS", subtitle: "The smaller, the better", arabicTitle: "السيارات الصغيرة", page: "54", icon: "🚗", sentenceIds: ["fiat-1", "fiat-2", "fiat-3", "fiat-4", "fiat-5"] },
    { id: "henk", title: "SUITCASE", subtitle: "For the price of a car", arabicTitle: "حقيبة Henk", page: "54", icon: "🧳", sentenceIds: ["henk-1", "henk-2", "henk-3", "henk-4", "henk-5"] },
    { id: "fold", title: "THE FOLD-UP BIKE", subtitle: "A practical folding bicycle", arabicTitle: "الدراجة القابلة للطي", page: "55", icon: "🚲", sentenceIds: ["fold-1", "fold-2", "fold-3"] },
    { id: "bicycle", title: "ABOUT BICYCLES", subtitle: "A short history", arabicTitle: "عن الدراجات", page: "55", icon: "🛞", sentenceIds: ["bicycle-1", "bicycle-2", "bicycle-3", "bicycle-4", "bicycle-5", "bicycle-6"] }
  ];

  const quickCheck = [
    { id: "quick-1", prompt: "The new FIAT 500 is among the world’s most compact cars.", options: ["صح", "خطأ"], correct: 0, evidence: "fiat-1" },
    { id: "quick-2", prompt: "Buyers can select only one color for the FIAT 500.", options: ["صح", "خطأ"], correct: 1, evidence: "fiat-3" },
    { id: "quick-3", prompt: "Engineers from Germany designed the Henk suitcase.", options: ["صح", "خطأ"], correct: 1, evidence: "henk-1" },
    { id: "quick-4", prompt: "Ebony wood is one material used to make the Henk suitcase.", options: ["صح", "خطأ"], correct: 0, evidence: "henk-3" },
    { id: "quick-5", prompt: "A fold-up bike is not as bulky as an ordinary bike.", options: ["صح", "خطأ"], correct: 0, evidence: "fold-2" },
    { id: "quick-6", prompt: "The earliest bicycles did not have pedals.", options: ["صح", "خطأ"], correct: 0, evidence: "bicycle-3" }
  ];

  const practice = [
    {
      id: "choice",
      title: "أولًا: الاختيار من متعدد",
      type: "choice",
      questions: [
        { id: "choice-1", prompt: "Which country is connected with the FIAT 500's design?", options: ["Italy", "Germany", "France"], correct: 0, evidence: "fiat-1" },
        { id: "choice-2", prompt: "Who developed the Henk suitcase?", options: ["Dutch engineers and designers", "French engineers", "Scottish workers"], correct: 0, evidence: "henk-1" },
        { id: "choice-3", prompt: "What can the suitcase remote control do?", options: ["Hide the wheels and activate the lock", "Change the material", "Make the suitcase fly"], correct: 0, evidence: "henk-4" },
        { id: "choice-4", prompt: "Why is a fold-up bike useful?", options: ["It is easier to carry and store", "It is larger than a normal bike", "It has no wheels"], correct: 0, evidence: "fold-3" },
        { id: "choice-5", prompt: "When were pedals first added to bicycles?", options: ["In the 1790s", "In 1817", "In 1839"], correct: 2, evidence: "bicycle-5" }
      ]
    },
    {
      id: "fill",
      title: "ثانيًا: أكمل الفراغ",
      type: "fill",
      questions: [
        { id: "fill-1", prompt: "The two-seat FIAT 500 first appeared in ____.", options: ["1957", "1817", "1839"], correct: 0, evidence: "fiat-4" },
        { id: "fill-2", prompt: "The Henk suitcase was developed by ____ engineers.", options: ["German", "Dutch", "French"], correct: 1, evidence: "henk-1" },
        { id: "fill-3", prompt: "The Henk suitcase wheels are made of ____.", options: ["wood", "leather", "titanium"], correct: 2, evidence: "henk-4" },
        { id: "fill-4", prompt: "The first bicycles appeared in France during the ____.", options: ["1790s", "1817", "1839"], correct: 0, evidence: "bicycle-1" },
        { id: "fill-5", prompt: "Baron Karl von Drais introduced a steerable front wheel in ____.", options: ["1790s", "1817", "1839"], correct: 1, evidence: "bicycle-4" }
      ]
    },
    {
      id: "meaning",
      title: "ثالثًا: صِل الكلمة بمعناها",
      type: "match",
      questions: [
        { id: "meaning-1", prompt: "Match the word compact with its Arabic meaning.", options: ["صغير الحجم", "بشكل فردي", "سهل الحمل", "ضخم ويشغل مساحة", "قابل للتوجيه"], correct: 0, evidence: "fiat-1" },
        { id: "meaning-2", prompt: "Match the word individually with its Arabic meaning.", options: ["صغير الحجم", "بشكل فردي", "سهل الحمل", "ضخم ويشغل مساحة", "قابل للتوجيه"], correct: 1, evidence: "henk-2" },
        { id: "meaning-3", prompt: "Match the word portable with its Arabic meaning.", options: ["صغير الحجم", "بشكل فردي", "سهل الحمل", "ضخم ويشغل مساحة", "قابل للتوجيه"], correct: 2, evidence: "fold-1" },
        { id: "meaning-4", prompt: "Match the word bulky with its Arabic meaning.", options: ["صغير الحجم", "بشكل فردي", "سهل الحمل", "ضخم ويشغل مساحة", "قابل للتوجيه"], correct: 3, evidence: "fold-2" },
        { id: "meaning-5", prompt: "Match the word steerable with its Arabic meaning.", options: ["صغير الحجم", "بشكل فردي", "سهل الحمل", "ضخم ويشغل مساحة", "قابل للتوجيه"], correct: 4, evidence: "bicycle-4" }
      ]
    },
    {
      id: "truefalse",
      title: "رابعًا: صح أو خطأ",
      type: "truefalse",
      questions: [
        { id: "truefalse-1", prompt: "The Henk suitcase took ten years to develop.", options: ["صح", "خطأ"], correct: 0, evidence: "henk-2" },
        { id: "truefalse-2", prompt: "The Henk suitcase can cost between 20,000 and 40,000 dollars.", options: ["صح", "خطأ"], correct: 0, evidence: "henk-5" },
        { id: "truefalse-3", prompt: "A fold-up bike is more bulky than a standard bike.", options: ["صح", "خطأ"], correct: 1, evidence: "fold-2" },
        { id: "truefalse-4", prompt: "Kirkpatrick MacMillan was a Scottish blacksmith.", options: ["صح", "خطأ"], correct: 0, evidence: "bicycle-5" },
        { id: "truefalse-5", prompt: "People believed that a smaller front wheel made a bicycle faster.", options: ["صح", "خطأ"], correct: 1, evidence: "bicycle-6" }
      ]
    }
  ];

  window.ART_LESSON = Object.freeze({
    title: "The Art of Advertising",
    audio: {
      src: "https://resource2.heygen.ai/text_to_speech/e5985a6c5fcb4e1d9247c437a6067191/eae6fca42aae4b78b992533e96ab43c9/id=897b5f5e90f94448abacb780ae421a3b.wav",
      duration: 89.77789115646259,
      voice: "Craig - Warm & Approachable"
    },
    sentences,
    sections,
    quickCheck,
    practice
  });
})();