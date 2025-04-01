// src/components/learning/tutorials/BestPractices.tsx
import React, { useState } from 'react';
import { FileCheck, ChevronLeft, Clock, BookOpen } from 'lucide-react';
import { blogPosts } from '../../../data/blogPosts';
import { BlogPost } from '../../../types';

export const BestPractices: React.FC = () => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Render the list of blog posts
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

  // Render a single blog post
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
              <Clock className="w-4 h-4" />
              <span>{post.readTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
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

  // Conditionally render either the blog list or a single blog post
  return selectedPost ? renderBlogPost(selectedPost) : renderBlogList();
};