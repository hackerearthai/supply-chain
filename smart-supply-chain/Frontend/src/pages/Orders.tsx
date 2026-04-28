import { useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/services/api";

interface OrderFormData {
  user: string;
  order_id: string;
  product_id: string;
  quantity: number;
  payment: string;
  warehouse: string;
  location: string;
}

const Orders = () => {
  const [formData, setFormData] = useState<OrderFormData>({
    user: "",
    order_id: "",
    product_id: "",
    quantity: 1,
    payment: "",
    warehouse: "",
    location: "",
  });
  const [warehouses, setWarehouses] = useState<Array<{ warehouse_name: string }>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getWarehouses().then(setWarehouses).catch((err) => setError(err.message || "Failed to load warehouses."));
  }, []);

  const handleChange = (field: keyof OrderFormData, value: string | number) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      await api.createOrder(formData);
      setMessage("Order created successfully.");
      setFormData({ user: "", order_id: "", product_id: "", quantity: 1, payment: "", warehouse: "", location: "" });
    } catch (err: any) {
      setError(err?.message || "Failed to create order.");
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Orders"
        title="New Order"
        description="Create an order with a validated warehouse and product assignment."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Order ID</label>
                <Input
                  value={formData.order_id}
                  onChange={(event) => handleChange("order_id", event.target.value)}
                  placeholder="ORD-12345"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">User</label>
                <Input
                  value={formData.user}
                  onChange={(event) => handleChange("user", event.target.value)}
                  placeholder="Customer name"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Product SKU</label>
                <Input
                  value={formData.product_id}
                  onChange={(event) => handleChange("product_id", event.target.value)}
                  placeholder="SKU-1001"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Quantity</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(event) => handleChange("quantity", Number(event.target.value))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Warehouse</label>
                <Select value={formData.warehouse} onValueChange={(value) => handleChange("warehouse", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.warehouse_name} value={warehouse.warehouse_name}>
                        {warehouse.warehouse_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Location</label>
                <Input
                  value={formData.location}
                  onChange={(event) => handleChange("location", event.target.value)}
                  placeholder="Delivery city"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Payment method</label>
              <Input
                value={formData.payment}
                onChange={(event) => handleChange("payment", event.target.value)}
                placeholder="Credit card / COD"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-medium">Warehouse selection is enforced.</p>
                <p>Orders only submit when an existing warehouse is selected.</p>
              </div>
              <Button type="submit" onClick={handleSubmit}>
                Submit order
              </Button>
            </div>

            {message && <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">{message}</p>}
            {error && <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive-foreground">{error}</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Orders guidance</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Use the warehouse dropdown to avoid unsupported warehouse names. The system validates each order against the backend before insertion and updates inventory automatically.
          </p>
          <div className="mt-6 grid gap-3 rounded-2xl border border-dashed border-border/60 bg-muted p-4 text-sm text-muted-foreground">
            <p>Required fields: order_id, user, product_id, quantity, warehouse.</p>
            <p>All orders are stored in MongoDB and reflected in inventory.</p>
            <p>Invalid warehouse names are rejected by the backend.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Orders;
