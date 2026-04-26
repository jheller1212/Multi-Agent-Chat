import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsOfUseProps {
  onBack: () => void;
}

export function TermsOfUse({ onBack }: TermsOfUseProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-8 space-y-8 text-gray-700 dark:text-gray-300">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms of Use &amp; User Agreement</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: March 2026</p>
          </div>

          <p>
            By creating an account and using AI2AI Chat ("the Service"), you agree to the following
            terms. If you do not agree, do not use the Service.
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
            <p>
              By registering, you confirm that you are at least 16 years of age and legally capable of
              entering into this agreement. If you are accessing the Service on behalf of an organisation,
              you represent that you have authority to bind that organisation to these terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. Service Provided "As Is"</h2>
            <p>
              The Service is provided on an "as is" and "as available" basis without warranties of any
              kind, express or implied. The operator makes no representations regarding the accuracy,
              reliability, completeness, or fitness for a particular purpose of any content generated
              through the Service. Use of the Service is entirely at your own risk.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">3. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, the operator shall not be liable for
              any direct, indirect, incidental, special, consequential, or punitive damages arising from
              your use of, or inability to use, the Service — including but not limited to damages
              resulting from AI-generated content, data loss, or reliance on information obtained
              through the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">4. Third-Party AI Services &amp; API Keys</h2>
            <p>
              You are solely responsible for obtaining and managing your own API keys from third-party
              AI providers (including but not limited to OpenAI, Anthropic, Google, and Mistral). You
              agree to comply with the terms of service of any third-party AI provider whose services
              you access through this platform. The operator assumes no responsibility for charges,
              restrictions, or actions taken by third-party providers in relation to your API usage.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">5. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Generate, distribute, or facilitate illegal, abusive, defamatory, or harmful content</li>
              <li>Produce, promote, or distribute child sexual abuse material (CSAM) or any content that exploits minors</li>
              <li>Harass, threaten, or impersonate any individual or organisation</li>
              <li>Circumvent the safety systems, rate limits, or terms of service of any AI provider</li>
              <li>Conduct automated bulk usage in a manner that violates provider policies</li>
              <li>Engage in any activity regulated by export control laws (including ITAR/EAR) without appropriate authorisation</li>
              <li>Violate any applicable local, national, or international law or regulation</li>
            </ul>
            <p className="mt-2">
              The operator reserves the right to suspend or terminate accounts found to be in violation
              of these prohibitions, without prior notice, at its sole discretion.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">6. Account Suspension &amp; Termination</h2>
            <p>
              The operator may suspend or terminate your access to the Service at any time and for any
              reason, including but not limited to a breach of these Terms, without liability. You may
              delete your account at any time from Settings → Delete Account. Upon account deletion,
              all associated conversation data and your account credentials are permanently and
              immediately deleted.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">7. Email Communications</h2>
            <p>
              By creating an account, you agree to receive service-related emails including account
              confirmations, password resets, and important service notices. You may opt out of
              non-essential communications at any time by contacting us at hello@ai2ai-chat.com.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">8. Data &amp; Privacy</h2>
            <p>
              Conversation data you choose to save is stored to provide the Service. You retain
              ownership of your content. The operator will not sell your personal data to third parties.
              For full details on how your data is collected, stored, and processed — including your
              rights under GDPR — please see our{' '}
              <button
                onClick={onBack}
                className="text-indigo-600 dark:text-indigo-400 underline cursor-pointer"
              >
                Privacy Policy
              </button>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">9. Governing Law &amp; Jurisdiction</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the European
              Union and, where applicable, the laws of the country in which the operator is established.
              Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of
              the competent courts of that jurisdiction. If you are a consumer in the EU, you may also
              benefit from any mandatory consumer protection laws of your country of residence.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">10. Changes to Terms</h2>
            <p>
              These Terms may be updated from time to time. We will notify you by email or via an
              in-app notice for material changes. Continued use of the Service after the effective date
              of revised Terms constitutes acceptance of those changes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">11. Contact</h2>
            <p>
              For questions about these Terms, contact:{' '}
              <a href="mailto:hello@ai2ai-chat.com" className="text-indigo-600 dark:text-indigo-400 underline">
                hello@ai2ai-chat.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
