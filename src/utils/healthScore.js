// src/utils/healthScore.js
export const calculateHealthScore = (user) => {
  if (!user) return 0;
  
  let score = 70; // Base score
  const trackingStats = user.trackingStats || {};
  
  // Add points based on tracking stats
  if (trackingStats.consistencyScore > 80) score += 10;
  if (trackingStats.currentStreak > 7) score += 10;
  if (trackingStats.totalLogs > 20) score += 5;
  
  // Add/subtract points for BMI
  if (user.currentBMI && user.currentBMI >= 18.5 && user.currentBMI <= 24.9) {
    score += 10;
  } else if (user.currentBMI) {
    score -= 5;
  }
  
  // Cap score between 0-100
  return Math.max(0, Math.min(100, score));
};

export const getHealthStatus = (score) => {
  if (score >= 80) {
    return {
      label: 'Excellent',
      color: 'from-green-500 to-emerald-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
  } else if (score >= 60) {
    return {
      label: 'Good',
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    };
  } else if (score >= 40) {
    return {
      label: 'Fair',
      color: 'from-yellow-500 to-amber-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    };
  } else {
    return {
      label: 'Needs Attention',
      color: 'from-orange-500 to-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    };
  }
};