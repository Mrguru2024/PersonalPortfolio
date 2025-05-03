'use client';

import React from 'react';
import AdminBlog from '@/pages/AdminBlog';
import { ProtectedContent } from '@/lib/next-protected-route';

export default function AdminBlogPage() {
  return (
    <ProtectedContent adminOnly>
      <AdminBlog />
    </ProtectedContent>
  );
}