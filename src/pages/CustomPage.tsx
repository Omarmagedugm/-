import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import TopHeader from '../components/TopHeader';
import BottomNav from '../components/BottomNav';

export default function CustomPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;
      try {
        const q = query(collection(db, 'custom_pages'), where('slug', '==', slug), where('active', '==', true));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setPageData({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
        } else {
          // If no active page found with that slug, head home
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching custom page:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPage();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white pb-[80px]">
        <TopHeader />
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!pageData) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white pb-[80px]">
      <TopHeader />
      <div className="px-4 py-6">
        <h1 className="text-2xl font-black mb-6 border-b-2 border-primary inline-block pb-1">{pageData.title}</h1>
        {/* Render HTML content safely or iframe based on content */}
        {pageData.content.includes('<iframe') ? (
           <div className="w-full relative w-full overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800"
                dangerouslySetInnerHTML={{ __html: pageData.content }} />
        ) : (
          <div 
            className="prose prose-slate dark:prose-invert max-w-none prose-img:rounded-xl prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: pageData.content }}
          />
        )}
      </div>
      <BottomNav />
    </div>
  );
}
