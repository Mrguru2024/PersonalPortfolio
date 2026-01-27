"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'pricing' | 'process' | 'technical' | 'timeline' | 'support';
  tags?: string[];
}

const faqData: FAQItem[] = [
  // General Questions
  {
    id: '1',
    question: 'What exactly do you build?',
    answer: 'I build websites, web applications, mobile apps, and e-commerce stores. Think of it like hiring a contractor to build a house - but for the internet. I create everything from simple business websites to complex applications that can handle thousands of users, process payments, manage inventory, and much more.',
    category: 'general',
    tags: ['website', 'web-app', 'mobile-app'],
  },
  {
    id: '2',
    question: 'How long does it take to build a website?',
    answer: 'It depends on what you need! A simple business website might take 2-4 weeks. A more complex web application could take 2-4 months. An e-commerce store with lots of features might take 3-6 months. During our initial conversation, I\'ll give you a specific timeline based on your project.',
    category: 'timeline',
    tags: ['timeline', 'duration'],
  },
  {
    id: '3',
    question: 'Do I need to know anything about technology?',
    answer: 'Not at all! I work with many clients who aren\'t tech-savvy. I\'ll explain everything in simple terms, and I\'ll handle all the technical stuff. You just need to tell me what you want your website to do, and I\'ll make it happen.',
    category: 'general',
    tags: ['technical', 'knowledge'],
  },
  {
    id: '4',
    question: 'Will I be able to update my website myself?',
    answer: 'Yes! I can build your website with a content management system (CMS) that lets you easily update text, images, and content without needing to know how to code. I\'ll also provide training so you feel comfortable making changes. Think of it like using Microsoft Word - but for your website.',
    category: 'technical',
    tags: ['cms', 'updates', 'content'],
  },

  // Pricing Questions
  {
    id: '5',
    question: 'How much does a website cost?',
    answer: 'Website costs vary based on what you need. A simple business website might cost $2,000-$5,000. A web application with custom features could be $10,000-$50,000. An e-commerce store might be $5,000-$25,000. The best way to know is to fill out the project assessment - it\'s free and I\'ll give you a detailed estimate based on your specific needs.',
    category: 'pricing',
    tags: ['cost', 'price', 'budget'],
  },
  {
    id: '6',
    question: 'Why do prices vary so much?',
    answer: 'Think of it like buying a car - a basic car costs less than a luxury car with all the features. Similarly, a simple website costs less than a complex application with lots of features. Factors that affect price include: number of features, design complexity, whether you need mobile apps, payment processing, user accounts, and more. I\'ll explain exactly what affects your price during our consultation.',
    category: 'pricing',
    tags: ['pricing', 'cost', 'factors'],
  },
  {
    id: '7',
    question: 'Do you offer payment plans?',
    answer: 'Yes! Most projects are broken into payment milestones. Typically, you pay a portion when we start, another portion when the design is approved, another when development is complete, and the final payment when everything is launched. This spreads out the cost and ensures you\'re happy with each stage before moving forward.',
    category: 'pricing',
    tags: ['payment', 'installments', 'milestones'],
  },
  {
    id: '8',
    question: 'What if my budget is under $5,000?',
    answer: 'No problem! I work with clients of all budgets. For smaller budgets, I can create a phased approach - we build the most important features first, then add more later. Or we can use professional templates that I customize for you, which reduces costs while still giving you a great-looking website. I\'ll work with you to get the best value for your budget.',
    category: 'pricing',
    tags: ['budget', 'low-cost', 'affordable'],
  },

  // Process Questions
  {
    id: '9',
    question: 'How does the process work?',
    answer: 'It\'s simple! First, we have a conversation about what you need (or you fill out the project assessment). Then I create a proposal with timeline and pricing. Once you approve, we start with design - I\'ll show you mockups of how your site will look. After you approve the design, I build it. Then we test everything together, make any adjustments, and launch! Throughout the process, I keep you updated and get your feedback.',
    category: 'process',
    tags: ['process', 'workflow', 'steps'],
  },
  {
    id: '10',
    question: 'What information do you need from me?',
    answer: 'I\'ll need to know: what you want your website to do, who your target audience is, what features you need, your budget, and your timeline. I\'ll also need things like your logo, brand colors, text content, and images. Don\'t worry if you don\'t have everything - I can help you create content and find images if needed.',
    category: 'process',
    tags: ['requirements', 'information', 'content'],
  },
  {
    id: '11',
    question: 'Can I see progress as you build?',
    answer: 'Absolutely! I\'ll set up a staging site (a private version of your website) where you can see everything as it\'s being built. You can test it, give feedback, and request changes. You\'ll never be in the dark about what\'s happening with your project.',
    category: 'process',
    tags: ['progress', 'updates', 'staging'],
  },
  {
    id: '12',
    question: 'What happens after my website is launched?',
    answer: 'After launch, I provide support to make sure everything works smoothly. I can also help with ongoing maintenance, updates, adding new features, and training your team. Many clients continue working with me for updates and improvements as their business grows.',
    category: 'support',
    tags: ['launch', 'support', 'maintenance'],
  },

  // Technical Questions
  {
    id: '13',
    question: 'Will my website work on phones and tablets?',
    answer: 'Yes! All websites I build are "responsive," which means they automatically adjust to look great on phones, tablets, and computers. Your visitors will have a great experience no matter what device they use.',
    category: 'technical',
    tags: ['mobile', 'responsive', 'devices'],
  },
  {
    id: '14',
    question: 'Do I need to buy a domain name and hosting?',
    answer: 'Yes, you\'ll need a domain name (like www.yourbusiness.com) and hosting (the service that makes your website accessible online). I can help you purchase these, or you can buy them yourself. I also offer domain services if you need help finding and registering the perfect domain name for your business.',
    category: 'technical',
    tags: ['domain', 'hosting', 'setup'],
  },
  {
    id: '15',
    question: 'Will my website be secure?',
    answer: 'Absolutely! Security is a top priority. I use industry-standard security practices, including SSL certificates (that padlock icon you see in browsers), secure payment processing, regular security updates, and protection against common threats. Your website and your customers\' data will be safe.',
    category: 'technical',
    tags: ['security', 'ssl', 'safe'],
  },
  {
    id: '16',
    question: 'Can my website accept online payments?',
    answer: 'Yes! I can integrate payment processing so customers can pay you directly on your website using credit cards, debit cards, PayPal, or other payment methods. All payments are processed securely through trusted payment providers.',
    category: 'technical',
    tags: ['payments', 'ecommerce', 'transactions'],
  },
  {
    id: '17',
    question: 'What is SEO and do I need it?',
    answer: 'SEO (Search Engine Optimization) helps your website show up when people search for your business or services on Google. It\'s like putting up a sign that helps people find your store. I can optimize your website so more potential customers discover you through search engines. It\'s especially important if you want to attract customers online.',
    category: 'technical',
    tags: ['seo', 'google', 'search'],
  },

  // Timeline Questions
  {
    id: '18',
    question: 'How quickly can you start?',
    answer: 'Usually within 1-2 weeks of approval, depending on my current schedule. For rush projects, I can sometimes start sooner, though there may be additional costs for expedited timelines. Let\'s discuss your timeline needs during our initial consultation.',
    category: 'timeline',
    tags: ['start', 'rush', 'schedule'],
  },
  {
    id: '19',
    question: 'What if I need it done faster?',
    answer: 'I understand sometimes you need things done quickly! Rush projects are possible, though they may cost more due to the accelerated timeline. I\'ll work with you to see what\'s feasible and give you options for meeting your deadline.',
    category: 'timeline',
    tags: ['rush', 'deadline', 'fast'],
  },

  // Support Questions
  {
    id: '20',
    question: 'What if something breaks after launch?',
    answer: 'Don\'t worry! I provide support after launch to fix any issues. Most projects include a period of free support (usually 30 days) to fix bugs and make small adjustments. After that, I offer ongoing support packages if you need continued help.',
    category: 'support',
    tags: ['support', 'bugs', 'fixes'],
  },
  {
    id: '21',
    question: 'Can you help me add features later?',
    answer: 'Absolutely! Many clients start with a basic website and add features as their business grows. I can help you add new features, expand functionality, or redesign sections whenever you\'re ready. Think of it as building onto your house - you can always add rooms later!',
    category: 'support',
    tags: ['updates', 'features', 'growth'],
  },
  {
    id: '22',
    question: 'Do you provide training?',
    answer: 'Yes! I\'ll train you and your team on how to use your website, update content, manage orders (if applicable), and use any admin features. I can do this through video calls, written guides, or in-person if you\'re local. My goal is to make sure you feel confident managing your site.',
    category: 'support',
    tags: ['training', 'tutorial', 'help'],
  },
];

