/**
 * config.js
 * Defines the file manifest for each subject.
 * Update these lists when new PDFs are added to the /PDF/ folders.
 *
 * Subjects with sub-books use a `sections` array instead of a flat `files` array.
 *
 * Folder mapping:
 *   Maths         → PDF/MATHS/
 *   Science       → PDF/SC/
 *   English       → PDF/ENGLISH/{FIRSTFLIGHT,FOOTPRINTSWITHOUTFOOT}/
 *   Social Science→ PDF/SSC/{HISTORY,GEO,POLSC,ECO}/
 *   Hindi         → PDF/HINDI/{SPARSH,SANCHAYAN}/
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
      "Answers.pdf"
    ]
  },
  {
    id: "english",
    label: "English",
    icon: "📖",
    description: "English chapters & literature",
    folder: "PDF/ENGLISH",
    sections: [
      {
        id: "firstflight",
        label: "First Flight",
        folder: "PDF/ENGLISH/FIRSTFLIGHT",
        files: [
          "Chapter (1).pdf",
          "Chapter (2).pdf",
          "Chapter (3).pdf",
          "Chapter (4).pdf",
          "Chapter (5).pdf",
          "Chapter (6).pdf",
          "Chapter (7).pdf",
          "Chapter (8).pdf",
          "Chapter (9).pdf"
        ]
      },
      {
        id: "footprints",
        label: "Footprints Without Feet",
        folder: "PDF/ENGLISH/FOOTPRINTSWITHOUTFOOT",
        files: [
          "Chapter (1).pdf",
          "Chapter (2).pdf",
          "Chapter (3).pdf",
          "Chapter (4).pdf",
          "Chapter (5).pdf",
          "Chapter (6).pdf",
          "Chapter (7).pdf",
          "Chapter (8).pdf",
          "Chapter (9).pdf"
        ]
      }
    ]
  },
  {
    id: "ssc",
    label: "Social Science",
    icon: "🌍",
    description: "Social Science chapters & maps",
    folder: "PDF/SSC",
    sections: [
      {
        id: "history",
        label: "History — India and the Contemporary World",
        folder: "PDF/SSC/HISTORY",
        files: [
          "Chapter (1).pdf",
          "Chapter (2).pdf",
          "Chapter (3).pdf",
          "Chapter (4).pdf",
          "Chapter (5).pdf"
        ]
      },
      {
        id: "geo",
        label: "Geography — Contemporary India",
        folder: "PDF/SSC/GEO",
        files: [
          "Chapter (1).pdf",
          "Chapter (2).pdf",
          "Chapter (3).pdf",
          "Chapter (4).pdf",
          "Chapter (5).pdf",
          "Chapter (6).pdf",
          "Chapter (7).pdf",
          "Appendix.pdf"
        ]
      },
      {
        id: "polsc",
        label: "Political Science — Democratic Politics",
        folder: "PDF/SSC/POLSC",
        files: [
          "Chapter (1).pdf",
          "Chapter (2).pdf",
          "Chapter (3).pdf",
          "Chapter (4).pdf",
          "Chapter (5).pdf"
        ]
      },
      {
        id: "eco",
        label: "Economics",
        folder: "PDF/SSC/ECO",
        files: [
          "Chapter (1).pdf",
          "Chapter (2).pdf",
          "Chapter (3).pdf",
          "Chapter (4).pdf",
          "Chapter (5).pdf"
        ]
      }
    ]
  },
  {
    id: "hindi",
    label: "Hindi",
    icon: "📝",
    description: "Hindi chapters & literature",
    folder: "PDF/HINDI",
    sections: [
      {
        id: "sparsh",
        label: "Sparsh",
        folder: "PDF/HINDI/SPARSH",
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
          "Chapter (14).pdf"
        ]
      },
      {
        id: "sanchayan",
        label: "Sanchayan",
        folder: "PDF/HINDI/SANCHAYAN",
        files: [
          "Chapter (1).pdf",
          "Chapter (2).pdf",
          "Chapter (3).pdf",
          "Lekhan-Parichay.pdf"
        ]
      }
    ]
  },
  {
    id: "extras",
    label: "Extras",
    icon: "🧩",
    description: "Additional study resources",
    folder: "https://github.com/Hndrd0/pdf/releases/download/PDF",
    files: [
      "RD.Sharma.Mathematics.Class.10.2025-26.-.MCQs.pdf"
    ]
  }
];
