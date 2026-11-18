# The Art of Advertising — Interactive Reading

An independent, Arabic RTL learning website for the two supplied course-book pages (54–55), Unit 4: **The Art of Advertising**.

## Learning experience
- Four reading topics: Compact Cars, the Henk Suitcase, the Fold-up Bike, and About Bicycles.
- The reading is an educational paraphrase based on the supplied PDF. It preserves the facts and learning focus without reproducing the full textbook passages verbatim.
- One natural English narration track, created with HeyGen Voice using **Craig — Warm & Approachable**. The generated audio is about 89.8 seconds long.
- Sentence-level playback highlighting uses returned word timing data grouped into sentence time ranges.
- Students can play the complete reading, start from any sentence, pause, resume, stop, and adjust playback speed from 0.25× to 1.0×.
- Six B. Comprehension True/False checks. The evidence button only opens the matching passage sentence after the selected answer is correct.
- An additional Practice section with four exercise formats and five questions each: multiple choice, fill in the blank, vocabulary matching, and true/false.
- Every practice question links to its supporting sentence and highlights it in the reading page.
- The final results page scores all 26 questions and provides evidence links for incorrect answers.

## Privacy and scope
- This project is separate from english-hero, cosmic-quest, and the earlier conversation page in public/masharee-awal/.
- No student accounts, names, usernames, passwords, email collection, progress database, analytics, ads, or third-party progress APIs.
- Answers are held in the current browser tab's sessionStorage only so selections survive moving between the questions and passage. They are not a cross-device or teacher progress record.
- The audio file is served from HeyGen's generated-audio host. The Content Security Policy allows that host only for media playback.
- The original conversation page and its recordings are not modified by this branch.

## Verification
- node --test tests/validate.mjs checks page wiring, data counts, evidence references, timing ranges, privacy boundaries, and security policy.
- node tests/browser-smoke.mjs checks the Worker, responsive layout, sentence highlighting, evidence navigation, question behavior, scoring, and accessibility with Playwright and axe-core.
- These automated checks do not replace listening on a real iPhone and desktop browser, checking audio seeking on iOS Safari, and reviewing the finished lesson content.

## Deployment
- Changes are on feature/art-advertising-audio-practice.
- Do not merge or deploy until the owner has reviewed the preview and approved publication.