const categories = [
  { id: 'all', label: 'All Questions', icon: HelpCircle },
  { id: 'general', label: 'General', icon: HelpCircle },
  { id: 'pricing', label: 'Pricing', icon: HelpCircle },
  { id: 'process', label: 'Process', icon: HelpCircle },
  { id: 'technical', label: 'Technical', icon: HelpCircle },
  { id: 'timeline', label: 'Timeline', icon: HelpCircle },
  { id: 'support', label: 'Support', icon: HelpCircle },
];

export function InteractiveFAQ() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch =
      searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Frequently Asked Questions</CardTitle>
          <CardDescription>
            Got questions? We've got answers! Everything explained in simple, easy-to-understand language.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-border"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>

          {/* FAQ Items */}
          <div className="space-y-3">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No questions found matching your search.</p>
                <p className="text-sm mt-2">Try a different search term or category.</p>
              </div>
            ) : (
              filteredFAQs.map((item) => {
                const isOpen = openItems.has(item.id);
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full text-left p-6 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {item.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 pt-0">
                        <div className="border-t pt-4">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>

          {/* Results Count */}
          {filteredFAQs.length > 0 && (
            <div className="text-sm text-gray-500 text-center">
              Showing {filteredFAQs.length} of {faqData.length} questions
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
