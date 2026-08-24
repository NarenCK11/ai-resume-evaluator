import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { TagInput } from "../ui/TagInput";
import { getErrorMessage } from "../../api/client";
import type { EducationLevel, JobOpening } from "../../types";
import type { JobOpeningInput } from "../../api/jobs";

const EDUCATION_OPTIONS: { value: EducationLevel; label: string }[] = [
  { value: "none", label: "No requirement" },
  { value: "high_school", label: "High School" },
  { value: "associate", label: "Associate Degree" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate" },
];

const EMPTY_FORM: JobOpeningInput = {
  title: "",
  department: "",
  description: "",
  required_skills: [],
  preferred_skills: [],
  min_experience_years: 0,
  max_experience_years: null,
  education_requirement: "none",
  location: "",
  employment_type: "Full-time",
  other_details: "",
};

export function JobFormModal({
  open,
  onClose,
  onSubmit,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: JobOpeningInput) => Promise<void>;
  initial?: JobOpening | null;
}) {
  const [form, setForm] = useState<JobOpeningInput>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              title: initial.title,
              department: initial.department,
              description: initial.description,
              required_skills: initial.required_skills,
              preferred_skills: initial.preferred_skills,
              min_experience_years: initial.min_experience_years,
              max_experience_years: initial.max_experience_years,
              education_requirement: initial.education_requirement,
              location: initial.location,
              employment_type: initial.employment_type,
              other_details: initial.other_details,
            }
          : EMPTY_FORM,
      );
      setError("");
    }
  }, [open, initial]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Job title is required");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Job Opening" : "New Job Opening"} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Job title" required>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              placeholder="e.g. Senior Backend Engineer"
            />
          </Field>
          <Field label="Department">
            <input
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className={inputClass}
              placeholder="e.g. Engineering"
            />
          </Field>
        </div>

        <Field label="Job description">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={`${inputClass} min-h-[100px] resize-y`}
            placeholder="Summarize the role, responsibilities, and team..."
          />
        </Field>

        <Field label="Required skills">
          <TagInput
            value={form.required_skills}
            onChange={(v) => setForm({ ...form, required_skills: v })}
            placeholder="Type a skill and press Enter"
          />
        </Field>

        <Field label="Preferred skills">
          <TagInput
            value={form.preferred_skills}
            onChange={(v) => setForm({ ...form, preferred_skills: v })}
            placeholder="Type a skill and press Enter"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Min. experience (yrs)">
            <input
              type="number"
              min={0}
              step={0.5}
              value={form.min_experience_years}
              onChange={(e) => setForm({ ...form, min_experience_years: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Max. experience (yrs)">
            <input
              type="number"
              min={0}
              step={0.5}
              value={form.max_experience_years ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  max_experience_years: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className={inputClass}
              placeholder="Optional"
            />
          </Field>
          <Field label="Education requirement">
            <select
              value={form.education_requirement}
              onChange={(e) => setForm({ ...form, education_requirement: e.target.value as EducationLevel })}
              className={inputClass}
            >
              {EDUCATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Location">
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputClass}
              placeholder="e.g. Remote, Bangalore"
            />
          </Field>
          <Field label="Employment type">
            <input
              value={form.employment_type}
              onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
              className={inputClass}
              placeholder="e.g. Full-time"
            />
          </Field>
        </div>

        <Field label="Other details">
          <textarea
            value={form.other_details}
            onChange={(e) => setForm({ ...form, other_details: e.target.value })}
            className={`${inputClass} min-h-[70px] resize-y`}
            placeholder="Benefits, team culture, anything else relevant..."
          />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {initial ? "Save changes" : "Create Job Opening"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const inputClass =
  "w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-700">
        {label} {required && <span className="text-danger-500">*</span>}
      </label>
      {children}
    </div>
  );
}
