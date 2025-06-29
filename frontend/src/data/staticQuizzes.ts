import { Tutorial } from '../types';

export const staticQuizData: Tutorial[] = [
  {
    id: "tnm-prefixes",
    title: "TNM Prefixes and Basic Concepts",
    thumbnail: "https://radiologyassistant.nl/assets/-1tek-intro-lungca.jpg",
    duration: "10:00",
    tutorial_type: "practice",
    topic: "tnm",
    description: "TNM Prefixes and Basic Concepts from TNM 9th Edition",
    created_at: new Date().toISOString(),
    questions: [
      {
        id: "tnm-prefixes-q1",
        question: "What does the 'p' prefix in TNM staging indicate?",
        type: "multiple-choice",
        options: [
          "Clinical pretreatment staging",
          "Pathologic stage based on surgical resection only",
          "Restaging after part or all treatment",
          "Evaluation category for imaging"
        ],
        points: 10,
        correctAnswer: "Pathologic stage based on surgical resection only",
        explanation: ""
      },
      {
        id: "tnm-prefixes-q2",
        question: "Which evaluation category denotes tissue information obtained via histology?",
        type: "multiple-choice",
        options: ["E1", "E2", "E3a", "E3b"],
        points: 10,
        correctAnswer: "E3b",
        explanation: ""
      },
      {
        id: "tnm-prefixes-q3",
        question: "The TNM system for lung cancer does not apply to which tumor type?",
        type: "multiple-choice",
        options: [
          "Non-small cell lung carcinoma",
          "Small cell lung carcinoma",
          "Typical carcinoid",
          "Pulmonary sarcomas"
        ],
        points: 10,
        correctAnswer: "Pulmonary sarcomas",
        explanation: ""
      },
      {
        id: "tnm-prefixes-q4",
        question: "Which organization issued the 9ᵗʰ edition of the TNM classification effective January 1st, 2025?",
        type: "multiple-choice",
        options: [
          "American Joint Committee on Cancer (AJCC)",
          "World Health Organization (WHO)",
          "International Association for the Study of Lung Cancer (IASLC)",
          "Radiology Assistant"
        ],
        points: 10,
        correctAnswer: "International Association for the Study of Lung Cancer (IASLC)",
        explanation: ""
      },
      {
        id: "tnm-prefixes-q5",
        question: "What is the primary purpose of the TNM classification system?",
        type: "multiple-choice",
        options: [
          "To evaluate treatment response",
          "To standardize anatomical extent for communication and data applicability",
          "To determine molecular subtypes",
          "To describe radiologic appearance"
        ],
        points: 10,
        correctAnswer: "To standardize anatomical extent for communication and data applicability",
        explanation: ""
      }
    ]
  },
  {
    id: "subsolid-lesions",
    title: "Subsolid Lesions",
    thumbnail: "https://radiologyassistant.nl/assets/-1tabel-subsolid.png",
    duration: "10:00",
    tutorial_type: "practice",
    topic: "tnm",
    description: "Subsolid Lesions from TNM 9th Edition",
    created_at: new Date().toISOString(),
    questions: [
      {
        id: "subsolid-lesions-q1",
        question: "Pure ground glass lesions ≤ 30 mm are classified as at most:",
        type: "multiple-choice",
        options: ["cTis", "cT1a", "cT1b", "cT1c"],
        points: 10,
        correctAnswer: "cTis",
        explanation: ""
      },
      {
        id: "subsolid-lesions-q2",
        question: "A pure ground glass lesion > 30 mm with no solid component is classified as:",
        type: "multiple-choice",
        options: ["cTis", "cT1a", "cT1b", "cT2a"],
        points: 10,
        correctAnswer: "cT1a",
        explanation: ""
      },
      {
        id: "subsolid-lesions-q3",
        question: "A part-solid lesion with a solid component of 11–20 mm is classified as:",
        type: "multiple-choice",
        options: ["cT1a", "cT1b", "cT1c", "cT2a"],
        points: 10,
        correctAnswer: "cT1b",
        explanation: ""
      },
      {
        id: "subsolid-lesions-q4",
        question: "If the solid component is ≤ 5 mm but total lesion size > 30 mm, the classification is:",
        type: "multiple-choice",
        options: ["cT1mi", "cT1a", "cT1b", "cT2a"],
        points: 10,
        correctAnswer: "cT1b",
        explanation: ""
      },
      {
        id: "subsolid-lesions-q5",
        question: "Subsolid lesion measurements should be obtained on CT reconstructions with slice thickness of:",
        type: "multiple-choice",
        options: ["< 3 mm", "< 2 mm", "< 1.5 mm", "< 5 mm"],
        points: 10,
        correctAnswer: "< 1.5 mm",
        explanation: ""
      }
    ]
  },
  {
    id: "t-staging",
    title: "T-Staging",
    thumbnail: "https://radiologyassistant.nl/assets/1-tek-t1-1736590259.jpg",
    duration: "10:00",
    tutorial_type: "practice",
    topic: "tnm",
    description: "T-Staging from TNM 9th Edition",
    created_at: new Date().toISOString(),
    questions: [
      {
        id: "t-staging-q1",
        question: "Which size range defines a T1b tumor?",
        type: "multiple-choice",
        options: ["≤ 1 cm", "> 1 cm but ≤ 2 cm", "> 2 cm but ≤ 3 cm", "> 3 cm but ≤ 4 cm"],
        points: 10,
        correctAnswer: "> 1 cm but ≤ 2 cm",
        explanation: ""
      },
      {
        id: "t-staging-q2",
        question: "A tumor measuring 4.5 cm without invasion features is classified as:",
        type: "multiple-choice",
        options: ["T2a", "T2b", "T3", "T1c"],
        points: 10,
        correctAnswer: "T2b",
        explanation: ""
      },
      {
        id: "t-staging-q3",
        question: "True or False: A tumor > 5 cm but ≤ 7 cm is T3.",
        type: "true-false",
        options: ["True", "False"],
        points: 10,
        correctAnswer: "True",
        explanation: ""
      },
      {
        id: "t-staging-q4",
        question: "Which feature does not classify a tumor as T3?",
        type: "multiple-choice",
        options: [
          "Tumor > 5 cm but ≤ 7 cm",
          "Invasion of chest wall",
          "Separate nodules in the same lobe",
          "Tumor size > 7 cm"
        ],
        points: 10,
        correctAnswer: "Tumor size > 7 cm",
        explanation: ""
      },
      {
        id: "t-staging-q5",
        question: "T4 tumors include all of the following except:",
        type: "multiple-choice",
        options: [
          "Separate nodules in different ipsilateral lobe",
          "Invasion of the carina",
          "Tumor > 7 cm",
          "Tumor ≤ 7 cm"
        ],
        points: 10,
        correctAnswer: "Tumor ≤ 7 cm",
        explanation: ""
      }
    ]
  },
  {
    id: "n-staging",
    title: "N-Staging",
    thumbnail: "https://radiologyassistant.nl/assets/_1-tek-lnn3.jpg",
    duration: "10:00",
    tutorial_type: "practice",
    topic: "tnm",
    description: "N-Staging from TNM 9th Edition",
    created_at: new Date().toISOString(),
    questions: [
      {
        id: "n-staging-q1",
        question: "Metastasis to a single ipsilateral mediastinal station is classified as:",
        type: "multiple-choice",
        options: ["N1", "N2a", "N2b", "N3"],
        points: 10,
        correctAnswer: "N2a",
        explanation: ""
      },
      {
        id: "n-staging-q2",
        question: "Ipsilateral peribronchial or hilar lymph node involvement represents:",
        type: "multiple-choice",
        options: ["N0", "N1", "N2", "N3"],
        points: 10,
        correctAnswer: "N1",
        explanation: ""
      },
      {
        id: "n-staging-q3",
        question: "For a right-sided tumor, involvement of contralateral stations 4L and 5 designates:",
        type: "multiple-choice",
        options: ["N1", "N2a", "N2b", "N3"],
        points: 10,
        correctAnswer: "N3",
        explanation: ""
      },
      {
        id: "n-staging-q4",
        question: "N3 disease is generally considered:",
        type: "multiple-choice",
        options: ["Resectable", "Irresectable", "Stage I", "Stage II"],
        points: 10,
        correctAnswer: "Irresectable",
        explanation: ""
      },
      {
        id: "n-staging-q5",
        question: "Which imaging modality has a high negative predictive value for nodal staging?",
        type: "multiple-choice",
        options: ["CT alone", "MRI", "PET-CT", "Ultrasound"],
        points: 10,
        correctAnswer: "PET-CT",
        explanation: ""
      }
    ]
  },
  {
    id: "m-staging",
    title: "M-Staging",
    thumbnail: "https://radiologyassistant.nl/assets/_1-m1a-1736630514.jpg",
    duration: "10:00",
    tutorial_type: "practice",
    topic: "tnm",
    description: "M-Staging from TNM 9th Edition",
    created_at: new Date().toISOString(),
    questions: [
      {
        id: "m-staging-q1",
        question: "M1a disease includes which of the following?",
        type: "multiple-choice",
        options: [
          "Malignant pleural effusion",
          "Single extrathoracic metastasis",
          "Multiple metastases in one organ system",
          "Multiple metastases in multiple organ systems"
        ],
        points: 10,
        correctAnswer: "Malignant pleural effusion",
        explanation: ""
      },
      {
        id: "m-staging-q2",
        question: "A solitary liver metastasis is classified as:",
        type: "multiple-choice",
        options: ["M1a", "M1b", "M1c1", "M1c2"],
        points: 10,
        correctAnswer: "M1b",
        explanation: ""
      },
      {
        id: "m-staging-q3",
        question: "Multiple lesions confined to the skeletal system without other organ involvement represent:",
        type: "multiple-choice",
        options: ["M1b", "M1c1", "M1c2", "M1a"],
        points: 10,
        correctAnswer: "M1b",
        explanation: ""
      },
      {
        id: "m-staging-q4",
        question: "Metastases in both bone and adrenal glands correspond to:",
        type: "multiple-choice",
        options: ["M1b", "M1c1", "M1c2", "M1a"],
        points: 10,
        correctAnswer: "M1c2",
        explanation: ""
      },
      {
        id: "m-staging-q5",
        question: "Which M-stage denotes absence of distant metastases?",
        type: "multiple-choice",
        options: ["M0", "M1a", "M1b", "M1c"],
        points: 10,
        correctAnswer: "M0",
        explanation: ""
      }
    ]
  }
]; 