from django.core.management.base import BaseCommand
from learning.models import Tutorial, QuizQuestion
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Seeds TNM staging quiz content'

    def handle(self, *args, **kwargs):
        # Create a test user
        User.objects.get_or_create(
            username='medical_student',
            defaults={'email': 'student@medical.edu'}
        )

        quizzes = [
            {
                "id": "tnm-prefixes",
                "title": "TNM Prefixes and Basic Concepts",
                "questions": [
                    ("What does the ‘p’ prefix in TNM staging indicate?",
                     ["Clinical pretreatment staging", "Pathologic stage based on surgical resection only", "Restaging after part or all treatment", "Evaluation category for imaging"],
                     "Pathologic stage based on surgical resection only"),

                    ("Which evaluation category denotes tissue information obtained via histology?",
                     ["E1", "E2", "E3a", "E3b"],
                     "E3b"),

                    ("The TNM system for lung cancer does not apply to which tumor type?",
                     ["Non-small cell lung carcinoma", "Small cell lung carcinoma", "Typical carcinoid", "Pulmonary sarcomas"],
                     "Pulmonary sarcomas"),

                    ("Which organization issued the 9ᵗʰ edition of the TNM classification effective January 1st, 2025?",
                     ["American Joint Committee on Cancer (AJCC)", "World Health Organization (WHO)", "International Association for the Study of Lung Cancer (IASLC)", "Radiology Assistant"],
                     "International Association for the Study of Lung Cancer (IASLC)"),

                    ("What is the primary purpose of the TNM classification system?",
                     ["To evaluate treatment response", "To standardize anatomical extent for communication and data applicability", "To determine molecular subtypes", "To describe radiologic appearance"],
                     "To standardize anatomical extent for communication and data applicability")
                ]
            },
            {
                "id": "subsolid-lesions",
                "title": "Subsolid Lesions",
                "questions": [
                    ("Pure ground glass lesions ≤ 30 mm are classified as at most:",
                     ["cTis", "cT1a", "cT1b", "cT1c"],
                     "cTis"),

                    ("A pure ground glass lesion > 30 mm with no solid component is classified as:",
                     ["cTis", "cT1a", "cT1b", "cT2a"],
                     "cT1a"),

                    ("A part-solid lesion with a solid component of 11–20 mm is classified as:",
                     ["cT1a", "cT1b", "cT1c", "cT2a"],
                     "cT1b"),

                    ("If the solid component is ≤ 5 mm but total lesion size > 30 mm, the classification is:",
                     ["cT1mi", "cT1a", "cT1b", "cT2a"],
                     "cT1b"),

                    ("Subsolid lesion measurements should be obtained on CT reconstructions with slice thickness of:",
                     ["< 3 mm", "< 2 mm", "< 1.5 mm", "< 5 mm"],
                     "< 1.5 mm")
                ]
            },
            {
                "id": "t-staging",
                "title": "T-Staging",
                "questions": [
                    ("Which size range defines a T1b tumor?",
                     ["≤ 1 cm", "> 1 cm but ≤ 2 cm", "> 2 cm but ≤ 3 cm", "> 3 cm but ≤ 4 cm"],
                     "> 1 cm but ≤ 2 cm"),

                    ("A tumor measuring 4.5 cm without invasion features is classified as:",
                     ["T2a", "T2b", "T3", "T1c"],
                     "T2b"),

                    ("True or False: A tumor > 5 cm but ≤ 7 cm is T3.",
                     ["True", "False"],
                     "True",
                     "true-false"),

                    ("Which feature does not classify a tumor as T3?",
                     ["Tumor > 5 cm but ≤ 7 cm", "Invasion of chest wall", "Separate nodules in the same lobe", "Tumor size > 7 cm"],
                     "Tumor size > 7 cm"),

                    ("T4 tumors include all of the following except:",
                     ["Separate nodules in different ipsilateral lobe", "Invasion of the carina", "Tumor > 7 cm", "Tumor ≤ 7 cm"],
                     "Tumor ≤ 7 cm")
                ]
            },
            {
                "id": "n-staging",
                "title": "N-Staging",
                "questions": [
                    ("Metastasis to a single ipsilateral mediastinal station is classified as:",
                     ["N1", "N2a", "N2b", "N3"],
                     "N2a"),

                    ("Ipsilateral peribronchial or hilar lymph node involvement represents:",
                     ["N0", "N1", "N2", "N3"],
                     "N1"),

                    ("For a right-sided tumor, involvement of contralateral stations 4L and 5 designates:",
                     ["N1", "N2a", "N2b", "N3"],
                     "N3"),

                    ("N3 disease is generally considered:",
                     ["Resectable", "Irresectable", "Stage I", "Stage II"],
                     "Irresectable"),

                    ("Which imaging modality has a high negative predictive value for nodal staging?",
                     ["CT alone", "MRI", "PET-CT", "Ultrasound"],
                     "PET-CT")
                ]
            },
            {
                "id": "m-staging",
                "title": "M-Staging",
                "questions": [
                    ("M1a disease includes which of the following?",
                     ["Malignant pleural effusion", "Single extrathoracic metastasis", "Multiple metastases in one organ system", "Multiple metastases in multiple organ systems"],
                     "Malignant pleural effusion"),

                    ("A solitary liver metastasis is classified as:",
                     ["M1a", "M1b", "M1c1", "M1c2"],
                     "M1b"),

                    ("Multiple lesions confined to the skeletal system without other organ involvement represent:",
                     ["M1b", "M1c1", "M1c2", "M1a"],
                     "M1b"),

                    ("Metastases in both bone and adrenal glands correspond to:",
                     ["M1b", "M1c1", "M1c2", "M1a"],
                     "M1c2"),

                    ("Which M-stage denotes absence of distant metastases?",
                     ["M0", "M1a", "M1b", "M1c"],
                     "M0")
                ]
            }
        ]

        for quiz in quizzes:
            tutorial, _ = Tutorial.objects.update_or_create(
                id=quiz["id"],
                defaults={
                    "title": quiz["title"],
                    "thumbnail": f"https://via.placeholder.com/300x200?text={quiz['title'].replace(' ', '+')}",
                    "duration": "10:00",
                    "tutorial_type": "practice",
                    "topic": "tnm",
                    "description": f"{quiz['title']} from TNM 9th Edition"
                }
            )

            for i, q in enumerate(quiz["questions"]):
                question_text, options, correct_answer = q[:3]
                question_type = q[3] if len(q) == 4 else 'multiple-choice'

                QuizQuestion.objects.update_or_create(
                    id=f"{quiz['id']}-q{i+1}",
                    defaults={
                        "tutorial": tutorial,
                        "question": question_text,
                        "type": question_type,
                        "options": options,
                        "correct_answer": correct_answer,
                        "explanation": "",
                        "points": 10
                    }
                )

        self.stdout.write(self.style.SUCCESS("✅ TNM staging quizzes seeded successfully."))
