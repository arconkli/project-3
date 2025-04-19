import React from 'react';
import { HelpCircle, Mail, MessageCircle, Phone, FileText, ExternalLink } from 'lucide-react';

const SupportSection: React.FC = () => {
  const supportResources = [
    {
      title: 'Documentation',
      description: 'Read our comprehensive guides and tutorials',
      icon: FileText,
      link: '#',
      external: true
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: MessageCircle,
      link: '#',
      external: false
    },
    {
      title: 'Email Support',
      description: 'support@example.com',
      icon: Mail,
      link: 'mailto:support@example.com',
      external: false
    },
    {
      title: 'Phone Support',
      description: '+1 (555) 123-4567',
      icon: Phone,
      link: 'tel:+15551234567',
      external: false
    }
  ];

  return (
    <div className="bg-white/5 rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <HelpCircle className="h-5 w-5 text-purple-400" />
        </div>
        <h2 className="text-xl font-semibold">Support & Resources</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {supportResources.map((resource, index) => (
          <a
            key={index}
            href={resource.link}
            target={resource.external ? '_blank' : undefined}
            rel={resource.external ? 'noopener noreferrer' : undefined}
            className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors flex items-start gap-4"
          >
            <div className="p-2 bg-gray-800 rounded-lg">
              <resource.icon className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{resource.title}</h3>
                {resource.external && (
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">{resource.description}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="p-4 bg-purple-500/10 rounded-lg">
        <div className="flex items-center gap-2 text-purple-400">
          <MessageCircle className="h-5 w-5" />
          <p className="font-medium">Need immediate assistance?</p>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Our support team is available 24/7 to help you with any questions or issues.
        </p>
      </div>

      <div className="border-t border-gray-800 pt-4 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Support Hours</p>
            <p className="font-medium">24/7 Support Available</p>
          </div>
          <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportSection; 