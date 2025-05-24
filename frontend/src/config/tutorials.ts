// // src/config/tutorials.ts
// import { Tutorial, QuizQuestion } from '../types';

// interface GeneralQuiz {
//   id: string;
//   title: string;
//   quiz: QuizQuestion[];
// }

// export const videoTutorials: Tutorial[] = [
//   {
//     id: 'tutorial1',
//     title: 'Introduction to Medical Image Segmentation',
//     thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=500&h=300',
//     duration: '15:30',
//     studyNotes: [
//       'Medical image segmentation is the process of partitioning medical images into meaningful parts',
//       'Common imaging modalities include CT, MRI, and X-ray',
//       'AI-powered segmentation can significantly speed up the analysis process',
//       'Key challenges include image quality and anatomical variations'
//     ],
//     quiz: [
//       {
//         id: 'q1',
//         type: 'multiple-choice',
//         question: 'What is the main purpose of medical image segmentation?',
//         options: [
//           'To make images look better',
//           'To partition images into meaningful regions',
//           'To store images efficiently',
//           'To share images online'
//         ],
//         correctAnswer: 'To partition images into meaningful regions',
//         explanation: 'Medical image segmentation is primarily used to divide medical images into distinct regions or structures of interest for analysis and diagnosis.',
//         points: 10
//       },
//       {
//         id: 'q2',
//         type: 'multiple-select',
//         question: 'Which of the following are common challenges in medical image segmentation? (Select all that apply)',
//         options: [
//           'Image noise and artifacts',
//           'Anatomical variations between patients',
//           'Limited computational resources',
//           'Complex tissue boundaries'
//         ],
//         correctAnswer: ['Image noise and artifacts', 'Anatomical variations between patients', 'Complex tissue boundaries'],
//         explanation: 'These factors significantly impact the accuracy and reliability of medical image segmentation.',
//         points: 15
//       },
//       {
//         id: 'q3',
//         type: 'free-text',
//         question: 'Explain how AI can improve the efficiency of medical image segmentation.',
//         correctAnswer: 'AI automates the segmentation process and can quickly analyze large datasets with consistent accuracy',
//         explanation: 'AI systems can process images faster than manual segmentation while maintaining high accuracy and consistency.',
//         points: 20
//       }
//     ]
//   },
//   {
//     id: 'tutorial2',
//     title: 'Advanced Preprocessing Techniques',
//     thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop',
//     duration: '25:45',
//     studyNotes: [
//       'Preprocessing is crucial for improving segmentation accuracy',
//       'Key techniques include noise reduction, intensity normalization, and artifact removal',
//       'Different modalities require specific preprocessing pipelines',
//       'Quality control checks are essential after each preprocessing step'
//     ],
//     quiz: [
//       {
//         id: 'pre1',
//         type: 'multiple-choice',
//         question: 'Which preprocessing step should typically be applied first in the pipeline?',
//         options: [
//           'Intensity normalization',
//           'Noise reduction',
//           'Registration',
//           'Bias field correction'
//         ],
//         correctAnswer: 'Bias field correction',
//         explanation: 'Bias field correction should be applied first as it corrects for intensity inhomogeneities that can affect subsequent preprocessing steps.',
//         points: 15
//       },
//       {
//         id: 'pre2',
//         type: 'multiple-select',
//         question: 'Which of the following are valid quality control checks for preprocessing? (Select all that apply)',
//         options: [
//           'Visual inspection of normalized images',
//           'Histogram analysis',
//           'SNR calculation',
//           'File size comparison'
//         ],
//         correctAnswer: ['Visual inspection of normalized images', 'Histogram analysis', 'SNR calculation'],
//         explanation: 'Quality control should include both visual and quantitative measures to ensure preprocessing effectiveness.',
//         points: 20
//       }
//     ]
//   },
//   {
//     id: 'tutorial3',
//     title: 'nnUNet: State-of-the-Art Medical Segmentation',
//     thumbnail: 'https://raw.githubusercontent.com/NVIDIA/DeepLearningExamples/master/PyTorch/Segmentation/nnUNet//images/unet3d.png',
//     duration: '35:20',
//     studyNotes: [
//       'nnUNet is a self-configuring method for deep learning-based medical image segmentation',
//       'Automatically adapts preprocessing, network architecture, and training scheme',
//       'Consistently achieves state-of-the-art performance across various medical segmentation tasks',
//       'Includes built-in cross-validation and model ensembling'
//     ],
//     quiz: [
//       {
//         id: 'nn1',
//         type: 'multiple-choice',
//         question: 'What is the main advantage of nnUNet over traditional segmentation networks?',
//         options: [
//           'Faster training time',
//           'Lower memory requirements',
//           'Automatic configuration',
//           'Smaller model size'
//         ],
//         correctAnswer: 'Automatic configuration',
//         explanation: 'nnUNet automatically configures itself for each dataset, eliminating the need for manual architecture design and hyperparameter tuning.',
//         points: 15
//       },
//       {
//         id: 'nn2',
//         type: 'multiple-select',
//         question: 'Which components does nnUNet automatically configure? (Select all that apply)',
//         options: [
//           'Preprocessing pipeline',
//           'Network architecture',
//           'Training scheme',
//           'Data augmentation'
//         ],
//         correctAnswer: ['Preprocessing pipeline', 'Network architecture', 'Training scheme', 'Data augmentation'],
//         explanation: 'nnUNet automatically configures all these components based on dataset properties and available computational resources.',
//         points: 20
//       }
//     ]
//   }
// ];

// // General quiz for testing overall knowledge (not tied to a specific tutorial)
// export const generalQuiz: GeneralQuiz = {
//   id: 'general',
//   title: 'Medical Image Segmentation Knowledge Check',
//   quiz: [
//     {
//       id: 'gen1',
//       type: 'multiple-choice' as const,
//       question: 'What is the recommended slice thickness for CT scans in lung imaging?',
//       options: ['0.5-1.0mm', '1.0-1.5mm', '2.0-2.5mm', '3.0-3.5mm'],
//       correctAnswer: '1.0-1.5mm',
//       explanation: 'The recommended slice thickness for lung CT imaging is typically 1.0-1.5mm to balance resolution and scan time.',
//       points: 10
//     },
//     {
//       id: 'gen2',
//       type: 'multiple-select' as const,
//       question: 'Which of the following are common evaluation metrics for segmentation? (Select all that apply)',
//       options: ['Dice coefficient', 'Jaccard index', 'Hausdorff distance', 'Pixel accuracy'],
//       correctAnswer: ['Dice coefficient', 'Jaccard index', 'Hausdorff distance', 'Pixel accuracy'],
//       explanation: 'All of these are commonly used metrics to evaluate the performance of medical image segmentation algorithms.',
//       points: 15
//     },
//     {
//       id: 'gen3',
//       type: 'free-text' as const,
//       question: 'Explain the difference between semantic segmentation and instance segmentation.',
//       correctAnswer: 'Semantic segmentation classifies each pixel into a category, while instance segmentation identifies individual instances of objects',
//       explanation: 'Semantic segmentation assigns each pixel a class label, while instance segmentation also distinguishes between separate instances of the same class.',
//       points: 20
//     }
//   ]
// };