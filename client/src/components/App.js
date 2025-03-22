import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import ProtectedRoute from './ProtectedRoute';

// Always loaded components
import Navbar from './Navbar';
import Loading from './Loading';

// Lazy loaded components
const Home = lazy(() => import('./Home'));
const Login = lazy(() => import('./Login'));
const Signup = lazy(() => import('./Signup'));
const Topics = lazy(() => import('./Topics'));
const TopicEntries = lazy(() => import('./TopicEntries'));
const SubtopicEntries = lazy(() => import('./SubtopicEntries'));
const Settings = lazy(() => import('./Settings'));
const Companies = lazy(() => import('./Companies'));
const CompaniesPage = lazy(() => import('../pages/CompaniesPage'));
const AllProblems = lazy(() => import('./AllProblems'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="text-center py-5">
    <div className="spinner-border" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
    <p className="mt-3">Loading component...</p>
  </div>
);

function App() {
  return (
    <Router>
      <AppProvider>
        <div className="app">
          <Navbar />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/topics" element={
                <ProtectedRoute>
                  <Topics />
                </ProtectedRoute>
              } />
              <Route path="/topics/:topic" element={
                <ProtectedRoute>
                  <TopicEntries />
                </ProtectedRoute>
              } />
              <Route path="/topics/:topic/subtopic/:subtopic" element={
                <ProtectedRoute>
                  <SubtopicEntries />
                </ProtectedRoute>
              } />
              <Route path="/companies" element={
                <ProtectedRoute>
                  <Companies />
                </ProtectedRoute>
              } />
              <Route path="/companies-new" element={
                <ProtectedRoute>
                  <CompaniesPage />
                </ProtectedRoute>
              } />
              <Route path="/problems" element={
                <ProtectedRoute>
                  <AllProblems />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </div>
      </AppProvider>
    </Router>
  );
}

export default App; 