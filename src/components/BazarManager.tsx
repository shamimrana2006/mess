'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, Calendar, User, Tag, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { toBanglaNumber, formatTaka, getTodayDateString, getBanglaMonthName } from '@/lib/utils';
import { BazarRecord, UserSession, MemberSummary } from '@/lib/types';

interface BazarManagerProps {
  currentUser: UserSession | null;
  allMembers: MemberSummary[];
  onBazarUpdated?: () => void;
}

export default function BazarManager({
  currentUser,
  allMembers,
  onBazarUpdated,
}: BazarManagerProps) {
  const [bazars, setBazars] = useState<BazarRecord[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [date, setDate] = useState<string>(getTodayDateString());
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [items, setItems] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isManager = currentUser?.role === 'MANAGER';

  useEffect(() => {
    if (currentUser?.id && !selectedUserId) {
      setSelectedUserId(currentUser.id);
    }
  }, [currentUser, selectedUserId]);

  const fetchBazars = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/bazar');
      const data = await res.json();
      if (data.bazars) {
        setBazars(data.bazars);
        setTotalAmount(data.totalBazarAmount || 0);
      }
    } catch (err) {
      console.error('Failed to load bazars', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBazars();
  }, []);

  const handleAddBazar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !items || !date) {
      setFormError('অনুগ্রহ করে তারিখ, টাকার পরিমাণ এবং পণ্যের তালিকা দিন');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const res = await fetch('/api/bazar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: selectedUserId,
          date,
          amount: Number(amount),
          items,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'বাজার যুক্ত করা যায়নি');
      }

      // Reset form
      setAmount('');
      setItems('');
      setNotes('');
      setShowAddModal(false);
      fetchBazars();
      if (onBazarUpdated) onBazarUpdated();
    } catch (err: any) {
      setFormError(err.message || 'সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBazar = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই বাজার হিসাবটি মুছে ফেলতে চান?')) return;

    try {
      const res = await fetch(`/api/bazar?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'মুছতে ব্যর্থ হয়েছে');
        return;
      }
      fetchBazars();
      if (onBazarUpdated) onBazarUpdated();
    } catch (err) {
      alert('মুছতে সমস্যা হয়েছে');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Total Bazar Card */}
      <div className="glass-card rounded-2xl p-4 border border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-slate-900/80 to-slate-900 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">মেস বাজার হিসাব</h2>
              <p className="text-xs text-slate-400">
                {isManager ? 'দৈনিক বাজার তালিকা (ম্যানেজার কন্ট্রোল)' : 'দৈনিক বাজার তালিকা'}
              </p>
            </div>
          </div>

          {isManager ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 active:scale-95"
            >
              <Plus className="w-4 h-4" /> বাজার যোগ
            </button>
          ) : (
            <span className="text-[11px] bg-slate-800/90 text-purple-300 font-semibold px-2.5 py-1 rounded-xl border border-slate-700/60">
              দেখার অনুমতি
            </span>
          )}
        </div>

        <div className="pt-2.5 border-t border-slate-800/80 flex items-baseline justify-between">
          <span className="text-xs text-slate-400 font-medium">চলতি মাসের মোট বাজার খরচ:</span>
          <strong className="text-2xl font-black text-purple-300 tracking-tight">
            {formatTaka(totalAmount)}
          </strong>
        </div>
      </div>

      {/* Bazar Entries List */}
      <div className="space-y-2.5">
        {bazars.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-slate-400 border border-slate-800">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2.5 text-slate-600 opacity-60" />
            <p className="text-xs font-medium">এখনো কোনো বাজার খরচ এন্ট্রি করা হয়নি।</p>
          </div>
        ) : (
          bazars.map((bazar) => {
            const canDelete = isManager;

            return (
              <div
                key={bazar.id}
                className="glass-card rounded-2xl p-3.5 border border-slate-800/80 bg-slate-900/75 relative shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Buyer & Date */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-bold text-emerald-300">
                        {bazar.user.name}
                      </span>
                      <span className="text-[11px] bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium border border-slate-700/50">
                        <Calendar className="w-3 h-3 text-slate-400" /> {bazar.date}
                      </span>
                    </div>

                    {/* Items */}
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      🛍️ {bazar.items}
                    </p>

                    {/* Notes */}
                    {bazar.notes && (
                      <p className="text-[11px] text-slate-400 mt-1 italic">
                        মন্তব্য: {bazar.notes}
                      </p>
                    )}
                  </div>

                  {/* Amount & Delete */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <span className="text-sm font-black text-purple-300 font-mono tracking-tight">
                      {formatTaka(bazar.amount)}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteBazar(bazar.id)}
                        className="w-7 h-7 rounded-lg bg-slate-800/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-all border border-slate-700/60 active:scale-90"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Bazar Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-5 border border-purple-500/30 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">নতুন বাজার খরচ যুক্ত করুন</h3>
                <p className="text-[11px] text-slate-400">বাজারের বিবরণ ও টাকার পরিমাণ দিন</p>
              </div>
            </div>

            <form onSubmit={handleAddBazar} className="space-y-3">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  তারিখ
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {/* Who Shopped (if Manager or multi-user) */}
              {allMembers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    কে বাজার করেছেন?
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.id === currentUser?.id ? '(আপনি)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  টাকার পরিমাণ (৳)
                </label>
                <input
                  type="number"
                  placeholder="যেমন: ১০০০"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                  min="1"
                />
              </div>

              {/* Items List */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  পণ্যের তালিকা
                </label>
                <textarea
                  placeholder="যেমন: মাছ, মুরগি, আলু, তেল, কাঁচামরিচ..."
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  অতিরিক্ত মন্তব্য (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: স্পেশাল বাজার"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {formError && (
                <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Actions */}
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
                  className="w-2/3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'যুক্ত হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
