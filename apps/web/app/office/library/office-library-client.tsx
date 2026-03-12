"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button, EmptyState, FilterBar, FilterField, SecondaryMetaList, SelectInput, TextInput, TextareaInput } from "@acre/ui";
import type { OfficeLibraryFolderNode, OfficeLibraryFolderOption, OfficeLibrarySnapshot } from "@acre/db";

type OfficeLibraryClientProps = {
  snapshot: OfficeLibrarySnapshot;
  canManageLibrary: boolean;
};

type FolderResponse = {
  folder: {
    id: string;
  };
};

type DocumentResponse = {
  document: {
    id: string;
    folderId: string | null;
  };
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function buildFolderLabel(option: OfficeLibraryFolderOption) {
  return `${"  ".repeat(option.depth)}${option.name}`;
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getFolderSelection(documentFolderId: string | null) {
  return documentFolderId ?? "unfiled";
}

export function OfficeLibraryClient({ snapshot, canManageLibrary }: OfficeLibraryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(
    Object.fromEntries(
      snapshot.folderOptions
        .filter((option) => snapshot.folderTree.some((node) => node.id === option.id || option.depth > 0))
        .map((option) => [option.id, true])
    )
  );
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isRoutingPending, startRoutingTransition] = useTransition();

  function buildLibraryUrl(updates: Record<string, string | null>) {
    const nextParams = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value && value.trim().length > 0) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    }

    const query = nextParams.toString();
    return query ? `/office/library?${query}` : "/office/library";
  }

  function navigate(updates: Record<string, string | null>) {
    startRoutingTransition(() => {
      router.replace(buildLibraryUrl(updates), { scroll: false });
    });
  }

  function refreshView(updates: Record<string, string | null>) {
    startRoutingTransition(() => {
      router.replace(buildLibraryUrl(updates), { scroll: false });
      router.refresh();
    });
  }

  function toggleFolder(folderId: string) {
    setExpandedFolders((current) => ({
      ...current,
      [folderId]: !current[folderId]
    }));
  }

  async function handleCreateFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("create-folder");
    setError("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/office/library/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? "").trim() || null,
          parentFolderId: String(formData.get("parentFolderId") ?? "").trim() || null,
          scope: String(formData.get("scope") ?? "company_wide")
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Folder creation failed.");
      }

      const payload = (await response.json()) as FolderResponse;
      setIsCreateFolderOpen(false);
      refreshView({
        folderId: payload.folder.id,
        documentId: null
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Folder creation failed.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRenameFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!snapshot.selectedFolder.id) {
      return;
    }

    setPendingAction("rename-folder");
    setError("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/office/library/folders/${snapshot.selectedFolder.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? "").trim() || null
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Folder update failed.");
      }

      refreshView({});
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Folder update failed.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("upload-document");
    setError("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/office/library/documents", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Document upload failed.");
      }

      const payload = (await response.json()) as DocumentResponse;
      setIsUploadOpen(false);
      refreshView({
        folderId: getFolderSelection(payload.document.folderId),
        documentId: payload.document.id
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Document upload failed.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSaveDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!snapshot.selectedDocument) {
      return;
    }

    setPendingAction("save-document");
    setError("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/office/library/documents/${snapshot.selectedDocument.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: String(formData.get("title") ?? ""),
          folderId: String(formData.get("folderId") ?? "").trim() || null,
          category: String(formData.get("category") ?? "").trim() || null,
          summary: String(formData.get("summary") ?? "").trim() || null,
          visibility: String(formData.get("visibility") ?? "company_wide"),
          tags: parseTags(String(formData.get("tags") ?? ""))
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Document update failed.");
      }

      const payload = (await response.json()) as DocumentResponse;
      refreshView({
        folderId: getFolderSelection(payload.document.folderId),
        documentId: payload.document.id
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Document update failed.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDeleteDocument() {
    if (!snapshot.selectedDocument) {
      return;
    }

    const shouldDelete = window.confirm(`Delete "${snapshot.selectedDocument.title}"? This removes the stored file.`);

    if (!shouldDelete) {
      return;
    }

    setPendingAction("delete-document");
    setError("");

    try {
      const response = await fetch(`/api/office/library/documents/${snapshot.selectedDocument.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Document delete failed.");
      }

      refreshView({
        documentId: null
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Document delete failed.");
    } finally {
      setPendingAction(null);
    }
  }

  function renderFolderNodes(nodes: OfficeLibraryFolderNode[]) {
    return nodes.map((node) => {
      const isExpanded = expandedFolders[node.id] ?? true;
      const isSelected = snapshot.filters.folderId === node.id;

      return (
        <div className="office-library-folder-node" key={node.id}>
          <div className={`office-library-folder-row${isSelected ? " is-selected" : ""}`}>
            {node.children.length ? (
              <button className="office-library-folder-toggle" onClick={() => toggleFolder(node.id)} type="button">
                {isExpanded ? "▾" : "▸"}
              </button>
            ) : (
              <span className="office-library-folder-toggle is-placeholder">•</span>
            )}
            <button
              className="office-library-folder-button"
              onClick={() =>
                navigate({
                  folderId: node.id,
                  documentId: null
                })
              }
              type="button"
            >
              <span className="office-library-folder-name">{node.name}</span>
              <span className="office-library-folder-count">{node.documentCount}</span>
            </button>
          </div>
          {node.children.length && isExpanded ? (
            <div className="office-library-folder-children">{renderFolderNodes(node.children)}</div>
          ) : null}
        </div>
      );
    });
  }

  const selectedDocument = snapshot.selectedDocument;
  const selectedFolderIsManaged = snapshot.selectedFolder.id !== null && snapshot.selectedFolder.key !== "all" && snapshot.selectedFolder.key !== "unfiled";

  return (
    <>
      <section className="bm-table-card office-library-toolbar-card">
        <div className="office-library-toolbar-top">
          <div className="office-library-stats">
            <span>{snapshot.summary.totalDocuments} files</span>
            <span>{snapshot.summary.totalFolders} folders</span>
            <span>{snapshot.summary.pdfDocuments} PDFs</span>
            <span>{snapshot.summary.unfiledDocuments} unfiled</span>
          </div>
          {canManageLibrary ? (
            <div className="office-library-action-row">
              <Button onClick={() => setIsUploadOpen(true)} variant="secondary">
                Upload file
              </Button>
              <Button onClick={() => setIsCreateFolderOpen(true)}>Add folder</Button>
            </div>
          ) : null}
        </div>

        <FilterBar as="form" className="office-library-filter-bar" method="get">
          <input name="folderId" type="hidden" value={snapshot.filters.folderId === "all" ? "" : snapshot.filters.folderId} />

          <FilterField className="office-library-search-field" label="Search">
            <TextInput defaultValue={snapshot.filters.q} name="q" placeholder="Search title or file name" />
          </FilterField>

          <FilterField className="office-library-filter-field" label="Scope">
            <SelectInput defaultValue={snapshot.filters.scope} name="scope">
              <option value="all">All scopes</option>
              <option value="company">Company-wide</option>
              <option value="office">Office only</option>
            </SelectInput>
          </FilterField>

          <FilterField className="office-library-filter-field" label="Category">
            <SelectInput defaultValue={snapshot.filters.category} name="category">
              <option value="">All categories</option>
              {snapshot.categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </SelectInput>
          </FilterField>

          <FilterField className="office-library-filter-field" label="Tag">
            <SelectInput defaultValue={snapshot.filters.tag} name="tag">
              <option value="">All tags</option>
              {snapshot.tagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </SelectInput>
          </FilterField>

          <div className="office-library-filter-actions">
            <Button type="submit" variant="secondary">
              Apply filters
            </Button>
            <Link className="bm-view-toggle" href="/office/library">
              Reset
            </Link>
          </div>
        </FilterBar>
      </section>

      {error ? <p className="bm-transaction-submit-error">{error}</p> : null}

      <section className="office-library-workspace">
        <aside className="bm-table-card office-library-panel office-library-panel-nav">
          <div className="office-library-panel-head">
            <div>
              <h3>Folders</h3>
              <span>Browse company and office-only folders.</span>
            </div>
          </div>

          <div className="office-library-folder-tree">
            <button
              className={`office-library-folder-button office-library-folder-button-root${snapshot.filters.folderId === "all" ? " is-selected" : ""}`}
              onClick={() =>
                navigate({
                  folderId: null,
                  documentId: null
                })
              }
              type="button"
            >
              <span>All files</span>
              <span>{snapshot.summary.totalDocuments}</span>
            </button>

            <button
              className={`office-library-folder-button office-library-folder-button-root${snapshot.filters.folderId === "unfiled" ? " is-selected" : ""}`}
              onClick={() =>
                navigate({
                  folderId: "unfiled",
                  documentId: null
                })
              }
              type="button"
            >
              <span>Unfiled documents</span>
              <span>{snapshot.summary.unfiledDocuments}</span>
            </button>

            {snapshot.folderTree.length ? (
              <div className="office-library-folder-branch">{renderFolderNodes(snapshot.folderTree)}</div>
            ) : (
              <EmptyState description="Create the first company folder to organize manuals and internal files." title="No folders yet" />
            )}
          </div>

          {canManageLibrary && selectedFolderIsManaged ? (
            <form className="office-library-side-form" key={snapshot.selectedFolder.id} onSubmit={handleRenameFolder}>
              <div className="office-library-side-form-head">
                <strong>Rename folder</strong>
                <span>{snapshot.selectedFolder.scopeLabel}</span>
              </div>
              <label className="office-form-field">
                <span>Folder name</span>
                <TextInput defaultValue={snapshot.selectedFolder.name} name="name" />
              </label>
              <label className="office-form-field">
                <span>Description</span>
                <TextareaInput defaultValue={snapshot.selectedFolder.description} name="description" rows={4} />
              </label>
              <div className="office-library-side-actions">
                <Button disabled={pendingAction === "rename-folder"} size="sm" type="submit">
                  {pendingAction === "rename-folder" ? "Saving..." : "Save folder"}
                </Button>
              </div>
            </form>
          ) : null}
        </aside>

        <section className="bm-table-card office-library-panel office-library-panel-list">
          <div className="office-library-panel-head">
            <div>
              <h3>{snapshot.selectedFolder.name}</h3>
              <span>
                {snapshot.selectedFolder.documentCount} file{snapshot.selectedFolder.documentCount === 1 ? "" : "s"} in this view
              </span>
            </div>
            <span>{snapshot.selectedFolder.scopeLabel}</span>
          </div>

          {snapshot.documents.length ? (
            <div className="office-library-document-list">
              <div className="office-library-document-list-head">
                <span>Document</span>
                <span>Folder</span>
                <span>Category</span>
                <span>Updated</span>
              </div>
              {snapshot.documents.map((document) => (
                <button
                  className={`office-library-document-row${selectedDocument?.id === document.id ? " is-selected" : ""}`}
                  key={document.id}
                  onClick={() =>
                    navigate({
                      documentId: document.id
                    })
                  }
                  type="button"
                >
                  <div className="office-library-document-main">
                    <strong>{document.title}</strong>
                    <p>
                      {document.originalFileName} · {document.isPdf ? "PDF" : document.mimeType} · {formatFileSize(document.fileSizeBytes)}
                    </p>
                  </div>
                  <span>{document.folderName || "Unfiled"}</span>
                  <span>{document.category || "General"}</span>
                  <span>{formatDateTime(document.updatedAt)}</span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              description="Adjust filters, upload a PDF, or select a different folder."
              title="No documents match this view"
            />
          )}
        </section>

        <aside className="bm-table-card office-library-panel office-library-panel-preview">
          {selectedDocument ? (
            <>
              <div className="office-library-panel-head">
                <div>
                  <h3>{selectedDocument.title}</h3>
                  <span>{selectedDocument.visibilityLabel}</span>
                </div>
                <div className="office-library-preview-actions">
                  <Link className="bm-view-toggle" href={selectedDocument.openUrl} target="_blank">
                    Open
                  </Link>
                  <Link className="bm-view-toggle" href={selectedDocument.downloadUrl} target="_blank">
                    Download
                  </Link>
                </div>
              </div>

              <div className="office-library-preview-frame-wrap">
                {selectedDocument.isPdf ? (
                  <iframe className="office-library-preview-frame" src={selectedDocument.previewUrl} title={selectedDocument.title} />
                ) : (
                  <EmptyState
                    description="Inline preview is currently PDF-first. Use Open or Download for this file type."
                    title="Preview unavailable"
                  />
                )}
              </div>

              <SecondaryMetaList
                className="office-library-meta-list"
                items={[
                  { label: "File", value: selectedDocument.originalFileName },
                  { label: "Folder", value: selectedDocument.folderName || "Unfiled" },
                  { label: "Category", value: selectedDocument.category || "General" },
                  { label: "Scope", value: selectedDocument.visibilityLabel },
                  { label: "Size", value: formatFileSize(selectedDocument.fileSizeBytes) },
                  { label: "Pages", value: selectedDocument.pageCount ? String(selectedDocument.pageCount) : "Not indexed" },
                  { label: "Uploaded by", value: selectedDocument.uploadedByName || "System" },
                  { label: "Updated", value: formatDateTime(selectedDocument.updatedAt) }
                ]}
              />

              {selectedDocument.tags.length ? (
                <div className="office-library-tag-list">
                  {selectedDocument.tags.map((tag) => (
                    <span className="office-badge office-badge-neutral" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {canManageLibrary ? (
                <form className="office-library-side-form" key={selectedDocument.id} onSubmit={handleSaveDocument}>
                  <div className="office-library-side-form-head">
                    <strong>Document details</strong>
                    <span>Rename, move, and update internal metadata.</span>
                  </div>

                  <label className="office-form-field">
                    <span>Title</span>
                    <TextInput defaultValue={selectedDocument.title} name="title" />
                  </label>

                  <label className="office-form-field">
                    <span>Folder</span>
                    <SelectInput defaultValue={selectedDocument.folderId ?? ""} name="folderId">
                      <option value="">Unfiled</option>
                      {snapshot.folderOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {buildFolderLabel(option)}
                        </option>
                      ))}
                    </SelectInput>
                  </label>

                  <label className="office-form-field">
                    <span>Category</span>
                    <TextInput defaultValue={selectedDocument.category} name="category" placeholder="Category label" />
                  </label>

                  <label className="office-form-field">
                    <span>Visibility</span>
                    <SelectInput defaultValue={selectedDocument.visibilityKey} name="visibility">
                      <option value="company_wide">Company-wide</option>
                      <option value="office_only">Office only</option>
                    </SelectInput>
                  </label>

                  <label className="office-form-field">
                    <span>Tags</span>
                    <TextInput defaultValue={selectedDocument.tags.join(", ")} name="tags" placeholder="Comma-separated tags" />
                  </label>

                  <label className="office-form-field">
                    <span>Summary</span>
                    <TextareaInput defaultValue={selectedDocument.summary} name="summary" rows={5} />
                  </label>

                  <div className="office-library-side-actions">
                    <Button disabled={pendingAction === "save-document"} size="sm" type="submit">
                      {pendingAction === "save-document" ? "Saving..." : "Save document"}
                    </Button>
                    <Button
                      disabled={pendingAction === "delete-document"}
                      onClick={handleDeleteDocument}
                      size="sm"
                      type="button"
                      variant="danger"
                    >
                      {pendingAction === "delete-document" ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </form>
              ) : null}
            </>
          ) : (
            <EmptyState
              description="Select a document to review details and load the inline PDF preview."
              title="No document selected"
            />
          )}
        </aside>
      </section>

      {canManageLibrary && isCreateFolderOpen ? (
        <div className="bm-modal-overlay" onClick={() => setIsCreateFolderOpen(false)}>
          <section className="bm-transaction-modal office-library-modal" onClick={(event) => event.stopPropagation()}>
            <header className="bm-transaction-modal-header">
              <div>
                <h3>Add folder</h3>
                <p>Create a company or office-only library folder.</p>
              </div>
              <button aria-label="Close add folder modal" onClick={() => setIsCreateFolderOpen(false)} type="button">
                ×
              </button>
            </header>

            <form className="bm-transaction-modal-body office-library-modal-body" onSubmit={handleCreateFolder}>
              <label className="office-form-field">
                <span>Folder name</span>
                <TextInput autoFocus name="name" placeholder="User Manual Documents" />
              </label>

              <label className="office-form-field">
                <span>Description</span>
                <TextareaInput name="description" rows={4} />
              </label>

              <label className="office-form-field">
                <span>Parent folder</span>
                <SelectInput defaultValue="" name="parentFolderId">
                  <option value="">Top-level folder</option>
                  {snapshot.folderOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {buildFolderLabel(option)}
                    </option>
                  ))}
                </SelectInput>
              </label>

              <label className="office-form-field">
                <span>Scope</span>
                <SelectInput defaultValue="company_wide" name="scope">
                  <option value="company_wide">Company-wide</option>
                  <option value="office_only">Office only</option>
                </SelectInput>
              </label>

              <footer className="bm-transaction-modal-footer">
                <span>Deletion is intentionally not included in this MVP.</span>
                <div className="bm-transaction-modal-actions">
                  <Button onClick={() => setIsCreateFolderOpen(false)} type="button" variant="secondary">
                    Cancel
                  </Button>
                  <Button disabled={pendingAction === "create-folder"} type="submit">
                    {pendingAction === "create-folder" ? "Creating..." : "Create folder"}
                  </Button>
                </div>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {canManageLibrary && isUploadOpen ? (
        <div className="bm-modal-overlay" onClick={() => setIsUploadOpen(false)}>
          <section className="bm-transaction-modal office-library-modal" onClick={(event) => event.stopPropagation()}>
            <header className="bm-transaction-modal-header">
              <div>
                <h3>Upload file</h3>
                <p>PDF-first library upload for company manuals, onboarding packets, and internal references.</p>
              </div>
              <button aria-label="Close upload modal" onClick={() => setIsUploadOpen(false)} type="button">
                ×
              </button>
            </header>

            <form className="bm-transaction-modal-body office-library-modal-body" onSubmit={handleUpload}>
              <label className="office-form-field">
                <span>File</span>
                <input accept=".pdf,.doc,.docx,.txt,.rtf,.xlsx,.xls,.csv,image/*" name="file" required type="file" />
              </label>

              <label className="office-form-field">
                <span>Title</span>
                <TextInput name="title" placeholder="Offer review playbook" />
              </label>

              <label className="office-form-field">
                <span>Folder</span>
                <SelectInput defaultValue={snapshot.selectedFolder.id ?? ""} name="folderId">
                  <option value="">Unfiled</option>
                  {snapshot.folderOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {buildFolderLabel(option)}
                    </option>
                  ))}
                </SelectInput>
              </label>

              <label className="office-form-field">
                <span>Category</span>
                <TextInput name="category" placeholder="Onboarding Documents" />
              </label>

              <label className="office-form-field">
                <span>Visibility</span>
                <SelectInput defaultValue="company_wide" name="visibility">
                  <option value="company_wide">Company-wide</option>
                  <option value="office_only">Office only</option>
                </SelectInput>
              </label>

              <label className="office-form-field">
                <span>Tags</span>
                <TextInput name="tags" placeholder="manual, pdf, training" />
              </label>

              <label className="office-form-field">
                <span>Summary</span>
                <TextareaInput name="summary" rows={4} />
              </label>

              <footer className="bm-transaction-modal-footer">
                <span>Inline preview is PDF-first. Other file types remain downloadable.</span>
                <div className="bm-transaction-modal-actions">
                  <Button onClick={() => setIsUploadOpen(false)} type="button" variant="secondary">
                    Cancel
                  </Button>
                  <Button disabled={pendingAction === "upload-document"} type="submit">
                    {pendingAction === "upload-document" ? "Uploading..." : "Upload file"}
                  </Button>
                </div>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {isRoutingPending ? <p className="office-form-helper">Refreshing library view...</p> : null}
    </>
  );
}
