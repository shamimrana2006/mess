'use client';

import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Edit3, ShieldCheck, User, Phone, Wallet, AlertCircle, CheckCircle2, MessageCircle } from 'lucide-react';
import { toBanglaNumber, formatTaka, getWhatsAppLink } from '@/lib/utils';
import { UserSession, MemberSummary } from '@/lib/types';

interface MemberManagerProps {
  currentUser: UserSession | null;
  members: MemberSummary[];
  onRefresh: () => void;
}

export default function MemberManager({
  currentUser,
  members: propMembers,
  onRefresh,
}: MemberManagerProps) {
  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN';
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');

  // Add Member Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'MANAGER' | 'ADMIN'>('MEMBER');
  const [deposit, setDeposit] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Deposit Modal
  const [editMember, setEditMember] = useState<MemberSummary | null>(null);
  const [newDeposit, setNewDeposit] = useState('');
  const [isUpdatingDeposit, setIsUpdatingDeposit] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch full user list for manager (including pending approvals)
  const fetchAllUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const res = await fetch('/api/members');
      const data = await res.json();
      if (data.members) {
        setAllUsers(data.members);
      }
    } catch (err) {
      console.error('Failed to load members', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  React.useEffect(() => {
    fetchAllUsers();
  }, []);

  const pendingMembers = allUsers.filter((u) => u.status === 'PENDING');
  const approvedMembers = allUsers.length > 0 ? allUsers.filter((u) => u.status !== 'PENDING') : propMembers;

  const handleApproveMember = async (id: string, memberName: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'APPROVED',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'অনুমোদন ব্যর্থ হয়েছে');

      alert(`✅ "${memberName}" কে সফলভাবে মেসের সদস্য হিসেবে অনুমোদন দেওয়া হয়েছে!`);
      fetchAllUsers();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'অনুমোদন করতে সমস্যা হয়েছে');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleChangeRole = async (id: string, memberName: string, newRole: 'MEMBER' | 'MANAGER' | 'ADMIN') => {
    const roleBangla = newRole === 'ADMIN' ? 'সুপার এডমিন' : newRole === 'MANAGER' ? 'ম্যানেজার' : 'সাধারণ মেম্বার';
    if (!confirm(`আপনি কি "${memberName}" কে ${roleBangla} বানাতে চান?`)) {
      return;
    }

    try {
      setActionLoadingId(id);
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'রোল পরিবর্তন ব্যর্থ হয়েছে');

      alert(data.message || `সফলভাবে ${roleBangla} বানানো হয়েছে!`);
      fetchAllUsers();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'সমস্যা হয়েছে');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setFormError('অনুগ্রহ করে নাম, ইমেইল এবং পাসওয়ার্ড পূরণ করুন');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          role,
          status: 'APPROVED',
          deposit: Number(deposit) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'মেম্বার যুক্ত করা যায়নি');
      }

      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setDeposit('0');
      setShowAddModal(false);
      fetchAllUsers();
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;

    try {
      setIsUpdatingDeposit(true);
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editMember.id,
          deposit: Number(newDeposit),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'জমা আপডেট করা যায়নি');
        return;
      }

      setEditMember(null);
      fetchAllUsers();
      onRefresh();
    } catch (err) {
      alert('সমস্যা হয়েছে');
    } finally {
      setIsUpdatingDeposit(false);
    }
  };

  const handleDeleteMember = async (id: string, memberName: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে "${memberName}" কে মুছে ফেলতে চান?`)) {
      return;
    }

    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/members?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'মুছতে ব্যর্থ হয়েছে');
        return;
      }
      fetchAllUsers();
      onRefresh();
    } catch (err) {
      alert('মেম্বার ডিলিট করতে সমস্যা হয়েছে');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card rounded-2xl p-4 border border-blue-500/30 bg-gradient-to-br from-blue-950/30 via-slate-900/80 to-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">মেম্বার ব্যবস্থাপনা</h2>
              <p className="text-[11px] text-slate-400">
                সক্রিয় সদস্য: <strong className="text-blue-300">{toBanglaNumber(approvedMembers.length)}</strong> জন
                {pendingMembers.length > 0 && isManager && (
                  <span className="ml-1 text-amber-400 font-bold">
                    • রিকোয়েস্ট: {toBanglaNumber(pendingMembers.length)} জন
                  </span>
                )}
              </p>
            </div>
          </div>

          {isManager && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30 active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" /> নতুন মেম্বার
            </button>
          )}
        </div>

        {/* Manager Tabs: Approved vs Pending */}
        {isManager && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('approved')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'approved'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              সক্রিয় মেম্বার ({toBanglaNumber(approvedMembers.length)})
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-black'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>অনুমোদনের অপেক্ষায়</span>
              {pendingMembers.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center animate-pulse">
                  {toBanglaNumber(pendingMembers.length)}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* PENDING APPROVAL TAB CONTENT */}
      {isManager && activeTab === 'pending' && (
        <div className="space-y-3">
          {pendingMembers.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center border border-slate-800 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p>কোনো নতুন মেম্বার অনুমোদনের অপেক্ষায় নেই।</p>
            </div>
          ) : (
            pendingMembers.map((pending) => (
              <div
                key={pending.id}
                className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900/90 to-slate-900 space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-base flex items-center justify-center border border-amber-500/30">
                      {pending.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {pending.name}
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                          অপেক্ষমাণ
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">{pending.email}</p>
                      {pending.phone && (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-slate-300 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-emerald-400" /> {pending.phone}
                          </p>
                          <a
                            href={getWhatsAppLink(pending.phone) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-sm active:scale-95 transition-all"
                            title="হোয়াটসঅ্যাপে মেসেজ করুন"
                          >
                            <MessageCircle className="w-2.5 h-2.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    disabled={actionLoadingId === pending.id}
                    onClick={() => handleApproveMember(pending.id, pending.name)}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{actionLoadingId === pending.id ? 'অনুমোদন হচ্ছে...' : 'অনুমোদন দিন'}</span>
                  </button>

                  <button
                    disabled={actionLoadingId === pending.id}
                    onClick={() => handleDeleteMember(pending.id, pending.name)}
                    className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>বাতিল</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* APPROVED ACTIVE MEMBERS TAB CONTENT */}
      {(!isManager || activeTab === 'approved') && (
        <div className="space-y-2.5">
          {approvedMembers.map((member) => {
            const isCurrentUser = currentUser?.id === member.id;

            return (
              <div
                key={member.id}
                className="glass-card rounded-2xl p-3.5 border border-slate-800 bg-slate-900/70"
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Avatar & Details */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                        member.role === 'ADMIN'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : member.role === 'MANAGER'
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-100">
                          {member.name}
                        </h4>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                            member.role === 'ADMIN'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : member.role === 'MANAGER'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {member.role === 'ADMIN' ? '⚡ সুপার এডমিন' : member.role === 'MANAGER' ? '👑 ম্যানেজার' : '👤 মেম্বার'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mt-0.5">{member.email}</p>
                      
                      {/* Phone Number Display */}
                      {member.phone ? (
                        <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-emerald-300">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{member.phone}</span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-1 italic">ফোন নম্বর দেওয়া নেই</p>
                      )}

                      {/* Direct WhatsApp & Call Buttons */}
                      {member.phone && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <a
                            href={getWhatsAppLink(member.phone) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
                            title="হোয়াটসঅ্যাপে মেসেজ করুন"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>

                          <a
                            href={`tel:${member.phone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold active:scale-95 transition-all"
                            title="সরাসরি ফোন করুন"
                          >
                            <Phone className="w-2.5 h-2.5 text-emerald-400" />
                            <span>কল</span>
                          </a>
                        </div>
                      )}

                      {/* Deposit & Role Promotion Controls */}
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400">
                          জমা: <strong className="text-emerald-400 font-bold">{formatTaka(member.deposit)}</strong>
                        </span>
                        
                        {isManager && (
                          <button
                            onClick={() => {
                              setEditMember(member);
                              setNewDeposit(member.deposit.toString());
                            }}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all"
                          >
                            <Edit3 className="w-2.5 h-2.5" /> টাকা আপডেট
                          </button>
                        )}

                        {/* Manager Promotion & Demotion Buttons */}
                        {isManager && member.role === 'MEMBER' && (
                          <button
                            disabled={actionLoadingId === member.id}
                            onClick={() => handleChangeRole(member.id, member.name, 'MANAGER')}
                            className="text-[10px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                            title="মেম্বারকে ম্যানেজার বানান"
                          >
                            <ShieldCheck className="w-2.5 h-2.5 text-amber-400" /> ম্যানেজার বানান
                          </button>
                        )}

                        {isManager && member.role === 'MANAGER' && !isCurrentUser && (
                          <button
                            disabled={actionLoadingId === member.id}
                            onClick={() => handleChangeRole(member.id, member.name, 'MEMBER')}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                            title="ম্যানেজার পদ থেকে সাধারণ মেম্বার করুন"
                          >
                            <User className="w-2.5 h-2.5 text-slate-400" /> মেম্বার করুন
                          </button>
                        )}

                        {isAdmin && member.role !== 'ADMIN' && (
                          <button
                            disabled={actionLoadingId === member.id}
                            onClick={() => handleChangeRole(member.id, member.name, 'ADMIN')}
                            className="text-[10px] bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                            title="এডমিন বানান"
                          >
                            <ShieldCheck className="w-2.5 h-2.5 text-purple-400" /> এডমিন বানান
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Manager Delete Button */}
                  {isManager && !isCurrentUser && (
                    <button
                      onClick={() => handleDeleteMember(member.id, member.name)}
                      className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all shrink-0"
                      title="মেম্বার ডিলিট করুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-5 border border-blue-500/30 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">নতুন মেম্বার যুক্ত করুন</h3>
                <p className="text-[11px] text-slate-400">মেম্বারের লগইন তথ্য দিন</p>
              </div>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  পুরো নাম
                </label>
                <input
                  type="text"
                  placeholder="যেমন: সাকিব হাসান"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ইমেইল (লগইন এর জন্য)
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ফোন নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="017xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    প্রাথমিক জমা (৳)
                  </label>
                  <input
                    type="number"
                    placeholder="০"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  রোল নির্বাচন
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'MEMBER' | 'MANAGER' | 'ADMIN')}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="MEMBER">মেম্বার (সাধারণ সদস্য)</option>
                  <option value="MANAGER">ম্যানেজার (মেস ম্যানেজার)</option>
                  {isAdmin && <option value="ADMIN">সুপার এডমিন (ফুল কন্ট্রোল ও রিসেট ক্ষমতা)</option>}
                </select>
              </div>

              {formError && (
                <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'যুক্ত হচ্ছে...' : 'মেম্বার তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Deposit Modal */}
      {editMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-5 border border-emerald-500/30 shadow-2xl relative">
            <button
              onClick={() => setEditMember(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">জমা টাকা আপডেট</h3>
                <p className="text-[11px] text-slate-400">{editMember.name}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateDeposit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  মোট জমা টাকা (৳)
                </label>
                <input
                  type="number"
                  value={newDeposit}
                  onChange={(e) => setNewDeposit(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditMember(null)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingDeposit}
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  {isUpdatingDeposit ? 'আপডেট হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
