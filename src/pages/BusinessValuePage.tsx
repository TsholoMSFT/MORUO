/**
 * Business Value Page - Business Value Tool V2.0
 * 
 * Main page component for the Business Value Assessment tool.
 * Integrates all V2.0 features into a cohesive user experience.
 */

import React from 'react';
import { BusinessValueCalculator } from '../components/BusinessValueCalculator';

const BusinessValuePage: React.FC = () => {
  const handleAssessmentComplete = (assessment: any) => {
    console.log('Assessment complete:', assessment);
    // TODO: Save to backend, generate PDF, etc.
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <BusinessValueCalculator
        onAssessmentComplete={handleAssessmentComplete}
        customerName="Demo Customer"
        projectName="AI Transformation Initiative"
      />
    </div>
  );
};

export default BusinessValuePage;
