import React from 'react';
import { FlaskConical, Briefcase, BookOpen } from 'lucide-react';

interface UseCaseColumn {
  icon: React.ReactNode;
  title: string;
  points: string[];
  dotColor: string;
}

const columns: UseCaseColumn[] = [
  {
    icon: <FlaskConical className="h-5 w-5 text-orange-600" />,
    title: "Research & academia",
    points: [
      "Compare how models reason through ethical dilemmas or logical puzzles",
      "Test whether rephrasing a system prompt meaningfully changes the outcome",
      "Run the same setup N times for statistical comparison across models",
    ],
    dotColor: "bg-orange-500",
  },
  {
    icon: <Briefcase className="h-5 w-5 text-sky-600" />,
    title: "Business & strategy",
    points: [
      "Simulate sales negotiations to find the most effective AI-driven pitch",
      "Stress-test customer service scripts before deploying them",
      "Brainstorm product ideas by letting two AI perspectives challenge each other",
    ],
    dotColor: "bg-sky-500",
  },
  {
    icon: <BookOpen className="h-5 w-5 text-indigo-600" />,
    title: "Education & learning",
    points: [
      "Teach students how different AI models reason through the same problem",
      "Let learners observe AI behaviour in negotiation, therapy, or debate scenarios",
      "Share experiment configs via URL so an entire group starts from the same setup",
    ],
    dotColor: "bg-indigo-500",
  },
];

export function ResearchFocus() {
  return (
    <div className="py-8 bg-gradient-to-r from-orange-50 to-sky-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">What people use it for</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((col) => (
            <div key={col.title} className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center gap-2 mb-3">
                {col.icon}
                <h3 className="text-xl font-semibold">{col.title}</h3>
              </div>
              <ul className="space-y-3">
                {col.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className={`w-2 h-2 ${col.dotColor} rounded-full`}></div>
                    </div>
                    <p className="text-gray-600">{point}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
