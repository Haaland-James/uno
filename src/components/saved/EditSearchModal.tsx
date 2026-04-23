"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type {
  NotificationChannel,
  NotificationFrequency,
  SavedSearch,
} from "@/types";

interface EditSearchModalProps {
  open: boolean;
  search: SavedSearch | null;
  onClose: () => void;
  onUpdate: (patch: Partial<SavedSearch>) => void;
}

const channelOptions: { value: NotificationChannel; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "push", label: "Push Notifications" },
  { value: "whatsapp", label: "Whatsapp" },
];

const frequencyOptions: { value: NotificationFrequency; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "instant", label: "Instant" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

export function EditSearchModal({
  open,
  search,
  onClose,
  onUpdate,
}: EditSearchModalProps) {
  const [name, setName] = useState("");
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [frequency, setFrequency] = useState<NotificationFrequency>("never");
  const [isActive, setIsActive] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [channelOpen, setChannelOpen] = useState(false);
  const channelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (search) {
      setName(search.name);
      setChannels(search.notificationChannels);
      setFrequency(search.notificationFrequency);
      setIsActive(search.isActive);
      setNotificationsEnabled(search.notificationsEnabled);
    }
  }, [search]);

  useEffect(() => {
    if (!channelOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        channelRef.current &&
        !channelRef.current.contains(e.target as Node)
      ) {
        setChannelOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [channelOpen]);

  const toggleChannel = (value: NotificationChannel) => {
    setChannels((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const removeChannel = (value: NotificationChannel) => {
    setChannels((prev) => prev.filter((c) => c !== value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      name,
      notificationChannels: channels,
      notificationFrequency: frequency,
      isActive,
      notificationsEnabled,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-[480px]"
      ariaLabel="Edit saved search"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6 md:p-7">
        <h2 className="font-semibold text-[20px] text-[#161515]">
          Edit Your Saved Search
        </h2>

        <Field label="Name your saved search" htmlFor="search-name">
          <input
            id="search-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-[44px] px-3 rounded-[10px] border border-[rgba(0,0,0,0.15)] bg-white text-[14px] text-[#161515] focus:outline-none focus:border-[#af2525]"
            required
          />
        </Field>

        <Field label="Notification Channel">
          <div ref={channelRef} className="relative">
            <button
              type="button"
              onClick={() => setChannelOpen((o) => !o)}
              className="w-full min-h-[44px] flex items-center justify-between gap-2 px-3 py-2 rounded-[10px] border border-[rgba(0,0,0,0.15)] bg-white text-left focus:outline-none focus:border-[#af2525]"
              aria-haspopup="listbox"
              aria-expanded={channelOpen}
            >
              <div className="flex flex-wrap gap-1.5 flex-1">
                {channels.length === 0 && (
                  <span className="text-[14px] text-[rgba(10,10,10,0.5)]">
                    Select channels
                  </span>
                )}
                {channels.map((c) => {
                  const opt = channelOptions.find((o) => o.value === c);
                  return (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f0f0f0] text-[13px] text-[#161515]"
                    >
                      {opt?.label ?? c}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeChannel(c);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            removeChannel(c);
                          }
                        }}
                        aria-label={`Remove ${opt?.label ?? c}`}
                        className="cursor-pointer hover:text-[#af2525]"
                      >
                        <X size={12} />
                      </span>
                    </span>
                  );
                })}
              </div>
              <ChevronDown size={16} className="text-[rgba(10,10,10,0.5)]" />
            </button>

            {channelOpen && (
              <ul
                role="listbox"
                className="absolute z-10 mt-1 w-full bg-white border border-[rgba(0,0,0,0.15)] rounded-[10px] shadow-lg overflow-hidden"
              >
                {channelOptions.map((opt) => {
                  const selected = channels.includes(opt.value);
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={selected}
                      onClick={() => toggleChannel(opt.value)}
                      className="flex items-center gap-2 px-3 py-2 text-[14px] cursor-pointer hover:bg-[#fafafa]"
                    >
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-4 h-4 rounded-full border",
                          selected
                            ? "border-green-600 bg-green-600"
                            : "border-[rgba(0,0,0,0.3)]"
                        )}
                      >
                        {selected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <span className="text-[#161515]">{opt.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Field>

        <Field label="Notifications frequency" htmlFor="search-frequency">
          <select
            id="search-frequency"
            value={frequency}
            onChange={(e) =>
              setFrequency(e.target.value as NotificationFrequency)
            }
            className="w-full h-[44px] px-3 rounded-[10px] border border-[rgba(0,0,0,0.15)] bg-white text-[14px] text-[#161515] focus:outline-none focus:border-[#af2525]"
          >
            {frequencyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <div className="flex items-center gap-6">
            <Radio
              name="status"
              checked={isActive}
              onChange={() => setIsActive(true)}
              label="Active"
              dotClass="bg-green-600"
            />
            <Radio
              name="status"
              checked={!isActive}
              onChange={() => setIsActive(false)}
              label="Inactive"
            />
          </div>
        </Field>

        <Field label="Notification">
          <div className="flex items-center gap-6">
            <Radio
              name="notifications"
              checked={notificationsEnabled}
              onChange={() => setNotificationsEnabled(true)}
              label="On"
              dotClass="bg-green-600"
            />
            <Radio
              name="notifications"
              checked={!notificationsEnabled}
              onChange={() => setNotificationsEnabled(false)}
              label="Off"
            />
          </div>
        </Field>

        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-[14px] text-[rgba(10,10,10,0.78)] hover:text-[#161515] px-4 py-2"
          >
            Cancel
          </button>
          <Button type="submit">Update</Button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-medium text-[#161515]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Radio({
  name,
  checked,
  onChange,
  label,
  dotClass,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  dotClass?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-[14px] text-[#161515]">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={cn(
          "inline-flex items-center justify-center w-4 h-4 rounded-full border",
          checked
            ? dotClass
              ? `border-transparent ${dotClass}`
              : "border-[#161515] bg-[#161515]"
            : "border-[rgba(0,0,0,0.3)]"
        )}
      >
        {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      </span>
      {label}
    </label>
  );
}

export default EditSearchModal;
