import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  Package, Search, Plus, Edit, Trash2, LogOut, User, Shield, 
  CheckCircle, XCircle, AlertCircle, Camera, QrCode, X, Filter,
  RefreshCw, Wrench, Ticket, FileText, Calendar, Clock, BookOpen,
  ClipboardList, Send, Check, ChevronDown
} from 'lucide-react';

const TRACKING_STATUSES = ['decom', 'in repair', 'in use', 'loan', 'reserved'];

const RECLONE_STEPS = [
  { id: 1, title: 'Backup User Data', description: 'Ensure all user data is backed up before proceeding with reclone.' },
  { id: 2, title: 'Send Email to User', description: 'Notify the user that their device will undergo recloning process.' },
  { id: 3, title: 'Create SMC Helpdesk Ticket', description: 'Log a ticket in SMC Helpdesk for tracking purposes.' },
  { id: 4, title: 'Disconnect from Network', description: 'Remove device from corporate network and domain.' },
  { id: 5, title: 'Perform Reclone', description: 'Execute the recloning process using the standard imaging tool.' },
  { id: 6, title: 'Rejoin Domain', description: 'Rejoin the device to corporate domain after reclone.' },
  { id: 7, title: 'Install Required Software', description: 'Install all necessary software and applications.' },
  { id: 8, title: 'Restore User Data', description: 'Restore backed up user data to the device.' },
  { id: 9, title: 'User Verification', description: 'Have user verify that device is working correctly.' },
  { id: 10, title: 'Close Helpdesk Ticket', description: 'Update and close the SMC Helpdesk ticket.' },
];

const statusColors = {
  'decom': 'bg-gray-500',
  'in repair': 'bg-orange-500',
  'in use': 'bg-green-500',
  'loan': 'bg-blue-500',
  'reserved': 'bg-yellow-500'
};

// Login Component
const LoginScreen = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(username, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Asset Management</h1>
          <p className="text-gray-500">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password"
            />
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Demo Accounts:</p>
          <p>Admin: admin / admin123</p>
          <p>User: user / user123</p>
        </div>
      </div>
    </div>
  );
};

