'use client';

import { useState } from 'react';

interface AudioAsset {
  id: string;
  kind: string;
  lineIndex?: number;
  storageKey: string;
  durationMs?: number;
  codec?: string;
  sampleRate?: number;
  channels?: number;
  fileSize?: number;
  checksum?: string;
  createdAt: string;
}

interface IntegrityCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  threshold?: string;
}

interface AudioInspectorProps {
  sessionId: string;
  assets: AudioAsset[];
  integrityChecks?: IntegrityCheck[];
}

export default function AudioInspector({ sessionId, assets, integrityChecks = [] }: AudioInspectorProps) {
  const [selectedAsset, setSelectedAsset] = useState<AudioAsset | null>(null);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return 'Unknown';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Audio Inspector</h3>

        {/* Integrity Checks */}
        {integrityChecks.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Integrity Checks</h4>
            <div className="space-y-2">
              {integrityChecks.map((check, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded ${
                    check.status === 'pass'
                      ? 'bg-green-50'
                      : check.status === 'fail'
                      ? 'bg-red-50'
                      : 'bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span
                      className={`mr-2 ${
                        check.status === 'pass'
                          ? 'text-green-600'
                          : check.status === 'fail'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '⚠'}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{check.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {check.message}
                    {check.threshold && <span className="ml-1 text-gray-400">({check.threshold})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Asset Inventory */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Asset Inventory</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kind
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Line
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                      No audio assets recorded yet
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr
                      key={asset.id}
                      className={selectedAsset?.id === asset.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {asset.kind}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {asset.lineIndex !== null && asset.lineIndex !== undefined
                          ? `#${asset.lineIndex + 1}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDuration(asset.durationMs)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {asset.codec && asset.sampleRate && asset.channels
                          ? `${asset.codec.toUpperCase()} ${asset.sampleRate}Hz ${asset.channels}ch`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(asset.fileSize)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedAsset(selectedAsset?.id === asset.id ? null : asset)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {selectedAsset?.id === asset.id ? 'Hide' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Detail Panel */}
        {selectedAsset && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Asset Details</h4>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-gray-500">ID</dt>
                <dd className="mt-1 text-xs text-gray-900 font-mono">{selectedAsset.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Storage Key</dt>
                <dd className="mt-1 text-xs text-gray-900 font-mono break-all">{selectedAsset.storageKey}</dd>
              </div>
              {selectedAsset.durationMs && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-xs text-gray-900">{formatDuration(selectedAsset.durationMs)}</dd>
                </div>
              )}
              {selectedAsset.codec && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">Codec</dt>
                  <dd className="mt-1 text-xs text-gray-900">{selectedAsset.codec.toUpperCase()}</dd>
                </div>
              )}
              {selectedAsset.sampleRate && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">Sample Rate</dt>
                  <dd className="mt-1 text-xs text-gray-900">{selectedAsset.sampleRate} Hz</dd>
                </div>
              )}
              {selectedAsset.channels && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">Channels</dt>
                  <dd className="mt-1 text-xs text-gray-900">
                    {selectedAsset.channels === 1 ? 'Mono' : selectedAsset.channels === 2 ? 'Stereo' : `${selectedAsset.channels}ch`}
                  </dd>
                </div>
              )}
              {selectedAsset.fileSize && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">File Size</dt>
                  <dd className="mt-1 text-xs text-gray-900">{formatFileSize(selectedAsset.fileSize)}</dd>
                </div>
              )}
              {selectedAsset.checksum && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500">Checksum</dt>
                  <dd className="mt-1 text-xs text-gray-900 font-mono break-all">{selectedAsset.checksum}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-xs text-gray-900">
                  {new Date(selectedAsset.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

