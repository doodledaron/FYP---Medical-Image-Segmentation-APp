import axiosInstance from './axiosConfig';
// Import PaginatedTutorialsResponse along with other types
import { Tutorial, UserProgress, QuizResult, QuizSubmission, PaginatedTutorialsResponse } from '../types';

const API_BASE_URL = '/learning';

export const fetchTutorials = async (): Promise<Tutorial[]> => {
  try {
    console.log('Fetching tutorials...');
    // Expect the paginated response structure
    const response = await axiosInstance.get<PaginatedTutorialsResponse>(`${API_BASE_URL}/`);
    console.log('Tutorials response:', response.data);

    // Check if response.data and response.data.results are valid
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results; // Return the 'results' array
    } else {
      // Handle cases where the structure is not as expected
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
    console.log(`Fetching tutorial detail for ID: ${id}`);
    const response = await axiosInstance.get<Tutorial>(`${API_BASE_URL}/${id}/`);
    console.log('Tutorial detail response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tutorial ${id}:`, error);
    throw error;
  }
};

export const fetchUserProgress = async (): Promise<UserProgress> => {
  try {
    console.log('Fetching user progress...');
    const response = await axiosInstance.get<UserProgress>(`${API_BASE_URL}/progress/`);
    console.log('User progress response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    throw error;
  }
};

export const submitQuiz = async (submission: QuizSubmission): Promise<QuizResult> => {
  try {
    console.log('Submitting quiz with data:', submission);
    const response = await axiosInstance.post<QuizResult>(`${API_BASE_URL}/submit-quiz/`, submission);
    console.log('Quiz submission response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error submitting quiz:', error);
    throw error;
  }
};

