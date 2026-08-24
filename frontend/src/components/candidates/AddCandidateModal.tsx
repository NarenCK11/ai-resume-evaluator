import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FileDropzone } from "../ui/FileDropzone";
import { getErrorMessage } from "../../api/client";

export function AddCandidateModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { full_name: string; email: string; phone: string; resume: File }) => Promise<void>;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName("");
      setEmail("");
      setPhone("");
      setFile(null);
      setError("");
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Candidate name is required");
      return;
    }
    if (!file) {
      setError("Please attach a resume");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ full_name: fullName.trim(), email: email.trim(), phone: phone.trim(), resume: file });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Candidate">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</div>}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">
            Full name <span className="text-danger-500">*</span>
          </label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Priya Nair"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="optional"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="optional"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">
            Resume <span className="text-danger-500">*</span>
          </label>
          <FileDropzone file={file} onChange={setFile} />
        </div>

        {submitting && (
          <p className="text-xs text-ink-400">
            Parsing resume and running AI evaluation — this can take a few seconds…
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Add & Evaluate
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const inputClass =
  "w-full rounded-lg border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30";
