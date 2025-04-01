// src/data/blogPosts.ts
import { ImagePlus, BookOpen } from 'lucide-react';
import { BlogPost } from '../types';

// Static data for best practices blog posts
export const blogPosts: BlogPost[] = [
  {
    id: 'image-acquisition',
    title: 'Mastering Medical Image Acquisition',
    excerpt: 'Learn the essential protocols and best practices for acquiring high-quality medical images for segmentation.',
    readTime: '5 min read',
    category: 'Image Acquisition',
    icon: <ImagePlus className="h-6 w-6 text-blue-600" />,
    content: `
# Mastering Medical Image Acquisition

Medical image acquisition is the foundation of successful segmentation. This guide covers essential protocols and best practices to ensure optimal image quality for analysis.

## Key Protocols

### 1. Standard CT Protocol
- Use consistent slice thickness (1-1.5mm recommended)
- Maintain proper patient positioning
- Apply appropriate radiation dose
- Consider contrast when necessary

### 2. Breath-Hold Technique
- Instruct patients on proper breath-hold timing
- Monitor respiratory motion
- Use respiratory gating when needed

### 3. Quality Checks
- Review images immediately after acquisition
- Check for motion artifacts
- Verify complete anatomical coverage

## Technical Parameters

1. **Resolution Requirements**
   - Minimum: 512x512 pixels
   - Higher resolution for detailed structures
   - Consider storage and processing limitations

2. **Contrast Settings**
   - Optimize window/level settings
   - Use appropriate contrast protocols
   - Document enhancement parameters

## Best Practices Checklist

✓ Standardize acquisition protocols
✓ Document all parameters
✓ Implement quality control
✓ Train staff on proper techniques
✓ Regular equipment calibration
    `,
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&h=630',
    author: 'Dr. Sarah Chen',
    date: 'March 15, 2024',
    tags: ['CT Protocol', 'Image Quality', 'Technical Parameters']
  },
  {
    id: 'preprocessing',
    title: 'Essential Image Preprocessing Steps',
    excerpt: 'Discover the critical preprocessing techniques that ensure reliable segmentation results.',
    readTime: '7 min read',
    category: 'Preprocessing',
    icon: <BookOpen className="h-6 w-6 text-blue-600" />,
    content: `
# Essential Image Preprocessing Steps

Proper preprocessing is crucial for achieving accurate segmentation results. This guide outlines the key steps and considerations for preparing medical images.

## Core Preprocessing Steps

### 1. Noise Reduction
- Apply appropriate filters
- Balance noise reduction vs. detail preservation
- Consider edge-preserving methods

### 2. Intensity Normalization
- Standardize intensity ranges
- Account for scanner variations
- Implement histogram matching

### 3. Artifact Removal
- Identify common artifacts
- Apply correction algorithms
- Validate results

## Quality Control

1. **Visual Inspection**
   - Check for anomalies
   - Verify anatomical consistency
   - Review edge preservation

2. **Quantitative Metrics**
   - Signal-to-noise ratio
   - Contrast-to-noise ratio
   - Resolution measurements

## Implementation Guidelines

✓ Document preprocessing pipeline
✓ Version control for parameters
✓ Automated quality checks
✓ Regular pipeline validation
✓ Error handling protocols
    `,
    image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=1200&h=630',
    author: 'Dr. Michael Wong',
    date: 'March 14, 2024',
    tags: ['Preprocessing', 'Image Enhancement', 'Quality Control']
  },
  {
    id: 'segmentation-workflow',
    title: 'Optimizing Segmentation Workflow',
    excerpt: 'Learn how to create an efficient and accurate segmentation workflow.',
    readTime: '6 min read',
    category: 'Workflow',
    icon: <BookOpen className="h-6 w-6 text-blue-600" />,
    content: `
# Optimizing Segmentation Workflow

An efficient segmentation workflow is essential for consistent and accurate results. This guide covers best practices for organizing and executing your segmentation pipeline.

## Workflow Components

### 1. Initial Assessment
- Review image quality
- Check for artifacts
- Verify anatomical coverage

### 2. Preprocessing Pipeline
- Standardize preprocessing steps
- Implement quality checks
- Document parameters

### 3. Segmentation Process
- Choose appropriate algorithms
- Set validation points
- Implement error handling

## Quality Assurance

1. **Validation Steps**
   - Cross-validation
   - Expert review
   - Quantitative metrics

2. **Documentation**
   - Parameter logging
   - Version control
   - Result tracking

## Implementation Checklist

✓ Standard operating procedures
✓ Quality control points
✓ Documentation system
✓ Training protocols
✓ Regular audits
    `,
    image: 'https://images.unsplash.com/photo-1581093577421-f561c41b807e?auto=format&fit=crop&w=1200&h=630',
    author: 'Dr. Emily Johnson',
    date: 'March 13, 2024',
    tags: ['Workflow', 'Optimization', 'Quality Assurance']
  }
];