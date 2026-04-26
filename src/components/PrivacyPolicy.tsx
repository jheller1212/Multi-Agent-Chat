import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: March 2026</p>
          </div>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">1. Who We Are</h2>
            <p>
              AI2AI-Chat ("we", "our", or "the Service") is an independent research tool that lets you
              run structured conversations between two AI models using your own API keys. The Service is
              operated as a personal/independent project. For privacy-related questions, contact us at{' '}
              <a href="mailto:hello@ai2ai-chat.com" className="text-indigo-600 dark:text-indigo-400 underline">
                hello@ai2ai-chat.com
              </a>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. What Data We Collect</h2>
            <p>We collect only what is necessary to provide the Service:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account data:</strong> Email address and display name, provided when you register.</li>
              <li><strong>Conversation data:</strong> When you choose to save a session, we store the conversation messages, model configuration (provider, model name, temperature, token limits), and metadata (timestamps, word counts, response times).</li>
              <li><strong>Browser preferences:</strong> Theme preference (light/dark) and chat settings are stored in your browser's localStorage and never sent to our servers.</li>
            </ul>
            <p className="mt-2">
              <strong>API keys are encrypted and stored securely.</strong> When you save an API key, it is
              encrypted with AES-256-GCM on our server and stored in our database. Keys are decrypted
              only when you log in and are transmitted directly from your browser to the respective AI
              provider (OpenAI, Anthropic, Google, Mistral). Keys are cleared from your browser on sign-out.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">3. Legal Basis for Processing (GDPR)</h2>
            <p>For users in the European Economic Area (EEA), we process personal data under the following legal bases:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Contract performance (Art. 6(1)(b)):</strong> Processing your email and conversation data is necessary to provide the Service you signed up for.</li>
              <li><strong>Legitimate interests (Art. 6(1)(f)):</strong> We maintain minimal security logs to protect the integrity of the Service.</li>
              <li><strong>Consent (Art. 6(1)(a)):</strong> Storing preferences in localStorage, which you can clear at any time via your browser settings.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">4. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To authenticate you and maintain your account</li>
              <li>To store and retrieve your conversation history (if you choose to save it)</li>
              <li>To send service-related emails (account confirmation, password reset)</li>
              <li>We do <strong>not</strong> sell, share, or use your data for advertising</li>
              <li>We do <strong>not</strong> use your conversations to train AI models</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">5. Data Retention</h2>
            <p>
              Your account data and saved conversations are retained for as long as your account remains
              active. If you delete your account, all associated data (conversations and messages) is
              permanently and immediately deleted. You can delete your account at any time from
              Settings → Delete Account. You may also clear your conversation history without deleting
              your account via Settings → Delete all data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">6. Data Processors & International Transfers</h2>
            <p>We use the following sub-processors to operate the Service:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Supabase Inc.</strong> (United States) — database, authentication, and hosting.
                Supabase stores data on servers in the United States. Transfers from the EEA are covered
                by Standard Contractual Clauses (SCCs). Supabase's privacy policy:{' '}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 underline"
                >
                  supabase.com/privacy
                </a>.
              </li>
              <li>
                <strong>Netlify Inc.</strong> (United States) — website hosting and CDN. Netlify's
                privacy policy:{' '}
                <a
                  href="https://www.netlify.com/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 underline"
                >
                  netlify.com/privacy
                </a>.
              </li>
            </ul>
            <p className="mt-2">
              When you make API calls, your prompts and generated content are sent directly from your
              browser to the AI provider you selected (OpenAI, Anthropic, Google, or Mistral). Their
              respective privacy policies and data processing agreements apply to those interactions.
              We have no visibility into those API calls.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">7. Your Rights (GDPR)</h2>
            <p>If you are in the EEA, you have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access:</strong> Request a copy of the data we hold about you</li>
              <li><strong>Rectification:</strong> Correct inaccurate data (via Settings → Change display name / email)</li>
              <li><strong>Erasure:</strong> Delete your account and all data (via Settings → Delete Account)</li>
              <li><strong>Portability:</strong> Export your conversation data as CSV from the app at any time</li>
              <li><strong>Restriction / Objection:</strong> Contact us to restrict or object to specific processing</li>
            </ul>
            <p className="mt-2">
              To exercise any right, email{' '}
              <a href="mailto:hello@ai2ai-chat.com" className="text-indigo-600 dark:text-indigo-400 underline">
                hello@ai2ai-chat.com
              </a>. We will respond within 30 days. You also have the right to lodge a complaint with
              your local data protection authority.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">8. Browser Storage (localStorage)</h2>
            <p>
              This app uses your browser's <strong>localStorage</strong> (not cookies) to store your
              theme preference and chat settings. API keys are encrypted server-side (AES-256-GCM) and
              stored in our database so they persist across sessions and devices. A temporary copy is
              kept in localStorage during your session and cleared automatically on sign-out. No
              third-party tracking scripts or advertising cookies are used.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">9. Children's Privacy</h2>
            <p>
              The Service is not directed at children under 16. We do not knowingly collect personal
              data from anyone under 16. If you believe a minor has registered, please contact us so we
              can delete their account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">10. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. When we do, we will update the "Last updated"
              date above. For material changes, we will notify you by email or via a notice in the app.
              Continued use after the effective date constitutes acceptance of the revised policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">11. Contact</h2>
            <p>
              For any privacy questions or to exercise your rights, contact:{' '}
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
