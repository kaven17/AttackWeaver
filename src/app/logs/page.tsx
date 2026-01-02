"use client"
import React, { useState } from 'react';
import { Shield, AlertTriangle, Activity, Database } from 'lucide-react';

interface SecurityLog {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  role: string;
  eventType: string;
  action: string;
  device: string;
  deviceId: string;
  location: string;
  ipAddress: string;
  riskScore: number;
  severity: 'Critical' | 'High' | 'Suspicious' | 'Low';
  attackStage: string;
  behavioralAnomaly: number;
  explanation: string;
}

const ThreatXDashboard = () => {
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);

  const securityLogs: SecurityLog[] = [
    {
      id: 'EVT-2024-001',
      timestamp: '2024-12-18 14:23:45',
      user: 'admin_user_47',
      userId: 'U-4721',
      role: 'Administrator',
      eventType: 'Privilege Escalation',
      action: 'Attempted sudo access to production database',
      device: 'Unknown Device (Linux)',
      deviceId: 'DEV-UNKNOWN-8472',
      location: 'Moscow, Russia',
      ipAddress: '185.220.101.45',
      riskScore: 85,
      severity: 'Critical',
      attackStage: 'Privilege Escalation',
      behavioralAnomaly: 92,
      explanation: 'User accessed system outside normal hours (2 AM local time), from new geographic location, attempting privileged operations never performed before.'
    },
    {
      id: 'EVT-2024-002',
      timestamp: '2024-12-18 14:18:12',
      user: 'jdoe@corp.com',
      userId: 'U-1523',
      role: 'Developer',
      eventType: 'Lateral Movement',
      action: 'Accessed 15 employee records via API',
      device: 'New Mobile Device (Android)',
      deviceId: 'DEV-8823',
      location: 'Beijing, China',
      ipAddress: '218.75.102.93',
      riskScore: 72,
      severity: 'High',
      attackStage: 'Lateral Movement',
      behavioralAnomaly: 78,
      explanation: 'Developer role accessing HR data from new device. Historical pattern shows only code repository access. API call frequency 4x above baseline.'
    },
    {
      id: 'EVT-2024-003',
      timestamp: '2024-12-18 14:15:33',
      user: 'service_account_12',
      userId: 'U-SVC-12',
      role: 'Service Account',
      eventType: 'Initial Access',
      action: 'Multiple failed authentication attempts',
      device: 'Known Server',
      deviceId: 'DEV-1205',
      location: 'Virginia, USA',
      ipAddress: '52.45.23.110',
      riskScore: 45,
      severity: 'Suspicious',
      attackStage: 'Initial Access',
      behavioralAnomaly: 55,
      explanation: '8 failed login attempts followed by successful authentication. Service accounts typically have zero failures. Possible credential stuffing.'
    },
    {
      id: 'EVT-2024-004',
      timestamp: '2024-12-18 14:12:08',
      user: 'api_bot_external',
      userId: 'U-API-991',
      role: 'API Client',
      eventType: 'Reconnaissance',
      action: 'Endpoint enumeration detected',
      device: 'New Device',
      deviceId: 'DEV-UNKNOWN-2441',
      location: 'Frankfurt, Germany',
      ipAddress: '91.213.8.72',
      riskScore: 38,
      severity: 'Suspicious',
      attackStage: 'Reconnaissance',
      behavioralAnomaly: 42,
      explanation: 'Sequential API endpoint probing pattern detected. 47 unique endpoints accessed in 2 minutes. New IP address for this client.'
    },
    {
      id: 'EVT-2024-005',
      timestamp: '2024-12-18 14:08:55',
      user: 'msmith@corp.com',
      userId: 'U-7841',
      role: 'Manager',
      eventType: 'Data Access',
      action: 'Downloaded financial reports',
      device: 'Known Laptop',
      deviceId: 'DEV-4412',
      location: 'New York, USA',
      ipAddress: '172.16.5.44',
      riskScore: 15,
      severity: 'Low',
      attackStage: 'Unknown',
      behavioralAnomaly: 18,
      explanation: 'Normal business activity. User regularly accesses financial data during business hours from approved device.'
    },
    {
      id: 'EVT-2024-006',
      timestamp: '2024-12-18 14:05:21',
      user: 'dbadmin_prod',
      userId: 'U-DBA-03',
      role: 'Database Admin',
      eventType: 'Persistence',
      action: 'Created new admin account',
      device: 'Known Workstation',
      deviceId: 'DEV-3307',
      location: 'London, UK',
      ipAddress: '81.92.201.15',
      riskScore: 68,
      severity: 'High',
      attackStage: 'Persistence',
      behavioralAnomaly: 71,
      explanation: 'Admin account created outside change window. No associated ticket found. Account naming does not follow organizational convention.'
    },
    {
      id: 'EVT-2024-007',
      timestamp: '2024-12-18 14:02:10',
      user: 'contractor_ext_45',
      userId: 'U-EXT-145',
      role: 'External Contractor',
      eventType: 'Data Exfiltration',
      action: 'Large file transfer to external IP',
      device: 'Known Device',
      deviceId: 'DEV-9912',
      location: 'Mumbai, India',
      ipAddress: '103.21.58.92',
      riskScore: 52,
      severity: 'Suspicious',
      attackStage: 'Lateral Movement',
      behavioralAnomaly: 61,
      explanation: 'Transferred 2.3 GB to unknown external server. Contractor typically transfers <100 MB per session. File transfer occurred after hours.'
    },
    {
      id: 'EVT-2024-008',
      timestamp: '2024-12-18 13:58:44',
      user: 'jsmith@corp.com',
      userId: 'U-2214',
      role: 'Sales Rep',
      eventType: 'Authentication',
      action: 'Successful login',
      device: 'Known Mobile',
      deviceId: 'DEV-5523',
      location: 'Chicago, USA',
      ipAddress: '192.168.1.88',
      riskScore: 8,
      severity: 'Low',
      attackStage: 'Unknown',
      behavioralAnomaly: 5,
      explanation: 'Normal login activity during business hours from registered device and typical location.'
    }
  ];

  const getRiskColor = (severity: SecurityLog['severity']): string => {
    switch(severity) {
      case 'Critical': return 'text-red-400';
      case 'High': return 'text-orange-400';
      case 'Suspicious': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  const getRiskBg = (severity: SecurityLog['severity']): string => {
    switch(severity) {
      case 'Critical': return 'bg-red-950 border-red-800 text-red-300';
      case 'High': return 'bg-orange-950 border-orange-800 text-orange-300';
      case 'Suspicious': return 'bg-yellow-950 border-yellow-800 text-yellow-300';
      default: return 'bg-green-950 border-green-800 text-green-300';
    }
  };

  const criticalCount = securityLogs.filter(log => log.severity === 'Critical').length;
  const highCount = securityLogs.filter(log => log.severity === 'High').length;
  const suspiciousCount = securityLogs.filter(log => log.severity === 'Suspicious').length;
  const lowCount = securityLogs.filter(log => log.severity === 'Low').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-emerald-950 to-gray-950 p-6">
      

      {/* Main Table Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-emerald-100 mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          Security Event Log
        </h2>
      </div>

      <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 border-2 border-emerald-700 rounded-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 border-b-2 border-emerald-600">
                <th className="text-left p-4 text-emerald-200 font-bold text-sm uppercase tracking-wide">Event ID</th>
                <th className="text-left p-4 text-emerald-200 font-bold text-sm uppercase tracking-wide">Timestamp</th>
                <th className="text-left p-4 text-emerald-200 font-bold text-sm uppercase tracking-wide">User</th>
                <th className="text-left p-4 text-emerald-200 font-bold text-sm uppercase tracking-wide">Event Type</th>
                <th className="text-left p-4 text-emerald-200 font-bold text-sm uppercase tracking-wide">Risk Score</th>
                <th className="text-left p-4 text-emerald-200 font-bold text-sm uppercase tracking-wide">Severity</th>
                <th className="text-left p-4 text-emerald-200 font-bold text-sm uppercase tracking-wide">Attack Stage</th>
                <th className="text-left p-4 text-emerald-200 font-bold text-sm uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {securityLogs.map((log, index) => (
                <tr
                  key={log.id}
                  className={`border-b border-emerald-800 hover:bg-emerald-800/50 cursor-pointer transition-all duration-200 ${index % 2 === 0 ? 'bg-emerald-950/50' : 'bg-emerald-900/30'}`}
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="p-4 text-emerald-100 text-sm font-semibold">{log.id}</td>
                  <td className="p-4 text-emerald-300 text-sm">{log.timestamp}</td>
                  <td className="p-4 text-emerald-200 text-sm font-medium">{log.user}</td>
                  <td className="p-4 text-emerald-300 text-sm">{log.eventType}</td>
                  <td className="p-4">
                    <span className={`font-bold text-base ${getRiskColor(log.severity)}`}>
                      {log.riskScore}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getRiskBg(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="p-4 text-emerald-300 text-sm">{log.attackStage}</td>
                  <td className="p-4 text-emerald-400 text-sm">{log.action.substring(0, 40)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50" onClick={() => setSelectedLog(null)}>
          <div className="bg-gradient-to-br from-gray-900 to-emerald-950 border-2 border-emerald-700 rounded-xl shadow-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6 border-b border-emerald-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-emerald-100 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-emerald-400" />
                  Event Details
                </h2>
                <p className="text-emerald-400 text-sm mt-1">{selectedLog.id}</p>
              </div>
              <button 
                className="text-emerald-400 hover:text-emerald-300 text-3xl font-bold transition-colors"
                onClick={() => setSelectedLog(null)}
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-950/50 border-2 border-emerald-800 rounded-lg p-4">
                  <div className="text-emerald-400 text-xs font-bold uppercase tracking-wide mb-2">Timestamp</div>
                  <div className="text-emerald-100 text-base font-semibold">{selectedLog.timestamp}</div>
                </div>
                <div className={`border-2 rounded-lg p-4 ${getRiskBg(selectedLog.severity)}`}>
                  <div className="text-xs font-bold uppercase tracking-wide mb-2 opacity-80">Severity Level</div>
                  <div className="text-base font-bold">{selectedLog.severity}</div>
                </div>
              </div>

              <div className="bg-emerald-950/50 border-2 border-emerald-800 rounded-lg p-4">
                <h3 className="text-emerald-300 text-sm font-bold uppercase tracking-wide mb-3">User Information</h3>
                <div className="space-y-2">
                  <div className="text-emerald-100 text-sm"><span className="text-emerald-400 font-semibold">User:</span> {selectedLog.user}</div>
                  <div className="text-emerald-200 text-sm"><span className="text-emerald-400 font-semibold">User ID:</span> {selectedLog.userId}</div>
                  <div className="text-emerald-200 text-sm"><span className="text-emerald-400 font-semibold">Role:</span> {selectedLog.role}</div>
                </div>
              </div>

              <div className="bg-emerald-950/50 border-2 border-emerald-800 rounded-lg p-4">
                <h3 className="text-emerald-300 text-sm font-bold uppercase tracking-wide mb-3">Device & Location</h3>
                <div className="space-y-2">
                  <div className="text-emerald-100 text-sm"><span className="text-emerald-400 font-semibold">Device:</span> {selectedLog.device}</div>
                  <div className="text-emerald-200 text-sm"><span className="text-emerald-400 font-semibold">Device ID:</span> {selectedLog.deviceId}</div>
                  <div className="text-emerald-200 text-sm"><span className="text-emerald-400 font-semibold">Location:</span> {selectedLog.location}</div>
                  <div className="text-emerald-200 text-sm"><span className="text-emerald-400 font-semibold">IP Address:</span> {selectedLog.ipAddress}</div>
                </div>
              </div>

              <div className="bg-emerald-950/50 border-2 border-emerald-800 rounded-lg p-4">
                <h3 className="text-emerald-300 text-sm font-bold uppercase tracking-wide mb-3">Threat Analysis</h3>
                <div className="space-y-2">
                  <div className="text-emerald-100 text-sm"><span className="text-emerald-400 font-semibold">Event Type:</span> {selectedLog.eventType}</div>
                  <div className="text-emerald-200 text-sm"><span className="text-emerald-400 font-semibold">Attack Stage:</span> {selectedLog.attackStage}</div>
                  <div className="text-emerald-200 text-sm"><span className="text-emerald-400 font-semibold">Risk Score:</span> <span className={`font-bold ${getRiskColor(selectedLog.severity)}`}>{selectedLog.riskScore}/100</span></div>
                  <div className="text-emerald-200 text-sm"><span className="text-emerald-400 font-semibold">Behavioral Anomaly:</span> <span className="text-yellow-400 font-bold">{selectedLog.behavioralAnomaly}/100</span></div>
                </div>
              </div>

              <div className="bg-emerald-950/50 border-2 border-emerald-800 rounded-lg p-4">
                <h3 className="text-emerald-300 text-sm font-bold uppercase tracking-wide mb-2">Action Performed</h3>
                <div className="text-emerald-100 text-sm leading-relaxed">{selectedLog.action}</div>
              </div>

              <div className="bg-gradient-to-br from-blue-950 to-emerald-950 border-2 border-blue-800 rounded-lg p-4">
                <h3 className="text-blue-300 text-sm font-bold uppercase tracking-wide mb-2">AI Analysis & Explanation</h3>
                <div className="text-blue-100 text-sm leading-relaxed">{selectedLog.explanation}</div>
              </div>
            </div>

            <div className="mt-6 flex gap-3 pt-4 border-t border-emerald-800">
              <button className="border-2 border-emerald-700 text-emerald-300 rounded-lg px-6 py-3 hover:bg-emerald-900 transition-all duration-200 flex-1 font-semibold text-sm">
                Mark as False Positive
              </button>
              <button className="bg-gradient-to-r from-red-700 to-red-600 text-white rounded-lg px-6 py-3 hover:from-red-600 hover:to-red-500 transition-all duration-200 flex-1 font-bold text-sm shadow-lg">
                Escalate Threat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatXDashboard;