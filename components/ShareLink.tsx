import React, { useState, useEffect } from 'react';

interface ShareLinkProps {
  gameId: string;
}

const ShareLink: React.FC<ShareLinkProps> = ({ gameId }) => {
  const [copied, setCopied] = useState(false);
  const [useNetworkUrl, setUseNetworkUrl] = useState(true); // Default to network URL for easier sharing
  const [networkIp, setNetworkIp] = useState<string>('192.168.68.106'); // Default to common local IP
  const [showQr, setShowQr] = useState(false);

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Try to detect network IP using WebRTC (works in most browsers)
  useEffect(() => {
    if (!isLocalhost) return;

    const getNetworkIp = async () => {
      try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel('');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await new Promise<void>((resolve) => {
          pc.onicecandidate = (e) => {
            if (!e.candidate) {
              resolve();
              return;
            }
            const candidate = e.candidate.candidate;
            const ipMatch = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
            if (ipMatch && !ipMatch[1].startsWith('127.')) {
              setNetworkIp(ipMatch[1]);
              resolve();
            }
          };
          // Timeout after 2 seconds
          setTimeout(resolve, 2000);
        });

        pc.close();
      } catch (err) {
        console.log('Could not detect network IP:', err);
      }
    };

    getNetworkIp();
  }, [isLocalhost]);

  const getGameUrl = () => {
    const base = isLocalhost && useNetworkUrl && networkIp
      ? `http://${networkIp}:${window.location.port}`
      : window.location.origin;
    return `${base}/?game=${encodeURIComponent(gameId)}`;
  };

  const gameUrl = getGameUrl();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wide">
          Share This Game
        </h3>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        Copy this link and share it with your group to let them join.
      </p>

      {isLocalhost && (
        <div className="flex items-center gap-2 mb-3">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={useNetworkUrl}
              onChange={(e) => setUseNetworkUrl(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Use network URL (for phones/other devices)</span>
          </label>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={gameUrl}
          readOnly
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none"
        />
        <button
          onClick={handleCopy}
          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={() => setShowQr(!showQr)}
          className="px-4 py-2 rounded-xl font-bold text-sm bg-slate-700 hover:bg-slate-600 text-white transition-all"
          title="Show QR Code"
        >
          QR
        </button>
      </div>

      {showQr && (
        <div className="mt-4 flex flex-col items-center">
          <p className="text-xs text-slate-400 mb-2">Scan with your phone camera:</p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(gameUrl)}`}
            alt="QR Code"
            className="rounded-lg bg-white p-2"
            width={200}
            height={200}
          />
        </div>
      )}
    </div>
  );
};

export default ShareLink;
