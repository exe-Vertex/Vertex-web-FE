import React from 'react';
import { useParams } from 'react-router-dom';
import { Dashboard } from '../components/dashboard/Dashboard';

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { slug } = useParams<{ slug?: string }>();
  return <Dashboard onNavigate={onNavigate} initialOrgSlug={slug} />;
};
