import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Google Agentic Browser — The Browser That Does',
  description:
    'An independent AI-native multi-agent browser workspace powered by Gemini, Firebase, and human-in-the-loop Google Workspace orchestration.',
  openGraph: {
    title: 'Google Agentic Browser — The Browser That Does',
    description:
      'An independent AI-native multi-agent browser workspace powered by Gemini, Firebase, and human-in-the-loop Google Workspace orchestration.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Google Agentic Browser — The Browser That Does',
    description:
      'An independent AI-native multi-agent browser workspace powered by Gemini, Firebase, and human-in-the-loop Google Workspace orchestration.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${jakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#080c14] text-slate-100 antialiased selection:bg-blue-500/30 selection:text-blue-100"
      >
        {children}
      </body>
    </html>
  );
}