// Asset Form Modal
const AssetForm = ({ asset, onSave, onCancel, nextTag, loading }) => {
  const [form, setForm] = useState(asset || {
    tag: nextTag,
    serial_number: '',
    description: '',
    owner: '',
    hoto_number: '',
    location: '',
    bin: '',
    tracking_status: 'in use',
    repair_status: '',
    needs_reclone: false,
    available_for_loan: false
  });

  const handleStatusChange = (newStatus) => {
    if (newStatus !== 'in repair') {
      setForm({ ...form, tracking_status: newStatus, repair_status: '', needs_reclone: false });
    } else {
      setForm({ ...form, tracking_status: newStatus });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{asset ? 'Edit Asset' : 'Add New Asset'}</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tag *</label>
              <input
                type="text"
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="AST-XXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input
                type="text"
                value={form.serial_number}
                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <input
                type="text"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HOTO Number</label>
              <input
                type="text"
                value={form.hoto_number}
                onChange={(e) => setForm({ ...form, hoto_number: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bin Location</label>
              <input
                type="text"
                value={form.bin}
                onChange={(e) => setForm({ ...form, bin: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Status</label>
            <select
              value={form.tracking_status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {TRACKING_STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          {form.tracking_status === 'in repair' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-orange-800">
                <Wrench className="w-5 h-5" />
                <span className="font-medium">Repair Details</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repair Issue</label>
                <input
                  type="text"
                  value={form.repair_status}
                  onChange={(e) => setForm({ ...form, repair_status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe the issue..."
                />
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.needs_reclone}
                  onChange={(e) => setForm({ ...form, needs_reclone: e.target.checked })}
                  className="w-5 h-5 rounded text-orange-500"
                />
                <div>
                  <span className="font-medium text-gray-800">Needs Reclone</span>
                  <p className="text-xs text-gray-500">Enable if this asset requires system recloning</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
            <input
              type="checkbox"
              checked={form.available_for_loan}
              onChange={(e) => setForm({ ...form, available_for_loan: e.target.checked })}
              className="w-5 h-5 rounded text-blue-500"
            />
            <div>
              <span className="font-medium text-gray-800">Available for Loan</span>
              <p className="text-xs text-gray-500">Allow users to request this asset as a loan</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button 
            onClick={() => onSave(form)} 
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Asset'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Reclone Modal
const RecloneModal = ({ asset, progress, onUpdateStep, onClose, onComplete, ticketAssigned, loading }) => {
  const completedSteps = progress.filter(p => p.completed).length;
  const progressPercent = Math.round((completedSteps / RECLONE_STEPS.length) * 100);

  const getStepProgress = (stepId) => {
    return progress.find(p => p.step_id === stepId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Reclone Process</h2>
              <p className="text-orange-100 mt-1">{asset.tag} - {asset.description}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {ticketAssigned && (
            <div className="mt-3 bg-white/20 rounded-lg px-3 py-2 text-sm">
              <span className="font-medium">Ticket:</span> {ticketAssigned.po_number}
            </div>
          )}
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{completedSteps}/{RECLONE_STEPS.length} ({progressPercent}%)</span>
            </div>
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {RECLONE_STEPS.map((step, index) => {
              const stepProgress = getStepProgress(step.id);
              const isCompleted = stepProgress?.completed;
              const prevCompleted = index === 0 || getStepProgress(RECLONE_STEPS[index - 1].id)?.completed;
              const isNext = !isCompleted && prevCompleted;
              
              return (
                <div 
                  key={step.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isCompleted ? 'border-green-200 bg-green-50' : 
                    isNext ? 'border-orange-300 bg-orange-50' : 
                    'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' : 
                      isNext ? 'bg-orange-500 text-white' : 
                      'bg-gray-300 text-gray-500'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : step.id}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className={`font-semibold ${isCompleted ? 'text-green-800' : 'text-gray-800'}`}>
                        {step.title}
                      </h4>
                      <p className={`text-sm mt-1 ${isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                        {step.description}
                      </p>
                    </div>
                    
                    <div>
                      {isCompleted ? (
                        <button
                          onClick={() => onUpdateStep(step.id, false)}
                          disabled={loading}
                          className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                        >
                          Undo
                        </button>
                      ) : isNext ? (
                        <button
                          onClick={() => onUpdateStep(step.id, true)}
                          disabled={loading}
                          className="px-3 py-1.5 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Mark Done
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 text-xs bg-gray-100 text-gray-400 rounded-lg">Locked</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {completedSteps === RECLONE_STEPS.length ? (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> All steps completed!
              </span>
            ) : 'Complete all steps to finish'}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Close</button>
            {completedSteps === RECLONE_STEPS.length && (
              <button 
                onClick={onComplete}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Mark as Fixed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Loan Request Modal
const LoanRequestModal = ({ asset, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({
    reason: '',
    duration: '1 week',
    return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Send className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Request Loan</h2>
            <p className="text-sm text-gray-500">{asset.tag} - {asset.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Why do you need this asset?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <select
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="1 day">1 day</option>
                <option value="3 days">3 days</option>
                <option value="1 week">1 week</option>
                <option value="2 weeks">2 weeks</option>
                <option value="1 month">1 month</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
              <input
                type="date"
                value={form.return_date}
                onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button 
            onClick={() => onSubmit(form)}
            disabled={loading || !form.reason}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Loan Review Modal
const LoanReviewModal = ({ request, asset, onApprove, onReject, onCancel, loading }) => {
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Review Loan Request</h2>

        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
          <p><span className="font-medium">Asset:</span> {request.asset_tag} - {request.asset_description}</p>
          <p><span className="font-medium">Requested by:</span> {request.requested_by}</p>
          <p><span className="font-medium">Duration:</span> {request.duration}</p>
          <p><span className="font-medium">Return Date:</span> {new Date(request.return_date).toLocaleDateString()}</p>
          <p><span className="font-medium">Reason:</span> {request.reason}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            rows={2}
            placeholder="Add notes..."
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button 
            onClick={() => onReject(notes)}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Reject
          </button>
          <button 
            onClick={() => onApprove(notes)}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

// Ticket Purchase Modal
const TicketPurchaseModal = ({ onSave, onCancel, loading }) => {
  const [form, setForm] = useState({
    po_number: '',
    quantity: 10,
    purchase_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Purchase Reclone Tickets</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PO Number *</label>
            <input
              type="text"
              value={form.po_number}
              onChange={(e) => setForm({ ...form, po_number: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="PO-2024-XXX"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button 
            onClick={() => onSave(form)}
            disabled={loading || !form.po_number}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Ticket Assign Modal
const TicketAssignModal = ({ asset, tickets, onAssign, onCancel, loading }) => {
  const [selectedTicket, setSelectedTicket] = useState('');
  const [reason, setReason] = useState(asset?.repair_status || '');

  const availableTickets = tickets.filter(t => {
    const isExpired = new Date(t.expiry_date) < new Date();
    return !isExpired && t.remaining > 0;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-2">Assign Reclone Ticket</h2>
        <p className="text-gray-500 mb-4">Assign a ticket to {asset.tag} before starting reclone.</p>

        {availableTickets.length === 0 ? (
          <div className="text-center py-6 text-red-600">
            <AlertCircle className="w-10 h-10 mx-auto mb-2" />
            <p>No tickets available. Please purchase more tickets.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Ticket *</label>
              <select
                value={selectedTicket}
                onChange={(e) => setSelectedTicket(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">-- Select --</option>
                {availableTickets.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.po_number} ({t.remaining} remaining, expires {new Date(t.expiry_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Reclone</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          {availableTickets.length > 0 && (
            <button 
              onClick={() => onAssign(parseInt(selectedTicket), reason)}
              disabled={loading || !selectedTicket}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign & Start'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Scanner View Component with real QR scanning
const ScannerView = ({ assets }) => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanner = () => {
    setIsScanning(true);
    setScanResult(null);
    
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner("qr-reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      });

      scanner.render(
        (decodedText) => {
          // On success
          scanner.clear();
          setIsScanning(false);
          handleScanResult(decodedText);
        },
        (error) => {
          // On error (ignore, keep scanning)
        }
      );

      scannerRef.current = scanner;
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }
    setIsScanning(false);
  };

  const handleScanResult = (scannedText) => {
    // Try to find asset by tag or any field containing the scanned text
    const asset = assets.find(a => 
      a.tag.toLowerCase() === scannedText.toLowerCase() ||
      a.tag.toLowerCase().includes(scannedText.toLowerCase()) ||
      scannedText.toLowerCase().includes(a.tag.toLowerCase())
    );

    if (asset) {
      setScanResult({ found: true, asset });
    } else {
      setScanResult({ found: false, scannedText });
    }
  };

  const handleManualSearch = () => {
    if (manualInput.trim()) {
      handleScanResult(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <QrCode className="w-16 h-16 text-blue-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold">Audit Scanner</h2>
        <p className="text-gray-500">Scan QR codes or enter asset tags</p>
      </div>

      {/* QR Scanner */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
        {!isScanning ? (
          <div className="p-8 text-center">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <button
              onClick={startScanner}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <Camera className="w-5 h-5" />
              Start Camera Scan
            </button>
          </div>
        ) : (
          <div>
            <div id="qr-reader" className="w-full"></div>
            <div className="p-4 text-center">
              <button
                onClick={stopScanner}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Stop Scanner
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <p className="text-sm text-gray-500 mb-2 text-center">Or enter manually:</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Enter asset tag (e.g., AST-001)"
            className="flex-1 px-4 py-3 border rounded-lg text-center font-mono"
            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
          />
          <button
            onClick={handleManualSearch}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* Scan Result */}
      {scanResult && (
        <div className={`rounded-xl p-4 shadow-sm ${scanResult.found ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {scanResult.found ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="font-bold text-green-800">Asset Found!</span>
              </div>
              <div className="bg-white rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tag:</span>
                  <span className="font-mono font-bold text-blue-600">{scanResult.asset.tag}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Description:</span>
                  <span className="font-medium">{scanResult.asset.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Owner:</span>
                  <span>{scanResult.asset.owner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location:</span>
                  <span>{scanResult.asset.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs text-white ${statusColors[scanResult.asset.tracking_status]}`}>
                    {scanResult.asset.tracking_status}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-bold text-red-800">Asset Not Found</p>
                <p className="text-sm text-red-600">Scanned: {scanResult.scannedText}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setScanResult(null)}
            className="mt-4 w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700"
          >
            Scan Another
          </button>
        </div>
      )}
    </div>
  );
};

// Main App Component
export default function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  
  // Data state
  const [assets, setAssets] = useState([]);
  const [ticketPurchases, setTicketPurchases] = useState([]);
  const [ticketAssignments, setTicketAssignments] = useState([]);
  const [recloneProgress, setRecloneProgress] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);
  const [maintenanceContracts, setMaintenanceContracts] = useState([]);
  const [maintenanceAssignments, setMaintenanceAssignments] = useState([]);
  
  // UI state
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [showRecloneModal, setShowRecloneModal] = useState(null);
  const [showTicketPurchaseModal, setShowTicketPurchaseModal] = useState(false);
  const [showTicketAssignModal, setShowTicketAssignModal] = useState(null);
  const [showLoanRequestModal, setShowLoanRequestModal] = useState(null);
  const [showLoanReviewModal, setShowLoanReviewModal] = useState(null);

  // Login handler
  const handleLogin = async (username, password) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      setLoginError('Invalid username or password');
      return;
    }

    setUser(data);
    setLoginError('');
    localStorage.setItem('user', JSON.stringify(data));
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch all data when user logs in
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        assetsRes,
        ticketsRes,
        assignmentsRes,
        progressRes,
        loansRes,
        contractsRes,
        maintAssignRes
      ] = await Promise.all([
        supabase.from('assets').select('*').order('id'),
        supabase.from('ticket_purchases').select('*').order('id'),
        supabase.from('ticket_assignments').select('*').order('id'),
        supabase.from('reclone_progress').select('*'),
        supabase.from('loan_requests').select('*').order('id', { ascending: false }),
        supabase.from('maintenance_contracts').select('*').order('id'),
        supabase.from('maintenance_assignments').select('*').order('id')
      ]);

      setAssets(assetsRes.data || []);
      setTicketPurchases(ticketsRes.data || []);
      setTicketAssignments(assignmentsRes.data || []);
      setRecloneProgress(progressRes.data || []);
      setLoanRequests(loansRes.data || []);
      setMaintenanceContracts(contractsRes.data || []);
      setMaintenanceAssignments(maintAssignRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  };

  // Asset CRUD
  const handleSaveAsset = async (form) => {
    setActionLoading(true);
    try {
      if (editingAsset) {
        const { error } = await supabase
          .from('assets')
          .update({
            tag: form.tag,
            serial_number: form.serial_number,
            description: form.description,
            owner: form.owner,
            hoto_number: form.hoto_number,
            location: form.location,
            bin: form.bin,
            tracking_status: form.tracking_status,
            repair_status: form.repair_status,
            needs_reclone: form.needs_reclone,
            available_for_loan: form.available_for_loan,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAsset.id);

        if (!error) {
          await fetchAllData();
          setEditingAsset(null);
        }
      } else {
        const { error } = await supabase.from('assets').insert([{
          tag: form.tag,
          serial_number: form.serial_number,
          description: form.description,
          owner: form.owner,
          hoto_number: form.hoto_number,
          location: form.location,
          bin: form.bin,
          tracking_status: form.tracking_status,
          repair_status: form.repair_status,
          needs_reclone: form.needs_reclone,
          available_for_loan: form.available_for_loan
        }]);

        if (!error) {
          await fetchAllData();
          setShowAddModal(false);
        }
      }
    } catch (err) {
      console.error('Error saving asset:', err);
    }
    setActionLoading(false);
  };

  const handleDeleteAsset = async (id) => {
    if (!confirm('Delete this asset?')) return;
    setActionLoading(true);
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (!error) await fetchAllData();
    setActionLoading(false);
  };

  // Ticket Purchase
  const handleTicketPurchase = async (form) => {
    setActionLoading(true);
    const { error } = await supabase.from('ticket_purchases').insert([form]);
    if (!error) {
      await fetchAllData();
      setShowTicketPurchaseModal(false);
    }
    setActionLoading(false);
  };

  // Ticket Assignment
  const handleTicketAssign = async (purchaseId, reason) => {
    setActionLoading(true);
    const asset = showTicketAssignModal;
    const purchase = ticketPurchases.find(p => p.id === purchaseId);

    const { error } = await supabase.from('ticket_assignments').insert([{
      purchase_id: purchaseId,
      po_number: purchase.po_number,
      asset_id: asset.id,
      asset_tag: asset.tag,
      asset_description: asset.description,
      assigned_date: new Date().toISOString().split('T')[0],
      assigned_by: user.name,
      reason
    }]);

    if (!error) {
      await fetchAllData();
      setShowTicketAssignModal(null);
      setShowRecloneModal(asset);
    }
    setActionLoading(false);
  };

  // Reclone Progress
  const handleRecloneStepUpdate = async (stepId, completed) => {
    setActionLoading(true);
    const asset = showRecloneModal;
    
    if (completed) {
      await supabase.from('reclone_progress').upsert({
        asset_id: asset.id,
        step_id: stepId,
        completed: true,
        completed_at: new Date().toISOString()
      }, { onConflict: 'asset_id,step_id' });
    } else {
      await supabase.from('reclone_progress')
        .delete()
        .eq('asset_id', asset.id)
        .eq('step_id', stepId);
    }
    
    await fetchAllData();
    setActionLoading(false);
  };

  const handleRecloneComplete = async () => {
    setActionLoading(true);
    const asset = showRecloneModal;
    
    await supabase.from('assets')
      .update({ tracking_status: 'in use', repair_status: '', needs_reclone: false })
      .eq('id', asset.id);
    
    await supabase.from('reclone_progress').delete().eq('asset_id', asset.id);
    
    await fetchAllData();
    setShowRecloneModal(null);
    setActionLoading(false);
  };

  // Loan Requests
  const handleLoanRequest = async (form) => {
    setActionLoading(true);
    const asset = showLoanRequestModal;

    const { error } = await supabase.from('loan_requests').insert([{
      asset_id: asset.id,
      asset_tag: asset.tag,
      asset_description: asset.description,
      requested_by: user.name,
      request_date: new Date().toISOString().split('T')[0],
      reason: form.reason,
      duration: form.duration,
      return_date: form.return_date,
      status: 'pending'
    }]);

    if (!error) {
      await fetchAllData();
      setShowLoanRequestModal(null);
    }
    setActionLoading(false);
  };

  const handleLoanApprove = async (notes) => {
    setActionLoading(true);
    const request = showLoanReviewModal;

    await supabase.from('loan_requests')
      .update({
        status: 'approved',
        reviewed_by: user.name,
        review_date: new Date().toISOString().split('T')[0],
        review_notes: notes
      })
      .eq('id', request.id);

    await supabase.from('assets')
      .update({
        tracking_status: 'loan',
        loaned_to: request.requested_by,
        loan_return_date: request.return_date
      })
      .eq('id', request.asset_id);

    await fetchAllData();
    setShowLoanReviewModal(null);
    setActionLoading(false);
  };

  const handleLoanReject = async (notes) => {
    setActionLoading(true);
    const request = showLoanReviewModal;

    await supabase.from('loan_requests')
      .update({
        status: 'rejected',
        reviewed_by: user.name,
        review_date: new Date().toISOString().split('T')[0],
        review_notes: notes
      })
      .eq('id', request.id);

    await fetchAllData();
    setShowLoanReviewModal(null);
    setActionLoading(false);
  };

  // Toggle loan availability
  const handleToggleLoanable = async (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    await supabase.from('assets')
      .update({ available_for_loan: !asset.available_for_loan })
      .eq('id', assetId);
    await fetchAllData();
  };

  // Computed values
  const getNextTag = () => {
    const nums = assets.map(a => parseInt(a.tag.split('-')[1]) || 0);
    const next = Math.max(0, ...nums) + 1;
    return `AST-${String(next).padStart(3, '0')}`;
  };

  const availableTickets = ticketPurchases.map(t => {
    const used = ticketAssignments.filter(a => a.purchase_id === t.id).length;
    return { ...t, used, remaining: t.quantity - used };
  });

  const totalTickets = ticketPurchases.reduce((sum, t) => sum + t.quantity, 0);
  const usedTickets = ticketAssignments.length;
  const remainingTickets = totalTickets - usedTickets;

  const getPendingLoanRequest = (assetId) => {
    return loanRequests.find(r => r.asset_id === assetId && r.status === 'pending');
  };

  const getTicketForAsset = (assetId) => {
    return ticketAssignments.find(a => a.asset_id === assetId);
  };

  const getAssetRecloneProgress = (assetId) => {
    return recloneProgress.filter(p => p.asset_id === assetId);
  };

  const pendingLoanCount = loanRequests.filter(r => r.status === 'pending').length;

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !searchTerm || 
      asset.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.owner?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.tracking_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Render login if not authenticated
  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  // Render loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">Asset Manager</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              {user.role === 'admin' ? <Shield className="w-4 h-4 text-purple-600" /> : <User className="w-4 h-4 text-blue-600" />}
              <span className="text-sm font-medium">{user.name}</span>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg">
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex border-t overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Package },
            { id: 'tickets', label: 'Tickets', icon: Ticket },
            { id: 'requests', label: 'Requests', icon: ClipboardList, badge: pendingLoanCount },
            { id: 'scanner', label: 'Scanner', icon: QrCode }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                currentView === tab.id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Dashboard View */}
      {currentView === 'dashboard' && (
        <div className="p-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {TRACKING_STATUSES.map(status => (
              <div key={status} className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
                  <span className="text-sm text-gray-600 capitalize">{status}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{assets.filter(a => a.tracking_status === status).length}</p>
              </div>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search assets..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Status</option>
                {TRACKING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {user.role === 'admin' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              )}
            </div>
          </div>

          {/* Assets Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Tag</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Owner</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Location</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAssets.map(asset => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-semibold text-blue-600">{asset.tag}</td>
                      <td className="px-4 py-3">{asset.description}</td>
                      <td className="px-4 py-3 text-gray-600">{asset.owner}</td>
                      <td className="px-4 py-3 text-gray-600">{asset.location}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs text-white ${statusColors[asset.tracking_status]}`}>
                          {asset.tracking_status}
                        </span>
                        {asset.needs_reclone && (
                          <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                            Reclone
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {asset.tracking_status === 'in repair' && asset.needs_reclone && (
                            <button
                              onClick={() => {
                                const ticket = getTicketForAsset(asset.id);
                                if (ticket) {
                                  setShowRecloneModal(asset);
                                } else {
                                  setShowTicketAssignModal(asset);
                                }
                              }}
                              className="px-2 py-1 bg-orange-500 text-white rounded text-xs"
                            >
                              Reclone
                            </button>
                          )}
                          {user.role === 'admin' && (
                            <>
                              <button onClick={() => setEditingAsset(asset)} className="p-1 hover:bg-gray-100 rounded">
                                <Edit className="w-4 h-4 text-gray-600" />
                              </button>
                              <button onClick={() => handleDeleteAsset(asset.id)} className="p-1 hover:bg-gray-100 rounded">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredAssets.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No assets found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tickets View */}
      {currentView === 'tickets' && (
        <div className="p-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-3xl font-bold text-purple-600">{totalTickets}</p>
              <p className="text-sm text-gray-500">Total Tickets</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-3xl font-bold text-green-600">{remainingTickets}</p>
              <p className="text-sm text-gray-500">Available</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-3xl font-bold text-orange-600">{usedTickets}</p>
              <p className="text-sm text-gray-500">Used</p>
            </div>
          </div>

          {user.role === 'admin' && (
            <button
              onClick={() => setShowTicketPurchaseModal(true)}
              className="mb-4 px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Purchase Tickets
            </button>
          )}

          {/* Ticket Purchases */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="px-4 py-3 border-b bg-purple-50">
              <h3 className="font-semibold text-purple-800">Ticket Purchases</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">PO Number</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Qty</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Used</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Left</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Expiry</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {availableTickets.map(ticket => {
                  const isExpired = new Date(ticket.expiry_date) < new Date();
                  return (
                    <tr key={ticket.id} className={isExpired ? 'opacity-50' : ''}>
                      <td className="px-4 py-3 font-mono font-semibold text-purple-600">{ticket.po_number}</td>
                      <td className="px-4 py-3">{ticket.quantity}</td>
                      <td className="px-4 py-3">{ticket.used}</td>
                      <td className="px-4 py-3 font-semibold text-green-600">{ticket.remaining}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(ticket.expiry_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {isExpired ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Expired</span>
                        ) : ticket.remaining === 0 ? (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Depleted</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Assets Needing Reclone */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-orange-50">
              <h3 className="font-semibold text-orange-800">Assets Needing Reclone</h3>
            </div>
            <div className="divide-y">
              {assets.filter(a => a.needs_reclone && a.tracking_status === 'in repair').map(asset => {
                const ticket = getTicketForAsset(asset.id);
                const progress = getAssetRecloneProgress(asset.id);
                const completedSteps = progress.filter(p => p.completed).length;
                const progressPercent = Math.round((completedSteps / 10) * 100);

                return (
                  <div key={asset.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600">{asset.tag}</span>
                        <span className="text-gray-600">{asset.description}</span>
                      </div>
                      <p className="text-sm text-gray-500">{asset.repair_status}</p>
                      {ticket && (
                        <p className="text-sm text-purple-600">Ticket: {ticket.po_number} • Progress: {progressPercent}%</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (ticket) {
                          setShowRecloneModal(asset);
                        } else {
                          setShowTicketAssignModal(asset);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        ticket ? 'bg-green-600 text-white' : 'bg-purple-600 text-white'
                      }`}
                    >
                      {ticket ? `Continue (${progressPercent}%)` : 'Assign Ticket'}
                    </button>
                  </div>
                );
              })}
              {assets.filter(a => a.needs_reclone).length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                  <p>No assets need recloning</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Requests View */}
      {currentView === 'requests' && (
        <div className="p-4">
          {/* Admin: Manage Loanable Assets */}
          {user.role === 'admin' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="px-4 py-3 border-b bg-blue-50">
                <h3 className="font-semibold text-blue-800">Manage Loanable Assets</h3>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y">
                {assets.filter(a => a.tracking_status === 'in use' || a.available_for_loan).map(asset => (
                  <div key={asset.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-semibold text-blue-600">{asset.tag}</span>
                      <span className="ml-2 text-gray-600">{asset.description}</span>
                    </div>
                    <button
                      onClick={() => handleToggleLoanable(asset.id)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        asset.available_for_loan ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {asset.available_for_loan ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Requests (Admin) */}
          {user.role === 'admin' && loanRequests.filter(r => r.status === 'pending').length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="px-4 py-3 border-b bg-orange-50">
                <h3 className="font-semibold text-orange-800">Pending Approval</h3>
              </div>
              <div className="divide-y">
                {loanRequests.filter(r => r.status === 'pending').map(request => (
                  <div key={request.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600">{request.asset_tag}</span>
                        <span className="text-gray-600">{request.asset_description}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        By: {request.requested_by} • Duration: {request.duration}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowLoanReviewModal(request)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available for Loan */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="px-4 py-3 border-b bg-green-50">
              <h3 className="font-semibold text-green-800">Available for Loan</h3>
            </div>
            <div className="p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {assets.filter(a => a.available_for_loan && a.tracking_status !== 'loan').map(asset => {
                const pending = getPendingLoanRequest(asset.id);
                return (
                  <div key={asset.id} className="border rounded-xl p-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-mono font-bold text-blue-600">{asset.tag}</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        {asset.tracking_status}
                      </span>
                    </div>
                    <p className="font-medium">{asset.description}</p>
                    <p className="text-sm text-gray-500 mb-3">{asset.location}</p>
                    {pending ? (
                      <div className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Request Pending
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowLoanRequestModal(asset)}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" /> Request Loan
                      </button>
                    )}
                  </div>
                );
              })}
              {assets.filter(a => a.available_for_loan && a.tracking_status !== 'loan').length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No items available for loan</p>
                </div>
              )}
            </div>
          </div>

          {/* Request History */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800">Request History</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Asset</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Requested By</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loanRequests.map(request => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(request.request_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-blue-600">{request.asset_tag}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{request.requested_by}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        request.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scanner View */}
      {currentView === 'scanner' && (
        <ScannerView assets={assets} />
      )}

      {/* Modals */}
      {(showAddModal || editingAsset) && (
        <AssetForm
          asset={editingAsset}
          nextTag={getNextTag()}
          onSave={handleSaveAsset}
          onCancel={() => { setShowAddModal(false); setEditingAsset(null); }}
          loading={actionLoading}
        />
      )}

      {showRecloneModal && (
        <RecloneModal
          asset={showRecloneModal}
          progress={getAssetRecloneProgress(showRecloneModal.id)}
          ticketAssigned={getTicketForAsset(showRecloneModal.id)}
          onUpdateStep={handleRecloneStepUpdate}
          onComplete={handleRecloneComplete}
          onClose={() => setShowRecloneModal(null)}
          loading={actionLoading}
        />
      )}

      {showTicketPurchaseModal && (
        <TicketPurchaseModal
          onSave={handleTicketPurchase}
          onCancel={() => setShowTicketPurchaseModal(false)}
          loading={actionLoading}
        />
      )}

      {showTicketAssignModal && (
        <TicketAssignModal
          asset={showTicketAssignModal}
          tickets={availableTickets}
          onAssign={handleTicketAssign}
          onCancel={() => setShowTicketAssignModal(null)}
          loading={actionLoading}
        />
      )}

      {showLoanRequestModal && (
        <LoanRequestModal
          asset={showLoanRequestModal}
          onSubmit={handleLoanRequest}
          onCancel={() => setShowLoanRequestModal(null)}
          loading={actionLoading}
        />
      )}

      {showLoanReviewModal && (
        <LoanReviewModal
          request={showLoanReviewModal}
          onApprove={handleLoanApprove}
          onReject={handleLoanReject}
          onCancel={() => setShowLoanReviewModal(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
