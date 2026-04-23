"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface DeleteSearchModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteSearchModal({
  open,
  onClose,
  onConfirm,
}: DeleteSearchModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-[420px]"
      ariaLabel="Delete saved search confirmation"
    >
      <div className="flex flex-col items-center text-center px-6 pt-10 pb-8 gap-4">
        <h2 className="font-semibold text-[20px] text-[#161515]">
          Delete Search
        </h2>
        <p className="text-[14px] text-[rgba(10,10,10,0.78)] max-w-[280px]">
          Are you sure? You will no longer get updates when there are new
          matches.
        </p>
        <Button onClick={onConfirm} className="mt-2 w-full max-w-[240px]">
          Delete
        </Button>
      </div>
    </Modal>
  );
}

export default DeleteSearchModal;
