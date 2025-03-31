import React, { useState } from 'react';
import { Settings as Lungs, ImagePlus, Scan, FileCheck, Microscope, Ruler, Contrast, Layers, Workflow, Lightbulb, Gauge, Shield, Zap, Brain, HeartPulse, ChevronLeft, Clock, BookOpen, Target, Award } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  readTime: string;
  category: string;
  icon: JSX.Element;
  content: string;
  image: string;
  author: string;
  date: string;
  tags: string[];
}

const blogPosts: BlogPost[] = [
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

3. **Field of View**
   - Adjust based on anatomy
   - Maintain consistent scaling
   - Consider reconstruction parameters

## Common Pitfalls to Avoid

1. Inconsistent breath-hold
2. Motion artifacts
3. Incomplete anatomical coverage
4. Suboptimal contrast timing
5. Incorrect slice thickness

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
    icon: <Workflow className="h-6 w-6 text-blue-600" />,
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

3. **Validation Steps**
   - Compare with original images
   - Verify anatomical integrity
   - Document changes

## Advanced Techniques

1. **Bias Field Correction**
   - N4 algorithm implementation
   - Parameter optimization
   - Quality assessment

2. **Registration**
   - Multi-modal alignment
   - Motion correction
   - Validation methods

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
    icon: <Layers className="h-6 w-6 text-blue-600" />,
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

3. **Error Handling**
   - Failure detection
   - Recovery procedures
   - Quality alerts

## Optimization Tips

1. **Pipeline Efficiency**
   - Parallel processing
   - Resource optimization
   - Caching strategies

2. **Quality vs. Speed**
   - Balance requirements
   - Optimize bottlenecks
   - Maintain accuracy

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

export const BestPractices = () => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const renderBlogList = () => (
    <div className="max-w-7xl mx-auto p-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-blue-900 mb-4">
          Best Practices for Medical Image Segmentation
        </h1>
        <p className="text-blue-600 max-w-2xl mx-auto">
          Expert guides and tutorials to help you master medical image segmentation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {blogPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer transform hover:-translate-y-1 transition-transform duration-300"
            onClick={() => setSelectedPost(post)}
          >
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {post.icon}
                <span className="text-sm font-medium text-blue-600">{post.category}</span>
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">{post.title}</h3>
              <p className="text-blue-600 mb-4">{post.excerpt}</p>
              <div className="flex items-center justify-between text-sm text-blue-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{post.readTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Read More</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBlogPost = (post: BlogPost) => (
    <div className="max-w-4xl mx-auto p-8">
      <button
        onClick={() => setSelectedPost(null)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Best Practices
      </button>

      <article className="bg-white rounded-xl shadow-lg overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-64 object-cover"
        />
        
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            {post.icon}
            <span className="text-sm font-medium text-blue-600">{post.category}</span>
          </div>

          <h1 className="text-3xl font-bold text-blue-900 mb-4">{post.title}</h1>
          
          <div className="flex items-center gap-6 mb-8 text-blue-600">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>{post.readTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.date}</span>
            </div>
          </div>

          <div className="prose prose-blue max-w-none">
            {post.content.split('\n').map((line, index) => {
              if (line.startsWith('# ')) {
                return <h1 key={index} className="text-3xl font-bold text-blue-900 mb-6">{line.substring(2)}</h1>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={index} className="text-2xl font-bold text-blue-800 mt-8 mb-4">{line.substring(3)}</h2>;
              }
              if (line.startsWith('### ')) {
                return <h3 key={index} className="text-xl font-bold text-blue-700 mt-6 mb-3">{line.substring(4)}</h3>;
              }
              if (line.startsWith('- ')) {
                return <li key={index} className="text-blue-600 ml-4 mb-2">{line.substring(2)}</li>;
              }
              if (line.startsWith('✓ ')) {
                return (
                  <div key={index} className="flex items-center gap-2 text-green-600 mb-2">
                    <FileCheck className="w-5 h-5" />
                    <span>{line.substring(2)}</span>
                  </div>
                );
              }
              return line ? <p key={index} className="text-blue-600 mb-4">{line}</p> : null;
            })}
          </div>

          <div className="mt-8 pt-8 border-t border-blue-100">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>
    </div>
  );

  return selectedPost ? renderBlogPost(selectedPost) : renderBlogList();
};