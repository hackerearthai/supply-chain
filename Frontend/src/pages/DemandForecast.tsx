import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/services/api";

interface SuggestedSku {
  sku: string;
  totalQuantity: number;
  latestOrderDate?: string;
}

const DemandForecast = () => {
  const [sku, setSku] = useState("");
  const [totalProduction, setTotalProduction] = useState(0);
  const [allocationResults, setAllocationResults] = useState<any[]>([]);
  const [skuSuggestions, setSkuSuggestions] = useState<SuggestedSku[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingAlloc, setLoadingAlloc] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        setLoadingSuggestions(true);
        const suggestions = await api.getDemandForecastSkus(sku);
        setSkuSuggestions(suggestions ?? []);
      } catch {
        setSkuSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    loadSuggestions();
  }, [sku]);

  const handleAllocate = async () => {
    if (!sku.trim() || totalProduction <= 0) {
      setError("Please enter a SKU and valid production quantity");
      return;
    }

    setLoadingAlloc(true);
    setError(null);

    try {
      const result = await api.allocateStock({ sku, totalProduction });
      if (result.success) {
        setAllocationResults(result.results || []);
      } else {
        setAllocationResults([]);
        setError(result.error || "Allocation failed");
      }
    } catch (err: any) {
      setAllocationResults([]);
      setError(err?.message || "Allocation failed");
    } finally {
      setLoadingAlloc(false);
    }
  };

  const selectedSkuSummary = useMemo(
    () => skuSuggestions.find((item) => item.sku === sku.toLowerCase().trim()) || null,
    [sku, skuSuggestions]
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Planning"
        title="Demand Forecast"
        description="See how much stock of one SKU should be sent to each warehouse based on orders."
      />

      <Card>
        <CardHeader>
          <CardTitle>SKU Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <label className="mb-2 block text-sm font-medium">SKU Code</label>
              <Input
                value={sku}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Search available SKU"
                list="available-skus"
              />
              <datalist id="available-skus">
                {skuSuggestions.map((item) => (
                  <option key={item.sku} value={item.sku} />
                ))}
              </datalist>
              {showSuggestions && (
                <div className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
                  {loadingSuggestions && (
                    <div className="p-3 text-sm text-muted-foreground">Loading SKU suggestions...</div>
                  )}
                  {!loadingSuggestions && skuSuggestions.length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground">No matching SKUs found.</div>
                  )}
                  {!loadingSuggestions &&
                    skuSuggestions.map((item) => (
                      <button
                        key={item.sku}
                        type="button"
                        className="flex w-full items-center justify-between border-b border-border/50 px-3 py-3 text-left text-sm last:border-b-0 hover:bg-muted"
                        onMouseDown={() => {
                          setSku(item.sku);
                          setShowSuggestions(false);
                        }}
                      >
                        <span className="font-medium">{item.sku}</span>
                        <span className="text-muted-foreground">{item.totalQuantity} ordered</span>
                      </button>
                    ))}
                </div>
              )}
              {!showSuggestions && skuSuggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {skuSuggestions.slice(0, 8).map((item) => (
                    <button
                      key={item.sku}
                      type="button"
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                      onClick={() => setSku(item.sku)}
                    >
                      {item.sku}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Total Production Quantity</label>
              <Input
                type="number"
                value={totalProduction}
                onChange={(e) => setTotalProduction(Number(e.target.value))}
                placeholder="10000"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedSkuSummary
                ? `Current order demand for ${selectedSkuSummary.sku}: ${selectedSkuSummary.totalQuantity} units`
                : "Choose a SKU to calculate how much stock should go to each warehouse."}
            </div>
            <Button onClick={handleAllocate} disabled={loadingAlloc}>
              {loadingAlloc ? "Calculating..." : "Calculate Allocation"}
            </Button>
          </div>

          {error && <div className="mt-4 text-sm text-red-500">{error}</div>}
        </CardContent>
      </Card>

      {allocationResults.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Warehouse Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {allocationResults.map((result, index) => (
              <div key={index} className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="text-xl font-semibold">{result.sku}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Total customer demand: {result.total_quantity} units</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {result.allocation.map((alloc: any, i: number) => (
                    <div key={i} className="rounded-2xl border border-border/70 bg-background p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">{alloc.warehouse}</p>
                          <p className="text-sm text-muted-foreground">
                            Warehouse location: {alloc.warehouse_location} · {alloc.pincode}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Allocated stock</p>
                          <p className="text-xl font-semibold">{alloc.allocated_stock}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-muted/40 p-3">
                          <p className="text-muted-foreground">Demand quantity</p>
                          <p className="mt-1 font-semibold">{alloc.demand_quantity}</p>
                        </div>
                        <div className="rounded-xl bg-muted/40 p-3">
                          <p className="text-muted-foreground">Demand ratio</p>
                          <p className="mt-1 font-semibold">{(alloc.demand_ratio * 100).toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium">Orders served from this warehouse</p>
                        <div className="space-y-2">
                          {(alloc.served_locations || []).map((location: any, idx: number) => (
                            <div
                              key={`${location.location}-${location.pincode}-${idx}`}
                              className="flex items-center justify-between rounded-xl border border-border/50 px-3 py-2 text-sm"
                            >
                              <span>
                                {location.location} ({location.pincode})
                              </span>
                              <span className="text-muted-foreground">{location.demand_quantity} units</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DemandForecast;
