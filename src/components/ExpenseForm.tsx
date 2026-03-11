'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Expense, CATEGORIES, Category, CATEGORY_ICONS } from '@/types/expense';
import { getToday } from '@/lib/utils';

interface FormData {
  date: string;
  amount: string;
  category: Category;
  description: string;
}

interface ExpenseFormProps {
  onSubmit: (data: Omit<Expense, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Expense;
  isEdit?: boolean;
}

const EMPTY_FORM: FormData = {
  date: getToday(),
  amount: '',
  category: 'Food',
  description: '',
};

export default function ExpenseForm({
  onSubmit,
  onCancel,
  initialData,
  isEdit = false,
}: ExpenseFormProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        date: initialData.date,
        amount: initialData.amount.toString(),
        category: initialData.category,
        description: initialData.description,
      });
    } else {
      setForm({ ...EMPTY_FORM, date: getToday() });
    }
    setErrors({});
  }, [initialData]);

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};

    if (!form.date) {
      errs.date = 'Date is required';
    } else if (form.date > getToday()) {
      errs.date = 'Date cannot be in the future';
    }

    const amt = parseFloat(form.amount);
    if (!form.amount.trim()) {
      errs.amount = 'Amount is required';
    } else if (isNaN(amt) || amt <= 0) {
      errs.amount = 'Amount must be a positive number';
    } else if (amt > 999999) {
      errs.amount = 'Amount seems too large';
    }

    if (!form.description.trim()) {
      errs.description = 'Description is required';
    } else if (form.description.trim().length < 2) {
      errs.description = 'Description must be at least 2 characters';
    } else if (form.description.length > 200) {
      errs.description = 'Description must be 200 characters or fewer';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate brief async to show feedback
    setTimeout(() => {
      onSubmit({
        date: form.date,
        amount: parseFloat(parseFloat(form.amount).toFixed(2)),
        category: form.category,
        description: form.description.trim(),
      });
      setIsSubmitting(false);
    }, 150);
  }

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Date + Amount row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.date}
            max={getToday()}
            onChange={(e) => update('date', e.target.value)}
            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
              errors.date ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'
            }`}
          />
          {errors.date && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.date}
            </p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Amount (USD) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className={`w-full border rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                errors.amount ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'
              }`}
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.amount}
            </p>
          )}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => update('category', cat)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                form.category === cat
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <span className="text-base leading-none">{CATEGORY_ICONS[cat]}</span>
              <span className="truncate">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="What did you spend on?"
          rows={2}
          maxLength={200}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none ${
            errors.description ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'
          }`}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.description ? (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.description}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-slate-400">{form.description.length}/200</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : isEdit ? (
            'Save Changes'
          ) : (
            'Add Expense'
          )}
        </button>
      </div>
    </form>
  );
}
