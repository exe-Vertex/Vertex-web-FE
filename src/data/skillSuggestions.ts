/**
 * Skill suggestions organized by project category.
 * Used in ProfileModal to help users discover relevant skills
 * instead of only typing manually.
 * 
 * Users can still add any custom skill via the text input.
 */

export const SKILL_SUGGESTIONS: Record<string, string[]> = {
  Software: [
    'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular',
    'Node.js', 'Python', 'C#', '.NET', 'Java', 'Go',
    'SQL', 'PostgreSQL', 'MongoDB', 'Redis',
    'REST API', 'GraphQL', 'Docker', 'Kubernetes',
    'Git', 'CI/CD', 'AWS', 'Azure',
    'Testing', 'DevOps', 'System Design',
    'Mobile (React Native)', 'Mobile (Flutter)',
    'HTML/CSS', 'Tailwind CSS',
  ],
  Design: [
    'Figma', 'Adobe XD', 'Sketch',
    'Photoshop', 'Illustrator', 'After Effects',
    'UI Design', 'UX Design', 'UX Research',
    'Wireframing', 'Prototyping', 'Interaction Design',
    'Typography', 'Color Theory', 'Branding',
    'Illustration', 'Icon Design', 'Motion Design',
    'Design Systems', 'Responsive Design',
    'User Testing', 'Accessibility (a11y)',
    'Graphic Design', 'Print Design',
  ],
  Research: [
    'Data Analysis', 'Statistical Modeling', 'SPSS', 'R',
    'Python (Data)', 'Stata', 'Excel Advanced',
    'Literature Review', 'Academic Writing', 'LaTeX',
    'Survey Design', 'Qualitative Research', 'Quantitative Research',
    'Interviewing', 'Focus Groups',
    'Data Visualization', 'Tableau', 'Power BI',
    'Critical Thinking', 'Peer Review',
    'Research Methodology', 'Thesis Writing',
    'Citation Management', 'Ethical Compliance',
  ],
  Marketing: [
    'SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'TikTok Ads',
    'Content Marketing', 'Copywriting', 'Blog Writing',
    'Social Media Management', 'Community Management',
    'Email Marketing', 'Marketing Automation',
    'Analytics', 'Google Analytics', 'A/B Testing',
    'Brand Strategy', 'Market Research',
    'PR & Communications', 'Influencer Marketing',
    'Video Production', 'Podcast Production',
    'CRM', 'HubSpot', 'Mailchimp',
  ],
  Business: [
    'Financial Analysis', 'Financial Modeling', 'Accounting',
    'Business Planning', 'Strategic Planning',
    'Market Research', 'Competitive Analysis',
    'Project Management', 'Agile/Scrum', 'Jira',
    'Stakeholder Management', 'Negotiation',
    'Pitch Deck', 'Presentation', 'Public Speaking',
    'Risk Assessment', 'Compliance',
    'Operations Management', 'Process Improvement',
    'Business Development', 'Sales',
    'Excel', 'Power BI', 'Data Analysis',
    'Supply Chain', 'Budgeting',
  ],
  General: [
    'Communication', 'Teamwork', 'Leadership',
    'Problem Solving', 'Time Management',
    'Critical Thinking', 'Presentation',
    'Documentation', 'Technical Writing',
    'Agile/Scrum', 'Kanban',
    'Jira', 'Trello', 'Notion',
    'English', 'Vietnamese',
  ],
};

/** All category keys except 'General' */
export const SKILL_CATEGORIES = Object.keys(SKILL_SUGGESTIONS).filter(c => c !== 'General');
