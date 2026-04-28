import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/services/api";

type DataType = "orders" | "inventory" | "shipments";
type Step = "upload" | "mapping" | "complete";

const resolveBaseUrl = () => {
  const configuredBase =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    "http://localhost:5000";

  return configuredBase.endsWith("/api")
    ? configuredBase.slice(0, -4)
    : configuredBase;
};

const API_BASE_URL = resolveBaseUrl();

const csvGuide: Record<DataType, { required: string; optional: string; example: string; requiredFields: string[]; optionalFields: string[] }> = {
  orders: {
    required: "quantity, sku, location, pincode",
    optional: "order_id, warehouse, date, customer, product (optional)",
    example: "12 | SKU-123 | Mumbai | 400001",
    requiredFields: ["quantity", "sku", "location", "pincode"],
    optionalFields: ["order_id", "warehouse", "date", "customer", "product"],
  },
  inventory: {
    required: "sku, quantity, location",
    optional: "warehouse, date, product, minstock, maxstock (optional)",
    example: "SKU-123 | 100 | Mumbai",
    requiredFields: ["sku", "quantity", "location"],
    optionalFields: ["warehouse", "date", "product", "minstock", "maxstock"],
  },
  shipments: {
    required: "order_id, sku, from, to, status",
    optional: "warehouse, date, tracking_number (optional)",
    example: "ORD-001 | SKU-123 | Mumbai | Delhi | pending",
    requiredFields: ["order_id", "sku", "from", "to", "status"],
    optionalFields: ["warehouse", "date", "tracking_number"],
  },
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
  maxstock: ["maxstock", "max_stock", "maximum_stock"],
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

export function CsvUploadWithMapping() {
  const [step, setStep] = useState<Step>("upload");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataType, setDataType] = useState<DataType>("orders");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const requiredFields = csvGuide[dataType].requiredFields;
  const optionalFields = csvGuide[dataType].optionalFields;
  const allFields = useMemo(() => [...requiredFields, ...optionalFields], [requiredFields, optionalFields]);

  const resetUploadState = () => {
    setCsvData([]);
    setHeaders([]);
    setMapping({});
    setMissingColumns([]);
    setUploadMessage(null);
    setUploadedFileName("");
    setError(null);
    setStep("upload");
  };

  const handleDataTypeChange = (value: DataType) => {
    setDataType(value);
    setCsvData([]);
    setHeaders([]);
    setMapping({});
    setMissingColumns([]);
    setUploadMessage(null);
    setUploadedFileName("");
    setError(null);
    setStep("upload");
  };

  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      setUploadMessage(null);
      setUploadedFileName(file.name);
      const userId = getCurrentUser();

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/upload?dataType=${dataType}`, {
        method: "POST",
        headers: { "x-user-id": userId },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok && !result?.provided) {
        setError(result.error || result.message || "Upload failed");
        return;
      }

      const uploadedHeaders = result.headers || result.provided || [];
      const suggestedMapping = getSuggestedMapping(uploadedHeaders, allFields);

      setCsvData(result.data || []);
      setHeaders(uploadedHeaders);
      setMissingColumns(result.missing || []);
      setMapping(suggestedMapping);
      setUploadMessage(result.message || null);
      setStep(result.needsMapping ? "mapping" : "upload");
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStoreData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = getCurrentUser();

      const response = await fetch(`${API_BASE_URL}/api/upload/map-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ csvData, dataType, mapping, sourceName: uploadedFileName }),
      });

      const result = await response.json();

      if (result.success) {
        setStep("complete");
      } else {
        setError(result.details ? `${result.error}: ${result.details}` : (result.error || "Failed to store data"));
      }
    } catch (err: any) {
      setError(err.message || "Failed to store data");
    } finally {
      setLoading(false);
    }
  };

  const mappedRequiredCount = requiredFields.filter((field) => mapping[field]).length;
  const unmappedRequired = requiredFields.filter((field) => !mapping[field]);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Upload CSV Data</CardTitle>
      </CardHeader>
      <CardContent>
        {step !== "complete" && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">Select Data Type *</label>
              <select
                value={dataType}
                onChange={(e) => handleDataTypeChange(e.target.value as DataType)}
                className="w-full rounded border p-2 bg-white"
              >
                <option value="orders">Orders (Recommended)</option>
                <option value="inventory">Inventory</option>
                <option value="shipments">Shipments</option>
              </select>
            </div>

            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-900">Required Columns</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-red-600">REQUIRED:</span>
                  <br />
                  {csvGuide[dataType].required}
                </div>
                <div className="mt-3">
                  <span className="font-medium text-green-600">OPTIONAL:</span>
                  <br />
                  {csvGuide[dataType].optional}
                </div>
                <div className="mt-3 border-t border-blue-200 pt-3">
                  <span className="font-medium">Example row:</span>
                  <br />
                  <code className="rounded bg-white p-1 text-xs">{csvGuide[dataType].example}</code>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Upload CSV File *</label>
              <div className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition hover:border-gray-400">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="csv-upload"
                  disabled={loading}
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <p className="font-medium text-gray-600">Click to upload CSV</p>
                  <p className="mt-1 text-xs text-gray-400">We will read the columns and ask for mapping if needed.</p>
                </label>
              </div>
            </div>

            {headers.length > 0 && (
              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">CSV Analysis</h3>
                  <span className="text-xs text-gray-500">{csvData.length} rows</span>
                </div>
                <p className="text-sm text-gray-700">
                  Actual CSV columns: <span className="font-medium">{headers.join(", ")}</span>
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  Missing required columns:{" "}
                  <span className="font-medium">{missingColumns.length > 0 ? missingColumns.join(", ") : "None"}</span>
                </p>
                {uploadMessage && <p className="mt-2 text-sm text-amber-700">{uploadMessage}</p>}
              </div>
            )}

            {step === "mapping" && (
              <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-amber-900">Map CSV Columns</h3>
                    <p className="text-sm text-amber-800">
                      Match your CSV columns with the required fields before import.
                    </p>
                  </div>
                  <span className="text-xs text-amber-700">
                    {mappedRequiredCount}/{requiredFields.length} required mapped
                  </span>
                </div>

                {requiredFields.map((field) => (
                  <div key={field} className="grid gap-2 md:grid-cols-[180px_1fr] md:items-center">
                    <label className="text-sm font-medium text-gray-800">{field}</label>
                    <select
                      value={mapping[field] || ""}
                      onChange={(e) => setMapping((current) => ({ ...current, [field]: e.target.value }))}
                      className="w-full rounded border bg-white p-2 text-sm"
                    >
                      <option value="">Select CSV column</option>
                      {headers.map((header) => (
                        <option key={`${field}-${header}`} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                {optionalFields.length > 0 && (
                  <div className="border-t border-amber-200 pt-4">
                    <p className="mb-3 text-sm font-medium text-gray-800">Optional mappings</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {optionalFields.map((field) => (
                        <div key={field} className="grid gap-2">
                          <label className="text-sm text-gray-700">{field}</label>
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
                )}

                {unmappedRequired.length > 0 && (
                  <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    Required fields still not mapped: {unmappedRequired.join(", ")}
                  </div>
                )}
              </div>
            )}

            {csvData.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">Preview</h3>
                  <span className="text-xs text-gray-500">{csvData.length} rows</span>
                </div>
                <div className="max-h-40 overflow-y-auto rounded border bg-gray-50 p-3 font-mono text-xs">
                  {csvData.slice(0, 3).map((row, idx) => (
                    <div key={idx} className="truncate border-b py-1 last:border-b-0">
                      {JSON.stringify(row).substring(0, 180)}...
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            )}

            {csvData.length > 0 && (
              <div className="flex gap-3">
                <Button
                  onClick={handleStoreData}
                  disabled={loading || unmappedRequired.length > 0}
                  className="flex-1"
                >
                  {loading ? "Storing..." : `Store ${dataType.toUpperCase()} Data`}
                </Button>
                <Button onClick={resetUploadState} variant="outline">
                  Clear
                </Button>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
              <p className="mb-2 font-medium">How it works:</p>
              <ul className="list-inside list-disc space-y-1">
                <li>Upload your CSV file</li>
                <li>We show the actual CSV columns and any missing required fields</li>
                <li>You map CSV columns to the required schema if needed</li>
                <li>Mapped data is validated and stored</li>
              </ul>
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="py-8 text-center">
            <div className="mb-4 text-5xl">Success</div>
            <p className="mb-2 text-lg font-semibold text-green-600">CSV imported successfully</p>
            <p className="mb-6 text-sm text-gray-600">Your {dataType} data has been stored and mapped.</p>
            <Button onClick={resetUploadState}>Upload Another File</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
