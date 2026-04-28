import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Link2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/DataTable";
import api from "@/services/api";

interface ImportHistoryItem {
  _id: string;
  sourceType: "csv" | "google_sheet";
  sourceName: string;
  sourceUrl?: string;
  dataType: "orders" | "inventory" | "shipments";
  headers: string[];
  rowCount: number;
  created_at: string;
}

interface ImportHistoryDetail extends ImportHistoryItem {
  rows: Record<string, string | number | null>[];
}

const toCsv = (rows: Record<string, string | number | null>[], headers: string[]) => {
  const escapeCell = (value: string | number | null | undefined) => {
    const text = `${value ?? ""}`;
    if (text.includes(",") || text.includes('"') || text.includes("\n")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(","))
  ].join("\n");
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const MyData = () => {
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selected, setSelected] = useState<ImportHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadHistory = async (preferredId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const items = await api.getImportHistory();
      const nextHistory = items || [];
      setHistory(nextHistory);

      if (!nextHistory.length) {
        setSelectedId("");
        return;
      }

      if (preferredId && nextHistory.some((item) => item._id === preferredId)) {
        setSelectedId(preferredId);
        return;
      }

      setSelectedId((current) => (current && nextHistory.some((item) => item._id === current) ? current : nextHistory[0]._id));
    } catch (err: any) {
      setError(err?.message || "Failed to load imported datasets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }

    const loadDetail = async () => {
      try {
        setDetailLoading(true);
        setError(null);
        const item = await api.getImportHistoryItem(selectedId);
        setSelected(item);
      } catch (err: any) {
        setError(err?.message || "Failed to load imported dataset.");
      } finally {
        setDetailLoading(false);
      }
    };

    loadDetail();
  }, [selectedId]);

  const columns = useMemo<Column<Record<string, string | number | null>>[]>(() => {
    const headers = selected?.headers || [];
    return headers.map((header) => ({
      key: header,
      header
    }));
  }, [selected]);

  const tableRows = useMemo(
    () => (selected?.rows || []).map((row, index) => ({ ...row, __rowKey: `${selected._id}-${index}` })),
    [selected]
  );

  const handleDownload = () => {
    if (!selected) return;
    const csvText = toCsv(selected.rows || [], selected.headers || []);
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = selected.sourceName?.endsWith(".csv") ? selected.sourceName : `${selected.sourceName || "dataset"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (item: ImportHistoryItem) => {
    const confirmed = window.confirm(`Remove "${item.sourceName}" from My Data?`);
    if (!confirmed) return;

    const currentIndex = history.findIndex((entry) => entry._id === item._id);
    const fallbackId =
      history[currentIndex + 1]?._id ||
      history[currentIndex - 1]?._id ||
      "";

    try {
      setDeletingId(item._id);
      setError(null);
      setMessage(null);
      await api.deleteImportHistoryItem(item._id);
      setMessage(`Removed "${item.sourceName}" from My Data.`);
      await loadHistory(fallbackId);
    } catch (err: any) {
      setError(err?.message || "Failed to remove imported dataset.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Data"
        title="My Data"
        description="Review every imported CSV or Google Sheet, inspect uploaded rows, and download the exact dataset again."
        actions={
          selected ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => handleDelete(selected)} disabled={deletingId === selected._id}>
                <Trash2 className="mr-2 h-4 w-4" />
                {deletingId === selected._id ? "Removing..." : "Remove"}
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          ) : null
        }
      />

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Imported datasets</h2>
            <span className="text-xs text-muted-foreground">{history.length} files</span>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading imported files...</p>
          ) : history.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No uploaded CSV or Google Sheet data found yet.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const active = selectedId === item._id;
                return (
                  <div
                    key={item._id}
                    className={`rounded-xl border p-4 transition-base ${
                      active ? "border-foreground/20 bg-muted" : "border-border bg-background"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(item._id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.sourceName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.sourceType === "google_sheet" ? "Google Sheet" : "CSV"} | {item.dataType} | {item.rowCount} rows
                          </p>
                        </div>
                        <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
                    </button>
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item._id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingId === item._id ? "Removing..." : "Remove"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          {!selectedId ? (
            <p className="text-sm text-muted-foreground">Select a dataset to inspect the uploaded rows.</p>
          ) : detailLoading ? (
            <p className="text-sm text-muted-foreground">Loading dataset...</p>
          ) : selected ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selected.sourceName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selected.dataType} import | {selected.rowCount} rows | {formatDate(selected.created_at)}
                  </p>
                  {selected.sourceUrl ? (
                    <a
                      href={selected.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Link2 className="h-4 w-4" />
                      Open source
                    </a>
                  ) : null}
                </div>
              </div>

              <DataTable
                columns={columns}
                data={tableRows}
                rowKey={(row) => String((row as any).__rowKey)}
                emptyMessage="This dataset has no rows."
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No dataset selected.</p>
          )}

          {message ? <div className="mt-4 text-sm text-green-600">{message}</div> : null}
          {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
        </section>
      </div>
    </div>
  );
};

export default MyData;
