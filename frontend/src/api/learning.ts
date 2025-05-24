import axiosInstance from './axiosConfig';
// Import PaginatedTutorialsResponse along with other types
import { Tutorial, UserProgress, QuizResult, QuizSubmission, PaginatedTutorialsResponse } from '../types';
import { toCamelCase } from '../utils/camelCase';
const API_BASE_URL = '/learning';

export const fetchTutorials = async (): Promise<Tutorial[]> => {
  try {
    const response = await axiosInstance.get<PaginatedTutorialsResponse>(`${API_BASE_URL}/`);

    if (response.data && Array.isArray(response.data.results)) {
      return toCamelCase(response.data.results);
    } else {
      console.error('Unexpected response structure for tutorials:', response.data);
      throw new Error('Unexpected response structure for tutorials');
    }
  } catch (error) {
    console.error('Error fetching tutorials:', error);
    throw error;
  }
};

export const fetchTutorialDetail = async (id: string): Promise<Tutorial> => {
  try {
    const response = await axiosInstance.get<Tutorial>(`${API_BASE_URL}/${id}/`);
    return toCamelCase(response.data);
  } catch (error) {
    console.error(`Error fetching tutorial ${id}:`, error);
    throw error;
  }
};

export const fetchUserProgress = async (): Promise<UserProgress> => {
  try {
    const response = await axiosInstance.get<UserProgress>(`${API_BASE_URL}/progress/`);
    return toCamelCase(response.data);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    throw error;
  }
};

export const submitQuiz = async (submission: QuizSubmission): Promise<QuizResult> => {
  try {
    const response = await axiosInstance.post<QuizResult>(`${API_BASE_URL}/submit-quiz/`, submission);
    return toCamelCase(response.data);
  } catch (error) {
    console.error('Error submitting quiz:', error);
    throw error;
  }
};

