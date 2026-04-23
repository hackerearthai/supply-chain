import { useMemo, useState } from "react";
import { syncGoogleSheet, mapAndStoreSheet } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DataType = "orders" | "inventory" | "shipments";
type Step = "input" | "mapping" | "complete";

const sheetGuide: Record<
  DataType,
  { requiredFields: string[]; optionalFields: string[]; example: string }
> = {
  orders: {
    requiredFields: ["quantity", "sku", "location", "pincode"],
    optionalFields: ["order_id", "warehouse", "date", "customer", "product"],
    example: "quantity | sku | location | pincode"
  },
  inventory: {
    requiredFields: ["sku", "quantity", "location"],
    optionalFields: ["warehouse", "date", "product", "minstock", "maxstock"],
    example: "sku | quantity | location"
  },
  shipments: {
    requiredFields: ["order_id", "sku", "from", "to", "status"],
    optionalFields: ["warehouse", "date", "tracking_number"],
    example: "order_id | sku | from | to | status"
  }
};

const headerAliases: Record<string, string[]> = {
  quantity: ["quantity", "qty", "ordered_qty", "order_quantity", "units"],
  sku: ["sku", "sku_code", "item_sku", "product_sku", "product_id"],
  location: ["location", "city", "destination", "delivery_location"],
  pincode: ["pincode", "pin", "pin_code", "postal_code", "zipcode", "zip_code"],
  warehouse: ["warehouse", "warehouse_name", "dc", "fulfillment_center"],
  date: ["date", "order_date", "created_at", "booking_date"],
  order_id: ["order_id", "order", "order_no", "order_number"],
  from: ["from", "source", "origin", "from_location"],
  to: ["to", "destination", "to_location"],
  status: ["status", "shipment_status", "order_status"],
  tracking_number: ["tracking_number", "tracking", "awb", "lr_number"],
  customer: ["customer", "customer_name", "buyer", "client"],
  product: ["product", "product_name", "item_name"],
  minstock: ["minstock", "min_stock", "minimum_stock", "reorder_level"],
  maxstock: ["maxstock", "max_stock", "maximum_stock"]
};

const normalize = (value: string) => value.toLowerCase().trim().replace(/\s+/g, "_");

function getSuggestedMapping(headers: string[], fields: string[]) {
  const used = new Set<string>();
  const mapping: Record<string, string> = {};

  fields.forEach((field) => {
    const aliases = headerAliases[field] || [field];
    const matchedHeader = headers.find((header) => {
      const normalizedHeader = normalize(header);
      return !used.has(header) && aliases.some((alias) => normalizedHeader === normalize(alias));
    });

    if (matchedHeader) {
      mapping[field] = matchedHeader;
      used.add(matchedHeader);
    }
  });

  return mapping;
}

export function GoogleSheetsIntegration() {
  const [step, setStep] = useState<Step>("input");
  const [sheetUrl, setSheetUrl] = useState("");
  const [dataType, setDataType] = useState<DataType>("orders");
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);

  const requiredFields = sheetGuide[dataType].requiredFields;
  const optionalFields = sheetGuide[dataType].optionalFields;
  const allFields = useMemo(() => [...requiredFields, ...optionalFields], [requiredFields, optionalFields]);
  const unmappedRequired = requiredFields.filter((field) => !mapping[field]);

  const resetState = () => {
    setStep("input");
    setHeaders([]);
    setMapping({});
    setRowCount(0);
    setError(null);
    setMessage(null);
  };

  const handleDataTypeChange = (value: DataType) => {
    setDataType(value);
    resetState();
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const result = await syncGoogleSheet(sheetUrl, dataType);
      const nextHeaders = result.headers || result.columns || [];

      setHeaders(nextHeaders);
      setRowCount(result.totalRows || 0);
      setMapping(getSuggestedMapping(nextHeaders, allFields));
      setMessage(result.message || null);
      setStep(result.needsMapping ? "mapping" : "mapping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview Google Sheet");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const result = await mapAndStoreSheet(sheetUrl, mapping, dataType);
      setMessage(result.message || "Google Sheet imported successfully");
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import Google Sheet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Import Google Sheet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === "input" && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Data Type</label>
                <select
                  value={dataType}
                  onChange={(e) => handleDataTypeChange(e.target.value as DataType)}
                  className="w-full rounded border bg-white p-2"
                >
                  <option value="orders">Orders</option>
                  <option value="inventory">Inventory</option>
                  <option value="shipments">Shipments</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Google Sheet URL</label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="w-full rounded border p-2"
                />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              Required columns: {requiredFields.join(", ")}
              <br />
              Optional columns: {optionalFields.join(", ")}
              <br />
              Example: {sheetGuide[dataType].example}
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <Button onClick={handlePreview} disabled={loading || !sheetUrl.trim()}>
              {loading ? "Reading sheet..." : "Preview Sheet"}
            </Button>
          </>
        )}

        {step === "mapping" && (
          <>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="font-medium">Sheet loaded</div>
              <div className="mt-1 text-muted-foreground">{rowCount} rows detected</div>
              {message && <div className="mt-2 text-amber-700">{message}</div>}
            </div>

            <div className="space-y-4">
              {requiredFields.map((field) => (
                <div key={field} className="grid gap-2 md:grid-cols-[180px_1fr] md:items-center">
                  <label className="text-sm font-medium">{field}</label>
                  <select
                    value={mapping[field] || ""}
                    onChange={(e) => setMapping((current) => ({ ...current, [field]: e.target.value }))}
                    className="w-full rounded border bg-white p-2 text-sm"
                  >
                    <option value="">Select sheet column</option>
                    {headers.map((header) => (
                      <option key={`${field}-${header}`} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-medium">Optional mappings</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {optionalFields.map((field) => (
                    <div key={field} className="grid gap-2">
                      <label className="text-sm">{field}</label>
                      <select
                        value={mapping[field] || ""}
                        onChange={(e) => setMapping((current) => ({ ...current, [field]: e.target.value }))}
                        className="w-full rounded border bg-white p-2 text-sm"
                      >
                        <option value="">Skip</option>
                        {headers.map((header) => (
                          <option key={`${field}-${header}`} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {unmappedRequired.length > 0 && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                Required fields still not mapped: {unmappedRequired.join(", ")}
              </div>
            )}

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex gap-3">
              <Button variant="outline" onClick={resetState}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={loading || unmappedRequired.length > 0}>
                {loading ? "Importing..." : "Import Sheet Data"}
              </Button>
            </div>
          </>
        )}

        {step === "complete" && (
          <div className="space-y-4 text-center">
            <p className="font-medium text-green-700">{message || "Google Sheet imported successfully"}</p>
            <Button
              onClick={() => {
                setSheetUrl("");
                resetState();
              }}
            >
              Import Another Sheet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
