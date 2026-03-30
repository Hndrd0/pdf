/**
 * config.js
 * Defines the file manifest for each subject.
 * Update these lists when new PDFs are added to the /PDF/ folders.
 *
 * Folder mapping:
 *   Maths         → PDF/MATHS/
 *   Science       → PDF/SC/
 *   English       → PDF/ENGLISH/
 *   Social Science→ PDF/SSC/
 */

const SUBJECTS = [
  {
    id: "maths",
    label: "Maths",
    icon: "📐",
    description: "Mathematics chapters & exercises",
    folder: "PDF/MATHS",
    files: [
      "Chapter (1).pdf",
      "Chapter (2).pdf",
      "Chapter (3).pdf",
      "Chapter (4).pdf",
      "Chapter (5).pdf",
      "Chapter (6).pdf",
      "Chapter (7).pdf",
      "Chapter (8).pdf",
      "Chapter (9).pdf",
      "Chapter (10).pdf",
      "Chapter (11).pdf",
      "Chapter (12).pdf",
      "Chapter (13).pdf",
      "Chapter (14).pdf",
      "Answers.pdf",
      "Appendix (1).pdf",
      "Appendix (2).pdf"
    ]
  },
  {
    id: "science",
    label: "Science",
    icon: "🔬",
    description: "Science chapters & experiments",
    folder: "PDF/SC",
    files: [
      "Chapter (1).pdf",
      "Chapter (2).pdf",
      "Chapter (3).pdf",
      "Chapter (4).pdf",
      "Chapter (5).pdf",
      "Chapter (6).pdf",
      "Chapter (7).pdf",
      "Chapter (8).pdf",
      "Chapter (9).pdf",
      "Chapter (10).pdf",
      "Chapter (11).pdf",
      "Chapter (12).pdf",
      "Chapter (13).pdf",
      "Chapter (14).pdf",
      "Answers.pdf"
    ]
  },
  {
    id: "english",
    label: "English",
    icon: "📖",
    description: "English chapters & literature",
    folder: "PDF/ENGLISH",
    files: [
      "Chapter (1).pdf",
      "Chapter (2).pdf",
      "Chapter (3).pdf",
      "Chapter (4).pdf",
      "Chapter (5).pdf",
      "Chapter (6).pdf",
      "Chapter (7).pdf",
      "Chapter (8).pdf",
      "Chapter (9).pdf",
      "Chapter (10).pdf",
      "Answers.pdf"
    ]
  },
  {
    id: "ssc",
    label: "Social Science",
    icon: "🌍",
    description: "Social Science chapters & maps",
    folder: "PDF/SSC",
    files: [
      "Chapter (1).pdf",
      "Chapter (2).pdf",
      "Chapter (3).pdf",
      "Chapter (4).pdf",
      "Chapter (5).pdf",
      "Chapter (6).pdf",
      "Chapter (7).pdf",
      "Chapter (8).pdf",
      "Chapter (9).pdf",
      "Chapter (10).pdf",
      "Chapter (11).pdf",
      "Chapter (12).pdf",
      "Answers.pdf",
      "Appendix (1).pdf",
      "Appendix (2).pdf"
    ]
  }
];
