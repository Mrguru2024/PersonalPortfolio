'use client';

import React from 'react';
import ProjectDetails from '@/pages/ProjectDetails';

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  return <ProjectDetails projectId={params.id} />;
}