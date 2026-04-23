"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookmarkCheck } from "lucide-react";
import { SavedCard } from "@/components/property/SavedCard";
import { Button } from "@/components/ui/Button";
import { DeleteSearchModal } from "@/components/saved/DeleteSearchModal";
import { EditSearchModal } from "@/components/saved/EditSearchModal";
import { SavedSearchPagination } from "@/components/saved/SavedSearchPagination";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import type { SavedSearch } from "@/types";

const PAGE_SIZE = 4;

type ModalState =
  | { type: "edit"; id: string }
  | { type: "delete"; id: string }
  | { type: null };

export default function SavedSearchesPage() {
  const { savedSearches, deleteSearch, updateSearch } = useSavedSearches();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ type: null });

  const totalPages = Math.max(1, Math.ceil(savedSearches.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () =>
      savedSearches.slice(
        (safePage - 1) * PAGE_SIZE,
        safePage * PAGE_SIZE
      ),
    [savedSearches, safePage]
  );

  const activeSearch: SavedSearch | null =
    modal.type === "edit" || modal.type === "delete"
      ? savedSearches.find((s) => s.id === modal.id) ?? null
      : null;

  const closeModal = () => setModal({ type: null });

  const handleDeleteConfirm = () => {
    if (modal.type === "delete") {
      deleteSearch(modal.id);
      closeModal();
    }
  };

  const handleUpdate = (patch: Partial<SavedSearch>) => {
    if (modal.type === "edit") {
      updateSearch(modal.id, patch);
      closeModal();
    }
  };

  if (savedSearches.length === 0) {
    return (
      <div className="page-container py-4 md:py-6 flex flex-col min-h-[60vh]">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4">
          <h2 className="font-semibold text-[20px] md:text-[24px] text-[#161515]">
            Get updates on your saved searches
          </h2>
          <p className="text-[14px] text-[rgba(10,10,10,0.78)] max-w-[320px]">
            Saving your searches saves you time and we&apos;ll let you know
            whenever a match comes on the market.
          </p>
          <Button asChild className="mt-2">
            <Link href="/find">Search for Homes</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-4 md:py-6">
      <Header />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {pageItems.map((s) => (
          <SavedCard
            key={s.id}
            id={s.id}
            name={s.name}
            searchType={s.searchType}
            isActive={s.isActive}
            notificationsOn={s.notificationsEnabled}
            onEdit={(id) => setModal({ type: "edit", id })}
            onDelete={(id) => setModal({ type: "delete", id })}
          />
        ))}
      </div>

      <SavedSearchPagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <DeleteSearchModal
        open={modal.type === "delete"}
        onClose={closeModal}
        onConfirm={handleDeleteConfirm}
      />
      <EditSearchModal
        open={modal.type === "edit"}
        search={activeSearch}
        onClose={closeModal}
        onUpdate={handleUpdate}
      />
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#af2525] text-white">
        <BookmarkCheck size={16} />
      </span>
      <h1 className="font-semibold text-[22px] md:text-[26px] text-[#161515]">
        Saved Searches
      </h1>
    </div>
  );
}
