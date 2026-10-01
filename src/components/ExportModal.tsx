import React, { useState } from 'react';
import { Download, Copy, Check, FileSpreadsheet, FileCode, X, Printer } from 'lucide-react';
import { MeetingRecord } from '../types';
import { generateCsvAttendance, downloadFile, formatDateTime } from '../utils/formatters';

interface ExportModalProps {
  isOpen: boolean;
  meeting: MeetingRecord;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, meeting, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadCsv = () => {
    const csv = generateCsvAttendance(meeting);
    const filename = `meet-attendance-${meeting.meetingCode || 'export'}-${Date.now()}.csv`;
    downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(meeting, null, 2);
    const filename = `meet-conference-${meeting.meetingCode || 'export'}-${Date.now()}.json`;
    downloadFile(jsonStr, filename, 'application/json');
  };

  const handleCopyCsv = async () => {
    const csv = generateCsvAttendance(meeting);
    await navigator.clipboard.writeText(csv);
    setCopiedType('csv');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Export Attendance Report</h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {meeting.title} • {formatDateTime(meeting.startTime)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-600 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          {/* CSV Option */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Spreadsheet CSV (Excel / Sheets)</h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  Complete attendee log with join/leave times, sessions, duration seconds, and attendance rate %.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyCsv}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg flex items-center space-x-1 cursor-pointer"
              >
                {copiedType === 'csv' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'csv' ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownloadCsv}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center space-x-1 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* JSON Option */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-700">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Developer JSON Format</h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  Full structured conference record hierarchy including participant sub-sessions and metadata.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadJson}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center space-x-1 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>

          {/* Print Option */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Print / PDF Summary</h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  Generate a clean, high-contrast printable attendance roster sheet for audits or archiving.
                </p>
              </div>
            </div>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg flex items-center space-x-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print View</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
