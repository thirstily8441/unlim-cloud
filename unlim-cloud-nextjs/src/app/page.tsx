'''use client';

import { useState, useEffect } from 'react';
import { FaDownload, FaArrowRight, FaGithub, FaPaypal } from 'react-icons/fa';

// Define constants
const CURRENT_VERSION = '1.0.0'; // The version of the currently deployed app
const REPO_URL = 'https://github.com/thirstily8441/unlim-cloud';
const API_BASE_URL = 'https://api.github.com/repos/thirstily8441/unlim-cloud/contents';
const PACKAGE_JSON_PATH = 'unlim-cloud-nextjs/package.json';
const CHANGELOG_PATH = 'unlim-cloud-nextjs/CHANGELOG.md';
const WEB_APP_URL = 'https://unlim-cloud.web.app';
const SNOOZE_KEY = 'unlimCloudUpdateSnooze';
const SNOOZE_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days

// Helper function to parse changelog
const parseChangelog = (content, version) => {
  if (!content) return 'Could not load release notes.';
  try {
    const decodedContent = atob(content);
    const versionSection = decodedContent.split('## [' + version + ']')[1];
    if (!versionSection) return 'No release notes for this version.';
    const notes = versionSection.split('## [')[0].trim();
    return notes;
  } catch (error) {
    console.error('Error parsing changelog:', error);
    return 'Error parsing release notes.';
  }
};

export default function Home() {
  const [status, setStatus] = useState('checking'); // checking, available, no-update, snoozed, error
  const [newVersion, setNewVersion] = useState(null);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [isLocalStorageAvailable, setIsLocalStorageAvailable] = useState(false);

  useEffect(() => {
    setIsLocalStorageAvailable(typeof window.localStorage !== 'undefined');
  }, []);

  useEffect(() => {
    if (!isLocalStorageAvailable) {
      // If localStorage is not available, just check the version without snooze functionality.
      checkVersion();
      return;
    }

    const snoozedUntil = localStorage.getItem(SNOOZE_KEY);
    if (snoozedUntil && Date.now() < parseInt(snoozedUntil, 10)) {
      setStatus('snoozed');
      window.location.href = WEB_APP_URL;
      return;
    }

    checkVersion();
  }, [isLocalStorageAvailable]);

  const checkVersion = async () => {
    try {
      const pkgResponse = await fetch(`${API_BASE_URL}/${PACKAGE_JSON_PATH}`);
      if (!pkgResponse.ok) throw new Error('Failed to fetch package.json');
      const pkgData = await pkgResponse.json();
      const latestVersion = JSON.parse(atob(pkgData.content)).version;

      if (latestVersion > CURRENT_VERSION) {
        setNewVersion(latestVersion);
        setStatus('available');

        // Fetch changelog
        try {
            const clResponse = await fetch(`${API_BASE_URL}/${CHANGELOG_PATH}`);
            if (clResponse.ok) {
                const clData = await clResponse.json();
                const notes = parseChangelog(clData.content, latestVersion);
                setReleaseNotes(notes);
            } else {
                setReleaseNotes('Could not load release notes.');
            }
        } catch (clError) {
            console.error('Changelog fetch error:', clError);
            setReleaseNotes('Could not load release notes.');
        }

      } else {
        setStatus('no-update');
      }
    } catch (error) {
      console.error('Version check failed:', error);
      setStatus('error');
    }
  };

  const handleRemindLater = () => {
    if (isLocalStorageAvailable) {
      const snoozedUntil = Date.now() + SNOOZE_DURATION;
      localStorage.setItem(SNOOZE_KEY, snoozedUntil.toString());
      window.location.href = WEB_APP_URL;
    }
  };

  const Card = ({ children }) => (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
      {children}
    </div>
  );

  const Button = ({ children, onClick, primary = false, ...props }) => {
      const baseClasses = "w-full text-center rounded-lg px-4 py-3 font-semibold transition-transform transform hover:scale-105";
      const primaryClasses = "bg-blue-600 text-white hover:bg-blue-700";
      const secondaryClasses = "bg-gray-200 text-gray-700 hover:bg-gray-300";
      return (
        <button onClick={onClick} className={`${baseClasses} ${primary ? primaryClasses : secondaryClasses}`} {...props}>
            <div className="flex items-center justify-center space-x-2">
                {children}
            </div>
        </button>
      );
  };

  const renderContent = () => {
    switch (status) {
      case 'checking':
        return <p className="text-gray-500">Checking for updates...</p>;

      case 'error':
        return (
            <>
                <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
                <p className="text-gray-600 mb-6">Could not check for updates. Please try again later.</p>
                <Button onClick={() => window.location.href = WEB_APP_URL}>Go to App <FaArrowRight /></Button>
            </>
        );

      case 'no-update':
        return (
            <>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">You're Up-to-Date!</h1>
                <p className="text-gray-600 mb-6">Version {CURRENT_VERSION} is the latest version.</p>
                <Button primary onClick={() => window.location.href = WEB_APP_URL}>Go to App <FaArrowRight /></Button>
            </>
        );

      case 'available':
        return (
            <>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">New Version Available!</h1>
                <p className="text-xl text-blue-600 font-semibold mb-4">Version {newVersion}</p>

                {releaseNotes && (
                    <div className="bg-gray-50 rounded-lg p-4 my-6 text-left max-h-40 overflow-y-auto">
                        <h2 className="font-bold text-lg mb-2 text-gray-700">Release Notes</h2>
                        <pre className="whitespace-pre-wrap text-sm text-gray-600 font-sans">{releaseNotes}</pre>
                    </div>
                )}

                <div className="space-y-3">
                    <Button primary onClick={() => window.location.href = `${REPO_URL}/releases/latest`}>Download Now <FaDownload /></Button>
                    {isLocalStorageAvailable && <Button onClick={handleRemindLater}>Remind Me Later</Button>}
                </div>

                <div className="mt-8 text-sm">
                    <p className="font-semibold text-gray-600 mb-3">Support the developer</p>
                    <div className="flex justify-center items-center space-x-4 text-gray-500">
                        <a href="https://github.com/sponsors/thirstily8441" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 flex items-center space-x-1"><FaGithub /> <span>GitHub</span></a>
                        <a href="https://paypal.me/yourpaypal" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 flex items-center space-x-1"><FaPaypal /> <span>PayPal</span></a>
                    </div>
                </div>
            </>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
      <Card>
        {renderContent()}
      </Card>
    </main>
  );
}
'''